import { createContext, useState, useEffect, useCallback, useContext } from 'react'
import api from '../api'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = sessionStorage.getItem('ef_user')
      return stored ? JSON.parse(stored) : null
    } catch { return null }
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = sessionStorage.getItem('ef_token')
    if (token) {
      api.get('/auth/me')
        .then(res => {
          setUser(res.data.user)
          sessionStorage.setItem('ef_user', JSON.stringify(res.data.user))
        })
        .catch(() => {
          sessionStorage.removeItem('ef_token')
          sessionStorage.removeItem('ef_user')
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
    sessionStorage.setItem('ef_token', token)
    sessionStorage.setItem('ef_user', JSON.stringify(userData))
    setUser(userData)
    return userData
  }, [])

  const logout = useCallback(async () => {
    try {
      // Trimitem cererea către server pentru a fi salvat evenimentul în AuditLog
      await api.post('/auth/logout')
    } catch (err) {
      console.error('Eroare la trimiterea delogării în audit:', err)
    } finally {
      // Blocul finally rulează garantat, curățând sesiunea din browser
      sessionStorage.removeItem('ef_token')
      sessionStorage.removeItem('ef_user')
      setUser(null)
    }
  }, [])

  const isManager = user?.role === 'Manager'
  const isAngajat = user?.role === 'Angajat'
  const mustChangePassword = user?.mustChangePassword === true

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isManager, isAngajat, mustChangePassword }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}