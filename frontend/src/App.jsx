import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Welcome from './pages/Welcome'
import Login from './pages/Login'
import NewAssessment from './pages/NewAssessment'
import RiskResults from './pages/RiskResults'
import Dashboard from './pages/Dashboard'
import History from './pages/History'

// Protected route wrapper
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F3ED' }}>
        <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#2D5F3F' }}></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}

function AppRoutes() {
  const { user } = useAuth()

  return (
    <Routes>
      <Route path="/" element={!user ? <Welcome /> : <Navigate to="/dashboard" replace />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      <Route path="/new-assessment" element={
        <ProtectedRoute>
          <NewAssessment />
        </ProtectedRoute>
      } />
      <Route path="/results/:assessmentId" element={
        <ProtectedRoute>
          <RiskResults />
        </ProtectedRoute>
      } />
      <Route path="/history" element={
        <ProtectedRoute>
          <History />
        </ProtectedRoute>
      } />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen">
        <AppRoutes />
      </div>
    </AuthProvider>
  )
}

export default App
