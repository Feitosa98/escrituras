const Meta = require('../models/Meta');

// Definir meta mensal
async function setMeta(req, res) {
    try {
        const { mes, ano, metaTotal, metasIndividuais } = req.body;

        if (!mes || !ano || !metaTotal) {
            return res.status(400).json({ error: 'Mês, ano e meta total são obrigatórios' });
        }

        const meta = Meta.setMetaMensal(mes, ano, metaTotal, metasIndividuais);
        res.json(meta);
    } catch (error) {
        console.error('Erro ao definir meta:', error);
        res.status(500).json({ error: error.message });
    }
}

// Buscar meta mensal
async function getMeta(req, res) {
    try {
        const { mes, ano } = req.params;
        const meta = Meta.getMetaMensal(mes, ano);

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
        const { userId, mes, ano } = req.params;
        const relatorio = Meta.getProducaoIndividual(parseInt(userId), mes, ano);
        res.json(relatorio);
    } catch (error) {
        console.error('Erro ao gerar relatório individual:', error);
        res.status(500).json({ error: error.message });
    }
}

// Relatório de produção da equipe
async function getRelatorioEquipe(req, res) {
    try {
        const { mes, ano } = req.params;
        const relatorio = Meta.getProducaoEquipe(mes, ano);
        res.json(relatorio);
    } catch (error) {
        console.error('Erro ao gerar relatório de equipe:', error);
        res.status(500).json({ error: error.message });
    }
}

// Ranking de produtividade
async function getRanking(req, res) {
    try {
        const { mes, ano } = req.params;
        const ranking = Meta.getRanking(mes, ano);
        res.json(ranking);
    } catch (error) {
        console.error('Erro ao buscar ranking:', error);
        res.status(500).json({ error: error.message });
    }
}

// Projeção de fim de mês
async function getProjecao(req, res) {
    try {
        const { mes, ano } = req.params;
        const projecao = Meta.getProjecao(mes, ano);
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
