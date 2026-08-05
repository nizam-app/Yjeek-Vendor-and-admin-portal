import { ApiError } from '../../api/errors'

const VENDOR_COLUMNS = [
  'Vendor',
  'Vendor ID',
  'Category',
  'Orders',
  'Branches',
  'Users',
  'Rating',
  'Status',
]

const VENDOR_TABS = ['All', 'Active', 'Pending', 'Suspended']

function formatCount(value) {
  if (value === null || value === undefined || value === '') return '0'
  const numeric = Number(value)
  if (Number.isNaN(numeric)) return String(value)
  return numeric.toLocaleString()
}

function formatRating(value) {
  if (value === null || value === undefined || value === '') return '—'
  const numeric = Number(value)
  if (Number.isNaN(numeric)) return String(value)
  return numeric.toFixed(1)
}

/**
 * Map UI status tab → API `status` query value.
 * Confirmed default from Postman: status=all
 */
export function mapAdminVendorsStatusQuery(tab = 'All') {
  const normalized = String(tab || 'All').trim().toLowerCase()
  if (normalized === 'active') return 'active'
  if (normalized === 'pending') return 'pending'
  if (normalized === 'suspended') return 'suspended'
  return 'all'
}

/**
 * Map one vendor from GET /admin/vendors into the Vendor Management table row.
 */
export function mapAdminVendorListItem(vendor) {
  if (!vendor || typeof vendor !== 'object') return null

  const backendId = String(vendor.id || '').trim()
  if (!backendId) return null

  const status = String(vendor.status || '').trim() || '—'

  return {
    id: backendId,
    displayCode: vendor.displayCode || backendId,
    name: vendor.name || 'Untitled',
    category: vendor.category || '—',
    orders: formatCount(vendor.orders),
    branches: formatCount(vendor.branchCount),
    users: formatCount(vendor.users),
    rating: formatRating(vendor.rating),
    status,
    accountStatus: vendor.accountStatus ?? null,
    isActive: vendor.isActive !== false,
    isOnline: Boolean(vendor.isOnline),
    storeTypeId: vendor.storeTypeId ?? null,
    area: vendor.area ?? null,
    city: vendor.city ?? null,
    logoUrl: vendor.logoUrl ?? null,
    createdAt: vendor.createdAt || vendor.created_at || null,
  }
}

/**
 * Map GET /admin/vendors `data` into AdminVendorsPage UI shape.
 *
 * Confirmed envelope:
 *   { page, limit, total, kpis, vendors[] }
 */
export function mapAdminVendorsListResponse(data) {
  if (!data || typeof data !== 'object') {
    throw new ApiError({ message: 'Invalid vendors response from the server.' })
  }

  const kpis = data.kpis && typeof data.kpis === 'object' ? data.kpis : {}
  const vendors = Array.isArray(data.vendors) ? data.vendors : []
  const rows = vendors
    .map(mapAdminVendorListItem)
    .filter(Boolean)
    // Prefer newest first when API returns createdAt (and when sort=newest is ignored).
    .sort((a, b) => {
      const aTime = a.createdAt ? Date.parse(a.createdAt) : NaN
      const bTime = b.createdAt ? Date.parse(b.createdAt) : NaN
      if (!Number.isNaN(aTime) && !Number.isNaN(bTime) && aTime !== bTime) {
        return bTime - aTime
      }
      return 0
    })

  return {
    title: 'Vendor Management',
    action: 'Add vendor',
    page: Number(data.page) || 1,
    limit: Number(data.limit) || rows.length || 20,
    total: Number(data.total) || rows.length,
    stats: [
      { label: 'Total vendors', value: formatCount(kpis.totalVendors ?? data.total), tone: 'ink' },
      { label: 'Active', value: formatCount(kpis.active), tone: 'green' },
      { label: 'Pending approval', value: formatCount(kpis.pendingApproval), tone: 'orange' },
      { label: 'Suspended', value: formatCount(kpis.suspended), tone: 'red' },
    ],
    tabs: VENDOR_TABS,
    columns: VENDOR_COLUMNS,
    rows,
  }
}

