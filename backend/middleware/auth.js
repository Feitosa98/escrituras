const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'development'
    ? 'sua-chave-secreta-super-segura-aqui-2026'
    : null);

if (!JWT_SECRET) {
    throw new Error('JWT_SECRET deve ser configurada em produção');
}
const JWT_EXPIRES_IN = '8h';

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: 'Token não fornecido' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Token inválido ou expirado' });
        }

        try {
            const db = require('../database');
            const currentUser = db.prepare(`
                SELECT ativo, role, access_start, access_end, updated_at FROM users WHERE id = ?
            `).get(user.id);
            if (!currentUser?.ativo) {
                return res.status(401).json({ error: 'Usuário inativo' });
            }
            const updatedAtSeconds = Math.floor(new Date(currentUser.updated_at).getTime() / 1000);
            if (Number.isFinite(updatedAtSeconds) && user.iat && updatedAtSeconds > user.iat) {
                return res.status(401).json({ error: 'Sessão expirada após alteração da conta' });
            }

            const time = new Intl.DateTimeFormat('pt-BR', {
                timeZone: process.env.APP_TIMEZONE || 'America/Manaus',
                hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
            }).formatToParts(new Date());
            const current = Number(time.find((part) => part.type === 'hour')?.value || 0) * 60
                + Number(time.find((part) => part.type === 'minute')?.value || 0);
            const minutes = (value) => {
                const [hour, minute] = String(value).split(':').map(Number);
                return hour * 60 + minute;
            };
            const start = minutes(currentUser.access_start || '07:50');
            const end = minutes(currentUser.access_end || '18:30');
            const allowed = start <= end ? current >= start && current <= end : current >= start || current <= end;
            if (!allowed) {
                return res.status(403).json({
                    error: `Acesso permitido somente das ${currentUser.access_start} às ${currentUser.access_end}`
                });
            }

            req.user = { ...user, role: currentUser.role };
            next();
        } catch (error) {
            return res.status(500).json({ error: 'Não foi possível validar o horário de acesso' });
        }
    });
}

function generateToken(user) {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            nome: user.nome,
            role: user.role
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
}

module.exports = {
    authenticateToken,
    generateToken,
    JWT_SECRET
};
