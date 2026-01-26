const db = require('../database');

class AuditLog {
    static create(data) {
        const stmt = db.prepare(`
      INSERT INTO audit_logs (user_id, acao, tabela, registro_id, dados_anteriores, dados_novos, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

        return stmt.run(
            data.user_id,
            data.acao,
            data.tabela || null,
            data.registro_id || null,
            data.dados_anteriores ? JSON.stringify(data.dados_anteriores) : null,
            data.dados_novos ? JSON.stringify(data.dados_novos) : null,
            data.ip_address || null
        );
    }

    static findAll(filters = {}) {
        let query = `
      SELECT 
        al.*,
        u.nome as usuario_nome,
        u.email as usuario_email
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE 1=1
    `;
        const params = [];

        if (filters.user_id) {
            query += ' AND al.user_id = ?';
            params.push(filters.user_id);
        }
        if (filters.acao) {
            query += ' AND al.acao = ?';
            params.push(filters.acao);
        }
        if (filters.tabela) {
            query += ' AND al.tabela = ?';
            params.push(filters.tabela);
        }
        if (filters.dataInicio) {
            query += ' AND al.created_at >= ?';
            params.push(filters.dataInicio);
        }
        if (filters.dataFim) {
            query += ' AND al.created_at <= ?';
            params.push(filters.dataFim);
        }

        query += ' ORDER BY al.created_at DESC LIMIT 1000';

        const logs = db.prepare(query).all(...params);

        // Parse JSON fields
        return logs.map(log => ({
            ...log,
            dados_anteriores: log.dados_anteriores ? JSON.parse(log.dados_anteriores) : null,
            dados_novos: log.dados_novos ? JSON.parse(log.dados_novos) : null
        }));
    }

    static findById(id) {
        const log = db.prepare('SELECT * FROM audit_logs WHERE id = ?').get(id);
        if (log) {
            log.dados_anteriores = log.dados_anteriores ? JSON.parse(log.dados_anteriores) : null;
            log.dados_novos = log.dados_novos ? JSON.parse(log.dados_novos) : null;
        }
        return log;
    }

    static count() {
        return db.prepare('SELECT COUNT(*) as total FROM audit_logs').get().total;
    }
}

module.exports = AuditLog;
