/**
 * Admin RBAC module + action keys — keep in sync with
 * yjeek_backend/src/modules/admin-panel/shared/permissions.ts
 */

export const ADMIN_MODULES = [
  'LIVE_DASHBOARD',
  'SCHEDULED_ORDERS',
  'VENDOR_MANAGEMENT',
  'STORE_MANAGEMENT',
  'FLEET_MANAGEMENT',
  'CUSTOMER_MANAGEMENT',
  'MARKETING',
  'SLA_MODELS',
  'UI_EDITOR',
  'USERS_ROLES',
  'REPORTS',
  'SETTINGS',
]

export const ADMIN_ACTIONS = ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'APPROVE', 'EXPORT']

export const ADMIN_MODULE_LABELS = {
  LIVE_DASHBOARD: 'Live Dashboard',
  SCHEDULED_ORDERS: 'Scheduled Orders',
  VENDOR_MANAGEMENT: 'Vendor Management',
  STORE_MANAGEMENT: 'Store Management',
  FLEET_MANAGEMENT: 'Fleet Management',
  CUSTOMER_MANAGEMENT: 'Customer Management',
  MARKETING: 'Marketing',
  SLA_MODELS: 'SLA Models',
  UI_EDITOR: 'UI Editor',
  USERS_ROLES: 'Users & Roles',
  REPORTS: 'Reports',
  SETTINGS: 'Settings',
}
