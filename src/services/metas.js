import api from './api';

export const metasAPI = {
    // Definir meta (admin)
    setMeta: async (dados) => {
        const response = await api.post('/metas', dados);
        return response.data;
    },

    // Buscar meta mensal
    getMeta: async (mes, ano) => {
        const response = await api.get(`/metas/${mes}/${ano}`);
        return response.data;
    },

    // Relatório Individual
    getRelatorioIndividual: async (userId, mes, ano) => {
        const response = await api.get(`/metas/relatorio/individual/${userId}/${mes}/${ano}`);
        return response.data;
    },

    // Relatório Equipe
    getRelatorioEquipe: async (mes, ano) => {
        const response = await api.get(`/metas/relatorio/equipe/${mes}/${ano}`);
        return response.data;
    },

    // Ranking
    getRanking: async (mes, ano) => {
        const response = await api.get(`/metas/ranking/${mes}/${ano}`);
        return response.data;
    },

    // Projeção
    getProjecao: async (mes, ano) => {
        const response = await api.get(`/metas/projecao/${mes}/${ano}`);
        return response.data;
    }
};
