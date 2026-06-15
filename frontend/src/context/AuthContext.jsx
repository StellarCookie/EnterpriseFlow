// 1. Add "useContext" to your imports at the top
import { createContext, useState, useEffect, useCallback, useContext } from 'react'
import api from '../api'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('ef_user')
      return stored ? JSON.parse(stored) : null
    } catch { return null }
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('ef_token')
    if (token) {
      api.get('/auth/me')
        .then(res => {
          setUser(res.data.user)
          localStorage.setItem('ef_user', JSON.stringify(res.data.user))
        })
        .catch(() => {
          localStorage.removeItem('ef_token')
          localStorage.removeItem('ef_user')
          setUser(null)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    const { token, user: userData } = res.data
    localStorage.setItem('ef_token', token)
    localStorage.setItem('ef_user', JSON.stringify(userData))
    setUser(userData)
    return userData
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('ef_token')
    localStorage.removeItem('ef_user')
    setUser(null)
  }, [])

  const isManager = user?.role === 'Manager'
  const isAngajat = user?.role === 'Angajat'

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isManager, isAngajat }}>
      {children}
    </AuthContext.Provider>
  )
}

// 2. ADD THIS HOOK AT THE BOTTOM
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}