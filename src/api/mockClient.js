import {
  adminDashboardMock,
  adminLiveOrdersMock,
  adminManagementMock,
  adminOperationsMock,
  adminPickupMock,
  adminDineInMock,
  adminServicesMock,
  adminHomeCatalogMock,
  adminHomeCategoriesMock,
  adminExclusiveOffersMock,
  adminExclusiveOfferProductsMock,
  buildAdminStoreTypesListMock,
  buildAdminVendorDetail,
  buildAdminCustomerDetail,
  buildAdminChampDetail,
} from '../mocks/admin.mock'

const MOCK_SLA_TIER = (target, atRisk, critical) => ({ target, atRisk, critical })

const MOCK_SLA_CONFIG = {
  schemaVersion: 2,
  acceptanceCutoffMin: 2,
  prepTimeHotFoodMin: 18,
  readyOnTimeTargetPct: 90,
  handoverToChampMin: 4,
  vpiWeights: { accuracy: 20, packing: 5, prepTime: 25, reliability: 50 },
  vendor: {
    hotFoodOnDemand: {
      acceptanceTimeSec: MOCK_SLA_TIER(180, 300, 480),
      champCollectionTimeSec: MOCK_SLA_TIER(600, 840, 1200),
      earlyOnlineHoursSec: MOCK_SLA_TIER(36000, 28800, 21600),
      fullDeliveryWindowStart: '00:00:00',
      fullDeliveryWindowEnd: '23:59:59',
      prepTimeLimitSec: MOCK_SLA_TIER(900, 1200, 1680),
      customerIssueResponseSec: 7200,
      orderAccuracyPct: 100,
      orderRatingPct: 90,
      vpeWeights: {
        accuracyWeight: 20,
        ratingWeight: 5,
        prepTimeWeight: 25,
        metricTypeWeight: 50,
      },
      foodSafetyInvestigationSec: 900,
    },
  },
  champ: {
    acceptanceTimeByMode: {
      hotFood: MOCK_SLA_TIER(119, 180, 300),
      sameDay: MOCK_SLA_TIER(300, 480, 720),
      nextDay: MOCK_SLA_TIER(300, 600, 1200),
      standard: MOCK_SLA_TIER(300, 480, 900),
      economy: MOCK_SLA_TIER(300, 480, 900),
      food: MOCK_SLA_TIER(119, 180, 300),
      groceryPharmacy: MOCK_SLA_TIER(90, 180, 300),
      flowers: MOCK_SLA_TIER(90, 180, 300),
      electronics: MOCK_SLA_TIER(90, 180, 300),
    },
    performance: {
      doubleConfirmationSec: 30,
      onTimeDeliveryPct: 90,
      workingHoursDailySec: 28800,
      peakHoursStart: '16:00:00',
      peakHoursEnd: '20:00:00',
      customerRating: 4.5,
    },
    tiers: {
      elite: { min: 90, max: 100 },
      gold: { min: 80, max: 89 },
      silver: { min: 70, max: 79 },
      bronze: { min: 60, max: 69 },
      atRisk: { min: 0, max: 59 },
    },
  },
  dispatcher: {
    assignmentTimeByMode: {
      sameDay: MOCK_SLA_TIER(180, 300, 480),
      nextDay: MOCK_SLA_TIER(300, 480, 720),
      standard: MOCK_SLA_TIER(300, 540, 900),
      economy: MOCK_SLA_TIER(600, 900, 1500),
    },
    incidentAckSecByPriority: { P1: 300, P2: 300, P3: 120, P4: 1800 },
    incidentResolveSecByPriority: { P1: 1800, P2: 1800, P3: 300, P4: 86400 },
    coverageTargetPct: 95,
    chatFirstResponseSec: 45,
    champResponseSec: 600,
  },
}

function presentMockSlaModel(model) {
  return {
    ...model,
    config: model.draftConfig || model.config,
    publishedConfig: model.config,
    hasUnpublishedChanges: Boolean(model.draftConfig),
  }
}

