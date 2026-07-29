import { ApiError } from '../../api/errors'

function formatMinOrder(value) {
  if (value === null || value === undefined || value === '') return '—'
  const numeric = Number(value)
  if (Number.isNaN(numeric)) return String(value)
  return `BHD ${numeric.toFixed(3)}`
}

function formatRadius(value) {
  if (value === null || value === undefined || value === '') return '—'
  const numeric = Number(value)
  if (Number.isNaN(numeric)) return String(value)
  return `${numeric} km`
}

function formatEta(value) {
  if (value === null || value === undefined || value === '') return '—'
  const numeric = Number(value)
  if (Number.isNaN(numeric)) return String(value)
  return `${numeric} min`
}

/**
 * Map one branch from GET/POST branches list into Branches table row.
 *
 * Confirmed fields: id, name, address, area, city, phone, radiusKm, etaMin,
 * minOrder, deliveryFee, hours, status, operationalStatus, isSuspended,
 * forceClosedUntil, isPrimary, latitude, longitude
 */
export function mapAdminVendorBranchListItem(branch) {
  if (!branch || typeof branch !== 'object') return null
  const id = String(branch.id || '').trim()
  if (!id) return null

  const addressLine = branch.address || branch.city || null

  const block = addressLine || (branch.isPrimary ? 'Primary' : '—')
  const radius = formatRadius(branch.radiusKm)
  const eta = formatEta(branch.etaMin)
  const minOrder = formatMinOrder(branch.minOrder)

  return {
    id,
    name: branch.name || 'Untitled',
    // Secondary line under name (UI used "Block …"; API has address/city)
    block,
    area: branch.area || '—',
    radius,
    eta,
    minOrder,
    // Edit-vendor wizard row subtitle
    detail: `${block} · radius ${radius} · ETA ${eta} · min ${minOrder}`,
    // Raw values for edit form / PATCH
    radiusKm: branch.radiusKm ?? null,
    etaMin: branch.etaMin ?? null,
    minOrderAmount: branch.minOrder ?? null,
    hours: branch.hours || '—',
    status: branch.status || '—',
    operationalStatus: branch.operationalStatus ?? null,
    isSuspended: Boolean(branch.isSuspended),
    forceClosedUntil: branch.forceClosedUntil ?? null,
    isPrimary: Boolean(branch.isPrimary),
    address: branch.address ?? null,
    city: branch.city ?? null,
    phone: branch.phone ?? null,
    latitude: branch.latitude ?? null,
    longitude: branch.longitude ?? null,
    deliveryFee: branch.deliveryFee ?? null,
    areaCity: branch.area || branch.city || 'Manama',
  }
}

/**
 * Map GET/POST /admin/vendors/:id/branches `data` → { count, branches }.
 */
export function mapAdminVendorBranchesResponse(data) {
  if (!data || typeof data !== 'object') {
    throw new ApiError({ message: 'Invalid vendor branches response from the server.' })
  }

  const raw = Array.isArray(data.branches) ? data.branches : Array.isArray(data) ? data : []
  const branches = raw.map(mapAdminVendorBranchListItem).filter(Boolean)

  return {
    count: Number(data.count) || branches.length,
    branches,
  }
}

/**
 * Map branch setup form → POST create body.
 * Confirmed: name, area, address, phone?, latitude, longitude.
 * Skips delivery/hours UI fields (not in create API).
 */
export function mapAdminCreateBranchRequest(form = {}) {
  const name = String(form.name || '').trim()
  if (!name) {
    throw new ApiError({ message: 'Branch name is required.' })
  }

  const area = String(form.areaCity || form.area || '').trim()
  if (!area) {
    throw new ApiError({ message: 'Area / city is required.' })
  }

  const address = String(form.address || '').trim()
  const latitude = Number(form.latitude)
  const longitude = Number(form.longitude)

  if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
    throw new ApiError({ message: 'Latitude and longitude are required.' })
  }

  const body = {
    name,
    area,
    address: address || undefined,
    latitude,
    longitude,
  }

  const phone = String(form.phone || '').trim()
  if (phone) body.phone = phone

  return body
}

function optionalNumber(value) {
  if (value === null || value === undefined || value === '') return undefined
  const numeric = Number(value)
  if (Number.isNaN(numeric)) return undefined
  return numeric
}

/**
 * Map branch setup form → PATCH update body.
 * Confirmed sample: { etaMin }. Also sends editable store fields when present.
 */
export function mapAdminUpdateBranchRequest(form = {}) {
  const body = {}

  const name = String(form.name || '').trim()
  if (name) body.name = name

  const area = String(form.areaCity || form.area || '').trim()
  if (area) body.area = area

  const address = String(form.address || '').trim()
  if (address) body.address = address

  const phone = String(form.phone || '').trim()
  if (phone) body.phone = phone

  const latitude = optionalNumber(form.latitude)
  if (latitude !== undefined) body.latitude = latitude

  const longitude = optionalNumber(form.longitude)
  if (longitude !== undefined) body.longitude = longitude

  const etaMin = optionalNumber(form.etaMin)
  if (etaMin !== undefined) body.etaMin = etaMin

  const radiusKm = optionalNumber(form.radiusKm)
  if (radiusKm !== undefined) body.radiusKm = radiusKm

  const minOrder = optionalNumber(form.minOrderValue ?? form.minOrder)
  if (minOrder !== undefined) body.minOrder = minOrder

  if (Object.keys(body).length === 0) {
    throw new ApiError({ message: 'No branch fields to update.' })
  }

  return body
}
