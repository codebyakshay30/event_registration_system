import axios from 'axios';

// The only place that talks to the backend. Base URL comes from the environment.
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api' });

// Attach the JWT token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const errMsg = (e) => e.response?.data?.message || 'Something went wrong. Is the server running?';
export default api;
