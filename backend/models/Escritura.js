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
        return db.prepare('SELECT * FROM escrituras WHERE id = ?').get(id);
    }

    static findByUuid(uuid) {
        return db.prepare('SELECT * FROM escrituras WHERE uuid = ?').get(uuid);
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

        const stmt = db.prepare(`
      INSERT INTO escrituras (
        uuid, tipo, selagem, livro, folha, outorgante, outorgado,
        escrevente, tipo_livro, mes, ano, observacao, created_by, integrity_hash
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

        const result = stmt.run(
            uuid,
            data.tipo,
            data.selagem || null,
            data.livro,
            data.folha,
            data.outorgante,
            data.outorgado || null,
            data.escrevente,
            data.tipoLivro,
            data.mes,
            data.ano,
            data.observacao || null,
            userId,
            integrityHash
        );

        return this.findById(result.lastInsertRowid);
    }

    static update(id, data, userId) {
        const integrityHash = this.calculateIntegrityHash(data);

        const stmt = db.prepare(`
      UPDATE escrituras SET
        tipo = ?, selagem = ?, livro = ?, folha = ?, outorgante = ?,
        outorgado = ?, escrevente = ?, tipo_livro = ?, mes = ?, ano = ?,
        observacao = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP, integrity_hash = ?
      WHERE id = ?
    `);

        stmt.run(
            data.tipo,
            data.selagem || null,
            data.livro,
            data.folha,
            data.outorgante,
            data.outorgado || null,
            data.escrevente,
            data.tipoLivro,
            data.mes,
            data.ano,
            data.observacao || null,
            userId,
            integrityHash,
            id
        );

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
