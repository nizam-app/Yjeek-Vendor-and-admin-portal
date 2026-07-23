import { ApiError } from '../../api/errors'

function formatMinOrder(amount) {
  if (amount === null || amount === undefined || amount === '') return '—'
  const numeric = Number(amount)
  if (Number.isNaN(numeric)) return String(amount)
  return `${numeric.toFixed(3)} BHD`
}

function mapUiStatus(branch) {
  if (branch?.isSuspended) return 'Suspended'

  const raw = String(branch?.operationalStatus || branch?.status || '').trim()
  if (['Open', 'Busy', 'Closed', 'Suspended'].includes(raw)) return raw

  const upper = raw.toUpperCase()
  if (upper === 'OPEN') return 'Open'
  if (upper === 'BUSY') return 'Busy'
  if (upper === 'CLOSED') return 'Closed'
  if (upper === 'SUSPENDED') return 'Suspended'

  return 'Closed'
}

function isUiShapedBranch(branch) {
  return (
    branch &&
    typeof branch === 'object' &&
    ['Open', 'Busy', 'Closed', 'Suspended'].includes(branch.status) &&
    typeof branch.minOrder === 'string'
  )
}

/**
 * Map one confirmed Vendor branch object into the existing Branches UI shape.
 */
export function mapVendorBranch(branch) {
  if (!branch || typeof branch !== 'object') {
    throw new ApiError({ message: 'Invalid branch payload from the server.' })
  }

  if (isUiShapedBranch(branch)) {
    return {
      ...branch,
      id: branch.id,
      name: branch.name,
      address: branch.address,
      status: branch.status,
      radius: branch.radius || (branch.radiusKm != null ? `${branch.radiusKm} km` : '—'),
      eta: branch.eta || (branch.etaMin != null ? `${branch.etaMin} min` : null),
      phone: branch.phone,
      minOrder: branch.minOrder,
      isSuspended: branch.status === 'Suspended',
    }
  }

  const status = mapUiStatus(branch)
  const radiusKm = branch.radiusKm
  const etaMin = branch.etaMin

  return {
    id: branch.id,
    name: branch.name,
    address: branch.address,
    area: branch.area ?? null,
    city: branch.city ?? null,
    phone: branch.phone ?? null,
    radiusKm: radiusKm ?? null,
    radius: radiusKm != null && radiusKm !== '' ? `${radiusKm} km` : '—',
    etaMin: etaMin ?? null,
    eta: etaMin != null && etaMin !== '' ? `${etaMin} min` : null,
    minOrderAmount: branch.minOrderAmount ?? null,
    minOrder: formatMinOrder(branch.minOrderAmount),
    status,
    backendStatus: branch.status ?? null,
    operationalStatus: branch.operationalStatus ?? null,
    isSuspended: Boolean(branch.isSuspended) || status === 'Suspended',
    suspensionReason: branch.suspensionReason ?? null,
    openingHours: branch.openingHours ?? null,
    isPrimary: Boolean(branch.isPrimary),
  }
}

/**
 * Normalize list-branches API (or mock array) for Branches page + Topbar.
 */
export function mapVendorBranchesResponse(data) {
  if (Array.isArray(data)) {
    const branches = data.map((item) => mapVendorBranch(item))
    return { count: branches.length, branches }
  }

  if (data && typeof data === 'object' && Array.isArray(data.branches)) {
    const branches = data.branches.map((item) => mapVendorBranch(item))
    return {
      count: typeof data.count === 'number' ? data.count : branches.length,
      branches,
    }
  }

  throw new ApiError({ message: 'Invalid branches response from the server.' })
}
