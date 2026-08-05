import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Login from '../pages/Login'
import AdminTwoFactor from '../pages/admin/AdminTwoFactor'
import { adminRoutes } from './AdminRoutes'
import { vendorRoutes } from './VendorRoutes'

export function RequireRole({ role }) {
  const { user, isAuthInitializing } = useAuth()

  // Wait for Vendor Get Me restoration so protected routes do not flash /login.
  if (isAuthInitializing) return null

  if (!user) return <Navigate to="/login" replace />
  if (user.role !== role) {
    return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/dashboard'} replace />
  }
  return <Outlet />
}

function RoleHome() {
  const { user, isAuthInitializing } = useAuth()

  if (isAuthInitializing) return null
  if (!user) return <Navigate to="/login" replace />
  return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/dashboard'} replace />
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/admin/verify" element={<AdminTwoFactor />} />
      <Route path="/" element={<RoleHome />} />

      <Route element={<RequireRole role="vendor" />}>
        {vendorRoutes}
      </Route>

      <Route element={<RequireRole role="admin" />}>
        {adminRoutes}
      </Route>

      <Route path="*" element={<RoleHome />} />
    </Routes>
  )
}
