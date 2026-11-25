
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react'

import API from '../services/api'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Check existing login when application starts
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('medicare_token')

      if (!token) {
        setLoading(false)
        return
      }

      try {
        const response = await API.get('/auth/me')
        setUser(response.data.user)
      } catch (error) {
        localStorage.removeItem('medicare_token')
        localStorage.removeItem('medicare_user')
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  // Login
  const login = async (email, password) => {
    const response = await API.post('/auth/login', {
      email,
      password,
    })

    const { token, user } = response.data

    localStorage.setItem('medicare_token', token)
    localStorage.setItem('medicare_user', JSON.stringify(user))

    setUser(user)

    return user
  }

  // Register
  const register = async (userData) => {
    const response = await API.post('/auth/register', userData)

    const { token, user } = response.data

    localStorage.setItem('medicare_token', token)
    localStorage.setItem('medicare_user', JSON.stringify(user))

    setUser(user)

    return user
  }

  const updateUser = (updatedUser) => {
    setUser(updatedUser)
    localStorage.setItem('medicare_user', JSON.stringify(updatedUser))
  }

  // Logout
  const logout = () => {
    localStorage.removeItem('medicare_token')
    localStorage.removeItem('medicare_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateUser,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// Custom authentication hook
export const useAuth = () => {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }

  return context
}
