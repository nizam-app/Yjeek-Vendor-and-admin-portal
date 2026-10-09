import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { firstAllowedAdminPath } from '../config/adminNavManifest'

export function AdminIndexRedirect() {
  const { user, isAuthInitializing } = useAuth()
  if (isAuthInitializing) return null
  return <Navigate to={firstAllowedAdminPath(user)} replace />
}