function getMockSlaTemplate() {
  return {
    name: '',
    categoryLabel: 'Food & Beverage',
    description: '',
    status: 'DRAFT',
    isDefault: false,
    isActive: true,
    tabs: [
      { key: 'vendor', label: 'Vendor SLA' },
      { key: 'champ', label: 'Champ SLA' },
      { key: 'dispatcher', label: 'Dispatcher SLA' },
    ],
    config: structuredClone(MOCK_SLA_CONFIG),
  }
}

const mockSlaStore = {
  models: [
    {
      id: 'sla-platform-default',
      name: 'Platform default SLA',
      categoryLabel: 'Food & Beverage',
      description: 'Default platform SLA model',
      status: 'PUBLISHED',
      isDefault: true,
      isActive: true,
      currentVersion: 1,
      hasUnpublishedChanges: false,
      config: structuredClone(MOCK_SLA_CONFIG),
      draftConfig: null,
    },
  ],
}

function findMockSlaModel(id) {
  return mockSlaStore.models.find((item) => item.id === id) || null
}

const CHAMP_UI_EDITOR_SCREENS = [
  {
    key: 'home',
    label: 'Champ Home',
    shortLabel: 'Home',
    slotCount: 2,
    bannerTotal: 0,
    slots: [
      {
        key: 'champ_home_top',
        label: 'Champ home top',
        displayType: 'Scroll',
        bannerType: 'SCROLL',
        bannerCount: 0,
        activeCount: 0,
        banners: [],
      },
      {
        key: 'champ_home_mid',
        label: 'Champ home mid',
        displayType: 'Static',
        bannerType: 'STATIC',
        bannerCount: 0,
        activeCount: 0,
        banners: [],
      },
    ],
  },
  {
    key: 'jobs',
    label: 'Jobs',
    shortLabel: 'Jobs',
    slotCount: 1,
    bannerTotal: 0,
    slots: [
      {
        key: 'champ_orders_banner',
        label: 'Jobs banner',
        displayType: 'Static',
        bannerType: 'STATIC',
        bannerCount: 0,
        activeCount: 0,
        banners: [],
      },
    ],
  },
  {
    key: 'earnings',
    label: 'Earnings',
    shortLabel: 'Earn',
    slotCount: 1,
    bannerTotal: 0,
    slots: [
      {
        key: 'champ_earnings_banner',
        label: 'Earnings banner',
        displayType: 'Scroll',
        bannerType: 'SCROLL',
        bannerCount: 0,
        activeCount: 0,
        banners: [],
      },
    ],
  },
  {
    key: 'global',
    label: 'Global',
    shortLabel: 'Pop-up',
    slotCount: 1,
    bannerTotal: 0,
    slots: [
      {
        key: 'champ_app_open_popup',
        label: 'Pop-up ad (on open)',
        displayType: 'Pop-up',
        bannerType: 'POPUP',
        bannerCount: 0,
        activeCount: 0,
        banners: [],
      },
    ],
  },
]

