import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { api, extractError } from '../../lib/api'
import Spinner from '../../components/Spinner'

export default function RegisterHospitalPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    hospital_name: '',
    registration_number: '',
    phermc_number: '',
    cac_number: '',
    address: '',
    admin_email: '',
    admin_password: '',
    admin_full_name: '',
  })

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/auth/register/hospital/', form)
      toast.success('Hospital registered! Await verification, then sign in.')
      navigate('/login')
    } catch (err) {
      toast.error(extractError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
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
          <h1 className="text-xl font-semibold text-gray-900 mb-1">Register your hospital</h1>
          <p className="text-sm text-gray-500 mb-6">Your hospital will be reviewed and verified before going live</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Hospital info */}
            <div>
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Hospital information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hospital name</label>
                  <input className="input" placeholder="Lagos General Hospital" value={form.hospital_name} onChange={(e) => set('hospital_name', e.target.value)} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Registration number</label>
                  <input className="input" placeholder="NHFR-123456" value={form.registration_number} onChange={(e) => set('registration_number', e.target.value)} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">PHERMC number</label>
                  <input className="input" value={form.phermc_number} onChange={(e) => set('phermc_number', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CAC number</label>
                  <input className="input" value={form.cac_number} onChange={(e) => set('cac_number', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input className="input" placeholder="123 Hospital Road, Lagos" value={form.address} onChange={(e) => set('address', e.target.value)} />
                </div>
              </div>
            </div>

            {/* Admin user */}
            <div>
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Admin account</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Admin full name</label>
                  <input className="input" placeholder="Dr. John Smith" value={form.admin_full_name} onChange={(e) => set('admin_full_name', e.target.value)} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Admin email</label>
                  <input className="input" type="email" placeholder="admin@hospital.com" value={form.admin_email} onChange={(e) => set('admin_email', e.target.value)} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Admin password</label>
                  <input className="input" type="password" placeholder="Strong password" value={form.admin_password} onChange={(e) => set('admin_password', e.target.value)} required />
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading && <Spinner size="sm" />}
              Register hospital
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-gray-600">
            Already registered?{' '}
            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-700">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
