import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('sweety_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response ? error.response.status : null;
    const url = error.config ? error.config.url : '';

    // If 401 Unauthorized and not on login or register endpoints,
    // clear token and dispatch auth-expired event
    if (status === 401 && !url.includes('/api/auth/login') && !url.includes('/api/auth/register')) {
      localStorage.removeItem('sweety_token');
      localStorage.removeItem('sweety_user');
      window.dispatchEvent(new Event('sweety_auth_expired'));
    }

    return Promise.reject(error);
  }
);

export default api;

