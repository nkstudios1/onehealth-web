import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function UnauthorizedPage() {
  const { user } = useAuth()
  const home = user?.user_type === 'hospital_staff' ? '/staff' : '/patient'
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <p className="text-6xl font-bold text-gray-300">403</p>
        <h1 className="mt-2 text-xl font-semibold text-gray-900">Access denied</h1>
        <p className="mt-1 text-sm text-gray-500">You don't have permission to view this page.</p>
        <Link to={home} className="mt-4 inline-block btn-primary">Go to dashboard</Link>
      </div>
    </div>
  )
}
