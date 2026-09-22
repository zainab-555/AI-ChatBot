import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://ai-chatbot-1oww.onrender.com';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 45000, // 45 seconds timeout for LLM generation
});

/**
 * Send user prompt & optional file/photo attachment to backend
 * @param {string} prompt - The user message
 * @param {object} [attachment] - Optional attachment { base64, mimeType, fileName, fileSize }
 * @param {string} [sessionId] - Conversation session identifier
 * @param {string} [sessionTitle] - Conversation title
 * @returns {Promise<{success: boolean, response: string, sessionId?: string, sessionTitle?: string, data?: any}>}
 */
export const sendChatMessage = async (prompt, attachment = null, sessionId = null, sessionTitle = null) => {
  try {
    const res = await apiClient.post('/api/chat', {
      prompt,
      attachment,
      sessionId,
      sessionTitle,
    });
    return res.data;
  } catch (error) {
    if (error.response) {
      const serverError = error.response.data?.error || error.response.data?.message;
      throw new Error(serverError || `Server returned error ${error.response.status}`);
    } else if (error.request) {
      throw new Error(
        'Could not connect to backend server. Make sure your Express server is running on http://localhost:5000'
      );
    } else {
      throw new Error(error.message || 'An unexpected error occurred while sending message.');
    }
  }
};

/**
 * Fetch all conversation sessions for the sidebar
 * @returns {Promise<Array<{sessionId: string, title: string, lastMessageAt: string, messageCount: number}>>}
 */
export const fetchSessions = async () => {
  try {
    const res = await apiClient.get('/api/sessions');
    return res.data?.sessions || [];
  } catch (error) {
    console.warn('Failed to fetch sessions:', error.message);
    return [];
  }
};

/**
 * Fetch all messages for a specific conversation session
 * @param {string} sessionId
 * @returns {Promise<Array>}
 */
export const fetchSessionMessages = async (sessionId) => {
  try {
    const res = await apiClient.get(`/api/sessions/${sessionId}`);
    return res.data?.messages || [];
  } catch (error) {
    console.warn(`Failed to fetch messages for session ${sessionId}:`, error.message);
    return [];
  }
};

/**
 * Delete an entire conversation session
 * @param {string} sessionId
 * @returns {Promise<boolean>}
 */
export const deleteSession = async (sessionId) => {
  try {
    await apiClient.delete(`/api/sessions/${sessionId}`);
    return true;
  } catch (error) {
    console.error(`Failed to delete session ${sessionId}:`, error.message);
    return false;
  }
};

/**
 * Check backend connection status
 * @returns {Promise<boolean>}
 */
export const checkServerHealth = async () => {
  try {
    const res = await apiClient.get('/api/health', { timeout: 3000 });
    return res.status === 200;
  } catch (err) {
    return false;
  }
};
