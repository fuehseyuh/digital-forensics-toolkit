import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({ baseURL: API_BASE_URL });

// Attach the JWT to every request if we have one stored
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('dfit_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (full_name, email, password) => api.post('/auth/register', { full_name, email, password }),
};

export const caseApi = {
  list: () => api.get('/cases'),
  get: (id) => api.get(`/cases/${id}`),
  create: (title, description) => api.post('/cases', { title, description }),
  updateStatus: (id, status) => api.patch(`/cases/${id}/status`, { status }),
};

export const evidenceApi = {
  upload: (caseId, file, onUploadProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/evidence/case/${caseId}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    });
  },
  getDetail: (evidenceId) => api.get(`/evidence/${evidenceId}`),
  reverify: (evidenceId) => api.post(`/evidence/${evidenceId}/reverify`),
};

export default api;
