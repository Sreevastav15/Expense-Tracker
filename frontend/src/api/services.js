import api from './client'

// Auth
export const authApi = {
  signup: (data) => api.post('/auth/signup', data),
  login: (email, password) => {
    const form = new URLSearchParams()
    form.append('username', email)
    form.append('password', password)
    return api.post('/auth/login', form, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })
  },
  me: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
}

// Expenses
export const expenseApi = {
  list: (params) => api.get('/expenses', { params }),
  create: (data) => api.post('/expenses', data),
  update: (id, data) => api.put(`/expenses/${id}`, data),
  delete: (id) => api.delete(`/expenses/${id}`),
  calendar: (year, month) => api.get('/expenses/calendar/monthly', { params: { year, month } }),
}

// Categories
export const categoryApi = {
  list: () => api.get('/categories'),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
}

// Budgets
export const budgetApi = {
  list: () => api.get('/budgets'),
  create: (data) => api.post('/budgets', data),
  update: (id, data) => api.put(`/budgets/${id}`, data),
  delete: (id) => api.delete(`/budgets/${id}`),
}

// Dashboard
export const dashboardApi = {
  summary: (year, month) => api.get('/dashboard/summary', { params: { year, month } }),
  yearly: () => api.get('/dashboard/yearly'),
}