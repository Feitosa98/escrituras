const db = require('../database');
const crypto = require('crypto');

class Escritura {
    // Calcular hash de integridade SHA-256
    static calculateIntegrityHash(data) {
        const criticalFields = {
            tipo: data.tipo,
            selagem: data.selagem,
            livro: data.livro,
            folha: data.folha,
            outorgante: data.outorgante,
            outorgado: data.outorgado,
            email_cliente: data.email_cliente || data.emailCliente,
            escrevente: data.escrevente,
            tipo_livro: data.tipo_livro || data.tipoLivro,
            mes: data.mes,
            ano: data.ano,
            observacao: data.observacao
        };

        return crypto
            .createHash('sha256')
            .update(JSON.stringify(criticalFields))
            .digest('hex');
    }

    // Verificar integridade de um registro
    static verifyIntegrity(escritura) {
        if (!escritura.integrity_hash) {
            return { valid: false, reason: 'NO_HASH' };
        }

        const calculatedHash = this.calculateIntegrityHash(escritura);
        const valid = calculatedHash === escritura.integrity_hash;

        return {
            valid,
            reason: valid ? null : 'HASH_MISMATCH',
            storedHash: escritura.integrity_hash,
            calculatedHash
        };
    }
    static generateSenha() {
        const letras = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
        const numeros = '23456789';
        const bytesL = crypto.randomBytes(4);
        const bytesN = crypto.randomBytes(4);
        let l = '';
        let n = '';
        for (let i = 0; i < 4; i++) {
            l += letras[bytesL[i] % letras.length];
            n += numeros[bytesN[i] % numeros.length];
        }
        return `${l}${n}`;
    }

    static generateProtocolo(id, ano) {
        const numPadded = String(id).padStart(5, '0');
        return `PROT-${ano}-${numPadded}`;
    }

    static getTrackingPrefix(data) {
        const explicit = String(data.tipoAcompanhamento || data.tipo_acompanhamento || '').toUpperCase();
        if (['PP', 'EPTT', 'EPDV'].includes(explicit)) return explicit;
        return String(data.tipo || '').toLowerCase().includes('procura') ? 'PP' : 'EPTT';
    }

    static generateAcompanhamento(prefix, date = new Date()) {
        const parts = new Intl.DateTimeFormat('en-CA', {
            timeZone: process.env.APP_TIMEZONE || 'America/Manaus',
            year: 'numeric', month: '2-digit'
        }).formatToParts(date);
        const year = parts.find((part) => part.type === 'year').value;
        const month = parts.find((part) => part.type === 'month').value;
        const base = `${prefix}${year}${month}`;
        const last = db.prepare(`
            SELECT acompanhamento_codigo
              FROM escrituras
             WHERE acompanhamento_codigo LIKE ?
             ORDER BY acompanhamento_codigo DESC
             LIMIT 1
        `).get(`${base}%`);
        const sequence = last ? Number(last.acompanhamento_codigo.slice(base.length)) + 1 : 0;
        return `${base}${String(sequence).padStart(3, '0')}`;
    }

    static findByAcompanhamento(codigo, senha) {
        const escritura = db.prepare(
            `SELECT id, protocolo, protocolo_data, acompanhamento_codigo, tipo_acompanhamento,
                    tipo, livro, folha, outorgante, outorgado,
                    escrevente, mes, ano, status, selagem, observacao, created_at, updated_at
             FROM escrituras
             WHERE acompanhamento_codigo = ? AND senha_cliente = ? AND gera_acompanhamento = 1`
        ).get(codigo, senha);

        if (!escritura) return null;

        // Buscar histórico de movimentações (sem dados internos)
        const historico = db.prepare(
            `SELECT wh.status_anterior, wh.status_novo, wh.observacao, wh.created_at,
                    u.nome as atualizado_por
             FROM workflow_history wh
             LEFT JOIN users u ON wh.created_by = u.id
             WHERE wh.escritura_id = ?
             ORDER BY wh.created_at DESC`
        ).all(escritura.id);

        return { ...escritura, historico };
    }

