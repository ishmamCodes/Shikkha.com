import axios from 'axios';

const SERVER_ORIGIN = 'http://localhost:4000';
const api = axios.create({ baseURL: `${SERVER_ORIGIN}/api` });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const educatorApi = {
  async getProfile(educatorUserId) {
    const { data } = await api.get(`/educators/${educatorUserId}`);
    return data?.data;
  },
  async updateProfile(educatorUserId, payload) {
    const { data } = await api.put(`/educators/${educatorUserId}`, payload);
    return data?.data;
  },
  async updatePassword(educatorUserId, newPassword) {
    const { data } = await api.put(`/educators/${educatorUserId}/password`, newPassword);
    return data;
  },
  async requestEmailChange(userId, newEmail) {
    const { data } = await api.post(`/educators/${userId}/email-change`, { newEmail });
    return data?.data;
  },
  async getMyEmailChangeRequests() {
    const { data } = await api.get('/educators/me/email-change');
    return data?.data || [];
  },
  async createCourse(payload) {
    const { data } = await api.post('/courses', payload);
    return data?.data;
  },
  async updateCourse(courseId, payload) {
    const { data } = await api.put(`/courses/${courseId}`, payload);
    return data?.data;
  },
  async deleteCourse(courseId) {
    const { data } = await api.delete(`/courses/${courseId}`);
    return data;
  },
  async getCourseStudents(courseId) {
    const { data } = await api.get(`/courses/${courseId}/students`);
    return data?.data;
  },
  async removeStudent(courseId, studentId) {
    const { data } = await api.delete(`/courses/${courseId}/students/${studentId}`);
    return data;
  },
  async getAppointments(educatorId) {
    const { data } = await api.get(`/appointments`, { params: { educatorId } });
    return data?.data;
  },
  async updateAppointmentStatus(appointmentId, status, notes) {
    const { data } = await api.put(`/appointments/${appointmentId}/status`, { status, notes });
    return data?.data;
  },
  async getMessages(studentId = null) {
    const params = studentId ? { studentId } : {};
    const { data } = await api.get('/messages', { params });
    return data?.data;
  },
  async sendMessage(payload) {
    const { data } = await api.post('/messages', payload);
    return data?.data;
  },
  async markMessageAsRead(messageId) {
    const { data } = await api.put(`/messages/${messageId}/read`);
    return data?.data;
  },
  async uploadFile(formData) {
    const { data } = await api.post('/uploads', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    const fullUrl = data?.url?.startsWith('http') ? data.url : `${SERVER_ORIGIN}${data?.url || ''}`;
    return { ...data, url: fullUrl };
  },
  async getCourseMaterials(courseId) {
    const { data } = await api.get(`/courses/${courseId}/materials`);
    return data?.data;
  },
  async deleteMaterial(materialId) {
    const { data } = await api.delete(`/materials/${materialId}`);
    return data;
  },
  async getStats() {
    const { data } = await api.get('/dashboard/stats');
    return data?.data;
  }
};

export default educatorApi;


