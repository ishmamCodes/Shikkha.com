import axios from 'axios';

const API_BASE_URL = 'https://shikkha-com.onrender.com';

// Create axios instance with auth header
const createAuthenticatedRequest = () => {
  const token = localStorage.getItem('token');
  return axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
};

const studentApi = {
  getDashboardStats: async () => {
    const api = createAuthenticatedRequest();
    const response = await api.get('/api/students/dashboard-stats');
    return response.data;
  },
  // Student Dashboard APIs
  getSchedule: async () => {
    const api = createAuthenticatedRequest();
    const response = await api.get('/api/students/schedule');
    return response.data;
  },

  getGrades: async () => {
    const api = createAuthenticatedRequest();
    const response = await api.get('/api/students/grades');
    return response.data;
  },

  getAppointments: async () => {
    const api = createAuthenticatedRequest();
    const response = await api.get('/api/students/appointments');
    return response.data;
  },

  cancelAppointment: async (appointmentId, reason = '') => {
    const api = createAuthenticatedRequest();
    const response = await api.put(`/api/students/appointments/${appointmentId}/cancel`, { reason });
    return response.data;
  },

  // Profile APIs
  getProfile: async () => {
    const api = createAuthenticatedRequest();
    const response = await api.get('/api/students/profile');
    return response.data;
  },

  updateProfile: async (payload) => {
    const api = createAuthenticatedRequest();
    const response = await api.put('/api/students/profile', payload);
    return response.data;
  },

  // Catalog APIs
  getCourses: async (params = {}) => {
    const api = createAuthenticatedRequest();
    const response = await api.get('/api/catalog/courses', { params });
    return response.data;
  },

  getCourseById: async (courseId) => {
    const api = createAuthenticatedRequest();
    const response = await api.get(`/api/catalog/courses/${courseId}`);
    return response.data;
  },

  enrollInCourse: async (courseId) => {
    const api = createAuthenticatedRequest();
    const response = await api.post(`/api/students/courses/${courseId}/enroll`);
    return response.data;
  },

  getEnrolledCourses: async () => {
    const api = createAuthenticatedRequest();
    const response = await api.get('/api/students/enrolled-courses');
    return response.data;
  },

  getCourseById: async (courseId) => {
    const api = createAuthenticatedRequest();
    const response = await api.get(`/api/students/courses/${courseId}`);
    return response.data;
  },

  // Course Materials for enrolled students
  getCourseMaterials: async (courseId) => {
    const api = createAuthenticatedRequest();
    const response = await api.get(`/api/materials/course/${courseId}`);
    return response.data;
  },

  downloadCourseMaterial: async (materialId) => {
    const api = createAuthenticatedRequest();
    const response = await api.get(`/api/materials/download/${materialId}`, {
      responseType: 'blob'
    });
    const disposition = response.headers['content-disposition'] || '';
    let filename = 'file';
    const match = disposition.match(/filename\s*=\s*"?([^";]+)"?/i);
    if (match && match[1]) {
      filename = decodeURIComponent(match[1]);
    }
    return { blob: response.data, filename };
  },

  // Marketplace APIs
  getBooks: async (params = {}) => {
    const api = createAuthenticatedRequest();
    const response = await api.get('/api/marketplace/books', { params });
    return response.data;
  },

  getBookById: async (bookId) => {
    const api = createAuthenticatedRequest();
    const response = await api.get(`/api/marketplace/books/${bookId}`);
    return response.data;
  },

  getCart: async () => {
    const api = createAuthenticatedRequest();
    const response = await api.get('/api/marketplace/cart');
    return response.data;
  },

  updateCartItem: async (itemId, quantity) => {
    const api = createAuthenticatedRequest();
    const response = await api.put(`/api/marketplace/cart/items/${itemId}`, { quantity });
    return response.data;
  },

  removeCartItem: async (itemId) => {
    const api = createAuthenticatedRequest();
    const response = await api.delete(`/api/marketplace/cart/items/${itemId}`);
    return response.data;
  },

  addToCart: async (bookId, qty = 1) => {
    const api = createAuthenticatedRequest();
    const response = await api.post('/api/marketplace/cart/items', { bookId, qty });
    return response.data;
  },

  removeFromCart: async (itemId) => {
    const api = createAuthenticatedRequest();
    const response = await api.delete(`/api/marketplace/cart/items/${itemId}`);
    return response.data;
  },

  updateCartItem: async (itemId, quantity) => {
    const api = createAuthenticatedRequest();
    const response = await api.put(`/api/marketplace/cart/items/${itemId}`, { quantity });
    return response.data;
  },

  removeCartItem: async (itemId) => {
    const api = createAuthenticatedRequest();
    const response = await api.delete(`/api/marketplace/cart/items/${itemId}`);
    return response.data;
  },

  checkout: async () => {
    const api = createAuthenticatedRequest();
    const response = await api.post('/marketplace/checkout');
    return response.data;
  },

  // Avatar upload/remove
  uploadAvatar: async (formData) => {
    const token = localStorage.getItem('token');
    const api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    });
    const response = await api.post('/api/students/profile/avatar', formData);
    return response.data;
  },

  removeAvatar: async () => {
    const api = createAuthenticatedRequest();
    const response = await api.delete('/api/students/profile/avatar');
    return response.data;
  },

  // Student purchases
  getPurchases: async () => {
    const api = createAuthenticatedRequest();
    const response = await api.get('/api/students/purchases');
    return response.data;
  }
};

export default studentApi;
