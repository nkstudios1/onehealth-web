import { useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { api, extractError } from '../../lib/api'
import { PageSpinner } from '../../components/Spinner'
import EmptyState from '../../components/EmptyState'
import type { Hospital } from '../../types'

const statusBadge = (s: Hospital['verification_status']) => {
  switch (s) {
    case 'verified':  return <span className="badge-green">Verified</span>
    case 'pending':   return <span className="badge-yellow">Pending</span>
    case 'rejected':  return <span className="badge-red">Rejected</span>
    case 'suspended': return <span className="badge-gray">Suspended</span>
  }
}

export default function AdminDashboard() {
  const qc = useQueryClient()

  const { data: hospitals, isLoading } = useQuery({
    queryKey: ['all-hospitals'],
    queryFn: async () => {
      const { data } = await api.get<{ data: Hospital[] }>('/auth/hospitals/')
      return data.data ?? []
    },
  })

  async function handleVerify(hospitalId: string) {
    try {
      await api.post(`/auth/hospitals/${hospitalId}/verify/`)
      toast.success('Hospital verified')
      qc.invalidateQueries({ queryKey: ['all-hospitals'] })
    } catch (err) {
      toast.error(extractError(err))
    }
  }

  if (isLoading) return <PageSpinner />

  const pending  = hospitals?.filter(h => h.verification_status === 'pending')  ?? []
  const verified = hospitals?.filter(h => h.verification_status === 'verified') ?? []
  const others   = hospitals?.filter(h => !['pending','verified'].includes(h.verification_status)) ?? []

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Platform Administration</h1>
        <p className="text-sm text-gray-500 mt-1">
          Review hospital registrations and manage verification status.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="card text-center">
          <p className="text-3xl font-bold text-amber-600">{pending.length}</p>
          <p className="text-xs text-gray-500 mt-1">Pending verification</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-green-600">{verified.length}</p>
          <p className="text-xs text-gray-500 mt-1">Verified hospitals</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-gray-700">{hospitals?.length ?? 0}</p>
          <p className="text-xs text-gray-500 mt-1">Total registered</p>
        </div>
      </div>

      {/* Pending — action required */}
      {pending.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Pending verification — action required
          </h2>
          <div className="space-y-3">
            {pending.map(h => (
              <HospitalCard key={h.id} hospital={h} onVerify={() => handleVerify(h.id)} />
            ))}
          </div>
        </section>
      )}

      {/* Verified */}
      {verified.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Verified hospitals
          </h2>
          <div className="space-y-3">
            {verified.map(h => (
              <HospitalCard key={h.id} hospital={h} />
            ))}
          </div>
        </section>
      )}

      {/* Rejected / Suspended */}
      {others.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Other
          </h2>
          <div className="space-y-3">
            {others.map(h => <HospitalCard key={h.id} hospital={h} />)}
          </div>
        </section>
      )}

      {(!hospitals || hospitals.length === 0) && (
        <EmptyState title="No hospitals registered" description="Hospitals will appear here once they sign up." />
      )}
    </div>
  )
}

function HospitalCard({ hospital, onVerify }: { hospital: Hospital; onVerify?: () => void }) {
  return (
    <div className="card flex items-start justify-between gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {statusBadge(hospital.verification_status)}
          <span className="text-sm font-semibold text-gray-900">{hospital.name}</span>
        </div>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-gray-500 mt-2">
          <div><dt className="inline font-medium text-gray-600">Reg # </dt><dd className="inline font-mono">{hospital.registration_number}</dd></div>
          {hospital.phermc_number && <div><dt className="inline font-medium text-gray-600">PHERMC </dt><dd className="inline font-mono">{hospital.phermc_number}</dd></div>}
          {hospital.cac_number    && <div><dt className="inline font-medium text-gray-600">CAC </dt><dd className="inline font-mono">{hospital.cac_number}</dd></div>}
          {hospital.address       && <div className="col-span-2"><dt className="inline font-medium text-gray-600">Address </dt><dd className="inline">{hospital.address}</dd></div>}
        </dl>
        <p className="text-xs text-gray-400 mt-1">Registered {new Date(hospital.created_at).toLocaleDateString()}</p>
      </div>
      {onVerify && (
        <button className="btn-primary text-sm shrink-0" onClick={onVerify}>
          Verify ✓
        </button>
      )}
    </div>
  )
}
