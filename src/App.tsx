import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

// Auth
import LoginPage from './pages/auth/LoginPage'
import RegisterPatientPage from './pages/auth/RegisterPatientPage'
import RegisterHospitalPage from './pages/auth/RegisterHospitalPage'
import ChangePasswordPage from './pages/auth/ChangePasswordPage'

// Layout / guards
import DashboardLayout from './components/DashboardLayout'
import ProtectedRoute from './components/ProtectedRoute'

// Patient pages
import PatientDashboard from './pages/patient/PatientDashboard'
import MyRecordsPage from './pages/patient/MyRecordsPage'
import PatientCardPage from './pages/patient/PatientCardPage'
import AccessRequestsPage from './pages/patient/AccessRequestsPage'
import EmergencyContactsPage from './pages/patient/EmergencyContactsPage'
import DependentsPage from './pages/patient/DependentsPage'
import PatientVisitsPage from './pages/patient/PatientVisitsPage'
import ProfilePage from './pages/patient/ProfilePage'

// Staff pages
import StaffDashboard from './pages/staff/StaffDashboard'
import VisitsPage from './pages/staff/VisitsPage'
import VisitDetailPage from './pages/staff/VisitDetailPage'
import VisitAccessPage from './pages/staff/VisitAccessPage'
import LookupPatientPage from './pages/staff/LookupPatientPage'
import AccessGrantsPage from './pages/staff/AccessGrantsPage'
import PatientRecordsPage from './pages/staff/PatientRecordsPage'
import TeamPage from './pages/staff/TeamPage'
import AuditLogsPage from './pages/staff/AuditLogsPage'

// Platform admin
import AdminDashboard from './pages/admin/AdminDashboard'

// Misc
import UnauthorizedPage from './pages/UnauthorizedPage'
import NotFoundPage from './pages/NotFoundPage'

function RootRedirect() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.user_type === 'hospital_staff')  return <Navigate to="/staff"   replace />
  if (user.user_type === 'platform_admin')  return <Navigate to="/admin"   replace />
  return <Navigate to="/patient" replace />
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login"              element={<LoginPage />} />
      <Route path="/register/patient"   element={<RegisterPatientPage />} />
      <Route path="/register/hospital"  element={<RegisterHospitalPage />} />
      <Route path="/change-password"    element={<ChangePasswordPage />} />
      <Route path="/unauthorized"       element={<UnauthorizedPage />} />

      {/* ── Patient dashboard ─────────────────────────────────────────── */}
      <Route element={<ProtectedRoute allowedTypes={['patient']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/patient"                      element={<PatientDashboard />} />
          <Route path="/patient/profile"              element={<ProfilePage />} />
          <Route path="/patient/records"              element={<MyRecordsPage />} />
          <Route path="/patient/card"                 element={<PatientCardPage />} />
          <Route path="/patient/access-requests"      element={<AccessRequestsPage />} />
          <Route path="/patient/emergency-contacts"   element={<EmergencyContactsPage />} />
          <Route path="/patient/dependents"           element={<DependentsPage />} />
          <Route path="/patient/visits"               element={<PatientVisitsPage />} />
        </Route>
      </Route>

      {/* ── Hospital staff dashboard ──────────────────────────────────── */}
      <Route element={<ProtectedRoute allowedTypes={['hospital_staff']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/staff"                           element={<StaffDashboard />} />
          <Route path="/staff/visits"                    element={<VisitsPage />} />
          <Route path="/staff/visits/:visitId"           element={<VisitDetailPage />} />
          <Route path="/staff/visits/:visitId/access"    element={<VisitAccessPage />} />
          <Route path="/staff/lookup"                    element={<LookupPatientPage />} />
          <Route path="/staff/access-grants"             element={<AccessGrantsPage />} />
          <Route path="/staff/patient/:patientId/records" element={<PatientRecordsPage />} />
          <Route path="/staff/team"                      element={<TeamPage />} />
          <Route path="/staff/audit"                     element={<AuditLogsPage />} />
        </Route>
      </Route>

      {/* ── Platform admin ────────────────────────────────────────────── */}
      <Route element={<ProtectedRoute allowedTypes={['platform_admin']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>
      </Route>

      {/* Root redirect */}
      <Route path="/" element={<RootRedirect />} />

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
