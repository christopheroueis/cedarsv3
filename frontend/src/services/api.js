import axios from 'axios'

// API base URL - change in production
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json'
    }
})

// Request interceptor - add auth token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('climatecredit_token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

// Response interceptor - handle errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired - clear storage and redirect to login
            localStorage.removeItem('climatecredit_token')
            localStorage.removeItem('climatecredit_user')
            localStorage.removeItem('climatecredit_mfi')
            window.location.href = '/login'
        }
        return Promise.reject(error)
    }
)

// Auth API
export const authAPI = {
    login: async (mfiId, username, password) => {
        const response = await api.post('/api/auth/login', { mfiId, username, password })
        if (response.data.token) {
            localStorage.setItem('climatecredit_token', response.data.token)
        }
        return response.data
    },

    verify: async (token) => {
        const response = await api.post('/api/auth/verify', { token })
        return response.data
    },

    getMfis: async () => {
        const response = await api.get('/api/auth/mfis')
        return response.data
    },

    logout: () => {
        localStorage.removeItem('climatecredit_token')
        localStorage.removeItem('climatecredit_user')
        localStorage.removeItem('climatecredit_mfi')
    }
}

// Assessments API
export const assessmentsAPI = {
    createAssessment: async (data) => {
        const response = await api.post('/api/assessments/assess-loan', data)
        return response.data
    },

    getAssessments: async (mfiId, params = {}) => {
        const response = await api.get(`/api/assessments/mfi/${mfiId}`, { params })
        return response.data
    },

    getAssessment: async (id) => {
        const response = await api.get(`/api/assessments/${id}`)
        return response.data
    },

    analyzeAssessment: async (id, data) => {
        const response = await api.post(`/api/assessments/${id}/analyze`, data)
        return response.data 
    },

    recordDecision: async (id, decision, notes) => {
        const response = await api.patch(`/api/assessments/${id}/decision`, { decision, notes })
        return response.data
    }
}

// Climate Data API
export const climateAPI = {
    getClimateData: async (lat, lng) => {
        const response = await api.get(`/api/climate-data/${lat}/${lng}`)
        return response.data
    },

    calculateRiskScore: async (data) => {
        const response = await api.post('/api/climate-data/risk-score', data)
        return response.data
    },

    getRegions: async () => {
        const response = await api.get('/api/climate-data/regions/all')
        return response.data
    }
}

// Dashboard API
export const dashboardAPI = {
    getAnalytics: async (mfiId) => {
        const response = await api.get(`/api/dashboard/${mfiId}`)
        return response.data
    },

    exportCSV: async (mfiId) => {
        const response = await api.get(`/api/dashboard/${mfiId}/export`, {
            responseType: 'blob'
        })
        return response.data
    }
}

// Health check
export const healthCheck = async () => {
    try {
        const response = await api.get('/health')
        return response.data
    } catch {
        return { status: 'offline' }
    }
}

// AI/Extraction API
export const aiAPI = {
    extractFromTranscript: async (transcript) => {
        const response = await api.post('/api/v2/ai/extract', { transcript })
        return response.data
    }
}

export default api
