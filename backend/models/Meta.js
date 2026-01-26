const db = require('../database');

class Meta {
    // Criar ou atualizar meta mensal
    static setMetaMensal(mes, ano, metaTotal, metasIndividuais = []) {
        try {
            return db.transaction(() => {
                // Verificar se já existe meta para este mês
                const existing = db.prepare('SELECT id FROM metas_mensais WHERE mes = ? AND ano = ?').get(mes, ano);

                let metaMensalId;

                if (existing) {
                    // Atualizar meta existente
                    db.prepare('UPDATE metas_mensais SET meta_total = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
                        .run(metaTotal, existing.id);
                    metaMensalId = existing.id;

                    // Deletar metas individuais antigas
                    db.prepare('DELETE FROM metas_individuais WHERE meta_mensal_id = ?').run(metaMensalId);
                } else {
                    // Criar nova meta
                    const result = db.prepare('INSERT INTO metas_mensais (mes, ano, meta_total) VALUES (?, ?, ?)')
                        .run(mes, ano, metaTotal);
                    metaMensalId = result.lastInsertRowid;
                }

                // Inserir metas individuais
                if (metasIndividuais.length > 0) {
                    const stmt = db.prepare('INSERT INTO metas_individuais (meta_mensal_id, user_id, meta_quantidade) VALUES (?, ?, ?)');
                    for (const meta of metasIndividuais) {
                        stmt.run(metaMensalId, meta.userId, meta.quantidade);
                    }
                }

                return this.getMetaMensal(mes, ano);
            })();
        } catch (error) {
            throw new Error(`Erro ao definir meta: ${error.message}`);
        }
    }

    // Buscar meta mensal
    static getMetaMensal(mes, ano) {
        const meta = db.prepare(`
            SELECT * FROM metas_mensais 
            WHERE mes = ? AND ano = ?
        `).get(mes, ano);

        if (!meta) return null;

        // Buscar metas individuais
        const metasIndividuais = db.prepare(`
            SELECT 
                mi.*,
                u.nome as user_nome,
                u.email as user_email
            FROM metas_individuais mi
            JOIN users u ON mi.user_id = u.id
            WHERE mi.meta_mensal_id = ?
        `).all(meta.id);

        return {
            ...meta,
            metas_individuais: metasIndividuais
        };
    }

    // Buscar meta individual de um usuário
    static getMetaIndividual(userId, mes, ano) {
        const meta = db.prepare(`
            SELECT mi.* 
            FROM metas_individuais mi
            JOIN metas_mensais mm ON mi.meta_mensal_id = mm.id
            WHERE mi.user_id = ? AND mm.mes = ? AND mm.ano = ?
        `).get(userId, mes, ano);

        return meta;
    }

    // Calcular produção individual
    static getProducaoIndividual(userId, mes, ano) {
        // Buscar meta individual
        const meta = this.getMetaIndividual(userId, mes, ano);

        // Contar escrituras criadas pelo usuário no mês
        const producao = db.prepare(`
            SELECT COUNT(*) as total
            FROM escrituras
            WHERE created_by = ? AND mes = ? AND ano = ?
        `).get(userId, mes, ano);

        const total = producao?.total || 0;
        const metaQuantidade = meta?.meta_quantidade || 0;
        const percentual = metaQuantidade > 0 ? (total / metaQuantidade) * 100 : 0;

        // Buscar produção do mês anterior
        const mesAnterior = mes === '01' ? '12' : String(parseInt(mes) - 1).padStart(2, '0');
        const anoAnterior = mes === '01' ? ano - 1 : ano;

        const producaoAnterior = db.prepare(`
            SELECT COUNT(*) as total
            FROM escrituras
            WHERE created_by = ? AND mes = ? AND ano = ?
        `).get(userId, mesAnterior, anoAnterior);

        const totalAnterior = producaoAnterior?.total || 0;
        const variacao = totalAnterior > 0 ? ((total - totalAnterior) / totalAnterior) * 100 : 0;

        return {
            userId,
            mes,
            ano,
            meta: metaQuantidade,
            producao: total,
            percentual: Math.round(percentual * 10) / 10,
            status: percentual >= 100 ? 'superou' : percentual >= 80 ? 'atingiu' : 'abaixo',
            producaoAnterior: totalAnterior,
            variacao: Math.round(variacao * 10) / 10
        };
    }

    // Calcular produção da equipe
    static getProducaoEquipe(mes, ano) {
        // Buscar meta mensal
        const metaMensal = this.getMetaMensal(mes, ano);

        // Contar total de escrituras do mês
        const producao = db.prepare(`
            SELECT COUNT(*) as total
            FROM escrituras
            WHERE mes = ? AND ano = ?
        `).get(mes, ano);

        const total = producao?.total || 0;
        const metaTotal = metaMensal?.meta_total || 0;
        const percentual = metaTotal > 0 ? (total / metaTotal) * 100 : 0;

        // Contar usuários ativos
        const totalUsuarios = db.prepare('SELECT COUNT(*) as total FROM users WHERE ativo = 1').get().total;
        const mediaPorPessoa = totalUsuarios > 0 ? total / totalUsuarios : 0;

        // Distribuição por tipo
        const porTipo = db.prepare(`
            SELECT tipo, COUNT(*) as quantidade
            FROM escrituras
            WHERE mes = ? AND ano = ?
            GROUP BY tipo
            ORDER BY quantidade DESC
        `).all(mes, ano);

        // Distribuição por escrevente
        const porEscrevente = db.prepare(`
            SELECT escrevente, COUNT(*) as quantidade
            FROM escrituras
            WHERE mes = ? AND ano = ?
            GROUP BY escrevente
            ORDER BY quantidade DESC
        `).all(mes, ano);

        // Produção do mês anterior
        const mesAnterior = mes === '01' ? '12' : String(parseInt(mes) - 1).padStart(2, '0');
        const anoAnterior = mes === '01' ? ano - 1 : ano;

        const producaoAnterior = db.prepare(`
            SELECT COUNT(*) as total
            FROM escrituras
            WHERE mes = ? AND ano = ?
        `).get(mesAnterior, anoAnterior);

        const totalAnterior = producaoAnterior?.total || 0;
        const variacao = totalAnterior > 0 ? ((total - totalAnterior) / totalAnterior) * 100 : 0;

        return {
            mes,
            ano,
            meta: metaTotal,
            producao: total,
            percentual: Math.round(percentual * 10) / 10,
            status: percentual >= 100 ? 'superou' : percentual >= 80 ? 'atingiu' : 'abaixo',
            mediaPorPessoa: Math.round(mediaPorPessoa * 10) / 10,
            distribuicaoPorTipo: porTipo,
            distribuicaoPorEscrevente: porEscrevente,
            producaoAnterior: totalAnterior,
            variacao: Math.round(variacao * 10) / 10
        };
    }

    // Ranking de produtividade
    static getRanking(mes, ano) {
        const ranking = db.prepare(`
            SELECT 
                u.id,
                u.nome,
                u.email,
                COUNT(e.id) as producao,
                mi.meta_quantidade as meta
            FROM users u
            LEFT JOIN escrituras e ON u.id = e.created_by AND e.mes = ? AND e.ano = ?
            LEFT JOIN metas_individuais mi ON u.id = mi.user_id
            LEFT JOIN metas_mensais mm ON mi.meta_mensal_id = mm.id AND mm.mes = ? AND mm.ano = ?
            WHERE u.ativo = 1
            GROUP BY u.id
            ORDER BY producao DESC
        `).all(mes, ano, mes, ano);

        return ranking.map(r => ({
            ...r,
            percentual: r.meta > 0 ? Math.round((r.producao / r.meta) * 1000) / 10 : 0
        }));
    }

    // Projeção de fim de mês
    static getProjecao(mes, ano) {
        const now = new Date();
        const diaAtual = now.getDate();
        const diasNoMes = new Date(ano, parseInt(mes), 0).getDate();

        // Só calcular projeção se estiver no mês atual
        if (mes !== String(now.getMonth() + 1).padStart(2, '0') || ano !== now.getFullYear()) {
            return null;
        }

        const producao = db.prepare(`
            SELECT COUNT(*) as total
            FROM escrituras
            WHERE mes = ? AND ano = ?
        `).get(mes, ano);

        const total = producao?.total || 0;
        const projecao = diaAtual > 0 ? Math.round((total / diaAtual) * diasNoMes) : 0;

        return {
            diaAtual,
            diasNoMes,
            producaoAtual: total,
            projecaoFimMes: projecao
        };
    }
}

module.exports = Meta;
