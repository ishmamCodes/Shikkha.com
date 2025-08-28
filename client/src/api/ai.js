// client/services/ai.js
import axios from 'axios';

// Ensure we always have the /api prefix
const getBaseURL = () => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE || 'http://localhost:4000/api';
  // If the base URL doesn't end with /api, add it
  return baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
};

const BASE = getBaseURL();

export const askAI = async (question, token) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const { data } = await axios.post(
    `${BASE}/ai/query`,
    { question },
    { headers, withCredentials: true }
  );

  return data;
};

export default { askAI };
