import axios from "axios"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    console.log("DEBUG API: Sending request to:", config.url, "with token:", !!token)
    return config
  },
  (error) => {
    console.error("DEBUG API: Request interceptor error:", error)
    return Promise.reject(error)
  },
)

// Handle auth errors
api.interceptors.response.use(
  (response) => {
    console.log("DEBUG API: Received response from:", response.config.url, "Status:", response.status)
    return response
  },
  (error) => {
    console.error(
      "DEBUG API: Error in response from:",
      error.config?.url,
      "Error:",
      error.response?.status,
      error.response?.data || error.message,
    )

    if (error.response?.status === 401 || error.response?.status === 403) {
      console.log("DEBUG API: Auth error, clearing tokens and redirecting to login")
      localStorage.removeItem("access_token")
      localStorage.removeItem("user")
      document.cookie = "user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
      window.location.href = "/login"
    }
    return Promise.reject(error)
  },
)

// Auth API
export const authAPI = {
  login: async (username: string, password: string) => {
    const response = await api.post("/auth/login", { username, password })
    return response.data
  },

  getCurrentUser: async () => {
    const response = await api.get("/auth/me")
    return response.data
  },
}

// Dataset API
export const datasetAPI = {
  upload: async (file: File, storeId?: string) => {
    const formData = new FormData()
    formData.append("file", file)
    if (storeId) formData.append("store_id", storeId)

    console.log("DEBUG API: Attempting to upload file:", file.name, "for store:", storeId)
    try {
      const response = await api.post("/datasets/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      console.log("DEBUG API: Upload successful, response:", response.data)
      return response.data
    } catch (error: any) {
  const message =
    error?.response?.data?.detail ||
    error?.response?.data ||
    error?.message ||
    "Unknown error occurred during upload."

  console.error("DEBUG API: Upload failed, error:", message)
  throw new Error(message)
}

  },

  getAll: async () => {
    const response = await api.get("/datasets")
    return response.data
  },

  getAllForFrontend: async () => {
    const response = await api.get("/api/datasets")
    return response.data
  },

  preview: async (datasetId: number) => {
    const response = await api.get(`/api/datasets/${datasetId}/preview`)
    return response.data
  },

  download: async (datasetId: number) => {
    const response = await api.get(`/api/datasets/${datasetId}/download`, {
      responseType: "blob",
    })
    return response.data
  },
}

// Model API
export const modelAPI = {
  train: async (datasetId: number, parameters?: any) => {
    const response = await api.post("/models/train", {
      dataset_id: datasetId,
      parameters,
    })
    return response.data
  },

  optimize: async (datasetId: number, nTrials = 50) => {
    const response = await api.post("/models/optimize", {
      dataset_id: datasetId,
      n_trials: nTrials,
    })
    return response.data
  },

  getAll: async () => {
    const response = await api.get("/models")
    return response.data
  },

  getCurrent: async () => {
    const response = await api.get("/api/models/current")
    return response.data
  },

  getCurrentMetrics: async () => {
    const response = await api.get("/api/models/current")
    return response.data
  },

  getHistory: async () => {
    const response = await api.get("/api/models/history")
    return response.data
  },

  export: async () => {
    const response = await api.post(
      "/api/models/export",
      {},
      {
        responseType: "blob",
      },
    )
    return response.data
  },

  exportModel: async () => {
    const response = await api.post(
      "/api/models/export",
      {},
      {
        responseType: "blob",
      },
    )
    return response.data
  },
}

// Prediction API
export const predictionAPI = {
  generate: async (modelId: number) => {
    const response = await api.post("/predictions/generate", {
      model_id: modelId,
    })
    return response.data
  },

  getAll: async (modelId?: number) => {
    const params = modelId ? { model_id: modelId } : {}
    const response = await api.get("/predictions", { params })
    return response.data
  },

  getAllForFrontend: async () => {
    const response = await api.get("/api/predictions")
    return response.data
  },

  getCategorized: async () => {
    const response = await api.get("/predictions/categorized")
    return response.data
  },

  getDetails: async (predictionId: number) => {
    const response = await api.get(`/api/predictions/${predictionId}/details`)
    return response.data
  },

  exportPrediction: async (predictionId: number) => {
    const response = await api.post(
      `/api/predictions/${predictionId}/export`,
      {},
      {
        responseType: "blob",
      },
    )
    return response.data
  },
}

// Visualization API
export const visualizationAPI = {
  getSalesTrend: async (datasetId: number) => {
    const response = await api.get(`/visualizations/sales-trend?dataset_id=${datasetId}`)
    return response.data
  },

  getAbcXyzHeatmap: async (datasetId: number) => {
    const response = await api.get(`/visualizations/abc-xyz-heatmap?dataset_id=${datasetId}`)
    return response.data
  },
}

// Feedback API
export const feedbackAPI = {
  submit: async (feedback: {
    dept_id?: string
    category: string
    message: string
  }) => {
    const response = await api.post("/feedback", feedback)
    return response.data
  },

  getAll: async () => {
    const response = await api.get("/feedback")
    return response.data
  },

  getUserFeedback: async () => {
    const response = await api.get("/feedback")
    return response.data
  },
}

// Dashboard API
export const dashboardAPI = {
  getStats: async () => {
    const response = await api.get("/dashboard/stats")
    return response.data
  },

  getManagerStats: async () => {
    const response = await api.get("/dashboard/manager-stats")
    return response.data
  },
}

// Admin Management API
export const adminAPI = {
  getAllUsers: async () => {
    const response = await api.get("/api/users")
    return response.data
  },

  createUser: async (userData: {
    username: string
    name: string
    email: string
    password: string
    role: string
  }) => {
    const response = await api.post("/api/users", userData)
    return response.data
  },

  updateUser: async (userId: number, userData: any) => {
    const response = await api.put(`/api/users/${userId}`, userData)
    return response.data
  },

  deleteUser: async (userId: number) => {
    const response = await api.delete(`/api/users/${userId}`)
    return response.data
  },

  resetPassword: async (userId: number) => {
    const response = await api.post(`/api/users/${userId}/reset-password`)
    return response.data
  },

  updateUserStatus: async (userId: number, status: string) => {
    const response = await api.put(`/api/users/${userId}/status`, { status })
    return response.data
  },
}

// Activities API
export const activitiesAPI = {
  getRecent: async () => {
    try {
      const response = await api.get("/api/activities/recent")
      return response.data
    } catch (error) {
      // Return empty array as fallback
      return []
    }
  },
}

// Profile API
export const profileAPI = {
  update: async (profileData: any) => {
    const response = await api.put("/api/profile", profileData)
    return response.data
  },

  changePassword: async (passwordData: {
    currentPassword: string
    newPassword: string
  }) => {
    const response = await api.put("/api/profile/change-password", passwordData)
    return response.data
  },

  updateNotifications: async (settings: any) => {
    const response = await api.put("/api/profile/notifications", settings)
    return response.data
  },
}

// Reports API
export const reportsAPI = {
  generate: async () => {
    const response = await api.post(
      "/api/reports/generate",
      {},
      {
        responseType: "blob",
      },
    )
    return response.data
  },
}

export default api
