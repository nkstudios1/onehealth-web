import { useState } from 'react'
import type { FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { api, extractError } from '../../lib/api'
import { PageSpinner } from '../../components/Spinner'
import EmptyState from '../../components/EmptyState'
import Modal from '../../components/Modal'
import Spinner from '../../components/Spinner'
import type { EntryType, MedicalRecord } from '../../types'

const entryTypeLabel: Record<EntryType, string> = {
  allergy: 'Allergy', condition: 'Condition', medication: 'Medication',
  procedure: 'Procedure', note: 'Note', lab_result: 'Lab Result',
  imaging: 'Imaging', vaccination: 'Vaccination',
}

export default function PatientRecordsPage() {
  const { patientId } = useParams<{ patientId: string }>()
  const qc = useQueryClient()
  const [addOpen, setAddOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ entry_type: 'note' as EntryType, description: '' })

  const { data: profile } = useQuery({
    queryKey: ['hospital-patient-profile', patientId],
    queryFn: async () => {
      const { data } = await api.get(`/patients/${patientId}/`)
      return data.data
    },
    enabled: !!patientId,
  })

  const { data: records, isLoading } = useQuery({
    queryKey: ['hospital-patient-records', patientId],
    queryFn: async () => {
      const { data } = await api.get<{ data: MedicalRecord[] }>(`/patients/${patientId}/records/`)
      return data.data ?? []
    },
    enabled: !!patientId,
  })

  async function handleAdd(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post(`/patients/${patientId}/records/`, form)
      toast.success('Record added')
      qc.invalidateQueries({ queryKey: ['hospital-patient-records', patientId] })
      setAddOpen(false)
      setForm({ entry_type: 'note', description: '' })
    } catch (err) {
      toast.error(extractError(err))
    } finally {
      setSaving(false)
    }
  }

  async function handleVerify(recordId: string) {
    try {
      await api.post(`/records/${recordId}/verify/`)
      toast.success('Record verified')
      qc.invalidateQueries({ queryKey: ['hospital-patient-records', patientId] })
    } catch (err) {
      toast.error(extractError(err))
    }
  }

  if (isLoading) return <PageSpinner />

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {profile?.full_name ?? 'Patient'}'s Records
          </h1>
          {profile && (
            <p className="text-sm text-gray-500 mt-1">
              {profile.date_of_birth} · {profile.gender} · Blood type: {profile.blood_type || '—'}
            </p>
          )}
        </div>
        <button className="btn-primary" onClick={() => setAddOpen(true)}>+ Add record</button>
      </div>

      {(!records || records.length === 0) ? (
        <EmptyState
          title="No records"
          description="No medical records found for this patient under this access grant."
        />
      ) : (
        <div className="space-y-3">
          {records.map((rec) => (
            <div key={rec.id} className="card flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="badge-blue">{entryTypeLabel[rec.entry_type]}</span>
                  <span className={rec.verification_status === 'doctor_verified' ? 'badge-green' : 'badge-gray'}>
                    {rec.verification_status === 'doctor_verified' ? '✓ Verified' : 'Unverified'}
                  </span>
                </div>
                <p className="text-sm text-gray-800">{rec.description}</p>
                <p className="text-xs text-gray-400 mt-1">{new Date(rec.created_at).toLocaleString()}</p>
              </div>
              {rec.verification_status !== 'doctor_verified' && (
                <button className="btn-secondary text-xs shrink-0" onClick={() => handleVerify(rec.id)}>
                  Verify
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add medical record"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setAddOpen(false)}>Cancel</button>
            <button form="add-rec-form" type="submit" className="btn-primary flex items-center gap-2" disabled={saving}>
              {saving && <Spinner size="sm" />} Save
            </button>
          </>
        }
      >
        <form id="add-rec-form" onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Record type</label>
            <select className="input" value={form.entry_type}
              onChange={(e) => setForm(f => ({...f, entry_type: e.target.value as EntryType}))}>
              {(Object.keys(entryTypeLabel) as EntryType[]).map(t =>
                <option key={t} value={t}>{entryTypeLabel[t]}</option>
              )}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              className="input min-h-[100px]"
              value={form.description}
              onChange={(e) => setForm(f => ({...f, description: e.target.value}))}
              required
            />
          </div>
        </form>
      </Modal>
    </div>
  )
}
