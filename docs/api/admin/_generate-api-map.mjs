/**
 * Generates docs/api/admin/admin-api-map.md from extracted Postman data + frontend map.
 * Run: node docs/api/admin/_generate-api-map.mjs
 * Safe for docs: never writes real tokens/passwords/IDs into the markdown.
 */
import fs from 'fs'

const extracted = JSON.parse(
  fs.readFileSync('docs/api/admin/_postman-extracted.json', 'utf8'),
)

const SENSITIVE_KEYS = new Set([
  'password',
  'currentPassword',
  'newPassword',
  'otp',
  'code',
  'pin',
  'token',
  'tempToken',
  'accessToken',
  'refreshToken',
  'secret',
])

function scrub(value, key = '') {
  if (value == null) return value
  if (typeof value === 'string') {
    if (SENSITIVE_KEYS.has(key)) return `{{${key}}}`
    return value
      .replace(/eyJ[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+/g, '{{JWT}}')
      .replace(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g, '{{email}}')
      .replace(/\+?\d{8,15}/g, '{{phone}}')
      .replace(
        /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
        '{{uuid}}',
      )
  }
  if (Array.isArray(value)) return value.map((v) => scrub(v))
  if (typeof value === 'object') {
    const out = {}
    for (const [k, v] of Object.entries(value)) out[k] = scrub(v, k)
    return out
  }
  return value
}

function shapeOnly(value) {
  if (value == null) return null
  if (Array.isArray(value)) {
    if (!value.length) return []
    return [shapeOnly(value[0])]
  }
  if (typeof value === 'object') {
    const out = {}
    for (const k of Object.keys(value)) out[k] = shapeOnly(value[k])
    return out
  }
  if (typeof value === 'boolean') return 'boolean'
  if (typeof value === 'number') return 'number'
  return 'string'
}

function bodyShape(body) {
  if (body == null) return '—'
  const scrubbed = scrub(body)
  if (typeof scrubbed === 'string') return '`string`'
  const shaped = shapeOnly(scrubbed)
  const text = JSON.stringify(shaped)
  return '`' + text.slice(0, 320) + (text.length > 320 ? '…' : '') + '`'
}

function queryStr(query) {
  if (!query?.length) return '—'
  return query.map((q) => `\`${q.key}\``).join(', ')
}

function pathParamsStr(r) {
  const fromPath = [...String(r.path).matchAll(/\{\{([^}]+)\}\}/g)].map((m) => m[1])
  const fromVar = (r.pathParams || []).map((p) => p.key)
  const all = [...new Set([...fromPath, ...fromVar])]
  return all.length ? all.map((p) => `\`${p}\``).join(', ') : '—'
}

function savesStr(saves) {
  if (!saves?.length) return '—'
  return saves.map((s) => `\`{{${s}}}\``).join(', ')
}

/**
 * Frontend mapping knowledge base — verified against routes/pages, not folder names alone.
 * status: CONFIRMED_UI_MATCH | POSSIBLE_UI_MATCH | API_WITHOUT_UI | UI_WITHOUT_CONFIRMED_API
 */
