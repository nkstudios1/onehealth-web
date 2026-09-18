import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { api, extractError, saveTokens } from '../../lib/api'
import { saveUser } from '../../lib/auth'
import Spinner from '../../components/Spinner'
import { useAuth } from '../../context/AuthContext'

export default function RegisterPatientPage() {
  const navigate = useNavigate()
  const { refreshMe } = useAuth()
  const [loading, setLoading] = useState(false)

  // Required fields for backend
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [fullName, setFullName] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    
    setLoading(true)
    
    const registrationData = {
      email: email.trim().toLowerCase(),
      password,
      phone_number: phone.trim(),
      full_name: fullName.trim(),
      date_of_birth: dateOfBirth,
      gender: '',
      blood_type: '',
    }

    console.log('Attempting registration...', { email: registrationData.email, phone: registrationData.phone_number })
    
    try {
      // Step 1: Register
      const registerResponse = await api.post('/auth/register/patient/', registrationData)
      console.log('Registration response:', registerResponse.data)

      toast.success('Account created! Logging you in...')

      // Step 2: Auto-login
      try {
        console.log('Attempting auto-login...')
        const loginResponse = await api.post('/auth/login/', {
          identifier: registrationData.email,
          password: registrationData.password,
        })
        console.log('Login response:', loginResponse.data)

        const { user, tokens } = loginResponse.data.data
        saveTokens(tokens.access, tokens.refresh)
        saveUser(user)
        await refreshMe()

        toast.success('Welcome to OneHealth! 🎉')
        navigate('/patient')
      } catch (loginErr) {
        // Registration succeeded but auto-login failed
        console.error('Auto-login failed:', loginErr)
        toast.success('Account created! Please sign in.')
        navigate('/login')
      }
    } catch (err) {
      // Registration failed
      const errorMsg = extractError(err)
      console.error('Registration error:', err)
      
      // Check if it's a network/CORS error
      if (err instanceof Error && err.message.includes('Network Error')) {
        toast.error('Cannot connect to server. Please check your internet connection.')
      } else {
        toast.error(errorMsg)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-gray-900">OneHealth</span>
          </div>
        </div>

        <div className="card">
          <h1 className="text-xl font-semibold text-gray-900 mb-1">Create your account</h1>
          <p className="text-sm text-gray-500 mb-6">
            Quick setup to get started. You can add more details later.
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Basic Info */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                className="input"
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                required
                autoComplete="name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date of Birth <span className="text-red-500">*</span>
              </label>
              <input
                className="input"
                type="date"
                value={dateOfBirth}
                onChange={e => setDateOfBirth(e.target.value)}
                required
              />
            </div>
            
            {/* Contact Info */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                className="input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                className="input"
                type="tel"
                placeholder="08012345678"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                required
                autoComplete="tel"
              />
              <p className="text-xs text-gray-400 mt-1">
                Used by hospitals to identify you
              </p>
            </div>
            
            {/* Security */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                className="input"
                type="password"
                placeholder="At least 8 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>

            <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs text-blue-800">
              <strong>What's next?</strong> After registration, you can add more details like blood type, medical history, and emergency contacts.
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading && <Spinner size="sm" />}
              Create account
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-700">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
