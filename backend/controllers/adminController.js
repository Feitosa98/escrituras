const db = require('../database');
const { auditLog } = require('../middleware/audit');

// === TIPOS DE ESCRITURA ===

function getTipos(req, res) {
    try {
        const tipos = db.prepare('SELECT * FROM tipos_escritura ORDER BY nome ASC').all();
        res.json(tipos);
    } catch (error) {
        console.error('Erro ao buscar tipos:', error);
        res.status(500).json({ error: 'Erro ao buscar tipos de escritura' });
    }
}

async function createTipo(req, res) {
    try {
        const { nome } = req.body;

        if (!nome) return res.status(400).json({ error: 'Nome é obrigatório' });

        const stmt = db.prepare('INSERT INTO tipos_escritura (nome) VALUES (?)');
        const result = stmt.run(nome.trim().toUpperCase());

        const novoTipo = db.prepare('SELECT * FROM tipos_escritura WHERE id = ?').get(result.lastInsertRowid);

        await auditLog(req, 'CREATE', 'tipos_escritura', novoTipo.id, null, novoTipo);

        res.status(201).json(novoTipo);
    } catch (error) {
        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            return res.status(400).json({ error: 'Tipo já cadastrado' });
        }
        res.status(500).json({ error: 'Erro ao criar tipo' });
    }
}

async function updateTipo(req, res) {
    try {
        const { id } = req.params;
        const { nome, ativo } = req.body;

        const atual = db.prepare('SELECT * FROM tipos_escritura WHERE id = ?').get(id);
        if (!atual) return res.status(404).json({ error: 'Tipo não encontrado' });

        const stmt = db.prepare('UPDATE tipos_escritura SET nome = ?, ativo = ? WHERE id = ?');
        stmt.run(nome || atual.nome, ativo !== undefined ? ativo : atual.ativo, id);

        const novo = db.prepare('SELECT * FROM tipos_escritura WHERE id = ?').get(id);

        await auditLog(req, 'UPDATE', 'tipos_escritura', id, atual, novo);

        res.json(novo);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar tipo' });
    }
}

// === ESCREVENTES ===

function getEscreventes(req, res) {
    try {
        // Trazer também o nome do usuário vinculado se houver
        const query = `
            SELECT e.*, u.nome as usuario_vinculado 
            FROM escreventes e 
            LEFT JOIN users u ON e.user_id = u.id 
            ORDER BY e.nome ASC
        `;
        const escreventes = db.prepare(query).all();
        res.json(escreventes);
    } catch (error) {
        console.error('Erro ao buscar escreventes:', error);
        res.status(500).json({ error: 'Erro ao buscar escreventes' });
    }
}

async function createEscrevente(req, res) {
    try {
        const { nome, user_id } = req.body;

        if (!nome) return res.status(400).json({ error: 'Nome é obrigatório' });

        const stmt = db.prepare('INSERT INTO escreventes (nome, user_id) VALUES (?, ?)');
        const result = stmt.run(nome.trim().toUpperCase(), user_id || null);

        const novo = db.prepare('SELECT * FROM escreventes WHERE id = ?').get(result.lastInsertRowid);

        await auditLog(req, 'CREATE', 'escreventes', novo.id, null, novo);

        res.status(201).json(novo);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao criar escrevente' });
    }
}

async function updateEscrevente(req, res) {
    try {
        const { id } = req.params;
        const { nome, user_id, ativo } = req.body;

        const atual = db.prepare('SELECT * FROM escreventes WHERE id = ?').get(id);
        if (!atual) return res.status(404).json({ error: 'Escrevente não encontrado' });

        const stmt = db.prepare('UPDATE escreventes SET nome = ?, user_id = ?, ativo = ? WHERE id = ?');
        stmt.run(
            nome || atual.nome,
            user_id !== undefined ? user_id : atual.user_id,
            ativo !== undefined ? ativo : atual.ativo,
            id
        );

        const novo = db.prepare('SELECT * FROM escreventes WHERE id = ?').get(id);

        await auditLog(req, 'UPDATE', 'escreventes', id, atual, novo);

        res.json(novo);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar escrevente' });
    }
}

module.exports = {
    getTipos,
    createTipo,
    updateTipo,
    getEscreventes,
    createEscrevente,
    updateEscrevente
};
