import axios from 'axios';

const API_BASE_URL = 'https://shikkha-com.onrender.com';

const checkoutApi = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Add auth token to requests
checkoutApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Unified checkout session creation (supports optional shippingInfo for books/cart)
export const createCheckoutSession = async (type, itemId, studentId, shippingInfo) => {
  try {
    const response = await checkoutApi.post('/payments/create-checkout-session', {
      type,
      itemId,
      studentId,
      ...(shippingInfo ? { shippingInfo } : {})
    });
    return response.data;
  } catch (error) {
    console.error('Checkout session creation error:', error);
    throw error.response?.data || error;
  }
};

// Legacy course payment (for backward compatibility)
export const createCoursePaymentSession = async (courseId, studentId) => {
  try {
    const response = await checkoutApi.post('/payments/course', {
      courseId,
      studentId
    });
    return response.data;
  } catch (error) {
    console.error('Course payment session error:', error);
    throw error.response?.data || error;
  }
};

// Legacy book payment (for backward compatibility)
export const createBookPaymentSession = async (bookId, studentId, quantity, shippingInfo) => {
  try {
    const response = await checkoutApi.post('/payments/book', {
      bookId,
      studentId,
      quantity,
      shippingInfo
    });
    return response.data;
  } catch (error) {
    console.error('Book payment session error:', error);
    throw error.response?.data || error;
  }
};

// Free course enrollment
export const enrollInFreeCourse = async (courseId, studentId) => {
  try {
    const response = await checkoutApi.post('/payments/course/free', {
      courseId,
      studentId
    });
    return response.data;
  } catch (error) {
    console.error('Free course enrollment error:', error);
    throw error.response?.data || error;
  }
};

export default checkoutApi;
