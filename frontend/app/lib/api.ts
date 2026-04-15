import axios from 'axios'
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
  withCredentials: true,
  timeout: 30000,
  // headers: { 'Content-Type': 'application/json' },
})

// ── Request interceptor: attach token ─────────────────────
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ── Response interceptor: handle 401 ─────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Clear stored auth and redirect
      localStorage.removeItem('resumeai-auth')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Contact API methods
export const getContactCategories = () => api.get('/api/contacts/categories');
export const getContacts = (propertyId: number) => api.get(`/api/contacts?propertyId=${propertyId}`);

api.defaults.headers.post['Content-Type'] = 'application/json';
api.defaults.headers.put['Content-Type'] = 'application/json';

export default api
