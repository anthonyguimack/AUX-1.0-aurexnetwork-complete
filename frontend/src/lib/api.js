import axios from 'axios';

const API_BASE = process.env.REACT_APP_BACKEND_URL;
const API = `${API_BASE}/api`;

const api = axios.create({
  baseURL: API,
  withCredentials: true,
});

// Add auth header interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Public APIs
export const publicAPI = {
  getSettings: () => api.get('/public/settings'),
  getHero: () => api.get('/public/hero'),
  getAbout: () => api.get('/public/about'),
  getServices: () => api.get('/public/services'),
  getBlog: (page = 1, limit = 9, category = '') => api.get(`/public/blog?page=${page}&limit=${limit}&category=${category}`),
  getBlogDetail: (slug) => api.get(`/public/blog/${slug}`),
  getBooks: () => api.get('/public/books'),
  getMaps: () => api.get('/public/maps'),
  getMapDetail: (slug) => api.get(`/public/maps/${slug}`),
  getMapLocations: () => api.get('/public/map-locations'),
  getGallery: (category = '') => api.get(`/public/gallery?category=${category}`),
  getPortfolio: () => api.get('/public/portfolio'),
  getTestimonials: () => api.get('/public/testimonials'),
  getSections: () => api.get('/public/sections'),
  getPage: (type) => api.get(`/public/page/${type}`),
};

// Auth APIs
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
  exchangeSession: (sessionId) => api.post('/auth/session', { session_id: sessionId }),
};

// Contact
export const contactAPI = {
  submit: (data) => api.post('/contact', data),
};

// Checkout
export const checkoutAPI = {
  create: (serviceId, originUrl) => api.post('/checkout', { service_id: serviceId, origin_url: originUrl }),
  status: (sessionId) => api.get(`/checkout/status/${sessionId}`),
};

// Admin APIs
export const adminAPI = {
  dashboard: () => api.get('/admin/dashboard'),
  // Hero
  getHero: () => api.get('/admin/hero'),
  updateHero: (data) => api.put('/admin/hero', data),
  // About
  getAbout: () => api.get('/admin/about'),
  updateAbout: (data) => api.put('/admin/about', data),
  // Services
  getServices: () => api.get('/admin/services'),
  createService: (data) => api.post('/admin/services', data),
  updateService: (id, data) => api.put(`/admin/services/${id}`, data),
  deleteService: (id) => api.delete(`/admin/services/${id}`),
  // Blog
  getBlog: () => api.get('/admin/blog'),
  createBlog: (data) => api.post('/admin/blog', data),
  updateBlog: (id, data) => api.put(`/admin/blog/${id}`, data),
  deleteBlog: (id) => api.delete(`/admin/blog/${id}`),
  // Books
  getBooks: () => api.get('/admin/books'),
  createBook: (data) => api.post('/admin/books', data),
  updateBook: (id, data) => api.put(`/admin/books/${id}`, data),
  deleteBook: (id) => api.delete(`/admin/books/${id}`),
  // Maps
  getMaps: () => api.get('/admin/maps'),
  createMap: (data) => api.post('/admin/maps', data),
  updateMap: (id, data) => api.put(`/admin/maps/${id}`, data),
  deleteMap: (id) => api.delete(`/admin/maps/${id}`),
  // Map Locations
  getMapLocations: () => api.get('/admin/map-locations'),
  createMapLocation: (data) => api.post('/admin/map-locations', data),
  updateMapLocation: (id, data) => api.put(`/admin/map-locations/${id}`, data),
  deleteMapLocation: (id) => api.delete(`/admin/map-locations/${id}`),
  // Gallery
  getGallery: () => api.get('/admin/gallery'),
  createGallery: (data) => api.post('/admin/gallery', data),
  updateGallery: (id, data) => api.put(`/admin/gallery/${id}`, data),
  deleteGallery: (id) => api.delete(`/admin/gallery/${id}`),
  // Portfolio
  getPortfolio: () => api.get('/admin/portfolio'),
  createPortfolio: (data) => api.post('/admin/portfolio', data),
  updatePortfolio: (id, data) => api.put(`/admin/portfolio/${id}`, data),
  deletePortfolio: (id) => api.delete(`/admin/portfolio/${id}`),
  // Testimonials
  getTestimonials: () => api.get('/admin/testimonials'),
  createTestimonial: (data) => api.post('/admin/testimonials', data),
  updateTestimonial: (id, data) => api.put(`/admin/testimonials/${id}`, data),
  deleteTestimonial: (id) => api.delete(`/admin/testimonials/${id}`),
  // Contacts
  getContacts: () => api.get('/admin/contacts'),
  updateContact: (id, data) => api.put(`/admin/contacts/${id}`, data),
  deleteContact: (id) => api.delete(`/admin/contacts/${id}`),
  // Purchases
  getPurchases: () => api.get('/admin/purchases'),
  // Settings
  getSettings: () => api.get('/admin/settings'),
  updateSettings: (data) => api.put('/admin/settings', data),
  // Pages
  getPage: (type) => api.get(`/admin/pages/${type}`),
  updatePage: (type, data) => api.put(`/admin/pages/${type}`, data),
};

export default api;
