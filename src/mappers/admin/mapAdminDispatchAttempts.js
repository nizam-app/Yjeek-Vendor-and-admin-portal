import { ApiError } from '../../api/errors'

function formatClock(value) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

/**
 * Map one dispatch attempt item defensively.
 * Confirmed list envelope: data is an array (may be empty).
 * Non-empty item shape not fully screenshot-confirmed — only pass through known keys.
 */
export function mapAdminDispatchAttemptItem(item) {
  if (!item || typeof item !== 'object') return null

  const id = item.id ?? item.attemptId ?? null
  const champName =
    item.champName ||
    item.driverName ||
    item.champ?.name ||
    item.driver?.name ||
    null
  const driverId =
    item.driverId ||
    item.champId ||
    item.champ?.id ||
    item.driver?.id ||
    null
  const status = item.status || item.outcome || item.result || null
  const score =
    item.score != null && item.score !== '' && !Number.isNaN(Number(item.score))
      ? Number(item.score)
      : null
  const at = item.offeredAt || item.createdAt || item.at || null

  const titleParts = [champName, driverId].filter(Boolean)
  const metaParts = [
    status ? String(status) : null,
    score != null ? `score ${score}` : null,
    formatClock(at),
  ].filter(Boolean)

  return {
    id: id != null ? String(id) : null,
    champName: champName ? String(champName) : null,
    driverId: driverId ? String(driverId) : null,
    status: status ? String(status) : null,
    score,
    scoreBreakdown:
      item.scoreBreakdown && typeof item.scoreBreakdown === 'object'
        ? item.scoreBreakdown
        : null,
    at,
    atLabel: formatClock(at),
    title: titleParts.length ? titleParts.join(' · ') : id != null ? String(id) : 'Attempt',
    meta: metaParts.join(' · ') || '—',
    raw: item,
  }
}

/**
 * Map GET /admin/orders/:orderId/dispatch-attempts `data`.
 * Confirmed: `{ success: true, data: [] }` — empty array is valid.
 */
export function mapAdminDispatchAttemptsResponse(data) {
  const raw = Array.isArray(data)
    ? data
    : data && typeof data === 'object' && Array.isArray(data.attempts)
      ? data.attempts
      : data && typeof data === 'object' && Array.isArray(data.items)
        ? data.items
        : null

  if (raw === null) {
    throw new ApiError({
      message: 'Invalid dispatch attempts response from the server.',
    })
  }

  return {
    attempts: raw.map(mapAdminDispatchAttemptItem).filter(Boolean),
    count: raw.length,
  }
}

export function emptyAdminDispatchAttempts() {
  return { attempts: [], count: 0 }
}
