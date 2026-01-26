const AuditLog = require('../models/AuditLog');

async function getAll(req, res) {
    try {
        const filters = {
            user_id: req.query.user_id,
            acao: req.query.acao,
            tabela: req.query.tabela,
            dataInicio: req.query.dataInicio,
            dataFim: req.query.dataFim
        };

        const logs = AuditLog.findAll(filters);
        res.json(logs);
    } catch (error) {
        console.error('Erro ao listar logs:', error);
        res.status(500).json({ error: 'Erro ao listar logs de auditoria' });
    }
}

async function getById(req, res) {
    try {
        const log = AuditLog.findById(req.params.id);

        if (!log) {
            return res.status(404).json({ error: 'Log não encontrado' });
        }

        res.json(log);
    } catch (error) {
        console.error('Erro ao buscar log:', error);
        res.status(500).json({ error: 'Erro ao buscar log' });
    }
}

module.exports = {
    getAll,
    getById
};
