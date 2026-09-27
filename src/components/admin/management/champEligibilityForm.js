/**
 * Champ delivery eligibility form helpers (OG §07 / D07 Batch 4).
 *
 * Progressive disclosure:
 * - Hot food only → no further questions
 * - Scheduled on → item class block (Normal only / Special only / Both)
 * - Special included → store type multi-select (live from Store Management)
 *
 * Rules:
 * - ≥1 order mode required
 * - Turning Scheduled off hides class + store-type blocks but keeps values
 * - Narrowing Both/Special → Normal only clears store type selection
 * - Store type list is never hardcoded
 */

export const DRIVER_ORDER_MODES = ['HOT_FOOD_ON_DEMAND', 'SCHEDULED']

export const CHAMP_SCHEDULED_CLASSES = ['NORMAL_ONLY', 'SPECIAL_ONLY', 'BOTH']

export const CHAMP_ORDER_MODE_OPTIONS = [
  {
    key: 'HOT_FOOD_ON_DEMAND',
    label: 'Hot food — on demand',
  },
  {
    key: 'SCHEDULED',
    label: 'Scheduled',
  },
]

export const CHAMP_SCHEDULED_CLASS_OPTIONS = [
  { key: 'NORMAL_ONLY', label: 'Normal only' },
  { key: 'SPECIAL_ONLY', label: 'Special only' },
  { key: 'BOTH', label: 'Both' },
]

export const CHAMP_MODE_REQUIRED_MESSAGE = 'At least one order mode must stay on'
export const CHAMP_SPECIAL_STORE_TYPES_REQUIRED_MESSAGE =
  'At least one special store type is required when Special is included'

/** Default eligibility for new champs (matches backend Batch 1/2 defaults). */
export const EMPTY_CHAMP_ELIGIBILITY = {
  enabledModes: ['HOT_FOOD_ON_DEMAND', 'SCHEDULED'],
  scheduledClasses: 'NORMAL_ONLY',
  specialStoreTypeIds: [],
}

/**
 * @param {unknown} value
 * @returns {string[]}
 */
export function normalizeEnabledModes(value) {
  const raw = Array.isArray(value) ? value : []
  const unique = []
  for (const item of raw) {
    const mode = String(item || '').trim().toUpperCase()
    if (
      (mode === 'HOT_FOOD_ON_DEMAND' || mode === 'SCHEDULED') &&
      !unique.includes(mode)
    ) {
      unique.push(mode)
    }
  }
  return unique
}

/**
 * @param {unknown} value
 * @returns {'NORMAL_ONLY'|'SPECIAL_ONLY'|'BOTH'}
 */
export function normalizeScheduledClasses(value) {
  const raw = String(value || '').trim().toUpperCase()
  if (raw === 'SPECIAL_ONLY' || raw === 'BOTH' || raw === 'NORMAL_ONLY') return raw
  return 'NORMAL_ONLY'
}

/**
 * @param {unknown} value
 * @returns {string[]}
 */
export function normalizeSpecialStoreTypeIds(value) {
  if (!Array.isArray(value)) return []
  const unique = []
  for (const item of value) {
    const id = String(item || '').trim()
    if (id && !unique.includes(id)) unique.push(id)
  }
  return unique
}

/**
 * Normalize API `profile.eligibility` (or form slice) → form shape.
 * Explicit empty `enabledModes: []` is preserved so validation can reject it.
 * Missing / undefined modes fall back to both modes (Batch 1/2 default).
 * @param {unknown} input
 */
export function normalizeChampEligibility(input) {
  const src =
    input && typeof input === 'object'
      ? input.eligibility && typeof input.eligibility === 'object'
        ? input.eligibility
        : input
      : {}

  const hasExplicitModes = Array.isArray(src.enabledModes)
  const enabledModes = normalizeEnabledModes(src.enabledModes)
  return {
    enabledModes:
      hasExplicitModes && src.enabledModes.length === 0
        ? []
        : enabledModes.length
          ? enabledModes
          : [...EMPTY_CHAMP_ELIGIBILITY.enabledModes],
    scheduledClasses: normalizeScheduledClasses(src.scheduledClasses),
    specialStoreTypeIds: normalizeSpecialStoreTypeIds(src.specialStoreTypeIds),
  }
}

/**
 * @param {{ enabledModes?: string[] }} eligibility
 */
export function isScheduledModeOn(eligibility) {
  return normalizeEnabledModes(eligibility?.enabledModes).includes('SCHEDULED')
}

/**
 * @param {{ scheduledClasses?: string }} eligibility
 */
export function isSpecialIncluded(eligibility) {
  const classes = normalizeScheduledClasses(eligibility?.scheduledClasses)
  return classes === 'SPECIAL_ONLY' || classes === 'BOTH'
}

