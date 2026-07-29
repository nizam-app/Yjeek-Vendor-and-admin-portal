import { ApiError } from '../../api/errors'

const ROLE_TO_API = {
  'Vendor admin': 'VENDOR_ADMIN',
  'Branch manager': 'BRANCH_MANAGER',
  Staff: 'STAFF',
}

const ROLE_FROM_API = {
  VENDOR_ADMIN: 'Vendor admin',
  BRANCH_MANAGER: 'Branch manager',
  STAFF: 'Staff',
  GROUP_ADMIN: 'Vendor admin',
  OPERATOR: 'Staff',
}

const STATUS_FROM_API = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  INVITED: 'Invited',
  SUSPENDED: 'Suspended',
}

export function mapAdminStaffRoleToApi(roleLabel) {
  return ROLE_TO_API[roleLabel] || null
}

export function mapAdminStaffRoleFromApi(role) {
  const key = String(role || '').trim().toUpperCase()
  return ROLE_FROM_API[key] || role || '—'
}

export function mapAdminStaffStatusFromApi(status) {
  const key = String(status || '').trim().toUpperCase()
  return STATUS_FROM_API[key] || status || '—'
}

/**
 * Split UI phone into API { countryCode, phone }.
 * Accepts "+973 33008888" or "33008888".
 */
export function mapAdminStaffPhoneParts(phoneInput, fallbackCountryCode = '+973') {
  const raw = String(phoneInput || '').trim()
  const match = raw.match(/^(\+\d{1,4})\s*(.*)$/)
  if (match) {
    return {
      countryCode: match[1],
      phone: String(match[2] || '').replace(/\D/g, ''),
    }
  }
  return {
    countryCode: fallbackCountryCode,
    phone: raw.replace(/\D/g, ''),
  }
}

function formatLastActive(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)

  const diffMs = Date.now() - date.getTime()
  if (diffMs < 0) return date.toLocaleString()

  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`

  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`

  return date.toLocaleDateString()
}

/**
 * Map one staff user from GET/POST staff list into Users & staff table row.
 */
export function mapAdminVendorStaffListItem(user) {
  if (!user || typeof user !== 'object') return null
  const id = String(user.id || '').trim()
  if (!id) return null

  const branchObj = user.branch && typeof user.branch === 'object' ? user.branch : null

  return {
    id,
    userId: user.userId ?? null,
    name: user.displayName || 'Untitled',
    email: user.email || '—',
    phone: user.phone || '',
    role: mapAdminStaffRoleFromApi(user.role),
    roleRaw: user.roleRaw || user.role || null,
    isOwner: Boolean(user.isOwner),
    branch: user.branchLabel || branchObj?.name || '—',
    branchId: branchObj?.id || null,
    lastActive: formatLastActive(user.lastActive),
    status: mapAdminStaffStatusFromApi(user.status),
    statusRaw: user.status ?? null,
    permissions: user.permissions && typeof user.permissions === 'object' ? user.permissions : {},
  }
}

/**
 * Map GET/POST /admin/vendors/:id/staff `data` → { count, users }.
 */
export function mapAdminVendorStaffResponse(data) {
  if (!data || typeof data !== 'object') {
    throw new ApiError({ message: 'Invalid vendor staff response from the server.' })
  }

  const raw = Array.isArray(data.users) ? data.users : Array.isArray(data) ? data : []
  const users = raw.map(mapAdminVendorStaffListItem).filter(Boolean)

  return {
    count: Number(data.count) || users.length,
    users,
  }
}

/**
 * Map create-user form → POST create staff body.
 * Confirmed: displayName, email, phone, countryCode, password, role, vendorLocationId?
 * Skips Status + Permissions UI (not in create API).
 */
export function mapAdminCreateStaffRequest(form = {}, branchOptions = []) {
  const displayName = String(form.fullName || form.displayName || '').trim()
  if (!displayName) {
    throw new ApiError({ message: 'Full name is required.' })
  }

  const email = String(form.email || '').trim()
  if (!email) {
    throw new ApiError({ message: 'Email is required.' })
  }

  const password = String(form.password || '')
  if (!password) {
    throw new ApiError({ message: 'Password is required.' })
  }

  const role = mapAdminStaffRoleToApi(form.role)
  if (!role) {
    throw new ApiError({ message: 'Select a valid role.' })
  }

  const { countryCode, phone } = mapAdminStaffPhoneParts(form.phone)
  if (!phone) {
    throw new ApiError({ message: 'Phone is required.' })
  }

  const body = {
    displayName,
    email,
    phone,
    countryCode,
    password,
    role,
  }

  const needsBranch = role === 'BRANCH_MANAGER' || role === 'STAFF'
  const branchId =
    form.branchId ||
    branchOptions.find((b) => b.id && (b.name === form.branch || b.label === form.branch))?.id ||
    null

  if (needsBranch) {
    if (!branchId) {
      throw new ApiError({ message: 'Assigned branch is required for branch managers and staff.' })
    }
    body.vendorLocationId = branchId
  } else if (branchId) {
    body.vendorLocationId = branchId
  }

  return body
}
