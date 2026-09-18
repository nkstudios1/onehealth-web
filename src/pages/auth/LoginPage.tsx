import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import Spinner from '../../components/Spinner'

export default function LoginPage() {
  const { login, isLoading } = useAuth()
  const navigate = useNavigate()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    try {
      await login(identifier.trim(), password)
      // After login, redirect based on user type stored in context
      const raw = localStorage.getItem('user')
      const user = raw ? JSON.parse(raw) : null
      if (user?.must_change_password) {
        navigate('/change-password')
      } else if (user?.user_type === 'patient') {
        navigate('/patient')
      } else if (user?.user_type === 'hospital_staff') {
        navigate('/staff')
      } else {
        navigate('/patient')
      }
    } catch (err) {
      toast.error((err as Error).message)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-gray-900">OneHealth</span>
          </div>
        </div>

        <div className="card">
          <h1 className="text-xl font-semibold text-gray-900 mb-1">Welcome back</h1>
          <p className="text-sm text-gray-500 mb-6">Sign in with your email or phone number</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="identifier" className="block text-sm font-medium text-gray-700 mb-1">
                Email or phone number
              </label>
              <input
                id="identifier"
                type="text"
                className="input"
                placeholder="jane@example.com or 08012345678"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                autoComplete="username"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <button type="submit" disabled={isLoading} className="btn-primary w-full flex items-center justify-center gap-2">
              {isLoading && <Spinner size="sm" />}
              Sign in
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            New patient?{' '}
            <Link to="/register/patient" className="font-medium text-primary-600 hover:text-primary-700">
              Create an account
            </Link>
          </p>
          <p className="mt-2 text-center text-sm text-gray-600">
            Registering a hospital?{' '}
            <Link to="/register/hospital" className="font-medium text-primary-600 hover:text-primary-700">
              Register hospital
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
