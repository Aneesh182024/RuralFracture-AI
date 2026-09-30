import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Interceptor to add JWT token if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  login: (email, password) => api.post('/api/auth/login', { email, password }),
  getMe: () => api.get('/api/auth/me'),
};

export const patientAPI = {
  list: () => api.get('/api/patients'),
  get: (id) => api.get(`/api/patients/${id}`),
  create: (formData) => api.post('/api/patients', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

export const caseAPI = {
  list: (params) => api.get('/api/cases', { params }),
  get: (id) => api.get(`/api/cases/${id}`),
};

export const xrayAPI = {
  upload: (formData) => api.post('/api/xray/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  enhance: (caseId) => api.post('/api/xray/enhance', { case_id: caseId }),
  getInfo: (caseId) => api.get(`/api/xray/${caseId}`),
};

export const aiAPI = {
  predict: (caseId, demoMode = true) => api.post('/api/ai/predict', { case_id: caseId, demo_mode: demoMode }),
  getResult: (caseId) => api.get(`/api/ai/result/${caseId}`),
  getGradCAM: (caseId) => api.get(`/api/ai/gradcam/${caseId}`),
};

export const datasetAPI = {
  import: (formData) => api.post('/api/dataset/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  status: () => api.get('/api/dataset/status'),
  sample: () => api.get('/api/dataset/sample'),
};

export const modelAPI = {
  list: () => api.get('/api/models'),
  getLatestMetrics: () => api.get('/api/models/metrics/latest'),
  train: (epochs = 3) => api.post(`/api/models/train?epochs=${epochs}`),
};

export const reviewAPI = {
  submit: (data) => api.post('/api/reviews', data),
  get: (caseId) => api.get(`/api/reviews/${caseId}`),
};

export const assistantAPI = {
  chat: (message, caseId = null, page = null) => api.post('/api/assistant/chat', {
    message,
    case_id: caseId,
    current_page: page,
  }),
  explainResult: (caseId) => api.post(`/api/assistant/explain-result?case_id=${caseId}`),
  explainQuality: (caseId) => api.post(`/api/assistant/explain-image-quality?case_id=${caseId}`),
  datasetHelp: (query) => api.post(`/api/assistant/dataset-help?query=${query || ''}`),
  summarizeCase: (caseId) => api.post(`/api/assistant/summarize-case?case_id=${caseId}`),
  getContext: (caseId) => api.get(`/api/assistant/context/${caseId}`),
};

export const getImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  // Replace backslashes for Windows file paths
  const cleanPath = path.replace(/\\/g, '/');
  return `${API_BASE_URL}/${cleanPath}`;
};

export default api;
