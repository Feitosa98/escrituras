const AuditLog = require('../models/AuditLog');

const SENSITIVE_KEYS = new Set([
    'senha',
    'password',
    'senha_hash',
    'senha_cliente',
    'private_key_encrypted',
    'token',
    'authorization',
    'assinatura'
]);

function redactSensitive(value) {
    if (Array.isArray(value)) return value.map(redactSensitive);
    if (!value || typeof value !== 'object') return value;
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [
        key,
        SENSITIVE_KEYS.has(key.toLowerCase()) ? '[PROTEGIDO]' : redactSensitive(item)
    ]));
}

async function auditLog(req, acao, tabela, registroId, dadosAnteriores, dadosNovos) {
    try {
        await AuditLog.create({
            user_id: req.user?.id || null,
            acao,
            tabela,
            registro_id: registroId,
            dados_anteriores: redactSensitive(dadosAnteriores),
            dados_novos: redactSensitive(dadosNovos),
            ip_address: req.ip || req.connection.remoteAddress
        });
    } catch (error) {
        console.error('Erro ao registrar log de auditoria:', error);
    }
}

module.exports = { auditLog, redactSensitive };
