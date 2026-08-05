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
  moveAcceptedOrderOnLiveBoard,
  moveOrderToPreparingOnLiveBoard,
  moveOrderToReadyOnLiveBoard,
  removeRejectedOrderFromLiveBoard,
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
export {
  mapVendorNotification,
  mapVendorNotificationsResponse,
  mapVendorUnreadCountResponse,
} from './mapVendorNotifications'
export { formatMaskedIban, mapVendorAccountResponse } from './mapVendorAccount'
export {
  flattenVendorCatalogCategories,
  mapVendorCatalogCategoriesResponse,
  mapVendorCatalogCategory,
  mapVendorCatalogProduct,
  mapVendorCatalogProductsResponse,
  mapVendorCatalogStoreTypesResponse,
  buildVendorCreateProductBody,
} from './mapVendorCatalog'
export { mapVendorStaffMember, mapVendorStaffResponse } from './mapVendorStaff'
export {
  mapVendorPromotion,
  mapVendorPromotionAnalyticsResponse,
  mapVendorPromotionDetailResponse,
  mapVendorPromotionsResponse,
  mapVendorPromotionsSummaryResponse,
  PROMOTION_FILTERS,
} from './mapVendorPromotions'
export {
  DELIVERY_REJECT_REASONS,
  DINE_IN_REJECT_REASONS,
  mapVendorRejectionReason,
  VENDOR_REJECTION_REASONS,
} from './mapVendorRejectionReason'
