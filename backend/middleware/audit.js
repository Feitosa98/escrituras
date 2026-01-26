const AuditLog = require('../models/AuditLog');

async function auditLog(req, acao, tabela, registroId, dadosAnteriores, dadosNovos) {
    try {
        await AuditLog.create({
            user_id: req.user?.id || null,
            acao,
            tabela,
            registro_id: registroId,
            dados_anteriores: dadosAnteriores,
            dados_novos: dadosNovos,
            ip_address: req.ip || req.connection.remoteAddress
        });
    } catch (error) {
        console.error('Erro ao registrar log de auditoria:', error);
    }
}

module.exports = { auditLog };
