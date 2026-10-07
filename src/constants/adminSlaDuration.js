/** SLA admin duration inputs — not clock time; hours may exceed 23. */
export const SLA_DURATION_HOUR_MAX = 999

/** Matches backend `durationSec` zod max (720 h). Values above this fail publish. */
export const SLA_DURATION_SEC_MAX = 2_592_000

export function formatSlaDurationHours(hours) {
  const h = Math.max(0, Math.min(SLA_DURATION_HOUR_MAX, Math.floor(Number(hours) || 0)))
  if (h > 99) return String(h)
  return String(h).padStart(2, '0')
}

export function clampSlaDurationSec(seconds) {
  const sec = Math.max(0, Math.round(Number(seconds) || 0))
  return Math.min(SLA_DURATION_SEC_MAX, sec)
}
