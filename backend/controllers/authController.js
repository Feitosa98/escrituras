const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const { auditLog } = require('../middleware/audit');

async function login(req, res) {
    try {
        const { email, senha } = req.body;

        // Validação de entrada
        if (!email || !senha) {
            return res.status(400).json({ error: 'Email e senha são obrigatórios' });
        }

        // Validar formato de email
        if (typeof email !== 'string' || typeof senha !== 'string') {
            return res.status(400).json({ error: 'Formato inválido de credenciais' });
        }

        const user = User.findByEmail(email.trim());

        if (!user) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        if (!user.ativo) {
            return res.status(401).json({ error: 'Usuário inativo' });
        }

        const senhaValida = await bcrypt.compare(senha, user.senha_hash);

        if (!senhaValida) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        const token = generateToken(user);

        // Registrar login no audit log
        await auditLog(
            { user, ip: req.ip },
            'LOGIN',
            'users',
            user.id,
            null,
            { email: user.email }
        );

        // Remover senha do retorno
        delete user.senha_hash;

        res.json({
            token,
            user: {
                id: user.id,
                nome: user.nome,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ error: 'Erro ao fazer login: ' + error.message });
    }
}

async function me(req, res) {
    try {
        const user = User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        delete user.senha_hash;
        res.json(user);
    } catch (error) {
        console.error('Erro ao buscar usuário:', error);
        res.status(500).json({ error: 'Erro ao buscar dados do usuário' });
    }
}

module.exports = {
    login,
    me
};
