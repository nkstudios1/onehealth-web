import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { PageSpinner } from '../../components/Spinner'
import EmptyState from '../../components/EmptyState'
import type { Visit } from '../../types'

export default function PatientVisitsPage() {
  const { data: visits, isLoading } = useQuery({
    queryKey: ['my-visits'],
    queryFn: async () => {
      const { data } = await api.get<{ data: Visit[] }>('/patients/me/visits/')
      return data.data ?? []
    },
  })

  if (isLoading) return <PageSpinner />

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Visits</h1>
        <p className="text-sm text-gray-500 mt-1">History of your hospital visits</p>
      </div>

      {(!visits || visits.length === 0) ? (
        <EmptyState title="No visits yet" description="Your hospital visit history will appear here." />
      ) : (
        <div className="space-y-3">
          {visits.map((visit) => (
            <div key={visit.id} className="card flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={visit.status === 'active' ? 'badge-green' : 'badge-gray'}>
                    {visit.status === 'active' ? 'Active' : 'Checked out'}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-900">{visit.hospital_name ?? visit.hospital}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Admitted: {new Date(visit.admitted_at).toLocaleString()}
                  {visit.checked_out_at && (
                    <> · Checked out: {new Date(visit.checked_out_at).toLocaleString()}</>
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
