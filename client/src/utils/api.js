// client/src/utils/api.js
import axios from 'axios';

// Base API URL
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  // withCredentials: false // keep false unless your server uses cookies
});

// Attach token on every request automatically
api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem('edtech_token');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    // ignore
  }
  return config;
}, (error) => Promise.reject(error));

export default api;
