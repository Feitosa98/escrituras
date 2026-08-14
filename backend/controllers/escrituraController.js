const Escritura = require('../models/Escritura');
const { auditLog } = require('../middleware/audit');
const { sendEscrituraStatusEmail } = require('../services/emailService');

async function getAll(req, res) {
    try {
        const filters = {
            tipo: req.query.tipo,
            escrevente: req.query.escrevente,
            ano: req.query.ano,
            livro: req.query.livro,
            dataInicio: req.query.dataInicio,
            dataFim: req.query.dataFim,
            busca: req.query.busca
        };

        const escrituras = Escritura.findAll(filters);
        res.json(escrituras);
    } catch (error) {
        console.error('Erro ao listar escrituras:', error);
        res.status(500).json({ error: 'Erro ao listar escrituras' });
    }
}

async function getById(req, res) {
    try {
        const escritura = Escritura.findByIdOrUuid(req.params.id);

        if (!escritura) {
            return res.status(404).json({ error: 'Escritura não encontrada' });
        }

        res.json(escritura);
    } catch (error) {
        console.error('Erro ao buscar escritura:', error);
        res.status(500).json({ error: 'Erro ao buscar escritura' });
    }
}

async function create(req, res) {
    try {
        const { livro, folha } = req.body;
        const emailCliente = String(req.body.emailCliente || req.body.email_cliente || '').trim();
        const tipoAcompanhamento = String(req.body.tipoAcompanhamento || req.body.tipo_acompanhamento || '').toUpperCase();
        const geraAcompanhamento = tipoAcompanhamento === 'PP'
            ? Boolean(req.body.geraAcompanhamento ?? req.body.gera_acompanhamento)
            : true;

        if (emailCliente && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailCliente)) {
            return res.status(400).json({ error: 'Informe um e-mail válido para o cliente' });
        }

        if (geraAcompanhamento && !emailCliente) {
            return res.status(400).json({ error: 'Informe o e-mail do requerente para gerar o acompanhamento' });
        }

        req.body.emailCliente = emailCliente;

        // Verificar duplicata
        const existente = Escritura.findByLivroFolha(livro, folha);
        if (existente) {
            return res.status(400).json({
                error: 'Já existe uma escritura com este Livro e Folha',
                escritura: existente
            });
        }

        const escritura = Escritura.create(req.body, req.user.id);

        // Audit log
        await auditLog(req, 'CREATE', 'escrituras', escritura.id, null, escritura);

        const notificacaoEmail = escritura.gera_acompanhamento
            ? await sendEscrituraStatusEmail(escritura, { includeCredentials: true })
            : { sent: false, reason: 'TRACKING_NOT_REQUESTED' };

        res.status(201).json({ ...escritura, notificacao_email: notificacaoEmail });
    } catch (error) {
        console.error('Erro ao criar escritura:', error);
        res.status(500).json({ error: 'Erro ao criar escritura' });
    }
}

async function update(req, res) {
    try {
        const { id } = req.params;
        const emailCliente = String(req.body.emailCliente || req.body.email_cliente || '').trim();

        if (emailCliente && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailCliente)) {
            return res.status(400).json({ error: 'Informe um e-mail válido para o cliente' });
        }

        req.body.emailCliente = emailCliente;

        const escrituraAntiga = Escritura.findById(id);
        if (!escrituraAntiga) {
            return res.status(404).json({ error: 'Escritura não encontrada' });
        }

        // Verificar duplicata (exceto a própria escritura)
        const { livro, folha } = req.body;
        const existente = Escritura.findByLivroFolha(livro, folha);
        if (existente && existente.id !== parseInt(id)) {
            return res.status(400).json({
                error: 'Já existe uma escritura com este Livro e Folha',
                escritura: existente
            });
        }

        const escritura = Escritura.update(escrituraAntiga.id, req.body, req.user.id);

        // Audit log
        await auditLog(req, 'UPDATE', 'escrituras', escrituraAntiga.id, escrituraAntiga, escritura);

        res.json(escritura);
    } catch (error) {
        console.error('Erro ao atualizar escritura:', error);
        res.status(500).json({ error: 'Erro ao atualizar escritura' });
    }
}

async function remove(req, res) {
    try {
        const { id } = req.params;
        const escritura = Escritura.findByIdOrUuid(id);

        if (!escritura) {
            return res.status(404).json({ error: 'Escritura não encontrada' });
        }

        Escritura.delete(escritura.id);

        // Audit log
        await auditLog(req, 'DELETE', 'escrituras', escritura.id, escritura, null);

        res.json({ message: 'Escritura deletada com sucesso' });
    } catch (error) {
        console.error('Erro ao deletar escritura:', error);
        res.status(500).json({ error: 'Erro ao deletar escritura' });
    }
}