const MAP = {
  // --- Auth ---
  'Login': {
    status: 'CONFIRMED_UI_MATCH',
    ui: '`/login` — Admin path via shared Login → pending 2FA',
    files: '`src/pages/Login.jsx`, `src/context/AuthContext.jsx`',
    data: 'Demo credentials + localStorage (`demoAccounts.admin`); Vendor may use real `authService`',
  },
  '2FA Verify': {
    status: 'CONFIRMED_UI_MATCH',
    ui: '`/admin/verify` — AdminTwoFactor',
    files: '`src/pages/admin/AdminTwoFactor.jsx`, `src/context/AuthContext.jsx`',
    data: 'Local demo code `ADMIN_DEMO_CODE`; sessionStorage pending admin',
  },
  'Get me': {
    status: 'POSSIBLE_UI_MATCH',
    ui: 'Session restore / account header (no dedicated Admin Get Me yet)',
    files: '`src/context/AuthContext.jsx`, `src/layout/AdminLayout.jsx`, `src/pages/admin/AdminAccountPage.jsx`',
    data: 'localStorage `yjeek_auth` only for Admin',
  },
  'Update me (Account)': {
    status: 'CONFIRMED_UI_MATCH',
    ui: '`/admin/account` — Profile card edit',
    files: '`src/pages/admin/AdminAccountPage.jsx`',
    data: 'Local/static profile fields',
  },
  'Logout': {
    status: 'CONFIRMED_UI_MATCH',
    ui: 'Admin sidebar Sign out',
    files: '`src/layout/AdminLayout.jsx`, `src/context/AuthContext.jsx`',
    data: 'Clears local session only',
  },
  'Change required password': {
    status: 'POSSIBLE_UI_MATCH',
    ui: 'Settings · Security / forced password change (partial UI)',
    files: '`src/pages/admin/settings/AdminSettingsPage.jsx`',
    data: 'Local form state',
  },
  '2FA Setup': {
    status: 'POSSIBLE_UI_MATCH',
    ui: 'Settings · Security 2FA toggles',
    files: '`src/pages/admin/settings/AdminSettingsPage.jsx`',
    data: 'Local form state',
  },
  '2FA Confirm': {
    status: 'POSSIBLE_UI_MATCH',
    ui: 'Settings · Security 2FA confirm flow',
    files: '`src/pages/admin/settings/AdminSettingsPage.jsx`',
    data: 'Local form state',
  },
  'Regenerate backup codes': {
    status: 'API_WITHOUT_UI',
    ui: 'No dedicated backup-codes UI found',
    files: '—',
    data: '—',
  },
  '2FA Disable': {
    status: 'POSSIBLE_UI_MATCH',
    ui: 'Settings · Security',
    files: '`src/pages/admin/settings/AdminSettingsPage.jsx`',
    data: 'Local form state',
  },

  // --- Users ---
  'Users summary': {
    status: 'CONFIRMED_UI_MATCH',
    ui: '`/admin/users` — Users tab stats',
    files: '`src/pages/admin/management/AdminUsersPage.jsx`, `src/services/adminService.js`',
    data: 'Mock via `adminService.getManagement("users")` → `admin.mock.js`',
  },
  'Create-user meta': {
    status: 'CONFIRMED_UI_MATCH',
    ui: '`/admin/users/new` — role/scope dropdowns',
    files: '`src/pages/admin/management/AdminCreateUserPage.jsx`',
    data: 'Static options in page',
  },
  'List users': {
    status: 'CONFIRMED_UI_MATCH',
    ui: '`/admin/users`',
    files: '`src/pages/admin/management/AdminUsersPage.jsx`',
    data: 'Mock management users rows',
  },
  'Get user detail': {
    status: 'CONFIRMED_UI_MATCH',
    ui: '`/admin/users/:userId`',
    files: '`src/pages/admin/management/AdminUserDetailPage.jsx`',
    data: 'Mock `users.details`',
  },
  'Create user (invite)': {
    status: 'CONFIRMED_UI_MATCH',
    ui: '`/admin/users/new`',
    files: '`src/pages/admin/management/AdminCreateUserPage.jsx`',
    data: 'Local form (no API submit)',
  },
  'Update user': {
    status: 'CONFIRMED_UI_MATCH',
    ui: '`/admin/users/:userId`',
    files: '`src/pages/admin/management/AdminUserDetailPage.jsx`',
    data: 'Local/mock',
  },
  'Reset password': {
    status: 'POSSIBLE_UI_MATCH',
    ui: 'User detail actions (if present)',
    files: '`src/pages/admin/management/AdminUserDetailPage.jsx`',
    data: 'UI action may be incomplete',
  },
  'Resend invitation': {
    status: 'POSSIBLE_UI_MATCH',
    ui: 'User detail / invite state',
    files: '`src/pages/admin/management/AdminUserDetailPage.jsx`',
    data: 'Unclear',
  },
  'Accept invitation (public)': {
    status: 'API_WITHOUT_UI',
    ui: 'No public invite-accept Admin route in frontend',
    files: '—',
    data: '—',
  },
  'Suspend user': {
    status: 'POSSIBLE_UI_MATCH',
    ui: 'User detail status actions',
    files: '`src/pages/admin/management/AdminUserDetailPage.jsx`',
    data: 'Local/mock',
  },
  'Unsuspend user': {
    status: 'POSSIBLE_UI_MATCH',
    ui: 'User detail status actions',
    files: '`src/pages/admin/management/AdminUserDetailPage.jsx`',
    data: 'Local/mock',
  },
  'Roles meta': {
    status: 'CONFIRMED_UI_MATCH',
    ui: '`/admin/users/roles/new` — permission matrix meta',
    files: '`src/pages/admin/management/AdminCreateRolePage.jsx`',
    data: 'Static permission matrix',
  },
  'List roles': {
    status: 'CONFIRMED_UI_MATCH',
    ui: '`/admin/users/roles`',
    files: '`src/pages/admin/management/AdminUsersPage.jsx`',
    data: 'Mock roles list',
  },
  'Get role': {
    status: 'POSSIBLE_UI_MATCH',
    ui: 'Roles tab / edit role (no dedicated role detail route)',
    files: '`src/pages/admin/management/AdminUsersPage.jsx`, `src/pages/admin/management/AdminCreateRolePage.jsx`',
    data: 'Mock/static',
  },
  'Create role': {
    status: 'CONFIRMED_UI_MATCH',
    ui: '`/admin/users/roles/new`',
    files: '`src/pages/admin/management/AdminCreateRolePage.jsx`',
    data: 'Local form',
  },
  'Update role': {
    status: 'POSSIBLE_UI_MATCH',
    ui: 'Roles list edit',
    files: '`src/pages/admin/management/AdminUsersPage.jsx`',
    data: 'Mock',
  },
  'Delete role': {
    status: 'POSSIBLE_UI_MATCH',
    ui: 'Roles list delete',
    files: '`src/pages/admin/management/AdminUsersPage.jsx`',
    data: 'Mock',
  },
  'Activity log': {
    status: 'CONFIRMED_UI_MATCH',
    ui: '`/admin/users/activity`',
    files: '`src/pages/admin/management/AdminUsersPage.jsx`',
    data: 'Mock activity rows',
  },
  'Activity filters metadata': {
    status: 'CONFIRMED_UI_MATCH',
    ui: '`/admin/users/activity` filters',
    files: '`src/pages/admin/management/AdminUsersPage.jsx`',
    data: 'Static filter options',
  },
  'Export activity CSV': {
    status: 'POSSIBLE_UI_MATCH',
    ui: 'Activity log export control (if present)',
    files: '`src/pages/admin/management/AdminUsersPage.jsx`',
    data: 'Unclear / local',
  },

  // --- Dashboard ---
  'Overview': {
    status: 'CONFIRMED_UI_MATCH',
    ui: '`/admin/dashboard` — KPI summary',
    files: '`src/pages/admin/dashboard/AdminDashboardPage.jsx`, `src/services/adminService.js`',
    data: 'Mock `GET /admin/dashboard` → `adminDashboardMock`',
  },
  'Map — champs': {
    status: 'CONFIRMED_UI_MATCH',
    ui: '`/admin/dashboard` map tab Champs',
    files: '`src/pages/admin/dashboard/AdminDashboardPage.jsx`',
    data: 'Mock map tabs',
  },
  'Map — orders': {
    status: 'CONFIRMED_UI_MATCH',
    ui: '`/admin/dashboard` map tab Orders',
    files: '`src/pages/admin/dashboard/AdminDashboardPage.jsx`',
    data: 'Mock map tabs',
  },
  'Map — vendors': {
    status: 'CONFIRMED_UI_MATCH',
    ui: '`/admin/dashboard` map tab Vendors',
    files: '`src/pages/admin/dashboard/AdminDashboardPage.jsx`',
    data: 'Mock map tabs',
  },
  'Live orders': {
    status: 'CONFIRMED_UI_MATCH',
    ui: '`/admin/live-orders` + dashboard SLA columns',
    files: '`src/pages/admin/operations/AdminLiveOrdersPage.jsx`, `src/pages/admin/dashboard/AdminDashboardPage.jsx`',
    data: 'Mock `getLiveOrders` / dashboard slaColumns',
  },
  'Critical bucket': {
    status: 'CONFIRMED_UI_MATCH',
    ui: 'Live orders / dashboard Critical column (`bucket=critical`)',
    files: '`src/pages/admin/operations/AdminLiveOrdersPage.jsx`',
    data: 'Mock columns',
  },
  'Board — scheduled': {
    status: 'CONFIRMED_UI_MATCH',
    ui: '`/admin/scheduled`',
    files: '`src/pages/admin/operations/AdminScheduledOrdersPage.jsx`, `src/pages/admin/AdminScheduledColumn.jsx`',
    data: 'Mock `getOperations("scheduled")`',
  },
  'Board — pickup': {
    status: 'CONFIRMED_UI_MATCH',
    ui: '`/admin/pickup`',
    files: '`src/pages/admin/operations/AdminPickupPage.jsx`, `src/components/admin/operations/AdminIncidentBoard.jsx`',
    data: 'Mock `getPickup`',
  },
  'Board — dine_in': {
    status: 'CONFIRMED_UI_MATCH',
    ui: '`/admin/dine-in`',
    files: '`src/pages/admin/operations/AdminDineInPage.jsx`',
    data: 'Mock `getDineIn`',
  },
  'Board — services': {
    status: 'CONFIRMED_UI_MATCH',
    ui: '`/admin/services`',
    files: '`src/pages/admin/operations/AdminServicesPage.jsx`',
    data: 'Mock `getServices`',
  },
  'Incidents feed': {
    status: 'CONFIRMED_UI_MATCH',
    ui: 'Dashboard + Live boards Incidents Log panels',
    files: '`src/components/admin/operations/IncidentLog.jsx`, `src/pages/admin/dashboard/AdminDashboardPage.jsx`',
    data: 'Mock incidents arrays',
  },
  'Open chats': {
    status: 'CONFIRMED_UI_MATCH',
    ui: 'Open chats strip on ops boards',
    files: '`src/components/admin/operations/AdminOpenChats.jsx`, `src/components/admin/operations/ChatStrip.jsx`',
    data: 'Mock chats',
  },

  // --- Orders ---
  'Action options': {
    status: 'CONFIRMED_UI_MATCH',
    ui: 'Order/incident action menus on live boards',
    files: '`src/pages/admin/operations/AdminLiveOrdersPage.jsx`',
    data: 'Hardcoded action labels in modal',
  },
  'Get order': {
    status: 'CONFIRMED_UI_MATCH',
    ui: 'Order detail drawer/modal on live/scheduled boards',
    files: '`src/pages/admin/operations/AdminLiveOrdersPage.jsx`, `src/components/admin/operations/OrderCard.jsx`',
    data: 'Card fields from mock; detail mostly static overlay',
  },
  'Print order detail': {
    status: 'POSSIBLE_UI_MATCH',
    ui: 'Order detail print action (if present)',
    files: '`src/pages/admin/operations/AdminLiveOrdersPage.jsx`',
    data: 'Unclear',
  },
  'Nearby champs': {
    status: 'CONFIRMED_UI_MATCH',
    ui: '`/admin/scheduled/assign/:orderId` — Assign champ',
    files: '`src/pages/admin/AdminAssignChamp.jsx`',
    data: 'Local/static champ list',
  },
  'List dispatch attempts': {
    status: 'POSSIBLE_UI_MATCH',
    ui: 'Order detail / scheduled dispatch history',
    files: '`src/pages/admin/operations/AdminScheduledOrdersPage.jsx`',
    data: 'Inline `dispatchRows` mock',
  },
  'List dispatch evaluations': {
    status: 'API_WITHOUT_UI',
    ui: 'No dedicated evaluations screen',
    files: '—',
    data: '—',
  },
  'Resolve vendor acceptance': {
    status: 'POSSIBLE_UI_MATCH',
    ui: 'Order action menus',
    files: '`src/pages/admin/operations/AdminLiveOrdersPage.jsx`',
    data: 'Hardcoded actions',
  },
  'Mark vendor no-response': {
    status: 'POSSIBLE_UI_MATCH',
    ui: 'Order action menus',
    files: '`src/pages/admin/operations/AdminLiveOrdersPage.jsx`',
    data: 'Hardcoded actions',
  },
  'Take action (generic)': {
    status: 'CONFIRMED_UI_MATCH',
    ui: 'Incident/order action menu (Redispatch, Refund, Cancel, etc.)',
    files: '`src/pages/admin/operations/AdminLiveOrdersPage.jsx`',
    data: 'UI only — no API',
  },
  'Redispatch': {
    status: 'CONFIRMED_UI_MATCH',
    ui: 'Live orders incident modal — Redispatch order',
    files: '`src/pages/admin/operations/AdminLiveOrdersPage.jsx`',
    data: 'UI only',
  },
  'Refund': {
    status: 'CONFIRMED_UI_MATCH',
    ui: 'Order/incident actions — Refund',
    files: '`src/pages/admin/operations/AdminLiveOrdersPage.jsx`',
    data: 'UI only',
  },
  'Reassign champ': {
    status: 'CONFIRMED_UI_MATCH',
    ui: 'Assign/reassign champ flows',
    files: '`src/pages/admin/AdminAssignChamp.jsx`, `src/pages/admin/operations/AdminLiveOrdersPage.jsx`',
    data: 'Local form / UI only',
  },
  'Flag vendor': {
    status: 'POSSIBLE_UI_MATCH',
    ui: 'Order action menus',
    files: '`src/pages/admin/operations/AdminLiveOrdersPage.jsx`',
    data: 'Hardcoded actions',
  },
  'Cancel order': {
    status: 'CONFIRMED_UI_MATCH',
    ui: 'Order cancel action',
    files: '`src/pages/admin/operations/AdminLiveOrdersPage.jsx`',
    data: 'UI only',
  },
  'Suspend champ (from order)': {
    status: 'POSSIBLE_UI_MATCH',
    ui: 'Order actions / Fleet suspend',
    files: '`src/pages/admin/operations/AdminLiveOrdersPage.jsx`, `src/components/admin/AdminSuspendChampModal.jsx`',
    data: 'Modal local',
  },

  // --- Incidents & Chats ---
  'Incidents summary': {
    status: 'POSSIBLE_UI_MATCH',
    ui: 'Incidents Log headers on boards',
    files: '`src/components/admin/operations/IncidentLog.jsx`',
    data: 'Mock counts',
  },
  'List incidents': {
    status: 'CONFIRMED_UI_MATCH',
    ui: 'Incidents Log on dashboard/ops boards',
    files: '`src/components/admin/operations/IncidentLog.jsx`, `src/components/admin/operations/AdminIncidentBoard.jsx`',
    data: 'Mock incidents',
  },
  'Get incident detail': {
    status: 'CONFIRMED_UI_MATCH',
    ui: 'Incident order modal on live orders',
    files: '`src/pages/admin/operations/AdminLiveOrdersPage.jsx`',
    data: 'Static incident cards in modal',
  },
  'Create incident': {
    status: 'POSSIBLE_UI_MATCH',
    ui: 'Incident create (if action exists)',
    files: '`src/components/admin/operations/AdminIncidentBoard.jsx`',
    data: 'Unclear',
  },
  'Acknowledge incident (Dispatcher SLA)': {
    status: 'POSSIBLE_UI_MATCH',
    ui: 'Incident action menu',
    files: '`src/pages/admin/operations/AdminLiveOrdersPage.jsx`',
    data: 'UI only',
  },
  'Resolve incident': {
    status: 'CONFIRMED_UI_MATCH',
    ui: 'Incident actions — resolve',
    files: '`src/pages/admin/operations/AdminLiveOrdersPage.jsx`',
    data: 'UI only',
  },
  'Reopen incident': {
    status: 'POSSIBLE_UI_MATCH',
    ui: 'Incident actions',
    files: '`src/pages/admin/operations/AdminLiveOrdersPage.jsx`',
    data: 'UI only',
  },
  'Incident action': {
    status: 'CONFIRMED_UI_MATCH',
    ui: 'Incident action menu',
    files: '`src/pages/admin/operations/AdminLiveOrdersPage.jsx`',
    data: 'UI only',
  },
  'List open chats': {
    status: 'CONFIRMED_UI_MATCH',
    ui: 'Open chats panel',
    files: '`src/components/admin/operations/AdminOpenChats.jsx`',
    data: 'Mock chats',
  },
  'Get conversation': {
    status: 'CONFIRMED_UI_MATCH',
    ui: 'Chat panel',
    files: '`src/components/admin/operations/AdminChatPanel.jsx`',
    data: 'Mock / local thread',
  },
  'Mark chat read': {
    status: 'POSSIBLE_UI_MATCH',
    ui: 'Chat open / unread badge',
    files: '`src/components/admin/operations/AdminOpenChats.jsx`',
    data: 'Local unreadCount',
  },
  'Send chat message': {
    status: 'CONFIRMED_UI_MATCH',
    ui: 'Chat panel composer',
    files: '`src/components/admin/operations/AdminChatPanel.jsx`',
    data: 'Local state',
  },

  // Default fallbacks applied per-module below for unlisted names
}