function vendorInitials(name) {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase()
}

function formatMoneyBhd(value) {
  if (value === null || value === undefined || value === '') return 'BHD 0'
  const numeric = Number(value)
  if (Number.isNaN(numeric)) return String(value)
  return `BHD ${numeric.toLocaleString(undefined, {
    minimumFractionDigits: numeric % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`
}

function formatDeliveryLine(delivery) {
  if (!delivery || typeof delivery !== 'object') return '—'
  const radius = delivery.radiusKm ?? delivery.deliveryRadiusKm
  const eta = delivery.etaMin ?? delivery.deliveryEtaMin
  const minOrder = delivery.minOrder ?? delivery.minOrderAmount
  const parts = []
  if (radius !== null && radius !== undefined && radius !== '') {
    parts.push(`Radius ${radius} km`)
  }
  if (eta !== null && eta !== undefined && eta !== '') {
    parts.push(`ETA ${eta} min`)
  }
  if (minOrder !== null && minOrder !== undefined && minOrder !== '') {
    parts.push(`min BHD ${Number(minOrder).toFixed(3)}`)
  }
  return parts.length ? parts.join(' · ') : '—'
}

function formatDispatchMode(value) {
  const raw = String(value || '').trim()
  if (!raw) return '—'
  if (raw.toUpperCase() === 'AUTO') return 'Auto-dispatch'
  if (raw.toUpperCase() === 'MANUAL') return 'Manual dispatch'
  return raw
}

const DETAIL_TABS = [
  'Overview',
  'Branches',
  'Users & staff',
  'Delivery zones',
  'Promotions',
  'Commission & fees',
  'SLA',
]

/**
 * Map GET /admin/vendors/:vendorId into Vendor Detail Overview UI shape.
 *
 * Nested tabs (branches, staff, zones, …) are not in this response —
 * those arrays stay empty until their list APIs are wired.
 */
export function mapAdminVendorDetailResponse(data) {
  if (!data || typeof data !== 'object') {
    throw new ApiError({ message: 'Invalid vendor detail response from the server.' })
  }

  const backendId = String(data.id || '').trim()
  if (!backendId) {
    throw new ApiError({ message: 'Vendor detail response is missing an id.' })
  }

  const displayCode = String(data.displayCode || backendId).trim()
  const name = data.name || 'Untitled'
  const branchCount = Number(data.branchCount) || 0
  const storeProfile = data.storeProfile && typeof data.storeProfile === 'object' ? data.storeProfile : {}
  const kpis = data.kpis && typeof data.kpis === 'object' ? data.kpis : {}
  const controls = data.controls && typeof data.controls === 'object' ? data.controls : {}
  const delivery =
    storeProfile.delivery && typeof storeProfile.delivery === 'object'
      ? storeProfile.delivery
      : data.deliveryDefaults

  const isOnline = controls.isOnline ?? data.isOnline ?? false
  const visibleAndAccepting = controls.visibleAndAccepting ?? isOnline
  const openIssues = Number(kpis.openIssues) || 0
  const avgRating = kpis.avgRating ?? data.rating

  return {
    // Subtitle shows display code (same slot mock used for VND-xxxx).
    id: displayCode,
    backendId,
    displayCode,
    name,
    initials: vendorInitials(name),
    status: String(data.status || '').trim() || '—',
    accountStatus: data.accountStatus ?? null,
    storeType: data.category || '—',
    category: storeProfile.category || data.category || '—',
    rating: formatRating(data.rating),
    branchesLabel: `${branchCount} branch${branchCount === 1 ? '' : 'es'}`,
    legalName: storeProfile.legalName || data.legalName || '—',
    legalNameRaw: storeProfile.legalName || data.legalName || null,
    delivery: formatDeliveryLine(delivery),
    description: data.description ?? null,
    logoUrl: data.logoUrl ?? null,
    coverUrl: data.coverUrl ?? null,
    area: data.area ?? null,
    city: data.city ?? null,
    cuisineTags: Array.isArray(data.cuisineTags) ? data.cuisineTags.filter(Boolean).map(String) : [],
    storeTypeId: data.storeTypeId ?? null,
    subcategoryId: data.subcategoryId ?? null,
    categoryLabel: data.category ?? null,
    subCategory: data.subcategoryName || null,
    crNumber: data.crNumber ?? '',
    vatNumber: data.vatNumber ?? '',
    storeOnline: Boolean(isOnline),
    storeOnlineHint: visibleAndAccepting
      ? 'Visible & accepting orders'
      : 'Hidden from customers',
    dispatchMode: formatDispatchMode(controls.dispatchMode ?? data.dispatchMode),
    forceClosed: Boolean(data.forceClosed),
    forceClosedUntil: data.forceClosedUntil ?? null,
    forceClosedReason: data.forceClosedReason ?? null,
    forceClosedNote: data.forceClosedNote ?? null,
    metrics: [
      { label: 'Orders (30d)', value: formatCount(kpis.orders30d) },
      { label: 'GMV (30d)', value: formatMoneyBhd(kpis.gmv30d) },
      {
        label: 'Avg rating',
        value: formatRating(avgRating),
        star: true,
        tone: 'green',
      },
      {
        label: 'Active branches',
        value: kpis.activeBranches != null ? String(kpis.activeBranches) : `${branchCount} / ${branchCount}`,
        tone: 'green',
      },
      {
        label: 'Open issues',
        value: formatCount(openIssues),
        tone: openIssues > 0 ? 'orange' : 'ink',
      },
    ],
    tabs: DETAIL_TABS,
    // Not returned by Get vendor — empty until nested list APIs are wired.
    branches: [],
    users: [],
    deliveryZones: emptyAdminDeliveryZones(),
    promotions: [],
    commission: null,
    sla: null,
  }
}

