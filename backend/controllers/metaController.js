const Meta = require('../models/Meta');

// Definir meta trimestral
async function setMeta(req, res) {
    try {
        const { trimestre, ano, metaTotal, metasIndividuais } = req.body;

        if (!trimestre || !ano || !metaTotal) {
            return res.status(400).json({ error: 'Trimestre, ano e meta total são obrigatórios' });
        }

        const meta = Meta.setMetaMensal(trimestre, ano, metaTotal, metasIndividuais);
        res.json(meta);
    } catch (error) {
        console.error('Erro ao definir meta:', error);
        res.status(500).json({ error: error.message });
    }
}

// Buscar meta trimestral
async function getMeta(req, res) {
    try {
        const { mes: trimestre, ano } = req.params;
        const meta = Meta.getMetaMensal(trimestre, ano);

        if (!meta) {
            return res.status(404).json({ error: 'Meta não encontrada' });
        }

        res.json(meta);
    } catch (error) {
        console.error('Erro ao buscar meta:', error);
        res.status(500).json({ error: error.message });
    }
}

// Relatório de produção individual
async function getRelatorioIndividual(req, res) {
    try {
        const { userId, mes: trimestre, ano } = req.params;
        const relatorio = Meta.getProducaoIndividual(parseInt(userId), trimestre, ano);
        res.json(relatorio);
    } catch (error) {
        console.error('Erro ao gerar relatório individual:', error);
        res.status(500).json({ error: error.message });
    }
}

// Relatório de produção da equipe
async function getRelatorioEquipe(req, res) {
    try {
        const { mes: trimestre, ano } = req.params;
        const relatorio = Meta.getProducaoEquipe(trimestre, ano);
        res.json(relatorio);
    } catch (error) {
        console.error('Erro ao gerar relatório de equipe:', error);
        res.status(500).json({ error: error.message });
    }
}

// Ranking de produtividade
async function getRanking(req, res) {
    try {
        const { mes: trimestre, ano } = req.params;
        const ranking = Meta.getRanking(trimestre, ano);
        res.json(ranking);
    } catch (error) {
        console.error('Erro ao buscar ranking:', error);
        res.status(500).json({ error: error.message });
    }
}

// Projeção de fim do trimestre
async function getProjecao(req, res) {
    try {
        const { mes: trimestre, ano } = req.params;
        const projecao = Meta.getProjecao(trimestre, ano);
        res.json(projecao);
    } catch (error) {
        console.error('Erro ao calcular projeção:', error);
        res.status(500).json({ error: error.message });
    }
}

module.exports = {
    setMeta,
    getMeta,
    getRelatorioIndividual,
    getRelatorioEquipe,
    getRanking,
    getProjecao
};
