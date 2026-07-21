import { Navigate, Route } from 'react-router-dom'
import AdminLayout from '../layout/AdminLayout'
import AdminDashboardPage from '../pages/admin/dashboard/AdminDashboardPage'
import AdminLiveOrdersPage from '../pages/admin/operations/AdminLiveOrdersPage'
import AdminScheduledOrdersPage from '../pages/admin/operations/AdminScheduledOrdersPage'
import AdminPickupPage from '../pages/admin/operations/AdminPickupPage'
import AdminDineInPage from '../pages/admin/operations/AdminDineInPage'
import AdminServicesPage from '../pages/admin/operations/AdminServicesPage'
import { AdminScheduledColumn } from '../pages/admin/AdminScheduledColumn'
import { AdminAssignChamp } from '../pages/admin/AdminAssignChamp'
import AdminAddVendorPage from '../pages/admin/vendors/AdminAddVendorPage'
import AdminAddVendorBrunchs from '../pages/admin/vendors/AdminAddVendorBrunchs'
import AdminAddVendorUser from '../pages/admin/vendors/AdminAddVendorUser'
import AdminVendorsPage from '../pages/admin/management/AdminVendorsPage'
import AdminVendorDetailPage from '../pages/admin/management/AdminVendorDetailPage'
import AdminStoresPage from '../pages/admin/management/AdminStoresPage'
import AdminFleetPage from '../pages/admin/management/AdminFleetPage'
import AdminCustomersPage from '../pages/admin/management/AdminCustomersPage'
import AdminMarketingPage from '../pages/admin/management/AdminMarketingPage'
import AdminSlaModelsPage from '../pages/admin/management/AdminSlaModelsPage'
import AdminUsersPage from '../pages/admin/management/AdminUsersPage'
import AdminReportsPage from '../pages/admin/management/AdminReportsPage'
import AdminUiEditorPage from '../pages/admin/ui-editor/AdminUiEditorPage'
import AdminSettingsPage from '../pages/admin/settings/AdminSettingsPage'

/** Nested under RequireRole(admin). Relative children under /admin. */
export const adminRoutes = (
  <Route path="/admin" element={<AdminLayout />}>
    <Route index element={<Navigate to="/admin/dashboard" replace />} />
    <Route path="dashboard" element={<AdminDashboardPage />} />
    <Route path="live-orders" element={<AdminLiveOrdersPage />} />
    <Route path="scheduled" element={<AdminScheduledOrdersPage />} />
    <Route path="scheduled/assign/:orderId" element={<AdminAssignChamp />} />
    <Route path="scheduled/:columnKey" element={<AdminScheduledColumn />} />
    <Route path="pickup" element={<AdminPickupPage />} />
    <Route path="dine-in" element={<AdminDineInPage />} />
    <Route path="services" element={<AdminServicesPage />} />
    <Route path="vendors/new" element={<AdminAddVendorPage />} />
    <Route path="vendors/new/branches/:branchId" element={<AdminAddVendorBrunchs />} />
    <Route path="vendors/new/users/:userId" element={<AdminAddVendorUser />} />
    <Route path="vendors/:vendorId/branches/new" element={<AdminAddVendorBrunchs />} />
    <Route path="vendors/:vendorId/branches/:branchId" element={<AdminAddVendorBrunchs />} />
    <Route path="vendors/:vendorId/users/new" element={<AdminAddVendorUser />} />
    <Route path="vendors/:vendorId/users/:userId" element={<AdminAddVendorUser />} />
    <Route path="vendors/:vendorId" element={<AdminVendorDetailPage />} />
    <Route path="vendors" element={<AdminVendorsPage />} />
    <Route path="stores" element={<AdminStoresPage />} />
    <Route path="fleet" element={<AdminFleetPage />} />
    <Route path="customers" element={<AdminCustomersPage />} />
    <Route path="marketing" element={<AdminMarketingPage />} />
    <Route path="sla-models" element={<AdminSlaModelsPage />} />
    <Route path="ui-editor" element={<AdminUiEditorPage />} />
    <Route path="users" element={<AdminUsersPage />} />
    <Route path="reports" element={<AdminReportsPage />} />
    <Route path="settings" element={<AdminSettingsPage />} />
  </Route>
)