/** Module-level defaults when request name not in MAP */
const MODULE_DEFAULTS = {
  '06. Vendors': {
    listUi: '`/admin/vendors`',
    detailUi: '`/admin/vendors/:vendorId`',
    files: '`src/pages/admin/management/AdminVendorsPage.jsx`, `src/pages/admin/management/AdminVendorDetailPage.jsx`, `src/pages/admin/vendors/*`, `src/components/admin/management/AdminVendor*.jsx`',
    data: 'Mock `getManagement("vendors")` / `getVendorDetail`',
  },
  '07. Fleet': {
    listUi: '`/admin/fleet`',
    detailUi: '`/admin/fleet/:champId`, `/admin/fleet/suppliers`',
    files: '`src/pages/admin/management/AdminFleetPage.jsx`, `AdminChampDetailPage.jsx`, `AdminAddChampPage.jsx`, `AdminNotifyChampsPage.jsx`, `AdminFleetSuppliersPage.jsx`, `AdminAddSupplierPage.jsx`, `AdminSupplierDetailPage.jsx`',
    data: 'Mock fleet + inline SUPPLIERS on suppliers pages',
  },
  '08. Customers': {
    listUi: '`/admin/customers`',
    detailUi: '`/admin/customers/:customerId`',
    files: '`src/pages/admin/management/AdminCustomersPage.jsx`, `AdminCustomerDetailPage.jsx`, `src/components/admin/management/AdminCustomerWallet.jsx`, `AdminCustomerSupport.jsx`, `AdminSuspendCustomerModal.jsx`',
    data: 'Mock `getManagement("customers")` / `getCustomerDetail`',
  },
  '09. Segments': {
    listUi: '`/admin/customers/new` (Create segment) — no segments list route',
    detailUi: 'Create segment form only',
    files: '`src/pages/admin/management/AdminCreateSegmentPage.jsx`',
    data: 'Local form state',
  },
  '10. Stores catalog': {
    listUi: 'No dedicated product-catalog Admin page (Store Management is store-types)',
    detailUi: '—',
    files: '—',
    data: '—',
  },
  '11. Store types': {
    listUi: '`/admin/stores`',
    detailUi: '`/admin/stores/new`, `/admin/stores/:storeTypeId`',
    files: '`src/pages/admin/management/AdminStoresPage.jsx`, `AdminCreateStoreTypePage.jsx`',
    data: 'Mock `getManagement("stores")`',
  },
  '12. Marketing': {
    listUi: '`/admin/marketing`',
    detailUi: 'Notifications + promo code routes',
    files: '`src/pages/admin/management/AdminMarketingPage.jsx`, `AdminSendCustomerNotificationPage.jsx`, `AdminSendVendorNotificationPage.jsx`, `AdminNotificationDetailPage.jsx`, `AdminCreatePromoCodePage.jsx`',
    data: 'Mock marketing + local send forms',
  },
  '13. Settings': {
    listUi: '`/admin/settings?tab=`',
    detailUi: 'General / Localization / Notifications / Security / Integrations',
    files: '`src/pages/admin/settings/AdminSettingsPage.jsx`',
    data: 'Local form defaults (not adminService)',
  },
  '14. SLA Models': {
    listUi: '`/admin/sla-models`, `/champ`, `/dispatcher`',
    detailUi: 'Template sections + Save SLA',
    files: '`src/pages/admin/management/AdminSlaModelsPage.jsx`, `src/components/admin/AdminVendorSlaConfigs.jsx`',
    data: 'Section configs in page; mock `sla-models` exists but page mostly local',
  },
  '15. Dispatch Rules': {
    listUi: 'No Admin route or nav item for Dispatch Rules',
    detailUi: '—',
    files: '—',
    data: '—',
  },
  '16. Reports': {
    listUi: '`/admin/reports`',
    detailUi: 'Orders report table',
    files: '`src/pages/admin/management/AdminReportsPage.jsx`',
    data: 'Inline page mock (not adminService)',
  },
  '17. UI Editor': {
    listUi: '`/admin/ui-editor`',
    detailUi: 'Screen map / Banners / Categories + AdminNewBannerModal',
    files: '`src/pages/admin/ui-editor/AdminUiEditorPage.jsx`, `src/components/admin/AdminNewBannerModal.jsx`',
    data: 'Local page seeds',
  },
  '18. Search (global header)': {
    listUi: 'Admin topbar search + notifications bell',
    detailUi: 'Presentational only today',
    files: '`src/layout/AdminLayout.jsx` (`AdminTopbar`)',
    data: 'No API / static badge',
  },
}