    static findAll(filters = {}) {
        let query = `SELECT e.*, responsavel.nome AS responsavel_nome
            FROM escrituras e
            LEFT JOIN users responsavel ON responsavel.id = e.responsavel_id
            WHERE 1=1`;
        const params = [];

        if (filters.arquivadas === 'somente') query += ' AND e.archived_at IS NOT NULL';
        else if (filters.arquivadas !== 'todas') query += ' AND e.archived_at IS NULL';

        if (filters.tipo) {
            query += ' AND e.tipo = ?';
            params.push(filters.tipo);
        }
        if (filters.escrevente) {
            query += ' AND e.escrevente = ?';
            params.push(filters.escrevente);
        }
        if (filters.ano) {
            query += ' AND e.ano = ?';
            params.push(filters.ano);
        }
        if (filters.livro) {
            query += ' AND e.livro = ?';
            params.push(filters.livro);
        }
        if (filters.dataInicio) {
            query += ' AND e.selagem >= ?';
            params.push(filters.dataInicio);
        }
        if (filters.dataFim) {
            query += ' AND e.selagem <= ?';
            params.push(filters.dataFim);
        }
        if (filters.busca) {
            query += ' AND (e.tipo LIKE ? OR e.outorgante LIKE ? OR e.outorgado LIKE ? OR e.livro LIKE ? OR e.folha LIKE ? OR e.protocolo LIKE ?)';
            const searchTerm = `%${filters.busca}%`;
            params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
        }

        query += ' ORDER BY e.created_at DESC';
        if (filters.limit) {
            query += ' LIMIT ? OFFSET ?';
            params.push(filters.limit, filters.offset || 0);
        }

        return db.prepare(query).all(...params);
    }

    static countAll(filters = {}) {
        let query = 'SELECT COUNT(*) AS total FROM escrituras e WHERE 1=1';
        const params = [];
        if (filters.arquivadas === 'somente') query += ' AND e.archived_at IS NOT NULL';
        else if (filters.arquivadas !== 'todas') query += ' AND e.archived_at IS NULL';
        if (filters.tipo) { query += ' AND e.tipo = ?'; params.push(filters.tipo); }
        if (filters.escrevente) { query += ' AND e.escrevente = ?'; params.push(filters.escrevente); }
        if (filters.ano) { query += ' AND e.ano = ?'; params.push(filters.ano); }
        if (filters.livro) { query += ' AND e.livro = ?'; params.push(filters.livro); }
        if (filters.dataInicio) { query += ' AND e.selagem >= ?'; params.push(filters.dataInicio); }
        if (filters.dataFim) { query += ' AND e.selagem <= ?'; params.push(filters.dataFim); }
        if (filters.busca) {
            query += ' AND (e.tipo LIKE ? OR e.outorgante LIKE ? OR e.outorgado LIKE ? OR e.livro LIKE ? OR e.folha LIKE ? OR e.protocolo LIKE ?)';
            const term = `%${filters.busca}%`;
            params.push(term, term, term, term, term, term);
        }
        return Number(db.prepare(query).get(...params).total || 0);
    }

    static findById(id) {
        const escritura = db.prepare(`
            SELECT e.*, criador.nome AS usuario_fez, responsavel.nome AS responsavel_nome
              FROM escrituras e
              LEFT JOIN users criador ON criador.id = e.created_by
              LEFT JOIN users responsavel ON responsavel.id = e.responsavel_id
             WHERE e.id = ?
        `).get(id);
        return this.withSigners(escritura);
    }

    static findByUuid(uuid) {
        const escritura = db.prepare(`
            SELECT e.*, criador.nome AS usuario_fez, responsavel.nome AS responsavel_nome
              FROM escrituras e
              LEFT JOIN users criador ON criador.id = e.created_by
              LEFT JOIN users responsavel ON responsavel.id = e.responsavel_id
             WHERE e.uuid = ?
        `).get(uuid);
        return this.withSigners(escritura);
    }

