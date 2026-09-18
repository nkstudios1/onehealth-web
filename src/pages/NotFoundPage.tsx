import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <p className="text-6xl font-bold text-gray-300">404</p>
        <h1 className="mt-2 text-xl font-semibold text-gray-900">Page not found</h1>
        <p className="mt-1 text-sm text-gray-500">The page you're looking for doesn't exist.</p>
        <Link to="/" className="mt-4 inline-block btn-primary">Go home</Link>
      </div>
    </div>
  )
}
