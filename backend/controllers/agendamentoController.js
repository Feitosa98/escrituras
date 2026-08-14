const Agendamento = require('../models/Agendamento');
const { auditLog } = require('../middleware/audit');

async function getAll(req, res) {
    try {
        const filters = {
            escritura_id: req.query.escritura_id,
            user_id: req.query.user_id,
            data_agendada: req.query.data_agendada,
            mes: req.query.mes,
            ano: req.query.ano,
            concluido: req.query.concluido
        };
        const list = Agendamento.findAll(filters);
        res.json(list);
    } catch (error) {
        console.error('Erro ao listar agendamentos:', error);
        res.status(500).json({ error: 'Erro ao listar agendamentos' });
    }
}

async function getById(req, res) {
    try {
        const item = Agendamento.findById(req.params.id);
        if (!item) return res.status(404).json({ error: 'Agendamento não encontrado' });
        res.json(item);
    } catch (error) {
        console.error('Erro ao buscar agendamento:', error);
        res.status(500).json({ error: 'Erro ao buscar agendamento' });
    }
}

async function create(req, res) {
    try {
        const { titulo, data_agendada } = req.body;
        if (!titulo || !data_agendada) {
            return res.status(400).json({ error: 'Título e data do agendamento são obrigatórios' });
        }
        const item = Agendamento.create(req.body, req.user.id);
        await auditLog(req, 'CREATE', 'agendamentos', item.id, null, item);
        res.status(201).json(item);
    } catch (error) {
        console.error('Erro ao criar agendamento:', error);
        res.status(500).json({ error: 'Erro ao criar agendamento' });
    }
}

async function update(req, res) {
    try {
        const anterior = Agendamento.findById(req.params.id);
        if (!anterior) return res.status(404).json({ error: 'Agendamento não encontrado' });

        const item = Agendamento.update(req.params.id, req.body);
        await auditLog(req, 'UPDATE', 'agendamentos', item.id, anterior, item);
        res.json(item);
    } catch (error) {
        console.error('Erro ao atualizar agendamento:', error);
        res.status(500).json({ error: 'Erro ao atualizar agendamento' });
    }
}

async function remove(req, res) {
    try {
        const anterior = Agendamento.findById(req.params.id);
        if (!anterior) return res.status(404).json({ error: 'Agendamento não encontrado' });

        Agendamento.delete(req.params.id);
        await auditLog(req, 'DELETE', 'agendamentos', req.params.id, anterior, null);
        res.status(204).send();
    } catch (error) {
        console.error('Erro ao excluir agendamento:', error);
        res.status(500).json({ error: 'Erro ao excluir agendamento' });
    }
}

module.exports = {
    getAll,
    getById,
    create,
    update,
    remove
};
