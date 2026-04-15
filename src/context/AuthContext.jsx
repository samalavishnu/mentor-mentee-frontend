import React, { createContext, useState, useEffect, useCallback } from 'react'
import { authAPI } from '../services/api'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,  setUser]  = useState(() => { try { return JSON.parse(localStorage.getItem('mh_user')) } catch { return null } })
  const [token, setToken] = useState(() => localStorage.getItem('mh_token'))
  const [loading, setLoading] = useState(true)

  const fetchMe = useCallback(async () => {
    if (!token) { setLoading(false); return }
    try {
      const { data } = await authAPI.getMe()
      setUser(data.user)
      localStorage.setItem('mh_user', JSON.stringify(data.user))
    } catch { logout() }
    finally { setLoading(false) }
  }, [token])

  useEffect(() => { fetchMe() }, [fetchMe])

  const login = (data) => {
    setToken(data.token); setUser(data.user)
    localStorage.setItem('mh_token', data.token)
    localStorage.setItem('mh_user', JSON.stringify(data.user))
  }

  const logout = () => {
    setToken(null); setUser(null)
    localStorage.removeItem('mh_token')
    localStorage.removeItem('mh_user')
  }

  const updateUser = (u) => {
    setUser(u)
    localStorage.setItem('mh_user', JSON.stringify(u))
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, updateUser, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  )
}
