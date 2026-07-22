import {
  adminDashboardMock,
  adminLiveOrdersMock,
  adminManagementMock,
  adminOperationsMock,
  adminPickupMock,
  adminDineInMock,
  adminServicesMock,
  buildAdminVendorDetail,
  buildAdminCustomerDetail,
  buildAdminChampDetail,
} from '../mocks/admin.mock'
import * as vendorMock from '../data/mockData'

const mockRoutes = {
  'GET /admin/dashboard': () => adminDashboardMock,
  'GET /admin/live-orders': () => adminLiveOrdersMock,
  'GET /admin/pickup': () => adminPickupMock,
  'GET /admin/dine-in': () => adminDineInMock,
  'GET /admin/services': () => adminServicesMock,
  'GET /admin/operations': () => adminOperationsMock,
  'GET /admin/management': ({ params }) => adminManagementMock[params?.type] || adminManagementMock.vendors,
  'GET /admin/vendors/detail': ({ params }) => buildAdminVendorDetail(params?.id),
  'GET /admin/customers/detail': ({ params }) => buildAdminCustomerDetail(params?.id),
  'GET /admin/champs/detail': ({ params }) => buildAdminChampDetail(params?.id),
  'GET /vendor/dashboard': () => ({
    kpis: vendorMock.kpis,
    revenueDays: vendorMock.revenueDays,
    topSellers: vendorMock.topSellers,
    recentOrders: vendorMock.recentOrders,
  }),
  'GET /vendor/profile': () => ({ vendor: vendorMock.vendor, branches: vendorMock.branches }),
  'GET /orders/live': () => ({ delivery: vendorMock.liveOrders, dineIn: vendorMock.dineInOrders }),
  'GET /orders/scheduled': () => vendorMock.scheduledOrders,
  'GET /orders/history': () => vendorMock.orderHistory,
  'GET /services/bookings': () => vendorMock.serviceBookings,
  'GET /services/calendar': () => ({
    calendar: vendorMock.serviceCalendarBookings,
    days: vendorMock.serviceCalendarDayBookings,
  }),
  'GET /catalog/store-types': () => vendorMock.catalogStoreTypes,
  'GET /catalog/items': () => vendorMock.catalogItems,
  'GET /branches': () => vendorMock.branches,
  'GET /staff': () => vendorMock.staff,
  'GET /promotions': () => ({
    kpis: vendorMock.promotionKpis,
    filters: vendorMock.promotionFilters,
    promotions: vendorMock.promotions,
  }),
  'GET /notifications': () => vendorMock.notifications,
  'GET /content/login': () => vendorMock.loginFeatures,
}

const clone = (value) => structuredClone(value)

function createRequestId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID()
    } catch {
      // HTTP over LAN IP is not a secure context in some browsers
    }
  }
  return `req-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export const mockClient = {
  async request({ method = 'GET', url, params, body }) {
    const route = mockRoutes[`${method.toUpperCase()} ${url}`]
    if (!route) {
      throw new Error(`No mock API route registered for ${method.toUpperCase()} ${url}`)
    }

    const data = route({ params, body })
    return Promise.resolve({
      data: clone(data),
      meta: {
        requestId: createRequestId(),
        timestamp: new Date().toISOString(),
      },
    })
  },
  get(url, options = {}) {
    return this.request({ method: 'GET', url, ...options })
  },
  post(url, body, options = {}) {
    return this.request({ method: 'POST', url, body, ...options })
  },
  put(url, body, options = {}) {
    return this.request({ method: 'PUT', url, body, ...options })
  },
  patch(url, body, options = {}) {
    return this.request({ method: 'PATCH', url, body, ...options })
  },
  delete(url, options = {}) {
    return this.request({ method: 'DELETE', url, ...options })
  },
}
