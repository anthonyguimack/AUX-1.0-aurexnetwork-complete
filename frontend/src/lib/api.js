import axios from 'axios';
const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const api = axios.create({ baseURL: API, withCredentials: true });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const publicAPI = {
  getSettings: () => api.get('/public/settings'),
  getHero: () => api.get('/public/hero'),
  getHeroSlides: (page = '') => api.get(`/public/hero-slides${page ? `?page=${page}` : ''}`),
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
  getNavPages: () => api.get('/public/nav-pages'),
  getSitePages: () => api.get('/public/site-pages'),
  getSeo: (path) => api.get(`/public/seo/${path}`),
};

export const searchAPI = {
  search: (q) => api.get(`/search?q=${encodeURIComponent(q)}`),
};

export const blogExternalAPI = {
  getLatest: () => api.get('/blog/latest'),
};

export const authAPI = {
  login: (email, password, loginType = 'any') => api.post('/auth/login', { email, password, login_type: loginType }),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
  exchangeSession: (sessionId) => api.post('/auth/session', { session_id: sessionId }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post('/auth/reset-password', { token, password }),
  changePassword: (currentPassword, newPassword) => api.post('/auth/change-password', { current_password: currentPassword, new_password: newPassword }),
};

export const contactAPI = { submit: (data) => api.post('/contact', data) };

export const checkoutAPI = {
  create: (serviceId, originUrl) => api.post('/checkout', { service_id: serviceId, origin_url: originUrl }),
  status: (sessionId) => api.get(`/checkout/status/${sessionId}`),
};

export const adminAPI = {
  dashboard: () => api.get('/admin/dashboard'),
  getHero: () => api.get('/admin/hero'),
  updateHero: (data) => api.put('/admin/hero', data),
  // Hero Slides CRUD
  getHeroSlides: () => api.get('/admin/hero-slides'),
  getHeroSlide: (id) => api.get(`/admin/hero-slides/${id}`),
  createHeroSlide: (data) => api.post('/admin/hero-slides', data),
  updateHeroSlide: (id, data) => api.put(`/admin/hero-slides/${id}`, data),
  deleteHeroSlide: (id) => api.delete(`/admin/hero-slides/${id}`),
  getAbout: () => api.get('/admin/about'),
  updateAbout: (data) => api.put('/admin/about', data),
  getServices: () => api.get('/admin/services'),
  createService: (data) => api.post('/admin/services', data),
  updateService: (id, data) => api.put(`/admin/services/${id}`, data),
  deleteService: (id) => api.delete(`/admin/services/${id}`),
  getBlog: () => api.get('/admin/blog'),
  createBlog: (data) => api.post('/admin/blog', data),
  updateBlog: (id, data) => api.put(`/admin/blog/${id}`, data),
  deleteBlog: (id) => api.delete(`/admin/blog/${id}`),
  getBooks: () => api.get('/admin/books'),
  createBook: (data) => api.post('/admin/books', data),
  updateBook: (id, data) => api.put(`/admin/books/${id}`, data),
  deleteBook: (id) => api.delete(`/admin/books/${id}`),
  getMaps: () => api.get('/admin/maps'),
  createMap: (data) => api.post('/admin/maps', data),
  updateMap: (id, data) => api.put(`/admin/maps/${id}`, data),
  deleteMap: (id) => api.delete(`/admin/maps/${id}`),
  getMapLocations: () => api.get('/admin/map-locations'),
  createMapLocation: (data) => api.post('/admin/map-locations', data),
  updateMapLocation: (id, data) => api.put(`/admin/map-locations/${id}`, data),
  deleteMapLocation: (id) => api.delete(`/admin/map-locations/${id}`),
  getGallery: () => api.get('/admin/gallery'),
  createGallery: (data) => api.post('/admin/gallery', data),
  updateGallery: (id, data) => api.put(`/admin/gallery/${id}`, data),
  deleteGallery: (id) => api.delete(`/admin/gallery/${id}`),
  getPortfolio: () => api.get('/admin/portfolio'),
  createPortfolio: (data) => api.post('/admin/portfolio', data),
  updatePortfolio: (id, data) => api.put(`/admin/portfolio/${id}`, data),
  deletePortfolio: (id) => api.delete(`/admin/portfolio/${id}`),
  getTestimonials: () => api.get('/admin/testimonials'),
  createTestimonial: (data) => api.post('/admin/testimonials', data),
  updateTestimonial: (id, data) => api.put(`/admin/testimonials/${id}`, data),
  deleteTestimonial: (id) => api.delete(`/admin/testimonials/${id}`),
  getContacts: () => api.get('/admin/contacts'),
  updateContact: (id, data) => api.put(`/admin/contacts/${id}`, data),
  deleteContact: (id) => api.delete(`/admin/contacts/${id}`),
  getPurchases: () => api.get('/admin/purchases'),
  getSettings: () => api.get('/admin/settings'),
  updateSettings: (data) => api.put('/admin/settings', data),
  getPage: (type) => api.get(`/admin/pages/${type}`),
  updatePage: (type, data) => api.put(`/admin/pages/${type}`, data),
  // Nav Pages
  getNavPages: () => api.get('/admin/nav-pages'),
  createNavPage: (data) => api.post('/admin/nav-pages', data),
  updateNavPage: (id, data) => api.put(`/admin/nav-pages/${id}`, data),
  deleteNavPage: (id) => api.delete(`/admin/nav-pages/${id}`),
  // Users
  getUsers: () => api.get('/admin/users'),
  createUser: (data) => api.post('/admin/users', data),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  // SMTP
  testSmtpConnection: (data) => api.post('/admin/smtp/test-connection', data),
  testSmtpEmail: (data) => api.post('/admin/smtp/test-email', data),
  // Upload
  uploadImage: (file) => { const fd = new FormData(); fd.append('file', file); return api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } }); },
  // Bulk Operations
  bulkDelete: (collection, ids) => api.post('/admin/bulk-delete', { collection, ids }),
  bulkUpdate: (collection, ids, update) => api.post('/admin/bulk-update', { collection, ids, update }),
  // Section Order
  getSectionOrder: () => api.get('/admin/section-order'),
  updateSectionOrder: (order) => api.put('/admin/section-order', { order }),
  // SEO
  getSeo: () => api.get('/admin/seo'),
  updateSeo: (pagePath, data) => api.put(`/admin/seo/${pagePath}`, data),
  // Analytics
  getAnalytics: () => api.get('/admin/analytics'),
  // CSV Export
  exportContacts: () => api.get('/admin/contacts/export', { responseType: 'blob' }),
  // Members
  getMembers: () => api.get('/admin/members'),
  createMember: (data) => api.post('/admin/members', data),
  getMember: (id) => api.get(`/admin/members/${id}`),
  updateMember: (id, data) => api.put(`/admin/members/${id}`, data),
  deleteMember: (id) => api.delete(`/admin/members/${id}`),
  assignMentor: (id, data) => api.put(`/admin/members/${id}/mentor`, data),
  // Member Levels
  getLevels: () => api.get('/admin/member-levels'),
  createLevel: (data) => api.post('/admin/member-levels', data),
  updateLevel: (id, data) => api.put(`/admin/member-levels/${id}`, data),
  deleteLevel: (id) => api.delete(`/admin/member-levels/${id}`),
};

