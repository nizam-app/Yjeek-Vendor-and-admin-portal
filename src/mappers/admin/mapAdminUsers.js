import { ApiError } from '../../api/errors'

const USER_COLUMNS = ['User', 'Role', 'Scope', 'Status', '2FA', 'Last active']

const VIEW_TABS = ['Users', 'Roles', 'Activity log']

const PERMISSION_ACTIONS = ['view', 'create', 'edit', 'delete', 'approve', 'export']

const ROLE_TONE_BY_SLUG = {
  'super-admin': 'purple',
  admin: 'blue',
  'country-manager': 'green',
  'operations-manager': 'orange',
  'operations-supervisor': 'gray',
  dispatcher: 'cyan',
  finance: 'gray',
  'marketing-manager': 'orange',
  'support-agent': 'gray',
}

function formatCount(value) {
  if (value === null || value === undefined || value === '') return '0'
  const numeric = Number(value)
  if (Number.isNaN(numeric)) return String(value)
  return numeric.toLocaleString()
}

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function roleTone(role) {
  const slug = String(role?.slug || '')
    .trim()
    .toLowerCase()
  if (slug && ROLE_TONE_BY_SLUG[slug]) return ROLE_TONE_BY_SLUG[slug]

  const name = String(role?.shortName || role?.name || '')
    .trim()
    .toLowerCase()
  if (name.includes('super')) return 'purple'
  if (name === 'admin') return 'blue'
  if (name.includes('country')) return 'green'
  if (name.includes('operations') || name.includes('ops')) return 'orange'
  if (name.includes('dispatch')) return 'cyan'
  return 'gray'
}

function statusLabel(user) {
  const label = String(user?.statusLabel || '').trim()
  if (label) return label
  const status = String(user?.status || '').trim().toUpperCase()
  if (status === 'ACTIVE') return 'Active'
  if (status === 'PENDING') return 'Pending'
  if (status === 'SUSPENDED') return 'Suspended'
  return status || '—'
}

function joinList(items, fallback = '—') {
  if (!Array.isArray(items) || !items.length) return fallback
  return items
    .map((item) => {
      if (item == null) return null
      if (typeof item === 'string') return item
      return item.name || item.label || item.code || item.id || null
    })
    .filter(Boolean)
    .join(', ') || fallback
}

/**
 * Map one user from GET /admin/users into the Users table row.
 */
export function mapAdminUserListItem(user) {
  if (!user || typeof user !== 'object') return null

  const id = String(user.id || '').trim()
  if (!id) return null

  const role = user.role && typeof user.role === 'object' ? user.role : {}
  const roleName = role.shortName || role.name || '—'

  return {
    id,
    name: user.displayName || user.fullName || 'Untitled',
    you: Boolean(user.isYou),
    email: user.email || user.username || '—',
    role: roleName,
    roleId: role.id ? String(role.id) : '',
    roleTone: roleTone(role),
    scope: user.scopeLabel || user.scopeLevel || '—',
    status: statusLabel(user),
    statusValue: String(user.status || '').toUpperCase() || '',
    twoFa: user.totpLabel || (user.totpEnabled ? 'On' : 'Off'),
    lastActive: user.lastActive || '—',
  }
}

function mapFilterRoles(roles) {
  const options = [{ value: '', label: 'All roles' }]
  for (const role of Array.isArray(roles) ? roles : []) {
    if (!role?.id) continue
    options.push({
      value: String(role.id),
      label: role.name || role.shortName || String(role.id),
    })
  }
  return options
}

function mapFilterCountries(countries) {
  const options = [{ value: '', label: 'All countries' }]
  for (const country of Array.isArray(countries) ? countries : []) {
    if (!country?.code && !country?.name) continue
    options.push({
      value: String(country.code || country.name),
      label: country.name || country.code,
    })
  }
  return options
}

function mapFilterStatuses(statuses) {
  const options = [{ value: '', label: 'All status' }]
  for (const status of Array.isArray(statuses) ? statuses : []) {
    if (!status?.value && !status?.label) continue
    options.push({
      value: String(status.value || status.label),
      label: status.label || status.value,
    })
  }
  return options
}

function mapSummaryStats(summary = {}) {
  return [
    { label: 'Total users', value: formatCount(summary.total), tone: 'ink' },
    { label: 'Active', value: formatCount(summary.active), tone: 'green' },
    { label: 'Roles', value: formatCount(summary.roles), tone: 'ink' },
    { label: 'Suspended', value: formatCount(summary.suspended), tone: 'red' },
  ]
}

