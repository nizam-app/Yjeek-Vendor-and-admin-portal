import {
  EMPTY_HOT_FOOD_DEFAULTS,
  normalizeHotFoodDefaults,
} from '../components/admin/management/AdminStoreTypeHotFoodDefaults'

/** True when API-shaped hot food has enough to show in the branch draft form (not necessarily save-valid). */
export function hotFoodFormHasDisplayValues(form) {
  if (!form?.vendor || typeof form.vendor !== 'object') return false
  const v = form.vendor
  const keys = [
    'radiusKm',
    'etaMin',
    'minOrderAmount',
    'contribution',
    'maxDistanceKm',
    'extraPerKm',
  ]
  return keys.some((key) => {
    const raw = v[key]
    return raw != null && String(raw).trim() !== ''
  })
}

export function mergeHotFoodPrefillSources(...raws) {
  const vendor = { ...EMPTY_HOT_FOOD_DEFAULTS.vendor }
  const customer = { ...EMPTY_HOT_FOOD_DEFAULTS.customer }
  let sawFreeDelivery = false

  for (const raw of raws) {
    if (!raw) continue
    const form = normalizeHotFoodDefaults(raw)
    for (const key of Object.keys(vendor)) {
      const cur = vendor[key]
      const next = form.vendor[key]
      const curEmpty = cur === '' || cur == null || cur === false
      const nextFilled =
        next !== '' && next != null && (key !== 'freeDeliveryEnabled' || next === true)
      if (curEmpty && nextFilled) vendor[key] = next
    }
    if (form.vendor.freeDeliveryEnabled) sawFreeDelivery = true
    for (const key of Object.keys(customer)) {
      const cur = customer[key]
      const next = form.customer[key]
      if ((cur === '' || cur == null) && next !== '' && next != null) {
        customer[key] = next
      }
    }
  }
  if (!sawFreeDelivery) vendor.freeDeliveryEnabled = false
  return { vendor, customer }
}

export function pickHotFoodPrefill(...candidates) {
  const merged = mergeHotFoodPrefillSources(...candidates)
  if (hotFoodFormHasDisplayValues(merged)) return merged
  for (const raw of candidates) {
    if (!raw) continue
    const form = normalizeHotFoodDefaults(raw)
    if (hotFoodFormHasDisplayValues(form)) return form
  }
  return null
}

/**
 * Load hot-food prefill for new branch draft: SLA platform → store type → vendor template.
 */
export async function fetchBranchHotFoodPrefill({
  vendorId,
  vendorStoreTypeId,
  adminService,
  adminSlaModelsService,
}) {
  let vendorHotFood = null
  let storeTypeHotFood = null
  let platformHotFood = null

  if (vendorId) {
    try {
      const vendorDel = await adminService.getVendorDeliverySettings(vendorId)
      vendorHotFood = vendorDel?.data?.hotFoodOnDemand ?? null
    } catch {
      /* vendor template optional */
    }
  }

  if (vendorStoreTypeId) {
    try {
      const stDel = await adminService.getAdminStoreTypeDeliveryDefaults(vendorStoreTypeId)
      storeTypeHotFood = stDel?.data?.hotFoodOnDemand ?? null
    } catch {
      /* store type defaults optional */
    }
  }

  try {
    const platform = await adminSlaModelsService.getCommercialDefaults()
    platformHotFood = platform?.data?.hotFoodOnDemand ?? null
  } catch {
    /* platform SLA optional */
  }

  return pickHotFoodPrefill(platformHotFood, storeTypeHotFood, vendorHotFood)
}
