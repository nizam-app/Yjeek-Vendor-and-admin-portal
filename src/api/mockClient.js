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

function findMockBranchById(branchId) {
  const id = decodeURIComponent(String(branchId || ''))
  return (
    vendorMock.branches.find((b) => b.id === id) ||
    vendorMock.branches.find((b) => b.name === id) ||
    null
  )
}

/** In-memory branch menu (mutated by PATCH Edit Branch menu in mock mode). */
let mockBranchMenuState = structuredClone(vendorMock.mockBranchMenu || [])

function applyMockBranchMenuPatch(body = {}) {
  const items = Array.isArray(body.items) ? body.items : []
  const categories = Array.isArray(body.categories) ? body.categories : []
  const itemMap = new Map(items.map((item) => [String(item.productId), item]))
  const categoryMap = new Map(
    categories.map((cat) => [String(cat.categoryId || cat.id), cat]),
  )

  function walk(nodes) {
    return (nodes || []).map((node) => {
      if (!node) return node
      if (node.type === 'product' || node.product) {
        const productId = String(node.productId || node.product?.id || node.id)
        const patch = itemMap.get(productId)
        if (!patch) return node
        const nextProduct = { ...(node.product || {}) }
        if (patch.isAvailable !== undefined) {
          nextProduct.branchIsAvailable = patch.isAvailable
          nextProduct.isAvailable = patch.isAvailable
        }
        if (patch.isVisible !== undefined) {
          nextProduct.branchIsVisible = patch.isVisible
        }
        if (patch.priceOverride !== undefined) {
          nextProduct.effectivePrice = patch.priceOverride
          nextProduct.priceOverride = patch.priceOverride
        }
        return {
          ...node,
          isAvailable:
            patch.isAvailable !== undefined ? patch.isAvailable : node.isAvailable,
          isVisible: patch.isVisible !== undefined ? patch.isVisible : node.isVisible,
          priceOverride:
            patch.priceOverride !== undefined ? patch.priceOverride : node.priceOverride,
          product: nextProduct,
        }
      }

      const categoryId = String(node.id)
      const catPatch = categoryMap.get(categoryId)
      return {
        ...node,
        isVisible:
          catPatch?.isVisible !== undefined ? catPatch.isVisible : node.isVisible,
        children: walk(node.children),
      }
    })
  }

  mockBranchMenuState = walk(mockBranchMenuState)
  return {
    branch: { id: 'manama', name: 'Green Kitchen — Manama' },
    menu: mockBranchMenuState,
  }
}

