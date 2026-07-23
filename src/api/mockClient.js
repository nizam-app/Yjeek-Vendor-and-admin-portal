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

function findMockBranch(url) {
  const match = String(url).match(/^\/vendor-panel\/branches\/([^/?]+)$/)
  if (!match) return null
  const id = decodeURIComponent(match[1])
  return (
    vendorMock.branches.find((b) => b.id === id) ||
    vendorMock.branches.find((b) => b.name === id) ||
    null
  )
}

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
  'GET /vendor-panel/dashboard': () => ({
    kpis: vendorMock.kpis,
    revenueDays: vendorMock.revenueDays,
    topSellers: vendorMock.topSellers,
    recentOrders: vendorMock.recentOrders,
  }),
  'GET /vendor/profile': () => ({ vendor: vendorMock.vendor, branches: vendorMock.branches }),
  'GET /orders/live': () => ({ delivery: vendorMock.liveOrders, dineIn: vendorMock.dineInOrders }),
  'GET /vendor-panel/orders/live': ({ params }) => {
    if (params?.tab === 'dine_in') {
      return {
        tab: 'dine_in',
        columns: {
          new: vendorMock.dineInOrders.new,
          confirmed: vendorMock.dineInOrders.confirmed,
          preparing: vendorMock.dineInOrders.preparing,
          readyForGuest: vendorMock.dineInOrders.ready,
        },
        activeCount:
          vendorMock.dineInOrders.new.length +
          vendorMock.dineInOrders.confirmed.length +
          vendorMock.dineInOrders.preparing.length +
          vendorMock.dineInOrders.ready.length,
      }
    }
    // Confirmed delivery_pickup board shape
    return {
      tab: 'delivery_pickup',
      columns: {
        new: vendorMock.liveOrders.new,
        accepted: vendorMock.liveOrders.accepted,
        preparing: vendorMock.liveOrders.preparing,
        ready: vendorMock.liveOrders.ready,
      },
    }
  },
  'GET /orders/scheduled': () => vendorMock.scheduledOrders,
  'GET /vendor-panel/orders/scheduled': () => ({
    columns: {
      new: vendorMock.scheduledOrders.new,
      confirmed: vendorMock.scheduledOrders.confirmed,
      preparing: vendorMock.scheduledOrders.preparing,
      readyForPickup: vendorMock.scheduledOrders.readyForPickup,
    },
    count:
      vendorMock.scheduledOrders.new.length +
      vendorMock.scheduledOrders.confirmed.length +
      vendorMock.scheduledOrders.preparing.length +
      vendorMock.scheduledOrders.readyForPickup.length,
    filters: {
      date: 'today',
      window: 'all',
      sort: 'window',
      search: '',
    },
  }),
  'GET /orders/history': () => vendorMock.orderHistory,
  'GET /vendor-panel/orders/history': () => ({
    orders: vendorMock.orderHistory,
  }),
  'GET /services/bookings': () => vendorMock.serviceBookings,
  'GET /vendor-panel/orders/services': () => ({
    view: 'board',
    columns: {
      new: vendorMock.serviceBookings.new,
      confirmed: vendorMock.serviceBookings.upcoming,
      inProgress: vendorMock.serviceBookings.inProgress,
    },
  }),
  'GET /vendor-panel/orders/services/calendar': ({ params } = {}) => {
    const counts = vendorMock.serviceCalendarBookings?.counts || {}
    const requestedMonth = params?.month ? String(params.month) : null
    const days = Object.entries(counts).map(([date, count]) => {
      const dayPart = date.slice(8) // DD
      const mappedDate =
        requestedMonth && /^\d{4}-\d{2}$/.test(requestedMonth)
          ? `${requestedMonth}-${dayPart}`
          : date
      return {
        date: mappedDate,
        count: Number(count) || 0,
        statuses: { confirmed: Number(count) || 0 },
      }
    })
    return {
      month: requestedMonth,
      totalBookings: days.reduce((sum, day) => sum + day.count, 0),
      days,
    }
  },
  'GET /services/calendar': () => ({
    calendar: vendorMock.serviceCalendarBookings,
    days: vendorMock.serviceCalendarDayBookings,
  }),
  'GET /catalog/store-types': () => vendorMock.catalogStoreTypes,
  'GET /catalog/items': () => vendorMock.catalogItems,
  'GET /branches': () => vendorMock.branches,
  'GET /vendor-panel/branches': () => ({
    count: vendorMock.branches.length,
    branches: vendorMock.branches,
  }),
  'PATCH /vendor-panel/branches/close-all': () => ({
    count: vendorMock.branches.length,
    branches: vendorMock.branches.map((b) => ({
      ...b,
      status: 'CLOSED',
      operationalStatus: 'CLOSED',
    })),
  }),
  'PATCH /vendor-panel/branches/open-all': () => ({
    count: vendorMock.branches.length,
    branches: vendorMock.branches.map((b) => ({
      ...b,
      status: 'OPEN',
      operationalStatus: 'OPEN',
    })),
  }),
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
    const key = `${method.toUpperCase()} ${url}`
    let route = mockRoutes[key]

    // Dynamic branch detail / update / set-status for mock mode
    if (!route && method.toUpperCase() === 'GET') {
      const branch = findMockBranch(url)
      if (branch) route = () => branch

      // GET /vendor-panel/orders/:orderId (exclude known collection paths)
      if (!route) {
        const detailMatch = String(url).match(/^\/vendor-panel\/orders\/([^/?]+)$/)
        if (detailMatch) {
          const orderId = decodeURIComponent(detailMatch[1])
          const reserved = new Set(['live', 'scheduled', 'services', 'history'])
          if (!reserved.has(orderId)) {
            const found =
              (vendorMock.orderHistory || []).find(
                (o) =>
                  o.id === orderId ||
                  o.backendId === orderId ||
                  String(o.id || '').replace(/^#/, '') === orderId.replace(/^#/, ''),
              ) || (vendorMock.orderHistory || [])[0]
            route = () => {
              if (!found) return null
              if (found.orderType) return found
              return {
                id: found.backendId || found.id || orderId,
                orderNumber: String(found.id || '').replace(/^#/, '') || 'YJK-MOCK-001',
                orderType:
                  found.type === 'Dine-in'
                    ? 'DINE_IN'
                    : found.type === 'Pickup'
                      ? 'PICKUP'
                      : found.type === 'Services'
                        ? 'SERVICE'
                        : 'DELIVERY',
                fulfillmentType: 'ON_DEMAND',
                deliverySpeed: null,
                status: String(found.status || 'CONFIRMED').toUpperCase().replace(/\s+/g, '_'),
                paymentStatus: 'PAID',
                paymentMethod: found.paid || 'CASH',
                branch: {
                  id: 'mock-branch',
                  name: found.branch || 'Mock Branch',
                  area: found.branchArea || '—',
                },
                customer: {
                  id: 'mock-customer',
                  name: found.customer || 'Guest',
                  phone: found.customerPhone || null,
                },
                partySize: null,
                items: found.items || [],
                timeline: found.timeline || [],
                totalAmount: found.total,
                when: found.when,
              }
            }
          }
        }
      }

      // GET /vendor-panel/orders/:orderId/receipt
      if (!route) {
        const receiptMatch = String(url).match(/^\/vendor-panel\/orders\/([^/?]+)\/receipt$/)
        if (receiptMatch) {
          const orderId = decodeURIComponent(receiptMatch[1])
          const found =
            (vendorMock.orderHistory || []).find(
              (o) =>
                o.id === orderId ||
                o.backendId === orderId ||
                String(o.id || '').replace(/^#/, '') === orderId.replace(/^#/, ''),
            ) || (vendorMock.orderHistory || [])[0]
          route = () => ({
            orderNumber: String(found?.orderNumber || found?.id || 'YJK-MOCK-001').replace(/^#/, ''),
            status: String(found?.status || 'PENDING').toUpperCase().replace(/\s+/g, '_'),
            vendorName: 'Green Kitchen',
            branchName: found?.branch || 'Green Kitchen - Manama',
            orderType:
              found?.type === 'Dine-in'
                ? 'DINE_IN'
                : found?.type === 'Pickup'
                  ? 'PICKUP'
                  : found?.type === 'Services'
                    ? 'SERVICE'
                    : found?.orderType || 'DELIVERY',
            fulfillmentType: 'ON_DEMAND',
            deliverySpeed: null,
            customerName: found?.customer || 'Sara AlMannai',
            items: Array.isArray(found?.items)
              ? found.items.map((item) => ({
                  name: item.name,
                  quantity: item.qty ?? item.quantity ?? 1,
                  unitPrice: Number(String(item.price || '').replace(/[^\d.-]/g, '')) || 3.5,
                  lineTotal: Number(String(item.price || '').replace(/[^\d.-]/g, '')) || 3.5,
                }))
              : [{ name: 'Classic Burger', quantity: 1, unitPrice: 3.5, lineTotal: 3.5 }],
            subtotal: 3.5,
            deliveryFee: 0.45,
            serviceFee: 0.1,
            discountAmount: 0,
            vatAmount: 0.35,
            grandTotal: 4.4,
            paymentMethod: found?.paid || 'CASH',
            paymentStatus: 'PENDING',
          })
        }
      }
    }
    // POST /vendor-panel/orders/:orderId/accept
    if (!route && method.toUpperCase() === 'POST') {
      const acceptMatch = String(url).match(/^\/vendor-panel\/orders\/([^/?]+)\/accept$/)
      if (acceptMatch) {
        const orderId = decodeURIComponent(acceptMatch[1])
        const allOrders = [
          ...(vendorMock.liveOrders?.new || []),
          ...(vendorMock.liveOrders?.accepted || []),
          ...(vendorMock.liveOrders?.preparing || []),
          ...(vendorMock.liveOrders?.ready || []),
          ...(vendorMock.dineInOrders?.new || []),
          ...(vendorMock.dineInOrders?.confirmed || []),
          ...(vendorMock.dineInOrders?.preparing || []),
          ...(vendorMock.dineInOrders?.ready || []),
        ]
        const found =
          allOrders.find((o) => o.id === orderId || o.backendId === orderId || o.orderNumber === orderId) ||
          allOrders[0] ||
          null
        route = () => ({
          ...(found && typeof found === 'object' ? found : {}),
          id: found?.id || found?.backendId || orderId,
          orderNumber: found?.orderNumber || found?.id || 'YJK-MOCK-001',
          orderType: found?.orderType || 'DELIVERY',
          status: 'CONFIRMED',
          confirmedAt: new Date().toISOString(),
          items: Array.isArray(found?.items)
            ? found.items
            : [
                {
                  id: 'mock-item-1',
                  name: 'Classic Burger',
                  quantity: 1,
                  unitPrice: 4.4,
                  lineTotal: 4.4,
                },
              ],
          totalAmount: found?.totalAmount ?? 4.4,
          subtotal: found?.subtotal ?? 4.4,
          vatAmount: found?.vatAmount ?? 0.44,
          deliveryFee: found?.deliveryFee ?? 0,
          paymentMethod: found?.paymentMethod || 'YJEEK_WALLET',
          paymentStatus: found?.paymentStatus || 'PAID',
          customer: found?.customer || { id: 'mock-customer', name: found?.customer || found?.guest || 'Guest' },
          branch: found?.branch || { id: 'mock-branch', name: found?.branch || 'Mock Branch', area: '—' },
          itemsPreview: found?.itemsPreview || found?.items || '1x Classic Burger',
          itemCount: found?.itemCount ?? 1,
        })
      }
    }
    if (!route && method.toUpperCase() === 'PATCH') {
      const statusMatch = String(url).match(/^\/vendor-panel\/branches\/([^/?]+)\/status$/)
      if (statusMatch) {
        const branchId = decodeURIComponent(statusMatch[1])
        const branch =
          vendorMock.branches.find((b) => b.id === branchId) ||
          vendorMock.branches.find((b) => b.name === branchId)
        if (branch) {
          route = ({ body: patchBody }) => {
            const nextStatus = patchBody?.status || branch.status
            return {
              ...branch,
              status: nextStatus,
              operationalStatus: nextStatus,
            }
          }
        }
      } else {
        const branch = findMockBranch(url)
        if (branch) {
          route = ({ body: patchBody }) => ({
            ...branch,
            ...(patchBody && typeof patchBody === 'object' ? patchBody : {}),
          })
        }
      }
    }

    if (!route) {
      throw new Error(`No mock API route registered for ${key}`)
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
