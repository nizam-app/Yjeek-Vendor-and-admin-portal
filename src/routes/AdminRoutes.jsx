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
import AdminCreateStoreTypePage from '../pages/admin/management/AdminCreateStoreTypePage'
import AdminFleetPage from '../pages/admin/management/AdminFleetPage'
import AdminChampDetailPage from '../pages/admin/management/AdminChampDetailPage'
import AdminAddChampPage from '../pages/admin/management/AdminAddChampPage'
import AdminNotifyChampsPage from '../pages/admin/management/AdminNotifyChampsPage'
import AdminFleetSuppliersPage from '../pages/admin/management/AdminFleetSuppliersPage'
import AdminAddSupplierPage from '../pages/admin/management/AdminAddSupplierPage'
import AdminSupplierDetailPage from '../pages/admin/management/AdminSupplierDetailPage'
import AdminCustomersPage from '../pages/admin/management/AdminCustomersPage'
import AdminCustomerDetailPage from '../pages/admin/management/AdminCustomerDetailPage'
import AdminCreateSegmentPage from '../pages/admin/management/AdminCreateSegmentPage'
import AdminMarketingPage from '../pages/admin/management/AdminMarketingPage'
import AdminCreatePromoCodePage from '../pages/admin/management/AdminCreatePromoCodePage'
import AdminSendCustomerNotificationPage from '../pages/admin/management/AdminSendCustomerNotificationPage'
import AdminSendVendorNotificationPage from '../pages/admin/management/AdminSendVendorNotificationPage'
import AdminNotificationDetailPage from '../pages/admin/management/AdminNotificationDetailPage'
import AdminSlaModelsPage from '../pages/admin/management/AdminSlaModelsPage'
import AdminUsersPage from '../pages/admin/management/AdminUsersPage'
import AdminCreateRolePage from '../pages/admin/management/AdminCreateRolePage'
import AdminCreateUserPage from '../pages/admin/management/AdminCreateUserPage'
import AdminUserDetailPage from '../pages/admin/management/AdminUserDetailPage'
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
    <Route path="stores/new" element={<AdminCreateStoreTypePage />} />
    <Route path="stores/:storeTypeId" element={<AdminCreateStoreTypePage />} />
    <Route path="stores" element={<AdminStoresPage />} />
    <Route path="fleet/new" element={<AdminAddChampPage />} />
    <Route path="fleet/notify" element={<AdminNotifyChampsPage />} />
    <Route path="fleet/suppliers/new" element={<AdminAddSupplierPage />} />
    <Route path="fleet/suppliers/:supplierId" element={<AdminSupplierDetailPage />} />
    <Route path="fleet/suppliers" element={<AdminFleetSuppliersPage />} />
    <Route path="fleet/:champId" element={<AdminChampDetailPage />} />
    <Route path="fleet" element={<AdminFleetPage />} />
    <Route path="customers/new" element={<AdminCreateSegmentPage />} />
    <Route path="customers/:customerId" element={<AdminCustomerDetailPage />} />
    <Route path="customers" element={<AdminCustomersPage />} />
    <Route path="marketing/notifications/customers" element={<AdminSendCustomerNotificationPage />} />
    <Route path="marketing/notifications/vendors" element={<AdminSendVendorNotificationPage />} />
    <Route path="marketing/notifications/:notificationId" element={<AdminNotificationDetailPage />} />
    <Route path="marketing/promo-codes/new" element={<AdminCreatePromoCodePage />} />
    <Route path="marketing/promo-codes" element={<AdminMarketingPage />} />
    <Route path="marketing" element={<AdminMarketingPage />} />
    <Route path="sla-models/champ" element={<AdminSlaModelsPage />} />
    <Route path="sla-models/dispatcher" element={<AdminSlaModelsPage />} />
    <Route path="sla-models" element={<AdminSlaModelsPage />} />

    <Route path="ui-editor" element={<AdminUiEditorPage />} />
    <Route path="users/new" element={<AdminCreateUserPage />} />
    <Route path="users/roles/new" element={<AdminCreateRolePage />} />
    <Route path="users/roles" element={<AdminUsersPage />} />
    <Route path="users/activity" element={<AdminUsersPage />} />
    <Route path="users/:userId" element={<AdminUserDetailPage />} />
    <Route path="users" element={<AdminUsersPage />} />
    <Route path="reports" element={<AdminReportsPage />} />
    <Route path="settings" element={<AdminSettingsPage />} />
  </Route>
)
