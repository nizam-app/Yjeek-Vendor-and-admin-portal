/**
 * Shared live-order timer helpers (accept countdown + prep elapsed).
 */

export function parseMmSsToSeconds(value) {
  if (value == null) return null
  const raw = String(value).trim()
  if (!raw) return null
  if (/^expired$/i.test(raw)) return 0

  const clock = raw.match(/^(\d+):(\d{2})$/)
  if (clock) return Number(clock[1]) * 60 + Number(clock[2])

  const minutesOnly = raw.match(/^(\d+)\s*min(?:ute)?s?$/i)
  if (minutesOnly) return Number(minutesOnly[1]) * 60

  const hoursMins = raw.match(/^(\d+)\s*h(?:ours?)?(?:\s+(\d+)\s*m(?:in(?:ute)?s?)?)?$/i)
  if (hoursMins) {
    const hours = Number(hoursMins[1])
    const mins = hoursMins[2] != null ? Number(hoursMins[2]) : 0
    return hours * 3600 + mins * 60
  }

  return null
}

export function formatAcceptCountdown(deadline, now = Date.now()) {
  if (deadline == null || deadline === '') return null
  const deadlineMs = typeof deadline === 'number' ? deadline : new Date(deadline).getTime()
  if (Number.isNaN(deadlineMs)) return null

  const remainingSeconds = Math.max(0, Math.ceil((deadlineMs - now) / 1000))
  if (remainingSeconds <= 0) return 'Expired'
  const minutes = Math.floor(remainingSeconds / 60)
  const seconds = remainingSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

export function formatPrepElapsed(startedAt, now = Date.now()) {
  if (startedAt == null || startedAt === '') return null
  const startedMs = typeof startedAt === 'number' ? startedAt : new Date(startedAt).getTime()
  if (Number.isNaN(startedMs)) return null

  const elapsedSeconds = Math.max(0, Math.floor((now - startedMs) / 1000))
  const minutes = Math.floor(elapsedSeconds / 60)
  const seconds = elapsedSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export function isPrepDelayed(startedAt, estimatedReadyMin, now = Date.now()) {
  if (startedAt == null || estimatedReadyMin == null || estimatedReadyMin === '') return false
  const startedMs = typeof startedAt === 'number' ? startedAt : new Date(startedAt).getTime()
  if (Number.isNaN(startedMs)) return false
  const limit = Number(estimatedReadyMin)
  if (Number.isNaN(limit)) return false
  return (now - startedMs) / 60000 > limit
}

/** Stable mock/API fallback anchors so timers keep ticking across board refreshes. */
const acceptDeadlineAnchors = new Map()
const prepStartAnchors = new Map()

function orderTimerKey(order) {
  return String(order?.backendId || order?.id || '')
}

export function resolveAcceptDeadlineMs(order, now = Date.now()) {
  if (!order) return null
  if (order.vendorAcceptDeadline) {
    const ms = new Date(order.vendorAcceptDeadline).getTime()
    return Number.isNaN(ms) ? null : ms
  }

  const key = orderTimerKey(order)
  if (!key || order.sla == null) return null
  if (acceptDeadlineAnchors.has(key)) return acceptDeadlineAnchors.get(key)

  const seconds = parseMmSsToSeconds(order.sla)
  if (seconds == null) return null
  const deadlineMs = now + seconds * 1000
  acceptDeadlineAnchors.set(key, deadlineMs)
  return deadlineMs
}

export function resolvePrepStartedMs(order, now = Date.now()) {
  if (!order) return null
  if (order.prepStartedAt) {
    const ms = new Date(order.prepStartedAt).getTime()
    return Number.isNaN(ms) ? null : ms
  }

  const key = orderTimerKey(order)
  if (!key || order.prepTime == null) return null
  if (prepStartAnchors.has(key)) return prepStartAnchors.get(key)

  const seconds = parseMmSsToSeconds(order.prepTime)
  if (seconds == null) return null
  const startedMs = now - seconds * 1000
  prepStartAnchors.set(key, startedMs)
  return startedMs
}

export function clearOrderTimerAnchors(orderId) {
  const key = String(orderId || '')
  if (!key) return
  acceptDeadlineAnchors.delete(key)
  prepStartAnchors.delete(key)
}
