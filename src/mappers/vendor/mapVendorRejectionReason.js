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

/** Short display labels for rejected order cards. */
const REJECTION_REASON_LABELS = {
  OUT_OF_STOCK: 'Out of stock',
  KITCHEN_TOO_BUSY: 'Kitchen too busy',
  CLOSING_SOON: 'Closing soon',
  CANNOT_FULFILL: 'Cannot fulfil on time',
  BRANCH_UNAVAILABLE: 'Branch unavailable',
  FULLY_BOOKED: 'Fully booked',
  CANNOT_ACCOMMODATE_PARTY: 'Cannot accommodate party',
  CLOSED_FOR_DAY: 'Closed for the day',
  SPECIALIST_UNAVAILABLE: 'Specialist unavailable',
  OTHER: 'Other',
}

/**
 * Human-readable rejection reason for cards (e.g. "Out of stock").
 * @param {unknown} reason
 * @returns {string}
 */
export function formatRejectionReasonLabel(reason) {
  const raw = String(reason || '').trim()
  if (!raw) return ''
  if (/accept\s+sla\s+expired/i.test(raw)) return 'Accept SLA expired'
  if (/did not accept in time/i.test(raw)) return 'Accept SLA expired'
  if (/item\(s\)\s+out of stock/i.test(raw)) return 'Out of stock'

  const code = mapVendorRejectionReason(raw)
  if (code === 'OTHER' && /accept\s+sla/i.test(raw)) return 'Accept SLA expired'
  if (REJECTION_REASON_LABELS[code] && code !== 'OTHER') return REJECTION_REASON_LABELS[code]
  if (REJECTION_REASON_LABELS[code] && raw === code) return REJECTION_REASON_LABELS[code]
  if (code === 'OTHER' && raw !== 'OTHER' && !VALID_CODES.has(raw)) return raw
  if (REJECTION_REASON_LABELS[code]) return REJECTION_REASON_LABELS[code]
  return raw
}

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
