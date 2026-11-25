
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LockKeyhole, Mail, HeartPulse } from 'lucide-react'

const Login = () => {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const user = await login(email, password)

      if (user.role === 'admin') {
        navigate('/')
      } else if (user.role === 'doctor') {
        navigate('/doctor-dashboard')
      } else if (user.role === 'receptionist') {
        navigate('/receptionist-dashboard')
      } else if (user.role === 'patient') {
        navigate('/patient-dashboard')
      } else {
        setError('Your account role is not recognized.')
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Login failed. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">

        <div className="flex flex-col items-center mb-8">
          <div className="bg-blue-600 text-white p-4 rounded-2xl mb-4">
            <HeartPulse size={34} />
          </div>

          <h1 className="text-3xl font-bold text-slate-800">
            MediCare
          </h1>

          <p className="text-slate-500 mt-2 text-sm">
            Smart Hospital Management System
          </p>
        </div>

        <div className="mb-7">
          <h2 className="text-2xl font-semibold text-slate-800">
            Welcome Back
          </h2>

          <p className="text-slate-500 text-sm mt-1">
            Login to access your account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Email Address
            </label>

            <div className="relative">
              <Mail
                size={19}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="w-full border border-slate-300 rounded-xl py-3 pl-11 pr-4 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Password
            </label>

            <div className="relative">
              <LockKeyhole
                size={19}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="w-full border border-slate-300 rounded-xl py-3 pl-11 pr-4 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 border border-red-200 rounded-lg p-3 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {loading ? 'Logging in...' : 'Login to Account'}
          </button>

        </form>

        <p className="text-center text-xs text-slate-400 mt-8">
          MediCare © 2026. All rights reserved.
        </p>

      </div>
    </div>
  )
}

export default Login
