import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { api, extractError } from '../../lib/api'
import Spinner from '../../components/Spinner'

type SearchMode = 'card' | 'name'

interface PatientResult {
  patient_id: string
  full_name: string
  date_of_birth: string
  gender: string
  blood_type: string
  card_reference?: string
  card_expires_at?: string
  has_active_card?: boolean
  access_request_required?: boolean
}

export default function LookupPatientPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [mode, setMode] = useState<SearchMode>('card')
  const [loading, setLoading] = useState(false)
  const [startingVisit, setStartingVisit] = useState(false)

  // Card lookup
  const [cardRef, setCardRef] = useState('')

  // Name/phone search
  const [name, setName]   = useState('')
  const [phone, setPhone] = useState('')

  const [results, setResults] = useState<PatientResult[]>([])
  const [selected, setSelected] = useState<PatientResult | null>(null)

  async function handleCardLookup(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setResults([])
    setSelected(null)
    try {
      const { data } = await api.post<{ data: PatientResult }>('/cards/lookup/', {
        card_reference: cardRef.trim(),
      })
      setSelected(data.data)
      toast.success('Patient identified via card')
    } catch (err) {
      toast.error(extractError(err))
    } finally {
      setLoading(false)
    }
  }

  async function handleSearch(e: FormEvent) {
    e.preventDefault()
    if (!name.trim() && !phone.trim()) {
      toast.error('Enter a name or phone number to search')
      return
    }
    setLoading(true)
    setResults([])
    setSelected(null)
    try {
      const params = new URLSearchParams()
      if (name.trim())  params.set('name',  name.trim())
      if (phone.trim()) params.set('phone', phone.trim())
      const { data } = await api.get<{ data: PatientResult[] }>(`/auth/patients/search/?${params}`)
      setResults(data.data ?? [])
      if ((data.data ?? []).length === 0) toast('No patients found matching that search')
    } catch (err) {
      toast.error(extractError(err))
    } finally {
      setLoading(false)
    }
  }

  async function handleStartVisit(patient: PatientResult) {
    setStartingVisit(true)
    try {
      const { data } = await api.post<{ data: { id: string } }>('/visits/', {
        patient: patient.patient_id,
      })
      const visitId = data.data.id
      toast.success(`Visit started for ${patient.full_name}`)
      qc.invalidateQueries({ queryKey: ['staff-visits'] })
      // Go directly to the access request page for this visit
      navigate(`/staff/visits/${visitId}/access`)
    } catch (err) {
      toast.error(extractError(err))
    } finally {
      setStartingVisit(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Find Patient</h1>
        <p className="text-sm text-gray-500 mt-1">
          Scan the patient's OneHealth card, or search by name and phone number.
        </p>
      </div>

      {/* Mode toggle */}
      <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-1 mb-6 w-fit">
        <button
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${mode === 'card' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => { setMode('card'); setResults([]); setSelected(null) }}
        >
          📇 Card scan
        </button>
        <button
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${mode === 'name' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => { setMode('name'); setResults([]); setSelected(null) }}
        >
          🔍 Name / phone
        </button>
      </div>

      {/* ── Card lookup ─────────────────────────────────────────────────── */}
      {mode === 'card' && (
        <div className="card mb-6">
          <p className="text-sm text-gray-600 mb-4">
            Enter the reference number printed on the patient's OneHealth card, or scan the QR code on the card.
          </p>
          <form onSubmit={handleCardLookup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Card reference</label>
              <input
                className="input font-mono tracking-wider"
                placeholder="OH-xxxxxxxxxxxxxxxxxxxxxxxxxx"
                value={cardRef}
                onChange={e => setCardRef(e.target.value)}
                required
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading && <Spinner size="sm" />}
              Look up patient
            </button>
          </form>
        </div>
      )}

      {/* ── Name / phone search ──────────────────────────────────────────── */}
      {mode === 'name' && (
        <div className="card mb-6">
          <p className="text-sm text-gray-600 mb-4">
            Search by full name, phone number, or both. At least one field is required.
          </p>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
                <input className="input" placeholder="Nosa Adekunle" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone number</label>
                <input className="input" type="tel" placeholder="08012345678" value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading && <Spinner size="sm" />}
              Search
            </button>
          </form>
        </div>
      )}

      {/* ── Search results list ──────────────────────────────────────────── */}
      {results.length > 0 && (
        <div className="space-y-3 mb-6">
          <p className="text-sm font-medium text-gray-700">{results.length} result(s) — select the correct patient</p>
          {results.map(p => (
            <button
              key={p.patient_id}
              className={`w-full card text-left hover:shadow-md transition-shadow border-2 ${selected?.patient_id === p.patient_id ? 'border-primary-500' : 'border-transparent'}`}
              onClick={() => setSelected(p)}
            >
              <p className="font-semibold text-gray-900">{p.full_name}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                DOB: {p.date_of_birth} · {p.gender} · Blood type: {p.blood_type || '—'}
                {p.has_active_card && <span className="ml-2 badge-green">Has card</span>}
              </p>
            </button>
          ))}
        </div>
      )}

      {/* ── Selected patient panel ───────────────────────────────────────── */}
      {selected && (
        <div className="card border-l-4 border-primary-500">
          <h2 className="text-base font-semibold text-gray-900 mb-3">Patient identified</h2>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm mb-4">
            <InfoRow label="Full name"    value={selected.full_name} />
            <InfoRow label="Date of birth" value={selected.date_of_birth} />
            <InfoRow label="Gender"       value={selected.gender || '—'} />
            <InfoRow label="Blood type"   value={selected.blood_type || '—'} />
            {selected.card_reference && (
              <InfoRow label="Card ref" value={selected.card_reference} mono />
            )}
            {selected.card_expires_at && (
              <InfoRow label="Card expires" value={new Date(selected.card_expires_at).toLocaleDateString()} />
            )}
          </dl>

          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800 mb-4">
            <strong>Access not yet granted.</strong> Starting a visit will allow you to send the patient
            an access request. They will receive an approval code via the app, SMS, and email.
          </div>

          <button
            className="btn-primary w-full flex items-center justify-center gap-2"
            onClick={() => handleStartVisit(selected)}
            disabled={startingVisit}
          >
            {startingVisit && <Spinner size="sm" />}
            Start visit & request access →
          </button>
        </div>
      )}
    </div>
  )
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs text-gray-500">{label}</dt>
      <dd className={`font-medium text-gray-900 ${mono ? 'font-mono text-xs' : ''}`}>{value}</dd>
    </div>
  )
}
