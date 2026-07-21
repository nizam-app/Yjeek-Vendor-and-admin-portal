import { Route } from 'react-router-dom'
import VendorLayout from '../layout/VendorLayout'
import Dashboard from '../pages/vendor/Dashboard'
import LiveOrders from '../pages/vendor/LiveOrders'
import LiveOrderColumn from '../pages/vendor/LiveOrderColumn'
import Scheduled from '../pages/vendor/Scheduled'
import ScheduledOrderColumn from '../pages/vendor/ScheduledOrderColumn'
import Services from '../pages/vendor/Services'
import OrdersHistory from '../pages/vendor/OrdersHistory'
import OrderHistoryDetail from '../pages/vendor/OrderHistoryDetail'
import Catalog from '../pages/vendor/Catalog'
import FoodCatalog from '../pages/vendor/FoodCatalog'
import Branches from '../pages/vendor/Branches'
import EditBranch from '../pages/vendor/EditBranch'
import BranchMenu from '../pages/vendor/BranchMenu'
import Staff from '../pages/vendor/Staff'
import Promotions from '../pages/vendor/Promotions'
import ConfigurePromotion from '../pages/vendor/ConfigurePromotion'
import PromotionDetail from '../pages/vendor/PromotionDetail'
import Notifications from '../pages/vendor/Notifications'
import Account from '../pages/vendor/Account'

/** Nested under RequireRole(vendor). Pathless layout → relative children resolve at site root. */
export const vendorRoutes = (
  <Route element={<VendorLayout />}>
    <Route path="dashboard" element={<Dashboard />} />
    <Route path="live-orders" element={<LiveOrders />} />
    <Route path="live-orders/:key" element={<LiveOrderColumn />} />
    <Route path="scheduled" element={<Scheduled />} />
    <Route path="scheduled/:key" element={<ScheduledOrderColumn />} />
    <Route path="services" element={<Services />} />
    <Route path="orders-history" element={<OrdersHistory />} />
    <Route path="orders-history/:orderId" element={<OrderHistoryDetail />} />
    <Route path="catalog" element={<Catalog />} />
    <Route path="catalog/food" element={<FoodCatalog />} />
    <Route path="branches/:branchId/edit" element={<EditBranch />} />
    <Route path="branches/:branchId/menu" element={<BranchMenu />} />
    <Route path="branches" element={<Branches />} />
    <Route path="staff" element={<Staff />} />
    <Route path="promotions/new" element={<ConfigurePromotion />} />
    <Route path="promotions/:promoId" element={<PromotionDetail />} />
    <Route path="promotions" element={<Promotions />} />
    <Route path="notifications" element={<Notifications />} />
    <Route path="account" element={<Account />} />
  </Route>
)
