import { ApiError } from '../../api/errors'

/**
 * Map GET /admin/store-types → dropdown options for Store type.
 */
export function mapAdminStoreTypesResponse(data) {
  if (!data || typeof data !== 'object') {
    throw new ApiError({ message: 'Invalid store types response from the server.' })
  }

  const raw = Array.isArray(data.storeTypes)
    ? data.storeTypes
    : Array.isArray(data.items)
      ? data.items
      : Array.isArray(data)
        ? data
        : []

  const storeTypes = raw
    .filter((item) => item && item.id && item.name)
    .map((item) => ({
      id: String(item.id),
      name: String(item.name),
      slug: item.slug ?? null,
      visible: item.visible !== false,
      isActive: item.isActive !== false,
    }))

  return {
    total: Number(data.totalStoreTypes) || storeTypes.length,
    storeTypes,
  }
}

/**
 * Best-match store type id from vendor category label (e.g. "Food & Beverage" → "Food").
 */
export function matchAdminStoreTypeId(storeTypes = [], categoryLabel = '') {
  const label = String(categoryLabel || '').trim().toLowerCase()
  if (!label || !Array.isArray(storeTypes) || !storeTypes.length) return ''

  const exact = storeTypes.find((t) => t.name.toLowerCase() === label)
  if (exact) return exact.id

  const includes = storeTypes.find(
    (t) => label.includes(t.name.toLowerCase()) || t.name.toLowerCase().includes(label),
  )
  if (includes) return includes.id

  // "Food & Beverage" → Food
  const firstWord = label.split(/[\s&/,-]+/)[0]
  const byWord = storeTypes.find((t) => t.name.toLowerCase() === firstWord)
  return byWord?.id || ''
}
