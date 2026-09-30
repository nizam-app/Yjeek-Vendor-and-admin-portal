/**
 * Champ delivery eligibility form helpers (OG §07 / D07 Batch 4).
 *
 * Progressive disclosure:
 * - Hot food only → no further questions
 * - Scheduled on → item class block (Normal only / Special only / Both)
 * - Normal included → store type multi-select (allowedCategories / hot-food dispatch)
 * - Special included → store types with Special items enabled (saved as specialStoreTypeIds)
 *
 * Rules:
 * - ≥1 order mode required
 * - Turning Scheduled off hides class blocks but keeps values
 * - Narrowing Both/Special → Normal only clears special-side values
 * - Narrowing Both/Normal → Special only clears normal store-type selection
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

/**
 * @deprecated Hardcoded handling labels. Special chips load from store types
 * with Special items enabled (`allowsSpecialItems`). Kept so older imports still resolve.
 */
export const CHAMP_SPECIAL_ITEM_TYPE_OPTIONS = []

export const CHAMP_MODE_REQUIRED_MESSAGE = 'At least one order mode must stay on'
export const CHAMP_SPECIAL_ITEM_TYPES_REQUIRED_MESSAGE =
  'At least one special item type is required when Special is included'
/** @deprecated Use CHAMP_SPECIAL_ITEM_TYPES_REQUIRED_MESSAGE — kept for tests/migrations */
export const CHAMP_SPECIAL_STORE_TYPES_REQUIRED_MESSAGE =
  CHAMP_SPECIAL_ITEM_TYPES_REQUIRED_MESSAGE

