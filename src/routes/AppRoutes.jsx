import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AdminLogin from '../pages/admin/AdminLogin'
import AdminTwoFactor from '../pages/admin/AdminTwoFactor'
import AdminAcceptInvite from '../pages/admin/AdminAcceptInvite'
import { adminRoutes } from './AdminRoutes'

export function RequireRole({ role }) {
  const { user, isAuthInitializing } = useAuth()

  if (isAuthInitializing) return null

  if (!user) {
    return <Navigate to="/login" replace />
  }
  if (user.role !== role) {
    return <Navigate to="/admin/dashboard" replace />
  }
  return <Outlet />
}

function RoleHome() {
  const { user, isAuthInitializing } = useAuth()

  if (isAuthInitializing) return null
  if (!user) return <Navigate to="/login" replace />
  return <Navigate to="/admin/dashboard" replace />
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<AdminLogin />} />
      <Route path="/admin/login" element={<Navigate to="/login" replace />} />
      <Route path="/accept-invite" element={<AdminAcceptInvite />} />
      <Route path="/admin/accept-invite" element={<Navigate to="/accept-invite" replace />} />
      <Route path="/admin/verify" element={<AdminTwoFactor />} />
      <Route path="/" element={<RoleHome />} />

      <Route element={<RequireRole role="admin" />}>
        {adminRoutes}
      </Route>

      <Route path="*" element={<RoleHome />} />
    </Routes>
  )
}
