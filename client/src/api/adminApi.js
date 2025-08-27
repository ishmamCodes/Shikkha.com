import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

const adminApi = {
  // Get sales summary for admin dashboard
  getSalesSummary: async () => {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
    const response = await axios.get(`${API_BASE_URL}/admin/sales`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  },

  // Get educator earnings
  getEducatorEarnings: async (educatorId) => {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
    const response = await axios.get(`${API_BASE_URL}/admin/educator/${educatorId}/earnings`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  },

  // Get student purchases
  getStudentPurchases: async (studentId) => {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
    const response = await axios.get(`${API_BASE_URL}/admin/student/${studentId}/purchases`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  }
};

export default adminApi;
