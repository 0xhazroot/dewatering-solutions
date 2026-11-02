import axios from 'axios';

// Instancia base de Axios: en producción (Docker/AWS) usa el proxy '/api' de Nginx; en desarrollo usa localhost:3000
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:3000/api'),
});

// Interceptor de Request: Inyecta el JWT automáticamente en cada petición
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('dewatering_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Interceptor de Response: Maneja sesión expirada (401/403 por token inválido)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      
      // Si el backend responde 401 por token expirado, limpiar sesión y redirigir
      if (status === 401 && data?.error?.includes('expirado')) {
        localStorage.removeItem('dewatering_token');
        // Solo redirigir si no estamos ya en la página de login
        if (!window.location.pathname.match(/^\/(mfa)?$/)) {
          window.location.href = '/';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
