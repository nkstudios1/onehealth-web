import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { api, extractError } from '../../lib/api'
import Spinner from '../../components/Spinner'

type Step = 1 | 2

export default function RegisterPatientPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>(1)
  const [loading, setLoading] = useState(false)

  // Step 1 — account credentials
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone]       = useState('')

  // Step 2 — medical profile
  const [fullName, setFullName]   = useState('')
  const [dob, setDob]             = useState('')
  const [gender, setGender]       = useState('')
  const [bloodType, setBloodType] = useState('')

  function handleStep1(e: FormEvent) {
    e.preventDefault()
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    setStep(2)
    window.scrollTo(0, 0)
  }

  async function handleStep2(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/auth/register/patient/', {
        email:        email.trim().toLowerCase(),
        password,
        phone_number: phone.trim(),
        full_name:    fullName.trim(),
        date_of_birth: dob,
        gender,
        blood_type:   bloodType,
      })
      toast.success('Account created! Please sign in.')
      navigate('/login')
    } catch (err) {
      toast.error(extractError(err))
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

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6 justify-center">
          <StepDot n={1} current={step} label="Your account" />
          <div className="h-px w-8 bg-gray-300" />
          <StepDot n={2} current={step} label="Your profile" />
        </div>

        <div className="card">

          {step === 1 && (
            <>
              <h1 className="text-xl font-semibold text-gray-900 mb-1">Create your account</h1>
              <p className="text-sm text-gray-500 mb-6">
                Just your email, phone number, and a password to get started.
              </p>
              <form onSubmit={handleStep1} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
                  <input
                    className="input" type="email" placeholder="you@example.com"
                    value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone number</label>
                  <input
                    className="input" type="tel" placeholder="08012345678"
                    value={phone} onChange={e => setPhone(e.target.value)} required autoComplete="tel"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Used to identify you when you don't have your card on you.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input
                    className="input" type="password" placeholder="At least 8 characters"
                    value={password} onChange={e => setPassword(e.target.value)} required autoComplete="new-password"
                  />
                </div>
                <button type="submit" className="btn-primary w-full">
                  Continue →
                </button>
              </form>
            </>
          )}

          {step === 2 && (
            <>
              <h1 className="text-xl font-semibold text-gray-900 mb-1">Your medical profile</h1>
              <p className="text-sm text-gray-500 mb-6">
                This information helps hospitals treat you safely. You can update it anytime.
              </p>
              <form onSubmit={handleStep2} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full name (as on ID)</label>
                  <input
                    className="input" placeholder="Nosa Adekunle"
                    value={fullName} onChange={e => setFullName(e.target.value)} required autoComplete="name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of birth</label>
                  <input
                    className="input" type="date"
                    value={dob} onChange={e => setDob(e.target.value)} required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                    <select className="input" value={gender} onChange={e => setGender(e.target.value)}>
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer_not_to_say">Prefer not to say</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Blood type</label>
                    <select className="input" value={bloodType} onChange={e => setBloodType(e.target.value)}>
                      <option value="">Unknown</option>
                      {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(bt => (
                        <option key={bt} value={bt}>{bt}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs text-blue-800">
                  <strong>Why we ask:</strong> Blood type and known conditions can be critical in emergencies when you can't speak for yourself. You control who can see this — hospitals must request your permission first.
                </div>

                <div className="flex gap-3">
                  <button type="button" className="btn-secondary flex-1" onClick={() => setStep(1)}>
                    ← Back
                  </button>
                  <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
                    {loading && <Spinner size="sm" />}
                    Create account
                  </button>
                </div>
              </form>
            </>
          )}

          <p className="mt-4 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-700">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

function StepDot({ n, current, label }: { n: number; current: number; label: string }) {
  const done    = n < current
  const active  = n === current
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${
        done    ? 'bg-green-500 text-white' :
        active  ? 'bg-primary-600 text-white' :
                  'bg-gray-200 text-gray-500'
      }`}>
        {done ? '✓' : n}
      </div>
      <span className={`text-xs ${active ? 'text-primary-700 font-medium' : 'text-gray-400'}`}>{label}</span>
    </div>
  )
}
