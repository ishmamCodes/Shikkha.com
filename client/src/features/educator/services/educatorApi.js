import axios from 'axios';

const SERVER_ORIGIN = 'https://shikkha-com.onrender.com';
const api = axios.create({ baseURL: `${SERVER_ORIGIN}/api` });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const educatorApi = {
  async getProfile(educatorUserId) {
    const { data } = await api.get(`/api/educators/${educatorUserId}`);
    return data?.data;
  },
  async updateProfile(educatorUserId, payload) {
    const { data } = await api.put(`/api/educators/${educatorUserId}`, payload);
    return data?.data;
  },
  async updatePassword(educatorUserId, newPassword) {
    const { data } = await api.put(`/api/educators/${educatorUserId}/password`, newPassword);
    return data;
  },
  async requestEmailChange(userId, newEmail) {
    const { data } = await api.post(`/api/educators/${userId}/email-change`, { newEmail });
    return data?.data;
  },
  async getMyEmailChangeRequests() {
    const { data } = await api.get('/api/educators/me/email-change');
    return data?.data || [];
  },
  async createCourse(payload) {
    const { data } = await api.post('/api/courses', payload);
    return data?.data;
  },
  async updateCourse(courseId, payload) {
    const { data } = await api.put(`/api/courses/${courseId}`, payload);
    return data?.data;
  },
  async deleteCourse(courseId) {
    const { data } = await api.delete(`/api/courses/${courseId}`);
    return data;
  },
  async getCourseStudents(courseId) {
    const { data } = await api.get(`/api/courses/${courseId}/students`);
    return data?.data;
  },
  async removeStudent(courseId, studentId) {
    const { data } = await api.delete(`/api/courses/${courseId}/students/${studentId}`);
    return data;
  },
  async getAppointments(educatorId) {
    const { data } = await api.get(`/api/appointments/educator/${educatorId}`);
    return data?.data;
  },
  async updateAppointmentStatus(appointmentId, status, notes) {
    const { data } = await api.patch(`/api/appointments/${appointmentId}`, { status, notes });
    return data?.data;
  },
  async deleteAppointment(appointmentId) {
    const { data } = await api.delete(`/api/appointments/${appointmentId}`);
    return data;
  },
  async createAppointmentSlot(payload) {
    const { data } = await api.post('/api/appointments/slots', payload);
    return data?.data;
  },
  async getAppointmentSlots(educatorId) {
    const { data } = await api.get(`/api/appointments/slots/${educatorId}`);
    return data?.data;
  },
  async deleteAppointmentSlot(slotId) {
    const { data } = await api.delete(`/api/appointments/slots/${slotId}`);
    return data;
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
  async uploadAvatar(formData) {
    const { data } = await api.post('/profile/avatar', formData);
    const fullUrl = data?.avatarUrl?.startsWith('http') ? data.avatarUrl : `${SERVER_ORIGIN}${data?.avatarUrl || ''}`;
    return { ...data, avatarUrl: fullUrl };
  },
  async getCourseMaterials(courseId) {
    const { data } = await api.get(`/api/courses/${courseId}/materials`);
    return data?.data;
  },
  async deleteMaterial(materialId) {
    const { data } = await api.delete(`/materials/${materialId}`);
    return data;
  },
  async getStats() {
    const { data } = await api.get('/dashboard/stats');
    return data?.data;
  },
  async getEarnings(educatorId) {
    const { data } = await api.get(`/api/educators/${educatorId}/earnings`);
    return data?.data;
  },
  async createExam(payload) {
    const { data } = await api.post('/api/exams', payload);
    return data?.data;
  },
  async getEducatorExams(educatorId) {
    const { data } = await api.get(`/api/exams/educator/${educatorId}`);
    return data?.data;
  },
  async getCourseExams(courseId) {
    const { data } = await api.get(`/api/exams/course/${courseId}`);
    return data?.data;
  },
  async getExamById(examId) {
    const { data } = await api.get(`/api/exams/${examId}?includeAnswers=true`);
    return data?.data;
  },
  async updateExam(examId, payload) {
    const { data } = await api.put(`/api/exams/${examId}`, payload);
    return data?.data;
  },
  async deleteExam(examId) {
    const { data } = await api.delete(`/api/exams/${examId}`);
    return data;
  },
  async getEducatorEvaluations(educatorId) {
    const { data } = await api.get(`/evaluations/educator/${educatorId}`);
    return data?.data;
  },
  async getCourseEvaluations(courseId) {
    const { data } = await api.get(`/evaluations/course/${courseId}`);
    return data?.data;
  }
};

export default educatorApi;