/**
 * Map Store profile form → PATCH /admin/vendors/:vendorId body.
 * Confirmed sample: logoUrl, coverUrl, cuisineTags, storeTypeId.
 * Also accepts name, legalName, description (live API).
 * City / area / categoryLabel are set via branches / store type — not this form.
 */
export function mapAdminUpdateVendorStoreRequest(form = {}) {
  const body = {}

  const name = String(form.storeName || form.name || '').trim()
  if (name) body.name = name

  const legalName = String(form.legalName || '').trim()
  if (legalName) body.legalName = legalName

  const description = String(form.description || '').trim()
  if (description) body.description = description

  const logoUrl = String(form.logoUrl || '').trim()
  if (logoUrl) body.logoUrl = logoUrl

  const coverUrl = String(form.coverUrl || '').trim()
  if (coverUrl) body.coverUrl = coverUrl

  const storeTypeId = String(form.storeTypeId || '').trim()
  if (storeTypeId) body.storeTypeId = storeTypeId

  if (form.subcategoryId !== undefined) {
    const subcategoryId = String(form.subcategoryId || '').trim()
    body.subcategoryId = subcategoryId || null
  }

  const crNumber = String(form.crNumber || '').trim()
  if (crNumber) body.crNumber = crNumber

  const vatNumber = String(form.vatNumber || '').trim()
  if (vatNumber) body.vatNumber = vatNumber

  if (Array.isArray(form.cuisineTags)) {
    const tags = form.cuisineTags.map((t) => String(t || '').trim()).filter(Boolean)
    if (tags.length) body.cuisineTags = tags
  } else if (typeof form.cuisineTags === 'string' && form.cuisineTags.trim()) {
    body.cuisineTags = form.cuisineTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
  }

  if (Object.keys(body).length === 0) {
    throw new ApiError({ message: 'No store profile fields to update.' })
  }

  return body
}

/** Safe empty shape for Delivery zones tab (expects object, not array). */
export function emptyAdminDeliveryZones(branches = []) {
  return {
    defaults: {
      radiusKm: '',
      etaMin: '',
      minOrder: '',
      deliveryContribution: '',
      freeDeliveryOver: '',
      freeDeliveryEnabled: false,
      maxDistanceKm: '',
      extraContributionPerKm: '',
      maxContribution: '',
    },
    overrides: mapAdminDeliveryZoneOverridesFromBranches(branches),
  }
}

