/**
 * Vendor operational status — reference only (Automation → Vendor Status).
 * Live values live on VendorLocation / Vendor Admin — not DispatchRuleSet.
 *
 * Schema: BranchOperationalStatus (OPEN | BUSY | CLOSED | LAST_ORDER_REACHED | TEMPORARILY_CLOSED)
 * Hours: VendorLocation.openingHours JSON per day — keys open, lastOrder, close
 */

export const BRANCH_OPERATIONAL_STATUS = Object.freeze({
  OPEN: 'OPEN',
  BUSY: 'BUSY',
  CLOSED: 'CLOSED',
  LAST_ORDER_REACHED: 'LAST_ORDER_REACHED',
  TEMPORARILY_CLOSED: 'TEMPORARILY_CLOSED',
})

/** Day-of-week keys inside openingHours (Bahrain). */
export const OPENING_HOURS_DAY_KEYS = Object.freeze([
  'sun',
  'mon',
  'tue',
  'wed',
  'thu',
  'fri',
  'sat',
])

/**
 * Per-day shape inside VendorLocation.openingHours.
 * lastOrder is distinct from close — never treat them as the same field.
 */
export const OPENING_HOURS_TIME_KEYS = Object.freeze({
  open: 'open',
  lastOrder: 'lastOrder',
  close: 'close',
})

/** Checkout is allowed only when the branch is effectively Open. */
export function isCheckoutAllowedForOperationalStatus(status) {
  return String(status || '').toUpperCase() === BRANCH_OPERATIONAL_STATUS.OPEN
}
