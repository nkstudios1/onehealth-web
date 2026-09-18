import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { UserType } from '../types'

interface Props {
  allowedTypes?: UserType[]
}

export default function ProtectedRoute({ allowedTypes }: Props) {
  const { user } = useAuth()

  if (!user) return <Navigate to="/login" replace />

  if (allowedTypes && !allowedTypes.includes(user.user_type)) {
    return <Navigate to="/unauthorized" replace />
  }

  // must_change_password only applies to hospital_staff (temp password flow)
  if (user.must_change_password && user.user_type === 'hospital_staff') {
    return <Navigate to="/change-password" replace />
  }

  return <Outlet />
}
