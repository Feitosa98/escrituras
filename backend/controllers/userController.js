const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { auditLog } = require('../middleware/audit');

async function getAll(req, res) {
    try {
        const users = User.findAll();
        res.json(users);
    } catch (error) {
        console.error('Erro ao listar usuários:', error);
        res.status(500).json({ error: 'Erro ao listar usuários' });
    }
}

async function getById(req, res) {
    try {
        const user = User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        res.json(user);
    } catch (error) {
        console.error('Erro ao buscar usuário:', error);
        res.status(500).json({ error: 'Erro ao buscar usuário' });
    }
}

async function create(req, res) {
    try {
        const { nome, email, senha, role } = req.body;

        if (!nome || !email || !senha) {
            return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
        }

        // Verificar se email já existe
        const existente = User.findByEmail(email);
        if (existente) {
            return res.status(400).json({ error: 'Email já cadastrado' });
        }

        // Hash da senha
        const senha_hash = await bcrypt.hash(senha, 10);

        const user = User.create({
            nome,
            email,
            senha_hash,
            role: role || 'visualizador'
        });

        // Audit log
        await auditLog(req, 'CREATE', 'users', user.id, null, { nome, email, role });

        res.status(201).json(user);
    } catch (error) {
        console.error('Erro ao criar usuário:', error);
        res.status(500).json({ error: 'Erro ao criar usuário' });
    }
}

async function update(req, res) {
    try {
        const { id } = req.params;
        const { nome, email, senha, role, ativo } = req.body;

        const userAntigo = User.findById(id);
        if (!userAntigo) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        const updateData = {};

        if (nome) updateData.nome = nome;
        if (email) updateData.email = email;
        if (role) updateData.role = role;
        if (ativo !== undefined) updateData.ativo = ativo;

        if (senha) {
            updateData.senha_hash = await bcrypt.hash(senha, 10);
        }

        const user = User.update(id, updateData);

        // Audit log
        await auditLog(req, 'UPDATE', 'users', id, userAntigo, user);

        res.json(user);
    } catch (error) {
        console.error('Erro ao atualizar usuário:', error);
        res.status(500).json({ error: 'Erro ao atualizar usuário' });
    }
}

async function remove(req, res) {
    try {
        const { id } = req.params;

        // Não permitir deletar o próprio usuário
        if (parseInt(id) === req.user.id) {
            return res.status(400).json({ error: 'Não é possível deletar seu próprio usuário' });
        }

        const user = User.findById(id);
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        User.delete(id);

        // Audit log
        await auditLog(req, 'DELETE', 'users', id, user, null);

        res.json({ message: 'Usuário deletado com sucesso' });
    } catch (error) {
        console.error('Erro ao deletar usuário:', error);
        res.status(500).json({ error: 'Erro ao deletar usuário' });
    }
}

module.exports = {
    getAll,
    getById,
    create,
    update,
    remove
};
