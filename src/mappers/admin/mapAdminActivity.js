import { ApiError } from '../../api/errors'

const ACTIVITY_COLUMNS = ['Time', 'User', 'Action', 'Module', 'Type', 'IP']

const VIEW_TABS = ['Users', 'Roles', 'Activity log']

function titleCaseAction(value) {
  const raw = String(value || '').trim()
  if (!raw) return '—'
  if (raw === raw.toUpperCase() && raw.length > 1) {
    return raw.charAt(0) + raw.slice(1).toLowerCase()
  }
  return raw
}

function formatActivityTime(entry) {
  if (!entry || typeof entry !== 'object') return '—'
  if (entry.timeLabel) return String(entry.timeLabel)
  if (entry.timeDisplay) return String(entry.timeDisplay)

  const raw = entry.time || entry.createdAt || entry.timestamp || ''
  if (!raw) return '—'
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return String(raw)
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

/**
 * Map one activity log item.
 *
 * Gap: Postman list response confirmed only with `items: []` — no sample row body.
 * Field mapping inferred from:
 *   - user detail `recentActivity` (`timeLabel`, `action`, `module`, `actionType`, `ip`, `target`)
 *   - export CSV headers: Time, User, Action, Module, Type, Target, IP
 * UI table has no Target column (CSV does).
 */
export function mapAdminActivityItem(entry) {
  if (!entry || typeof entry !== 'object') return null

  const actor =
    entry.user && typeof entry.user === 'object'
      ? entry.user
      : entry.actor && typeof entry.actor === 'object'
        ? entry.actor
        : null

  const userName =
    entry.userName ||
    entry.actorName ||
    actor?.name ||
    (typeof entry.user === 'string' ? entry.user : '') ||
    '—'

  const roleName =
    entry.userRole ||
    entry.role ||
    entry.actorRole ||
    actor?.role ||
    ''

  const typeRaw = entry.actionType || entry.type || ''
  const type = titleCaseAction(typeRaw)

  return {
    id: entry.id || `${userName}-${entry.time || entry.createdAt || Math.random()}`,
    time: formatActivityTime(entry),
    user: userName,
    role: roleName || '—',
    action: entry.action || entry.message || '—',
    module: entry.module || entry.moduleLabel || '—',
    type,
    typeValue: String(typeRaw || type).toUpperCase(),
    target: entry.targetOrIp || entry.target || '—',
    ip: entry.ip || '—',
  }
}

/**
 * Map GET /admin/activity/meta → filter dropdown options.
 * Confirmed: users[{id,name,role}], modules[string], actionTypes[string]
 */
export function mapAdminActivityMetaResponse(data) {
  const raw = data && typeof data === 'object' ? data : {}

  const users = [
    { value: '', label: 'All users' },
    ...(Array.isArray(raw.users) ? raw.users : [])
      .map((user) => {
        if (!user || typeof user !== 'object') return null
        const id = String(user.id || '').trim()
        if (!id) return null
        return {
          value: id,
          label: user.name || id,
          role: user.role || '',
        }
      })
      .filter(Boolean),
  ]

  const modules = [
    { value: '', label: 'All modules' },
    ...(Array.isArray(raw.modules) ? raw.modules : [])
      .map((module) => {
        const value = String(module || '').trim()
        if (!value) return null
        return { value, label: value }
      })
      .filter(Boolean),
  ]

  const actions = [
    { value: '', label: 'All actions' },
    ...(Array.isArray(raw.actionTypes) ? raw.actionTypes : [])
      .map((action) => {
        const value = String(action || '').trim()
        if (!value) return null
        return { value, label: titleCaseAction(value) }
      })
      .filter(Boolean),
  ]

  return { users, modules, actions, raw }
}

/**
 * Map GET /admin/activity list `data` + meta filters → Activity log UI shape.
 * Confirmed envelope: total, page, limit, totalPages, hasNext, hasPrevious, items[]
 * Empty `items: []` is valid.
 */
export function mapAdminActivityListResponse(data, metaFilters = null) {
  if (!data || typeof data !== 'object') {
    throw new ApiError({ message: 'Invalid activity log response from the server.' })
  }

  const items = Array.isArray(data.items) ? data.items : []
  const rows = items.map(mapAdminActivityItem).filter(Boolean)

  const filters = metaFilters || {
    users: [{ value: '', label: 'All users' }],
    modules: [{ value: '', label: 'All modules' }],
    actions: [{ value: '', label: 'All actions' }],
  }

  return {
    title: 'Activity log',
    subtitle: 'Audit trail of all admin actions.',
    action: 'Export',
    viewTabs: VIEW_TABS,
    activityLog: {
      title: 'Activity log',
      subtitle: 'Audit trail of all admin actions.',
      action: 'Export',
      filters: {
        users: filters.users,
        modules: filters.modules,
        actions: filters.actions,
      },
      columns: ACTIVITY_COLUMNS,
      rows,
      pagination: {
        total: Number(data.total) || 0,
        page: Number(data.page) || 1,
        limit: Number(data.limit) || 50,
        totalPages: Number(data.totalPages) || 0,
        hasNext: Boolean(data.hasNext),
        hasPrevious: Boolean(data.hasPrevious),
      },
    },
  }
}

/**
 * Build query for GET /admin/activity.
 * Confirmed Postman: search, module, actionType, from, to, page, limit
 *
 * Gap: user filter — Postman sample has no userId; UI sends `userId` when selected
 * (ids from /activity/meta). Backend may ignore until confirmed.
 */
export function mapAdminActivityListParams(filters = {}) {
  const params = {
    page: Number(filters.page) || 1,
    limit: Number(filters.limit) || 50,
  }

  const search = String(filters.search || '').trim()
  if (search) params.search = search

  const module = String(filters.module || '').trim()
  if (module) params.module = module

  const actionType = String(filters.actionType || filters.action || '').trim()
  if (actionType) params.actionType = actionType

  const from = String(filters.from || '').trim()
  if (from) params.from = from

  const to = String(filters.to || '').trim()
  if (to) params.to = to

  const userId = String(filters.userId || filters.user || '').trim()
  if (userId) params.userId = userId

  return params
}
