/**
 * Map confirmed Vendor staff list API into Staff table UI shape.
 *
 * Confirmed: GET /vendor-panel/staff
 * data: { count, items: [ staff ] }
 *
 * Item fields:
 *   id, displayName, email, phone, phoneRaw, countryCode, role, status,
 *   branch { id, name, area }, userId, createdAt, updatedAt
 */

function isUiShapedStaff(item) {
  return (
    item &&
    typeof item === 'object' &&
    typeof item.name === 'string' &&
    typeof item.status === 'string' &&
    ['Active', 'Inactive'].includes(item.status)
  )
}

function formatStatus(status) {
  const upper = String(status || '')
    .trim()
    .toUpperCase()
  if (upper === 'ACTIVE') return 'Active'
  if (upper === 'INACTIVE' || upper === 'DISABLED' || upper === 'SUSPENDED') return 'Inactive'
  if (status === 'Active' || status === 'Inactive') return status
  return status ? String(status) : 'Inactive'
}

function formatRole(role) {
  if (!role) return ''
  return String(role)
    .trim()
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function branchLabel(branch) {
  if (!branch) return '—'
  if (typeof branch === 'string') return branch
  // UI shows short area name when available (Manama, Adliya), else full name
  if (branch.area) return branch.area
  if (branch.name) {
    return String(branch.name)
      .replace(/^Green Kitchen\s*[—–-]\s*/i, '')
      .trim()
  }
  return '—'
}

/**
 * Map one staff API item into Staff table row shape.
 */
export function mapVendorStaffMember(item) {
  if (!item || typeof item !== 'object') return null

  if (isUiShapedStaff(item)) {
    return {
      ...item,
      id: item.id || item.email,
      name: item.name,
      email: item.email,
      phone: item.phone,
      branch: item.branch,
      status: item.status,
      role: item.role || null,
    }
  }

  return {
    id: item.id,
    name: item.displayName || item.name || '—',
    email: item.email || '—',
    phone: item.phone || '—',
    phoneRaw: item.phoneRaw || null,
    countryCode: item.countryCode || null,
    branch: branchLabel(item.branch),
    branchId: item.branch?.id || null,
    branchName: item.branch?.name || null,
    branchArea: item.branch?.area || null,
    role: formatRole(item.role),
    roleRaw: item.role || null,
    status: formatStatus(item.status),
    userId: item.userId || null,
    createdAt: item.createdAt || null,
    updatedAt: item.updatedAt || null,
  }
}

/**
 * Map GET /vendor-panel/staff `data` into a staff list.
 */
export function mapVendorStaffResponse(data) {
  const rawItems = Array.isArray(data)
    ? data
    : Array.isArray(data?.items)
      ? data.items
      : Array.isArray(data?.staff)
        ? data.staff
        : []

  return {
    count: Number(data?.count) || rawItems.length,
    items: rawItems.map(mapVendorStaffMember).filter(Boolean),
  }
}