/**
 * Build per-branch overrides rows from branches list (until delivery-zones API is wired).
 */
export function mapAdminDeliveryZoneOverridesFromBranches(branches = []) {
  if (!Array.isArray(branches)) return []
  return branches
    .filter((branch) => branch && branch.id)
    .map((branch) => {
      const fee =
        branch.deliveryFee != null && branch.deliveryFee !== ''
          ? `BHD ${Number(branch.deliveryFee).toFixed(3)}`
          : '—'
      return {
        id: branch.id,
        name: branch.name || 'Untitled',
        radius: branch.radius || '—',
        eta: branch.eta || '—',
        minOrder: branch.minOrder || '—',
        deliveryFee: fee,
      }
    })
}

const MONTH_INDEX = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
}

/**
 * Parse modal date text → ISO for force-close from/to.
 * Accepts ISO already, or UI text like "9 Apr 2026 · 18:00".
 */
export function mapAdminForceCloseToIso(value, label = 'time') {
  const raw = String(value || '').trim()
  if (!raw) {
    throw new ApiError({ message: `Force close ${label} is required.` })
  }

  if (/^\d{4}-\d{2}-\d{2}T/.test(raw)) {
    const date = new Date(raw)
    if (Number.isNaN(date.getTime())) {
      throw new ApiError({ message: `Force close ${label} is invalid.` })
    }
    return date.toISOString()
  }

  const match = raw.match(
    /^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})\s*[·•.\-]\s*(\d{1,2}):(\d{2})$/,
  )
  if (!match) {
    throw new ApiError({
      message: `Use ${label} format like "9 Apr 2026 · 18:00" or an ISO date.`,
    })
  }

  const day = Number(match[1])
  const month = MONTH_INDEX[match[2].toLowerCase()]
  const year = Number(match[3])
  const hour = Number(match[4])
  const minute = Number(match[5])
  if (month == null || Number.isNaN(day) || Number.isNaN(year)) {
    throw new ApiError({ message: `Force close ${label} is invalid.` })
  }

  const date = new Date(Date.UTC(year, month, day, hour, minute, 0, 0))
  if (Number.isNaN(date.getTime())) {
    throw new ApiError({ message: `Force close ${label} is invalid.` })
  }
  return date.toISOString()
}

function isSingleBranchScope(scope) {
  const label = String(scope || '').trim()
  return label === 'Single branch' || label === 'single_branch'
}

/**
 * Map Force close modal values → POST /admin/vendors/:id/force-close body.
 * Supports whole_store and single_branch (branchId required for single).
 */
export function mapAdminForceCloseRequest(form = {}) {
  const singleBranch = isSingleBranchScope(form.scope)
  const reason = String(form.reason || '').trim()
  if (!reason) {
    throw new ApiError({ message: 'Force close reason is required.' })
  }

  const body = {
    scope: singleBranch ? 'single_branch' : 'whole_store',
    reason,
    to: mapAdminForceCloseToIso(form.to, 'end time (To)'),
  }

  if (form.from != null && String(form.from).trim()) {
    body.from = mapAdminForceCloseToIso(form.from, 'start time (From)')
  }

  const note = String(form.note || '').trim()
  if (note) body.note = note

  if (singleBranch) {
    const branchId = String(form.branchId || '').trim()
    if (!branchId) {
      throw new ApiError({
        message: 'Select a branch for single-branch force close.',
      })
    }
    body.branchId = branchId
  }

  return body
}

/**
 * Map reopen form → POST /admin/vendors/:id/reopen body.
 */
export function mapAdminReopenRequest(form = {}) {
  if (isSingleBranchScope(form.scope)) {
    const branchId = String(form.branchId || '').trim()
    if (!branchId) {
      throw new ApiError({ message: 'Branch id is required to reopen a single branch.' })
    }
    return { scope: 'single_branch', branchId }
  }
  return { scope: 'whole_store' }
}