/**
 * Map GET /admin/users/summary `data` → KPI cards.
 */
export function mapAdminUsersSummaryResponse(data) {
  const summary = data && typeof data === 'object' ? data : {}
  return { stats: mapSummaryStats(summary), summary }
}

/**
 * Map GET /admin/users `data` into AdminUsersPage Users-tab UI shape.
 *
 * Confirmed envelope includes summary, filters, users[], pagination.
 * Empty `users: []` is valid — do not invent rows.
 */
export function mapAdminUsersListResponse(data) {
  if (!data || typeof data !== 'object') {
    throw new ApiError({ message: 'Invalid users response from the server.' })
  }

  const summary = data.summary && typeof data.summary === 'object' ? data.summary : {}
  const filters = data.filters && typeof data.filters === 'object' ? data.filters : {}
  const users = Array.isArray(data.users) ? data.users : []

  return {
    title: 'Users',
    subtitle: 'Admin panel staff accounts',
    action: 'Create user',
    viewTabs: VIEW_TABS,
    columns: USER_COLUMNS,
    stats: mapSummaryStats({
      total: summary.total ?? data.total,
      active: summary.active,
      pending: summary.pending,
      suspended: summary.suspended,
      roles: summary.roles,
    }),
    filters: {
      roles: mapFilterRoles(filters.roles),
      countries: mapFilterCountries(filters.countries),
      statuses: mapFilterStatuses(filters.statuses),
    },
    rows: users.map(mapAdminUserListItem).filter(Boolean),
    page: Number(data.page) || 1,
    limit: Number(data.limit) || 20,
    total: Number(data.total ?? summary.total) || users.length,
    totalPages: Number(data.totalPages) || 1,
    // Roles / Activity tabs stay on mock until those APIs are wired.
    roles: null,
    activityLog: null,
  }
}

function formatScopeLevelLabel(scopeLevel) {
  const value = String(scopeLevel || '')
    .trim()
    .toUpperCase()
  if (value === 'GLOBAL') return 'Global'
  if (value === 'COUNTRY') return 'Country'
  if (value === 'ZONE') return 'Zone'
  return scopeLevel || '—'
}

function mapCountriesDisplay(data = {}) {
  const level = String(data.scopeLevel || '')
    .trim()
    .toUpperCase()
  if (level === 'GLOBAL') return data.scopeLabel || 'Global'
  if (data.scopeLabel && String(data.scopeLabel).trim()) return String(data.scopeLabel).trim()
  return joinList(data.countries)
}

function permissionsObjectToMatrixFlags(permissions = {}, moduleKey) {
  const actions = Array.isArray(permissions?.[moduleKey]) ? permissions[moduleKey] : []
  const upper = new Set(actions.map((action) => String(action).toUpperCase()))
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
 * Map API `permissionsMatrix[]` (preferred) or `permissions` map → UI checkbox rows.
 * Confirmed PATCH/GET detail includes both.
 */
function mapPermissionsMatrix(matrix, permissionsMap = {}) {
  if (Array.isArray(matrix) && matrix.length) {
    return matrix
      .map((row) => {
        if (!row || typeof row !== 'object') return null
        const moduleKey = String(row.module || row.key || '').trim()
        const fromMap = moduleKey ? permissionsObjectToMatrixFlags(permissionsMap, moduleKey) : null
        return {
          module: row.moduleLabel || row.label || moduleKey || '—',
          moduleKey,
          view: row.view != null ? Boolean(row.view) : Boolean(fromMap?.view),
          create: row.create != null ? Boolean(row.create) : Boolean(fromMap?.create),
          edit: row.edit != null ? Boolean(row.edit) : Boolean(fromMap?.edit),
          delete: row.delete != null ? Boolean(row.delete) : Boolean(fromMap?.delete),
          approve: row.approve != null ? Boolean(row.approve) : Boolean(fromMap?.approve),
          export: row.export != null ? Boolean(row.export) : Boolean(fromMap?.export),
        }
      })
      .filter(Boolean)
  }

  const keys = Object.keys(permissionsMap || {})
  if (!keys.length) return []

  return keys.map((moduleKey) => ({
    module: moduleKey
      .split('_')
      .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
      .join(' '),
    moduleKey,
    ...permissionsObjectToMatrixFlags(permissionsMap, moduleKey),
  }))
}

function mapRecentActivity(activity) {
  if (!Array.isArray(activity)) return []
  return activity
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null
      return {
        id: entry.id || null,
        time: entry.timeLabel || formatDate(entry.time) || '—',
        action: entry.action || '—',
        module: entry.module || '—',
        target: entry.targetOrIp || entry.target || entry.ip || '—',
      }
    })
    .filter(Boolean)
}