function resolveMapping(module, name) {
  if (MAP[name]) return { ...MAP[name], confidence: MAP[name].status === 'CONFIRMED_UI_MATCH' ? 'Confirmed' : MAP[name].status === 'POSSIBLE_UI_MATCH' ? 'Likely' : 'Unknown' }

  const def = MODULE_DEFAULTS[module]
  if (!def) {
    return {
      status: 'API_WITHOUT_UI',
      ui: 'Unknown — verify manually',
      files: '—',
      data: '—',
      confidence: 'Unknown',
    }
  }

  // Heuristics by request name within known modules
  const n = name.toLowerCase()

  if (module === '10. Stores catalog') {
    return {
      status: 'API_WITHOUT_UI',
      ui: def.listUi,
      files: def.files,
      data: def.data,
      confidence: 'Unknown',
    }
  }
  if (module === '15. Dispatch Rules') {
    return {
      status: 'API_WITHOUT_UI',
      ui: def.listUi,
      files: def.files,
      data: def.data,
      confidence: 'Unknown',
    }
  }
  if (module === '18. Search (global header)') {
    return {
      status: 'CONFIRMED_UI_MATCH',
      ui: def.listUi + ' (UI shell only — not wired)',
      files: def.files,
      data: def.data,
      confidence: 'Confirmed',
    }
  }
  if (module === '09. Segments') {
    if (n.includes('create') || n.includes('preview')) {
      return {
        status: 'CONFIRMED_UI_MATCH',
        ui: def.listUi,
        files: def.files,
        data: def.data,
        confidence: 'Confirmed',
      }
    }
    return {
      status: 'POSSIBLE_UI_MATCH',
      ui: 'Segment builder exists; list/detail/recalculate/delete lack dedicated screens',
      files: def.files,
      data: def.data,
      confidence: 'Likely',
    }
  }

  // Conservative module heuristics — prefer POSSIBLE when evidence is thin.
  if (n.startsWith('setup —') || n.startsWith('setup -')) {
    return {
      status: 'API_WITHOUT_UI',
      ui: 'Postman setup helper — not a product screen',
      files: '—',
      data: '—',
      confidence: 'Unknown',
    }
  }

  if (module === '14. SLA Models') {
    const confirmedSla =
      n === 'template' ||
      n === 'list' ||
      n === 'get' ||
      n === 'create' ||
      n === 'update' ||
      n.includes('set-default') ||
      n === 'duplicate' ||
      n.startsWith('assign') ||
      n.includes('effective')
    if (confirmedSla) {
      return {
        status: 'CONFIRMED_UI_MATCH',
        ui: def.listUi,
        files: def.files,
        data: def.data,
        confidence: 'Confirmed',
      }
    }
    return {
      status: 'POSSIBLE_UI_MATCH',
      ui: 'SLA Models page is a simplified template form; advanced version/publish/breach APIs may exceed current UI',
      files: def.files,
      data: def.data,
      confidence: 'Likely',
    }
  }

  if (module === '17. UI Editor') {
    const confirmedUi =
      n.includes('screen map') ||
      n.includes('list banners') ||
      n.includes('create banner') ||
      n.includes('update banner') ||
      n.includes('delete banner') ||
      n.includes('get banner') ||
      n.includes('banners meta') ||
      n.includes('home categories') ||
      n.includes('create category') ||
      n.includes('reorder') ||
      n.includes('patch category') ||
      n.includes('publish categories') ||
      n.includes('publish ui') ||
      n === 'apps' ||
      n.includes('placements') ||
      n.includes('preview')
    if (confirmedUi) {
      return {
        status: 'CONFIRMED_UI_MATCH',
        ui: def.listUi,
        files: def.files,
        data: def.data,
        confidence: 'Confirmed',
      }
    }
    return {
      status: 'POSSIBLE_UI_MATCH',
      ui: 'UI Editor exists; this endpoint may be CMS/help-page depth beyond current tabs',
      files: def.files,
      data: def.data,
      confidence: 'Likely',
    }
  }

  if (module === '08. Customers' && n.includes('withdrawal')) {
    return {
      status: 'POSSIBLE_UI_MATCH',
      ui: 'Customer wallet tab may surface withdrawals; no dedicated withdrawals queue page found',
      files: '`src/components/admin/management/AdminCustomerWallet.jsx`',
      data: 'Mock wallet transactions',
      confidence: 'Likely',
    }
  }
  if (module === '08. Customers' && n.includes('verif')) {
    return {
      status: 'POSSIBLE_UI_MATCH',
      ui: 'Customer detail overview — verification controls unclear',
      files: '`src/pages/admin/management/AdminCustomerDetailPage.jsx`',
      data: 'Mock detail',
      confidence: 'Likely',
    }
  }
  if (module === '12. Marketing' && (n.includes('list banners') || n.includes('list offers'))) {
    return {
      status: 'POSSIBLE_UI_MATCH',
      ui: 'Marketing focuses on notifications + promo codes; banners/offers overlap UI Editor',
      files: '`src/pages/admin/management/AdminMarketingPage.jsx`, `src/pages/admin/ui-editor/AdminUiEditorPage.jsx`',
      data: 'Mixed',
      confidence: 'Likely',
    }
  }
  if (module === '07. Fleet' && (n.includes('online') || n.includes('reconcile') || n.includes('jobs') || n.includes('message champ'))) {
    return {
      status: 'POSSIBLE_UI_MATCH',
      ui: 'Champ detail / fleet actions — control may be incomplete vs API',
      files: def.files,
      data: def.data,
      confidence: 'Likely',
    }
  }

  if (
    n.includes('list') ||
    n.includes('summary') ||
    n === 'overview' ||
    n.includes('get all') ||
    n === 'meta (dropdowns)' ||
    n === 'template' ||
    n.includes('create') ||
    n.includes('update') ||
    n.includes('edit') ||
    n.startsWith('get ') ||
    n.includes('detail') ||
    n.includes('send ') ||
    n.includes('add ') ||
    n.includes('delete') ||
    n.includes('suspend') ||
    n.includes('activate') ||
    n.includes('branch') ||
    n.includes('staff') ||
    n.includes('commission') ||
    n.includes('promotion') ||
    n.includes('delivery') ||
    n.includes('sla') ||
    n.includes('wallet') ||
    n.includes('support') ||
    n.includes('document') ||
    n.includes('earning') ||
    n.includes('notify') ||
    n.includes('supplier') ||
    n.includes('champ') ||
    n.includes('vendor') ||
    n.includes('customer') ||
    n.includes('promo') ||
    n.includes('notification') ||
    n.includes('badge') ||
    n.includes('menu categor') ||
    n.includes('draft') ||
    n.includes('publish') ||
    n.includes('localization') ||
    n.includes('security') ||
    n.includes('integration') ||
    n.includes('general') ||
    n.includes('export') ||
    n.includes('report') ||
    n.includes('fleet') ||
    n.includes('order') ||
    n.includes('estimate') ||
    n.includes('zone') ||
    n.includes('force close') ||
    n.includes('reopen') ||
    n.includes('unsuspend') ||
    n.includes('terminate') ||
    n.includes('approve') ||
    n.includes('reject') ||
    n.includes('reply') ||
    n.includes('resend') ||
    n.includes('schedule') ||
    n.includes('deactiv') ||
    n.includes('controls') ||
    n.includes('apply')
  ) {
    return {
      status: 'CONFIRMED_UI_MATCH',
      ui: def.detailUi || def.listUi,
      files: def.files,
      data: def.data,
      confidence: 'Confirmed',
    }
  }

  return {
    status: 'POSSIBLE_UI_MATCH',
    ui: def.listUi,
    files: def.files,
    data: def.data,
    confidence: 'Likely',
  }
}

