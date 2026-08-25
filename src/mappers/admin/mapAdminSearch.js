import { ApiError } from '../../api/errors'

const TYPE_GROUP = {
  order: 'Orders',
  vendor: 'Vendors',
  champ: 'Champs',
  customer: 'Customers',
}

function mapSearchItem(item, fallbackType) {
  if (!item || typeof item !== 'object' || !item.id) return null
  const type = item.type || fallbackType
  return {
    id: String(item.id),
    label: String(item.label || item.id),
    subtitle: item.subtitle ? String(item.subtitle) : '',
    type,
    group: TYPE_GROUP[type] || 'Results',
    hrefHint: item.hrefHint ? String(item.hrefHint) : null,
  }
}

/**
 * Map GET /admin/search `data` into a flat list for the topbar picker.
 */
export function mapAdminSearchResponse(data) {
  if (!data || typeof data !== 'object') {
    throw new ApiError({ message: 'Invalid search response from the server.' })
  }

  const results = data.results && typeof data.results === 'object' ? data.results : {}
  const items = [
    ...(Array.isArray(results.orders) ? results.orders.map((item) => mapSearchItem(item, 'order')) : []),
    ...(Array.isArray(results.vendors) ? results.vendors.map((item) => mapSearchItem(item, 'vendor')) : []),
    ...(Array.isArray(results.champs) ? results.champs.map((item) => mapSearchItem(item, 'champ')) : []),
    ...(Array.isArray(results.customers) ? results.customers.map((item) => mapSearchItem(item, 'customer')) : []),
  ].filter(Boolean)

  return {
    q: data.q ? String(data.q) : '',
    items,
  }
}

export function mapAdminSearchNotificationsResponse(data) {
  if (!data || typeof data !== 'object') {
    throw new ApiError({ message: 'Invalid notifications response from the server.' })
  }

  const items = (Array.isArray(data.items) ? data.items : [])
    .map((item) => {
      if (!item || typeof item !== 'object' || !item.id) return null
      return {
        id: String(item.id),
        kind: item.kind === 'vendor_flag' ? 'vendor_flag' : 'incident',
        title: String(item.title || 'Notification'),
        note: item.note ? String(item.note) : '',
        priority: item.priority ? String(item.priority) : null,
        createdAt: item.createdAt ?? null,
        linkHint: item.linkHint ? String(item.linkHint) : null,
      }
    })
    .filter(Boolean)

  return { items, unread: items.length }
}