/**
 * Map GET/PATCH /admin/users/:id `data` into AdminUserDetailPage UI shape.
 * Confirmed response includes permissionsMatrix, permissions, recentActivity, roleInheritedFrom.
 */
export function mapAdminUserDetailResponse(data) {
  if (!data || typeof data !== 'object') {
    throw new ApiError({ message: 'Invalid user detail response from the server.' })
  }

  const id = String(data.id || '').trim()
  if (!id) {
    throw new ApiError({ message: 'User detail is missing an id.' })
  }

  const role = data.role && typeof data.role === 'object' ? data.role : {}
  const roleName = role.shortName || role.name || '—'
  const listRow = mapAdminUserListItem(data)
  const phoneParts = splitPhone(
    data.phoneDisplay || data.phone || '',
    data.countryCode || '+973',
  )
  const phoneDigits =
    String(data.phone || '').replace(/[^\d]/g, '') || phoneParts.phone || ''
  const countryCode =
    String(data.countryCode || '').trim() || phoneParts.countryCode || '+973'

  return {
    viewTabs: VIEW_TABS,
    permissionActions: PERMISSION_ACTIONS,
    row: listRow,
    detail: {
      id,
      profileId: data.profileId || '',
      initials: data.initials || '?',
      email: data.email || data.username || listRow.email,
      fullName: data.fullName || data.displayName || '—',
      fullNameValue: data.fullName || data.displayName || '',
      phone: data.phoneDisplay || data.phone || '—',
      phoneDisplay: data.phoneDisplay || '',
      phoneValue: phoneDigits,
      countryCode,
      jobTitle: data.jobTitle || '—',
      jobTitleValue: data.jobTitle || '',
      created: formatDate(data.createdAt || data.invitedAt),
      createdBy: data.createdByName || '—',
      roleFull: role.name || roleName,
      roleId: role.id ? String(role.id) : '',
      scopeLevel: formatScopeLevelLabel(data.scopeLevel),
      scopeLevelValue: String(data.scopeLevel || '').toUpperCase() || '',
      scopeLabel: data.scopeLabel || '',
      countries: mapCountriesDisplay(data),
      countriesValue: Array.isArray(data.countries) ? data.countries : [],
      zones: joinList(data.zones),
      zonesValue: Array.isArray(data.zones) ? data.zones : [],
      status: listRow.status,
      statusValue: listRow.statusValue,
      twoFa: listRow.twoFa,
      roleInheritedFrom:
        data.roleInheritedFrom || `Inherited from role — ${role.name || roleName}`,
      permissions: mapPermissionsMatrix(data.permissionsMatrix, data.permissions),
      activity: mapRecentActivity(data.recentActivity),
      raw: data,
    },
  }
}

function mapMetaModuleRow(item, key = '') {
  if (!item || typeof item !== 'object') return null
  if (item.module || item.moduleLabel || key) {
    const moduleKey = item.module || key
    return {
      module: moduleKey,
      moduleLabel: item.moduleLabel || item.label || moduleKey || '—',
      view: Boolean(item.view),
      create: Boolean(item.create),
      edit: Boolean(item.edit),
      delete: Boolean(item.delete),
      approve: Boolean(item.approve),
      export: Boolean(item.export),
    }
  }
  return null
}

/**
 * Map GET /admin/users/meta — create-user wizard helpers.
 * Confirmed screenshot: module permission templates (array or module-keyed object).
 */
