import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: 'http://localhost:8000/api',
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
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Check if the error is from authentication endpoints (not Mendeley/Zotero)
      const url = error.config?.url || '';
      const isMendeleyError = url.includes('/mendeley') || url.includes('/integration');
      const isZoteroError = url.includes('/zotero');
      
      // Only redirect to login if it's an auth error, not Mendeley/Zotero token issue
      if (!isMendeleyError && !isZoteroError) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
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
  
  // CAPTCHA
  getCaptcha: () => api.get('/auth/captcha'),
  
  loginWithCaptcha: (data) => api.post('/auth/login/captcha', data),
  
  // Forgot Password
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  
  verifyCode: (email, code) => api.post('/auth/verify-code', { email, code }),
  
  resetPassword: (data) => api.post('/auth/reset-password', data),
};

// ============= DOCUMENTS API =============
export const documentsAPI = {
  upload: (formData, onUploadProgress) => api.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
  }),
  
  getAll: (params) => api.get('/documents/', { params }),
  
  getById: (id) => api.get(`/documents/doc/${id}`),
  
  download: (id) => api.get(`/documents/doc/${id}/download`, {
    responseType: 'blob',
  }),
  
  downloadCompilation: (params = {}) => api.get('/documents/compilation/download', {
    params,
    responseType: 'blob',
  }),
  
  delete: (id) => api.delete(`/documents/doc/${id}`),
  
  search: (query) => api.get('/documents/search', { params: { q: query } }),
};

// ============= TAGS API =============
export const tagsAPI = {
  getAll: () => api.get('/documents/tags/all'),
  
  create: (name) => api.post('/documents/tags', { nama_tag: name }),
  
  addToDocument: (documentId, tagName) => api.post(`/documents/doc/${documentId}/tags`, { nama: tagName }),
  
  removeFromDocument: (documentId, tagId) => api.delete(`/documents/doc/${documentId}/tags/${tagId}`),
};

// ============= NLP API =============
export const nlpAPI = {
  extractKeywords: (data) => api.post('/nlp/extract-keywords', data),
  
  summarize: (data) => api.post('/nlp/summarize', data),
  
  processDocument: (documentId, language = 'id') => api.post(`/nlp/process/${documentId}?language=${language}`),

  generateOutline: (data) => api.post('/nlp/generate-outline', data),
  
  getStatus: (documentId) => api.get(`/nlp/status/${documentId}`),

  generateIdeas: (data) => api.post('/nlp/generate-ideas', data),

  saveIdea: (data) => api.post('/nlp/ideas/save', data),
  
  getIdeaHistory: () => api.get('/nlp/ideas/history'),
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

// ============= INTEGRATION API (Zotero) =============
export const integrationAPI = {
  connectZotero: (data) => api.post('/integration/zotero/config', data),
  syncZotero: () => api.post('/integration/zotero/sync'),
  getReferences: () => api.get('/integration/references'),
  analyzeZotero: (refId) => api.post(`/integration/zotero/analyze/${refId}`),
  getConfig: () => api.get('/integration/zotero/config'),
  disconnect: () => api.post('/integration/zotero/disconnect'),
};

// ============= DOSEN API =============
export const dosenAPI = {
  // Dashboard & Stats
  getDashboardStats: () => api.get('/dosen/dashboard/stats'),
  
  // Mahasiswa Assignment
  getAvailableDosen: () => api.get('/dosen/available-dosen'),
  assignMahasiswa: (mahasiswaId) => api.post(`/dosen/assign-mahasiswa/${mahasiswaId}`),
  removeMahasiswa: (mahasiswaId) => api.delete(`/dosen/remove-mahasiswa/${mahasiswaId}`),
  
  // Mahasiswa Bimbingan
  getMahasiswaBimbingan: () => api.get('/dosen/mahasiswa'),
  getMahasiswaDocuments: (mahasiswaId) => api.get(`/dosen/mahasiswa/${mahasiswaId}/dokumen`),
  
  // Dokumen Detail
  getDokumenDetail: (dokumenId) => api.get(`/dosen/dokumen/${dokumenId}`),
  
  // Catatan (Comments)
  addCatatan: (dokumenId, data) => api.post(`/dosen/dokumen/${dokumenId}/catatan`, data),
  getCatatan: (dokumenId) => api.get(`/dosen/dokumen/${dokumenId}/catatan`),
  updateCatatan: (catatanId, data) => api.put(`/dosen/catatan/${catatanId}`, data),
  deleteCatatan: (catatanId) => api.delete(`/dosen/catatan/${catatanId}`),
  
  // Paragraph Comments
  addParagraphComment: (dokumenId, data) => api.post(`/dosen/dokumen/${dokumenId}/paragraph-comments`, data),
  getParagraphComments: (dokumenId) => api.get(`/dosen/dokumen/${dokumenId}/paragraph-comments`),
  updateParagraphComment: (commentId, data) => api.put(`/dosen/paragraph-comments/${commentId}`, data),
  deleteParagraphComment: (commentId) => api.delete(`/dosen/paragraph-comments/${commentId}`),
  
  // Comment Replies
  addCommentReply: (commentId, data) => api.post(`/dosen/paragraph-comments/${commentId}/replies`, data),
};

// ============= MAHASISWA API =============
export const mahasiswaAPI = {
  // Pilih Dosen Pembimbing
  chooseDosen: (dosenId) => api.put(`/users/mahasiswa/choose-dosen/${dosenId}`),
};

// ============= MENDELEY API =============
export const mendeleyAPI = {
  // Manual file import
  importReferences: (dokumenId, formData) => api.post(`/mendeley/import-mendeley/${dokumenId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getExportGuide: () => api.get('/mendeley/export-guide'),
  
  // OAuth sync
  getAuthorizationUrl: (dokumenId) => api.get(`/mendeley/oauth/authorize?dokumen_id=${dokumenId}`),
  syncLibrary: (dokumenId, accessToken) => api.post(`/mendeley/sync/${dokumenId}?access_token=${accessToken}`),
  testConnection: (accessToken) => api.get(`/mendeley/test-connection?access_token=${accessToken}`),
};

export default api;

export const draftsAPI = {
  // Perbaikan: Hapus { ... } dan ganti dengan headers yang benar
  upload: (formData) => api.post('/drafts/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' } 
  }),

  getMyDrafts: () => api.get('/drafts/my-drafts'),

  getComments: (draftId) => api.get(`/drafts/${draftId}/comments`),

  postComment: (draftId, data) => api.post(`/drafts/${draftId}/comments`, data),
  
  deleteComment: (commentId) => api.delete(`/drafts/comments/${commentId}`),
};