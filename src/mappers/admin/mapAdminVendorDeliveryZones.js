import { ApiError } from '../../api/errors'

function asInputValue(value) {
  if (value === null || value === undefined || value === '') return ''
  return String(value)
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

function formatMinOrder(value) {
  if (value === null || value === undefined || value === '') return '—'
  const numeric = Number(value)
  if (Number.isNaN(numeric)) return String(value)
  return `BHD ${numeric.toFixed(3)}`
}

function formatFee(value) {
  if (value === null || value === undefined || value === '') return '—'
  const numeric = Number(value)
  if (Number.isNaN(numeric)) return String(value)
  return `BHD ${numeric.toFixed(3)}`
}

/**
 * Map GET /admin/vendors/:id/delivery-zones → Delivery zones tab model.
 *
 * Confirmed:
 *   general → defaults form
 *   branches → per-branch overrides table
 *   coverage → map / circles summary
 */
export function mapAdminDeliveryZonesResponse(data) {
  if (!data || typeof data !== 'object') {
    throw new ApiError({ message: 'Invalid delivery zones response from the server.' })
  }

  const general = data.general && typeof data.general === 'object' ? data.general : {}
  const branches = Array.isArray(data.branches) ? data.branches : []
  const coverage = data.coverage && typeof data.coverage === 'object' ? data.coverage : null

  return {
    defaults: {
      radiusKm: asInputValue(general.deliveryRadiusKm),
      etaMin: asInputValue(general.deliveryEtaMin),
      minOrder: asInputValue(general.minOrderAmount),
      deliveryContribution: asInputValue(general.deliveryContribution),
      freeDeliveryOver: asInputValue(general.freeDeliveryOver),
      freeDeliveryEnabled: Boolean(general.freeDeliveryEnabled),
      maxDistanceKm: asInputValue(general.maxDistanceKm),
      extraContributionPerKm: asInputValue(general.extraContributionPerKm),
      maxContribution: asInputValue(general.maxContribution),
    },
    overrides: branches
      .filter((branch) => branch && branch.id)
      .map((branch) => ({
        id: String(branch.id),
        name: branch.name || 'Untitled',
        area: branch.area || null,
        latitude: branch.latitude ?? null,
        longitude: branch.longitude ?? null,
        radius: formatRadius(branch.radiusKm),
        eta: formatEta(branch.etaMin),
        minOrder: formatMinOrder(branch.minOrder),
        deliveryFee: formatFee(branch.deliveryFee),
        radiusKm: branch.radiusKm ?? null,
        etaMin: branch.etaMin ?? null,
        minOrderAmount: branch.minOrder ?? null,
        deliveryFeeAmount: branch.deliveryFee ?? null,
      })),
    coverage: coverage
      ? {
          center: coverage.center || null,
          circles: Array.isArray(coverage.circles) ? coverage.circles : [],
        }
      : null,
  }
}

/**
 * Map Delivery defaults form → PATCH /delivery-zones body.
 * Confirmed sample: deliveryRadiusKm, minOrderAmount, freeDeliveryOver.
 * Also sends other general fields when present in the form.
 */
export function mapAdminUpdateDeliveryZonesRequest(form = {}) {
  const body = {}

  const num = (value) => {
    if (value === null || value === undefined || value === '') return undefined
    const numeric = Number(value)
    return Number.isNaN(numeric) ? undefined : numeric
  }

  const deliveryRadiusKm = num(form.radiusKm ?? form.deliveryRadiusKm)
  if (deliveryRadiusKm !== undefined) body.deliveryRadiusKm = deliveryRadiusKm

  const deliveryEtaMin = num(form.etaMin ?? form.deliveryEtaMin)
  if (deliveryEtaMin !== undefined) body.deliveryEtaMin = deliveryEtaMin

  const minOrderAmount = num(form.minOrder ?? form.minOrderAmount)
  if (minOrderAmount !== undefined) body.minOrderAmount = minOrderAmount

  const deliveryContribution = num(form.deliveryContribution)
  if (deliveryContribution !== undefined) body.deliveryContribution = deliveryContribution

  const freeDeliveryOver = num(form.freeDeliveryOver)
  if (freeDeliveryOver !== undefined) body.freeDeliveryOver = freeDeliveryOver

  if (typeof form.freeDeliveryEnabled === 'boolean') {
    body.freeDeliveryEnabled = form.freeDeliveryEnabled
  }

  const maxDistanceKm = num(form.maxDistanceKm)
  if (maxDistanceKm !== undefined) body.maxDistanceKm = maxDistanceKm

  const extraContributionPerKm = num(form.extraContributionPerKm)
  if (extraContributionPerKm !== undefined) body.extraContributionPerKm = extraContributionPerKm

  const maxContribution = num(form.maxContribution)
  if (maxContribution !== undefined) body.maxContribution = maxContribution

  if (Object.keys(body).length === 0) {
    throw new ApiError({ message: 'No delivery zone fields to update.' })
  }

  return body
}
