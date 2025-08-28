// client/services/ai.js
import axios from 'axios';

const BASE = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE || 'http://localhost:4000/api';

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
