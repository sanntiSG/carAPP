import axios from 'axios';

const getBaseUrl = () => {
  // En producción (Netlify), usamos la variable de entorno
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) return envUrl;

  // En desarrollo local, detectamos la IP del PC automáticamente
  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location;
    // Si estamos en localhost, devolvemos localhost, si no, la IP detectada
    return `${protocol}//${hostname}:3001/api`;
  }

  return 'http://localhost:3001/api';
};

const API_URL = getBaseUrl();

const apiInstance = axios.create({
  baseURL: API_URL,
});

// Auth Interceptor
apiInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    if (config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export const api = {
  auth: {
    login: (credentials: any) => apiInstance.post('/auth/login', credentials),
  },
  cars: {
    list: (params?: any) => apiInstance.get('/cars', { params }).then(res => res.data),
    get: (id: string) => apiInstance.get(`/cars/${id}`).then(res => res.data),
    create: (data: any) => apiInstance.post('/cars', data).then(res => res.data),
    update: (id: string, data: any) => apiInstance.put(`/cars/${id}`, data).then(res => res.data),
    delete: (id: string) => apiInstance.delete(`/cars/${id}`).then(res => res.data),
  },
  reservations: {
    list: () => apiInstance.get('/reservations').then(res => res.data),
    create: (data: any) => apiInstance.post('/reservations', data).then(res => res.data),
    cancel: (code: string) => apiInstance.post(`/reservations/cancel/${code}`).then(res => res.data),
    updateStatus: (id: string, status: string, nextCarStatus?: string) => apiInstance.patch(`/reservations/${id}/status`, { status, nextCarStatus }).then(res => res.data),
  },
  settings: {
    getHours: () => apiInstance.get('/settings/hours').then(res => res.data),
    update: (data: any) => apiInstance.post('/settings', data).then(res => res.data),
  }
};
