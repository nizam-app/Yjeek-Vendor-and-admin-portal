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

function findMockPromotion(promotionId) {
  return (
    (vendorMock.promotions || []).find(
      (p) => p.id === promotionId || p.title === promotionId,
    ) || (vendorMock.promotions || [])[0] || null
  )
}

function buildMockPromotionApiPayload(found, promotionId, overrides = {}) {
  if (!found) return null
  const isBogo = found.type === 'Buy X Get Y'
  const isPercent = found.type === '% off' || String(found.detailMeta || '').includes('%')
  return {
    id: found.id || promotionId,
    name: found.title,
    type: isBogo
      ? 'BUY_X_GET_Y'
      : found.type === 'Free delivery'
        ? 'FREE_DELIVERY'
        : isPercent
          ? 'PERCENTAGE_OFF'
          : 'ITEM_CATEGORY_DEAL',
    status: String(found.status || 'Active').toUpperCase(),
    isPaused: found.status === 'Paused',
    scope: found.scope,
    appliesTo: found.scope === 'Selected items' ? 'SELECTED_ITEMS' : 'ALL_MENU',
    applyToAllBranches: true,
    discountValue: isPercent ? 20 : null,
    discountUnit: isPercent ? 'PERCENT' : null,
    maxDiscountCap: isPercent ? 3 : null,
    minOrderAmount: 5,
    showDealBadge: true,
    waiveDeliveryFee: found.type === 'Free delivery',
    firstOrderOnly: false,
    buyQuantity: isBogo ? 1 : null,
    getQuantity: isBogo ? 1 : null,
    bogoRewardType: isBogo ? 'FREE' : null,
    bogoRewardPercent: null,
    discountCheapestItem: isBogo,
    limitOneRewardPerOrder: isBogo,
    startsAt: '2026-03-22T00:00:00.000Z',
    endsAt: '2026-03-30T00:00:00.000Z',
    noEndDate: false,
    recurrenceRule: null,
    totalUsageLimit: 1000,
    usesPerCustomer: 1,
    usageCount: found.used ?? 0,
    used: found.used ?? 0,
    categories: [],
    products: isBogo
      ? [{ id: 'mock-product-1', name: 'Classic Burger' }]
      : [],
    rewardProducts: isBogo
      ? [{ id: 'mock-product-2', name: 'Margherita Pizza' }]
      : [],
    branches: [],
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z',
    // Mock-only extras for rich detail UI until backend sends chart/recent
    detailMeta: found.detailMeta,
    kpis: found.kpis,
    chart: found.chart,
    chartPeakDay: found.chartPeakDay,
    chartPeakValue: found.chartPeakValue,
    chartTotal: found.chartTotal,
    settings: found.settings,
    recent: found.recent,
    ...overrides,
  }
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
  'GET /vendor-panel/account': () => ({
    profile: {
      fullName: 'Green Kitchen Admin',
      displayName: 'Green Kitchen Admin',
      email: vendorMock.vendor?.email || 'admin@greenkitchen.bh',
      phone: '+973 38866628',
      role: 'GROUP_ADMIN',
      avatarUrl:
        'https://ui-avatars.com/api/?name=Green%20Kitchen&background=2D6A4F&color=fff',
    },
    business: {
      legalName: 'Green Kitchen W.L.L',
      crNumber: '119111-3',
      vatNumber: '220011223300',
      businessAddress: 'Building 2732, Road 3649, Block 436, Al Seef, Bahrain',
    },
    payout: {
      bankName: 'National Bank of Bahrain',
      ibanMasked: 'BH57****************4417',
      verificationStatus: 'VERIFIED',
    },
  }),
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
  'GET /vendor-panel/catalog/store-types': () => ({
    items: (vendorMock.catalogStoreTypes || [])
      .filter((type) => type.id !== 'all')
      .map((type, index) => ({
        id: `store-type-${type.id}`,
        name: type.title,
        slug: String(type.id).replace(/-/g, '_'),
        icon: '',
        iconEmoji: null,
        iconUrl: null,
        sortOrder: index + 1,
        isFeatured: true,
        orderModes: [],
        fulfillment: {
          onDemandDelivery: type.id === 'food',
          pickup: type.id === 'pickup' || type.id === 'food',
          dineIn: type.id === 'dine-in',
          scheduled: false,
          services: false,
        },
        description: type.description,
      })),
  }),
  'GET /catalog/items': () => vendorMock.catalogItems,
  'GET /vendor-panel/catalog/categories': () => ({
    items: [
      {
        id: 'gk-cat-mains',
        name: 'Main course',
        nameAr: 'الأطباق الرئيسية',
        parentId: null,
        sortOrder: 1,
        isActive: true,
        productCount: 3,
        children: [
          {
            id: 'gk-cat-pizza',
            name: 'Pizza',
            nameAr: null,
            parentId: 'gk-cat-mains',
            sortOrder: 1,
            isActive: true,
            productCount: 1,
            children: [],
          },
        ],
      },
      {
        id: 'gk-cat-salads',
        name: 'Salads',
        nameAr: null,
        parentId: null,
        sortOrder: 2,
        isActive: true,
        productCount: 1,
        children: [],
      },
      {
        id: 'gk-cat-drinks',
        name: 'Drinks',
        nameAr: null,
        parentId: null,
        sortOrder: 3,
        isActive: true,
        productCount: 1,
        children: [],
      },
      {
        id: 'gk-cat-desserts',
        name: 'Desserts',
        nameAr: null,
        parentId: null,
        sortOrder: 4,
        isActive: true,
        productCount: 1,
        children: [],
      },
    ],
  }),
  'GET /vendor-panel/catalog/products': () => ({
    count: (vendorMock.catalogItems || []).length,
    items: (vendorMock.catalogItems || []).map((item) => {
      const categoryLeaf = item.category?.includes('·')
        ? item.category.split('·').pop().trim()
        : item.categoryValue || 'Main course'
      const categoryIdByLeaf = {
        Mains: 'gk-cat-mains',
        Pizza: 'gk-cat-pizza',
        Salads: 'gk-cat-salads',
        Drinks: 'gk-cat-drinks',
        Desserts: 'gk-cat-desserts',
      }
      return {
        id: item.id,
        name: item.name,
        nameAr: item.nameAr || null,
        description: item.descriptionEn || item.description || null,
        descriptionAr: item.descriptionAr || null,
        price: Number(item.priceValue) || 0,
        compareAtPrice: Number(item.priceValue) || 0,
        hasModifiers: Boolean(item.optionGroups?.length || item.badgeTone === 'options'),
        prepTimeMin: Number(item.prepTime) || 20,
        badges: (item.badges || []).map((b) => String(b).toUpperCase()),
        availabilitySlots: ['ALL_DAY'],
        availableFrom: item.availableFrom || '11:00',
        availableTo: item.availableTo || '23:00',
        stockType: String(item.stock || '').toLowerCase().includes('left')
          ? 'TRACKED'
          : 'MADE_TO_ORDER',
        stockLabel: item.stock || 'Made to order',
        isActive: item.status !== 'Inactive' && item.active !== false,
        isAvailable: true,
        catalogCategory: {
          id: categoryIdByLeaf[categoryLeaf] || `cat-${categoryLeaf.toLowerCase()}`,
          name: categoryLeaf,
          parent: null,
        },
        platformCategory: {
          id: 'platform-food',
          name: 'Food',
        },
        storeTypeMenuCategory: null,
      }
    }),
  }),
  'POST /vendor-panel/catalog/products': ({ body } = {}) => {
    const payload = body && typeof body === 'object' ? body : {}
    const id = `mock-product-${Date.now().toString(36)}`
    const created = {
      id,
      name: payload.name || 'Untitled product',
      nameAr: payload.nameAr ?? null,
      description: payload.description ?? null,
      descriptionAr: payload.descriptionAr ?? null,
      price: Number(payload.price) || 0,
      compareAtPrice: payload.compareAtPrice ?? null,
      hasModifiers: false,
      imageUrl: null,
      imageUrls: [],
      prepTimeMin: Number(payload.prepTimeMin) || 0,
      badges: Array.isArray(payload.badges) ? payload.badges : [],
      availabilitySlots: Array.isArray(payload.availabilitySlots) ? payload.availabilitySlots : [],
      availableFrom: payload.availableFrom ?? null,
      availableTo: payload.availableTo ?? null,
      stockType: payload.stockType || 'MADE_TO_ORDER',
      stockQty: payload.stockQty ?? null,
      stockLabel: payload.stockType === 'TRACKED' ? 'In stock' : 'Made to order',
      isActive: payload.isActive !== false,
      isAvailable: payload.isAvailable !== false,
      maxOrder: Number(payload.maxOrder) || 0,
      catalogCategory: payload.catalogCategoryId
        ? { id: payload.catalogCategoryId, name: 'Main course', parent: null }
        : null,
      platformCategory: { id: 'platform-food', name: 'Food' },
      storeTypeMenuCategory: null,
    }
    return created
  },
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
  'GET /vendor-panel/staff': () => ({
    count: (vendorMock.staff || []).length,
    items: (vendorMock.staff || []).map((member, index) => ({
      id: member.id || `staff-${index + 1}`,
      displayName: member.name || member.displayName,
      email: member.email,
      phone: member.phone,
      phoneRaw: String(member.phone || '').replace(/\D/g, '').slice(-8) || null,
      countryCode: '+973',
      role: member.role || 'BRANCH_MANAGER',
      status: String(member.status || 'Active').toUpperCase() === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
      branch: {
        id: `branch-${String(member.branch || 'unknown')
          .toLowerCase()
          .replace(/\s+/g, '-')}`,
        name: `Green Kitchen — ${member.branch || 'Branch'}`,
        area: member.branch || '—',
      },
      userId: member.userId || `user-${index + 1}`,
      createdAt: member.createdAt || new Date().toISOString(),
      updatedAt: member.updatedAt || new Date().toISOString(),
    })),
  }),
  'GET /promotions': () => ({
    kpis: vendorMock.promotionKpis,
    filters: vendorMock.promotionFilters,
    promotions: vendorMock.promotions,
  }),
  'GET /vendor-panel/promotions': () => ({
    count: (vendorMock.promotions || []).length,
    items: (vendorMock.promotions || []).map((promo) => ({
      id: promo.id,
      name: promo.title,
      type:
        promo.type === 'Buy X Get Y'
          ? 'BUY_X_GET_Y'
          : promo.type === 'Free delivery'
            ? 'FREE_DELIVERY'
            : promo.type === '% off'
              ? 'PERCENTAGE_OFF'
              : 'ITEM_CATEGORY_DEAL',
      status: String(promo.status || 'Active').toUpperCase(),
      isPaused: promo.status === 'Paused',
      scope: promo.scope,
      applyTo: promo.scope === 'Selected items' ? 'SELECTED_ITEMS' : 'ALL_MENU',
      applyToAllBranches: true,
      discountValue: null,
      discountUnit: null,
      maxDiscountCap: null,
      minOrderAmount: null,
      showDealBadge: true,
      waiveDeliveryFee: promo.type === 'Free delivery',
      firstOrderOnly: false,
      buyQuantity: promo.type === 'Buy X Get Y' ? 1 : null,
      getQuantity: promo.type === 'Buy X Get Y' ? 1 : null,
      bogoRewardType: promo.type === 'Buy X Get Y' ? 'FREE' : null,
      bogoRewardPercent: null,
      discountCheapestItem: promo.type === 'Buy X Get Y',
      // Mock-only extras so PromotionDetail still works until GET detail is wired
      period: promo.period,
      used: promo.used,
      subtitle: promo.subtitle,
      detailMeta: promo.detailMeta,
      kpis: promo.kpis,
      chart: promo.chart,
      chartPeakDay: promo.chartPeakDay,
      chartPeakValue: promo.chartPeakValue,
      chartTotal: promo.chartTotal,
      settings: promo.settings,
      recent: promo.recent,
    })),
  }),
  'GET /vendor-panel/promotions/summary': () => ({
    activePromotions: Number(
      String(vendorMock.promotionKpis?.[0]?.value || '0').replace(/[^\d.-]/g, ''),
    ),
    activeTrend: vendorMock.promotionKpis?.[0]?.delta || '+0 this month',
    redemptions30d: Number(
      String(vendorMock.promotionKpis?.[1]?.value || '0').replace(/[^\d.-]/g, ''),
    ),
    redemptionsChangePercent: Number(
      String(vendorMock.promotionKpis?.[1]?.delta || '0').replace(/[^\d.-]/g, ''),
    ),
    revenueFromPromos: Number(
      String(vendorMock.promotionKpis?.[2]?.value || '0').replace(/[^\d.-]/g, ''),
    ),
    revenueChangePercent: Number(
      String(vendorMock.promotionKpis?.[2]?.delta || '0').replace(/[^\d.-]/g, ''),
    ),
    avgDiscountPct: Number(
      String(vendorMock.promotionKpis?.[3]?.value || '0').replace(/[^\d.-]/g, ''),
    ),
    discountGiven30d: 0,
  }),
  'GET /notifications': () => vendorMock.notifications,
  'GET /vendor-panel/notifications': () => ({
    items: vendorMock.notifications,
  }),
  'GET /vendor-panel/notifications/unread-count': () => ({
    count: (vendorMock.notifications || []).filter((n) => n.unread).length,
  }),
  'PATCH /vendor-panel/notifications/read-all': () => {
    ;(vendorMock.notifications || []).forEach((n) => {
      n.unread = false
      n.highlight = false
      n.isRead = true
    })
    return { success: true }
  },
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

      // GET /vendor-panel/catalog/products/:productId
      if (!route) {
        const productMatch = String(url).match(/^\/vendor-panel\/catalog\/products\/([^/?]+)$/)
        if (productMatch) {
          const productId = decodeURIComponent(productMatch[1])
          const found =
            (vendorMock.catalogItems || []).find((item) => item.id === productId) ||
            (vendorMock.catalogItems || [])[0]
          route = () => {
            if (!found) return null
            const categoryLeaf = found.category?.includes('·')
              ? found.category.split('·').pop().trim()
              : found.categoryValue || 'Main course'
            return {
              id: found.id || productId,
              name: found.name,
              nameAr: found.nameAr || null,
              description: found.descriptionEn || found.description || null,
              descriptionAr: found.descriptionAr || null,
              price: Number(found.priceValue) || 0,
              compareAtPrice: Number(found.priceValue) || 0,
              hasModifiers: Boolean(found.optionGroups?.length || found.badgeTone === 'options'),
              imageUrl: null,
              imageUrls: [],
              prepTimeMin: Number(found.prepTime) || 20,
              badges: (found.badges || []).map((b) =>
                String(b)
                  .toUpperCase()
                  .replace(/\s+/g, '_')
                  .replace(/-/g, '_'),
              ),
              availabilitySlots: ['ALL_DAY'],
              availableFrom: found.availableFrom || '11:00',
              availableTo: found.availableTo || '23:00',
              stockType: String(found.stock || '').toLowerCase().includes('left')
                ? 'TRACKED'
                : 'MADE_TO_ORDER',
              stockQty: null,
              stockLabel: found.stock || 'Made to order',
              isActive: found.status !== 'Inactive' && found.active !== false,
              isAvailable: true,
              maxOrder: 0,
              catalogCategory: {
                id: `cat-${String(categoryLeaf).toLowerCase().replace(/\s+/g, '-')}`,
                name: categoryLeaf,
                parent: null,
              },
              platformCategory: { id: 'platform-food', name: 'Food' },
              storeTypeMenuCategory: null,
            }
          }
        }
      }

      // GET /vendor-panel/promotions/:promotionId[/analytics]
      if (!route) {
        const promoAnalyticsMatch = String(url).match(
          /^\/vendor-panel\/promotions\/([^/?]+)\/analytics$/,
        )
        if (promoAnalyticsMatch) {
          const promotionId = decodeURIComponent(promoAnalyticsMatch[1])
          const found = findMockPromotion(promotionId)
          route = () => buildMockPromotionApiPayload(found, promotionId)
        }
      }

      if (!route) {
        const promoMatch = String(url).match(/^\/vendor-panel\/promotions\/([^/?]+)$/)
        if (promoMatch) {
          const promotionId = decodeURIComponent(promoMatch[1])
          if (promotionId !== 'summary') {
            const found = findMockPromotion(promotionId)
            route = () => buildMockPromotionApiPayload(found, promotionId)
          }
        }
      }

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
      const pauseMatch = String(url).match(/^\/vendor-panel\/promotions\/([^/?]+)\/pause$/)
      if (pauseMatch) {
        const promotionId = decodeURIComponent(pauseMatch[1])
        const found = findMockPromotion(promotionId)
        route = ({ body: patchBody }) => {
          const nextPaused =
            patchBody && typeof patchBody === 'object' && 'isPaused' in patchBody
              ? Boolean(patchBody.isPaused)
              : true
          if (found) found.status = nextPaused ? 'Paused' : 'Active'
          return buildMockPromotionApiPayload(found, promotionId, {
            status: nextPaused ? 'PAUSED' : 'ACTIVE',
            isPaused: nextPaused,
          })
        }
      }
    }

    if (!route && method.toUpperCase() === 'PATCH') {
      const markReadMatch = String(url).match(/^\/vendor-panel\/notifications\/([^/?]+)\/read$/)
      if (markReadMatch) {
        const notificationId = decodeURIComponent(markReadMatch[1])
        route = () => {
          const found = (vendorMock.notifications || []).find((n) => n.id === notificationId)
          if (found) {
            found.unread = false
            found.highlight = false
            found.isRead = true
            return {
              id: found.id,
              type: found.type || 'NEW_ORDER',
              title: found.title,
              body: found.body,
              metadata: found.metadata || null,
              isRead: true,
              createdAt: found.createdAt || new Date().toISOString(),
            }
          }
          return { id: notificationId, isRead: true }
        }
      }

      const statusMatch = String(url).match(/^\/vendor-panel\/branches\/([^/?]+)\/status$/)
      if (!route && statusMatch) {
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
      } else if (!route) {
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
