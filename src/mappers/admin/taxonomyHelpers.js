/**
 * Pure taxonomy helpers for Add Champ / Add Vendor (Rule 5 / Rule 9).
 * Kept free of ApiError and other Vite-extensionless imports so Node can unit-test.
 */

/**
 * Normalize champ allowedCategories to lowercase store-type slugs (and `*`).
 * @param {unknown} list
 * @returns {string[]}
 */
export function normalizeChampAllowedCategorySlugs(list) {
  if (!Array.isArray(list)) return []
  const out = []
  const seen = new Set()
  for (const item of list) {
    let raw = ''
    if (typeof item === 'string') {
      raw = item
    } else if (item && typeof item === 'object') {
      raw = item.slug ?? item.value ?? ''
    }
    const slug = String(raw || '').trim().toLowerCase()
    if (!slug || seen.has(slug)) continue
    seen.add(slug)
    out.push(slug)
  }
  return out
}

/**
 * Resolve selected store-type slugs for the Add/Edit Champ form.
 * Prefers API `allowedStoreTypes` ({ id, name, slug }), else raw slug strings.
 * @param {unknown} allowedStoreTypes
 * @param {unknown} allowedCategories
 * @returns {string[]}
 */
export function resolveChampSelectedSlugs(allowedStoreTypes, allowedCategories) {
  if (Array.isArray(allowedStoreTypes) && allowedStoreTypes.length) {
    return normalizeChampAllowedCategorySlugs(allowedStoreTypes)
  }
  return normalizeChampAllowedCategorySlugs(allowedCategories)
}

/**
 * Fleet list category filter options from Store Management (slug value, name label).
 * @param {Array<{ name?: string, slug?: string|null }>|null|undefined} storeTypes
 * @returns {{ value: string, label: string }[]}
 */
export function buildFleetCategoryFilterOptions(storeTypes) {
  const options = [{ value: '', label: 'Categories' }]
  if (!Array.isArray(storeTypes)) return options

  for (const type of storeTypes) {
    const slug = String(type?.slug || '').trim().toLowerCase()
    const name = String(type?.name || '').trim()
    if (!slug || !name) continue
    options.push({ value: slug, label: name })
  }
  return options
}

/**
 * Rule 5 UI: cross-list under platform Services (Food + Services mode) needs serviceSubTypeId.
 * Dedicated service store types (slug `services` or TWO_LEVEL with own sub-types) use store sub-type instead.
 * @param {{ slug?: string|null, structure?: string, subTypes?: unknown[] }|string|null|undefined} storeTypeOrSlug
 * @param {boolean} servicesModeEnabled
 * @returns {boolean}
 */
export function requiresServiceSubTypeSelection(storeTypeOrSlug, servicesModeEnabled) {
  if (!servicesModeEnabled) return false

  const storeType =
    typeof storeTypeOrSlug === 'string' || storeTypeOrSlug == null
      ? { slug: storeTypeOrSlug }
      : storeTypeOrSlug

  const slug = String(storeType?.slug || '').trim().toLowerCase()
  if (slug === 'services') return false

  if (storeType?.structure === 'TWO_LEVEL') {
    const subs = Array.isArray(storeType?.subTypes) ? storeType.subTypes : []
    if (subs.length > 0) return false
  }

  return true
}

/**
 * Store Management "Services" store type (slug `services`) — only source for vendor Services sub-type options.
 * @param {Array<{ slug?: string|null, subTypes?: unknown[] }>|null|undefined} storeTypes
 * @returns {{ slug?: string|null, subTypes?: unknown[] }|null}
 */
export function findServicesStoreType(storeTypes) {
  if (!Array.isArray(storeTypes)) return null
  return (
    storeTypes.find((t) => String(t?.slug || '').trim().toLowerCase() === 'services') ?? null
  )
}

/**
 * Sub-types configured on the Services store type in Store Management (no hardcoded fallbacks).
 * @param {Array<{ slug?: string|null, subTypes?: unknown[] }>|null|undefined} storeTypes
 * @returns {Array<{ id: string, name: string, slug?: string|null, iconUrl?: string|null }>}
 */
export function listServiceSubTypes(storeTypes) {
  const services = findServicesStoreType(storeTypes)
  if (!Array.isArray(services?.subTypes)) return []
  return services.subTypes.filter((sub) => sub && sub.id && sub.name)
}
