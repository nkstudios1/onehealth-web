import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import { PageSpinner } from '../../components/Spinner'
import type { AccessGrant, Visit } from '../../types'

export default function StaffDashboard() {
  const { staffProfile, user } = useAuth()

  const { data: grants, isLoading: grantsLoading } = useQuery({
    queryKey: ['hospital-active-grants'],
    queryFn: async () => {
      const { data } = await api.get<{ data: AccessGrant[] }>('/access-grants/hospital/active/')
      return data.data ?? []
    },
  })

  const { data: visits, isLoading: visitsLoading } = useQuery({
    queryKey: ['staff-visits'],
    queryFn: async () => {
      const { data } = await api.get<{ data: Visit[] }>('/visits/')
      return data.data ?? []
    },
  })

  const isLoading = grantsLoading || visitsLoading
  if (isLoading) return <PageSpinner />

  const activeVisits = visits?.filter(v => v.status === 'active') ?? []

  const hospitalStatus = staffProfile?.hospital_verification_status ?? 'pending'
  const isVerified = hospitalStatus === 'verified'

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {staffProfile?.hospital_name ?? 'Hospital Dashboard'}
        </h1>
        <div className="flex items-center gap-2 mt-1">
          <span className={`text-xs font-medium capitalize px-2 py-0.5 rounded-full ${
            isVerified ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
          }`}>
            {hospitalStatus.replace('_', ' ')}
          </span>
          <span className="text-sm text-gray-500">
            Signed in as {staffProfile?.full_name ?? user?.email} · {staffProfile?.role ?? ''}
          </span>
        </div>
      </div>

      {!isVerified && (
        <div className="mb-6 rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
          <strong>Hospital not yet verified.</strong> Your hospital is awaiting verification from OneHealth.
          Most features are locked until verification is complete.
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <StatCard
          label="Active Visits"
          value={activeVisits.length}
          href="/staff/visits"
          color="blue"
        />
        <StatCard
          label="Active Access Grants"
          value={grants?.length ?? 0}
          href="/staff/access-grants"
          color="green"
        />
      </div>

      {/* Quick actions */}
      <div className="card">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Quick actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <ActionBtn to="/staff/lookup" label="Lookup patient" icon="🔍" />
          <ActionBtn to="/staff/visits" label="Start visit" icon="🏥" />
          <ActionBtn to="/staff/access-grants" label="View grants" icon="🔑" />
          {staffProfile?.role === 'admin' && (
            <ActionBtn to="/staff/team" label="Manage team" icon="👥" />
          )}
          <ActionBtn to="/staff/audit" label="Audit logs" icon="📋" />
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, href, color }: {
  label: string; value: number; href: string; color: 'blue' | 'green'
}) {
  const c = { blue: 'bg-blue-50 text-blue-700', green: 'bg-green-50 text-green-700' }[color]
  return (
    <Link to={href} className="card hover:shadow-md transition-shadow">
      <p className={`text-3xl font-bold ${c}`}>{value}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </Link>
  )
}

function ActionBtn({ to, label, icon }: { to: string; label: string; icon: string }) {
  return (
    <Link to={to} className="flex flex-col items-center gap-1 rounded-xl border border-gray-200 p-4 text-center hover:bg-gray-50 transition-colors">
      <span className="text-2xl">{icon}</span>
      <span className="text-xs font-medium text-gray-700">{label}</span>
    </Link>
  )
}
