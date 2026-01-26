const Escritura = require('../models/Escritura');
const { auditLog } = require('../middleware/audit');

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

        res.status(201).json(escritura);
    } catch (error) {
        console.error('Erro ao criar escritura:', error);
        res.status(500).json({ error: 'Erro ao criar escritura' });
    }
}

async function update(req, res) {
    try {
        const { id } = req.params;

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

async function getStats(req, res) {
    try {
        const stats = Escritura.getStats();
        res.json(stats);
    } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
        res.status(500).json({ error: 'Erro ao buscar estatísticas' });
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

module.exports = {
    create,
    getAll,
    getById,
    update,
    remove,
    getStats,
    importBulk
};