    static withSigners(escritura) {
        if (!escritura) return escritura;
        try {
            const assinantes = db.prepare(`
                SELECT u.nome, a.timestamp
                  FROM assinaturas_digitais a
                  JOIN users u ON u.id = a.user_id
                 WHERE a.escritura_id = ?
                 ORDER BY a.timestamp DESC
            `).all(escritura.id);
            return {
                ...escritura,
                usuarios_assinaram: assinantes.map((item) => item.nome),
                usuario_assinou: assinantes.map((item) => item.nome).join(', ')
            };
        } catch {
            return { ...escritura, usuarios_assinaram: [], usuario_assinou: null };
        }
    }

    static findByIdOrUuid(identifier) {
        // Tentar como UUID primeiro (formato: 8-4-4-4-12)
        if (identifier.includes('-')) {
            return this.findByUuid(identifier);
        }
        // Caso contrário, tratar como ID numérico
        return this.findById(identifier);
    }

    static findByLivroFolha(livro, folha) {
        return db.prepare('SELECT * FROM escrituras WHERE livro = ? AND folha = ?').get(livro, folha);
    }

    static create(data, userId) {
        const uuid = crypto.randomUUID();
        const integrityHash = this.calculateIntegrityHash(data);
        const senhaCliente = this.generateSenha();
        const ano = data.ano || new Date().getFullYear();
        const trackingPrefix = this.getTrackingPrefix(data);
        const isProcuracao = trackingPrefix === 'PP';
        const geraAcompanhamento = isProcuracao
            ? Boolean(data.geraAcompanhamento ?? data.gera_acompanhamento)
            : true;
        const acompanhamentoCodigo = geraAcompanhamento
            ? this.generateAcompanhamento(trackingPrefix)
            : null;
        const protocoloData = new Intl.DateTimeFormat('en-CA', {
            timeZone: process.env.APP_TIMEZONE || 'America/Manaus',
            year: 'numeric', month: '2-digit', day: '2-digit'
        }).format(new Date());

        const stmt = db.prepare(`
      INSERT INTO escrituras (
        uuid, tipo, selagem, livro, folha, outorgante, outorgado, email_cliente,
        escrevente, tipo_livro, mes, ano, observacao, created_by, integrity_hash,
        status, prazo_dias, valor_receita, senha_cliente, acompanhamento_codigo,
        tipo_acompanhamento, gera_acompanhamento, protocolo_data, responsavel_id, prazo_data
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

        const result = stmt.run(
            uuid,
            data.tipo,
            data.selagem || null,
            data.livro,
            data.folha,
            data.outorgante,
            data.outorgado || null,
            data.emailCliente || data.email_cliente || null,
            data.escrevente,
            data.tipoLivro,
            data.mes,
            data.ano,
            data.observacao || null,
            userId,
            integrityHash,
            data.status || 'Abertura de protocolo',
            data.prazo_dias || 0,
            data.valor_receita || 0.0,
            geraAcompanhamento ? senhaCliente : null,
            acompanhamentoCodigo,
            trackingPrefix,
            geraAcompanhamento ? 1 : 0,
            protocoloData,
            data.responsavelId || data.responsavel_id || userId,
            data.prazoData || data.prazo_data || null
        );

        const newId = result.lastInsertRowid;
        const protocolo = this.generateProtocolo(newId, ano);

        // Atualizar o protocolo agora que temos o ID
        db.prepare(`UPDATE escrituras SET protocolo = ? WHERE id = ?`).run(protocolo, newId);

        if ((data.status || 'Abertura de protocolo') !== 'Concluído') {
            require('../migrate_operacao_diaria').ensureDefaultChecklist(newId, userId);
        }

        return this.findById(newId);
    }

    static update(id, data, userId) {
        const current = this.findById(id);
        if (!current) return null;
        const integrityHash = this.calculateIntegrityHash(data);

        const stmt = db.prepare(`
      UPDATE escrituras SET
        tipo = ?, selagem = ?, livro = ?, folha = ?, outorgante = ?,
        outorgado = ?, email_cliente = ?, escrevente = ?, tipo_livro = ?, mes = ?, ano = ?,
        observacao = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP, integrity_hash = ?,
        status = ?, prazo_dias = ?, valor_receita = ?
      WHERE id = ?
    `);

        stmt.run(
            data.tipo,
            data.selagem || null,
            data.livro,
            data.folha,
            data.outorgante,
            data.outorgado || null,
            data.emailCliente || data.email_cliente || current.email_cliente || null,
            data.escrevente,
            data.tipoLivro,
            data.mes,
            data.ano,
            data.observacao || null,
            userId,
            integrityHash,
            data.status || current.status || 'Abertura de protocolo',
            data.prazo_dias || 0,
            data.valor_receita || 0.0,
            id
        );

        return this.findById(id);
    }

    static updateStatus(id, status, observacao, userId) {
        const escritura = this.findById(id);
        if (!escritura) return null;

        const statusAnterior = escritura.status;

        const stmt = db.prepare(`
          UPDATE escrituras 
          SET status = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP 
          WHERE id = ?
        `);
        stmt.run(status, userId, id);

        // Record history
        db.prepare(`
          INSERT INTO workflow_history (escritura_id, status_anterior, status_novo, observacao, created_by)
          VALUES (?, ?, ?, ?, ?)
        `).run(id, statusAnterior, status, observacao || null, userId);

        return this.findById(id);
    }

    static updateOperation(id, data, userId) {
        const current = this.findById(id);
        if (!current) return null;
        const newStatus = data.status || current.status;
        const responsavelId = data.responsavel_id === '' || data.responsavel_id === null
            ? null
            : (data.responsavel_id || current.responsavel_id || null);
        const prazoData = data.prazo_data === '' ? null : (data.prazo_data || current.prazo_data || null);
        const responsavel = responsavelId
            ? db.prepare('SELECT nome FROM users WHERE id = ?').get(responsavelId)
            : null;

        db.prepare(`
            UPDATE escrituras
               SET status = ?, responsavel_id = ?, prazo_data = ?, escrevente = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP
             WHERE id = ?
        `).run(newStatus, responsavelId, prazoData, responsavel?.nome || current.escrevente, userId, id);

        if (newStatus !== current.status) {
            db.prepare(`
                INSERT INTO workflow_history (escritura_id, status_anterior, status_novo, observacao, created_by)
                VALUES (?, ?, ?, ?, ?)
            `).run(id, current.status, newStatus, data.observacao || null, userId);
        }
        return this.findById(id);
    }

    static archive(id, userId) {
        return db.prepare(`UPDATE escrituras SET archived_at = CURRENT_TIMESTAMP, archived_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(userId, id);
    }

    static restore(id, userId) {
        return db.prepare(`UPDATE escrituras SET archived_at = NULL, archived_by = NULL, updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(userId, id);
    }

    static getChecklist(id) {
        return db.prepare(`
            SELECT c.*, u.nome AS concluido_por
              FROM checklist_items c
              LEFT JOIN users u ON u.id = c.concluido_by
             WHERE c.escritura_id = ?
             ORDER BY c.ordem, c.id
        `).all(id);
    }

    static addChecklistItem(id, titulo, userId) {
        const order = db.prepare('SELECT COALESCE(MAX(ordem), 0) + 1 AS proxima FROM checklist_items WHERE escritura_id = ?').get(id).proxima;
        const result = db.prepare(`INSERT INTO checklist_items (escritura_id, titulo, ordem, created_by) VALUES (?, ?, ?, ?)`).run(id, titulo, order, userId);
        return db.prepare('SELECT * FROM checklist_items WHERE id = ?').get(result.lastInsertRowid);
    }

    static toggleChecklistItem(id, itemId, concluido, userId) {
        db.prepare(`
            UPDATE checklist_items
               SET concluido = ?, concluido_by = ?, concluido_at = ?, updated_at = CURRENT_TIMESTAMP
             WHERE id = ? AND escritura_id = ?
        `).run(concluido ? 1 : 0, concluido ? userId : null, concluido ? new Date().toISOString() : null, itemId, id);
        return db.prepare('SELECT * FROM checklist_items WHERE id = ? AND escritura_id = ?').get(itemId, id);
    }

    static removeChecklistItem(id, itemId) {
        return db.prepare('DELETE FROM checklist_items WHERE id = ? AND escritura_id = ?').run(itemId, id);
    }

    static getMeuTrabalho(user, hoje) {
        const atos = db.prepare(`
            SELECT e.*, responsavel.nome AS responsavel_nome,
                   (SELECT COUNT(*) FROM checklist_items c WHERE c.escritura_id = e.id) AS checklist_total,
                   (SELECT COUNT(*) FROM checklist_items c WHERE c.escritura_id = e.id AND c.concluido = 1) AS checklist_concluido
              FROM escrituras e
              LEFT JOIN users responsavel ON responsavel.id = e.responsavel_id
             WHERE e.archived_at IS NULL
               AND e.status <> 'Concluído'
               AND (e.responsavel_id = ? OR (e.responsavel_id IS NULL AND e.escrevente = ?))
             ORDER BY CASE WHEN e.prazo_data IS NULL THEN 1 ELSE 0 END, e.prazo_data, e.updated_at DESC
        `).all(user.id, user.nome);
        const tarefas = db.prepare(`
            SELECT a.*, e.protocolo, e.tipo, e.outorgante
              FROM agendamentos a
              LEFT JOIN escrituras e ON e.id = a.escritura_id
             WHERE a.user_id = ? AND a.concluido = 0 AND (e.archived_at IS NULL OR e.id IS NULL)
             ORDER BY a.data_agendada
        `).all(user.id);
        return {
            hoje,
            atos,
            tarefas,
            resumo: {
                atos: atos.length,
                atrasados: atos.filter((item) => item.prazo_data && String(item.prazo_data).slice(0, 10) < hoje).length,
                vencemHoje: atos.filter((item) => String(item.prazo_data || '').slice(0, 10) === hoje).length,
                aguardandoCliente: atos.filter((item) => item.status === 'Aguardando cliente').length,
                tarefasHoje: tarefas.filter((item) => String(item.data_agendada || '').slice(0, 10) === hoje).length,
            }
        };
    }

    static delete(id) {
        const stmt = db.prepare('DELETE FROM escrituras WHERE id = ?');
        return stmt.run(id);
    }

    static count(filters = {}) {
        let query = 'SELECT COUNT(*) as total FROM escrituras WHERE archived_at IS NULL';
        const params = [];

        if (filters.tipo) {
            query += ' AND tipo = ?';
            params.push(filters.tipo);
        }
        if (filters.ano) {
            query += ' AND ano = ?';
            params.push(filters.ano);
        }

        return db.prepare(query).get(...params).total;
    }

    static getStats() {
        const total = db.prepare('SELECT COUNT(*) as total FROM escrituras WHERE archived_at IS NULL').get().total;

        const recentes = db.prepare('SELECT * FROM escrituras WHERE archived_at IS NULL ORDER BY created_at DESC LIMIT 10').all();

        const porTipo = db.prepare(`
      SELECT tipo, COUNT(*) as count 
      FROM escrituras WHERE archived_at IS NULL
      GROUP BY tipo 
      ORDER BY count DESC
    `).all();

        const porEscrevente = db.prepare(`
      SELECT escrevente, COUNT(*) as count 
      FROM escrituras WHERE archived_at IS NULL
      GROUP BY escrevente 
      ORDER BY count DESC
    `).all();

        const porMes = db.prepare(`
      SELECT mes || '/' || ano as periodo, COUNT(*) as count 
      FROM escrituras WHERE archived_at IS NULL
      GROUP BY ano, mes 
      ORDER BY ano, mes
    `).all();

        return {
            total,
            recentes,
            porTipo: Object.fromEntries(porTipo.map(r => [r.tipo, r.count])),
            porEscrevente: Object.fromEntries(porEscrevente.map(r => [r.escrevente, r.count])),
            porMes: Object.fromEntries(porMes.map(r => [r.periodo, r.count]))
        };
    }
}

module.exports = Escritura;
