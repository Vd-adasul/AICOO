import axios from 'axios';

// Create Axios Instance
const api = axios.create({
  // VITE_API_URL should be e.g. https://twinos-backend.onrender.com
  // We always append /api so routes like /auth/login resolve correctly.
  baseURL: import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api`
    : '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach Auth Token if exists in localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('twinos_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Redirect to login on 401 unauthorised
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('twinos_token');
      localStorage.removeItem('twinos_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
