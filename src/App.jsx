import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import VendorLayout from './layout/VendorLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import LiveOrders from './pages/LiveOrders'
import LiveOrderColumn from './pages/LiveOrderColumn'
import Scheduled from './pages/Scheduled'
import ScheduledOrderColumn from './pages/ScheduledOrderColumn'
import Services from './pages/Services'
import OrdersHistory from './pages/OrdersHistory'
import OrderHistoryDetail from './pages/OrderHistoryDetail'
import Catalog from './pages/Catalog'
import FoodCatalog from './pages/FoodCatalog'
import Branches from './pages/Branches'
import EditBranch from './pages/EditBranch'
import BranchMenu from './pages/BranchMenu'
import Staff from './pages/Staff'
import Promotions from './pages/Promotions'
import ConfigurePromotion from './pages/ConfigurePromotion'
import PromotionDetail from './pages/PromotionDetail'
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
            <Route path="/scheduled/:key" element={<ScheduledOrderColumn />} />
            <Route path="/services" element={<Services />} />
            <Route path="/orders-history" element={<OrdersHistory />} />
            <Route path="/orders-history/:orderId" element={<OrderHistoryDetail />} />
            <Route path="/catalog" element={<Catalog />} />
            <Route path="/catalog/food" element={<FoodCatalog />} />
            <Route path="/branches/:branchId/edit" element={<EditBranch />} />
            <Route path="/branches/:branchId/menu" element={<BranchMenu />} />
            <Route path="/branches" element={<Branches />} />
            <Route path="/staff" element={<Staff />} />
            <Route path="/promotions/new" element={<ConfigurePromotion />} />
            <Route path="/promotions/:promoId" element={<PromotionDetail />} />
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
