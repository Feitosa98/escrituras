const API_URL = import.meta.env.VITE_API_URL || '/api';

function getHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export const adminAPI = {
  // Tipos de Escritura
  getTipos: async () => {
    const response = await fetch(`${API_URL}/admin/tipos-escritura`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Erro ao buscar tipos');
    return response.json();
  },

  createTipo: async (nome) => {
    const response = await fetch(`${API_URL}/admin/tipos-escritura`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ nome }),
    });
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Erro ao criar tipo');
    }
    return response.json();
  },

  updateTipo: async (id, data) => {
    const response = await fetch(`${API_URL}/admin/tipos-escritura/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Erro ao atualizar tipo');
    return response.json();
  },

  // Escreventes
  getEscreventes: async () => {
    const response = await fetch(`${API_URL}/admin/escreventes`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Erro ao buscar escreventes');
    return response.json();
  },

  createEscrevente: async (data) => {
    const response = await fetch(`${API_URL}/admin/escreventes`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Erro ao criar escrevente');
    return response.json();
  },

  updateEscrevente: async (id, data) => {
    const response = await fetch(`${API_URL}/admin/escreventes/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Erro ao atualizar escrevente');
    return response.json();
  },
};
