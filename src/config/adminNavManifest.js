import { adminUserMeetsRouteRequirement } from '../lib/adminPermissions'

/**
 * Single source for Admin sidebar, route RBAC, and page titles.
 * Icon `id` values match lucide-react names used in AdminLayout (Phase 2).
 */

/** @typedef {{ label: string, path: string, requirement: import('../lib/adminPermissions').RouteRequirement }} AdminNavChild */
/** @typedef {{ label: string, path: string, iconId: string, requirement: import('../lib/adminPermissions').RouteRequirement }} AdminNavItem */

/**
 * @typedef {Object} RouteRequirement
 * @property {string} [module]
 * @property {string} [action]
 * @property {string[]} [anyOf] — module keys; user needs action on at least one
 */

export const ADMIN_ACCOUNT_PATH = '/admin/account'

/** Live Dashboard expandable group */
export const ADMIN_LIVE_DASHBOARD_NAV = {
  label: 'Live Dashboard',
  iconId: 'Activity',
  children: [
    {
      label: 'Full Overview',
      path: '/admin/dashboard',
      requirement: { module: 'LIVE_DASHBOARD', action: 'VIEW' },
    },
    {
      label: 'Live orders',
      path: '/admin/live-orders',
      requirement: { module: 'LIVE_DASHBOARD', action: 'VIEW' },
    },
    {
      label: 'Scheduled',
      path: '/admin/scheduled',
      requirement: { anyOf: ['LIVE_DASHBOARD', 'SCHEDULED_ORDERS'], action: 'VIEW' },
    },
    {
      label: 'Pickup',
      path: '/admin/pickup',
      requirement: { module: 'LIVE_DASHBOARD', action: 'VIEW' },
    },
    {
      label: 'Dine-in',
      path: '/admin/dine-in',
      requirement: { module: 'LIVE_DASHBOARD', action: 'VIEW' },
    },
    {
      label: 'Services',
      path: '/admin/services',
      requirement: { module: 'LIVE_DASHBOARD', action: 'VIEW' },
    },
  ],
}

/** Top-level sidebar entries (order preserved) */
export const ADMIN_TOP_LEVEL_NAV = [
  {
    label: 'Vendor Management',
    path: '/admin/vendors',
    iconId: 'ShoppingBag',
    requirement: { module: 'VENDOR_MANAGEMENT', action: 'VIEW' },
  },
  {
    label: 'Store Management',
    path: '/admin/stores',
    iconId: 'Store',
    requirement: { module: 'STORE_MANAGEMENT', action: 'VIEW' },
  },
  {
    label: 'Fleet Management',
    path: '/admin/fleet',
    iconId: 'Bike',
    requirement: { module: 'FLEET_MANAGEMENT', action: 'VIEW' },
  },
  {
    label: 'Customer Management',
    path: '/admin/customers',
    iconId: 'Users',
    requirement: { module: 'CUSTOMER_MANAGEMENT', action: 'VIEW' },
  },
  {
    label: 'Marketing',
    path: '/admin/marketing',
    iconId: 'Megaphone',
    requirement: { module: 'MARKETING', action: 'VIEW' },
  },
  {
    label: 'SLA Models',
    path: '/admin/sla-models',
    iconId: 'Clock3',
    requirement: { module: 'SLA_MODELS', action: 'VIEW' },
  },
  {
    label: 'Automation',
    path: '/admin/automation',
    iconId: 'Workflow',
    requirement: { module: 'SLA_MODELS', action: 'VIEW' },
  },
  {
    label: 'UI Editor',
    path: '/admin/ui-editor?tab=banners',
    iconId: 'PanelTop',
    requirement: { module: 'UI_EDITOR', action: 'VIEW' },
  },
  {
    label: 'Users',
    path: '/admin/users',
    iconId: 'ShieldCheck',
    requirement: { module: 'USERS_ROLES', action: 'VIEW' },
  },
  {
    label: 'Reports',
    path: '/admin/reports',
    iconId: 'BarChart3',
    requirement: { module: 'REPORTS', action: 'VIEW' },
  },
  {
    label: 'Settings',
    path: '/admin/settings',
    iconId: 'Settings',
    requirement: { module: 'SETTINGS', action: 'VIEW' },
  },
]

