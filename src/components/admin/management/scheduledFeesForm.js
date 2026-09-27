/**
 * Scheduled fee form helpers (OG §05 / D06 Batch 3).
 * Pure JS — shared by AdminScheduledFeesPanel and unit tests.
 */

export const SCHEDULED_SPEED_TIERS = ['SAME_DAY', 'NEXT_DAY', 'STANDARD', 'ECONOMY']

export const SCHEDULED_SPEED_TIER_LABELS = {
  SAME_DAY: 'Same day',
  NEXT_DAY: 'Next day',
  STANDARD: 'Standard',
  ECONOMY: 'Economy',
}

export const SCHEDULED_TIER_RATE_KEYS = [
  'vendorNormal',
  'vendorSpecial',
  'customerNormal',
  'customerSpecial',
  'minOrderAmount',
  'freeDeliveryEnabled',
  'freeDeliveryOver',
]

function emptyTierForm() {
  return {
    vendorNormal: '',
    vendorSpecial: '',
    customerNormal: '',
    customerSpecial: '',
    minOrderAmount: '',
    freeDeliveryEnabled: false,
    freeDeliveryOver: '',
  }
}

export function emptyScheduledFeesForm() {
  return {
    tiers: {
      SAME_DAY: emptyTierForm(),
      NEXT_DAY: emptyTierForm(),
      STANDARD: emptyTierForm(),
      ECONOMY: emptyTierForm(),
    },
  }
}

export const EMPTY_SCHEDULED_FEES = emptyScheduledFeesForm()

function asInputValue(value) {
  if (value === null || value === undefined) return ''
  return String(value)
}

function pickCellValue(obj, key) {
  const cell = obj?.[key]
  if (cell && typeof cell === 'object' && 'value' in cell) return cell.value
  return obj?.[key]
}

function normalizeTier(raw) {
  const src = raw && typeof raw === 'object' ? raw : {}
  return {
    vendorNormal: asInputValue(pickCellValue(src, 'vendorNormal')),
    vendorSpecial: asInputValue(pickCellValue(src, 'vendorSpecial')),
    customerNormal: asInputValue(pickCellValue(src, 'customerNormal')),
    customerSpecial: asInputValue(pickCellValue(src, 'customerSpecial')),
    minOrderAmount: asInputValue(pickCellValue(src, 'minOrderAmount')),
    freeDeliveryEnabled: Boolean(pickCellValue(src, 'freeDeliveryEnabled')),
    freeDeliveryOver: asInputValue(pickCellValue(src, 'freeDeliveryOver')),
  }
}

/**
 * Normalize API `scheduled` (flat store-type or branch inherited) into form strings.
 */
export function normalizeScheduledFees(raw) {
  const base = emptyScheduledFeesForm()
  if (!raw || typeof raw !== 'object') return base

  const tiersRaw = raw.tiers && typeof raw.tiers === 'object' ? raw.tiers : raw
  for (const tier of SCHEDULED_SPEED_TIERS) {
    base.tiers[tier] = normalizeTier(tiersRaw[tier])
  }
  return base
}

/**
 * Extract per-field inheritance meta from branch/vendor GET `scheduled`.
 */
export function extractScheduledFieldMeta(raw) {
  if (!raw || typeof raw !== 'object') return null
  const tiersRaw = raw.tiers && typeof raw.tiers === 'object' ? raw.tiers : raw
  const hasInherited = SCHEDULED_SPEED_TIERS.some((tier) => {
    const cell = tiersRaw[tier]
    if (!cell || typeof cell !== 'object') return false
    return Object.values(cell).some((v) => v && typeof v === 'object' && 'state' in v)
  })
  if (!hasInherited) return null

  const tiers = {}
  for (const tier of SCHEDULED_SPEED_TIERS) {
    const cell = tiersRaw[tier] && typeof tiersRaw[tier] === 'object' ? tiersRaw[tier] : {}
    const out = {}
    for (const key of SCHEDULED_TIER_RATE_KEYS) {
      const field = cell[key]
      if (field && typeof field === 'object' && 'state' in field) {
        out[key] = {
          state: String(field.state || 'inherited').toLowerCase(),
          defaultValue: field.defaultValue,
        }
      }
    }
    tiers[tier] = out
  }
  return { tiers }
}

function emptyToNull(value) {
  const trimmed = String(value ?? '').trim()
  return trimmed === '' ? null : trimmed
}

/**
 * Build PUT body for `scheduled`. Empty money → null. Free delivery off → freeDeliveryOver null.
 * Never emits distance keys.
 */
export function buildScheduledFeesPayload(form) {
  const tiersIn = form?.tiers || EMPTY_SCHEDULED_FEES.tiers
  const tiers = {}
  for (const tier of SCHEDULED_SPEED_TIERS) {
    const cell = tiersIn[tier] || emptyTierForm()
    const freeEnabled = Boolean(cell.freeDeliveryEnabled)
    tiers[tier] = {
      vendorNormal: emptyToNull(cell.vendorNormal),
      vendorSpecial: emptyToNull(cell.vendorSpecial),
      customerNormal: emptyToNull(cell.customerNormal),
      customerSpecial: emptyToNull(cell.customerSpecial),
      minOrderAmount: emptyToNull(cell.minOrderAmount),
      freeDeliveryEnabled: freeEnabled,
      freeDeliveryOver: freeEnabled ? emptyToNull(cell.freeDeliveryOver) : null,
    }
  }
  return { tiers }
}
