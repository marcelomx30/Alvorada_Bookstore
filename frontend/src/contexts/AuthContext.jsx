import { API_URL } from '../config'
import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await axios.get('${API_URL}/api/auth/me', {
        withCredentials: true
      })
      setUser(response.data)
    } catch (error) {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    const response = await axios.post('${API_URL}/api/auth/login', 
      { email, password },
      { withCredentials: true }
    )
    setUser(response.data.user)
    return response.data
  }

  const register = async (name, email, phone, password) => {
    const response = await axios.post('${API_URL}/api/auth/register',
      { name, email, phone, password },
      { withCredentials: true }
    )
    setUser(response.data.user)
    return response.data
  }

  const logout = async () => {
    await axios.post('${API_URL}/api/auth/logout', {}, {
      withCredentials: true
    })
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, checkAuth }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
