// ─── Auth / Users ────────────────────────────────────────────────────────────

export type UserType = 'patient' | 'hospital_staff' | 'platform_admin'

export interface PatientProfile {
  id: string
  full_name: string
  date_of_birth: string
  gender: string
  blood_type: string
  account_type: 'self_managed' | 'dependent' | 'community_enrolled'
  created_at: string
}

export interface User {
  id: string
  email: string
  phone_number: string
  user_type: UserType
  must_change_password?: boolean
  // UserSerializer.get_profile returns PatientProfileSerializer for patients
  // and HospitalStaffProfileSerializer for hospital_staff.
  profile?: PatientProfile | StaffProfile
}

export interface StaffProfile {
  id: string
  full_name: string
  role: 'doctor' | 'nurse' | 'admin'
  professional_license_number: string
  hospital: string
  hospital_name: string
  hospital_verification_status: 'pending' | 'verified' | 'rejected' | 'suspended'
  created_at: string
}

export interface Hospital {
  id: string
  name: string
  registration_number: string
  phermc_number: string
  cac_number: string
  address: string
  verification_status: 'pending' | 'verified' | 'rejected' | 'suspended'
  created_at: string
}

export interface Tokens {
  access: string
  refresh: string
}

export interface LoginResponse {
  user: User
  tokens: Tokens
}

// ─── Medical Records ──────────────────────────────────────────────────────────

export type EntryType =
  | 'allergy'
  | 'condition'
  | 'medication'
  | 'procedure'
  | 'note'
  | 'lab_result'
  | 'imaging'
  | 'vaccination'

export interface MedicalRecord {
  id: string
  entry_type: EntryType
  description: string
  verification_status: 'self_reported' | 'doctor_verified'
  verified_by_staff: string | null
  created_by_staff: string | null
  hospital: string | null
  visit: string | null
  supersedes_entry: string | null
  created_at: string
}

// ─── Visits ───────────────────────────────────────────────────────────────────

export interface Visit {
  id: string
  patient: string
  patient_name?: string
  hospital: string
  hospital_name?: string
  status: 'active' | 'checked_out'
  admitted_at: string
  checked_out_at: string | null
  checkout_requested_by_patient_at: string | null
  created_by_staff: string | null
}

export interface Vital {
  id: string
  visit: string
  blood_pressure_systolic: number | null
  blood_pressure_diastolic: number | null
  heart_rate: number | null
  temperature_c: number | null
  respiratory_rate: number | null
  oxygen_saturation: number | null
  weight_kg: number | null
  height_cm: number | null
  notes: string
  recorded_at: string
  recorded_by_staff: string | null
}

export interface Medication {
  id: string
  patient: string
  visit: string | null
  medication: string
  dose: string
  route: string
  frequency: string
  duration: string
  reason: string
  status: 'current' | 'previous'
  prescribed_by_staff: string | null
  created_at: string
}

// ─── Patient Card ─────────────────────────────────────────────────────────────

export interface PatientCard {
  id: string
  card_reference: string
  issued_at: string
  renewed_at: string | null
  expires_at: string
  status: 'active' | 'revoked'
}

// ─── Access ───────────────────────────────────────────────────────────────────

export interface AccessRequest {
  id: string
  visit: string
  patient: string
  hospital: string
  hospital_name?: string
  requested_by_staff: string
  requested_by_staff_name?: string
  request_type: 'normal' | 'emergency'
  access_level: 'critical_info_only' | 'full_record'
  status: 'pending' | 'approved' | 'denied' | 'expired'
  approval_code: string
  created_at: string
  responded_at: string | null
  patient_response_deadline: string | null
}

export interface AccessGrant {
  id: string
  access_request: string
  access_level: 'critical_info_only' | 'full_record'
  granted_at: string
  granted_by: 'patient' | 'emergency_contact'
  revoked_at: string | null
  revoked_by: string | null
}

// ─── Emergency Contacts ───────────────────────────────────────────────────────

export interface EmergencyContact {
  id: string
  full_name: string
  relationship: string
  phone_number: string
  email: string
  priority_order: number
  is_active: boolean
  created_at: string
}

// ─── Escalation ───────────────────────────────────────────────────────────────

export interface EmergencyEscalation {
  id: string
  access_request: string
  stage: 'patient_notified' | 'emergency_contact_notified'
  triggered_at: string
  resolved_at: string | null
  resolved_by: string
}

// ─── Audit ────────────────────────────────────────────────────────────────────

export interface AuditLog {
  id: string
  event_type: string
  user: string | null
  patient: string | null
  hospital: string | null
  target_type: string | null
  target_id: string | null
  ip_address: string | null
  created_at: string
  metadata: Record<string, unknown>
}

// ─── Type guards ─────────────────────────────────────────────────────────────

export function isPatientProfile(profile: PatientProfile | StaffProfile | undefined): profile is PatientProfile {
  return !!profile && 'date_of_birth' in profile
}

export function isStaffProfile(profile: PatientProfile | StaffProfile | undefined): profile is StaffProfile {
  return !!profile && 'role' in profile
}

export interface ApiResponse<T = unknown> {
  status: boolean
  message: string
  data?: T
}
