import { useState } from 'react'
import type { FormEvent } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { api, extractError } from '../../lib/api'
import { PageSpinner } from '../../components/Spinner'
import EmptyState from '../../components/EmptyState'
import Modal from '../../components/Modal'
import Spinner from '../../components/Spinner'
import type { AccessGrant } from '../../types'

export default function AccessGrantsPage() {
  const qc = useQueryClient()
  const [requestOpen, setRequestOpen] = useState(false)
  const [reqForm, setReqForm] = useState({
    visit: '',
    request_type: 'normal',
    access_level: 'full_record',
  })
  const [saving, setSaving] = useState(false)

  const { data: grants, isLoading } = useQuery({
    queryKey: ['hospital-active-grants'],
    queryFn: async () => {
      const { data } = await api.get<{ data: AccessGrant[] }>('/access-grants/hospital/active/')
      return data.data ?? []
    },
  })

  async function handleRequest(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/access-requests/', reqForm)
      toast.success('Access request sent — waiting for patient approval')
      qc.invalidateQueries({ queryKey: ['hospital-active-grants'] })
      setRequestOpen(false)
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
          <h1 className="text-2xl font-bold text-gray-900">Access Grants</h1>
          <p className="text-sm text-gray-500 mt-1">{grants?.length ?? 0} active grants</p>
        </div>
        <button className="btn-primary" onClick={() => setRequestOpen(true)}>+ Request access</button>
      </div>

      {(!grants || grants.length === 0) ? (
        <EmptyState
          title="No active grants"
          description="Request patient access for an active visit. The patient must approve before you can view their records."
          action={<button className="btn-primary" onClick={() => setRequestOpen(true)}>+ Request access</button>}
        />
      ) : (
        <div className="space-y-3">
          {grants.map((grant) => (
            <div key={grant.id} className="card flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="badge-green">Active</span>
                  <span className="badge-gray capitalize">{grant.access_level.replace('_', ' ')}</span>
                  <span className="badge-blue capitalize">By {grant.granted_by.replace('_', ' ')}</span>
                </div>
                <p className="text-xs text-gray-500">
                  Granted: {new Date(grant.granted_at).toLocaleString()}
                </p>
                <p className="text-xs font-mono text-gray-400 mt-0.5">Request: {grant.access_request}</p>
              </div>
              <Link
                to={`/staff/patient/${grant.access_request}/records`}
                className="btn-secondary text-sm shrink-0"
              >
                View records →
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Request modal */}
      <Modal
        open={requestOpen}
        onClose={() => setRequestOpen(false)}
        title="Request patient access"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setRequestOpen(false)}>Cancel</button>
            <button form="req-form" type="submit" className="btn-primary flex items-center gap-2" disabled={saving}>
              {saving && <Spinner size="sm" />} Send request
            </button>
          </>
        }
      >
        <p className="text-sm text-gray-500 mb-4">
          The patient will receive a notification and must approve this request with their code.
        </p>
        <form id="req-form" onSubmit={handleRequest} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Visit ID</label>
            <input
              className="input font-mono text-sm"
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              value={reqForm.visit}
              onChange={(e) => setReqForm(f => ({...f, visit: e.target.value}))}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Request type</label>
            <select className="input" value={reqForm.request_type} onChange={(e) => setReqForm(f => ({...f, request_type: e.target.value}))}>
              <option value="normal">Normal</option>
              <option value="emergency">Emergency</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Access level</label>
            <select className="input" value={reqForm.access_level} onChange={(e) => setReqForm(f => ({...f, access_level: e.target.value}))}>
              <option value="full_record">Full record</option>
              <option value="critical_info_only">Critical info only</option>
            </select>
          </div>
        </form>
      </Modal>
    </div>
  )
}
