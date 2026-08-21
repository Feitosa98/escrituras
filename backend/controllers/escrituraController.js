const Escritura = require('../models/Escritura');
const { auditLog } = require('../middleware/audit');
const { sendEscrituraStatusEmail } = require('../services/emailService');

function withoutTrackingPassword(escritura) {
    if (!escritura) return escritura;
    const safe = { ...escritura };
    delete safe.senha_cliente;
    return safe;
}

async function getAll(req, res) {
    try {
        const filters = {
            tipo: req.query.tipo,
            escrevente: req.query.escrevente,
            ano: req.query.ano,
            livro: req.query.livro,
            dataInicio: req.query.dataInicio,
            dataFim: req.query.dataFim,
            busca: req.query.busca,
            arquivadas: req.query.arquivadas
        };

        if (req.query.paginar === 'true') {
            const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
            const limit = Math.min(100, Math.max(10, Number.parseInt(req.query.limit, 10) || 20));
            const total = Escritura.countAll(filters);
            const items = Escritura.findAll({ ...filters, limit, offset: (page - 1) * limit });
            return res.json({
                items: items.map(withoutTrackingPassword), total, page, limit,
                pages: Math.max(1, Math.ceil(total / limit))
            });
        }
        const escrituras = Escritura.findAll(filters);
        res.json(escrituras.map(withoutTrackingPassword));
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

        res.json(withoutTrackingPassword(escritura));
    } catch (error) {
        console.error('Erro ao buscar escritura:', error);
        res.status(500).json({ error: 'Erro ao buscar escritura' });
    }
}

async function getCredentials(req, res) {
    try {
        const escritura = Escritura.findByIdOrUuid(req.params.id);
        if (!escritura) return res.status(404).json({ error: 'Escritura não encontrada' });
        await auditLog(req, 'VIEW_TRACKING_CREDENTIALS', 'escrituras', escritura.id, null, {
            acompanhamento_codigo: escritura.acompanhamento_codigo,
            possui_senha: Boolean(escritura.senha_cliente)
        });
        res.set('Cache-Control', 'no-store');
        res.json({
            acompanhamento_codigo: escritura.acompanhamento_codigo,
            senha_cliente: escritura.senha_cliente,
            gera_acompanhamento: escritura.gera_acompanhamento
        });
    } catch (error) {
        console.error('Erro ao buscar credenciais:', error);
        res.status(500).json({ error: 'Erro ao buscar credenciais de acompanhamento' });
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

        Escritura.archive(escritura.id, req.user.id);

        // Audit log
        await auditLog(req, 'ARCHIVE', 'escrituras', escritura.id, escritura, { archived: true });

        res.json({ message: 'Escritura arquivada com sucesso' });
    } catch (error) {
        console.error('Erro ao deletar escritura:', error);
        res.status(500).json({ error: 'Erro ao deletar escritura' });
    }
}

async function restore(req, res) {
    try {
        const escritura = Escritura.findByIdOrUuid(req.params.id);
        if (!escritura) return res.status(404).json({ error: 'Escritura não encontrada' });
        Escritura.restore(escritura.id, req.user.id);
        const restored = Escritura.findById(escritura.id);
        await auditLog(req, 'RESTORE', 'escrituras', escritura.id, escritura, restored);
        res.json(restored);
    } catch (error) {
        console.error('Erro ao restaurar escritura:', error);
        res.status(500).json({ error: 'Erro ao restaurar escritura' });
    }
}

async function updateOperation(req, res) {
    try {
        const allowedStatuses = [
            'Abertura de protocolo', 'Orçamento / Documentação', 'Minuta / Solicitações',
            'Aguardando cliente', 'Assinatura', 'Prenotação', 'Concluído'
        ];
        const status = String(req.body.status || '').trim();
        if (status && !allowedStatuses.includes(status)) {
            return res.status(400).json({ error: 'Etapa inválida' });
        }
        if (req.body.prazo_data && !/^\d{4}-\d{2}-\d{2}$/.test(String(req.body.prazo_data))) {
            return res.status(400).json({ error: 'Prazo inválido' });
        }
        if (String(req.body.observacao || '').length > 500) {
            return res.status(400).json({ error: 'A observação deve ter no máximo 500 caracteres' });
        }
        if (req.body.responsavel_id) {
            const db = require('../database');
            const responsavel = db.prepare('SELECT id FROM users WHERE id = ? AND ativo = 1').get(req.body.responsavel_id);
            if (!responsavel) return res.status(400).json({ error: 'Responsável inválido ou inativo' });
        }
        const escritura = Escritura.findByIdOrUuid(req.params.id);
        if (!escritura) return res.status(404).json({ error: 'Escritura não encontrada' });
        const updated = Escritura.updateOperation(escritura.id, req.body, req.user.id);
        await auditLog(req, 'UPDATE_OPERATION', 'escrituras', escritura.id, escritura, updated);
        const notificacaoEmail = updated.status !== escritura.status
            ? await sendEscrituraStatusEmail(updated)
            : { sent: false, reason: 'STATUS_UNCHANGED' };
        res.json({ ...updated, notificacao_email: notificacaoEmail });
    } catch (error) {
        console.error('Erro ao atualizar operação:', error);
        res.status(500).json({ error: 'Erro ao atualizar a operação do ato' });
    }
}

