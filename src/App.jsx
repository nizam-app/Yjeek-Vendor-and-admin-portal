import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import VendorLayout from './layout/VendorLayout'
import AdminLayout from './layout/AdminLayout'
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
import { AdminDashboard, AdminManagement, AdminOperations } from './pages/admin/AdminPages'
import { AdminScheduledColumn } from './pages/admin/AdminScheduledColumn'
import { AdminAssignChamp } from './pages/admin/AdminAssignChamp'
import AdminTwoFactor from './pages/admin/AdminTwoFactor'

function RequireRole({ role }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== role) {
    return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/dashboard'} replace />
  }
  return <Outlet />
}

function RoleHome() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/dashboard'} replace />
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/admin/verify" element={<AdminTwoFactor />} />
        <Route path="/" element={<RoleHome />} />

        <Route element={<RequireRole role="vendor" />}>
          <Route element={<VendorLayout />}>
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

        <Route element={<RequireRole role="admin" />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="live-orders" element={<AdminOperations mode="live orders" />} />
            <Route path="scheduled" element={<AdminOperations mode="scheduled" />} />
            <Route path="scheduled/assign/:orderId" element={<AdminAssignChamp />} />
            <Route path="scheduled/:columnKey" element={<AdminScheduledColumn />} />
            <Route path="pickup" element={<AdminOperations mode="pickup" />} />
            <Route path="dine-in" element={<AdminOperations mode="dine-in" />} />
            <Route path="services" element={<AdminOperations mode="services" />} />
            <Route path="vendors" element={<AdminManagement type="vendors" />} />
            <Route path="stores" element={<AdminManagement type="stores" />} />
            <Route path="fleet" element={<AdminManagement type="fleet" />} />
            <Route path="customers" element={<AdminManagement type="customers" />} />
            <Route path="marketing" element={<AdminManagement type="marketing" />} />
            <Route path="sla-models" element={<AdminManagement type="sla-models" />} />
            <Route path="ui-editor" element={<AdminManagement type="ui-editor" />} />
            <Route path="users" element={<AdminManagement type="users" />} />
            <Route path="reports" element={<AdminManagement type="reports" />} />
            <Route path="settings" element={<AdminManagement type="settings" />} />
          </Route>
        </Route>

        <Route path="*" element={<RoleHome />} />
      </Routes>
    </AuthProvider>
  )
}
