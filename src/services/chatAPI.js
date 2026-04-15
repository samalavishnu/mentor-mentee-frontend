import API from './api'

export const chatAPI = {
  getConversations:       ()   => API.get('/chat/conversations'),
  getOrCreate:            (id) => API.post(`/chat/conversation/${id}`),
  getMessages:            (convId, page = 1) => API.get(`/chat/${convId}/messages`, { params: { page, limit: 40 } }),
  sendMessage:            (convId, text) => API.post(`/chat/${convId}/messages`, { text }),
  getUnreadCount:         ()   => API.get('/chat/unread'),
}
