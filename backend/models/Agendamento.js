const db = require('../database');

class Agendamento {
    static create(data, createdBy) {
        const stmt = db.prepare(`
            INSERT INTO agendamentos (escritura_id, user_id, titulo, descricao, data_agendada, created_by)
            VALUES (?, ?, ?, ?, ?, ?)
        `);
        const res = stmt.run(
            data.escritura_id || null,
            data.user_id || createdBy,
            data.titulo,
            data.descricao || null,
            data.data_agendada,
            createdBy
        );
        return this.findById(res.lastInsertRowid);
    }

    static findById(id) {
        return db.prepare(`
            SELECT a.*, 
                   u.nome as responsavel_nome, u.email as responsavel_email,
                   e.protocolo as escritura_protocolo, e.tipo as escritura_tipo, e.outorgante as escritura_outorgante
            FROM agendamentos a
            LEFT JOIN users u ON a.user_id = u.id
            LEFT JOIN escrituras e ON a.escritura_id = e.id
            WHERE a.id = ?
        `).get(id);
    }

    static findAll(filters = {}) {
        let query = `
            SELECT a.*, 
                   u.nome as responsavel_nome, u.email as responsavel_email,
                   e.protocolo as escritura_protocolo, e.tipo as escritura_tipo, e.outorgante as escritura_outorgante
            FROM agendamentos a
            LEFT JOIN users u ON a.user_id = u.id
            LEFT JOIN escrituras e ON a.escritura_id = e.id
            WHERE 1=1
        `;
        const params = [];

        if (filters.escritura_id) {
            query += ' AND a.escritura_id = ?';
            params.push(filters.escritura_id);
        }
        if (filters.user_id) {
            query += ' AND a.user_id = ?';
            params.push(filters.user_id);
        }
        if (filters.data_agendada) {
            // Busca por data (YYYY-MM-DD ou prefixo)
            query += ' AND a.data_agendada LIKE ?';
            params.push(`${filters.data_agendada}%`);
        }
        if (filters.mes && filters.ano) {
            const mesStr = String(filters.mes).padStart(2, '0');
            query += " AND strftime('%Y-%m', a.data_agendada) = ?";
            params.push(`${filters.ano}-${mesStr}`);
        } else if (filters.ano) {
            query += " AND strftime('%Y', a.data_agendada) = ?";
            params.push(String(filters.ano));
        }
        if (filters.concluido !== undefined && filters.concluido !== '') {
            query += ' AND a.concluido = ?';
            params.push(Number(filters.concluido));
        }

        query += ' ORDER BY a.data_agendada ASC, a.concluido ASC, a.id DESC';
        return db.prepare(query).all(...params);
    }

    static update(id, data) {
        const current = this.findById(id);
        if (!current) return null;

        const stmt = db.prepare(`
            UPDATE agendamentos
            SET titulo = ?, descricao = ?, data_agendada = ?, concluido = ?, user_id = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `);
        stmt.run(
            data.titulo !== undefined ? data.titulo : current.titulo,
            data.descricao !== undefined ? data.descricao : current.descricao,
            data.data_agendada !== undefined ? data.data_agendada : current.data_agendada,
            data.concluido !== undefined ? Number(data.concluido) : current.concluido,
            data.user_id !== undefined ? data.user_id : current.user_id,
            id
        );
        return this.findById(id);
    }

    static delete(id) {
        return db.prepare('DELETE FROM agendamentos WHERE id = ?').run(id);
    }
}

module.exports = Agendamento;
