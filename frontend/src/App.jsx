import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import ExpensesPage from './pages/ExpensesPage'
import BudgetsPage from './pages/BudgetsPage'
import CategoriesPage from './pages/CategoriesPage'
import CalendarPage from './pages/CalendarPage'
import ProfilePage from './pages/ProfilePage'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 text-sm font-body">Loading Spendly…</p>
      </div>
    </div>
  )
  return user ? children : <Navigate to="/login" replace />
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? <Navigate to="/" replace /> : children
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<PublicRoute><AuthPage mode="login" /></PublicRoute>} />
        <Route path="/signup" element={<PublicRoute><AuthPage mode="signup" /></PublicRoute>} />
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="expenses" element={<ExpensesPage />} />
          <Route path="budgets" element={<BudgetsPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}