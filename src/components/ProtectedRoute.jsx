import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import LoadingScreen from './LoadingScreen'

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, profile, loading, initialized } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (!initialized) return
    if (!user) {
      navigate('/login', { replace: true, state: { from: location } })
      return
    }
    if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
      navigate('/unauthorized', { replace: true })
    }
  }, [initialized, user, profile, allowedRoles, navigate, location])

  if (!initialized || loading) return <LoadingScreen />
  if (!user) return null
  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) return null

  return children
}
