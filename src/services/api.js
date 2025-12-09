import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ============= AUTH API =============
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  }),
  
  registerMahasiswa: (data) => api.post('/auth/register/mahasiswa', data),
  
  registerDosen: (data) => api.post('/auth/register/dosen', data),
  
  getMe: () => api.get('/auth/me'),
  
  logout: () => api.post('/auth/logout'),
};

// ============= DOCUMENTS API =============
export const documentsAPI = {
  upload: (formData, onUploadProgress) => api.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
  }),
  
  getAll: (params) => api.get('/documents/', { params }),
  
  getById: (id) => api.get(`/documents/${id}`),
  
  download: (id) => api.get(`/documents/download/${id}`, {
    responseType: 'blob',
  }),
  
  delete: (id) => api.delete(`/documents/${id}`),
  
  search: (query) => api.get('/documents/search', { params: { q: query } }),
};

// ============= TAGS API =============
export const tagsAPI = {
  getAll: () => api.get('/documents/tags'),
  
  create: (name) => api.post('/documents/tags', { nama_tag: name }),
  
  addToDocument: (documentId, tagId) => api.post(`/documents/${documentId}/tags/${tagId}`),
  
  removeFromDocument: (documentId, tagId) => api.delete(`/documents/${documentId}/tags/${tagId}`),
};

// ============= NLP API =============
export const nlpAPI = {
  extractKeywords: (data) => api.post('/nlp/extract-keywords', data),
  
  summarize: (data) => api.post('/nlp/summarize', data),
  
  processDocument: (documentId) => api.post(`/nlp/process/${documentId}`),
  
  getStatus: (documentId) => api.get(`/nlp/status/${documentId}`),
};

// ============= VISUALIZATION API =============
export const visualizationAPI = {
  getSimilarityGraph: (params) => api.get('/visualization/similarity-graph', { params }),
  
  getSimilarDocuments: (documentId, params) => api.get(`/visualization/similar/${documentId}`, { params }),
};

// ============= USERS API (Dosen Only) =============
export const usersAPI = {
  getMahasiswa: () => api.get('/users/mahasiswa'),
  
  getDosen: () => api.get('/users/dosen'),
};

export const integrationAPI = {
  connectZotero: (data) => api.post('/integration/zotero/connect', data),
  syncZotero: () => api.post('/integration/zotero/sync'),
  getReferences: () => api.get('/integration/references'),
  analyzeZotero: (refId) => api.post(`/integration/zotero/analyze/${refId}`),
};

export default api;
