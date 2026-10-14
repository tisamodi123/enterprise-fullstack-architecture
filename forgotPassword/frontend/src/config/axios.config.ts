import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5001/api/auth',
  withCredentials: true, // Aapka backend local base server URL
  headers: {
    'Content-Type': 'application/json',
  },
});

// Production Rule: Har outgoing request mein auto JWT token add karna
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const session = localStorage.getItem('admin_session');
    if (session) {
      const { token } = JSON.parse(session);
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default api;