import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const axiosInstance = axios.create({
  baseURL: API_URL,
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  register: (data: { email: string; password: string; name: string }) =>
    axiosInstance.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    axiosInstance.post('/auth/login', data),
  getCurrentUser: () => axiosInstance.get('/auth/me'),
};

export const expenseAPI = {
  getExpenses: (params?: any) => axiosInstance.get('/expenses', { params }),
  getExpenseById: (id: string) => axiosInstance.get(`/expenses/${id}`),
  createExpense: (data: any) => axiosInstance.post('/expenses', data),
  updateExpense: (id: string, data: any) => axiosInstance.put(`/expenses/${id}`, data),
  deleteExpense: (id: string) => axiosInstance.delete(`/expenses/${id}`),
};

export const categoryAPI = {
  getCategories: () => axiosInstance.get('/categories'),
  getCategoryById: (id: string) => axiosInstance.get(`/categories/${id}`),
  createCategory: (data: any) => axiosInstance.post('/categories', data),
  updateCategory: (id: string, data: any) => axiosInstance.put(`/categories/${id}`, data),
  deleteCategory: (id: string) => axiosInstance.delete(`/categories/${id}`),
};

export const budgetAPI = {
  getBudgets: (params?: any) => axiosInstance.get('/budgets', { params }),
  getBudgetById: (id: string) => axiosInstance.get(`/budgets/${id}`),
  createBudget: (data: any) => axiosInstance.post('/budgets', data),
  updateBudget: (id: string, data: any) => axiosInstance.put(`/budgets/${id}`, data),
  deleteBudget: (id: string) => axiosInstance.delete(`/budgets/${id}`),
};

export const dashboardAPI = {
  getStats: (params?: any) => axiosInstance.get('/dashboard/stats', { params }),
};
