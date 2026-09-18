import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import { api } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import { PageSpinner } from '../../components/Spinner'
import { isPatientProfile } from '../../types'
import type { AccessRequest, MedicalRecord, PatientCard } from '../../types'

export default function PatientDashboard() {
  const { user } = useAuth()
  const patientProfile = isPatientProfile(user?.profile) ? user.profile : null

  const { data: card, isLoading: cardLoading } = useQuery({
    queryKey: ['my-card'],
    queryFn: async () => {
      const { data } = await api.get<{ status: boolean; data: PatientCard | null }>('/patients/me/card/')
      return data.data
    },
  })

  const { data: records, isLoading: recordsLoading } = useQuery({
    queryKey: ['my-records'],
    queryFn: async () => {
      const { data } = await api.get<{ status: boolean; data: MedicalRecord[] }>('/patients/me/records/')
      return data.data ?? []
    },
  })

  const { data: requests, isLoading: requestsLoading } = useQuery({
    queryKey: ['my-access-requests'],
    queryFn: async () => {
      const { data } = await api.get<{ status: boolean; data: AccessRequest[] }>('/patients/me/access-requests/')
      return data.data ?? []
    },
  })

  const isLoading = cardLoading || recordsLoading || requestsLoading
  if (isLoading) return <PageSpinner />

  const pendingRequests = requests?.filter((r) => r.status === 'pending') ?? []

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Hello, {patientProfile?.full_name?.split(' ')[0] ?? user?.email?.split('@')[0] ?? 'there'} 👋
        </h1>
        <p className="text-sm text-gray-500 mt-1">Here's a summary of your health account</p>
      </div>

      {/* Pending access request alert */}
      {pendingRequests.length > 0 && (
        <div className="mb-4 rounded-xl bg-amber-50 border border-amber-200 p-4 flex items-start gap-3">
          <svg className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800">
              {pendingRequests.length} pending access request{pendingRequests.length > 1 ? 's' : ''}
            </p>
            <p className="text-xs text-amber-700 mt-0.5">A hospital is requesting access to your records — your approval code is waiting</p>
          </div>
          <Link to="/patient/access-requests" className="text-xs font-medium text-amber-800 hover:underline whitespace-nowrap">
            Review →
          </Link>
        </div>
      )}

      {/* Profile completion nudge */}
      {!patientProfile && (
        <div className="mb-4 rounded-xl bg-purple-50 border border-purple-200 p-4 flex items-start gap-3">
          <svg className="h-5 w-5 text-purple-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <div className="flex-1">
            <p className="text-sm font-medium text-purple-800">Complete your profile</p>
            <p className="text-xs text-purple-700 mt-0.5">
              Your profile is incomplete. You can fill it online or visit any hospital to complete it.
            </p>
          </div>
          <Link to="/patient/profile" className="text-xs font-medium text-purple-800 hover:underline whitespace-nowrap">
            Complete →
          </Link>
        </div>
      )}

      {/* No card nudge */}
      {patientProfile && !card && (
        <div className="mb-4 rounded-xl bg-blue-50 border border-blue-200 p-4 flex items-start gap-3">
          <svg className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-800">Issue your patient card</p>
            <p className="text-xs text-blue-700 mt-0.5">Hospitals use your card to find you quickly when you arrive. Without it, they can only search by name and phone.</p>
          </div>
          <Link to="/patient/card" className="text-xs font-medium text-blue-800 hover:underline whitespace-nowrap">
            Get card →
          </Link>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard
          label="Medical Records"
          value={records?.length ?? 0}
          href="/patient/records"
          color="blue"
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />
        <StatCard
          label="Patient Card"
          value={card ? 'Active' : 'Not issued'}
          href="/patient/card"
          color={card ? 'green' : 'amber'}
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0" />
            </svg>
          }
        />
        <StatCard
          label="Pending Requests"
          value={pendingRequests.length}
          href="/patient/access-requests"
          color={pendingRequests.length > 0 ? 'amber' : 'gray'}
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          }
        />
      </div>

      {/* Profile summary */}
      {patientProfile ? (
        <div className="card">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Your Profile</h2>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <InfoRow label="Full name" value={patientProfile?.full_name} />
            <InfoRow label="Email" value={user?.email} />
            <InfoRow label="Phone" value={user?.phone_number || '—'} />
            <InfoRow label="Date of birth" value={patientProfile?.date_of_birth} />
            <InfoRow label="Gender" value={patientProfile?.gender || '—'} />
            <InfoRow label="Blood type" value={patientProfile?.blood_type || '—'} />
          </dl>
        </div>
      ) : (
        <div className="card bg-gray-50">
          <div className="text-center py-6">
            <svg className="h-12 w-12 text-gray-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <h3 className="text-sm font-medium text-gray-900 mb-1">No Profile Information</h3>
            <p className="text-xs text-gray-500 mb-4">Complete your profile to access all features</p>
            <Link to="/patient/profile" className="btn-primary inline-block">
              Complete Profile
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({
  label, value, href, color, icon,
}: {
  label: string
  value: string | number
  href: string
  color: 'blue' | 'green' | 'amber' | 'gray'
  icon: ReactNode
}) {
  const colors = {
    blue:  'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    amber: 'bg-amber-50 text-amber-600',
    gray:  'bg-gray-100 text-gray-500',
  }
  return (
    <Link to={href} className="card hover:shadow-md transition-shadow flex items-center gap-4">
      <div className={`rounded-lg p-2.5 ${colors[color]}`}>{icon}</div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      </div>
    </Link>
  )
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs text-gray-500">{label}</dt>
      <dd className="font-medium text-gray-900">{value ?? '—'}</dd>
    </div>
  )
}
