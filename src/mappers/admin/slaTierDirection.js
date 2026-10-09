/** Metrics where UI uses ≥ and tiers decrease: target ≥ atRisk ≥ critical (seconds). */
export const HIGHER_TIER_ORDERING_FORM_KEYS = new Set([
  'dailyOnline',
  'reservationNotice',
  'orderHold',
  'advanceCancel',
  'workingHours',
])

/** API config keys using higher-is-better tier ordering (must match backend durationTierFieldHigherIsBetter). */
export const HIGHER_TIER_ORDERING_API_KEYS = new Set([
  'earlyOnlineHoursSec',
  'workingHoursDailySec',
  'noShowGraceSec',
  'latePickupGraceSec',
  'leadTimeForCancellationsSec',
])

export const LOWER_TIER_AT_RISK_RATIO = 1.67
export const LOWER_TIER_CRITICAL_RATIO = 2.5
export const HIGHER_TIER_AT_RISK_RATIO = 0.8
export const HIGHER_TIER_CRITICAL_RATIO = 0.6

export function isHigherTierOrderingFormKey(fieldKey) {
  return HIGHER_TIER_ORDERING_FORM_KEYS.has(fieldKey)
}

export function isHigherTierOrderingApiKey(metricKey) {
  return HIGHER_TIER_ORDERING_API_KEYS.has(metricKey)
}

export function deriveTierSecondsFromTarget(targetSec, higherTierOrdering) {
  const target = Math.max(0, Math.round(targetSec))
  if (higherTierOrdering) {
    const atRisk = Math.min(target, Math.round(target * HIGHER_TIER_AT_RISK_RATIO))
    const critical = Math.min(atRisk, Math.round(target * HIGHER_TIER_CRITICAL_RATIO))
    return { target, atRisk, critical }
  }
  const atRisk = Math.max(target, Math.round(target * LOWER_TIER_AT_RISK_RATIO))
  const critical = Math.max(atRisk, Math.round(target * LOWER_TIER_CRITICAL_RATIO))
  return { target, atRisk, critical }
}

export function isHigherTierOrderingFromOperators(formTier, field) {
  const fromForm =
    formTier?.target?.operator ??
    formTier?.atRisk?.operator ??
    formTier?.critical?.operator ??
    formTier?.operator
  const fromDefault =
    field?.default?.target?.operator ?? field?.default?.operator ?? field?.default?.atRisk?.operator
  return (fromForm || fromDefault) === '≥'
}

export function resolveHigherTierOrdering(fieldKey, formTier, field) {
  if (fieldKey && isHigherTierOrderingFormKey(fieldKey)) return true
  return isHigherTierOrderingFromOperators(formTier, field)
}

export function resolveHigherTierOrderingFromFormTier(formTier, fieldKey) {
  if (fieldKey && isHigherTierOrderingFormKey(fieldKey)) return true
  const op =
    formTier?.target?.operator ??
    formTier?.atRisk?.operator ??
    formTier?.critical?.operator ??
    formTier?.operator
  return op === '≥'
}
