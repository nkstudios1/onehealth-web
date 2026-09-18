import { useState } from 'react'
import type { FormEvent } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { api, extractError } from '../../lib/api'
import Spinner from '../../components/Spinner'

export default function VisitAccessPage() {
  const { visitId } = useParams<{ visitId: string }>()
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    visit: visitId ?? '',
    request_type: 'normal',
    access_level: 'full_record',
  })

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/access-requests/', { ...form, visit: visitId })
      toast.success('Access request sent — awaiting patient approval')
      navigate('/staff/access-grants')
    } catch (err) {
      toast.error(extractError(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-md">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Request Patient Access</h1>
        <p className="text-sm text-gray-500 mt-1">
          For visit <span className="font-mono text-xs">{visitId}</span>
        </p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Request type</label>
            <select className="input" value={form.request_type} onChange={(e) => setForm(f => ({...f, request_type: e.target.value}))}>
              <option value="normal">Normal — patient must approve</option>
              <option value="emergency">Emergency — can escalate to contacts</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Access level</label>
            <select className="input" value={form.access_level} onChange={(e) => setForm(f => ({...f, access_level: e.target.value}))}>
              <option value="full_record">Full record</option>
              <option value="critical_info_only">Critical info only (allergies, conditions, medications)</option>
            </select>
          </div>

          {form.request_type === 'emergency' && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-800">
              Emergency requests can be escalated to the patient's emergency contacts if the patient
              doesn't respond within the timeout window.
            </div>
          )}

          <button type="submit" disabled={saving} className="btn-primary w-full flex items-center justify-center gap-2">
            {saving && <Spinner size="sm" />}
            Send access request
          </button>
        </form>
      </div>
    </div>
  )
}
