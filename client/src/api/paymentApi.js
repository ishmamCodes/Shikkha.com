import axios from 'axios';

const API_BASE_URL = 'https://shikkha-com.onrender.com';

const paymentApi = {
  // Course payment
  createCoursePaymentSession: async (courseId, studentId) => {
    const response = await axios.post(`${API_BASE_URL}/payments/course`, {
      courseId,
      studentId
    });
    return response.data;
  },

  // Free course enrollment
  enrollInFreeCourse: async (courseId, studentId) => {
    const response = await axios.post(`${API_BASE_URL}/payments/course/free`, {
      courseId,
      studentId
    });
    return response.data;
  },

  // Book payment
  createBookPaymentSession: async (bookId, studentId, quantity, shippingInfo) => {
    const response = await axios.post(`${API_BASE_URL}/payments/book`, {
      bookId,
      studentId,
      quantity,
      shippingInfo
    });
    return response.data;
  },

  // Handle payment success
  handlePaymentSuccess: async (sessionId) => {
    const response = await axios.post(`${API_BASE_URL}/payments/success`, {
      sessionId
    });
    return response.data;
  }
};

export default paymentApi;
