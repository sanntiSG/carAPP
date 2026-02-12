import axios from 'axios';

const getBaseUrl = () => {
  const envUrl = (import.meta as any).env.VITE_API_URL;
  const hostname = window.location.hostname;

  // 1. Si existe la variable de entorno, es la prioridad máxima (Producción)
  if (envUrl) return envUrl;

  // 2. Si estamos en Netlify (Producción), usamos el fallback hardcodeado de Render
  if (hostname.includes('netlify.app')) {
    console.log('Usando URL de respaldo para Render...');
    return 'https://carapp-ux2z.onrender.com/api';
  }

  // 3. Fallback para Desarrollo Local (PC y Móviles en la misma red)
  const protocol = window.location.protocol;
  return `${protocol}//${hostname}:3001/api`;
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
