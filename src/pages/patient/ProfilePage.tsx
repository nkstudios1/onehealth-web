import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import { api, extractError } from '../../lib/api'
import Spinner from '../../components/Spinner'
import { isPatientProfile } from '../../types'

export default function ProfilePage() {
  const { user, refreshMe } = useAuth()
  const navigate = useNavigate()
  const patientProfile = isPatientProfile(user?.profile) ? user.profile : null

  const [formData, setFormData] = useState({
    full_name: patientProfile?.full_name || '',
    date_of_birth: patientProfile?.date_of_birth || '',
    gender: patientProfile?.gender || '',
    blood_type: patientProfile?.blood_type || '',
    genotype: '',
    residential_address: '',
  })
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/patients/me/profile/', formData)
      toast.success('Profile updated successfully')
      await refreshMe()
      navigate('/patient')
    } catch (err) {
      toast.error(extractError(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Complete Your Profile</h1>
        <p className="text-sm text-gray-500 mt-1">
          Fill in your health information to access all features
        </p>
      </div>

      {/* Info banner */}
      <div className="mb-6 rounded-xl bg-blue-50 border border-blue-200 p-4">
        <div className="flex gap-3">
          <svg className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Two ways to complete your profile:</p>
            <ul className="list-disc list-inside space-y-1 text-xs text-blue-700">
              <li>Fill out the form below and submit online</li>
              <li>Visit any registered hospital - staff can help you complete it</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="card max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="input"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="John Doe"
              required
            />
          </div>

          {/* Date of Birth */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date of Birth <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              className="input"
              value={formData.date_of_birth}
              onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
              required
            />
          </div>

          {/* Gender */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Gender <span className="text-red-500">*</span>
            </label>
            <select
              className="input"
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              required
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Blood Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Blood Type
            </label>
            <select
              className="input"
              value={formData.blood_type}
              onChange={(e) => setFormData({ ...formData, blood_type: e.target.value })}
            >
              <option value="">Select blood type</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
            </select>
          </div>

          {/* Genotype */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Genotype
            </label>
            <select
              className="input"
              value={formData.genotype}
              onChange={(e) => setFormData({ ...formData, genotype: e.target.value })}
            >
              <option value="">Select genotype</option>
              <option value="AA">AA</option>
              <option value="AS">AS</option>
              <option value="AC">AC</option>
              <option value="SS">SS</option>
              <option value="SC">SC</option>
            </select>
          </div>

          {/* Residential Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Residential Address
            </label>
            <textarea
              className="input"
              rows={3}
              value={formData.residential_address}
              onChange={(e) => setFormData({ ...formData, residential_address: e.target.value })}
              placeholder="Enter your full address"
            />
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              className="btn-secondary flex-1"
              onClick={() => navigate('/patient')}
            >
              Skip for now
            </button>
            <button
              type="submit"
              className="btn-primary flex-1 flex items-center justify-center gap-2"
              disabled={saving}
            >
              {saving && <Spinner size="sm" />}
              Save Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
