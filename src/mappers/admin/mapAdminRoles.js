import { ApiError } from '../../api/errors'

const ROLE_COLUMNS = ['Role', 'Scope level', 'Users', 'Type', 'Permissions']

const VIEW_TABS = ['Users', 'Roles', 'Activity log']

const ACTION_KEYS = ['view', 'create', 'edit', 'delete', 'approve', 'export']

function formatCount(value) {
  if (value === null || value === undefined || value === '') return '0'
  const numeric = Number(value)
  if (Number.isNaN(numeric)) return String(value)
  return numeric.toLocaleString()
}

function typeTone(type) {
  const normalized = String(type || '').trim().toLowerCase()
  if (normalized === 'system') return 'purple'
  if (normalized === 'active' || normalized === 'custom') return 'green'
  return 'gray'
}

/**
 * Map one role from GET /admin/roles into the Roles table row.
 */
export function mapAdminRoleListItem(role) {
  if (!role || typeof role !== 'object') return null
  const id = String(role.id || '').trim()
  if (!id) return null

  const type = role.type || (role.isSystem ? 'System' : 'Active')

  return {
    id,
    name: role.name || 'Untitled',
    description: role.description || '—',
    scopeLevel: role.scopeLevelLabel || role.scopeLevel || '—',
    scopeLevelValue: role.scopeLevel || '',
    users: formatCount(role.users),
    type,
    typeTone: typeTone(type),
    permissions: role.permissionsSummary || '—',
    isSystem: Boolean(role.isSystem),
    slug: role.slug || '',
  }
}

/**
 * Map GET /admin/roles `data` into AdminUsersPage Roles-tab UI shape.
 * Empty `roles: []` is valid — do not invent rows.
 */
export function mapAdminRolesListResponse(data) {
  if (!data || typeof data !== 'object') {
    throw new ApiError({ message: 'Invalid roles response from the server.' })
  }

  const roles = Array.isArray(data.roles) ? data.roles : []
  const rows = roles.map(mapAdminRoleListItem).filter(Boolean)

  const rolesSection = {
    title: 'Roles',
    subtitle: 'Permission sets for admin staff',
    action: 'Create role',
    columns: ROLE_COLUMNS,
    rows,
    count: Number(data.count) || rows.length,
  }

  return {
    title: rolesSection.title,
    subtitle: rolesSection.subtitle,
    action: rolesSection.action,
    viewTabs: VIEW_TABS,
    roles: rolesSection,
    activityLog: null,
  }
}

function permissionsObjectToMatrixFlags(permissions = {}, moduleKey) {
  const actions = Array.isArray(permissions?.[moduleKey]) ? permissions[moduleKey] : []
  const upper = new Set(actions.map((a) => String(a).toUpperCase()))
  return {
    view: upper.has('VIEW'),
    create: upper.has('CREATE'),
    edit: upper.has('EDIT'),
    delete: upper.has('DELETE'),
    approve: upper.has('APPROVE'),
    export: upper.has('EXPORT'),
  }
}

/**
 * Map GET /admin/roles/meta for Create role wizard.
 */
export function mapAdminRolesMetaResponse(data) {
  const raw = data && typeof data === 'object' ? data : {}

  const modules = (Array.isArray(raw.modules) ? raw.modules : [])
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const key = String(item.key || item.module || '').trim()
      if (!key) return null
      return {
        key,
        id: key,
        label: item.label || item.moduleLabel || key,
      }
    })
    .filter(Boolean)

  const actions = (Array.isArray(raw.actions) ? raw.actions : ACTION_KEYS.map((a) => a.toUpperCase()))
    .map((action) => String(action).toUpperCase())
    .filter(Boolean)

  const actionKeys = actions.map((action) => action.toLowerCase())

  const scopeLevels = (Array.isArray(raw.scopeLevels) ? raw.scopeLevels : []).map((item) => ({
    value: String(item.value || item),
    label: item.label || String(item.value || item),
  }))

  const templates = (Array.isArray(raw.templates) ? raw.templates : [])
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const id = String(item.id || '').trim()
      if (!id && !item.name) return null
      return {
        id: id || item.slug || item.name,
        name: item.name || 'Template',
        slug: item.slug || '',
        description: item.description || '',
        scopeLevel: item.scopeLevel || 'GLOBAL',
        permissions: item.permissions && typeof item.permissions === 'object' ? item.permissions : {},
      }
    })
    .filter(Boolean)

  const emptyPermissions = () =>
    modules.reduce((acc, module) => {
      acc[module.key] = actionKeys.reduce((row, action) => {
        row[action] = false
        return row
      }, {})
      return acc
    }, {})

  const permissionsFromTemplate = (template) => {
    const base = emptyPermissions()
    if (!template?.permissions) return base
    for (const module of modules) {
      base[module.key] = {
        ...base[module.key],
        ...permissionsObjectToMatrixFlags(template.permissions, module.key),
      }
    }
    return base
  }

  return {
    modules,
    actions,
    actionKeys,
    scopeLevels,
    templates,
    emptyPermissions,
    permissionsFromTemplate,
    raw,
  }
}

