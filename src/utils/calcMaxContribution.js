/**
 * Max contribution = delivery contribution + extra × max(0, maxDistance − radius)
 * Returns a 3-decimal string for BHD inputs, or null when inputs are incomplete/invalid.
 */
export function calcMaxContribution({
  deliveryContribution,
  extraContributionPerKm,
  maxDistanceKm,
  deliveryRadiusKm,
} = {}) {
  const base = Number(deliveryContribution)
  const extra = Number(extraContributionPerKm)
  const maxDistance = Number(maxDistanceKm)
  const radius = Number(deliveryRadiusKm)

  if (![base, extra, maxDistance, radius].every((n) => Number.isFinite(n))) {
    return null
  }

  const extraKm = Math.max(0, maxDistance - radius)
  return (base + extra * extraKm).toFixed(3)
}

/**
 * Max distance must be ≥ delivery radius when both are numeric.
 * Returns an error message string, or null when valid / incomplete.
 */
export function maxDistanceBelowRadiusError({
  maxDistanceKm,
  deliveryRadiusKm,
  scopeLabel = 'Max distance',
} = {}) {
  const maxDistance = Number(maxDistanceKm)
  const radius = Number(deliveryRadiusKm)
  if (![maxDistance, radius].every((n) => Number.isFinite(n))) return null
  if (maxDistance < radius) {
    return `${scopeLabel} cannot be less than delivery radius (${radius} km).`
  }
  return null
}
