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
 * Rule 5 UI: Services mode on a non-Services store type requires a service sub-type.
 * @param {string|null|undefined} storeTypeSlug
 * @param {boolean} servicesModeEnabled
 * @returns {boolean}
 */
export function requiresServiceSubTypeSelection(storeTypeSlug, servicesModeEnabled) {
  if (!servicesModeEnabled) return false
  return String(storeTypeSlug || '').trim().toLowerCase() !== 'services'
}
