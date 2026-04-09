import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

// Auth API
export const authAPI = {
  register: (userData) => api.post("/auth/register", userData),
  login: (credentials) => api.post("/auth/login", credentials),
  getCurrentUser: () => api.get("/auth/me"),
};

// Transaction API
export const transactionAPI = {
  getTransactions: (params = {}) => api.get("/transactions", { params }),
  createTransaction: (transactionData) =>
    api.post("/transactions", transactionData),
  updateTransaction: (id, transactionData) =>
    api.put(`/transactions/${id}`, transactionData),
  deleteTransaction: (id) => api.delete(`/transactions/${id}`),
  getSpendingSummary: () => api.get("/transactions/summary"),
};

// Admin API
export const adminAPI = {
  getUsers: (params = {}) => api.get("/admin/users", { params }),
  createUser: (userData) => api.post("/admin/users", userData),
  updateUser: (id, userData) => api.put(`/admin/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getUserStats: () => api.get("/admin/stats"),
};

export default api;
