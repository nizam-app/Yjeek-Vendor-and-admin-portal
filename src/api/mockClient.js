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
