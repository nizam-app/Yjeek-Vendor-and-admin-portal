import {
  SCHEDULED_SPEED_TIERS,
  normalizeScheduledFees,
} from '../components/admin/management/scheduledFeesForm.js'

/** True when normalized scheduled form has at least one tier field to show. */
export function scheduledFormHasDisplayValues(form) {
  if (!form?.tiers || typeof form.tiers !== 'object') return false
  for (const tier of SCHEDULED_SPEED_TIERS) {
    const cell = form.tiers[tier]
    if (!cell || typeof cell !== 'object') continue
    for (const key of [
      'vendorNormal',
      'vendorSpecial',
      'customerNormal',
      'customerSpecial',
      'minOrderAmount',
      'freeDeliveryOver',
    ]) {
      const raw = cell[key]
      if (raw != null && String(raw).trim() !== '') return true
    }
    if (cell.freeDeliveryEnabled) return true
  }
  return false
}

export function mergeScheduledPrefillSources(...raws) {
  const base = normalizeScheduledFees(null)
  for (const raw of raws) {
    if (!raw) continue
    const form = normalizeScheduledFees(raw)
    for (const tier of SCHEDULED_SPEED_TIERS) {
      const out = base.tiers[tier]
      const src = form.tiers[tier]
      if (!src) continue
      for (const key of Object.keys(out)) {
        if (key === 'freeDeliveryEnabled') {
          if (!out.freeDeliveryEnabled && src.freeDeliveryEnabled) {
            out.freeDeliveryEnabled = true
          }
          continue
        }
        const cur = out[key]
        const next = src[key]
        if ((cur === '' || cur == null) && next !== '' && next != null) {
          out[key] = next
        }
      }
    }
  }
  return base
}

export function pickScheduledPrefill(...candidates) {
  const merged = mergeScheduledPrefillSources(...candidates)
  if (scheduledFormHasDisplayValues(merged)) return merged
  for (const raw of candidates) {
    if (!raw) continue
    const form = normalizeScheduledFees(raw)
    if (scheduledFormHasDisplayValues(form)) return form
  }
  return null
}

/**
 * Scheduled fee prefill for new branch draft: SLA platform → store type → vendor template.
 */
export async function fetchBranchScheduledPrefill({
  vendorId,
  vendorStoreTypeId,
  adminService,
  adminSlaModelsService,
}) {
  let vendorScheduled = null
  let storeTypeScheduled = null
  let platformScheduled = null

  if (vendorId) {
    try {
      const vendorDel = await adminService.getVendorDeliverySettings(vendorId)
      vendorScheduled = vendorDel?.data?.scheduled ?? null
    } catch {
      /* vendor template optional */
    }
  }

  if (vendorStoreTypeId) {
    try {
      const stDel = await adminService.getAdminStoreTypeDeliveryDefaults(vendorStoreTypeId)
      storeTypeScheduled = stDel?.data?.scheduled ?? null
    } catch {
      /* store type defaults optional */
    }
  }

  if (adminSlaModelsService) {
    try {
      const platform = await adminSlaModelsService.getCommercialDefaults()
      platformScheduled = platform?.data?.scheduled ?? null
    } catch {
      /* platform SLA optional */
    }
  }

  return pickScheduledPrefill(platformScheduled, storeTypeScheduled, vendorScheduled)
}