/**
 * Progressive disclosure visibility (OG §07).
 * Hidden blocks retain values — callers must not clear on hide.
 */
export function getChampEligibilityVisibility(eligibility) {
  const scheduledOn = isScheduledModeOn(eligibility)
  const specialIncluded = isSpecialIncluded(eligibility)
  return {
    showScheduledClasses: scheduledOn,
    showSpecialStoreTypes: scheduledOn && specialIncluded,
  }
}

/**
 * Toggle an order mode. Keeps scheduled class + store-type ids when Scheduled turns off.
 * Refuses to turn off the last remaining mode.
 *
 * @param {ReturnType<typeof normalizeChampEligibility>} current
 * @param {'HOT_FOOD_ON_DEMAND'|'SCHEDULED'} mode
 * @param {boolean} nextOn
 */
export function applyChampModeToggle(current, mode, nextOn) {
  const eligibility = normalizeChampEligibility(current)
  const modeKey = String(mode || '').trim().toUpperCase()
  if (modeKey !== 'HOT_FOOD_ON_DEMAND' && modeKey !== 'SCHEDULED') {
    return eligibility
  }

  let enabledModes = [...eligibility.enabledModes]
  if (nextOn) {
    if (!enabledModes.includes(modeKey)) enabledModes.push(modeKey)
  } else {
    enabledModes = enabledModes.filter((item) => item !== modeKey)
    if (enabledModes.length === 0) {
      return eligibility
    }
  }

  return {
    ...eligibility,
    enabledModes,
  }
}

/**
 * Set scheduled classes. Both/Special → Normal only clears store type selection (OG §07 rule 2).
 *
 * @param {ReturnType<typeof normalizeChampEligibility>} current
 * @param {'NORMAL_ONLY'|'SPECIAL_ONLY'|'BOTH'} nextClasses
 */
export function applyChampScheduledClasses(current, nextClasses) {
  const eligibility = normalizeChampEligibility(current)
  const next = normalizeScheduledClasses(nextClasses)
  const prev = eligibility.scheduledClasses

  let specialStoreTypeIds = eligibility.specialStoreTypeIds
  if (
    (prev === 'BOTH' || prev === 'SPECIAL_ONLY') &&
    next === 'NORMAL_ONLY'
  ) {
    specialStoreTypeIds = []
  }

  return {
    ...eligibility,
    scheduledClasses: next,
    specialStoreTypeIds,
  }
}

/**
 * Toggle a store-type id in the Special multi-select.
 *
 * @param {ReturnType<typeof normalizeChampEligibility>} current
 * @param {string} storeTypeId
 */
export function toggleChampSpecialStoreType(current, storeTypeId) {
  const eligibility = normalizeChampEligibility(current)
  const id = String(storeTypeId || '').trim()
  if (!id) return eligibility

  const has = eligibility.specialStoreTypeIds.includes(id)
  return {
    ...eligibility,
    specialStoreTypeIds: has
      ? eligibility.specialStoreTypeIds.filter((item) => item !== id)
      : [...eligibility.specialStoreTypeIds, id],
  }
}

/**
 * Client-side progressive validation (mirrors backend resolveChampEligibility).
 * @param {unknown} input
 * @returns {{ ok: true, eligibility: ReturnType<typeof normalizeChampEligibility> } | { ok: false, message: string, eligibility: ReturnType<typeof normalizeChampEligibility> }}
 */
export function validateChampEligibility(input) {
  const eligibility = normalizeChampEligibility(input)
  if (eligibility.enabledModes.length === 0) {
    return { ok: false, message: CHAMP_MODE_REQUIRED_MESSAGE, eligibility }
  }

  const { showSpecialStoreTypes } = getChampEligibilityVisibility(eligibility)
  if (showSpecialStoreTypes && eligibility.specialStoreTypeIds.length === 0) {
    return {
      ok: false,
      message: CHAMP_SPECIAL_STORE_TYPES_REQUIRED_MESSAGE,
      eligibility,
    }
  }

  return { ok: true, eligibility }
}

/**
 * Build create/PATCH eligibility fields.
 * Always emits all three keys so edit/create stay consistent.
 *
 * @param {unknown} input
 */
export function buildChampEligibilityPayload(input) {
  const { ok, message, eligibility } = validateChampEligibility(input)
  if (!ok) {
    const err = new Error(message)
    err.code = 'CHAMP_ELIGIBILITY_INVALID'
    throw err
  }
  return {
    enabledModes: [...eligibility.enabledModes],
    scheduledClasses: eligibility.scheduledClasses,
    specialStoreTypeIds: [...eligibility.specialStoreTypeIds],
  }
}
