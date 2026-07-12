import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import VendorLayout from './layout/VendorLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import LiveOrders from './pages/LiveOrders'
import LiveOrderColumn from './pages/LiveOrderColumn'
import Scheduled from './pages/Scheduled'
import Services from './pages/Services'
import OrdersHistory from './pages/OrdersHistory'
import Catalog from './pages/Catalog'
import Branches from './pages/Branches'
import Staff from './pages/Staff'
import Promotions from './pages/Promotions'
import Notifications from './pages/Notifications'
import Account from './pages/Account'

function ProtectedRoute() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return <Outlet />
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<VendorLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/live-orders" element={<LiveOrders />} />
            <Route path="/live-orders/:key" element={<LiveOrderColumn />} />
            <Route path="/scheduled" element={<Scheduled />} />
            <Route path="/services" element={<Services />} />
            <Route path="/orders-history" element={<OrdersHistory />} />
            <Route path="/catalog" element={<Catalog />} />
            <Route path="/branches" element={<Branches />} />
            <Route path="/staff" element={<Staff />} />
            <Route path="/promotions" element={<Promotions />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/account" element={<Account />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  )
}
