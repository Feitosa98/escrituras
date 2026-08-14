const db = require('../database');

class User {
    static findAll() {
        return db.prepare('SELECT id, nome, username, email, role, ativo, access_start, access_end, created_at FROM users ORDER BY nome').all();
    }

    static findById(id) {
        return db.prepare('SELECT id, nome, username, email, role, ativo, access_start, access_end, created_at FROM users WHERE id = ?').get(id);
    }

    static findByEmail(email) {
        return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    }

    static findByUsername(username) {
        return db.prepare('SELECT * FROM users WHERE username = ? COLLATE NOCASE').get(username);
    }

    static create(data) {
        const stmt = db.prepare(`
      INSERT INTO users (nome, username, email, senha_hash, role, ativo, access_start, access_end)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

        const result = stmt.run(
            data.nome,
            data.username,
            data.email,
            data.senha_hash,
            data.role || 'visualizador',
            data.ativo !== undefined ? data.ativo : 1,
            data.access_start || '07:50',
            data.access_end || '18:30'
        );

        return this.findById(result.lastInsertRowid);
    }

    static update(id, data) {
        const fields = [];
        const values = [];

        if (data.nome) {
            fields.push('nome = ?');
            values.push(data.nome);
        }
        if (data.email) {
            fields.push('email = ?');
            values.push(data.email);
        }
        if (data.username) {
            fields.push('username = ?');
            values.push(data.username);
        }
        if (data.senha_hash) {
            fields.push('senha_hash = ?');
            values.push(data.senha_hash);
        }
        if (data.role) {
            fields.push('role = ?');
            values.push(data.role);
        }
        if (data.ativo !== undefined) {
            fields.push('ativo = ?');
            values.push(data.ativo);
        }
        if (data.access_start) {
            fields.push('access_start = ?');
            values.push(data.access_start);
        }
        if (data.access_end) {
            fields.push('access_end = ?');
            values.push(data.access_end);
        }

        fields.push('updated_at = CURRENT_TIMESTAMP');
        values.push(id);

        const stmt = db.prepare(`
      UPDATE users SET ${fields.join(', ')} WHERE id = ?
    `);

        stmt.run(...values);
        return this.findById(id);
    }

    static delete(id) {
        const stmt = db.prepare('DELETE FROM users WHERE id = ?');
        return stmt.run(id);
    }

    static count() {
        return db.prepare('SELECT COUNT(*) as total FROM users').get().total;
    }
}

module.exports = User;
