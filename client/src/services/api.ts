import axios from 'axios'

const API_BASE_URL = '/api/v1'

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
})

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token')
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
            config.headers['x-auth-token'] = token
        }
        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

// Response interceptor to handle auth errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token')
            window.location.href = '/login'
        }
        return Promise.reject(error)
    }
)

// Auth API
export const authAPI = {
    login: (email: string, password: string) =>
        api.post('/auth/login', { email, password }),

    signup: (username: string, email: string, password: string) => {
        return api.post('/auth/signup', { username, email, password })
    },

    getMe: () => api.get('/auth/me'),

    forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),

    resetPassword: (email: string, otp: string, newPassword: string) =>
        api.post('/auth/reset-password', { email, otp, newPassword }),
}

// Users API
export const usersAPI = {
    getAll: () => api.get('/users'),
    getById: (id: string) => api.get(`/users/${id}`),
    update: (id: string, data: any) => api.put(`/users/${id}`, data),
    delete: (id: string) => api.delete(`/users/${id}`),
}

// Profile API
export const profileAPI = {
    update: (data: any) => api.put('/profile', data),
    uploadPicture: (file: File) => {
        const formData = new FormData()
        formData.append('image', file)
        return api.post('/profile/picture', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        })
    },
}

// Communities API
export const communitiesAPI = {
    create: (data: any) => api.post('/communities', data),
    getAll: () => api.get('/communities'),
    getMyCommunities: () => api.get('/communities/my'),
    getById: (id: string) => api.get(`/communities/${id}`),
    join: (id: string, inviteToken?: string) => api.post(`/communities/${id}/join`, { inviteToken }),
    leave: (id: string) => api.post(`/communities/${id}/leave`),
    getInviteLink: (id: string) => api.get(`/communities/${id}/invite`),
    updateDescription: (id: string, description: string) => api.put(`/communities/${id}/description`, { description }),
    manageMembers: (id: string, action: 'add' | 'remove', userId: string) => api.put(`/communities/${id}/members`, { action, userId }),
    delete: (id: string) => api.delete(`/communities/${id}`),
}

// Discussions API
export const discussionsAPI = {
    getAll: (params?: any) => api.get('/discussions', { params }),
    getById: (id: string) => api.get(`/discussions/${id}`),
    create: (data: any) => api.post('/discussions', data),
    update: (id: string, data: any) => api.put(`/discussions/${id}`, data),
    delete: (id: string) => api.delete(`/discussions/${id}`),
    participate: (id: string, content: string) =>
        api.post(`/discussions/${id}/comments`, { content }),
}

// Resources API
export const resourcesAPI = {
    create: (data: any) => api.post('/resources', data),
    getAll: (params?: any) => api.get('/resources', { params }),
    getById: (id: string) => api.get(`/resources/${id}`),
}

// Notifications API
export const notificationsAPI = {
    getAll: (params?: any) => api.get('/notifications', { params }),
    markAsRead: (id: string) => api.put(`/notifications/${id}/read`),
    markAllAsRead: () => api.put('/notifications/all/read'),
    getPreferences: () => api.get('/notifications/preferences'),
    updatePreferences: (preferences: { discussion?: boolean; resource?: boolean }) =>
        api.put('/notifications/preferences', preferences),
}

export default api