// Member API (unified - uses same auth_token)
export const memberAPI = {
  login: (data) => api.post('/auth/login', { email: data.username || data.email, password: data.password }),
  me: () => api.get('/auth/me'),
  // Invite codes
  generateCodes: (count) => api.post('/member/invite-codes/generate', { count }),
  listCodes: () => api.get('/member/invite-codes'),
  sendInvite: (codeId, data) => api.post(`/member/invite-codes/${codeId}/send`, data),
  // Public
  validateCode: (code) => api.get(`/member/validate-code/${code}`),
  register: (data) => api.post('/member/register', data),
  // My Account
  getSponsor: () => api.get('/member/my-sponsor'),
  getMentor: () => api.get('/member/my-mentor'),
  getCommunity: () => api.get('/member/my-community'),
  updateBiography: (data) => api.put('/member/biography', data),
  updateProfile: (data) => api.put('/member/profile', data),
  // Portfolios
  getPortfolios: () => api.get('/member/portfolios'),
  createPortfolio: (data) => api.post('/member/portfolios', data),
  getPortfolio: (id) => api.get(`/member/portfolios/${id}`),
  updatePortfolio: (id, data) => api.put(`/member/portfolios/${id}`, data),
  deletePortfolio: (id) => api.delete(`/member/portfolios/${id}`),
  // Sectors / Industries / Companies
  getSectors: () => api.get('/member/sectors'),
  getIndustries: (sectorId) => api.get(`/member/industries${sectorId ? `?sector_id=${sectorId}` : ''}`),
  getCompanies: (industryId) => api.get(`/member/companies${industryId ? `?industry_id=${industryId}` : ''}`),
  getMembersList: () => api.get('/member/members-list'),
  getMyLevel: () => api.get('/member/my-level'),
  uploadImage: (file) => { const fd = new FormData(); fd.append('file', file); return api.post('/member/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } }); },
};

// Geo API (public)
export const geoAPI = {
  getCountries: () => api.get('/geo/countries'),
  getStates: (countryId) => api.get(`/geo/states${countryId ? `?country_id=${countryId}` : ''}`),
  getCities: (stateId) => api.get(`/geo/cities${stateId ? `?state_id=${stateId}` : ''}`),
};

export default api;
