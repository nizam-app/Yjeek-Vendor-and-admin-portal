import { ApiError } from '../../api/errors'

const EMPTY_COLUMNS = {
  new: [],
  confirmed: [],
  preparing: [],
  readyForPickup: [],
}

function formatMoneyBhd(value) {
  if (value === null || value === undefined || value === '') return null
  if (typeof value === 'string' && /bhd/i.test(value)) return value
  const numeric = Number(value)
  if (Number.isNaN(numeric)) return String(value)
  return `${numeric.toFixed(3)} BHD`
}

function formatTime(iso) {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

function formatDayLabel(iso) {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  const today = new Date()
  const tomorrow = new Date()
  tomorrow.setDate(today.getDate() + 1)
  const sameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  if (sameDay(date, today)) return 'Today'
  if (sameDay(date, tomorrow)) return 'Tomorrow'
  return date.toLocaleDateString(undefined, { weekday: 'short' })
}

function mapWindowLabel(order) {
  const speed = String(order.deliverySpeed || order.window || order.fulfillmentType || '')
    .trim()
    .toUpperCase()
  if (speed.includes('SAME')) return 'Same Day'
  if (speed.includes('NEXT')) return 'Next Day'
  if (speed.includes('STANDARD')) return 'Standard'
  if (order.window && typeof order.window === 'string' && !/^[A-Z0-9_]+$/.test(order.window)) {
    return order.window
  }
  if (speed) {
    return speed
      .toLowerCase()
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ')
  }
  return 'Scheduled'
}

function mapWindowTone(windowLabel) {
  const raw = String(windowLabel || '').toLowerCase()
  if (raw.includes('same')) return 'blue'
  if (raw.includes('next')) return 'purple'
  if (raw.includes('standard')) return 'orange'
  return 'gray'
}

function formatWhen(order) {
  const start = order.windowStartAt || order.scheduledAt || order.scheduledDineInAt
  const end = order.windowEndAt || order.arriveByAt
  const day = formatDayLabel(start) || formatDayLabel(end)
  const startTime = formatTime(start)
  const endTime = formatTime(end)
  if (day && startTime && endTime) return `${day} · ${startTime}–${endTime}`
  if (day && startTime) return `${day} · ${startTime}`
  if (day) return day
  if (typeof order.when === 'string') return order.when
  return '—'
}

function isUiShapedScheduledOrder(order) {
  return (
    order &&
    typeof order === 'object' &&
    typeof order.id === 'string' &&
    typeof order.window === 'string' &&
    order.orderType == null &&
    (typeof order.customer === 'string' || typeof order.customerName === 'string')
  )
}

/**
 * Map one scheduled-board order into ScheduleCard UI shape.
 * Uses confirmed live/scheduled field names; window labels derived when present.
 */
export function mapVendorScheduledOrder(order) {
  if (!order || typeof order !== 'object') {
    throw new ApiError({ message: 'Invalid scheduled order payload from the server.' })
  }

  if (isUiShapedScheduledOrder(order)) {
    return { ...order }
  }

  const customer = order.customer && typeof order.customer === 'object' ? order.customer : null
  const customerName = customer?.name ?? order.customerName ?? null
  const customerPhone = customer?.phone ?? order.customerPhone ?? null
  const itemCount = order.itemCount ?? null
  const itemsPreview = order.itemsPreview ?? order.itemPreview ?? null
  const displayId = order.orderNumber ? String(order.orderNumber) : String(order.id || '')
  const window = mapWindowLabel(order)
  const when = formatWhen(order)
  const arriveBy = formatTime(order.arriveByAt || order.windowEndAt) || order.arriveBy || null
  const customerLine =
    customerName && itemCount != null
      ? `${customerName} · ${itemCount} items`
      : customerName && itemsPreview
        ? `${customerName} · ${itemsPreview}`
        : customerName || itemsPreview || '—'

  return {
    id: displayId,
    backendId: order.id ?? null,
    orderNumber: order.orderNumber ?? null,
    window,
    windowTone: mapWindowTone(window),
    when,
    arriveBy: arriveBy || undefined,
    customer: customerLine,
    customerName,
    customerPhone,
    itemsPreview: itemsPreview != null ? String(itemsPreview) : undefined,
    itemCount,
    total: formatMoneyBhd(order.totalAmount ?? order.subtotal) || undefined,
    subtotal: formatMoneyBhd(order.subtotal) || undefined,
    deliveryFee: formatMoneyBhd(order.deliveryFee) || undefined,
    vat: formatMoneyBhd(order.vatAmount) || undefined,
    paid: order.paymentMethod ?? undefined,
    orderType: order.orderType ?? null,
    fulfillmentType: order.fulfillmentType ?? null,
    deliverySpeed: order.deliverySpeed ?? null,
    backendStatus: order.status ?? null,
    paymentStatus: order.paymentStatus ?? null,
    branch: order.branch?.name ?? null,
    sla: order.sla || undefined,
    note: order.note || order.kitchenNote || undefined,
    noteValue: order.noteValue || undefined,
  }
}

function mapColumnOrders(list) {
  if (!Array.isArray(list)) return []
  return list
    .map((item) => {
      try {
        return mapVendorScheduledOrder(item)
      } catch {
        return null
      }
    })
    .filter(Boolean)
}

function columnList(columns, ...keys) {
  if (!columns || typeof columns !== 'object') return []
  for (const key of keys) {
    if (Array.isArray(columns[key])) return columns[key]
  }
  return []
}

/**
 * Normalize scheduled board response.
 * Confirmed: columns.new / confirmed / preparing / readyForPickup + count + filters.
 */
export function mapVendorScheduledOrdersResponse(data) {
  if (data && typeof data === 'object' && data.columns && typeof data.columns === 'object') {
    const columns = data.columns
    return {
      columns: {
        new: mapColumnOrders(columnList(columns, 'new')),
        confirmed: mapColumnOrders(columnList(columns, 'confirmed')),
        preparing: mapColumnOrders(columnList(columns, 'preparing')),
        readyForPickup: mapColumnOrders(columnList(columns, 'readyForPickup', 'ready')),
      },
      count: typeof data.count === 'number' ? data.count : null,
      filters: data.filters && typeof data.filters === 'object' ? data.filters : null,
    }
  }

  // Legacy mock shape: { new, confirmed, preparing, readyForPickup }
  if (data && typeof data === 'object' && (data.new || data.confirmed || data.preparing || data.readyForPickup)) {
    return {
      columns: {
        new: mapColumnOrders(data.new),
        confirmed: mapColumnOrders(data.confirmed),
        preparing: mapColumnOrders(data.preparing),
        readyForPickup: mapColumnOrders(data.readyForPickup),
      },
      count: null,
      filters: null,
    }
  }

  throw new ApiError({ message: 'Invalid scheduled orders response from the server.' })
}

export const emptyVendorScheduledOrders = {
  columns: { ...EMPTY_COLUMNS },
  count: 0,
  filters: null,
}