/** Default eligibility for new champs (matches backend Batch 1/2 defaults). */
export const EMPTY_CHAMP_ELIGIBILITY = {
  enabledModes: ['HOT_FOOD_ON_DEMAND', 'SCHEDULED'],
  scheduledClasses: 'NORMAL_ONLY',
  normalStoreTypeIds: [],
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
export function normalizeStoreTypeIds(value) {
  if (!Array.isArray(value)) return []
  const unique = []
  for (const item of value) {
    const id = String(item || '').trim()
    if (id && !unique.includes(id)) unique.push(id)
  }
  return unique
}

/** @deprecated alias */
export const normalizeSpecialStoreTypeIds = normalizeStoreTypeIds

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
  const normalStoreTypeIds = normalizeStoreTypeIds(
    src.normalStoreTypeIds !== undefined ? src.normalStoreTypeIds : [],
  )
  const specialStoreTypeIds = normalizeStoreTypeIds(src.specialStoreTypeIds)

  return {
    enabledModes:
      hasExplicitModes && src.enabledModes.length === 0
        ? []
        : enabledModes.length
          ? enabledModes
          : [...EMPTY_CHAMP_ELIGIBILITY.enabledModes],
    scheduledClasses: normalizeScheduledClasses(src.scheduledClasses),
    normalStoreTypeIds,
    specialStoreTypeIds,
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
export function isNormalIncluded(eligibility) {
  const classes = normalizeScheduledClasses(eligibility?.scheduledClasses)
  return classes === 'NORMAL_ONLY' || classes === 'BOTH'
}

/**
 * @param {{ scheduledClasses?: string }} eligibility
 */
export function isSpecialIncluded(eligibility) {
  const classes = normalizeScheduledClasses(eligibility?.scheduledClasses)
  return classes === 'SPECIAL_ONLY' || classes === 'BOTH'
}

/**
 * Progressive disclosure visibility (OG §07 + product split).
 * Hidden blocks retain values — callers must not clear on hide.
 */
export function getChampEligibilityVisibility(eligibility) {
  const scheduledOn = isScheduledModeOn(eligibility)
  const normalIncluded = isNormalIncluded(eligibility)
  const specialIncluded = isSpecialIncluded(eligibility)
  return {
    showScheduledClasses: scheduledOn,
    showNormalStoreTypes: scheduledOn && normalIncluded,
    showSpecialItemTypes: scheduledOn && specialIncluded,
    /** @deprecated */
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
 * Set scheduled classes. Clears selections that no longer apply (OG §07 rule 2 + normal/special split).
 *
 * @param {ReturnType<typeof normalizeChampEligibility>} current
 * @param {'NORMAL_ONLY'|'SPECIAL_ONLY'|'BOTH'} nextClasses
 */
export function applyChampScheduledClasses(current, nextClasses) {
  const eligibility = normalizeChampEligibility(current)
  const next = normalizeScheduledClasses(nextClasses)
  const prev = eligibility.scheduledClasses

  let normalStoreTypeIds = eligibility.normalStoreTypeIds
  let specialStoreTypeIds = eligibility.specialStoreTypeIds

  if (
    (prev === 'BOTH' || prev === 'SPECIAL_ONLY') &&
    next === 'NORMAL_ONLY'
  ) {
    specialStoreTypeIds = []
  }

  if (
    (prev === 'BOTH' || prev === 'NORMAL_ONLY') &&
    next === 'SPECIAL_ONLY'
  ) {
    normalStoreTypeIds = []
  }

  return {
    ...eligibility,
    scheduledClasses: next,
    normalStoreTypeIds,
    specialStoreTypeIds,
  }
}

/**
 * Toggle a store-type id in the Normal multi-select.
 *
 * @param {ReturnType<typeof normalizeChampEligibility>} current
 * @param {string} storeTypeId
 */
export function toggleChampNormalStoreType(current, storeTypeId) {
  const eligibility = normalizeChampEligibility(current)
  const id = String(storeTypeId || '').trim()
  if (!id) return eligibility

  const has = eligibility.normalStoreTypeIds.includes(id)
  return {
    ...eligibility,
    normalStoreTypeIds: has
      ? eligibility.normalStoreTypeIds.filter((item) => item !== id)
      : [...eligibility.normalStoreTypeIds, id],
  }
}

/** @deprecated use toggleChampNormalStoreType */
export const toggleChampSpecialStoreType = toggleChampNormalStoreType

/**
 * Select every published store type in the Normal multi-select.
 *
 * @param {unknown} current
 * @param {Array<{ id?: string }>} storeTypeOptions
 */
export function selectAllChampNormalStoreTypes(current, storeTypeOptions) {
  const eligibility = normalizeChampEligibility(current)
  const ids = []
  for (const item of storeTypeOptions || []) {
    const id = String(item?.id || '').trim()
    if (id && !ids.includes(id)) ids.push(id)
  }
  return {
    ...eligibility,
    normalStoreTypeIds: ids,
  }
}

/**
 * Clear every normal store type in the multi-select.
 *
 * @param {unknown} current
 */
export function clearAllChampNormalStoreTypes(current) {
  const eligibility = normalizeChampEligibility(current)
  return {
    ...eligibility,
    normalStoreTypeIds: [],
  }
}

/** @deprecated use selectAllChampNormalStoreTypes */
export const selectAllChampSpecialStoreTypes = selectAllChampNormalStoreTypes

function normalizeSpecialItemLabel(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

/**
 * Store type may carry special items (Store Management → Item classes → Special items).
 * Missing flag follows the schema default (special enabled).
 *
 * @param {{ allowsSpecialItems?: boolean, itemClasses?: { allowsSpecialItems?: boolean } }} storeType
 */
export function storeTypeAllowsSpecialItems(storeType) {
  if (!storeType || typeof storeType !== 'object') return false
  if (storeType.allowsSpecialItems === false) return false
  if (storeType.itemClasses && storeType.itemClasses.allowsSpecialItems === false) return false
  return true
}

/**
 * Published store types the champ may be allowed to carry as special.
 *
 * @param {Array<{ id?: string, name?: string, slug?: string, allowsSpecialItems?: boolean }>} storeTypeOptions
 */
export function specialStoreTypeOptions(storeTypeOptions) {
  const options = []
  for (const item of storeTypeOptions || []) {
    const id = String(item?.id || '').trim()
    if (!id || !storeTypeAllowsSpecialItems(item)) continue
    options.push(item)
  }
  return options
}

/**
 * Map selected special chips (store-type ids, or legacy names/slugs) → Category ids.
 * Only store types with Special items enabled are eligible.
 *
 * @param {string[]} labels
 * @param {Array<{ id?: string, name?: string, slug?: string, allowsSpecialItems?: boolean }>} storeTypeOptions
 */
export function mapSpecialItemTypesToStoreTypeIds(labels, storeTypeOptions) {
  const selected = (labels || []).map((item) => String(item || '').trim()).filter(Boolean)
  if (!selected.length) return []

  const allowed = specialStoreTypeOptions(storeTypeOptions)
  const ids = []

  for (const label of selected) {
    const key = normalizeSpecialItemLabel(label)
    for (const storeType of allowed) {
      const id = String(storeType?.id || '').trim()
      if (!id || ids.includes(id)) continue
      const name = normalizeSpecialItemLabel(storeType.name)
      const slug = normalizeSpecialItemLabel(storeType.slug).replace(/-/g, ' ')
      if (label === id || name === key || slug === key) {
        ids.push(id)
      }
    }
  }

  return ids
}

/**
 * Map normal store-type ids → allowedCategories slugs when the Normal block is visible.
 * Returns `null` when normal store types are not driven by eligibility (legacy slugs only).
 *
 * @param {unknown} eligibility
 * @param {Array<{ id?: string, slug?: string }>} storeTypeOptions
 * @returns {string[] | null}
 */
export function champAllowedCategorySlugsFromEligibility(eligibility, storeTypeOptions) {
  const normalized = normalizeChampEligibility(eligibility)
  const { showNormalStoreTypes } = getChampEligibilityVisibility(normalized)
  if (!showNormalStoreTypes) return null

  const slugById = new Map()
  for (const item of storeTypeOptions || []) {
    const id = String(item?.id || '').trim()
    const slug = String(item?.slug || '').trim()
    if (id && slug) slugById.set(id, slug)
  }

  const slugs = []
  for (const id of normalized.normalStoreTypeIds) {
    const slug = slugById.get(id)
    if (slug && !slugs.includes(slug)) slugs.push(slug)
  }
  return slugs
}

/**
 * Client-side progressive validation (mirrors backend resolveChampEligibility).
 * @param {unknown} input
 * @param {{ specialItemTypes?: string[], storeTypeOptions?: Array<{ id?: string, name?: string, slug?: string }> }} [context]
 */
export function validateChampEligibility(input, context = {}) {
  const eligibility = normalizeChampEligibility(input)
  if (eligibility.enabledModes.length === 0) {
    return { ok: false, message: CHAMP_MODE_REQUIRED_MESSAGE, eligibility }
  }

  const { showSpecialItemTypes } = getChampEligibilityVisibility(eligibility)
  const specialItemTypes = Array.isArray(context.specialItemTypes)
    ? context.specialItemTypes
    : []
  if (showSpecialItemTypes && specialItemTypes.length === 0) {
    return {
      ok: false,
      message: CHAMP_SPECIAL_ITEM_TYPES_REQUIRED_MESSAGE,
      eligibility,
    }
  }

  if (showSpecialItemTypes && specialItemTypes.length > 0) {
    const storeTypeOptions = context.storeTypeOptions || []
    const mapped = mapSpecialItemTypesToStoreTypeIds(specialItemTypes, storeTypeOptions)
    if (!mapped.length) {
      return {
        ok: false,
        message: 'Could not map special item types to store types. Refresh store types and try again.',
        eligibility,
      }
    }
  }

  return { ok: true, eligibility }
}

/**
 * Build create/PATCH eligibility fields.
 * Always emits all three keys so edit/create stay consistent.
 *
 * @param {unknown} input
 * @param {{ specialItemTypes?: string[], storeTypeOptions?: Array<{ id?: string, name?: string, slug?: string }> }} [context]
 */
export function buildChampEligibilityPayload(input, context = {}) {
  const { ok, message, eligibility } = validateChampEligibility(input, context)
  if (!ok) {
    const err = new Error(message)
    err.code = 'CHAMP_ELIGIBILITY_INVALID'
    throw err
  }

  const specialIncluded = isSpecialIncluded(eligibility)
  const specialItemTypes = Array.isArray(context.specialItemTypes)
    ? context.specialItemTypes
    : []
  const specialStoreTypeIds = specialIncluded
    ? mapSpecialItemTypesToStoreTypeIds(
        specialItemTypes,
        context.storeTypeOptions || [],
      )
    : []

  return {
    enabledModes: [...eligibility.enabledModes],
    scheduledClasses: eligibility.scheduledClasses,
    specialStoreTypeIds,
  }
}