/**
 * Map GET /admin/roles/:roleId — single role (or tolerate list-shaped payload).
 */
export function mapAdminRoleDetailResponse(data, roleId = '') {
  if (!data || typeof data !== 'object') {
    throw new ApiError({ message: 'Invalid role detail response from the server.' })
  }

  let role = data
  if (Array.isArray(data.roles)) {
    role =
      data.roles.find((item) => String(item.id) === String(roleId)) || data.roles[0] || null
  }

  if (!role || !role.id) {
    throw new ApiError({ message: 'Role not found.' })
  }

  return {
    ...mapAdminRoleListItem(role),
    permissions: role.permissions || {},
    permissionsMatrix: Array.isArray(role.permissionsMatrix) ? role.permissionsMatrix : [],
    permissionsSummary: role.permissionsSummary || '—',
    basedOnRoleId: role.basedOnRoleId ?? null,
    isActive: role.isActive !== false,
    raw: role,
  }
}

/**
 * Checkbox matrix → API permissions map.
 * Only modules with ≥1 granted action are included (Postman create-role shape).
 *
 * @param {Record<string, Record<string, boolean>>} permissionsMatrix
 * @param {Array<{ key?: string, id?: string }>} [modules]
 */
export function mapPermissionsMatrixToApi(permissionsMatrix = {}, modules = []) {
  const keys =
    Array.isArray(modules) && modules.length
      ? modules.map((m) => m.key || m.id).filter(Boolean)
      : Object.keys(permissionsMatrix || {})

  const permissions = {}
  for (const key of keys) {
    const row = permissionsMatrix?.[key] || {}
    const actions = ACTION_KEYS.filter((action) => Boolean(row[action])).map((action) =>
      action.toUpperCase(),
    )
    if (actions.length) permissions[key] = actions
  }
  return permissions
}

/**
 * Map Create role form → POST /admin/roles body.
 *
 * Confirmed Postman:
 *   { name, description, basedOnRoleId?, scopeLevel, permissions }
 */
export function mapAdminCreateRoleRequest(input = {}) {
  const {
    name,
    description = '',
    scopeLevel = 'COUNTRY',
    templateId = '',
    basedOnRoleId = '',
    permissionsMatrix = {},
    modules = [],
  } = input

  const trimmedName = String(name || '').trim()
  if (!trimmedName) {
    throw new ApiError({ message: 'Role name is required.' })
  }

  const permissions = mapPermissionsMatrixToApi(permissionsMatrix, modules)
  if (!Object.keys(permissions).length) {
    throw new ApiError({ message: 'Select at least one permission before creating the role.' })
  }

  const body = {
    name: trimmedName,
    description: String(description || '').trim() || undefined,
    scopeLevel: String(scopeLevel || 'COUNTRY').trim().toUpperCase() || 'COUNTRY',
    permissions,
  }

  const baseId = String(basedOnRoleId || templateId || '').trim()
  if (baseId && baseId !== '__scratch__' && !baseId.startsWith('Start from')) {
    body.basedOnRoleId = baseId
  }

  if (body.description === undefined) delete body.description

  return body
}
