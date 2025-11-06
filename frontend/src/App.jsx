import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import BookCatalog from './pages/BookCatalog'
import MyRentals from './pages/MyRentals'
import ManageBooks from './pages/admin/ManageBooks'
import ManageRentals from './pages/admin/ManageRentals'
import ManageUsers from './pages/admin/ManageUsers'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-alvorada-blue"></div>
      </div>
    )
  }
  
  if (!user) {
    return <Navigate to="/login" />
  }
  
  return children
}

function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <BookCatalog />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-rentals"
          element={
            <ProtectedRoute>
              <MyRentals />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/books"
          element={
            <ProtectedRoute>
              <ManageBooks />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/rentals"
          element={
            <ProtectedRoute>
              <ManageRentals />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute>
              <ManageUsers />
            </ProtectedRoute>
          }
        />
      </Routes>
    </ToastProvider>
  )
}

export default App