function moduleTitle(mod) {
  // Normalize Postman folder names to user-requested headings
  const map = {
    '01. Auth': 'Auth',
    '02. Users & Roles': 'Users & Roles',
    '03. Dashboard (poll live)': 'Dashboard',
    '04. Orders (detail + take action)': 'Orders',
    '05. Incidents & Chats': 'Incidents & Chats',
    '06. Vendors': 'Vendors',
    '07. Fleet': 'Fleet',
    '08. Customers': 'Customers',
    '09. Segments': 'Segments',
    '10. Stores catalog': 'Stores Catalog',
    '11. Store types': 'Store Types',
    '12. Marketing': 'Marketing',
    '13. Settings': 'Settings',
    '14. SLA Models': 'SLA Models',
    '15. Dispatch Rules': 'Dispatch Rules',
    '16. Reports': 'Reports',
    '17. UI Editor': 'UI Editor',
    '18. Search (global header)': 'Global Search and Notifications',
  }
  return map[mod] || mod
}

const lines = []
const push = (s = '') => lines.push(s)

push('# Admin API ↔ Frontend mapping')
push('')
push('> Analysis only. **Do not treat this as an integration contract.** Response envelopes are unknown until Postman success/error screenshots are supplied. No response mappers should be written from this file alone.')
push('')
push('Generated from Postman collection `docs/postman/Yjeek Admin Panel.postman_collection.json` (sanitized) and verified against Admin routes/pages in `src/`.')
push('')
push('## Snapshot')
push('')
push(`| Metric | Value |`)
push(`|---|---|`)
push(`| Postman modules | ${extracted.moduleCount} |`)
push(`| Postman requests | ${extracted.total} |`)
push(`| Collection variables | ${extracted.variables.length} (placeholders only in docs) |`)
push(`| Admin routes file | \`src/routes/AdminRoutes.jsx\` |`)
push(`| Admin layout | \`src/layout/AdminLayout.jsx\` |`)
push(`| Current Admin data path | Page → \`useApiResource\` → \`adminService\` → \`apiClient\` → \`mockClient\` |`)
push(`| Target architecture | Page → Admin hook → Admin service → Admin mapper → shared \`apiClient\` |`)
push(`| \`endpoints.admin\` | Empty (intentionally) |`)
push(`| \`src/services/admin/\` | Stub only |`)
push(`| \`src/mappers/admin/\` | Stub only |`)
push(`| \`src/hooks/admin/\` | Missing |`)
push(`| Feature flag today | \`VITE_ADMIN_USE_MOCK_API\` (boolean) |`)
push(`| Recommended feature flag | \`VITE_ADMIN_REAL_API_FEATURES=auth\` (comma-separated; not implemented yet) |`)
push(`| Base URL | \`VITE_API_BASE_URL\` only — relative paths under \`/admin/...\` |`)
push('')
push('## Status legend')
push('')
push('| Status | Meaning |')
push('|---|---|')
push('| `CONFIRMED_UI_MATCH` | API clearly matches an existing Admin screen or control |')
push('| `POSSIBLE_UI_MATCH` | May match, but evidence incomplete |')
push('| `API_WITHOUT_UI` | API exists; no corresponding frontend UI found |')
push('| `UI_WITHOUT_CONFIRMED_API` | Frontend feature exists; no matching API confirmed |')
push('| `RESPONSE_SCREENSHOT_REQUIRED` | Request known; success/error response shapes unavailable |')
push('')
push('Every request below also has **Integration status = Not started** and **Response evidence = Missing** until screenshots are provided.')
push('')
push('## Collection variables (placeholders)')
push('')
push('Do not store real values in docs or source. Variables observed in the collection:')
push('')
push(extracted.variables.map((v) => `\`${v.key}\``).join(', '))
push('')
push('IDs commonly saved by Postman test scripts: `accessToken`, `tempToken`, `adminUserId`, `roleId`, `vendorId`, `champId`, `customerId`, `orderId`, `branchId`, `staffId`, `productId`, `promotionId`, `bannerId`, `offerId`, `promoCodeId`, `supplierId`, `segmentId`, `storeTypeId`, `slaModelId`, `slaBreachId`, `dispatcherAdminId`, `dispatchRuleId`, `incidentId`, `conversationId`, `ticketId`, `withdrawalId`, `documentId`, `menuCategoryId`, `badgeId`, `notificationId`, `categoryId`, `uiBannerId`, `acceptanceOrderId`.')
push('')
push('## Shared API architecture (current)')
push('')
push('| Path | Status |')
push('|---|---|')
push('| `src/api/client.js` | Present — shared Vendor/Admin |')
push('| `src/api/config.js` | Present — `VITE_API_BASE_URL`, mock flags |')
push('| `src/api/endpoints.js` | Present — `endpoints.vendor` filled; `endpoints.admin` empty |')
push('| `src/api/token.js` | Present — role-scoped admin/vendor tokens |')
push('| `src/api/errors.js` | Present |')
push('| `src/api/response.js` | Present |')
push('| `src/api/mockClient.js` | Present — Admin mock routes |')
push('| `src/hooks/useApiResource.js` | Present |')
push('| `src/hooks/useApiMutation.js` | Present |')
push('| `src/services/admin/` | Stub |')
push('| `src/mappers/admin/` | Stub |')
push('| `src/services/adminService.js` | Live mock getters |')
push('| `src/hooks/admin/` | Missing |')
push('| Vendor pattern | Page → `hooks/vendor/*` → `services/vendor/*` → `mappers/vendor/*` → `apiClient` |')
push('')
push('Do **not** duplicate Vendor services for Admin. Keep `apiClient` shared; keep business services/mappers role-specific.')
push('')
push('## Admin frontend modules (routes)')
push('')
push('| Area | Routes | Primary files | Current data |')
push('|---|---|---|---|')
push('| Auth | `/login`, `/admin/verify` | `Login.jsx`, `AdminTwoFactor.jsx`, `AuthContext.jsx` | Demo / local |')
push('| Account | `/admin/account` | `AdminAccountPage.jsx` | Static/local |')
push('| Dashboard | `/admin/dashboard` | `AdminDashboardPage.jsx` | Mock service |')
push('| Live orders | `/admin/live-orders` | `AdminLiveOrdersPage.jsx` | Mock service |')
push('| Scheduled | `/admin/scheduled`, assign, column | `AdminScheduledOrdersPage.jsx`, `AdminAssignChamp.jsx`, `AdminScheduledColumn.jsx` | Mock + inline |')
push('| Pickup / Dine-in / Services | `/admin/pickup`, `/dine-in`, `/services` | Thin wrappers + `AdminIncidentBoard.jsx` | Mock service |')
push('| Vendors | `/admin/vendors`, detail, wizard | management + vendors pages | Mock service |')
push('| Store types | `/admin/stores` | `AdminStoresPage.jsx`, `AdminCreateStoreTypePage.jsx` | Mock service |')
push('| Fleet | `/admin/fleet`, champs, suppliers, notify | fleet pages + modals | Mock + inline suppliers |')
push('| Customers | `/admin/customers`, detail, create segment | customer pages | Mock + local segment form |')
push('| Marketing | `/admin/marketing/*` | marketing pages | Mock + local forms |')
push('| SLA Models | `/admin/sla-models/*` | `AdminSlaModelsPage.jsx` | Local section configs |')
push('| UI Editor | `/admin/ui-editor` | `AdminUiEditorPage.jsx` | Local seeds |')
push('| Users & Roles | `/admin/users/*` | users pages | Mock service |')
push('| Reports | `/admin/reports` | `AdminReportsPage.jsx` | Inline mock |')
push('| Settings | `/admin/settings` | `AdminSettingsPage.jsx` | Local form |')
push('| Global search / bell | Topbar only | `AdminLayout.jsx` | Not wired |')
push('| Dispatch Rules | — | — | **No UI** |')
push('| Stores product catalog | — | — | **No UI** (API module ≠ Store Management) |')
push('')