async function updateStatus(req, res) {
    try {
        const { id } = req.params;
        const { status, observacao } = req.body;

        if (!status) {
            return res.status(400).json({ error: 'Status é obrigatório' });
        }

        const escrituraAnterior = Escritura.findById(id);
        if (!escrituraAnterior) {
            return res.status(404).json({ error: 'Escritura não encontrada' });
        }

        const escritura = Escritura.updateStatus(id, status, observacao, req.user.id);

        // Audit log
        await auditLog(req, 'UPDATE_STATUS', 'escrituras', id, escrituraAnterior, escritura);

        const notificacaoEmail = await sendEscrituraStatusEmail(escritura);

        res.json({ ...escritura, notificacao_email: notificacaoEmail });
    } catch (error) {
        console.error('Erro ao atualizar status:', error);
        res.status(500).json({ error: 'Erro ao atualizar status' });
    }
}

async function getStats(req, res) {
    try {
        const stats = Escritura.getStats();
        res.json(stats);
    } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
        res.status(500).json({ error: 'Erro ao buscar estatísticas' });
    }
}

async function atividadeHoje(req, res) {
    try {
        const db = require('../database');
        const hoje = new Intl.DateTimeFormat('en-CA', {
            timeZone: process.env.APP_TIMEZONE || 'America/Manaus',
            year: 'numeric', month: '2-digit', day: '2-digit'
        }).format(new Date());

        // 1. Movimentações de status hoje
        const movimentos = db.prepare(`
            SELECT
                wh.id,
                wh.status_anterior,
                wh.status_novo,
                wh.observacao,
                wh.created_at,
                e.tipo,
                e.livro,
                e.folha,
                e.outorgante,
                e.protocolo,
                u.nome as atualizado_por
            FROM workflow_history wh
            JOIN escrituras e ON e.id = wh.escritura_id
            LEFT JOIN users u ON u.id = wh.created_by
            WHERE DATE(wh.created_at) = ?
            ORDER BY wh.created_at DESC
            LIMIT 50
        `).all(hoje);

        // 2. Escrituras criadas hoje
        const criadas = db.prepare(`
            SELECT
                e.id, e.tipo, e.livro, e.folha, e.outorgante, e.protocolo,
                e.status, e.created_at,
                u.nome as criado_por
            FROM escrituras e
            LEFT JOIN users u ON u.id = e.created_by
            WHERE DATE(e.created_at) = ?
            ORDER BY e.created_at DESC
            LIMIT 20
        `).all(hoje);

        // 3. Totais por status (snapshot atual)
        const porStatus = db.prepare(`
            SELECT status, COUNT(*) as total
            FROM escrituras
            GROUP BY status
            ORDER BY total DESC
        `).all();

        // 4. Contagem de movimentos hoje por usuário
        const porUsuario = db.prepare(`
            SELECT
                u.nome,
                COUNT(*) as total
            FROM workflow_history wh
            LEFT JOIN users u ON u.id = wh.created_by
            WHERE DATE(wh.created_at) = ?
            GROUP BY wh.created_by
            ORDER BY total DESC
        `).all(hoje);

        res.json({
            hoje,
            movimentos,
            criadas,
            porStatus,
            porUsuario,
            totais: {
                movimentos: movimentos.length,
                criadas: criadas.length,
            },
        });
    } catch (error) {
        console.error('Erro ao buscar atividade do dia:', error);
        res.status(500).json({ error: 'Erro ao buscar atividade do dia' });
    }
}

async function importBulk(req, res) {
    try {
        const { escrituras } = req.body;

        if (!Array.isArray(escrituras) || escrituras.length === 0) {
            return res.status(400).json({ error: 'Lista de escrituras inválida ou vazia' });
        }

        const userId = req.user.id;
        let successCount = 0;
        let errorCount = 0;

        // Inserir um por um mas com Promise.all para ser mais rápido
        const results = await Promise.all(escrituras.map(async (data) => {
            try {
                // Tentar criar
                await Escritura.create({ ...data, created_by: userId });
                return { success: true };
            } catch (err) {
                return { success: false, error: err.message };
            }
        }));

        successCount = results.filter(r => r.success).length;
        errorCount = results.filter(r => !r.success).length;

        // Audit Log em massa
        await auditLog(
            { user: req.user, ip: req.ip },
            'IMPORT',
            'escrituras',
            null,
            null,
            { count: successCount, errors: errorCount }
        );

        res.json({
            success: true,
            message: `${successCount} escrituras importadas com sucesso.`,
            details: { success: successCount, errors: errorCount }
        });

    } catch (error) {
        console.error('Erro na importação em massa:', error);
        res.status(500).json({ error: 'Erro ao processar importação: ' + error.message });
    }
}

async function getHistorico(req, res) {
    try {
        const db = require('../database');
        const { id } = req.params;
        const hist = db.prepare(`
            SELECT
                wh.status_anterior, wh.status_novo, wh.observacao, wh.created_at,
                u.nome as atualizado_por
            FROM workflow_history wh
            LEFT JOIN users u ON u.id = wh.created_by
            WHERE wh.escritura_id = ?
            ORDER BY wh.created_at DESC
        `).all(id);
        res.json(hist);
    } catch (error) {
        console.error('Erro ao buscar hist\u00f3rico:', error);
        res.status(500).json({ error: 'Erro ao buscar hist\u00f3rico' });
    }
}

module.exports = {
    create,
    getAll,
    getById,
    update,
    remove,
    getStats,
    importBulk,
    updateStatus,
    atividadeHoje,
    getHistorico,
};
