import axios from 'axios';

const SERVER_ORIGIN = 'http://localhost:4000';
const api = axios.create({ baseURL: `${SERVER_ORIGIN}/api` });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/**
 * Messaging API helpers for sending and retrieving messages.
 * Intended to be used by course pages or any page needing messaging.
 */
const messagingApi = {
  /**
   * Send a message to a specific user (e.g., course instructor)
   * @param {string} receiverId - the User._id of the recipient
   * @param {string} content - message text
   * @param {string} messageType - optional, defaults to 'text'
   */
  async sendMessage(receiverId, content, messageType = 'text') {
    const { data } = await api.post('/messages', { receiverId, content, messageType });
    return data;
  },

  /**
   * Fetch conversation between two user IDs
   */
  async getConversation(userId1, userId2) {
    const { data } = await api.get(`/messages/conversation/${userId1}/${userId2}`);
    return data;
  },

  /**
   * Get inbox (last message per conversation for current auth user)
   */
  async getInbox() {
    const { data } = await api.get('/messages/inbox');
    return data;
  },

  /**
   * Helper to create a deep link to the messenger page focused on a user
   */
  buildMessengerLink(receiverId) {
    const url = new URL(window.location.origin);
    url.pathname = '/messenger';
    url.searchParams.set('user', receiverId);
    return url.pathname + url.search;
  },
};

export default messagingApi;