push('## UI without confirmed API')
push('')
push('| Frontend feature | Notes |')
push('|---|---|')
push('| Admin demo login credentials in `AuthContext` | Real Admin auth APIs exist in Postman but are not connected |')
push('| Reports page 29-column order table | Postman has `/admin/reports/orders` — mapping likely but response shape unconfirmed |')
push('| Fleet suppliers inline `SUPPLIERS` array | Postman has `/admin/fleet/suppliers*` — likely match, not connected |')
push('| Settings tabs local defaults | Postman `/admin/settings*` — likely match |')
push('| UI Editor local banner/category seeds | Postman `/admin/ui-editor*` — likely match |')
push('| SLA Models page section configs | Postman `/admin/sla-models*` — likely match; page does not use mock list |')
push('| Region selector “Bahrain · All regions” | May relate to `region` query on dashboard APIs — unconfirmed |')
push('| Scheduled dispatch map/table inline rows | Partial overlap with order dispatch APIs — incomplete |')
push('')

push('## APIs without UI')
push('')
push('| Module | Why |')
push('|---|---|')
push('| **Dispatch Rules** (all 10 requests) | No route, nav item, or page |')
push('| **Stores Catalog** (product/category CMS under `/admin/stores/products*`) | Frontend `/admin/stores` is **Store Types**, not product catalog |')
push('| Accept invitation (public) | No invite-accept route |')
push('| Regenerate backup codes | No UI |')
push('| List dispatch evaluations | No screen |')
push('| SLA setup helpers (`Setup — create Dispatcher…`) | Postman scaffolding only |')
push('| Many SLA version/publish/rollback/breach endpoints | UI is simplified template form only |')
push('| Customer withdrawals queue (list/approve/reject/complete) | No dedicated withdrawals page |')
push('')

