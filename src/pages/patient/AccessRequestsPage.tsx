import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { api, extractError } from '../../lib/api'
import { PageSpinner } from '../../components/Spinner'
import EmptyState from '../../components/EmptyState'
import Modal from '../../components/Modal'
import Spinner from '../../components/Spinner'
import type { AccessRequest } from '../../types'

const statusBadge = (s: AccessRequest['status']) => {
  switch (s) {
    case 'pending':  return <span className="badge-yellow">Pending</span>
    case 'approved': return <span className="badge-green">Approved</span>
    case 'denied':   return <span className="badge-red">Denied</span>
    case 'expired':  return <span className="badge-gray">Expired</span>
  }
}

export default function AccessRequestsPage() {
  const qc = useQueryClient()
  const [approveTarget, setApproveTarget] = useState<AccessRequest | null>(null)
  const [code, setCode] = useState('')
  const [saving, setSaving] = useState(false)

  const { data: requests, isLoading } = useQuery({
    queryKey: ['my-access-requests'],
    queryFn: async () => {
      const { data } = await api.get<{ data: AccessRequest[] }>('/patients/me/access-requests/')
      return data.data ?? []
    },
  })

  async function handleApprove(e: React.FormEvent) {
    e.preventDefault()
    if (!approveTarget) return
    setSaving(true)
    try {
      await api.post(`/access-requests/${approveTarget.id}/approve/`, { code })
      toast.success('Access approved')
      qc.invalidateQueries({ queryKey: ['my-access-requests'] })
      setApproveTarget(null)
      setCode('')
    } catch (err) {
      toast.error(extractError(err))
    } finally {
      setSaving(false)
    }
  }

  async function handleDeny(req: AccessRequest) {
    if (!confirm('Deny this access request?')) return
    try {
      await api.post(`/access-requests/${req.id}/deny/`)
      toast.success('Request denied')
      qc.invalidateQueries({ queryKey: ['my-access-requests'] })
    } catch (err) {
      toast.error(extractError(err))
    }
  }

  async function handleRevoke(grantId: string) {
    if (!confirm('Revoke this access grant? The hospital will lose access to your records.')) return
    try {
      await api.post(`/access-grants/${grantId}/revoke/`)
      toast.success('Access revoked')
      qc.invalidateQueries({ queryKey: ['my-access-requests'] })
    } catch (err) {
      toast.error(extractError(err))
    }
  }

  if (isLoading) return <PageSpinner />

  const pending = requests?.filter(r => r.status === 'pending') ?? []
  const others  = requests?.filter(r => r.status !== 'pending') ?? []

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Access Requests</h1>
        <p className="text-sm text-gray-500 mt-1">Hospitals requesting access to your medical records</p>
      </div>

      {(!requests || requests.length === 0) ? (
        <EmptyState title="No access requests" description="You'll see hospital access requests here when a hospital staff member requests your records." />
      ) : (
        <div className="space-y-6">
          {/* Pending section */}
          {pending.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Pending — action required</h2>
              <div className="space-y-3">
                {pending.map((req) => (
                  <div key={req.id} className="card border-l-4 border-amber-400">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {statusBadge(req.status)}
                          {req.request_type === 'emergency' && (
                            <span className="badge-red">🚨 Emergency</span>
                          )}
                          <span className="badge-gray capitalize">{req.access_level.replace('_', ' ')}</span>
                        </div>
                        <p className="text-sm font-medium text-gray-900">{req.hospital_name ?? req.hospital}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Requested {new Date(req.created_at).toLocaleString()}
                          {req.patient_response_deadline && (
                            <> · Expires {new Date(req.patient_response_deadline).toLocaleString()}</>
                          )}
                        </p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button className="btn-primary text-sm" onClick={() => setApproveTarget(req)}>
                          Approve
                        </button>
                        <button className="btn-danger text-sm" onClick={() => handleDeny(req)}>
                          Deny
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* History */}
          {others.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">History</h2>
              <div className="space-y-3">
                {others.map((req) => (
                  <div key={req.id} className="card">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {statusBadge(req.status)}
                          <span className="badge-gray capitalize">{req.access_level.replace('_', ' ')}</span>
                        </div>
                        <p className="text-sm font-medium text-gray-900">{req.hospital_name ?? req.hospital}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(req.created_at).toLocaleString()}
                        </p>
                      </div>
                      {req.status === 'approved' && (
                        <button className="btn-danger text-sm shrink-0" onClick={() => handleRevoke(req.id)}>
                          Revoke
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Approve modal */}
      <Modal
        open={!!approveTarget}
        onClose={() => { setApproveTarget(null); setCode('') }}
        title="Approve access request"
        footer={
          <>
            <button className="btn-secondary" onClick={() => { setApproveTarget(null); setCode('') }}>Cancel</button>
            <button form="approve-form" type="submit" className="btn-primary flex items-center gap-2" disabled={saving}>
              {saving && <Spinner size="sm" />} Approve
            </button>
          </>
        }
      >
        <p className="text-sm text-gray-600 mb-4">
          Enter the 6-digit approval code sent to you by the hospital or via notification.
        </p>
        <form id="approve-form" onSubmit={handleApprove} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Approval code</label>
            <input
              className="input text-center text-2xl tracking-widest font-mono"
              placeholder="000000"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              required
            />
          </div>
        </form>
      </Modal>
    </div>
  )
}
