import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { api, extractError } from '../../lib/api'
import { PageSpinner } from '../../components/Spinner'
import EmptyState from '../../components/EmptyState'
import Modal from '../../components/Modal'
import Spinner from '../../components/Spinner'
import type { PatientProfile } from '../../types'

export default function DependentsPage() {
  const qc = useQueryClient()
  const [addOpen, setAddOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    full_name: '', date_of_birth: '', gender: '', blood_type: '',
  })

  const { data: dependents, isLoading } = useQuery({
    queryKey: ['my-dependents'],
    queryFn: async () => {
      const { data } = await api.get<{ data: PatientProfile[] }>('/auth/patients/me/dependents/')
      return data.data ?? []
    },
  })

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/auth/patients/me/dependents/', form)
      toast.success('Dependent added')
      qc.invalidateQueries({ queryKey: ['my-dependents'] })
      setAddOpen(false)
      setForm({ full_name: '', date_of_birth: '', gender: '', blood_type: '' })
    } catch (err) {
      toast.error(extractError(err))
    } finally {
      setSaving(false)
    }
  }

  if (isLoading) return <PageSpinner />

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dependents</h1>
          <p className="text-sm text-gray-500 mt-1">
            Children or dependants whose medical records you manage
          </p>
        </div>
        <button className="btn-primary" onClick={() => setAddOpen(true)}>+ Add dependent</button>
      </div>

      {(!dependents || dependents.length === 0) ? (
        <EmptyState
          title="No dependents"
          description="Register a child or dependent to manage their health records."
          action={<button className="btn-primary" onClick={() => setAddOpen(true)}>+ Add dependent</button>}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {dependents.map((dep) => (
            <div key={dep.id} className="card">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-purple-700 font-semibold text-sm">
                  {dep.full_name[0]}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{dep.full_name}</p>
                  <p className="text-xs text-gray-500 capitalize">{dep.account_type.replace('_', ' ')}</p>
                </div>
              </div>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                <div>
                  <dt className="text-gray-400">Date of birth</dt>
                  <dd className="font-medium text-gray-700">{dep.date_of_birth}</dd>
                </div>
                <div>
                  <dt className="text-gray-400">Gender</dt>
                  <dd className="font-medium text-gray-700 capitalize">{dep.gender || '—'}</dd>
                </div>
                <div>
                  <dt className="text-gray-400">Blood type</dt>
                  <dd className="font-medium text-gray-700">{dep.blood_type || '—'}</dd>
                </div>
              </dl>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add dependent"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setAddOpen(false)}>Cancel</button>
            <button form="add-dep-form" type="submit" className="btn-primary flex items-center gap-2" disabled={saving}>
              {saving && <Spinner size="sm" />} Add dependent
            </button>
          </>
        }
      >
        <form id="add-dep-form" onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
            <input className="input" value={form.full_name} onChange={(e) => setForm(f => ({...f, full_name: e.target.value}))} required placeholder="Child's full name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date of birth</label>
            <input className="input" type="date" value={form.date_of_birth} onChange={(e) => setForm(f => ({...f, date_of_birth: e.target.value}))} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
            <select className="input" value={form.gender} onChange={(e) => setForm(f => ({...f, gender: e.target.value}))}>
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Blood type (optional)</label>
            <select className="input" value={form.blood_type} onChange={(e) => setForm(f => ({...f, blood_type: e.target.value}))}>
              <option value="">Unknown</option>
              {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(bt => <option key={bt} value={bt}>{bt}</option>)}
            </select>
          </div>
        </form>
      </Modal>
    </div>
  )
}
