import { useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { api, extractError } from '../../lib/api'
import { PageSpinner } from '../../components/Spinner'
import type { PatientCard } from '../../types'

export default function PatientCardPage() {
  const qc = useQueryClient()

  const { data: card, isLoading } = useQuery({
    queryKey: ['my-card'],
    queryFn: async () => {
      const { data } = await api.get<{ data: PatientCard | null }>('/patients/me/card/')
      return data.data
    },
  })

  async function issueCard() {
    try {
      await api.post('/patients/me/card/')
      toast.success('Card issued!')
      qc.invalidateQueries({ queryKey: ['my-card'] })
    } catch (err) {
      toast.error(extractError(err))
    }
  }

  async function renewCard() {
    try {
      await api.post('/patients/me/card/renew/')
      toast.success('Card renewed!')
      qc.invalidateQueries({ queryKey: ['my-card'] })
    } catch (err) {
      toast.error(extractError(err))
    }
  }

  async function revokeCard() {
    if (!confirm('Are you sure you want to revoke your patient card? Hospitals will no longer be able to look you up by this card.')) return
    try {
      await api.post('/patients/me/card/revoke/')
      toast.success('Card revoked')
      qc.invalidateQueries({ queryKey: ['my-card'] })
    } catch (err) {
      toast.error(extractError(err))
    }
  }

  if (isLoading) return <PageSpinner />

  const expired = card && new Date(card.expires_at) <= new Date()

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Patient Card</h1>
        <p className="text-sm text-gray-500 mt-1">
          Your digital patient card is used by hospitals to look you up and request access to your records.
        </p>
      </div>

      {!card || card.status === 'revoked' || expired ? (
        <div className="card text-center py-10">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
            <svg className="h-7 w-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-900">
            {expired ? 'Your card has expired' : 'You don\'t have an active card'}
          </p>
          <p className="text-xs text-gray-500 mt-1 mb-5">
            Issue a new card so hospitals can identify you
          </p>
          <button className="btn-primary" onClick={issueCard}>Issue patient card</button>
        </div>
      ) : (
        <div className="relative rounded-2xl bg-gradient-to-br from-primary-700 to-primary-900 p-6 text-white shadow-xl">
          {/* Card header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <svg className="h-6 w-6 text-white opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span className="font-semibold tracking-wide">OneHealth</span>
            </div>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${card.status === 'active' ? 'bg-green-400 text-green-900' : 'bg-red-400 text-red-900'}`}>
              {card.status.toUpperCase()}
            </span>
          </div>

          {/* Reference */}
          <div className="mb-6">
            <p className="text-xs opacity-70 mb-1">Card Reference</p>
            <p className="text-lg font-mono font-semibold tracking-widest">{card.card_reference}</p>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs opacity-70">Issued</p>
              <p className="font-medium">{new Date(card.issued_at).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-xs opacity-70">Expires</p>
              <p className="font-medium">{new Date(card.expires_at).toLocaleDateString()}</p>
            </div>
            {card.renewed_at && (
              <div>
                <p className="text-xs opacity-70">Last renewed</p>
                <p className="font-medium">{new Date(card.renewed_at).toLocaleDateString()}</p>
              </div>
            )}
          </div>

          {/* Decorative circle */}
          <div className="pointer-events-none absolute right-[-20px] top-[-20px] h-40 w-40 rounded-full bg-white/5" />
          <div className="pointer-events-none absolute bottom-[-30px] left-[60%] h-56 w-56 rounded-full bg-white/5" />
        </div>
      )}

      {/* Actions */}
      {card && card.status === 'active' && !expired && (
        <div className="mt-4 flex gap-3">
          <button className="btn-secondary" onClick={renewCard}>Renew card</button>
          <button className="btn-danger" onClick={revokeCard}>Revoke card</button>
        </div>
      )}

      <div className="mt-6 rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-800">
        <strong>How it works:</strong> When you visit a hospital, the staff scans your card reference to look you up.
        They must still request access, and you (or an emergency contact) must approve before they can see your records.
      </div>
    </div>
  )
}