// Per-module tables
const statusCounts = {
  CONFIRMED_UI_MATCH: 0,
  POSSIBLE_UI_MATCH: 0,
  API_WITHOUT_UI: 0,
}

for (const [mod, reqs] of Object.entries(extracted.modules)) {
  push(`## ${moduleTitle(mod)}`)
  push('')
  push(`Postman folder: **${mod}** · Requests: **${reqs.length}**`)
  push('')
  push('| Request name | Method | Relative endpoint | Auth | Request body (shape) | Query | Path params | Likely Admin UI | Relevant frontend files | Current data source | Mapping confidence | Mapping status | Response evidence | Integration status | Saves / depends |')
  push('|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|')

  for (const r of reqs) {
    const m = resolveMapping(mod, r.name)
    statusCounts[m.status] = (statusCounts[m.status] || 0) + 1
    const row = [
      r.name,
      r.method,
      `\`${r.path}\``,
      r.auth,
      bodyShape(r.body),
      queryStr(r.query),
      pathParamsStr(r),
      m.ui.replace(/\|/g, '\\|'),
      m.files.replace(/\|/g, '\\|'),
      m.data.replace(/\|/g, '\\|'),
      m.confidence,
      `\`${m.status}\` + \`RESPONSE_SCREENSHOT_REQUIRED\``,
      'Missing',
      'Not started',
      savesStr(r.saves),
    ]
    push('| ' + row.join(' | ') + ' |')
  }
  push('')
}

