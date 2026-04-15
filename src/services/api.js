import axios from 'axios'

const BASE_URL = 'http://localhost:5000'

const API = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
})

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('mh_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('mh_token')
      localStorage.removeItem('mh_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export const getFileUrl = (path) => {
  if (!path) return ''
  if (path.startsWith('http')) return path
  return `${BASE_URL}${path}`
}

export const authAPI = {
  register:      (d) => API.post('/auth/register', d),
  login:         (d) => API.post('/auth/login', d),
  getMe:         ()  => API.get('/auth/me'),
  updateProfile: (d) => API.put('/auth/profile', d),
}
export const mentorAPI = {
  getAll:        (p)  => API.get('/mentors', { params: p }),
  getOne:        (id) => API.get(`/mentors/${id}`),
  getMyProfile:  ()   => API.get('/mentors/profile/me'),
  updateProfile: (d)  => API.put('/mentors/profile', d),
}
export const followAPI = {
  follow:       (id) => API.post(`/follow/${id}`),
  unfollow:     (id) => API.delete(`/follow/${id}`),
  accept:       (id) => API.put(`/follow/${id}/accept`),
  reject:       (id) => API.put(`/follow/${id}/reject`),
  getFollowing: ()   => API.get('/follow/following'),
  getRequests:  ()   => API.get('/follow/requests'),
  checkFollow:  (id) => API.get(`/follow/check/${id}`),
}
export const sessionAPI = {
  book:         (d)     => API.post('/sessions', d),
  getMy:        (p)     => API.get('/sessions', { params: p }),
  getOne:       (id)    => API.get(`/sessions/${id}`),
  updateStatus: (id, d) => API.put(`/sessions/${id}/status`, d),
  cancel:       (id)    => API.put(`/sessions/${id}/cancel`),
}
export const feedbackAPI = {
  submit:            (d)  => API.post('/feedback', d),
  getMentorFeedback: (id) => API.get(`/feedback/${id}`),
  delete:            (id) => API.delete(`/feedback/${id}`),
}
export const chatAPI = {
  getConversations:    ()      => API.get('/chat/conversations'),
  getConversationWith: (id)    => API.get(`/chat/conversation-with/${id}`),
  getMessages:         (id)    => API.get(`/chat/${id}/messages`),
  sendMessage:         (id, d) => API.post(`/chat/${id}/messages`, d),
}
export const certAPI = {
  getMyCerts:        ()      => API.get('/certifications/my'),
  getMentorCerts:    (id)    => API.get(`/certifications/mentor/${id}`),
  add:               (d)     => API.post('/certifications', d),              // JSON body
  delete:            (id)    => API.delete(`/certifications/${id}`),
  verify:            (id)    => API.put(`/certifications/${id}/verify`),
  updateProfilePhoto:(url)   => API.put('/certifications/profile-photo', { profilePhoto: url }),
}
export const adminAPI = {
  getAnalytics: ()   => API.get('/users/analytics'),
  getUsers:     (p)  => API.get('/users', { params: p }),
  toggleUser:   (id) => API.put(`/users/${id}/toggle`),
  deleteUser:   (id) => API.delete(`/users/${id}`),
}
export default API