function findMockPromotion(promotionId) {
  const id = String(promotionId || '').trim()
  if (!id || id === 'new' || id === 'summary') return null
  return (
    (vendorMock.promotions || []).find(
      (p) => p.id === id || p.title === id,
    ) || null
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
  'GET /admin/settings': () => ({
    id: 'mock-settings-id',
    minDriverAppVersion: '3.0.0',
    minCustomerAppVersion: '3.0.0',
    rpiMinimum: 62,
    rpiAcceptanceTarget: 92,
    rpiCompletionTarget: 98,
    rpiOnTimeTarget: 95,
    rpiRatingTarget: 4.7,
    vendorAcceptSlaSec: 60,
    vendorDineInAcceptSlaSec: 300,
    vendorPrepSlaMin: 20,
    champWaitSlaMin: 4,
    updatedAt: new Date().toISOString(),
    tabs: ['general', 'localization', 'notifications', 'security', 'integrations'],
  }),
  'GET /admin/settings/general': () => ({
    companyName: 'Yjeek',
    supportEmail: 'support@yjeek.com',
    supportPhone: '+973 1700 0000',
    timeFormat: '24h',
    maintenanceMode: false,
  }),
  'GET /admin/settings/localization': () => ({
    activeCountries: ['BH'],
    defaultCountry: 'BH',
    timezone: 'Asia/Bahrain',
    currency: 'BHD',
    languages: ['en', 'ar'],
    rtlSupport: true,
    commission: {
      defaultCommissionPct: 12,
      onlineGatewayFeePct: 2.5,
      vatPct: 10,
      payoutCycle: 'weekly',
      minPayout: 10,
      payoutDay: 'sunday',
    },
  }),
  'GET /admin/settings/notifications': () => ({
    channels: { push: true, sms: true, email: true, inApp: true },
    operational: { incidentEscalation: true, dailySummaryEmail: true },
  }),
  'GET /admin/settings/security': () => ({
    enforce2FA: true,
    passwordPolicy: 'strong_12',
    sessionTimeoutMin: 30,
    auditLogRetentionMonths: 12,
    ipAllowlist: 'disabled',
    loginAlerts: true,
  }),
  'GET /admin/ui-editor/apps': () => ({
    apps: [
      { key: 'CUSTOMER', label: 'Customer app' },
      { key: 'CHAMP', label: 'Champ app' },
    ],
  }),
  'GET /admin/ui-editor/screen-map': ({ params }) => ({
    app: params?.app || 'CUSTOMER',
    apps: [
      { key: 'CUSTOMER', label: 'Customer app' },
      { key: 'CHAMP', label: 'Champ app' },
    ],
    screens: [
      {
        key: 'home',
        label: 'Home Screen',
        shortLabel: 'Home',
        slotCount: 3,
        bannerTotal: 6,
        slots: [
          {
            key: 'home_top',
            label: 'Home top - scroll banner',
            displayType: 'Scroll',
            bannerType: 'SCROLL',
            bannerCount: 5,
            activeCount: 0,
            banners: [
              { id: 'bnr-1', title: 'Ramadan offers', bannerType: 'STATIC', isActive: false },
              { id: 'bnr-2', title: 'new offer', bannerType: 'STATIC', isActive: false },
            ],
          },
          {
            key: 'home_mid',
            label: 'Between sections',
            displayType: 'Static',
            bannerType: 'STATIC',
            bannerCount: 1,
            activeCount: 0,
            banners: [
              { id: 'bnr-3', title: 'Ramadan offers', bannerType: 'STATIC', isActive: false },
            ],
          },
          {
            key: 'home_below_picks',
            label: 'Below a section',
            displayType: 'Static',
            bannerType: 'STATIC',
            bannerCount: 0,
            activeCount: 0,
            banners: [],
          },
        ],
      },
      {
        key: 'store',
        label: 'Store page',
        shortLabel: 'Store',
        slotCount: 2,
        bannerTotal: 0,
        slots: [
          {
            key: 'store_top',
            label: 'Store page top',
            displayType: 'Static',
            bannerType: 'STATIC',
            bannerCount: 0,
            activeCount: 0,
            banners: [],
          },
          {
            key: 'store_mid',
            label: 'Store mid',
            displayType: 'Static',
            bannerType: 'STATIC',
            bannerCount: 0,
            activeCount: 0,
            banners: [],
          },
        ],
      },
      {
        key: 'global',
        label: 'Global',
        shortLabel: 'Gl',
        slotCount: 1,
        bannerTotal: 0,
        slots: [
          {
            key: 'app_open_popup',
            label: 'Pop-up ad (on open)',
            displayType: 'Pop-up',
            bannerType: 'POPUP',
            bannerCount: 0,
            activeCount: 0,
            banners: [],
          },
        ],
      },
    ],
  }),
  'GET /admin/ui-editor/placements': ({ params }) => ({
    app: params?.app || 'CUSTOMER',
    screen: params?.screen || 'home',
    screens: [
      { key: 'home', label: 'Home' },
      { key: 'store', label: 'Store page' },
      { key: 'category', label: 'Category' },
      { key: 'popup', label: 'Pop-up' },
    ],
    placements: [
      { key: 'home_top', label: 'Home top · scroll banner', activeCount: 3, type: 'SCROLL' },
      { key: 'home_mid', label: 'Between sections', activeCount: 2, type: 'STATIC' },
      { key: 'home_below', label: 'Below a section', activeCount: 0, type: 'STATIC' },
      { key: 'app_open_popup', label: 'Pop-up ad (on open)', activeCount: 1, type: 'POPUP' },
    ],
  }),
  'GET /admin/ui-editor/banners': () => ({
    count: 2,
    banners: [
      {
        id: 'bnr-mock-1',
        title: 'Ramadan offers',
        name: 'Ramadan offers',
        subtitle: 'Up to 30% off',
        imageUrl: 'https://cdn.yjeek.example/uploads/mock-banner.webp',
        bannerType: 'SCROLL',
        type: 'Scroll',
        placementKey: 'home_top',
        placement: 'Home top — carousel',
        displayType: 'Scroll',
        appTarget: 'CUSTOMER',
        tapAction: 'OPEN_STORE',
        status: 'Active',
        statusKey: 'active',
        schedule: '22 Mar 2026 – 30 Mar 2026',
        isActive: true,
      },
      {
        id: 'bnr-mock-2',
        title: 'Eid gifts',
        name: 'Eid gifts',
        subtitle: 'Up to 30% off',
        imageUrl: null,
        bannerType: 'STATIC',
        type: 'Static',
        placementKey: 'home_mid',
        placement: 'Home between sections',
        displayType: 'Static',
        appTarget: 'CUSTOMER',
        tapAction: 'OPEN_STORE',
        status: 'Expired',
        statusKey: 'expired',
        schedule: '22 Mar 2026 – 31 Mar 2026',
        isActive: true,
      },
    ],
  }),
  'GET /admin/ui-editor/banners/meta': ({ params }) => ({
    app: params?.app || 'CUSTOMER',
    screens: [
      { key: 'home', label: 'Home' },
      { key: 'store', label: 'Store page' },
      { key: 'category', label: 'Category' },
      { key: 'popup', label: 'Pop-up' },
    ],
    placements: [
      { key: 'home_top', label: 'Home top · scroll banner', type: 'SCROLL' },
      { key: 'home_mid', label: 'Between sections', type: 'STATIC' },
      { key: 'home_below', label: 'Below a section', type: 'STATIC' },
      { key: 'app_open_popup', label: 'Pop-up ad (on open)', type: 'POPUP' },
      { key: 'store_top', label: 'Store page top', type: 'STATIC' },
      { key: 'category_top', label: 'Category top · scroll', type: 'SCROLL' },
    ],
    bannerTypes: [
      { key: 'SCROLL', label: 'Scroll' },
      { key: 'STATIC', label: 'Static' },
      { key: 'POPUP', label: 'Pop-up' },
    ],
    statuses: [
      { key: 'ACTIVE', label: 'Active' },
      { key: 'SCHEDULED', label: 'Scheduled' },
      { key: 'DRAFT', label: 'Draft' },
    ],
  }),
  'GET /admin/ui-editor/banners/targets': ({ params }) => ({
    tapAction: params?.tapAction || 'OPEN_STORE',
    targets: [
      { id: 'store-green-kitchen', name: 'Green Kitchen' },
      { id: 'store-all', name: 'All stores' },
      { id: 'store-pharmacy', name: 'Pharmacy near you' },
    ],
  }),
  'POST /admin/ui-editor/banners': ({ body }) => ({
    id: `bnr-mock-${Date.now()}`,
    ...(body && typeof body === 'object' ? body : {}),
    status: body?.publishImmediately ? 'ACTIVE' : 'DRAFT',
  }),
  'GET /admin/ui-editor/preview': ({ params }) => ({
    app: params?.app || 'CUSTOMER',
    screen: params?.screen || 'home',
    title: `Preview · ${params?.screen || 'home'}`,
    message: 'Mock preview payload',
    banners: [
      {
        id: 'bnr-mock-1',
        title: 'Ramadan offers',
        bannerType: 'SCROLL',
        placementKey: 'home_top',
        status: 'ACTIVE',
      },
    ],
    placements: [
      { key: 'home_top', label: 'Home top', activeCount: 1, type: 'SCROLL' },
    ],
  }),
  'POST /admin/ui-editor/publish': ({ body }) => ({
    app: body?.app || 'CUSTOMER',
    published: true,
    publishedAt: new Date().toISOString(),
  }),
  'POST /admin/uploads/images': () => ({
    url: `https://cdn.yjeek.example/uploads/mock-banner-${Date.now()}.webp`,
    contentType: 'image/webp',
  }),
  'POST /vendor-panel/uploads/images': () => ({
    url: `https://cdn.yjeek.example/uploads/mock-product-${Date.now()}.webp`,
    contentType: 'image/webp',
  }),
  'POST /vendor-panel/catalog/uploads/images': () => ({
    url: `https://cdn.yjeek.example/uploads/mock-product-${Date.now()}.webp`,
    contentType: 'image/webp',
  }),
  'GET /admin/ui-editor/home': () => ({
    title: 'Home',
    categories: [
      { id: 'cat-food', name: 'Food', iconEmoji: '🍔', sortOrder: 0, isFeatured: true },
      { id: 'cat-grocery', name: 'Groceries', iconEmoji: '🛒', sortOrder: 1, isFeatured: true },
    ],
  }),
  'GET /admin/ui-editor/home/categories': () => ({
    categories: [
      { id: 'cat-food', name: 'Food', iconEmoji: '🍔', sortOrder: 0, isFeatured: true, isActive: true },
      { id: 'cat-grocery', name: 'Groceries', iconEmoji: '🛒', sortOrder: 1, isFeatured: true, isActive: true },
      { id: 'cat-pharmacy', name: 'Pharmacy', iconEmoji: '💊', sortOrder: 2, isFeatured: false, isActive: true },
    ],
  }),
  'POST /admin/ui-editor/home/categories': ({ body }) => ({
    id: `cat-mock-${Date.now()}`,
    name: body?.name || 'New Category',
    iconEmoji: body?.iconEmoji || '✨',
    isFeatured: body?.isFeatured !== false,
    sortOrder: 99,
    isActive: true,
  }),
  'PATCH /admin/ui-editor/home/categories/reorder': ({ body }) => ({
    categories: (body?.items || []).map((item, index) => ({
      id: item.id,
      name: item.name || `Category ${index + 1}`,
      iconEmoji: item.iconEmoji || '📦',
      sortOrder: item.sortOrder ?? index,
      isFeatured: item.isFeatured !== false,
      isActive: true,
    })),
  }),
  'POST /admin/ui-editor/home/categories/publish': () => ({
    published: true,
    publishedAt: new Date().toISOString(),
  }),
  'GET /admin/ui-editor/catalog': () => ({
    items: [
      { id: 'help', label: 'Help & Support', type: 'page' },
      { id: 'home', label: 'Home', type: 'screen' },
    ],
  }),
  'GET /admin/ui-editor/pages': () => ({
    pages: [
      { id: 'help', title: 'Help & Support', status: 'draft', isPublished: false },
    ],
  }),
  'POST /admin/ui-editor/pages/ensure': () => ({
    pages: [
      { id: 'help', title: 'Help & Support', status: 'draft', isPublished: false },
    ],
  }),
  'GET /admin/ui-editor/pages/help': () => ({
    title: 'Help & Support',
    isPublished: false,
    content: {
      title: 'Help & Support',
      subtitle: 'Updated from admin',
      supportEmail: 'support@yjeek.com',
      topics: [],
      faq: [],
    },
  }),
  'PUT /admin/ui-editor/pages/help': ({ body }) => ({
    title: body?.title || 'Help & Support',
    isPublished: Boolean(body?.isPublished),
    content: body?.content || {
      title: 'Help & Support',
      subtitle: '',
      supportEmail: '',
      topics: [],
      faq: [],
    },
  }),
  'POST /admin/ui-editor/pages/help/publish': () => ({ published: true }),
  'POST /admin/ui-editor/pages/help/unpublish': () => ({ published: false }),
  'PATCH /admin/settings/general': ({ body }) => ({
    companyName: body?.companyName ?? 'Yjeek',
    supportEmail: body?.supportEmail ?? 'support@yjeek.com',
    supportPhone: body?.supportPhone ?? '+973 1700 0000',
    timeFormat: body?.timeFormat ?? '24h',
    maintenanceMode: Boolean(body?.maintenanceMode),
  }),
  'PATCH /admin/settings/localization': ({ body }) => body || {},
  'PATCH /admin/settings/notifications': ({ body }) => body || {},
  'PATCH /admin/settings/security': ({ body }) => body || {},
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
  'POST /vendor-panel/auth/login': () => ({
    user: {
      id: 'mock-vendor-user',
      email: 'vendor@greenkitchen.bh',
      phone: '38866628',
      countryCode: '+973',
      role: 'VENDOR',
      status: 'ACTIVE',
      authProvider: 'PHONE',
      displayName: 'Green Kitchen Admin',
      staffRole: 'GROUP_ADMIN',
      vendorId: 'cmreb3tha000ev9b8rv65ldi6',
      vendorName: 'Green Kitchen',
      vendorLocationId: null,
      isGroupAdmin: true,
      serviceModes: {
        hotFoodOnDemand: true,
        pickup: true,
        dineIn: false,
        scheduledDelivery: true,
        services: false,
      },
    },
    accessToken: 'mock-vendor-access-token',
    refreshToken: 'mock-vendor-refresh-token',
  }),
  'GET /vendor-panel/auth/me': () => ({
    id: 'mock-vendor-user',
    email: 'vendor@greenkitchen.bh',
    phone: '38866628',
    countryCode: '+973',
    role: 'VENDOR',
    status: 'ACTIVE',
    authProvider: 'PHONE',
    displayName: 'Green Kitchen Admin',
    staffRole: 'GROUP_ADMIN',
    vendorId: 'cmreb3tha000ev9b8rv65ldi6',
    vendorName: 'Green Kitchen',
    vendorLocationId: null,
    isGroupAdmin: true,
    serviceModes: {
      hotFoodOnDemand: true,
      pickup: true,
      dineIn: false,
      scheduledDelivery: true,
      services: false,
    },
  }),
  'POST /vendor-panel/auth/logout': () => ({ success: true }),
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
      activeCount:
        vendorMock.liveOrders.new.length +
        vendorMock.liveOrders.accepted.length +
        vendorMock.liveOrders.preparing.length +
        vendorMock.liveOrders.ready.length,
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
    selectedStoreTypeId: 'store-type-food',
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
        productCount: type.id === 'food' ? (vendorMock.catalogItems || []).length : 0,
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
  'GET /vendor-panel/catalog/store-types/store-type-food/badges': () => ({
    source: 'store_type_badges',
    items: [
      { id: 'badge-new', label: 'New', code: 'NEW', color: null },
      { id: 'badge-halal', label: 'Halal', code: 'HALAL', color: null },
      { id: 'badge-bestseller', label: 'Bestseller', code: 'BESTSELLER', color: null },
      { id: 'badge-gf', label: 'Gluten-free', code: 'GLUTEN_FREE', color: null },
    ],
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
  'GET /vendor-panel/catalog/products': ({ params } = {}) => {
    const platformCategoryId =
      params?.platformCategoryId || params?.storeTypeId || params?.categoryId || null
    const allItems = (vendorMock.catalogItems || []).map((item) => {
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
          id: 'store-type-food',
          name: 'Food',
        },
        storeTypeMenuCategory: null,
        optionGroups: item.optionGroups || [],
        addons: item.addOns || item.addons || [],
      }
    })

    const items = platformCategoryId
      ? allItems.filter(
          (item) =>
            item.platformCategory?.id === platformCategoryId ||
            platformCategoryId === 'store-type-food' ||
            platformCategoryId === 'platform-food',
        )
      : allItems

    return {
      count: items.length,
      items,
    }
  },
  'POST /vendor-panel/catalog/products': ({ body } = {}) => {
    const payload = body && typeof body === 'object' ? body : {}
    const id = `mock-product-${Date.now().toString(36)}`
    const imageUrls = Array.isArray(payload.imageUrls)
      ? payload.imageUrls.filter(Boolean)
      : payload.imageUrl
        ? [payload.imageUrl]
        : []
    const created = {
      id,
      name: payload.name || 'Untitled product',
      nameAr: payload.nameAr ?? null,
      description: payload.description ?? null,
      descriptionAr: payload.descriptionAr ?? null,
      price: Number(payload.price) || 0,
      compareAtPrice: payload.compareAtPrice ?? null,
      hasModifiers: Boolean(
        payload.hasModifiers ||
          (Array.isArray(payload.optionGroups) && payload.optionGroups.length) ||
          (Array.isArray(payload.addons) && payload.addons.length),
      ),
      imageUrl: payload.imageUrl || imageUrls[0] || null,
      imageUrls,
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
      platformCategory: {
        id: payload.platformCategoryId || payload.storeTypeId || 'store-type-food',
        name: 'Food',
      },
      storeTypeMenuCategory: null,
      optionGroups: Array.isArray(payload.optionGroups) ? payload.optionGroups : [],
      addons: Array.isArray(payload.addons) ? payload.addons : [],
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
  'POST /vendor-panel/promotions': ({ body } = {}) => {
    const payload = body && typeof body === 'object' ? body : {}
    const id = `promo-${Date.now().toString(36)}`
    const typeApi = String(payload.type || 'FREE_DELIVERY').toUpperCase()
    const typeUi =
      typeApi === 'BUY_X_GET_Y'
        ? 'Buy X Get Y'
        : typeApi === 'FREE_DELIVERY'
          ? 'Free delivery'
          : 'Item / category deal'
    const startsAt = payload.startsAt || new Date().toISOString()
    const endsAt =
      payload.noEndDate || !payload.endsAt
        ? null
        : payload.endsAt
    const listRow = {
      id,
      title: payload.name || 'New promotion',
      subtitle: typeUi,
      type: typeUi,
      scope: payload.applyToAllBranches === false ? 'Selected branches' : 'All branches',
      status: payload.isPaused ? 'Paused' : 'Active',
      period: '—',
      used: 0,
    }
    if (!Array.isArray(vendorMock.promotions)) vendorMock.promotions = []
    vendorMock.promotions.unshift(listRow)
    return {
      id,
      name: listRow.title,
      type: typeApi,
      status: payload.isPaused ? 'PAUSED' : 'ACTIVE',
      isPaused: Boolean(payload.isPaused),
      scope: listRow.scope,
      appliesTo: payload.appliesTo || 'ALL_MENU',
      applyToAllBranches: payload.applyToAllBranches !== false,
      startsAt,
      endsAt,
      noEndDate: Boolean(payload.noEndDate) || !endsAt,
      categories: [],
      products: [],
      rewardProducts: [],
      branches: [],
      createdAt: new Date().toISOString(),
      ...payload,
    }
  },
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

    // Dynamic UI Editor banner detail / update / delete
    if (!route) {
      const bannerMatch = String(url).match(/^\/admin\/ui-editor\/banners\/([^/?]+)$/)
      if (bannerMatch) {
        const bannerId = decodeURIComponent(bannerMatch[1])
        if (!['meta', 'targets'].includes(bannerId)) {
          if (method.toUpperCase() === 'GET') {
            route = () => ({
              id: bannerId,
              title: 'Ramadan offers',
              subtitle: 'Up to 30% off',
              imageUrl: 'https://cdn.yjeek.example/uploads/mock-banner.webp',
              bannerType: 'SCROLL',
              placementKey: 'home_top',
              placementLabel: 'Home top · scroll banner',
              appTarget: 'CUSTOMER',
              tapAction: 'OPEN_STORE',
              targetId: 'store-green-kitchen',
              targetLabel: 'Green Kitchen',
              audience: 'ALL',
              publishImmediately: true,
              startsAt: '2026-03-22T00:00:00.000Z',
              endsAt: '2026-03-30T23:59:59.000Z',
              status: 'ACTIVE',
            })
          } else if (method.toUpperCase() === 'PATCH') {
            route = ({ body: patchBody }) => ({
              id: bannerId,
              title: 'Ramadan offers',
              subtitle: 'Up to 30% off',
              bannerType: 'SCROLL',
              placementKey: 'home_top',
              appTarget: 'CUSTOMER',
              tapAction: 'OPEN_STORE',
              audience: 'ALL',
              status: 'ACTIVE',
              ...(patchBody && typeof patchBody === 'object' ? patchBody : {}),
            })
          } else if (method.toUpperCase() === 'DELETE') {
            route = () => ({ id: bannerId, deleted: true })
          }
        }
      }
    }

    // Dynamic home category patch
    if (!route && method.toUpperCase() === 'PATCH') {
      const categoryMatch = String(url).match(
        /^\/admin\/ui-editor\/home\/categories\/([^/?]+)$/,
      )
      if (categoryMatch) {
        const categoryId = decodeURIComponent(categoryMatch[1])
        if (categoryId !== 'reorder') {
          route = ({ body: patchBody }) => ({
            id: categoryId,
            name: patchBody?.name || 'Food',
            iconEmoji: patchBody?.iconEmoji || '🍔',
            sortOrder: patchBody?.sortOrder ?? 0,
            isFeatured: patchBody?.isFeatured !== false,
            isActive: patchBody?.isActive !== false,
          })
        }
      }
    }

    // Dynamic branch detail / update / set-status / menu for mock mode
    if (!route && method.toUpperCase() === 'GET') {
      const menuMatch = String(url).match(
        /^\/vendor-panel\/catalog\/branches\/([^/?]+)\/menu$/,
      )
      if (menuMatch) {
        const branch = findMockBranchById(menuMatch[1])
        if (branch) {
          route = () => ({
            branch: { id: branch.id, name: branch.name },
            menu: mockBranchMenuState,
          })
        }
      }

      const branch = findMockBranch(url)
      if (!route && branch) {
        route = () => ({
          ...branch,
          openingHours: branch.openingHours || vendorMock.mockOpeningHours || null,
          radiusKm: Number(branch.radiusKm) || branch.radiusKm,
          etaMin: Number(branch.etaMin) || branch.etaMin,
          minOrderAmount: Number(branch.minOrderValue ?? branch.minOrderAmount) || 0,
        })
      }

      // GET /vendor-panel/catalog/store-types/:id/badges
      if (!route) {
        const badgesMatch = String(url).match(
          /^\/vendor-panel\/catalog\/store-types\/([^/?]+)\/badges$/,
        )
        if (badgesMatch) {
          route = () => ({
            source: 'store_type_badges',
            items: [
              { id: 'badge-new', label: 'New', code: 'NEW', color: null },
              { id: 'badge-halal', label: 'Halal', code: 'HALAL', color: null },
              { id: 'badge-bestseller', label: 'Bestseller', code: 'BESTSELLER', color: null },
              { id: 'badge-gf', label: 'Gluten-free', code: 'GLUTEN_FREE', color: null },
            ],
          })
        }
      }

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
              imageUrl: found.imageUrl || null,
              imageUrls: Array.isArray(found.imageUrls) ? found.imageUrls.filter(Boolean) : [],
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
              platformCategory: { id: 'store-type-food', name: 'Food' },
              storeTypeMenuCategory: null,
              optionGroups: found.optionGroups || [],
              addons: found.addOns || found.addons || [],
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
    // POST /vendor-panel/orders/:orderId/reject
    if (!route && method.toUpperCase() === 'POST') {
      const rejectMatch = String(url).match(/^\/vendor-panel\/orders\/([^/?]+)\/reject$/)
      if (rejectMatch) {
        const orderId = decodeURIComponent(rejectMatch[1])
        route = ({ body: rejectBody }) => {
          const reason = String(rejectBody?.reason || '').trim()
          if (!reason) {
            const err = new Error('Rejection reason is required.')
            err.status = 400
            throw err
          }
          const allOrders = [
            ...(vendorMock.liveOrders?.new || []),
            ...(vendorMock.dineInOrders?.new || []),
          ]
          const found =
            allOrders.find((o) => o.id === orderId || o.backendId === orderId || o.orderNumber === orderId) ||
            null
          if (vendorMock.liveOrders?.new) {
            vendorMock.liveOrders.new = vendorMock.liveOrders.new.filter(
              (o) => o.id !== orderId && o.backendId !== orderId && o.orderNumber !== orderId,
            )
          }
          if (vendorMock.dineInOrders?.new) {
            vendorMock.dineInOrders.new = vendorMock.dineInOrders.new.filter(
              (o) => o.id !== orderId && o.backendId !== orderId && o.orderNumber !== orderId,
            )
          }
          return {
            ...(found && typeof found === 'object' ? found : {}),
            id: found?.id || found?.backendId || orderId,
            orderNumber: found?.orderNumber || found?.id || 'YJK-MOCK-001',
            orderType: found?.orderType || 'DELIVERY',
            status: 'REJECTED',
            rejectionReason: reason,
            rejectionNote: String(rejectBody?.note || '').trim() || undefined,
          }
        }
      }
    }
    // POST /vendor-panel/orders/:orderId/start-preparing
    if (!route && method.toUpperCase() === 'POST') {
      const startPrepMatch = String(url).match(/^\/vendor-panel\/orders\/([^/?]+)\/start-preparing$/)
      if (startPrepMatch) {
        const orderId = decodeURIComponent(startPrepMatch[1])
        route = () => {
          const allOrders = [
            ...(vendorMock.liveOrders?.accepted || []),
            ...(vendorMock.dineInOrders?.confirmed || []),
            ...(vendorMock.liveOrders?.new || []),
          ]
          const found =
            allOrders.find((o) => o.id === orderId || o.backendId === orderId || o.orderNumber === orderId) ||
            allOrders[0] ||
            null
          return {
            ...(found && typeof found === 'object' ? found : {}),
            id: found?.id || found?.backendId || orderId,
            orderNumber: found?.orderNumber || found?.id || 'YJK-MOCK-001',
            orderType: found?.orderType || 'DELIVERY',
            status: 'PREPARING',
            prepStartedAt: new Date().toISOString(),
            itemsPreview: found?.itemsPreview || found?.items || '1x Classic Burger',
            totalAmount: found?.totalAmount ?? 4.4,
            customer: found?.customer || { id: 'mock-customer', name: found?.customer || 'Guest' },
          }
        }
      }
    }
    // POST /vendor-panel/orders/:orderId/mark-ready
    if (!route && method.toUpperCase() === 'POST') {
      const markReadyMatch = String(url).match(/^\/vendor-panel\/orders\/([^/?]+)\/mark-ready$/)
      if (markReadyMatch) {
        const orderId = decodeURIComponent(markReadyMatch[1])
        route = () => {
          const allOrders = [
            ...(vendorMock.liveOrders?.preparing || []),
            ...(vendorMock.dineInOrders?.preparing || []),
            ...(vendorMock.liveOrders?.accepted || []),
          ]
          const found =
            allOrders.find((o) => o.id === orderId || o.backendId === orderId || o.orderNumber === orderId) ||
            allOrders[0] ||
            null
          return {
            ...(found && typeof found === 'object' ? found : {}),
            id: found?.id || found?.backendId || orderId,
            orderNumber: found?.orderNumber || found?.id || 'YJK-MOCK-001',
            orderType: found?.orderType || 'DELIVERY',
            status: 'READY_FOR_PICKUP',
            readyAt: new Date().toISOString(),
            itemsPreview: found?.itemsPreview || found?.items || '1x Classic Burger',
            totalAmount: found?.totalAmount ?? 4.4,
            customer: found?.customer || { id: 'mock-customer', name: found?.customer || 'Guest' },
            primaryAction: found?.primaryAction || {
              key: 'HANDOVER_TO_CHAMP',
              label: 'Handover to champ',
              method: 'POST',
              path: `/vendor-panel/orders/${found?.id || found?.backendId || orderId}/handover`,
            },
          }
        }
      }
    }
    // POST /vendor-panel/orders/:orderId/complete
    if (!route && method.toUpperCase() === 'POST') {
      const completeMatch = String(url).match(/^\/vendor-panel\/orders\/([^/?]+)\/complete$/)
      if (completeMatch) {
        const orderId = decodeURIComponent(completeMatch[1])
        route = () => {
          const allOrders = [
            ...(vendorMock.dineInOrders?.ready || []),
            ...(vendorMock.liveOrders?.ready || []),
            ...(vendorMock.dineInOrders?.preparing || []),
            ...(vendorMock.liveOrders?.preparing || []),
          ]
          const found =
            allOrders.find((o) => o.id === orderId || o.backendId === orderId || o.orderNumber === orderId) ||
            allOrders[0] ||
            null
          if (vendorMock.dineInOrders?.ready) {
            vendorMock.dineInOrders.ready = vendorMock.dineInOrders.ready.filter(
              (o) => o.id !== orderId && o.backendId !== orderId && o.orderNumber !== orderId,
            )
          }
          if (vendorMock.liveOrders?.ready) {
            vendorMock.liveOrders.ready = vendorMock.liveOrders.ready.filter(
              (o) => o.id !== orderId && o.backendId !== orderId && o.orderNumber !== orderId,
            )
          }
          return {
            ...(found && typeof found === 'object' ? found : {}),
            id: found?.id || found?.backendId || orderId,
            orderNumber: found?.orderNumber || found?.id || 'YJK-MOCK-001',
            orderType: found?.orderType || (found?.guest ? 'DINE_IN' : 'DELIVERY'),
            status: 'COMPLETED',
            completedAt: new Date().toISOString(),
          }
        }
      }
    }
    if (!route && method.toUpperCase() === 'PATCH') {
      const productPatchMatch = String(url).match(/^\/vendor-panel\/catalog\/products\/([^/?]+)$/)
      if (productPatchMatch) {
        const productId = decodeURIComponent(productPatchMatch[1])
        route = ({ body: patchBody }) => {
          const payload = patchBody && typeof patchBody === 'object' ? patchBody : {}
          const imageUrls = Array.isArray(payload.imageUrls)
            ? payload.imageUrls.filter(Boolean)
            : payload.imageUrl
              ? [payload.imageUrl]
              : []
          return {
            id: productId,
            name: payload.name || 'Updated product',
            nameAr: payload.nameAr ?? null,
            description: payload.description ?? null,
            descriptionAr: payload.descriptionAr ?? null,
            price: Number(payload.price) || 0,
            prepTimeMin: Number(payload.prepTimeMin) || 0,
            badges: Array.isArray(payload.badges) ? payload.badges : [],
            availabilitySlots: Array.isArray(payload.availabilitySlots)
              ? payload.availabilitySlots
              : [],
            availableFrom: payload.availableFrom ?? null,
            availableTo: payload.availableTo ?? null,
            stockType: payload.stockType || 'MADE_TO_ORDER',
            isActive: payload.isActive !== false,
            isAvailable: payload.isAvailable !== false,
            imageUrl: payload.imageUrl || imageUrls[0] || null,
            imageUrls,
            catalogCategory: payload.catalogCategoryId
              ? { id: payload.catalogCategoryId, name: 'Main course', parent: null }
              : null,
            platformCategory: {
              id: payload.platformCategoryId || 'store-type-food',
              name: 'Food',
            },
            optionGroups: Array.isArray(payload.optionGroups) ? payload.optionGroups : [],
            addons: Array.isArray(payload.addons) ? payload.addons : [],
          }
        }
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
      const promoEditMatch = String(url).match(/^\/vendor-panel\/promotions\/([^/?]+)$/)
      if (promoEditMatch) {
        const promotionId = decodeURIComponent(promoEditMatch[1])
        if (promotionId !== 'summary') {
          const found = findMockPromotion(promotionId)
          route = ({ body: patchBody }) => {
            const patch = patchBody && typeof patchBody === 'object' ? patchBody : {}
            if (found && patch.name) found.title = patch.name
            if (found && typeof patch.isPaused === 'boolean') {
              found.status = patch.isPaused ? 'Paused' : 'Active'
            }
            return buildMockPromotionApiPayload(found, promotionId, {
              ...patch,
              name: patch.name || found?.title || found?.name,
              status: patch.isPaused
                ? 'PAUSED'
                : found?.status === 'Paused'
                  ? 'PAUSED'
                  : 'ACTIVE',
              isPaused: Boolean(patch.isPaused),
            })
          }
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

      const menuMatch = String(url).match(
        /^\/vendor-panel\/catalog\/branches\/([^/?]+)\/menu$/,
      )
      if (!route && menuMatch && findMockBranchById(menuMatch[1])) {
        route = ({ body: patchBody }) => applyMockBranchMenuPatch(patchBody)
      }

      const statusMatch = String(url).match(/^\/vendor-panel\/branches\/([^/?]+)\/status$/)
      if (!route && statusMatch) {
        const branchId = decodeURIComponent(statusMatch[1])
        const branch = findMockBranchById(branchId)
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
          route = ({ body: patchBody }) => {
            const next = {
              ...branch,
              ...(patchBody && typeof patchBody === 'object' ? patchBody : {}),
            }
            // Postman sends deliveryRadiusKm; responses expose radiusKm
            if (patchBody?.deliveryRadiusKm !== undefined) {
              next.radiusKm = patchBody.deliveryRadiusKm
              next.radius = `${patchBody.deliveryRadiusKm} km`
              delete next.deliveryRadiusKm
            }
            if (patchBody?.minOrderAmount !== undefined) {
              next.minOrderAmount = patchBody.minOrderAmount
              next.minOrderValue = String(patchBody.minOrderAmount)
              next.minOrder = `${Number(patchBody.minOrderAmount).toFixed(3)} BHD`
            }
            if (patchBody?.openingHours !== undefined) {
              next.openingHours = patchBody.openingHours
              branch.openingHours = patchBody.openingHours
            }
            Object.assign(branch, {
              name: next.name ?? branch.name,
              address: next.address ?? branch.address,
              phone: next.phone ?? branch.phone,
              radiusKm: next.radiusKm ?? branch.radiusKm,
              etaMin: next.etaMin ?? branch.etaMin,
              minOrderValue: next.minOrderValue ?? branch.minOrderValue,
              openingHours: next.openingHours ?? branch.openingHours,
            })
            return next
          }
        }
      }
    }

    if (!route && method.toUpperCase() === 'DELETE') {
      const branch = findMockBranch(url)
      if (branch) {
        route = () => {
          const index = vendorMock.branches.findIndex((b) => b.id === branch.id)
          if (index >= 0) vendorMock.branches.splice(index, 1)
          return { success: true, id: branch.id }
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
