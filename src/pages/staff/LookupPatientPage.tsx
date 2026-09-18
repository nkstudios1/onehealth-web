import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { api, extractError } from '../../lib/api'
import Spinner from '../../components/Spinner'

interface LookupResult {
  patient_id: string
  full_name: string
  date_of_birth: string
  gender: string
  card_reference: string
  card_expires_at: string
  access_request_required: boolean
}

export default function LookupPatientPage() {
  const navigate = useNavigate()
  const [cardRef, setCardRef] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<LookupResult | null>(null)

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setResult(null)
    try {
      const { data } = await api.post<{ data: LookupResult }>('/cards/lookup/', {
        card_reference: cardRef.trim(),
      })
      setResult(data.data)
      toast.success('Patient identified')
    } catch (err) {
      toast.error(extractError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Lookup Patient</h1>
        <p className="text-sm text-gray-500 mt-1">
          Enter the patient card reference number to identify a patient.
        </p>
      </div>

      <div className="card mb-6">
        <form onSubmit={handleLookup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Card reference</label>
            <input
              className="input font-mono tracking-wider text-sm"
              placeholder="OH-xxxxxxxxxxxxxxxxxxxxxxxxxx"
              value={cardRef}
              onChange={(e) => setCardRef(e.target.value)}
              required
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
            {loading && <Spinner size="sm" />}
            Lookup patient
          </button>
        </form>
      </div>

      {result && (
        <div className="card">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Patient identified</h2>
          <dl className="space-y-2 text-sm mb-6">
            <div className="flex justify-between">
              <dt className="text-gray-500">Full name</dt>
              <dd className="font-medium text-gray-900">{result.full_name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Date of birth</dt>
              <dd className="font-medium text-gray-900">{result.date_of_birth}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Gender</dt>
              <dd className="font-medium text-gray-900 capitalize">{result.gender || '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Card ref</dt>
              <dd className="font-mono text-xs text-gray-700">{result.card_reference}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Card expires</dt>
              <dd className="font-medium text-gray-900">{new Date(result.card_expires_at).toLocaleDateString()}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Patient ID</dt>
              <dd className="font-mono text-xs text-gray-500">{result.patient_id}</dd>
            </div>
          </dl>

          {result.access_request_required && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800 mb-4">
              An access request is required before you can view this patient's records.
              Start a visit with this patient first, then request access.
            </div>
          )}

          <div className="flex gap-3">
            <button
              className="btn-primary"
              onClick={() => navigate('/staff/visits')}
            >
              Go to Visits →
            </button>
            <button
              className="btn-secondary font-mono text-xs"
              onClick={() => { navigator.clipboard.writeText(result.patient_id); toast.success('Patient ID copied') }}
            >
              Copy patient ID
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
