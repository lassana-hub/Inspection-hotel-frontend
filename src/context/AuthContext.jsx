import { createContext, useContext, useState, useEffect } from 'react'
import Cookies from 'js-cookie'
import api from '../api/axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = Cookies.get('token')
    const savedUser = Cookies.get('user')
    if (token && savedUser) {
      try {
        const parsed = JSON.parse(savedUser)
        setUser(parsed)
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      } catch {
        Cookies.remove('token')
        Cookies.remove('user')
      }
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    Cookies.set('token', data.token, { expires: 7 })
    Cookies.set('user', JSON.stringify(data.user), { expires: 7 })
    api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
    setUser(data.user)
    return data.user
  }

  const signup = async (formData) => {
    const { data } = await api.post('/auth/signup', formData)
    Cookies.set('token', data.token, { expires: 7 })
    Cookies.set('user', JSON.stringify(data.user), { expires: 7 })
    api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
    setUser(data.user)
    return data.user
  }

  const logout = async () => {
    try { await api.post('/auth/logout') } catch { /* token déjà invalide */ }
    Cookies.remove('token')
    Cookies.remove('user')
    delete api.defaults.headers.common['Authorization']
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, signup }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