export function mapAdminUsersMetaResponse(data) {
  const raw = data && typeof data === 'object' ? data : {}
  let modules = []

  if (Array.isArray(raw)) {
    modules = raw.map((item) => mapMetaModuleRow(item)).filter(Boolean)
  } else if (Array.isArray(raw.modules)) {
    modules = raw.modules.map((item) => mapMetaModuleRow(item)).filter(Boolean)
  } else if (Array.isArray(raw.permissionsMatrix)) {
    modules = raw.permissionsMatrix.map((item) => mapMetaModuleRow(item)).filter(Boolean)
  } else {
    const skip = new Set(['roles', 'countries', 'zones', 'suggestedTemporaryPassword', 'permissions'])
    modules = Object.entries(raw)
      .filter(([key, value]) => !skip.has(key) && value && typeof value === 'object' && !Array.isArray(value))
      .map(([key, value]) => mapMetaModuleRow(value, key))
      .filter(Boolean)
  }

  const roles = (Array.isArray(raw.roles) ? raw.roles : [])
    .map((role) => {
      if (!role || typeof role !== 'object') return null
      const id = String(role.id || '').trim()
      if (!id) return null
      return {
        id,
        name: role.name || role.shortName || id,
        slug: role.slug || '',
        scopeLevel: String(role.scopeLevel || '').toUpperCase(),
        description: role.description || '',
        permissions:
          role.permissions && typeof role.permissions === 'object' && !Array.isArray(role.permissions)
            ? role.permissions
            : {},
        permissionsMatrix: Array.isArray(role.permissionsMatrix) ? role.permissionsMatrix : [],
      }
    })
    .filter(Boolean)

  // Meta often omits top-level modules; derive labels from role permission matrices.
  if (!modules.length) {
    const sample = roles.find((role) => role.permissionsMatrix?.length)?.permissionsMatrix
    if (Array.isArray(sample) && sample.length) {
      modules = sample.map((item) => mapMetaModuleRow(item)).filter(Boolean)
    }
  }

  const countries = (Array.isArray(raw.countries) ? raw.countries : []).map((item) => {
    if (typeof item === 'string') return { code: item, name: item }
    return {
      code: String(item.code || item.value || ''),
      name: String(item.name || item.label || item.code || ''),
    }
  }).filter((item) => item.code)

  const zones = (Array.isArray(raw.zones) ? raw.zones : []).map((item) => {
    if (typeof item === 'string') return { id: item, name: item }
    return {
      id: String(item.id || item.code || item.name || ''),
      name: String(item.name || item.label || item.id || ''),
    }
  }).filter((item) => item.id || item.name)

  return {
    roles,
    countries,
    zones,
    scopeLevels: Array.isArray(raw.scopeLevels) ? raw.scopeLevels : [],
    suggestedTemporaryPassword: raw.suggestedTemporaryPassword || '',
    modules,
    raw,
  }
}

const COUNTRY_NAME_TO_CODE = {
  bahrain: 'BH',
  'saudi arabia': 'SA',
  uae: 'AE',
  'united arab emirates': 'AE',
  kuwait: 'KW',
  qatar: 'QA',
  oman: 'OM',
}

function normalizeCountryCode(value) {
  const raw = String(value || '').trim()
  if (!raw) return ''
  if (/^[A-Z]{2}$/i.test(raw)) return raw.toUpperCase()
  return COUNTRY_NAME_TO_CODE[raw.toLowerCase()] || raw
}

function splitPhone(phoneRaw, fallbackCountryCode = '+973') {
  const raw = String(phoneRaw || '').trim()
  const match = raw.match(/^(\+\d{1,4})\s*(.*)$/)
  if (match) {
    return {
      countryCode: match[1],
      phone: match[2].replace(/[^\d]/g, '') || raw.replace(/[^\d]/g, ''),
    }
  }
  return {
    countryCode: String(fallbackCountryCode || '+973').trim() || '+973',
    phone: raw.replace(/[^\d]/g, '') || raw,
  }
}

function mapScopeLevel(value) {
  const raw = String(value || '').trim().toUpperCase()
  if (raw.startsWith('GLOBAL') || raw.includes('ALL COUNTRIES')) return 'GLOBAL'
  if (raw.startsWith('ZONE')) return 'ZONE'
  if (raw.startsWith('COUNTRY')) return 'COUNTRY'
  if (raw === 'GLOBAL' || raw === 'COUNTRY' || raw === 'ZONE') return raw
  return 'COUNTRY'
}

/**
 * Map Create user wizard → POST /admin/users body.
 *
 * Admin sets the password directly; account is Active and can log in immediately.
 * Confirmed:
 *   fullName, email, username, phone, countryCode, jobTitle, roleId,
 *   scopeLevel, countries[], zones[], permissionOverrides, temporaryPassword
 */