/**
 * Route prefix → RBAC requirement for guards (longest prefix wins in matcher).
 * Paths without an entry are denied unless listed in ADMIN_PUBLIC_ADMIN_PATHS.
 */
export const ADMIN_ROUTE_ACCESS = [
  { prefix: '/admin/account', requirement: null },
  { prefix: '/admin/dashboard', requirement: { module: 'LIVE_DASHBOARD', action: 'VIEW' } },
  { prefix: '/admin/live-orders', requirement: { module: 'LIVE_DASHBOARD', action: 'VIEW' } },
  { prefix: '/admin/scheduled', requirement: { anyOf: ['LIVE_DASHBOARD', 'SCHEDULED_ORDERS'], action: 'VIEW' } },
  { prefix: '/admin/pickup', requirement: { module: 'LIVE_DASHBOARD', action: 'VIEW' } },
  { prefix: '/admin/dine-in', requirement: { module: 'LIVE_DASHBOARD', action: 'VIEW' } },
  { prefix: '/admin/services', requirement: { module: 'LIVE_DASHBOARD', action: 'VIEW' } },
  { prefix: '/admin/vendors', requirement: { module: 'VENDOR_MANAGEMENT', action: 'VIEW' } },
  { prefix: '/admin/stores', requirement: { module: 'STORE_MANAGEMENT', action: 'VIEW' } },
  { prefix: '/admin/fleet', requirement: { module: 'FLEET_MANAGEMENT', action: 'VIEW' } },
  { prefix: '/admin/customers', requirement: { module: 'CUSTOMER_MANAGEMENT', action: 'VIEW' } },
  { prefix: '/admin/marketing', requirement: { module: 'MARKETING', action: 'VIEW' } },
  { prefix: '/admin/sla-models', requirement: { module: 'SLA_MODELS', action: 'VIEW' } },
  { prefix: '/admin/automation', requirement: { module: 'SLA_MODELS', action: 'VIEW' } },
  { prefix: '/admin/ui-editor', requirement: { module: 'UI_EDITOR', action: 'VIEW' } },
  { prefix: '/admin/users', requirement: { module: 'USERS_ROLES', action: 'VIEW' } },
  { prefix: '/admin/reports', requirement: { module: 'REPORTS', action: 'VIEW' } },
  { prefix: '/admin/settings', requirement: { module: 'SETTINGS', action: 'VIEW' } },
]

export const ADMIN_PUBLIC_ADMIN_PATHS = [ADMIN_ACCOUNT_PATH]

