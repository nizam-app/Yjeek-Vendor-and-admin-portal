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
    password: typeof user.password === 'string' ? user.password : '',
    role: mapAdminStaffRoleFromApi(user.role),
    roleRaw: user.roleRaw || user.role || null,
    isOwner: Boolean(user.isOwner),
    branch: user.branchLabel || branchObj?.name || '—',
    branchId: branchObj?.id || null,
    lastActive: formatLastActive(user.lastActive),
    status: mapAdminStaffStatusFromApi(user.status),
    statusRaw: user.status ?? null,
    permissions: mapAdminStaffPermissionsFromApi(user.permissions),
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

const STATUS_TO_API = {
  Active: 'ACTIVE',
  Inactive: 'INACTIVE',
  Invited: 'INVITED',
  Suspended: 'SUSPENDED',
}

/**
 * UI permission toggles → API staffPermissionsSchema keys.
 */
export function mapAdminStaffPermissionsToApi(permissions) {
  if (!permissions || typeof permissions !== 'object') return undefined
  const mapped = {
    orders: Boolean(permissions.orders),
    catalog: Boolean(permissions.catalog),
    workingHours: Boolean(permissions.hours ?? permissions.workingHours),
    staff: Boolean(permissions.staff),
    deliverySettings: Boolean(permissions.delivery ?? permissions.deliverySettings),
    promotions: Boolean(permissions.promotions),
  }
  return mapped
}

/**
 * API permissions → UI toggle ids.
 */
export function mapAdminStaffPermissionsFromApi(permissions) {
  if (!permissions || typeof permissions !== 'object') {
    return { orders: false, catalog: false, hours: false, staff: false, delivery: false, promotions: false }
  }
  if (permissions.all === true) {
    return { orders: true, catalog: true, hours: true, staff: true, delivery: true, promotions: true }
  }
  return {
    orders: Boolean(permissions.orders),
    catalog: Boolean(permissions.catalog),
    hours: Boolean(permissions.hours ?? permissions.workingHours),
    staff: Boolean(permissions.staff),
    delivery: Boolean(permissions.delivery ?? permissions.deliverySettings),
    promotions: Boolean(permissions.promotions),
  }
}

function resolveBranchId(form = {}, branchOptions = []) {
  return (
    form.branchId ||
    branchOptions.find((b) => b.id && (b.name === form.branch || b.label === form.branch))?.id ||
    null
  )
}

/**
 * Map create-user form → POST create staff body.
 * Confirmed: displayName, email, phone, countryCode, password, role, vendorLocationId?,
 * status?, permissions?
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
  const branchId = resolveBranchId(form, branchOptions)

  if (needsBranch) {
    if (!branchId) {
      throw new ApiError({ message: 'Assigned branch is required for branch managers and staff.' })
    }
    body.vendorLocationId = branchId
  } else if (branchId) {
    body.vendorLocationId = branchId
  }

  const status = STATUS_TO_API[form.status] || String(form.status || '').toUpperCase()
  if (status === 'ACTIVE' || status === 'INACTIVE' || status === 'INVITED' || status === 'SUSPENDED') {
    body.status = status
  }

  const permissions = mapAdminStaffPermissionsToApi(form.permissions) ?? {
    orders: true,
    catalog: role === 'VENDOR_ADMIN',
    workingHours: role === 'VENDOR_ADMIN' || role === 'BRANCH_MANAGER',
    staff: role === 'VENDOR_ADMIN',
    deliverySettings: role === 'VENDOR_ADMIN',
    promotions: role === 'VENDOR_ADMIN',
  }
  body.permissions = permissions

  return body
}

/**
 * Map edit-user form → PATCH staff body (password optional).
 */
export function mapAdminUpdateStaffRequest(form = {}, branchOptions = []) {
  const body = {}

  const displayName = String(form.fullName || form.displayName || '').trim()
  if (displayName) body.displayName = displayName

  const email = String(form.email || '').trim()
  if (email) body.email = email

  if (form.phone != null && String(form.phone).trim()) {
    const { countryCode, phone } = mapAdminStaffPhoneParts(form.phone)
    if (phone) {
      body.phone = phone
      body.countryCode = countryCode
    }
  }

  const password = String(form.password || '')
  if (password) body.password = password

  const role = mapAdminStaffRoleToApi(form.role)
  if (role) body.role = role

  const branchId = resolveBranchId(form, branchOptions)
  if (branchId) body.vendorLocationId = branchId
  else if (form.branchId === '' || form.branchId === null) body.vendorLocationId = null

  const status = STATUS_TO_API[form.status] || String(form.status || '').toUpperCase()
  if (status === 'ACTIVE' || status === 'INACTIVE' || status === 'INVITED' || status === 'SUSPENDED') {
    body.status = status
  }

  if (form.permissions) {
    const permissions = mapAdminStaffPermissionsToApi(form.permissions)
    if (permissions) body.permissions = permissions
  }

  if (Object.keys(body).length === 0) {
    throw new ApiError({ message: 'No staff fields to update.' })
  }

  return body
}
