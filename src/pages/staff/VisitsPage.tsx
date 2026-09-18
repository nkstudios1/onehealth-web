import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { api, extractError } from '../../lib/api'
import { PageSpinner } from '../../components/Spinner'
import EmptyState from '../../components/EmptyState'
import type { Visit } from '../../types'

export default function VisitsPage() {
  const qc = useQueryClient()

  const { data: visits, isLoading } = useQuery({
    queryKey: ['staff-visits'],
    queryFn: async () => {
      const { data } = await api.get<{ data: Visit[] }>('/visits/')
      return data.data ?? []
    },
  })

  async function handleCheckout(visitId: string) {
    if (!confirm('Check out this patient? This will end their active visit and revoke all access grants.')) return
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
          <p className="text-sm text-gray-500 mt-1">{active.length} active visit{active.length !== 1 ? 's' : ''}</p>
        </div>
        {/* Visit starts are initiated from the Lookup page */}
        <Link to="/staff/lookup" className="btn-primary">
          Find patient →
        </Link>
      </div>

      {(!visits || visits.length === 0) ? (
        <EmptyState
          title="No visits yet"
          description="Find a patient by card or name to start a visit and request access to their records."
          action={<Link to="/staff/lookup" className="btn-primary">Find patient →</Link>}
        />
      ) : (
        <div className="space-y-6">
          {active.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Active</h2>
              <div className="space-y-3">
                {active.map(v => (
                  <VisitCard key={v.id} visit={v} onCheckout={() => handleCheckout(v.id)} />
                ))}
              </div>
            </section>
          )}
          {historic.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">History</h2>
              <div className="space-y-3">
                {historic.map(v => <VisitCard key={v.id} visit={v} />)}
              </div>
            </section>
          )}
        </div>
      )}
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
          {visit.checkout_requested_by_patient_at && visit.status === 'active' && (
            <span className="badge-yellow">Patient requested checkout</span>
          )}
        </div>
        <p className="text-sm font-medium text-gray-900">
          {visit.patient_name ?? 'Unknown patient'}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">
          {visit.hospital_name} · Admitted {new Date(visit.admitted_at).toLocaleString()}
          {visit.checked_out_at && <> · Out {new Date(visit.checked_out_at).toLocaleString()}</>}
        </p>
      </div>
      <div className="flex gap-2 shrink-0 flex-wrap justify-end">
        {visit.status === 'active' && (
          <>
            <Link to={`/staff/visits/${visit.id}`} className="btn-secondary text-sm">
              View detail
            </Link>
            <Link to={`/staff/visits/${visit.id}/access`} className="btn-secondary text-sm">
              Request access
            </Link>
            <button className="btn-danger text-sm" onClick={onCheckout}>
              Checkout
            </button>
          </>
        )}
        {visit.status !== 'active' && (
          <Link to={`/staff/visits/${visit.id}`} className="btn-secondary text-sm">
            View detail
          </Link>
        )}
      </div>
    </div>
  )
}
