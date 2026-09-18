import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { PageSpinner } from '../../components/Spinner'
import EmptyState from '../../components/EmptyState'
import type { AuditLog } from '../../types'

export default function AuditLogsPage() {
  const { data: logs, isLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: async () => {
      const { data } = await api.get<{ data: AuditLog[] }>('/audit-logs/')
      return data.data ?? []
    },
  })

  if (isLoading) return <PageSpinner />

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
        <p className="text-sm text-gray-500 mt-1">All access and change events for your hospital</p>
      </div>

      {(!logs || logs.length === 0) ? (
        <EmptyState title="No audit logs" description="Events will appear here as activity occurs." />
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <div key={log.id} className="card py-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="badge-blue text-xs">{log.event_type.replace(/_/g, ' ')}</span>
                    {log.target_type && <span className="badge-gray text-xs">{log.target_type}</span>}
                  </div>
                  <p className="text-xs text-gray-500 font-mono truncate">
                    User: {log.user ?? 'anonymous'} · IP: {log.ip_address ?? '—'}
                  </p>
                </div>
                <span className="text-xs text-gray-400 shrink-0 whitespace-nowrap">
                  {new Date(log.created_at).toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
