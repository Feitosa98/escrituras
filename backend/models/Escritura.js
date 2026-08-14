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
        let query = 'SELECT * FROM escrituras WHERE 1=1';
        const params = [];

        if (filters.tipo) {
            query += ' AND tipo = ?';
            params.push(filters.tipo);
        }
        if (filters.escrevente) {
            query += ' AND escrevente = ?';
            params.push(filters.escrevente);
        }
        if (filters.ano) {
            query += ' AND ano = ?';
            params.push(filters.ano);
        }
        if (filters.livro) {
            query += ' AND livro = ?';
            params.push(filters.livro);
        }
        if (filters.dataInicio) {
            query += ' AND selagem >= ?';
            params.push(filters.dataInicio);
        }
        if (filters.dataFim) {
            query += ' AND selagem <= ?';
            params.push(filters.dataFim);
        }
        if (filters.busca) {
            query += ' AND (tipo LIKE ? OR outorgante LIKE ? OR outorgado LIKE ? OR livro LIKE ? OR folha LIKE ?)';
            const searchTerm = `%${filters.busca}%`;
            params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
        }

        query += ' ORDER BY created_at DESC';

        return db.prepare(query).all(...params);
    }

    static findById(id) {
        const escritura = db.prepare(`
            SELECT e.*, criador.nome AS usuario_fez
              FROM escrituras e
              LEFT JOIN users criador ON criador.id = e.created_by
             WHERE e.id = ?
        `).get(id);
        return this.withSigners(escritura);
    }

    static findByUuid(uuid) {
        const escritura = db.prepare(`
            SELECT e.*, criador.nome AS usuario_fez
              FROM escrituras e
              LEFT JOIN users criador ON criador.id = e.created_by
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
        tipo_acompanhamento, gera_acompanhamento, protocolo_data
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
            protocoloData
        );

        const newId = result.lastInsertRowid;
        const protocolo = this.generateProtocolo(newId, ano);

        // Atualizar o protocolo agora que temos o ID
        db.prepare(`UPDATE escrituras SET protocolo = ? WHERE id = ?`).run(protocolo, newId);

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

    static delete(id) {
        const stmt = db.prepare('DELETE FROM escrituras WHERE id = ?');
        return stmt.run(id);
    }

    static count(filters = {}) {
        let query = 'SELECT COUNT(*) as total FROM escrituras WHERE 1=1';
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
        const total = db.prepare('SELECT COUNT(*) as total FROM escrituras').get().total;

        const recentes = db.prepare('SELECT * FROM escrituras ORDER BY created_at DESC LIMIT 10').all();

        const porTipo = db.prepare(`
      SELECT tipo, COUNT(*) as count 
      FROM escrituras 
      GROUP BY tipo 
      ORDER BY count DESC
    `).all();

        const porEscrevente = db.prepare(`
      SELECT escrevente, COUNT(*) as count 
      FROM escrituras 
      GROUP BY escrevente 
      ORDER BY count DESC
    `).all();

        const porMes = db.prepare(`
      SELECT mes || '/' || ano as periodo, COUNT(*) as count 
      FROM escrituras 
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