export const ADMIN_PAGE_TITLES = {
  '/admin/dashboard': 'Live Dashboard',
  '/admin/live-orders': 'Live Dashboard',
  '/admin/scheduled': 'Scheduled Orders',
  '/admin/pickup': 'Live Dashboard',
  '/admin/dine-in': 'Live Dashboard',
  '/admin/services': 'Live Dashboard',
  '/admin/vendors': 'Vendor Management',
  '/admin/vendors/new': 'Vendor Management',
  '/admin/stores': 'Store Management',
  '/admin/stores/new': 'Store Management',
  '/admin/stores/products': 'Store Management · Products',
  '/admin/fleet': 'Fleet Management · Champs',
  '/admin/fleet/new': 'Fleet Management · Champs',
  '/admin/fleet/notify': 'Fleet Management · Champs',
  '/admin/fleet/suppliers': 'Fleet Management · Suppliers',
  '/admin/fleet/suppliers/new': 'Fleet Management · Suppliers',
  '/admin/customers': 'Customer Management',
  '/admin/marketing': 'Marketing · Push',
  '/admin/marketing/notifications/customers': 'Marketing · Push',
  '/admin/marketing/notifications/vendors': 'Vendor Management',
  '/admin/marketing/promo-codes': 'Marketing · Promo codes',
  '/admin/marketing/promo-codes/new': 'Marketing · Create promo code',
  '/admin/marketing/promo-categories': 'Marketing · Promo categories',
  '/admin/marketing/geofence': 'Marketing · Geofence offers',
  '/admin/marketing/geofence/new': 'Marketing · New geofence offer',
  '/admin/marketing/cashback': 'Marketing · Cashback',
  '/admin/marketing/referral': 'Marketing · Referral',
  '/admin/marketing/vouchers': 'Marketing · Vouchers',
  '/admin/marketing/campaigns': 'Marketing · Campaigns',
  '/admin/marketing/banners': 'Marketing · Banners',
  '/admin/marketing/spin-wheel': 'Marketing · Spin Wheel',
  '/admin/marketing/vendor-promotions': 'Marketing · Vendor promotions',
  '/admin/sla-models': 'SLA Models · Vendor SLA',
  '/admin/sla-models/champ': 'SLA Models · Champ SLA',
  '/admin/sla-models/dispatcher': 'SLA Models · Dispatcher SLA',
  '/admin/sla-models/commercial': 'SLA Models · Delivery & fees',
  '/admin/automation': 'Automation · Dispatch Rules',
  '/admin/automation/dispatch-rules': 'Automation · Dispatch Rules',
  '/admin/automation/champ-scoring': 'Automation · Champ Scoring',
  '/admin/automation/stacking': 'Automation · Stacking',
  '/admin/automation/radius-expansion': 'Automation · Radius Expansion',
  '/admin/automation/vendor-status': 'Automation · Vendor Status',
  '/admin/automation/pay-on-delivery': 'Automation · Pay on Delivery',
  '/admin/automation/scheduled-tiers': 'Automation · Scheduled Tiers',
  '/admin/automation/champ-status': 'Automation · Champ Status',
  '/admin/automation/audit-log': 'Automation · Audit Log',
  '/admin/ui-editor': 'UI Editor',
  '/admin/users': 'Users & Roles · Users',
  '/admin/users/new': 'Users & Roles · Create user',
  '/admin/users/roles/new': 'Users & Roles · Create role',
  '/admin/users/roles': 'Users & Roles · Roles',
  '/admin/users/activity': 'Users & Roles · Activity log',
  '/admin/reports': 'Reports · Orders',
  '/admin/settings': 'Settings · General',
  '/admin/account': 'Account',
}

/**
 * @param {string} pathname
 * @returns {{ prefix: string, requirement: RouteRequirement|null }|null}
 */
export function resolveAdminRouteAccess(pathname) {
  const path = String(pathname || '').split('?')[0]
  if (ADMIN_PUBLIC_ADMIN_PATHS.some((p) => path === p || path.startsWith(`${p}/`))) {
    return { prefix: path, requirement: null }
  }
  const sorted = [...ADMIN_ROUTE_ACCESS].sort((a, b) => b.prefix.length - a.prefix.length)
  for (const entry of sorted) {
    if (path === entry.prefix || path.startsWith(`${entry.prefix}/`)) {
      return entry
    }
  }
  if (path === '/admin' || path === '/admin/') {
    return { prefix: '/admin', requirement: null }
  }
  return null
}

/**
 * First navigable path for post-login redirect (Phase 2).
 * @param {object|null|undefined} user
 */
export function firstAllowedAdminPath(user) {
  for (const child of ADMIN_LIVE_DASHBOARD_NAV.children) {
    if (adminUserMeetsRouteRequirement(user, child.requirement)) {
      return child.path
    }
  }
  for (const item of ADMIN_TOP_LEVEL_NAV) {
    if (adminUserMeetsRouteRequirement(user, item.requirement)) {
      return item.path
    }
  }
  return ADMIN_ACCOUNT_PATH
}

/**
 * Nav items visible for user (Phase 2 sidebar).
 * @param {object|null|undefined} user
 */
export function filterAdminNavForUser(user) {
  const dashboardChildren = ADMIN_LIVE_DASHBOARD_NAV.children.filter((child) =>
    adminUserMeetsRouteRequirement(user, child.requirement),
  )
  const topLevel = ADMIN_TOP_LEVEL_NAV.filter((item) =>
    adminUserMeetsRouteRequirement(user, item.requirement),
  )
  return {
    dashboard:
      dashboardChildren.length > 0
        ? { ...ADMIN_LIVE_DASHBOARD_NAV, children: dashboardChildren }
        : null,
    topLevel,
  }
}
