import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { api, extractError } from '../../lib/api'
import { PageSpinner } from '../../components/Spinner'
import EmptyState from '../../components/EmptyState'
import Modal from '../../components/Modal'
import Spinner from '../../components/Spinner'
import type { EmergencyContact } from '../../types'

export default function EmergencyContactsPage() {
  const qc = useQueryClient()
  const [addOpen, setAddOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    full_name: '', relationship: '', phone_number: '', email: '',
  })

  const { data: contacts, isLoading } = useQuery({
    queryKey: ['emergency-contacts'],
    queryFn: async () => {
      const { data } = await api.get<{ data: EmergencyContact[] }>('/patients/me/emergency-contacts/')
      return data.data ?? []
    },
  })

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/patients/me/emergency-contacts/', form)
      toast.success('Emergency contact added')
      qc.invalidateQueries({ queryKey: ['emergency-contacts'] })
      setAddOpen(false)
      setForm({ full_name: '', relationship: '', phone_number: '', email: '' })
    } catch (err) {
      toast.error(extractError(err))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this emergency contact?')) return
    try {
      await api.delete(`/emergency-contacts/${id}/`)
      toast.success('Contact removed')
      qc.invalidateQueries({ queryKey: ['emergency-contacts'] })
    } catch (err) {
      toast.error(extractError(err))
    }
  }

  if (isLoading) return <PageSpinner />

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Emergency Contacts</h1>
          <p className="text-sm text-gray-500 mt-1">
            These contacts can approve emergency medical access when you're unreachable. Max 5.
          </p>
        </div>
        {(contacts?.length ?? 0) < 5 && (
          <button className="btn-primary" onClick={() => setAddOpen(true)}>+ Add contact</button>
        )}
      </div>

      {(!contacts || contacts.length === 0) ? (
        <EmptyState
          title="No emergency contacts"
          description="Add trusted contacts who can authorise emergency access to your records."
          action={<button className="btn-primary" onClick={() => setAddOpen(true)}>+ Add contact</button>}
        />
      ) : (
        <div className="space-y-3">
          {contacts.map((contact) => (
            <div key={contact.id} className="card flex items-center gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700 font-semibold text-sm">
                {contact.full_name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{contact.full_name}</p>
                <p className="text-xs text-gray-500">
                  {contact.relationship && `${contact.relationship} · `}
                  {contact.phone_number}
                  {contact.email && ` · ${contact.email}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="badge-gray text-xs">#{contact.priority_order}</span>
                <button
                  className="text-red-500 hover:text-red-700 p-1 rounded"
                  onClick={() => handleDelete(contact.id)}
                  aria-label="Remove contact"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add emergency contact"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setAddOpen(false)}>Cancel</button>
            <button form="add-contact-form" type="submit" className="btn-primary flex items-center gap-2" disabled={saving}>
              {saving && <Spinner size="sm" />} Add contact
            </button>
          </>
        }
      >
        <form id="add-contact-form" onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
            <input className="input" value={form.full_name} onChange={(e) => setForm(f => ({...f, full_name: e.target.value}))} required placeholder="Mary Doe" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Relationship</label>
            <input className="input" value={form.relationship} onChange={(e) => setForm(f => ({...f, relationship: e.target.value}))} placeholder="Mother, Spouse, Friend…" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone number</label>
            <input className="input" type="tel" value={form.phone_number} onChange={(e) => setForm(f => ({...f, phone_number: e.target.value}))} required placeholder="08012345678" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email (optional)</label>
            <input className="input" type="email" value={form.email} onChange={(e) => setForm(f => ({...f, email: e.target.value}))} placeholder="mary@example.com" />
          </div>
        </form>
      </Modal>
    </div>
  )
}
