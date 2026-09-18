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

  if (user.must_change_password) {
    return <Navigate to="/change-password" replace />
  }

  return <Outlet />
}
