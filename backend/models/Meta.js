const db = require('../database');

function normalizeQuarter(value) {
    const normalized = String(value || '').trim().toUpperCase();
    if (/^T[1-4]$/.test(normalized)) return normalized;
    const month = Number(normalized);
    if (month >= 1 && month <= 12) return `T${Math.ceil(month / 3)}`;
    throw new Error('Trimestre inválido');
}

function quarterMonths(quarter) {
    const number = Number(normalizeQuarter(quarter).slice(1));
    const start = (number - 1) * 3 + 1;
    return [start, start + 1, start + 2].map((month) => String(month).padStart(2, '0'));
}

function previousQuarter(quarter, year) {
    const number = Number(normalizeQuarter(quarter).slice(1));
    return number === 1 ? ['T4', Number(year) - 1] : [`T${number - 1}`, Number(year)];
}

class Meta {
    static setMetaMensal(trimestre, ano, metaTotal, metasIndividuais = []) {
        const quarter = normalizeQuarter(trimestre);
        try {
            return db.transaction(() => {
                const existing = db.prepare('SELECT id FROM metas_mensais WHERE mes = ? AND ano = ?').get(quarter, ano);
                let metaId;
                if (existing) {
                    db.prepare('UPDATE metas_mensais SET meta_total = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(metaTotal, existing.id);
                    metaId = existing.id;
                    db.prepare('DELETE FROM metas_individuais WHERE meta_mensal_id = ?').run(metaId);
                } else {
                    const result = db.prepare('INSERT INTO metas_mensais (mes, ano, meta_total) VALUES (?, ?, ?)').run(quarter, ano, metaTotal);
                    metaId = result.lastInsertRowid;
                }
                const insert = db.prepare('INSERT INTO metas_individuais (meta_mensal_id, user_id, meta_quantidade) VALUES (?, ?, ?)');
                for (const meta of metasIndividuais) insert.run(metaId, meta.userId, meta.quantidade);
                return this.getMetaMensal(quarter, ano);
            })();
        } catch (error) {
            throw new Error(`Erro ao definir meta trimestral: ${error.message}`);
        }
    }

    static getMetaMensal(trimestre, ano) {
        const quarter = normalizeQuarter(trimestre);
        const meta = db.prepare('SELECT * FROM metas_mensais WHERE mes = ? AND ano = ?').get(quarter, ano);
        if (!meta) return null;
        const metasIndividuais = db.prepare(`
            SELECT mi.*, u.nome AS user_nome, u.username AS user_username
            FROM metas_individuais mi JOIN users u ON mi.user_id = u.id
            WHERE mi.meta_mensal_id = ? ORDER BY u.nome
        `).all(meta.id);
        return { ...meta, trimestre: quarter, meses: quarterMonths(quarter), metas_individuais: metasIndividuais };
    }

    static getMetaIndividual(userId, trimestre, ano) {
        return db.prepare(`
            SELECT mi.* FROM metas_individuais mi
            JOIN metas_mensais mm ON mi.meta_mensal_id = mm.id
            WHERE mi.user_id = ? AND mm.mes = ? AND mm.ano = ?
        `).get(userId, normalizeQuarter(trimestre), ano);
    }

    static countIndividual(userId, trimestre, ano) {
        const months = quarterMonths(trimestre);
        return db.prepare(`
            SELECT COUNT(*) AS total FROM escrituras e JOIN users u ON u.id = ?
            WHERE (e.created_by = u.id OR (e.created_by IS NULL AND LOWER(TRIM(e.escrevente)) = LOWER(TRIM(u.nome))))
              AND e.mes IN (?, ?, ?) AND e.ano = ? AND e.archived_at IS NULL
        `).get(userId, ...months, ano)?.total || 0;
    }

    static countTeam(trimestre, ano) {
        return db.prepare(`SELECT COUNT(*) AS total FROM escrituras WHERE mes IN (?, ?, ?) AND ano = ? AND archived_at IS NULL`)
            .get(...quarterMonths(trimestre), ano)?.total || 0;
    }

    static getProducaoIndividual(userId, trimestre, ano) {
        const quarter = normalizeQuarter(trimestre);
        const target = this.getMetaIndividual(userId, quarter, ano)?.meta_quantidade || 0;
        const total = this.countIndividual(userId, quarter, ano);
        const [previous, previousYear] = previousQuarter(quarter, ano);
        const previousTotal = this.countIndividual(userId, previous, previousYear);
        const percentual = target > 0 ? total / target * 100 : 0;
        return {
            userId, trimestre: quarter, meses: quarterMonths(quarter), ano: Number(ano), meta: target, producao: total,
            percentual: Math.round(percentual * 10) / 10,
            status: percentual >= 100 ? 'superou' : percentual >= 80 ? 'atingiu' : 'abaixo',
            producaoAnterior: previousTotal,
            variacao: previousTotal > 0 ? Math.round((total - previousTotal) / previousTotal * 1000) / 10 : 0,
        };
    }

    static getProducaoEquipe(trimestre, ano) {
        const quarter = normalizeQuarter(trimestre);
        const months = quarterMonths(quarter);
        const total = this.countTeam(quarter, ano);
        const target = this.getMetaMensal(quarter, ano)?.meta_total || 0;
        const activeUsers = db.prepare("SELECT COUNT(*) AS total FROM users WHERE ativo = 1 AND role <> 'admin'").get().total;
        const grouped = (column) => db.prepare(`
            SELECT ${column}, COUNT(*) AS quantidade FROM escrituras
            WHERE mes IN (?, ?, ?) AND ano = ? AND archived_at IS NULL
            GROUP BY ${column} ORDER BY quantidade DESC
        `).all(...months, ano);
        const [previous, previousYear] = previousQuarter(quarter, ano);
        const previousTotal = this.countTeam(previous, previousYear);
        const percentual = target > 0 ? total / target * 100 : 0;
        return {
            trimestre: quarter, meses: months, ano: Number(ano), meta: target, producao: total,
            percentual: Math.round(percentual * 10) / 10,
            status: percentual >= 100 ? 'superou' : percentual >= 80 ? 'atingiu' : 'abaixo',
            mediaPorPessoa: Math.round((activeUsers > 0 ? total / activeUsers : 0) * 10) / 10,
            distribuicaoPorTipo: grouped('tipo'), distribuicaoPorEscrevente: grouped('escrevente'),
            producaoAnterior: previousTotal,
            variacao: previousTotal > 0 ? Math.round((total - previousTotal) / previousTotal * 1000) / 10 : 0,
        };
    }

    static getRanking(trimestre, ano) {
        const quarter = normalizeQuarter(trimestre);
        const months = quarterMonths(quarter);
        const ranking = db.prepare(`
            SELECT u.id,u.nome,u.username,COUNT(e.id) AS producao,mi.meta_quantidade AS meta
            FROM users u
            LEFT JOIN escrituras e ON (u.id=e.created_by OR (e.created_by IS NULL AND LOWER(TRIM(e.escrevente))=LOWER(TRIM(u.nome))))
              AND e.mes IN (?, ?, ?) AND e.ano=? AND e.archived_at IS NULL
            LEFT JOIN metas_mensais mm ON mm.mes=? AND mm.ano=?
            LEFT JOIN metas_individuais mi ON u.id=mi.user_id AND mi.meta_mensal_id=mm.id
            WHERE u.ativo=1 AND u.role <> 'admin' GROUP BY u.id,u.nome,u.username,mi.meta_quantidade ORDER BY producao DESC,u.nome
        `).all(...months, ano, quarter, ano);
        return ranking.map((row) => ({ ...row, percentual: row.meta > 0 ? Math.round(row.producao / row.meta * 1000) / 10 : 0 }));
    }

    static getProjecao(trimestre, ano) {
        const quarter = normalizeQuarter(trimestre);
        const now = new Date();
        const number = Number(quarter.slice(1));
        if (number !== Math.ceil((now.getMonth() + 1) / 3) || Number(ano) !== now.getFullYear()) return null;
        const start = new Date(Number(ano), (number - 1) * 3, 1);
        const end = new Date(Number(ano), number * 3, 0);
        const dayMs = 24 * 60 * 60 * 1000;
        const elapsed = Math.floor((new Date(now.getFullYear(), now.getMonth(), now.getDate()) - start) / dayMs) + 1;
        const totalDays = Math.floor((end - start) / dayMs) + 1;
        const total = this.countTeam(quarter, ano);
        return { trimestre: quarter, diasDecorridos: elapsed, diasNoTrimestre: totalDays, producaoAtual: total, projecaoFimTrimestre: elapsed > 0 ? Math.round(total / elapsed * totalDays) : 0 };
    }
}

module.exports = Meta;
