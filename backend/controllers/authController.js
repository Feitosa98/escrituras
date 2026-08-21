const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const { auditLog } = require('../middleware/audit');

async function login(req, res) {
    try {
        const { usuario, senha } = req.body;
        const loginInformado = usuario;

        // Validação de entrada
        if (!loginInformado || !senha) {
            return res.status(400).json({ error: 'Usuário e senha são obrigatórios' });
        }

        // Validar formato de email
        if (typeof loginInformado !== 'string' || typeof senha !== 'string') {
            return res.status(400).json({ error: 'Formato inválido de credenciais' });
        }
        if (loginInformado.length > 100 || senha.length > 256) {
            return res.status(400).json({ error: 'Formato inválido de credenciais' });
        }

        const loginNormalizado = loginInformado.trim().toLowerCase();
        if (!/^[a-z0-9]+\.[a-z0-9]+$/.test(loginNormalizado)) {
            return res.status(400).json({ error: 'Use o usuário no formato nome.sobrenome' });
        }

        const user = User.findByUsername(loginNormalizado);

        if (!user) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        if (!user.ativo) {
            return res.status(401).json({ error: 'Usuário inativo' });
        }

        const nowParts = new Intl.DateTimeFormat('pt-BR', {
            timeZone: process.env.APP_TIMEZONE || 'America/Manaus',
            hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
        }).formatToParts(new Date());
        const hour = Number(nowParts.find((part) => part.type === 'hour')?.value || 0);
        const minute = Number(nowParts.find((part) => part.type === 'minute')?.value || 0);
        const currentMinutes = hour * 60 + minute;
        const toMinutes = (time) => {
            const [h, m] = String(time || '').split(':').map(Number);
            return h * 60 + m;
        };
        const start = toMinutes(user.access_start || '07:50');
        const end = toMinutes(user.access_end || '18:30');
        const allowed = start <= end
            ? currentMinutes >= start && currentMinutes <= end
            : currentMinutes >= start || currentMinutes <= end;

        if (!allowed) {
            return res.status(403).json({
                error: `Acesso permitido somente das ${user.access_start} às ${user.access_end}`
            });
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
            { username: user.username }
        );

        // Remover senha do retorno
        delete user.senha_hash;

        res.json({
            token,
            user: {
                id: user.id,
                nome: user.nome,
                username: user.username,
                email: user.email,
                role: user.role,
                access_start: user.access_start,
                access_end: user.access_end
            }
        });
    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ error: 'Erro ao fazer login' });
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
