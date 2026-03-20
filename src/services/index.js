import api from './api.js';

export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  setup: (data) => api.post('/auth/setup', data),
};

export const userService = {
  getAll: () => api.get('/users'),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
};

export const productService = {
  getAll: () => api.get('/products'),
  getAllAdmin: () => api.get('/products/all'),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
};

export const inventoryService = {
  restock: (data) => api.post('/inventory/restock', data),
  getHistory: (productId) => api.get(`/inventory/history/${productId}`),
};

export const transactionService = {
  create: (data) => api.post('/transactions', data),
  getAll: () => api.get('/transactions'),
  getById: (id) => api.get(`/transactions/${id}`),
  lookup: (receiptNumber) => api.get(`/transactions/lookup/${receiptNumber}`),
  processReturn: (id, data) => api.post(`/transactions/${id}/return`, data),
};

export const dashboardService = {
  getStats: () => api.get('/dashboard'),
};

export const settingService = {
  get: () => api.get('/settings'),
  update: (data) => api.put('/settings', data),
};