push('## Mapping status counts (request-level)')
push('')
push('| Status | Count |')
push('|---|---|')
for (const [k, v] of Object.entries(statusCounts)) {
  push(`| \`${k}\` | ${v} |`)
}
push(`| \`RESPONSE_SCREENSHOT_REQUIRED\` | ${extracted.total} (all requests until screenshots) |`)
push('')

push('## Recommended implementation order')
push('')
push('Adjusted after inspecting frontend dependencies (auth gates everything; dashboard boards share incident/chat components; vendors before store-types catalog usage; fleet/customers independent; operational order actions need live-board context; settings/reports/UI editor are mostly standalone; dispatch rules and stores product catalog need UI first or stay deferred).')
push('')
push('1. **Admin Login** — `POST /admin/auth/login`')
push('2. **2FA Verify** — `POST /admin/auth/2fa/verify` (when `tempToken` returned)')
push('3. **Get Me** — `GET /admin/auth/me` (session restore)')
push('4. **Logout** — `POST /admin/auth/logout`')
push('5. **Update me / Account** — optional with auth')
push('6. **Dashboard Overview** — `GET /admin/dashboard/overview`')
push('7. **Dashboard map + live order buckets** — map layers + `/admin/dashboard/orders`')
push('8. **Ops boards** — scheduled / pickup / dine_in / services')
push('9. **Incidents feed + Open chats** (shared by boards)')
push('10. **Users & Roles** (list, detail, create, roles, activity)')
push('11. **Vendors** (list → detail tabs → create wizard)')
push('12. **Store Types** (not Stores Catalog)')
push('13. **Fleet** (champs → detail → suppliers → notify)')
push('14. **Customers** (+ segment create)')
push('15. **Order detail + actions** (depends on live boards)')
push('16. **Incidents & Chats write paths**')
push('17. **Marketing**')
push('18. **Settings**')
push('19. **SLA Models**')
push('20. **Reports**')
push('21. **UI Editor**')
push('22. **Global Search + Notifications bell**')
push('23. **Dispatch Rules** — only after UI exists')
push('24. **Stores Catalog (products)** — only after UI exists')
push('')
push('Feature-scoped rollout example:')
push('')
push('```env')
push('VITE_ADMIN_REAL_API_FEATURES=auth')
push('# later:')
push('VITE_ADMIN_REAL_API_FEATURES=auth,dashboard')
push('```')
push('')
push('Keep `VITE_VENDOR_USE_MOCK_API` / Vendor real-API behavior unchanged. Prefer extending config beyond the current boolean `VITE_ADMIN_USE_MOCK_API` so one Admin feature can go live without flipping the entire Admin panel.')
push('')
push('## Security concerns')
push('')
push('| Issue | Recommendation |')
push('|---|---|')
push('| Original Postman collection may contain real passwords, tokens, phones, emails, and record IDs | Do not commit the raw Downloads file. Use a sanitized copy under `docs/postman/` |')
push('| Demo Admin credentials in `AuthContext` (`demoAccounts.admin`) | Acceptable for mock mode; remove/disable when real Admin auth ships |')
push('| Collection `baseUrl` may point at internal hosts | Always use `VITE_API_BASE_URL`; never hardcode hosts in services |')
push('| Postman test scripts persist IDs into collection variables | Fine for manual testing; never paste into docs/source |')
push('| This mapping doc uses placeholders only | Keep it that way when pasting screenshots later |')
push('')
push('## Files created / used by this analysis')
push('')
push('| File | Purpose |')
push('|---|---|')
push('| `docs/api/admin/admin-api-map.md` | This mapping document |')
push('| `docs/postman/Yjeek Admin Panel.postman_collection.json` | Working collection copy (sanitize before Git commit) |')
push('| `docs/api/admin/_postman-extracted.json` | Intermediate sanitized extract (optional; can delete) |')
push('| `docs/api/admin/_extract-postman.mjs` | Extractor script (optional) |')
push('| `docs/api/admin/_generate-api-map.mjs` | Generator script (optional) |')
push('')
push('## Next step for feature integration')
push('')
push('For each feature, supply:')
push('')
push('1. Admin UI screenshot')
push('2. Postman request screenshot')
push('3. Successful response screenshot')
push('4. Error response screenshot')
push('')
push('Then integrate **only that feature** while preserving existing UI, using the architecture above, without inventing response shapes.')
push('')

fs.mkdirSync('docs/api/admin', { recursive: true })
fs.writeFileSync('docs/api/admin/admin-api-map.md', lines.join('\n'))
console.log('Wrote docs/api/admin/admin-api-map.md')
console.log('Status counts', statusCounts)
console.log('Lines', lines.length)
