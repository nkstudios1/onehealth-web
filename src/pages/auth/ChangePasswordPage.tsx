import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { api, extractError } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import Spinner from '../../components/Spinner'

export default function ChangePasswordPage() {
  const { user, refreshMe } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ old_password: '', new_password: '', confirm: '' })

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (form.new_password !== form.confirm) {
      toast.error('Passwords do not match')
      return
    }
    setLoading(true)
    try {
      await api.post('/auth/password/change/', {
        old_password: form.old_password,
        new_password: form.new_password,
      })
      toast.success('Password changed successfully')
      await refreshMe()
      navigate(user?.user_type === 'hospital_staff' ? '/staff' : '/patient')
    } catch (err) {
      toast.error(extractError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="card">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-gray-900">Change your password</h1>
            {user?.must_change_password && (
              <p className="mt-1 text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                You must change your temporary password before continuing.
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current password</label>
              <input
                className="input"
                type="password"
                value={form.old_password}
                onChange={(e) => setForm(f => ({ ...f, old_password: e.target.value }))}
                required
                autoComplete="current-password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
              <input
                className="input"
                type="password"
                value={form.new_password}
                onChange={(e) => setForm(f => ({ ...f, new_password: e.target.value }))}
                required
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm new password</label>
              <input
                className="input"
                type="password"
                value={form.confirm}
                onChange={(e) => setForm(f => ({ ...f, confirm: e.target.value }))}
                required
                autoComplete="new-password"
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading && <Spinner size="sm" />}
              Update password
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
