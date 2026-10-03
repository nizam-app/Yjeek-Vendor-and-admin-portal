/**
 * Mirrors backend resolveDeliveryFee hot-food math (delivery-fee.calculator.ts).
 * Used for admin live previews — checkout uses the API quote.
 */

function roundMoney(value) {
  return Math.round(Number(value) * 1000) / 1000
}

export function billableExtraKmCount(distanceKm, radiusKm, maxDistanceKm) {
  const d = Number(distanceKm)
  const r = Number(radiusKm)
  const max = Number(maxDistanceKm)
  if (![d, r, max].every(Number.isFinite)) return null
  const capped = Math.min(d, max)
  return Math.max(0, capped - r)
}

/**
 * @returns {{ total: number, base: number, extraKm: number, extraFee: number, outOfRange: boolean } | null}
 */
export function calcHotFoodSideFee({
  distanceKm,
  radiusKm,
  maxDistanceKm,
  contribution,
  extraPerKm,
}) {
  const d = Number(distanceKm)
  const radius = Number(radiusKm)
  const max = Number(maxDistanceKm)
  const base = Number(contribution)
  const extra = Number(extraPerKm)
  if (![d, radius, max, base, extra].every(Number.isFinite)) return null

  const outOfRange = d > max
  const extraKm = billableExtraKmCount(d, radius, max)
  const extraFee = roundMoney(extraKm * extra)
  const total = roundMoney(base + extraFee)
  return { total, base: roundMoney(base), extraKm, extraFee, outOfRange }
}

export function formatBhd3(value) {
  if (value == null || Number.isNaN(Number(value))) return '—'
  return Number(value).toFixed(3)
}
