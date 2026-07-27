import { ApiError } from '../../api/errors'

/** Named legend colors from confirmed map samples → UI hex. */
const LEGEND_COLOR_TOKENS = {
  green: '#35b86a',
  orange: '#e1a128',
  red: '#d94748',
  blue: '#3979ba',
  yellow: '#e1a128',
  gray: '#737d77',
  grey: '#737d77',
}

const LOAD_KEY_FALLBACK_COLORS = {
  idle: '#35b86a',
  busy: '#e1a128',
  overloaded: '#d94748',
  open: '#3979ba',
  closed: '#737d77',
  pickup: '#35b86a',
  dropoff: '#e1a128',
}

/** Orders layer has no legend in the confirmed response — UI-only keys for pickup/dropoff. */
const DEFAULT_ORDERS_LEGEND = [
  { key: 'pickup', label: 'Pickup', color: '#35b86a' },
  { key: 'dropoff', label: 'Dropoff', color: '#e1a128' },
]

export const ADMIN_DASHBOARD_MAP_API_LAYERS = ['champs', 'orders', 'vendors']

export const ADMIN_DASHBOARD_MAP_TABS = [
  { id: 'champs', label: 'Champs', api: true },
  { id: 'orders', label: 'Orders', api: true },
  { id: 'vendors', label: 'Vendors', api: true },
  { id: 'zones', label: 'Zones', api: false },
  { id: 'heatmap', label: 'Heatmap', api: false },
]

function resolveColor(token, loadKey) {
  if (typeof token === 'string' && token.startsWith('#')) return token
  const named = String(token || '')
    .trim()
    .toLowerCase()
  if (named && LEGEND_COLOR_TOKENS[named]) return LEGEND_COLOR_TOKENS[named]
  const key = String(loadKey || '')
    .trim()
    .toLowerCase()
  if (key && LOAD_KEY_FALLBACK_COLORS[key]) return LOAD_KEY_FALLBACK_COLORS[key]
  return '#737d77'
}

function readCoord(value) {
  if (value === null || value === undefined || value === '') return null
  const numeric = Number(value)
  if (Number.isNaN(numeric)) return null
  return numeric
}

/**
 * Normalize legend from confirmed map samples.
 * Accepts either an array of { key, label, color } or a keyed object.
 */
export function mapAdminDashboardMapLegend(legend) {
  if (Array.isArray(legend)) {
    return legend
      .map((item, index) => {
        if (!item || typeof item !== 'object') return null
        const key = item.key || item.id || item.loadKey || `legend-${index}`
        const label = item.label || item.name || String(key)
        return {
          key: String(key),
          label: String(label),
          color: resolveColor(item.color, item.key || item.loadKey),
        }
      })
      .filter(Boolean)
  }

  if (legend && typeof legend === 'object') {
    return Object.entries(legend).map(([key, value]) => {
      if (value && typeof value === 'object') {
        return {
          key,
          label: value.label || value.name || key,
          color: resolveColor(value.color, key),
        }
      }
      return {
        key,
        label: typeof value === 'string' ? value : key,
        color: resolveColor(null, key),
      }
    })
  }

  return []
}

/**
 * Confirmed champs point: id, name, status, load, loadKey, lat, lng.
 */
export function mapChampMapPoint(point, legendByKey = {}) {
  if (!point || typeof point !== 'object') return null

  const lat = readCoord(point.lat)
  const lng = readCoord(point.lng)
  if (lat === null || lng === null) return null

  const loadKey = point.loadKey ?? point.statusKey ?? null
  const legendColor = loadKey && legendByKey[loadKey] ? legendByKey[loadKey].color : null

  return {
    id: point.id ?? `${lat},${lng}`,
    name: point.name ?? null,
    status: point.status ?? null,
    load: point.load ?? null,
    loadKey,
    kind: 'champ',
    lat,
    lng,
    color: legendColor || resolveColor(point.color, loadKey),
  }
}

/**
 * Confirmed vendors point: id, name, area, open, lat, lng.
 */
export function mapVendorMapPoint(point, legendByKey = {}) {
  if (!point || typeof point !== 'object') return null

  const lat = readCoord(point.lat)
  const lng = readCoord(point.lng)
  if (lat === null || lng === null) return null

  const isOpen = Boolean(point.open)
  const loadKey = isOpen ? 'open' : 'closed'
  const color = isOpen
    ? legendByKey.open?.color || resolveColor('blue', 'open')
    : resolveColor('gray', 'closed')

  return {
    id: point.id ?? `${lat},${lng}`,
    name: point.name ?? null,
    area: point.area ?? null,
    status: isOpen ? 'Open' : 'Closed',
    open: isOpen,
    load: null,
    loadKey,
    kind: 'vendor',
    lat,
    lng,
    color,
  }
}

/**
 * Confirmed orders point: id, orderNumber, status, vendorName, pickup{lat,lng}, dropoff{lat,lng|null}.
 * Expands into one marker per valid coordinate (pickup and/or dropoff).
 */
