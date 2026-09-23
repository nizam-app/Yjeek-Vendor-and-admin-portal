/** Mapper + validators for Automation → Pay on Delivery (P3B). */

export const DEFAULT_POD_PLATFORM_SETTINGS = {
  defaultMaxFloatBhd: 100,
  warningPercent: 90,
  enforceFloatBlock: true,
}

function asFiniteNumber(value, fallback = null) {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) return fallback
  return n
}

export function mapPodSettingsFromApi(raw) {
  const source =
    raw && typeof raw === 'object'
      ? raw.pod && typeof raw.pod === 'object'
        ? raw.pod
        : raw
      : {}
  const defaultMax = asFiniteNumber(source.defaultMaxFloatBhd, null)
  const warning = asFiniteNumber(source.warningPercent, null)
  return {
    defaultMaxFloatBhd:
      defaultMax != null && defaultMax > 0
        ? defaultMax
        : DEFAULT_POD_PLATFORM_SETTINGS.defaultMaxFloatBhd,
    warningPercent:
      warning != null && warning > 0 && warning <= 100
        ? warning
        : DEFAULT_POD_PLATFORM_SETTINGS.warningPercent,
    enforceFloatBlock:
      typeof source.enforceFloatBlock === 'boolean'
        ? source.enforceFloatBlock
        : DEFAULT_POD_PLATFORM_SETTINGS.enforceFloatBlock,
  }
}

export function mapPodSettingsToApiPatch(editable) {
  const defaultMaxFloatBhd = asFiniteNumber(editable?.defaultMaxFloatBhd?.value, NaN)
  const warningPercent = asFiniteNumber(editable?.warningThresholdPercent?.value, NaN)
  const enforceFloatBlock = Boolean(editable?.autoSuspendOnBreach)
  return {
    pod: {
      defaultMaxFloatBhd,
      warningPercent,
      enforceFloatBlock,
    },
  }
}

export function validatePodPlatformSettings(settings) {
  const maxFloat = asFiniteNumber(settings?.defaultMaxFloatBhd, NaN)
  const warning = asFiniteNumber(settings?.warningPercent, NaN)
  if (!Number.isFinite(maxFloat) || maxFloat <= 0) {
    return 'Default max float must be a number greater than 0.'
  }
  if (!Number.isFinite(warning) || warning <= 0 || warning > 100) {
    return 'Float warning threshold must be greater than 0 and less than or equal to 100.'
  }
  if (typeof settings?.enforceFloatBlock !== 'boolean') {
    return 'Auto float-block must be a boolean.'
  }
  return null
}

/**
 * Map Fleet champ list/detail POD fields into Automation table rows.
 * Does not invent dispute counts (P6).
 */
export function mapChampToPodRow(champ, settings = DEFAULT_POD_PLATFORM_SETTINGS) {
  if (!champ || typeof champ !== 'object') return null
  const pod = champ.pod && typeof champ.pod === 'object' ? champ.pod : {}
  const effectiveMax =
    asFiniteNumber(pod.effectiveMaxFloat, null) ??
    (asFiniteNumber(pod.maxFloat, 0) > 0
      ? asFiniteNumber(pod.maxFloat, 0)
      : settings.defaultMaxFloatBhd)
  const exposure =
    asFiniteNumber(pod.currentCashExposure, null) ??
    asFiniteNumber(pod.currentCashBalance, null)
  const podEnabled = pod.enabled === true || champ.podEnabled === true
  return {
    id: champ.id,
    name: champ.name || champ.displayCode || champ.id,
    displayCode: champ.displayCode ?? null,
    podEnabled,
    maxFloatBhd: effectiveMax,
    currentCashBhd: exposure,
    utilizationPercent: asFiniteNumber(pod.utilizationPercent, null),
    warningActive: pod.warningActive === true,
    floatBlocked: pod.floatBlocked === true,
    effectivePodEligible: pod.effectivePodEligible === true,
    blockedReason: pod.blockedReason ?? null,
    accountStatus: champ.accountStatus ?? null,
    status: champ.status ?? null,
    /** P6 — not available from Fleet yet */
    disputes30d: null,
  }
}

export function mapFleetChampsToPodRows(payload, settings) {
  const champs = Array.isArray(payload?.champs)
    ? payload.champs
    : Array.isArray(payload)
      ? payload
      : []
  return champs.map((row) => mapChampToPodRow(row, settings)).filter(Boolean)
}
