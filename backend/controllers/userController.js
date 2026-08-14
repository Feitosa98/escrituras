const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { auditLog } = require('../middleware/audit');

function normalizeUsername(value) {
    return String(value || '')
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .toLowerCase().trim().replace(/[^a-z0-9.]+/g, '');
}

function usernameFromName(nome) {
    const parts = String(nome || '').trim().split(/\s+/).filter(Boolean);
    const clean = (value) => normalizeUsername(value).replaceAll('.', '');
    return `${clean(parts[0])}.${clean(parts.at(-1) || 'usuario')}`;
}

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
        const { nome, email, senha, role, access_start, access_end } = req.body;
        const username = normalizeUsername(req.body.username) || usernameFromName(nome);

        if (!nome || !senha) {
            return res.status(400).json({ error: 'Nome e senha são obrigatórios' });
        }

        if (!/^[a-z0-9]+\.[a-z0-9]+$/.test(username)) {
            return res.status(400).json({ error: 'O usuário deve seguir o formato nome.sobrenome' });
        }

        if (User.findByUsername(username)) {
            return res.status(400).json({ error: 'Nome de usuário já cadastrado' });
        }

        const emailFinal = String(email || `${username}@sistema.local`).trim().toLowerCase();

        // Verificar se email já existe
        const existente = User.findByEmail(emailFinal);
        if (existente) {
            return res.status(400).json({ error: 'Email já cadastrado' });
        }

        // Hash da senha
        const senha_hash = await bcrypt.hash(senha, 10);

        const user = User.create({
            nome,
            username,
            email: emailFinal,
            senha_hash,
            role: role || 'visualizador',
            access_start: access_start || '07:50',
            access_end: access_end || '18:30'
        });

        // Audit log
        await auditLog(req, 'CREATE', 'users', user.id, null, { nome, username, role, access_start, access_end });

        res.status(201).json(user);
    } catch (error) {
        console.error('Erro ao criar usuário:', error);
        res.status(500).json({ error: 'Erro ao criar usuário' });
    }
}

async function update(req, res) {
    try {
        const { id } = req.params;
        const { nome, email, senha, role, ativo, access_start, access_end } = req.body;

        const userAntigo = User.findById(id);
        if (!userAntigo) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        const updateData = {};

        if (nome) updateData.nome = nome;
        if (email) updateData.email = email;
        if (req.body.username) {
            const username = normalizeUsername(req.body.username);
            const existente = User.findByUsername(username);
            if (existente && existente.id !== Number(id)) {
                return res.status(400).json({ error: 'Nome de usuário já cadastrado' });
            }
            updateData.username = username;
        }
        if (role) updateData.role = role;
        if (ativo !== undefined) updateData.ativo = ativo;
        if (access_start) updateData.access_start = access_start;
        if (access_end) updateData.access_end = access_end;

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
