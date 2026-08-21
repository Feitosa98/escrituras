import axios from 'axios';

// URL base da API
// Em produção, frontend e API são servidos pelo mesmo domínio.
// Usar caminho relativo evita que o navegador do usuário tente acessar localhost.
const API_URL = import.meta.env.VITE_API_URL || '/api';

// Criar instância do axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token em todas as requisições
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratar erros de autenticação
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado ou inválido — limpa e redireciona pela hash
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // HashRouter usa /#/ — recarregar a página vai para a raiz autenticada
      window.location.hash = '/';
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

// ========== AUTH ==========
export const authAPI = {
  login: async (usuario, senha) => {
    const response = await api.post('/auth/login', { usuario, senha });
    return response.data;
  },

  me: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
};

// ========== USERS ==========
export const usersAPI = {
  getOptions: async () => {
    const response = await api.get('/users/options');
    return response.data;
  },
  getAll: async () => {
    const response = await api.get('/users');
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  create: async (userData) => {
    const response = await api.post('/users', userData);
    return response.data;
  },

  update: async (id, userData) => {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },
};

// ========== ESCRITURAS ==========
export const escriturasAPI = {
  getAll: async (filters = {}) => {
    const response = await api.get('/escrituras', { params: filters });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/escrituras/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/escrituras', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/escrituras/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/escrituras/${id}`);
    return response.data;
  },

  updateStatus: async (id, status, observacao = '') => {
    const response = await api.patch(`/escrituras/${id}/status`, { status, observacao });
    return response.data;
  },

  updateOperation: async (id, data) => {
    const response = await api.patch(`/escrituras/${id}/operacao`, data);
    return response.data;
  },

  restore: async (id) => {
    const response = await api.patch(`/escrituras/${id}/restaurar`);
    return response.data;
  },

  getChecklist: async (id) => {
    const response = await api.get(`/escrituras/${id}/checklist`);
    return response.data;
  },

  addChecklistItem: async (id, titulo) => {
    const response = await api.post(`/escrituras/${id}/checklist`, { titulo });
    return response.data;
  },

  updateChecklistItem: async (id, itemId, concluido) => {
    const response = await api.patch(`/escrituras/${id}/checklist/${itemId}`, { concluido });
    return response.data;
  },

  removeChecklistItem: async (id, itemId) => {
    await api.delete(`/escrituras/${id}/checklist/${itemId}`);
  },

  getMeuTrabalho: async () => {
    const response = await api.get('/escrituras/meu-trabalho');
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/escrituras/stats');
    return response.data;
  },
};

// ========== AUDIT ==========
export const auditAPI = {
  getAll: async (filters = {}) => {
    const response = await api.get('/audit', { params: filters });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/audit/${id}`);
    return response.data;
  },
};

// ========== UTILS ==========
export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};

export const getUser = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

export const hasPermission = (requiredRole) => {
  const user = getUser();
  if (!user) return false;

  const roleHierarchy = {
    admin: 3,
    editor: 2,
    visualizador: 1,
  };

  return (roleHierarchy[user.role] || 0) >= (roleHierarchy[requiredRole] || 0);
};

export default api;
