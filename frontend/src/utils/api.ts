import axios from 'axios';

// Create Axios Instance
const api = axios.create({
  // In production, Vercel will point to the Render API endpoint via the VITE_API_URL env variable.
  // In local development, it will default to '/api' which is proxied to http://localhost:5000.
  baseURL: import.meta.env.VITE_API_URL || '/api',
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
