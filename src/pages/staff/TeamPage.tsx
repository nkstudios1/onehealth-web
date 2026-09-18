import { useState } from 'react'
import type { FormEvent } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { api, extractError } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import { PageSpinner } from '../../components/Spinner'
import EmptyState from '../../components/EmptyState'
import Modal from '../../components/Modal'
import Spinner from '../../components/Spinner'
import type { StaffProfile } from '../../types'

export default function TeamPage() {
  const { staffProfile } = useAuth()
  const qc = useQueryClient()
  const [addOpen, setAddOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    email: '', full_name: '', role: 'nurse', professional_license_number: '',
  })

  const hospitalId = staffProfile?.hospital

  const { data: staff, isLoading } = useQuery({
    queryKey: ['hospital-staff', hospitalId],
    queryFn: async () => {
      const { data } = await api.get<{ data: StaffProfile[] }>(`/auth/hospitals/${hospitalId}/staff/`)
      return data.data ?? []
    },
    enabled: !!hospitalId,
  })

  async function handleAdd(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/auth/hospitals/me/staff/', form)
      toast.success('Staff member added — a temporary password has been sent to their email')
      qc.invalidateQueries({ queryKey: ['hospital-staff', hospitalId] })
      setAddOpen(false)
      setForm({ email: '', full_name: '', role: 'nurse', professional_license_number: '' })
    } catch (err) {
      toast.error(extractError(err))
    } finally {
      setSaving(false)
    }
  }

  async function handleRemove(staffId: string) {
    if (!confirm('Remove this staff member? Their account will be deactivated.')) return
    try {
      await api.delete(`/auth/staff/${staffId}/`)
      toast.success('Staff member removed')
      qc.invalidateQueries({ queryKey: ['hospital-staff', hospitalId] })
    } catch (err) {
      toast.error(extractError(err))
    }
  }

  if (isLoading) return <PageSpinner />

  const isAdmin = staffProfile?.role === 'admin'

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hospital Staff</h1>
          <p className="text-sm text-gray-500 mt-1">{staff?.length ?? 0} members</p>
        </div>
        {isAdmin && (
          <button className="btn-primary" onClick={() => setAddOpen(true)}>+ Add staff</button>
        )}
      </div>

      {(!staff || staff.length === 0) ? (
        <EmptyState
          title="No staff"
          description={isAdmin ? "Add doctors and nurses to your hospital." : "No staff found."}
          action={isAdmin ? <button className="btn-primary" onClick={() => setAddOpen(true)}>+ Add staff</button> : undefined}
        />
      ) : (
        <div className="space-y-3">
          {staff.map((member) => (
            <div key={member.id} className="card flex items-center gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-semibold text-sm">
                {member.full_name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{member.full_name}</p>
                <p className="text-xs text-gray-500 capitalize">
                  {member.role}
                  {member.professional_license_number && ` · License: ${member.professional_license_number}`}
                </p>
              </div>
              {isAdmin && member.role !== 'admin' && (
                <button
                  className="text-red-500 hover:text-red-700 p-1 rounded"
                  onClick={() => handleRemove(member.id)}
                  aria-label="Remove staff"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add staff member"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setAddOpen(false)}>Cancel</button>
            <button form="add-staff-form" type="submit" className="btn-primary flex items-center gap-2" disabled={saving}>
              {saving && <Spinner size="sm" />} Add staff
            </button>
          </>
        }
      >
        <p className="text-sm text-gray-500 mb-4">
          A temporary password will be emailed to the staff member. They must change it on first login.
        </p>
        <form id="add-staff-form" onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
            <input className="input" value={form.full_name} onChange={(e) => setForm(f => ({...f, full_name: e.target.value}))} required placeholder="Dr. John Doe" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input className="input" type="email" value={form.email} onChange={(e) => setForm(f => ({...f, email: e.target.value}))} required placeholder="doctor@hospital.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select className="input" value={form.role} onChange={(e) => setForm(f => ({...f, role: e.target.value}))}>
              <option value="nurse">Nurse</option>
              <option value="doctor">Doctor</option>
            </select>
          </div>
          {form.role === 'doctor' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Professional license number</label>
              <input className="input" value={form.professional_license_number} onChange={(e) => setForm(f => ({...f, professional_license_number: e.target.value}))} required placeholder="MDCN-12345" />
            </div>
          )}
        </form>
      </Modal>
    </div>
  )
}
