import { ApiError } from '../../api/errors'

const EMPTY_COLUMNS = {
  new: [],
  upcoming: [],
  inProgress: [],
}

function formatMoneyBhd(value) {
  if (value === null || value === undefined || value === '') return null
  if (typeof value === 'string' && /bhd/i.test(value)) return value
  const numeric = Number(value)
  if (Number.isNaN(numeric)) return String(value)
  return `BHD ${numeric.toFixed(3)}`
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

function formatWhen(order) {
  const start =
    order.windowStartAt || order.scheduledAt || order.scheduledServiceAt || order.scheduledDineInAt
  const end = order.windowEndAt || order.arriveByAt
  const day = formatDayLabel(start) || formatDayLabel(end)
  const startTime = formatTime(start)
  const endTime = formatTime(end)
  if (day && startTime && endTime) return `${day} · ${startTime}–${endTime}`
  if (day && startTime) return `${day} · ${startTime}`
  if (typeof order.when === 'string') return order.when
  return day || '—'
}

function isUiShapedServiceBooking(order) {
  return (
    order &&
    typeof order === 'object' &&
    typeof order.id === 'string' &&
    typeof order.customer === 'string' &&
    typeof order.service === 'string' &&
    order.orderType == null
  )
}

function mapNoShow(status) {
  const upper = String(status || '').toUpperCase()
  return upper.includes('NO_SHOW') || upper.includes('NOSHOW')
}

/**
 * Map one services-board order into BookingCard UI shape.
 */
export function mapVendorServiceOrder(order, columnKey = 'new') {
  if (!order || typeof order !== 'object') {
    throw new ApiError({ message: 'Invalid service order payload from the server.' })
  }

  if (isUiShapedServiceBooking(order)) {
    return { ...order }
  }

  const customer = order.customer && typeof order.customer === 'object' ? order.customer : null
  const customerName = customer?.name ?? order.customerName ?? '—'
  const itemsPreview = order.itemsPreview ?? order.itemPreview ?? order.serviceName ?? null
  const displayId = order.orderNumber ? String(order.orderNumber) : String(order.id || '')
  const noShow = Boolean(order.noShow) || mapNoShow(order.status)
  const paymentStatus = String(order.paymentStatus || '').toUpperCase()
  const awaitingPayment = paymentStatus && paymentStatus !== 'PAID'

  let actions = []
  let buttonLabel
  let slaLabel
  let slaValue

  if (columnKey === 'new') {
    if (awaitingPayment) {
      slaLabel = 'Accepted-Awaiting payment'
      actions = []
    } else {
      slaLabel = 'Confirm within (SLA 5min)'
      actions = ['Accept', 'Reject']
    }
  } else if (columnKey === 'upcoming' && !noShow) {
    actions = ['Check-in', 'No Show']
  } else if (columnKey === 'inProgress') {
    buttonLabel = 'Mark complete'
  }

  return {
    id: displayId,
    backendId: order.id ?? null,
    orderNumber: order.orderNumber ?? null,
    when: formatWhen(order),
    customer: customerName,
    customerPhone: customer?.phone ?? null,
    service: itemsPreview != null ? String(itemsPreview) : 'Service',
    category: order.category ?? order.serviceCategory ?? null,
    bookingType: order.orderType === 'SERVICE' ? 'Service · booking' : undefined,
    venueType: order.venueType || undefined,
    duration:
      order.estimatedReadyMin != null ? `${order.estimatedReadyMin} mins` : order.duration || undefined,
    staff: order.staffName || order.assignedStaff?.name || undefined,
    price: formatMoneyBhd(order.totalAmount ?? order.subtotal) || undefined,
    total: formatMoneyBhd(order.totalAmount ?? order.subtotal) || undefined,
    paid: order.paymentMethod || undefined,
    branch: order.branch?.name ?? null,
    branchArea: order.branch?.area ?? null,
    orderType: order.orderType ?? null,
    fulfillmentType: order.fulfillmentType ?? null,
    backendStatus: order.status ?? null,
    paymentStatus: order.paymentStatus ?? null,
    itemCount: order.itemCount ?? null,
    itemsPreview: itemsPreview != null ? String(itemsPreview) : undefined,
    slaLabel,
    slaValue: order.sla || undefined,
    actions: noShow ? [] : actions,
    buttonLabel: noShow ? undefined : buttonLabel,
    noShow,
    noShowReason: noShow
      ? order.note || order.kitchenNote || "Guest didn't arrive within grace period ·"
      : undefined,
  }
}

function mapColumnOrders(list, columnKey) {
  if (!Array.isArray(list)) return []
  return list
    .map((item) => {
      try {
        return mapVendorServiceOrder(item, columnKey)
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
 * Normalize services board response into UI columns: new / upcoming / inProgress.
 * API sample uses `confirmed` for upcoming bookings.
 */
export function mapVendorServiceOrdersResponse(data) {
  if (data && typeof data === 'object' && data.columns && typeof data.columns === 'object') {
    const columns = data.columns
    return {
      view: data.view || 'board',
      new: mapColumnOrders(columnList(columns, 'new'), 'new'),
      upcoming: mapColumnOrders(columnList(columns, 'confirmed', 'upcoming'), 'upcoming'),
      inProgress: mapColumnOrders(
        columnList(columns, 'inProgress', 'preparing', 'in_progress'),
        'inProgress',
      ),
    }
  }

  // Legacy mock shape
  if (data && typeof data === 'object' && (data.new || data.upcoming || data.inProgress)) {
    return {
      view: 'board',
      new: mapColumnOrders(data.new, 'new'),
      upcoming: mapColumnOrders(data.upcoming, 'upcoming'),
      inProgress: mapColumnOrders(data.inProgress, 'inProgress'),
    }
  }

  throw new ApiError({ message: 'Invalid services board response from the server.' })
}

export const emptyVendorServiceOrders = { ...EMPTY_COLUMNS, view: 'board' }