const mockRoutes = {
  'GET /admin/dashboard': () => adminDashboardMock,
  'GET /admin/live-orders': () => adminLiveOrdersMock,
  'GET /admin/pickup': () => adminPickupMock,
  'GET /admin/dine-in': () => adminDineInMock,
  'GET /admin/services': () => adminServicesMock,
  'GET /admin/operations': () => adminOperationsMock,
  'GET /admin/management': ({ params }) => adminManagementMock[params?.type] || adminManagementMock.vendors,
  'GET /admin/store-types': () => buildAdminStoreTypesListMock(),
  'GET /admin/store-types/summary': () => {
    const list = buildAdminStoreTypesListMock()
    return {
      totalStoreTypes: list.totalStoreTypes,
      visibleCount: list.visibleCount,
      hiddenCount: list.hiddenCount,
      totalVendors: list.totalVendors,
    }
  },
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
    integrations: {
      maps: { provider: 'Google Maps', connected: true },
      sms: { provider: 'Twilio', connected: true },
      payment: { provider: 'Benefit Pay / Apple Pay', connected: true },
      analytics: { provider: 'GA4 + Mixpanel', connected: true },
      pos: { provider: 'Foodics / Square', connected: true },
      webhooks: { provider: 'Custom endpoints', connected: false },
      erp: { provider: 'Odoo / Oracle NetSuite', connected: false },
      services: [
        { key: 'maps', title: 'Maps & geocoding', provider: 'Google Maps', status: 'Connected', connected: true },
        { key: 'sms', title: 'SMS provider', provider: 'Twilio', status: 'Connected', connected: true },
        { key: 'payment', title: 'Payment gateway', provider: 'Benefit Pay / Apple Pay', status: 'Connected', connected: true },
        { key: 'analytics', title: 'Analytics', provider: 'GA4 + Mixpanel', status: 'Connected', connected: true },
        { key: 'pos', title: 'POS (Point of Sale)', provider: 'Foodics / Square', status: 'Connected', connected: true },
        { key: 'webhooks', title: 'Webhooks', provider: 'Custom endpoints', status: 'Not connected', connected: false },
        { key: 'erp', title: 'ERP', provider: 'Odoo / Oracle NetSuite', status: 'Not connected', connected: false },
      ],
    },
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
  'GET /admin/settings/integrations': () => ({
    section: 'integrations',
    maps: { provider: 'Google Maps', connected: true },
    sms: { provider: 'Twilio', connected: true },
    payment: { provider: 'Benefit Pay / Apple Pay', connected: true },
    analytics: { provider: 'GA4 + Mixpanel', connected: true },
    pos: { provider: 'Foodics / Square', connected: true },
    webhooks: { provider: 'Custom endpoints', connected: false },
    erp: { provider: 'Odoo / Oracle NetSuite', connected: false },
    services: [
      { key: 'maps', title: 'Maps & geocoding', provider: 'Google Maps', status: 'Connected', connected: true },
      { key: 'sms', title: 'SMS provider', provider: 'Twilio', status: 'Connected', connected: true },
      { key: 'payment', title: 'Payment gateway', provider: 'Benefit Pay / Apple Pay', status: 'Connected', connected: true },
      { key: 'analytics', title: 'Analytics', provider: 'GA4 + Mixpanel', status: 'Connected', connected: true },
      { key: 'pos', title: 'POS (Point of Sale)', provider: 'Foodics / Square', status: 'Connected', connected: true },
      { key: 'webhooks', title: 'Webhooks', provider: 'Custom endpoints', status: 'Not connected', connected: false },
      { key: 'erp', title: 'ERP', provider: 'Odoo / Oracle NetSuite', status: 'Not connected', connected: false },
    ],
  }),
  'GET /admin/ui-editor/apps': () => ({
    apps: [
      { key: 'CUSTOMER', label: 'Customer app' },
      { key: 'CHAMP', label: 'Champ app' },
    ],
  }),
  'GET /admin/ui-editor/screen-map': ({ params }) => {
    const app = String(params?.app || 'CUSTOMER').toUpperCase()
    const apps = [
      { key: 'CUSTOMER', label: 'Customer app' },
      { key: 'CHAMP', label: 'Champ app' },
    ]
    if (app === 'CHAMP') {
      return { app: 'CHAMP', apps, screens: CHAMP_UI_EDITOR_SCREENS }
    }
    return {
    app: params?.app || 'CUSTOMER',
    apps,
    screens: [
      {
        key: 'home',
        label: 'Home Screen',
        shortLabel: 'Home',
        slotCount: 4,
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
            key: 'home_exclusive_offers',
            label: 'Super Exclusive offers',
            displayType: 'Scroll',
            bannerType: 'SCROLL',
            slotKind: 'exclusive-offers',
            bannerCount: 2,
            productCount: 2,
            activeCount: 2,
            exclusiveItems: adminExclusiveOffersMock.items,
            banners: [],
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
    }
  },
  'GET /admin/ui-editor/placements': ({ params }) => {
    const app = String(params?.app || 'CUSTOMER').toUpperCase()
    const screen = params?.screen || 'home'
    if (app === 'CHAMP') {
      const screenDef = CHAMP_UI_EDITOR_SCREENS.find((item) => item.key === screen) || CHAMP_UI_EDITOR_SCREENS[0]
      return {
        app: 'CHAMP',
        screen: screenDef.key,
        screens: CHAMP_UI_EDITOR_SCREENS.map((item) => ({
          key: item.key,
          label: item.shortLabel || item.label,
        })),
        placements: screenDef.slots.map((slot) => ({
          ...slot,
          screenKey: screenDef.key,
          screenLabel: screenDef.label,
        })),
      }
    }
    return {
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
    }
  },
  'GET /admin/ui-editor/banners': ({ params }) => {
    const app = String(params?.app || 'CUSTOMER').toUpperCase()
    if (app === 'CHAMP') {
      return { count: 0, banners: [] }
    }
    return {
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
    }
  },
  'GET /admin/ui-editor/banners/meta': ({ params }) => {
    const app = String(params?.app || 'CUSTOMER').toUpperCase()
    if (app === 'CHAMP') {
      return {
        app: 'CHAMP',
        screens: CHAMP_UI_EDITOR_SCREENS.map((item) => ({
          key: item.key,
          label: item.shortLabel || item.label,
        })),
        placements: CHAMP_UI_EDITOR_SCREENS.flatMap((screen) =>
          screen.slots.map((slot) => ({
            key: slot.key,
            label: slot.label,
            type: slot.bannerType,
          })),
        ),
        bannerTypes: [
          { key: 'SCROLL', label: 'Scroll' },
          { key: 'STATIC', label: 'Static' },
          { key: 'POPUP', label: 'Pop-up' },
        ],
        tapActions: [
          { value: 'OPEN_CHAMP_SCREEN', label: 'Open Champ screen' },
          { value: 'OPEN_URL', label: 'Open URL' },
          { value: 'NONE', label: 'None' },
        ],
        audiences: [{ value: 'ALL', label: 'All champs' }],
        statuses: [
          { key: 'ACTIVE', label: 'Active' },
          { key: 'SCHEDULED', label: 'Scheduled' },
          { key: 'EXPIRED', label: 'Expired' },
          { key: 'INACTIVE', label: 'Inactive' },
        ],
      }
    }
    return {
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
    }
  },
  'GET /admin/ui-editor/banners/targets': ({ params }) => {
    const tapAction = String(params?.tapAction || 'OPEN_STORE').toUpperCase()
    if (tapAction === 'OPEN_CATEGORY') {
      return {
        tapAction,
        targets: [
          { id: 'st-food', name: 'Food', kind: 'STORE_TYPE', slug: 'food' },
          { id: 'om-dine-in', name: 'Dine In', kind: 'ORDER_MODE', slug: 'dine_in' },
          { id: 'om-pickup', name: 'Pickup', kind: 'ORDER_MODE', slug: 'pickup' },
          { id: 'st-grocery', name: 'Grocery', kind: 'STORE_TYPE', slug: 'grocery' },
          { id: 'st-pharmacy', name: 'Pharmacy', kind: 'STORE_TYPE', slug: 'pharmacy' },
        ],
      }
    }
    if (tapAction === 'OPEN_OFFER') {
      return {
        tapAction,
        targets: [
          { id: 'offer-ramadan', name: 'Ramadan deals' },
          { id: 'offer-free-delivery', name: 'Free delivery' },
        ],
      }
    }
    if (tapAction === 'OPEN_CHAMP_SCREEN') {
      return {
        tapAction,
        targets: [
          { id: 'home', label: 'Home' },
          { id: 'orders', label: 'Active orders' },
          { id: 'earnings', label: 'Earnings' },
          { id: 'incentives', label: 'Incentives & rewards' },
        ],
      }
    }
    if (tapAction === 'OPEN_URL' || tapAction === 'NONE') {
      return { tapAction, targets: [] }
    }
    return {
      tapAction,
      targets: [
        { id: 'store-green-kitchen', name: 'Green Kitchen' },
        { id: 'store-all', name: 'All stores' },
        { id: 'store-pharmacy', name: 'Pharmacy near you' },
      ],
    }
  },
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
    categories: adminHomeCategoriesMock.categories.slice(0, 2),
    exclusiveOffersSection: adminExclusiveOffersMock.section,
    exclusiveOffers: adminExclusiveOffersMock.items,
  }),
  'GET /admin/ui-editor/home/catalog': () => adminHomeCatalogMock,
  'GET /admin/ui-editor/home/categories': () => adminHomeCategoriesMock,
  'POST /admin/ui-editor/home/categories': ({ body }) => {
    const kind = String(body?.kind || '').trim()
    const refId = String(body?.refId || body?.ref_id || '').trim()
    if (!kind || !refId) {
      throw new Error('Home entries require kind and refId from Store Management.')
    }
    const catalogItem = [...adminHomeCatalogMock.storeTypes, ...adminHomeCatalogMock.orderModes].find(
      (item) => item.refId === refId || item.id === refId,
    )
    return {
      id: `he-mock-${Date.now()}`,
      kind,
      refId,
      code: catalogItem?.code || null,
      name: body?.name || catalogItem?.name || 'Category',
      slug: catalogItem?.slug || refId,
      iconUrl: body?.iconUrl || catalogItem?.iconUrl || null,
      isFeatured: body?.isFeatured !== false,
      sortOrder: body?.sortOrder ?? 99,
      isActive: body?.isActive !== false,
      structure: catalogItem?.structure || 'SINGLE',
      children: [],
    }
  },
  'PATCH /admin/ui-editor/home/categories/reorder': ({ body }) => ({
    categories: (body?.items || []).map((item, index) => ({
      id: item.id,
      kind: item.kind || 'STORE_TYPE',
      refId: item.refId || item.id,
      name: item.name || `Category ${index + 1}`,
      iconUrl: item.iconUrl || null,
      sortOrder: item.sortOrder ?? index,
      isFeatured: item.isFeatured !== false,
      isActive: true,
    })),
  }),
  'POST /admin/ui-editor/home/categories/publish': () => ({
    published: true,
    publishedAt: new Date().toISOString(),
  }),
  'GET /admin/ui-editor/home/exclusive-offers': () => adminExclusiveOffersMock,
  'PATCH /admin/ui-editor/home/exclusive-offers': ({ body }) => ({
    ...adminExclusiveOffersMock,
    section: {
      ...adminExclusiveOffersMock.section,
      ...(body?.title != null ? { title: body.title } : {}),
      ...(body?.titleAr != null ? { titleAr: body.titleAr } : {}),
      ...(body?.isVisible != null ? { isVisible: body.isVisible } : {}),
    },
    summary: { ...adminExclusiveOffersMock.summary, unpublishedChanges: true },
  }),
  'GET /admin/ui-editor/home/exclusive-offers/products': ({ params }) => {
    const search = String(params?.search || '').trim().toLowerCase()
    const vendorId = params?.vendorId ? String(params.vendorId) : ''
    const storeTypeId = params?.storeTypeId ? String(params.storeTypeId) : ''
    const availableOnly = params?.availableOnly === true || params?.availableOnly === 'true'
    const includeSelected = params?.includeSelected === true || params?.includeSelected === 'true'
    let products = [...adminExclusiveOfferProductsMock.products]
    if (search) {
      products = products.filter((product) => {
        const haystack = `${product.name} ${product.vendor?.name || ''}`.toLowerCase()
        return haystack.includes(search)
      })
    }
    if (vendorId) {
      products = products.filter((product) => product.vendor?.id === vendorId)
    }
    if (storeTypeId) {
      const storeTypeVendors = {
        'st-food': ['vnd-green-kitchen'],
        'st-electronics': ['vnd-sharaf'],
        'st-flowers': ['vnd-flowers'],
      }
      const allowed = storeTypeVendors[storeTypeId] || []
      products = products.filter((product) => allowed.includes(product.vendor?.id))
    }
    if (availableOnly) {
      products = products.filter((product) => product.isAvailable !== false)
    }
    if (!includeSelected) {
      products = products.filter((product) => !product.alreadySelected)
    }
    return {
      ...adminExclusiveOfferProductsMock,
      total: products.length,
      products,
    }
  },
  'POST /admin/ui-editor/home/exclusive-offers/items': ({ body }) => {
    const ids = body?.productIds || body?.items?.map((item) => item.productId) || []
    const newItems = ids
      .filter((id) => !adminExclusiveOffersMock.items.some((item) => item.productId === id))
      .map((productId, index) => ({
        id: `exo-item-${Date.now()}-${index}`,
        productId,
        vendorId: 'vnd-mock',
        title: `Product ${productId}`,
        imageUrl: null,
        originalPrice: 10,
        offerPrice: 8,
        isVisible: true,
        liveOnCustomer: true,
        sortOrder: adminExclusiveOffersMock.items.length + index,
        tapAction: 'OPEN_PRODUCT',
        targetId: productId,
        vendor: { id: 'vnd-mock', name: 'Mock vendor', logoUrl: null },
      }))
    return {
      ...adminExclusiveOffersMock,
      items: [...adminExclusiveOffersMock.items, ...newItems],
      summary: {
        itemCount: adminExclusiveOffersMock.items.length + newItems.length,
        visibleCount: adminExclusiveOffersMock.items.length + newItems.length,
        liveOnCustomerCount: adminExclusiveOffersMock.items.length + newItems.length,
        unpublishedChanges: true,
      },
    }
  },
  'PATCH /admin/ui-editor/home/exclusive-offers/items/reorder': ({ body }) => ({
    ...adminExclusiveOffersMock,
    items: (body?.items || []).map((item, index) => {
      const existing = adminExclusiveOffersMock.items.find((row) => row.id === item.id)
      return existing
        ? { ...existing, sortOrder: item.sortOrder ?? index }
        : { id: item.id, sortOrder: item.sortOrder ?? index }
    }),
  }),
  'POST /admin/ui-editor/home/exclusive-offers/publish': () => ({
    ...adminExclusiveOffersMock,
    published: true,
    publishedAt: new Date().toISOString(),
    summary: { ...adminExclusiveOffersMock.summary, unpublishedChanges: false },
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
  'GET /admin/sla-models/template': () => getMockSlaTemplate(),
  'GET /admin/sla-models': () => ({
    total: mockSlaStore.models.length,
    page: 1,
    limit: 50,
    totalPages: 1,
    models: mockSlaStore.models.map(presentMockSlaModel),
  }),
  'POST /admin/sla-models': ({ body }) => {
    const created = {
      id: `sla-${Date.now().toString(36)}`,
      name: body?.name || 'Platform default SLA',
      categoryLabel: body?.categoryLabel || 'Food & Beverage',
      description: body?.description || '',
      status: 'DRAFT',
      isDefault: false,
      isActive: body?.isActive !== false,
      currentVersion: 0,
      hasUnpublishedChanges: true,
      config: { ...MOCK_SLA_CONFIG, ...(body?.config && typeof body.config === 'object' ? body.config : {}) },
      draftConfig: body?.config || null,
    }
    mockSlaStore.models = [created, ...mockSlaStore.models.filter((item) => item.id !== created.id)]
    return presentMockSlaModel(created)
  },
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
  'PATCH /admin/settings/integrations': ({ body }) => ({
    section: 'integrations',
    ...(body && typeof body === 'object' ? body : {}),
  }),
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

    // Dynamic exclusive offer item patch/delete
    if (!route) {
      const exclusiveItemMatch = String(url).match(
        /^\/admin\/ui-editor\/home\/exclusive-offers\/items\/([^/?]+)$/,
      )
      if (exclusiveItemMatch) {
        const itemId = decodeURIComponent(exclusiveItemMatch[1])
        if (itemId !== 'reorder') {
          if (method.toUpperCase() === 'PATCH') {
            route = ({ body: patchBody }) => ({
              ...adminExclusiveOffersMock,
              items: adminExclusiveOffersMock.items.map((item) =>
                item.id === itemId ? { ...item, ...(patchBody || {}) } : item,
              ),
              summary: { ...adminExclusiveOffersMock.summary, unpublishedChanges: true },
            })
          } else if (method.toUpperCase() === 'DELETE') {
            route = () => ({
              ...adminExclusiveOffersMock,
              items: adminExclusiveOffersMock.items.filter((item) => item.id !== itemId),
              summary: {
                itemCount: adminExclusiveOffersMock.items.length - 1,
                visibleCount: adminExclusiveOffersMock.items.length - 1,
                liveOnCustomerCount: adminExclusiveOffersMock.items.length - 1,
                unpublishedChanges: true,
              },
            })
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
            kind: patchBody?.kind || 'STORE_TYPE',
            refId: patchBody?.refId || categoryId,
            name: patchBody?.name || 'Food',
            iconUrl: patchBody?.iconUrl !== undefined ? patchBody.iconUrl : null,
            sortOrder: patchBody?.sortOrder ?? 0,
            isFeatured: patchBody?.isFeatured !== false,
            isActive: patchBody?.isActive !== false,
          })
        }
      }
    }

    // Dynamic SLA model detail / update / publish / set-default
    if (!route) {
      const slaMatch = String(url).match(/^\/admin\/sla-models\/([^/?]+)(?:\/(publish|set-default|reset))?$/)
      if (slaMatch && slaMatch[1] !== 'template') {
        const slaModelId = decodeURIComponent(slaMatch[1])
        const action = slaMatch[2] || null
        const existing = findMockSlaModel(slaModelId)
        const methodName = method.toUpperCase()

        if (!action && methodName === 'GET') {
          route = () => presentMockSlaModel(existing || {
            id: slaModelId,
            name: 'Platform default SLA',
            status: 'PUBLISHED',
            isDefault: true,
            isActive: true,
            currentVersion: 1,
            config: structuredClone(MOCK_SLA_CONFIG),
            draftConfig: null,
          })
        } else if (!action && methodName === 'PATCH') {
          route = ({ body: patchBody }) => {
            const current = existing || {
              id: slaModelId,
              name: 'Platform default SLA',
              categoryLabel: 'Food & Beverage',
              description: '',
              status: 'DRAFT',
              isDefault: false,
              isActive: true,
              currentVersion: 0,
              config: structuredClone(MOCK_SLA_CONFIG),
            }
            const updated = {
              ...current,
              ...patchBody,
              id: slaModelId,
              draftConfig: patchBody?.config || current.draftConfig,
              config: current.config,
              hasUnpublishedChanges: true,
            }
            mockSlaStore.models = [
              updated,
              ...mockSlaStore.models.filter((item) => item.id !== slaModelId),
            ]
            return presentMockSlaModel(updated)
          }
        } else if (action === 'publish' && methodName === 'POST') {
          route = () => {
            const current = existing || {
              id: slaModelId,
              name: 'Platform default SLA',
              config: structuredClone(MOCK_SLA_CONFIG),
            }
            const published = {
              ...current,
              status: 'PUBLISHED',
              isActive: true,
              currentVersion: (current.currentVersion || 0) + 1,
              config: current.draftConfig || current.config || structuredClone(MOCK_SLA_CONFIG),
              draftConfig: null,
              hasUnpublishedChanges: false,
            }
            mockSlaStore.models = [
              published,
              ...mockSlaStore.models.filter((item) => item.id !== slaModelId),
            ]
            return presentMockSlaModel(published)
          }
        } else if (action === 'set-default' && methodName === 'POST') {
          route = () => {
            mockSlaStore.models = mockSlaStore.models.map((item) => ({
              ...item,
              isDefault: item.id === slaModelId,
            }))
            const current = findMockSlaModel(slaModelId) || {
              id: slaModelId,
              name: 'Platform default SLA',
              isDefault: true,
              config: structuredClone(MOCK_SLA_CONFIG),
            }
            return presentMockSlaModel({ ...current, isDefault: true })
          }
        } else if (action === 'reset' && methodName === 'POST') {
          route = () => {
            const current = existing || {
              id: slaModelId,
              name: 'Platform default SLA',
              categoryLabel: 'Food & Beverage',
              description: '',
              status: 'DRAFT',
              isDefault: false,
              isActive: true,
              currentVersion: 0,
              config: structuredClone(MOCK_SLA_CONFIG),
            }
            const reset = {
              ...current,
              draftConfig: structuredClone(MOCK_SLA_CONFIG),
              hasUnpublishedChanges: true,
            }
            mockSlaStore.models = [
              reset,
              ...mockSlaStore.models.filter((item) => item.id !== slaModelId),
            ]
            return presentMockSlaModel(reset)
          }
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
