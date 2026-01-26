import axios from 'axios';

// URL base da API
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Criar instância do axios
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
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
            // Token expirado ou inválido
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// ========== AUTH ==========
export const authAPI = {
    login: async (email, senha) => {
        const response = await api.post('/auth/login', { email, senha });
        return response.data;
    },

    me: async () => {
        const response = await api.get('/auth/me');
        return response.data;
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }
};

// ========== USERS ==========
export const usersAPI = {
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
    }
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

    getStats: async () => {
        const response = await api.get('/escrituras/stats');
        return response.data;
    }
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
    }
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
        'admin': 3,
        'editor': 2,
        'visualizador': 1
    };

    return (roleHierarchy[user.role] || 0) >= (roleHierarchy[requiredRole] || 0);
};

export default api;
