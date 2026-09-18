import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { api, extractError } from '../../lib/api'
import { PageSpinner } from '../../components/Spinner'
import EmptyState from '../../components/EmptyState'
import Modal from '../../components/Modal'
import Spinner from '../../components/Spinner'
import type { Visit } from '../../types'

export default function VisitsPage() {
  const qc = useQueryClient()
  const [startOpen, setStartOpen] = useState(false)
  const [patientId, setPatientId] = useState('')
  const [saving, setSaving] = useState(false)

  const { data: visits, isLoading } = useQuery({
    queryKey: ['staff-visits'],
    queryFn: async () => {
      const { data } = await api.get<{ data: Visit[] }>('/visits/')
      return data.data ?? []
    },
  })

  async function handleStart(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/visits/', { patient: patientId })
      toast.success('Visit started')
      qc.invalidateQueries({ queryKey: ['staff-visits'] })
      setStartOpen(false)
      setPatientId('')
    } catch (err) {
      toast.error(extractError(err))
    } finally {
      setSaving(false)
    }
  }

  async function handleCheckout(visitId: string) {
    if (!confirm('Check out this patient?')) return
    try {
      await api.post(`/visits/${visitId}/checkout/`)
      toast.success('Patient checked out')
      qc.invalidateQueries({ queryKey: ['staff-visits'] })
    } catch (err) {
      toast.error(extractError(err))
    }
  }

  if (isLoading) return <PageSpinner />

  const active   = visits?.filter(v => v.status === 'active') ?? []
  const historic = visits?.filter(v => v.status !== 'active') ?? []

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Visits</h1>
          <p className="text-sm text-gray-500 mt-1">{active.length} active</p>
        </div>
        <button className="btn-primary" onClick={() => setStartOpen(true)}>+ Start visit</button>
      </div>

      {(!visits || visits.length === 0) ? (
        <EmptyState
          title="No visits"
          description="Start a patient visit to begin requesting access to their records."
          action={<button className="btn-primary" onClick={() => setStartOpen(true)}>+ Start visit</button>}
        />
      ) : (
        <div className="space-y-6">
          {active.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Active</h2>
              <div className="space-y-3">
                {active.map((v) => (
                  <VisitCard key={v.id} visit={v} onCheckout={() => handleCheckout(v.id)} />
                ))}
              </div>
            </section>
          )}
          {historic.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">History</h2>
              <div className="space-y-3">
                {historic.map((v) => <VisitCard key={v.id} visit={v} />)}
              </div>
            </section>
          )}
        </div>
      )}

      <Modal
        open={startOpen}
        onClose={() => setStartOpen(false)}
        title="Start visit"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setStartOpen(false)}>Cancel</button>
            <button form="start-visit-form" type="submit" className="btn-primary flex items-center gap-2" disabled={saving}>
              {saving && <Spinner size="sm" />} Start visit
            </button>
          </>
        }
      >
        <p className="text-sm text-gray-500 mb-4">
          Use the <Link to="/staff/lookup" className="text-primary-600 underline">patient lookup</Link> to find a patient's ID first.
        </p>
        <form id="start-visit-form" onSubmit={handleStart} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Patient ID (UUID)</label>
            <input
              className="input font-mono text-sm"
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              required
            />
          </div>
        </form>
      </Modal>
    </div>
  )
}

function VisitCard({ visit, onCheckout }: { visit: Visit; onCheckout?: () => void }) {
  return (
    <div className="card flex items-start justify-between gap-4">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className={visit.status === 'active' ? 'badge-green' : 'badge-gray'}>
            {visit.status === 'active' ? 'Active' : 'Checked out'}
          </span>
        </div>
        <p className="text-sm text-gray-700 font-mono">Patient: {visit.patient}</p>
        <p className="text-xs text-gray-500 mt-0.5">
          Admitted: {new Date(visit.admitted_at).toLocaleString()}
          {visit.checked_out_at && <> · Checked out: {new Date(visit.checked_out_at).toLocaleString()}</>}
        </p>
      </div>
      <div className="flex gap-2 shrink-0">
        {visit.status === 'active' && (
          <>
            <Link to={`/staff/visits/${visit.id}/access`} className="btn-secondary text-sm">
              Request access
            </Link>
            <button className="btn-danger text-sm" onClick={onCheckout}>Checkout</button>
          </>
        )}
      </div>
    </div>
  )
}
