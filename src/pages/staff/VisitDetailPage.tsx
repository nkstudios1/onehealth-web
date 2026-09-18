import { useState } from 'react'
import type { FormEvent } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { api, extractError } from '../../lib/api'
import { PageSpinner } from '../../components/Spinner'
import Modal from '../../components/Modal'
import Spinner from '../../components/Spinner'
import EmptyState from '../../components/EmptyState'
import type { MedicalRecord, Vital, Medication } from '../../types'

type Tab = 'records' | 'vitals' | 'medications'

const entryTypeLabel: Record<string, string> = {
  allergy: 'Allergy', condition: 'Condition', medication: 'Medication',
  procedure: 'Procedure', note: 'Note', lab_result: 'Lab Result',
  imaging: 'Imaging', vaccination: 'Vaccination',
}

export default function VisitDetailPage() {
  const { visitId } = useParams<{ visitId: string }>()
  const qc = useQueryClient()
  const [tab, setTab] = useState<Tab>('records')

  // ── Records ──────────────────────────────────────────────────────────────
  const { data: records, isLoading: recLoading } = useQuery({
    queryKey: ['visit-records', visitId],
    queryFn: async () => {
      const { data } = await api.get<{ data: MedicalRecord[] }>(`/visits/${visitId}/records/`)
      return data.data ?? []
    },
    enabled: !!visitId && tab === 'records',
  })

  const [recForm, setRecForm] = useState({ entry_type: 'note', description: '' })
  const [recOpen, setRecOpen] = useState(false)
  const [recSaving, setRecSaving] = useState(false)

  async function handleAddRecord(e: FormEvent) {
    e.preventDefault()
    setRecSaving(true)
    try {
      await api.post(`/visits/${visitId}/records/`, recForm)
      toast.success('Record added')
      qc.invalidateQueries({ queryKey: ['visit-records', visitId] })
      setRecOpen(false)
      setRecForm({ entry_type: 'note', description: '' })
    } catch (err) { toast.error(extractError(err)) }
    finally { setRecSaving(false) }
  }

  // ── Vitals ──────────────────────────────────────────────────────────────
  const { data: vitals, isLoading: vitLoading } = useQuery({
    queryKey: ['visit-vitals', visitId],
    queryFn: async () => {
      const { data } = await api.get<{ data: Vital[] }>(`/visits/${visitId}/vitals/`)
      return data.data ?? []
    },
    enabled: !!visitId && tab === 'vitals',
  })

  const [vitForm, setVitForm] = useState({
    blood_pressure_systolic: '', blood_pressure_diastolic: '', heart_rate: '',
    temperature_c: '', respiratory_rate: '', oxygen_saturation: '',
    weight_kg: '', height_cm: '', notes: '',
  })
  const [vitOpen, setVitOpen] = useState(false)
  const [vitSaving, setVitSaving] = useState(false)

  async function handleAddVitals(e: FormEvent) {
    e.preventDefault()
    setVitSaving(true)
    // strip empty strings so the backend gets nulls
    const payload = Object.fromEntries(
      Object.entries(vitForm).map(([k, v]) => [k, v === '' ? null : v])
    )
    try {
      await api.post(`/visits/${visitId}/vitals/`, payload)
      toast.success('Vitals recorded')
      qc.invalidateQueries({ queryKey: ['visit-vitals', visitId] })
      setVitOpen(false)
      setVitForm({ blood_pressure_systolic: '', blood_pressure_diastolic: '', heart_rate: '', temperature_c: '', respiratory_rate: '', oxygen_saturation: '', weight_kg: '', height_cm: '', notes: '' })
    } catch (err) { toast.error(extractError(err)) }
    finally { setVitSaving(false) }
  }

  // ── Medications ──────────────────────────────────────────────────────────
  const { data: medications, isLoading: medLoading } = useQuery({
    queryKey: ['visit-medications', visitId],
    queryFn: async () => {
      const { data } = await api.get<{ data: Medication[] }>(`/visits/${visitId}/medications/`)
      return data.data ?? []
    },
    enabled: !!visitId && tab === 'medications',
  })

  const [medForm, setMedForm] = useState({
    medication: '', dose: '', route: '', frequency: '', duration: '', reason: '',
  })
  const [medOpen, setMedOpen] = useState(false)
  const [medSaving, setMedSaving] = useState(false)

  async function handleAddMed(e: FormEvent) {
    e.preventDefault()
    setMedSaving(true)
    try {
      await api.post(`/visits/${visitId}/medications/`, medForm)
      toast.success('Medication added')
      qc.invalidateQueries({ queryKey: ['visit-medications', visitId] })
      setMedOpen(false)
      setMedForm({ medication: '', dose: '', route: '', frequency: '', duration: '', reason: '' })
    } catch (err) { toast.error(extractError(err)) }
    finally { setMedSaving(false) }
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link to="/staff/visits" className="text-sm text-gray-500 hover:text-gray-700">← Visits</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-bold text-gray-900">Visit Detail</h1>
      </div>

      {/* Action bar */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Link to={`/staff/visits/${visitId}/access`} className="btn-primary text-sm">
          Request access →
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        {(['records', 'vitals', 'medications'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize ${
              tab === t ? 'border-primary-600 text-primary-700' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── Records tab ─────────────────────────────────────────────────── */}
      {tab === 'records' && (
        <>
          <div className="flex justify-end mb-4">
            <button className="btn-primary" onClick={() => setRecOpen(true)}>+ Add record</button>
          </div>
          {recLoading ? <PageSpinner /> : (!records || records.length === 0) ? (
            <EmptyState title="No records for this visit" action={<button className="btn-primary" onClick={() => setRecOpen(true)}>+ Add record</button>} />
          ) : (
            <div className="space-y-3">
              {records.map(r => (
                <div key={r.id} className="card">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="badge-blue">{entryTypeLabel[r.entry_type] ?? r.entry_type}</span>
                    <span className={r.verification_status === 'doctor_verified' ? 'badge-green' : 'badge-gray'}>
                      {r.verification_status === 'doctor_verified' ? '✓ Verified' : 'Unverified'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-800">{r.description}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(r.created_at).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
          <Modal open={recOpen} onClose={() => setRecOpen(false)} title="Add medical record"
            footer={<><button className="btn-secondary" onClick={() => setRecOpen(false)}>Cancel</button><button form="rec-form" type="submit" className="btn-primary flex items-center gap-2" disabled={recSaving}>{recSaving && <Spinner size="sm" />}Save</button></>}>
            <form id="rec-form" onSubmit={handleAddRecord} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select className="input" value={recForm.entry_type} onChange={e => setRecForm(f => ({...f, entry_type: e.target.value}))}>
                  {Object.entries(entryTypeLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea className="input min-h-[80px]" value={recForm.description} onChange={e => setRecForm(f => ({...f, description: e.target.value}))} required />
              </div>
            </form>
          </Modal>
        </>
      )}

      {/* ── Vitals tab ──────────────────────────────────────────────────── */}
      {tab === 'vitals' && (
        <>
          <div className="flex justify-end mb-4">
            <button className="btn-primary" onClick={() => setVitOpen(true)}>+ Record vitals</button>
          </div>
          {vitLoading ? <PageSpinner /> : (!vitals || vitals.length === 0) ? (
            <EmptyState title="No vitals recorded" action={<button className="btn-primary" onClick={() => setVitOpen(true)}>+ Record vitals</button>} />
          ) : (
            <div className="space-y-3">
              {vitals.map(v => (
                <div key={v.id} className="card">
                  <p className="text-xs text-gray-400 mb-3">{new Date(v.recorded_at).toLocaleString()}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <VitalItem label="BP" value={v.blood_pressure_systolic && v.blood_pressure_diastolic ? `${v.blood_pressure_systolic}/${v.blood_pressure_diastolic} mmHg` : null} />
                    <VitalItem label="Heart rate"  value={v.heart_rate ? `${v.heart_rate} bpm` : null} />
                    <VitalItem label="Temp"        value={v.temperature_c ? `${v.temperature_c} °C` : null} />
                    <VitalItem label="SpO₂"        value={v.oxygen_saturation ? `${v.oxygen_saturation}%` : null} />
                    <VitalItem label="Weight"      value={v.weight_kg ? `${v.weight_kg} kg` : null} />
                    <VitalItem label="Height"      value={v.height_cm ? `${v.height_cm} cm` : null} />
                    <VitalItem label="Resp. rate"  value={v.respiratory_rate ? `${v.respiratory_rate}/min` : null} />
                  </div>
                  {v.notes && <p className="text-xs text-gray-600 mt-2 border-t pt-2">{v.notes}</p>}
                </div>
              ))}
            </div>
          )}
          <Modal open={vitOpen} onClose={() => setVitOpen(false)} title="Record vitals"
            footer={<><button className="btn-secondary" onClick={() => setVitOpen(false)}>Cancel</button><button form="vit-form" type="submit" className="btn-primary flex items-center gap-2" disabled={vitSaving}>{vitSaving && <Spinner size="sm" />}Save</button></>}>
            <form id="vit-form" onSubmit={handleAddVitals} className="grid grid-cols-2 gap-4">
              <VitInput label="Systolic BP (mmHg)"  value={vitForm.blood_pressure_systolic}  onChange={v => setVitForm(f => ({...f, blood_pressure_systolic: v}))} />
              <VitInput label="Diastolic BP (mmHg)" value={vitForm.blood_pressure_diastolic} onChange={v => setVitForm(f => ({...f, blood_pressure_diastolic: v}))} />
              <VitInput label="Heart rate (bpm)"    value={vitForm.heart_rate}               onChange={v => setVitForm(f => ({...f, heart_rate: v}))} />
              <VitInput label="Temperature (°C)"    value={vitForm.temperature_c}            onChange={v => setVitForm(f => ({...f, temperature_c: v}))} />
              <VitInput label="Resp. rate (/min)"   value={vitForm.respiratory_rate}         onChange={v => setVitForm(f => ({...f, respiratory_rate: v}))} />
              <VitInput label="SpO₂ (%)"            value={vitForm.oxygen_saturation}        onChange={v => setVitForm(f => ({...f, oxygen_saturation: v}))} />
              <VitInput label="Weight (kg)"         value={vitForm.weight_kg}                onChange={v => setVitForm(f => ({...f, weight_kg: v}))} />
              <VitInput label="Height (cm)"         value={vitForm.height_cm}                onChange={v => setVitForm(f => ({...f, height_cm: v}))} />
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea className="input" value={vitForm.notes} onChange={e => setVitForm(f => ({...f, notes: e.target.value}))} rows={2} />
              </div>
            </form>
          </Modal>
        </>
      )}

      {/* ── Medications tab ──────────────────────────────────────────────── */}
      {tab === 'medications' && (
        <>
          <div className="flex justify-end mb-4">
            <button className="btn-primary" onClick={() => setMedOpen(true)}>+ Add medication</button>
          </div>
          {medLoading ? <PageSpinner /> : (!medications || medications.length === 0) ? (
            <EmptyState title="No medications recorded" action={<button className="btn-primary" onClick={() => setMedOpen(true)}>+ Add medication</button>} />
          ) : (
            <div className="space-y-3">
              {medications.map(m => (
                <div key={m.id} className="card">
                  <p className="font-medium text-gray-900">{m.medication}</p>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-gray-500 mt-1">
                    {m.dose      && <span>Dose: {m.dose}</span>}
                    {m.route     && <span>Route: {m.route}</span>}
                    {m.frequency && <span>Frequency: {m.frequency}</span>}
                    {m.duration  && <span>Duration: {m.duration}</span>}
                    {m.reason    && <span className="col-span-2">Reason: {m.reason}</span>}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{new Date(m.created_at).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
          <Modal open={medOpen} onClose={() => setMedOpen(false)} title="Add medication"
            footer={<><button className="btn-secondary" onClick={() => setMedOpen(false)}>Cancel</button><button form="med-form" type="submit" className="btn-primary flex items-center gap-2" disabled={medSaving}>{medSaving && <Spinner size="sm" />}Save</button></>}>
            <form id="med-form" onSubmit={handleAddMed} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Medication name <span className="text-red-500">*</span></label>
                <input className="input" value={medForm.medication} onChange={e => setMedForm(f => ({...f, medication: e.target.value}))} required placeholder="Amoxicillin" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Dose</label><input className="input" value={medForm.dose} onChange={e => setMedForm(f => ({...f, dose: e.target.value}))} placeholder="500mg" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Route</label><input className="input" value={medForm.route} onChange={e => setMedForm(f => ({...f, route: e.target.value}))} placeholder="Oral" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label><input className="input" value={medForm.frequency} onChange={e => setMedForm(f => ({...f, frequency: e.target.value}))} placeholder="Twice daily" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Duration</label><input className="input" value={medForm.duration} onChange={e => setMedForm(f => ({...f, duration: e.target.value}))} placeholder="7 days" /></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Reason / indication</label><input className="input" value={medForm.reason} onChange={e => setMedForm(f => ({...f, reason: e.target.value}))} placeholder="Bacterial infection" /></div>
            </form>
          </Modal>
        </>
      )}
    </div>
  )
}

function VitalItem({ label, value }: { label: string; value: string | null }) {
  if (!value) return null
  return (
    <div className="rounded-lg bg-gray-50 border border-gray-100 p-2 text-center">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-semibold text-gray-900">{value}</p>
    </div>
  )
}

function VitInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
      <input className="input" type="number" step="any" value={value} onChange={e => onChange(e.target.value)} />
    </div>
  )
}
