/**
 * Champ status terminology (Phase A6) — display/reference only.
 * Stored runtime values remain ONLINE / BUSY / OFFLINE (Champ app contracts unchanged).
 */

export const CHAMP_STATUS_RUNTIME_TO_BUYER = Object.freeze({
  ONLINE: 'AVAILABLE',
  BUSY: 'ON_ORDER',
  OFFLINE: 'OFFLINE',
  FLEET_OCCUPIED: 'FLEET_OCCUPIED',
  ON_BREAK: 'ON_BREAK',
  SUSPENDED: 'SUSPENDED',
})

/** Dispatch Gate 1 internal alias — BUSY → OCCUPIED (eligibility unchanged). */
export const CHAMP_STATUS_RUNTIME_TO_DISPATCH = Object.freeze({
  ONLINE: 'AVAILABLE',
  BUSY: 'OCCUPIED',
  OFFLINE: 'OFFLINE',
  FLEET_OCCUPIED: 'FLEET_OCCUPIED',
  ON_BREAK: 'ON_BREAK',
  SUSPENDED: 'SUSPENDED',
})

export function toBuyerChampStatus(runtimeStatus) {
  const key = String(runtimeStatus || '').toUpperCase()
  return CHAMP_STATUS_RUNTIME_TO_BUYER[key] || key || null
}

export function toDispatchOperationalStatus(runtimeStatus) {
  const key = String(runtimeStatus || '').toUpperCase()
  return CHAMP_STATUS_RUNTIME_TO_DISPATCH[key] || key || null
}

/** Free = AVAILABLE + activeOrderCount === 0 (runtime ONLINE). */
export function isChampFree({ status, activeOrderCount }) {
  return toBuyerChampStatus(status) === 'AVAILABLE' && Number(activeOrderCount) === 0
}

export function formatBuyerChampDisplayStatus({ status, activeOrderCount, stackCap }) {
  const buyer = toBuyerChampStatus(status)
  const n = Math.max(0, Math.floor(Number(activeOrderCount) || 0))
  if (buyer !== 'ON_ORDER') {
    if (buyer === 'AVAILABLE' && n === 0) return 'AVAILABLE · Free'
    return buyer
  }
  if (n <= 1) return 'ON_ORDER'
  const cap = stackCap != null ? Number(stackCap) : null
  const atCap = cap != null && Number.isFinite(cap) && n >= cap
  return atCap ? `ON_ORDER · STACKED (${n}) · AT CAP` : `ON_ORDER · STACKED (${n})`
}
