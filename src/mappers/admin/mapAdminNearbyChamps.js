import { ApiError } from '../../api/errors'

/**
 * Map a champ-like object defensively.
 * Confirmed envelope fields: currentChamp (object|null), nearby (array).
 * Item keys beyond id are optional — only pass through when present.
 * @param {unknown} item
 */
function mapChampRef(item) {
  if (!item || typeof item !== 'object') return null

  const id = item.id ?? item.driverId ?? item.champId
  if (id == null || id === '') return null

  const name = item.name || item.displayName || item.fullName || null
  const status = item.status != null ? String(item.status) : null
  const labelParts = [name, status].filter(Boolean)

  return {
    id: String(id),
    name: name ? String(name) : null,
    status,
    label: labelParts.length ? `${labelParts.join(' · ')}` : String(id),
  }
}

/**
 * Map confirmed GET /admin/orders/:orderId/nearby-champs `data`.
 * Empty `nearby: []` and `currentChamp: null` are valid.
 * @param {Record<string, unknown>|null|undefined} data
 */
export function mapAdminNearbyChampsResponse(data) {
  if (!data || typeof data !== 'object') {
    throw new ApiError({
      message: 'Invalid nearby champs response from the server.',
    })
  }

  const nearby = Array.isArray(data.nearby)
    ? data.nearby.map(mapChampRef).filter(Boolean)
    : []

  return {
    orderId: data.orderId ? String(data.orderId) : null,
    orderNumber: data.orderNumber ? String(data.orderNumber) : null,
    status: data.status ? String(data.status) : null,
    currentChamp: mapChampRef(data.currentChamp),
    nearby,
  }
}

export function emptyAdminNearbyChamps() {
  return {
    orderId: null,
    orderNumber: null,
    status: null,
    currentChamp: null,
    nearby: [],
  }
}