async function getChecklist(req, res) {
    try {
        const escritura = Escritura.findByIdOrUuid(req.params.id);
        if (!escritura) return res.status(404).json({ error: 'Escritura não encontrada' });
        if (escritura.status !== 'Concluído') {
            require('../migrate_operacao_diaria').ensureDefaultChecklist(escritura.id, req.user.id);
        }
        res.json(Escritura.getChecklist(escritura.id));
    } catch (error) {
        res.status(500).json({ error: 'Erro ao carregar checklist' });
    }
}

async function addChecklistItem(req, res) {
    try {
        const titulo = String(req.body.titulo || '').trim();
        if (!titulo || titulo.length > 180) return res.status(400).json({ error: 'Informe um item de até 180 caracteres' });
        const escritura = Escritura.findByIdOrUuid(req.params.id);
        if (!escritura) return res.status(404).json({ error: 'Escritura não encontrada' });
        const item = Escritura.addChecklistItem(escritura.id, titulo, req.user.id);
        await auditLog(req, 'CHECKLIST_ADD', 'escrituras', escritura.id, null, item);
        res.status(201).json(item);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao adicionar item' });
    }
}

async function updateChecklistItem(req, res) {
    try {
        const escritura = Escritura.findByIdOrUuid(req.params.id);
        if (!escritura) return res.status(404).json({ error: 'Escritura não encontrada' });
        const item = Escritura.toggleChecklistItem(escritura.id, req.params.itemId, Boolean(req.body.concluido), req.user.id);
        if (!item) return res.status(404).json({ error: 'Item não encontrado' });
        await auditLog(req, 'CHECKLIST_UPDATE', 'escrituras', escritura.id, null, item);
        res.json(item);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar item' });
    }
}

async function removeChecklistItem(req, res) {
    try {
        const escritura = Escritura.findByIdOrUuid(req.params.id);
        if (!escritura) return res.status(404).json({ error: 'Escritura não encontrada' });
        Escritura.removeChecklistItem(escritura.id, req.params.itemId);
        await auditLog(req, 'CHECKLIST_REMOVE', 'escrituras', escritura.id, null, { item_id: req.params.itemId });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Erro ao remover item' });
    }
}

async function meuTrabalho(req, res) {
    try {
        const hoje = new Intl.DateTimeFormat('en-CA', {
            timeZone: process.env.APP_TIMEZONE || 'America/Manaus',
            year: 'numeric', month: '2-digit', day: '2-digit'
        }).format(new Date());
        res.json(Escritura.getMeuTrabalho(req.user, hoje));
    } catch (error) {
        console.error('Erro ao carregar Meu Trabalho:', error);
        res.status(500).json({ error: 'Erro ao carregar seu trabalho' });
    }
}

async function notificacoes(req, res) {
    try {
        const hoje = new Intl.DateTimeFormat('en-CA', {
            timeZone: process.env.APP_TIMEZONE || 'America/Manaus',
            year: 'numeric', month: '2-digit', day: '2-digit'
        }).format(new Date());
        const work = Escritura.getMeuTrabalho(req.user, hoje);
        const items = [];
        for (const ato of work.atos) {
            const prazo = String(ato.prazo_data || '').slice(0, 10);
            if (prazo && prazo < hoje) items.push({
                id: `ato-atrasado-${ato.id}`, tipo: 'atraso', prioridade: 3,
                titulo: 'Prazo vencido', descricao: `${ato.protocolo || ato.tipo} · ${ato.outorgante}`,
                data: prazo, escritura_id: ato.id
            });
            else if (prazo === hoje) items.push({
                id: `ato-hoje-${ato.id}`, tipo: 'prazo', prioridade: 2,
                titulo: 'Prazo vence hoje', descricao: `${ato.protocolo || ato.tipo} · ${ato.outorgante}`,
                data: prazo, escritura_id: ato.id
            });
            if (ato.status === 'Aguardando cliente') items.push({
                id: `ato-cliente-${ato.id}`, tipo: 'cliente', prioridade: 1,
                titulo: 'Aguardando o cliente', descricao: `${ato.protocolo || ato.tipo} · ${ato.outorgante}`,
                data: ato.updated_at, escritura_id: ato.id
            });
        }
        for (const tarefa of work.tarefas) {
            const data = String(tarefa.data_agendada || '').slice(0, 10);
            if (data <= hoje) items.push({
                id: `tarefa-${tarefa.id}`, tipo: data < hoje ? 'atraso' : 'tarefa', prioridade: data < hoje ? 3 : 2,
                titulo: data < hoje ? 'Tarefa atrasada' : 'Tarefa para hoje',
                descricao: tarefa.titulo, data: tarefa.data_agendada, escritura_id: tarefa.escritura_id
            });
        }
        items.sort((a, b) => b.prioridade - a.prioridade || String(a.data).localeCompare(String(b.data)));
        res.json({ total: items.length, items: items.slice(0, 20) });
    } catch (error) {
        console.error('Erro ao carregar notificações:', error);
        res.status(500).json({ error: 'Erro ao carregar notificações' });
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
        res.json({
            ...stats,
            recentes: Array.isArray(stats.recentes) ? stats.recentes.map(withoutTrackingPassword) : []
        });
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
    getCredentials,
    update,
    remove,
    getStats,
    importBulk,
    updateStatus,
    atividadeHoje,
    getHistorico,
    restore,
    updateOperation,
    getChecklist,
    addChecklistItem,
    updateChecklistItem,
    removeChecklistItem,
    meuTrabalho,
    notificacoes,
};
