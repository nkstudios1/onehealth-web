import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { api, extractError } from '../../lib/api'
import { PageSpinner } from '../../components/Spinner'
import EmptyState from '../../components/EmptyState'
import Modal from '../../components/Modal'
import Spinner from '../../components/Spinner'
import type { EntryType, MedicalRecord } from '../../types'

const ENTRY_TYPES: EntryType[] = [
  'allergy', 'condition', 'medication', 'procedure',
  'note', 'lab_result', 'imaging', 'vaccination',
]

const entryTypeLabel: Record<EntryType, string> = {
  allergy:     'Allergy',
  condition:   'Condition',
  medication:  'Medication',
  procedure:   'Procedure',
  note:        'Note',
  lab_result:  'Lab Result',
  imaging:     'Imaging',
  vaccination: 'Vaccination',
}

function RecordBadge({ record }: { record: MedicalRecord }) {
  const verified = record.verification_status === 'doctor_verified'
  return (
    <span className={verified ? 'badge-green' : 'badge-gray'}>
      {verified ? '✓ Doctor verified' : 'Unverified'}
    </span>
  )
}

export default function MyRecordsPage() {
  const qc = useQueryClient()
  const [addOpen, setAddOpen] = useState(false)
  const [supersedeTarget, setSupersedeTarget] = useState<MedicalRecord | null>(null)
  const [form, setForm] = useState({ entry_type: 'note' as EntryType, description: '' })
  const [supersedeForm, setSupersedeForm] = useState({ entry_type: 'note' as EntryType, description: '' })
  const [saving, setSaving] = useState(false)

  const { data: records, isLoading } = useQuery({
    queryKey: ['my-records'],
    queryFn: async () => {
      const { data } = await api.get<{ data: MedicalRecord[] }>('/patients/me/records/')
      return data.data ?? []
    },
  })

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/patients/me/records/', form)
      toast.success('Record added')
      qc.invalidateQueries({ queryKey: ['my-records'] })
      setAddOpen(false)
      setForm({ entry_type: 'note', description: '' })
    } catch (err) {
      toast.error(extractError(err))
    } finally {
      setSaving(false)
    }
  }

  async function handleSupersede(e: React.FormEvent) {
    e.preventDefault()
    if (!supersedeTarget) return
    setSaving(true)
    try {
      await api.post(`/records/${supersedeTarget.id}/supersede/`, supersedeForm)
      toast.success('Record updated')
      qc.invalidateQueries({ queryKey: ['my-records'] })
      setSupersedeTarget(null)
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
          <h1 className="text-2xl font-bold text-gray-900">My Medical Records</h1>
          <p className="text-sm text-gray-500 mt-1">{records?.length ?? 0} entries</p>
        </div>
        <button className="btn-primary" onClick={() => setAddOpen(true)}>+ Add record</button>
      </div>

      {(!records || records.length === 0) ? (
        <EmptyState
          title="No records yet"
          description="Add your first medical record — allergies, conditions, medications, and more."
          action={<button className="btn-primary" onClick={() => setAddOpen(true)}>+ Add record</button>}
        />
      ) : (
        <div className="space-y-3">
          {records.map((rec) => (
            <div key={rec.id} className="card flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="badge-blue">{entryTypeLabel[rec.entry_type]}</span>
                  <RecordBadge record={rec} />
                  {rec.supersedes_entry && <span className="badge-gray text-xs">Supersedes older entry</span>}
                </div>
                <p className="text-sm text-gray-800 mt-1">{rec.description}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(rec.created_at).toLocaleDateString()}
                  {rec.hospital && ' · Hospital record'}
                </p>
              </div>
              {/* Only patient-created records (no staff creator) can be superseded by patient */}
              {!rec.created_by_staff && (
                <button
                  className="btn-secondary text-xs shrink-0"
                  onClick={() => {
                    setSupersedeTarget(rec)
                    setSupersedeForm({ entry_type: rec.entry_type, description: '' })
                  }}
                >
                  Update
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add medical record"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setAddOpen(false)}>Cancel</button>
            <button form="add-record-form" type="submit" className="btn-primary flex items-center gap-2" disabled={saving}>
              {saving && <Spinner size="sm" />} Save
            </button>
          </>
        }
      >
        <form id="add-record-form" onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Record type</label>
            <select
              className="input"
              value={form.entry_type}
              onChange={(e) => setForm(f => ({ ...f, entry_type: e.target.value as EntryType }))}
            >
              {ENTRY_TYPES.map(t => <option key={t} value={t}>{entryTypeLabel[t]}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              className="input min-h-[100px]"
              placeholder="Describe the entry…"
              value={form.description}
              onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
              required
            />
          </div>
        </form>
      </Modal>

      {/* Supersede Modal */}
      <Modal
        open={!!supersedeTarget}
        onClose={() => setSupersedeTarget(null)}
        title="Update record"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setSupersedeTarget(null)}>Cancel</button>
            <button form="supersede-form" type="submit" className="btn-primary flex items-center gap-2" disabled={saving}>
              {saving && <Spinner size="sm" />} Save update
            </button>
          </>
        }
      >
        <p className="text-xs text-gray-500 mb-4">
          This creates a new entry linked to the original — the original is preserved for audit.
        </p>
        <form id="supersede-form" onSubmit={handleSupersede} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Record type</label>
            <select
              className="input"
              value={supersedeForm.entry_type}
              onChange={(e) => setSupersedeForm(f => ({ ...f, entry_type: e.target.value as EntryType }))}
            >
              {ENTRY_TYPES.map(t => <option key={t} value={t}>{entryTypeLabel[t]}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Updated description</label>
            <textarea
              className="input min-h-[100px]"
              placeholder="Updated information…"
              value={supersedeForm.description}
              onChange={(e) => setSupersedeForm(f => ({ ...f, description: e.target.value }))}
              required
            />
          </div>
        </form>
      </Modal>
    </div>
  )
}
