import api from './api';

export const metasAPI = {
  // Definir meta (admin)
  setMeta: async (dados) => {
    const response = await api.post('/metas', dados);
    return response.data;
  },

  // Buscar meta trimestral
  getMeta: async (trimestre, ano) => {
    const response = await api.get(`/metas/${trimestre}/${ano}`);
    return response.data;
  },

  // Relatório Individual
  getRelatorioIndividual: async (userId, trimestre, ano) => {
    const response = await api.get(`/metas/relatorio/individual/${userId}/${trimestre}/${ano}`);
    return response.data;
  },

  // Relatório Equipe
  getRelatorioEquipe: async (trimestre, ano) => {
    const response = await api.get(`/metas/relatorio/equipe/${trimestre}/${ano}`);
    return response.data;
  },

  // Ranking
  getRanking: async (trimestre, ano) => {
    const response = await api.get(`/metas/ranking/${trimestre}/${ano}`);
    return response.data;
  },

  // Projeção
  getProjecao: async (trimestre, ano) => {
    const response = await api.get(`/metas/projecao/${trimestre}/${ano}`);
    return response.data;
  },
};
