/**
 * Vendor response mappers.
 *
 * Add mapper files only after inspecting real backend response samples.
 * Do not invent field names. Keep Admin mappers in src/mappers/admin/.
 */

export {
  mapVendorAuthUser,
  mapVendorLoginResponse,
  mapVendorMeResponse,
} from './authMapper'
export { mapVendorDashboardKpis, mapVendorDashboardResponse } from './mapVendorDashboard'
export { mapVendorBranch, mapVendorBranchesResponse } from './mapVendorBranches'
export {
  emptyVendorLiveOrders,
  mapVendorDineInOrder,
  mapVendorLiveOrder,
  mapVendorLiveOrdersResponse,
} from './mapVendorLiveOrders'
export {
  emptyVendorScheduledOrders,
  mapVendorScheduledOrder,
  mapVendorScheduledOrdersResponse,
} from './mapVendorScheduledOrders'
export {
  emptyVendorServiceOrders,
  mapVendorServiceOrder,
  mapVendorServiceOrdersResponse,
} from './mapVendorServiceOrders'
export {
  emptyVendorServiceCalendar,
  mapVendorServiceCalendarDay,
  mapVendorServiceCalendarResponse,
} from './mapVendorServiceCalendar'
export {
  emptyVendorOrderHistory,
  mapVendorOrderDetailResponse,
  mapVendorOrderHistoryItem,
  mapVendorOrderHistoryResponse,
} from './mapVendorOrderHistory'
export { mapVendorOrderReceiptResponse } from './mapVendorOrderReceipt'