export function mapOrderMapPoints(point) {
  if (!point || typeof point !== 'object') return []

  const orderId = point.id ?? point.orderNumber
  if (!orderId) return []

  const orderNumber = point.orderNumber ?? null
  const vendorName = point.vendorName ?? null
  const status = point.status ?? null
  const label = [orderNumber, vendorName].filter(Boolean).join(' · ') || String(orderId)
  const markers = []

  const pickupLat = readCoord(point.pickup?.lat)
  const pickupLng = readCoord(point.pickup?.lng)
  if (pickupLat !== null && pickupLng !== null) {
    markers.push({
      id: `${orderId}-pickup`,
      orderId,
      orderNumber,
      vendorName,
      name: label,
      status,
      load: null,
      loadKey: 'pickup',
      kind: 'pickup',
      lat: pickupLat,
      lng: pickupLng,
      color: LOAD_KEY_FALLBACK_COLORS.pickup,
    })
  }

  const dropoffLat = readCoord(point.dropoff?.lat)
  const dropoffLng = readCoord(point.dropoff?.lng)
  if (dropoffLat !== null && dropoffLng !== null) {
    markers.push({
      id: `${orderId}-dropoff`,
      orderId,
      orderNumber,
      vendorName,
      name: label,
      status,
      load: null,
      loadKey: 'dropoff',
      kind: 'dropoff',
      lat: dropoffLat,
      lng: dropoffLng,
      color: LOAD_KEY_FALLBACK_COLORS.dropoff,
    })
  }

  return markers
}

/** @deprecated Prefer layer-specific mappers. Kept for shared champ-shaped points. */
export function mapAdminDashboardMapPoint(point, legendByKey = {}) {
  return mapChampMapPoint(point, legendByKey)
}

/**
 * Project lat/lng points into percentage positions inside the map panel.
 * No external map SDK — preserves the existing Live map chrome.
 */
export function projectAdminDashboardMapPoints(points) {
  const list = Array.isArray(points) ? points : []
  if (!list.length) return []

  const lats = list.map((p) => p.lat)
  const lngs = list.map((p) => p.lng)
  let minLat = Math.min(...lats)
  let maxLat = Math.max(...lats)
  let minLng = Math.min(...lngs)
  let maxLng = Math.max(...lngs)

  const latSpan = maxLat - minLat || 0.08
  const lngSpan = maxLng - minLng || 0.08
  minLat -= latSpan * 0.12
  maxLat += latSpan * 0.12
  minLng -= lngSpan * 0.12
  maxLng += lngSpan * 0.12

  const rangeLat = maxLat - minLat || 1
  const rangeLng = maxLng - minLng || 1

  return list.map((point) => ({
    ...point,
    leftPct: ((point.lng - minLng) / rangeLng) * 100,
    topPct: ((maxLat - point.lat) / rangeLat) * 100,
  }))
}

function expandLayerPoints(layer, rawPoints, legendByKey) {
  const list = Array.isArray(rawPoints) ? rawPoints : []

  if (layer === 'orders') {
    return list.flatMap((point) => mapOrderMapPoints(point))
  }

  if (layer === 'vendors') {
    return list.map((point) => mapVendorMapPoint(point, legendByKey)).filter(Boolean)
  }

  // champs (default)
  return list.map((point) => mapChampMapPoint(point, legendByKey)).filter(Boolean)
}

/**
 * Map confirmed Admin dashboard map `data` into Live map UI shape.
 *
 * Layer-specific confirmed shapes:
 * - champs: legend + points{lat,lng,loadKey,...}
 * - orders: points{pickup,dropoff} (no legend in sample)
 * - vendors: legend{open} + points{lat,lng,open,area,name}
 *
 * @param {Record<string, unknown>|null|undefined} data
 */
export function mapAdminDashboardMapResponse(data) {
  if (!data || typeof data !== 'object') {
    throw new ApiError({
      message: 'Invalid dashboard map response from the server.',
    })
  }

  const layer = typeof data.layer === 'string' ? data.layer : null
  let legend = mapAdminDashboardMapLegend(data.legend)

  if (layer === 'orders' && legend.length === 0) {
    legend = DEFAULT_ORDERS_LEGEND
  }

  const legendByKey = Object.fromEntries(legend.map((item) => [item.key, item]))
  const points = expandLayerPoints(layer, data.points, legendByKey)

  return {
    layer,
    legend,
    points: projectAdminDashboardMapPoints(points),
    scopeNote: 'Map scope auto-applies from your access (country / region / zone).',
  }
}

/** Empty map payload for Zones / Heatmap (no confirmed API). */
export function emptyAdminDashboardMap(layer) {
  return {
    layer,
    legend: [],
    points: [],
    scopeNote: 'Map scope auto-applies from your access (country / region / zone).',
  }
}
