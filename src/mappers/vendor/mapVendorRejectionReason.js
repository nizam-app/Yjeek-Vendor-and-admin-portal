/**
 * Vendor rejection reasons — UI labels ↔ VendorRejectionReason enum.
 * POST /vendor-panel/orders/:id/reject expects the enum code, not the label.
 */

export const VENDOR_REJECTION_REASONS = {
  OUT_OF_STOCK: 'OUT_OF_STOCK',
  KITCHEN_TOO_BUSY: 'KITCHEN_TOO_BUSY',
  CLOSING_SOON: 'CLOSING_SOON',
  CANNOT_FULFILL: 'CANNOT_FULFILL',
  BRANCH_UNAVAILABLE: 'BRANCH_UNAVAILABLE',
  FULLY_BOOKED: 'FULLY_BOOKED',
  CANNOT_ACCOMMODATE_PARTY: 'CANNOT_ACCOMMODATE_PARTY',
  CLOSED_FOR_DAY: 'CLOSED_FOR_DAY',
  SPECIALIST_UNAVAILABLE: 'SPECIALIST_UNAVAILABLE',
  OTHER: 'OTHER',
}

/** @type {{ code: string, label: string }[]} */
export const DELIVERY_REJECT_REASONS = [
  { code: 'OUT_OF_STOCK', label: 'Item(s) out of stock' },
  { code: 'KITCHEN_TOO_BUSY', label: 'Kitchen too busy right now' },
  { code: 'CLOSING_SOON', label: 'Closing soon' },
  { code: 'CANNOT_FULFILL', label: 'Cannot fulfil on time' },
  { code: 'OTHER', label: 'Price / menu error' },
  { code: 'OTHER', label: 'Other (please specify)' },
]

/** @type {{ code: string, label: string }[]} */
export const DINE_IN_REJECT_REASONS = [
  { code: 'FULLY_BOOKED', label: 'Fully booked — no tables' },
  { code: 'KITCHEN_TOO_BUSY', label: 'Kitchen too busy right now' },
  { code: 'CLOSING_SOON', label: 'Closing soon' },
  { code: 'CANNOT_ACCOMMODATE_PARTY', label: 'Cannot accommodate party size' },
  { code: 'CLOSED_FOR_DAY', label: 'Closed for the day' },
  { code: 'OTHER', label: 'Other (please specify)' },
]

const LABEL_TO_CODE = new Map(
  [...DELIVERY_REJECT_REASONS, ...DINE_IN_REJECT_REASONS].map((item) => [
    item.label.toLowerCase(),
    item.code,
  ]),
)

const VALID_CODES = new Set(Object.values(VENDOR_REJECTION_REASONS))

/**
 * Normalize a UI reason (label or code) to the API enum value.
 * @param {unknown} reason
 * @returns {string}
 */
export function mapVendorRejectionReason(reason) {
  const raw = String(reason || '').trim()
  if (!raw) return ''

  const asCode = raw.toUpperCase().replace(/[\s-]+/g, '_')
  if (VALID_CODES.has(asCode)) return asCode
  if (VALID_CODES.has(raw)) return raw

  const fromLabel = LABEL_TO_CODE.get(raw.toLowerCase())
  if (fromLabel) return fromLabel

  // Soft fallbacks for slight copy differences
  if (/out of stock/i.test(raw)) return 'OUT_OF_STOCK'
  if (/kitchen too busy/i.test(raw)) return 'KITCHEN_TOO_BUSY'
  if (/closing soon/i.test(raw)) return 'CLOSING_SOON'
  if (/fully booked/i.test(raw)) return 'FULLY_BOOKED'
  if (/party size|accommodate/i.test(raw)) return 'CANNOT_ACCOMMODATE_PARTY'
  if (/closed for the day/i.test(raw)) return 'CLOSED_FOR_DAY'
  if (/branch unavailable/i.test(raw)) return 'BRANCH_UNAVAILABLE'
  if (/specialist/i.test(raw)) return 'SPECIALIST_UNAVAILABLE'
  if (/cannot fulfil|cannot fulfill|menu error|price/i.test(raw)) return 'CANNOT_FULFILL'
  if (/other/i.test(raw)) return 'OTHER'

  return 'OTHER'
}