export function mapAdminCreateUserRequest(input = {}) {
  const {
    fullName,
    email,
    username,
    phone,
    countryCode,
    jobTitle,
    roleId,
    scopeLevel,
    countries = [],
    zones = [],
    permissionOverrides = {},
    temporaryPassword = '',
    password = '',
  } = input

  const name = String(fullName || '').trim()
  const mail = String(email || '').trim()
  const role = String(roleId || '').trim()
  const pwd = String(temporaryPassword || password || '').trim()
  if (!name) throw new ApiError({ message: 'Full name is required.' })
  if (!mail) throw new ApiError({ message: 'Email is required.' })
  if (!role) throw new ApiError({ message: 'Role is required.' })
  if (!pwd) throw new ApiError({ message: 'Password is required.' })

  const phoneParts = splitPhone(phone, countryCode)
  const scope = mapScopeLevel(scopeLevel)

  const body = {
    fullName: name,
    email: mail,
    username: String(username || mail).trim() || mail,
    phone: phoneParts.phone,
    countryCode: phoneParts.countryCode,
    jobTitle: String(jobTitle || '').trim() || undefined,
    roleId: role,
    scopeLevel: scope,
    countries:
      scope === 'GLOBAL'
        ? []
        : (Array.isArray(countries) ? countries : [])
            .map(normalizeCountryCode)
            .filter(Boolean),
    zones:
      scope === 'GLOBAL'
        ? []
        : (Array.isArray(zones) ? zones : [])
            .map((z) => String(z?.id || z?.name || z || '').trim())
            .filter(Boolean),
    permissionOverrides:
      permissionOverrides && typeof permissionOverrides === 'object' ? permissionOverrides : {},
    temporaryPassword: pwd,
    sendInvite: false,
  }

  if (body.jobTitle === undefined) delete body.jobTitle

  return body
}

/**
 * Map Edit user form → PATCH /admin/users/:id body.
 * Confirmed Postman sample: `{ "jobTitle": "Operations Manager" }`
 * Also sends role/scope/permissionOverrides when provided by the edit form.
 */
export function mapAdminUpdateUserRequest(form = {}) {
  const body = {}

  const jobTitle = String(form.jobTitle ?? '').trim()
  if (form.jobTitle != null) body.jobTitle = jobTitle

  const fullName = String(form.fullName ?? '').trim()
  if (form.fullName != null && fullName) body.fullName = fullName

  const phoneRaw = form.phone
  if (phoneRaw != null && String(phoneRaw).trim()) {
    const parts = splitPhone(phoneRaw, form.countryCode)
    body.phone = parts.phone
    body.countryCode = parts.countryCode
  }

  if (form.roleId != null && String(form.roleId).trim()) {
    body.roleId = String(form.roleId).trim()
  }

  if (form.scopeLevel != null && String(form.scopeLevel).trim()) {
    body.scopeLevel = mapScopeLevel(form.scopeLevel)
  }

  if (Array.isArray(form.countries)) {
    body.countries =
      body.scopeLevel === 'GLOBAL'
        ? []
        : form.countries.map(normalizeCountryCode).filter(Boolean)
  }

  if (Array.isArray(form.zones)) {
    body.zones =
      body.scopeLevel === 'GLOBAL' || body.scopeLevel === 'COUNTRY'
        ? []
        : form.zones.map((z) => String(z?.id || z?.name || z || '').trim()).filter(Boolean)
  }

  if (form.permissionOverrides != null && typeof form.permissionOverrides === 'object') {
    body.permissionOverrides = form.permissionOverrides
  }

  if (!Object.keys(body).length) {
    throw new ApiError({ message: 'Nothing to update.' })
  }

  return body
}

/**
 * Checkbox flags → API permissionOverrides map (`MODULE: ["VIEW", …]`).
 */
export function mapPermissionFlagsToOverrides(flags = {}) {
  const overrides = {}
  for (const [moduleKey, row] of Object.entries(flags || {})) {
    if (!moduleKey || !row || typeof row !== 'object') continue
    const actions = PERMISSION_ACTIONS.filter((action) => Boolean(row[action])).map((action) =>
      action.toUpperCase(),
    )
    if (actions.length) overrides[moduleKey] = actions
  }
  return overrides
}
