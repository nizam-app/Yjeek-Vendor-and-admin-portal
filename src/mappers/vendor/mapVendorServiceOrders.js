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

function formatCountdown(deadline) {
  if (!deadline) return null
  const deadlineMs = new Date(deadline).getTime()
  if (Number.isNaN(deadlineMs)) return null
  const remainingSeconds = Math.max(0, Math.ceil((deadlineMs - Date.now()) / 1000))
  const minutes = Math.floor(remainingSeconds / 60)
  const seconds = remainingSeconds % 60
  return remainingSeconds > 0 ? `${minutes}:${String(seconds).padStart(2, '0')}` : 'Expired'
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

function mapNoShow(status, cancelReason) {
  const upper = String(status || '').toUpperCase()
  const reason = String(cancelReason || '').toLowerCase()
  return (
    upper.includes('NO_SHOW') ||
    upper.includes('NOSHOW') ||
    reason.includes('no-show') ||
    reason.includes('no show')
  )
}

function resolveColumnKeyFromStatus(status) {
  const upper = String(status || '').toUpperCase()
  if (
    ['PLACED', 'PENDING_VENDOR_ACCEPT', 'AWAITING_PAYMENT'].includes(upper) ||
    upper.includes('PENDING')
  ) {
    if (upper === 'AWAITING_PAYMENT') return 'new'
    if (upper === 'PENDING_VENDOR_ACCEPT' || upper === 'PLACED') return 'new'
  }
  if (['IN_PROGRESS', 'PREPARING', 'CUSTOMER_ARRIVED', 'SEATED'].includes(upper)) {
    return 'inProgress'
  }
  if (
    ['CONFIRMED', 'VENDOR_ACCEPTED', 'PENDING_CONFIRMATION', 'READY_FOR_YOU'].includes(upper)
  ) {
    return 'upcoming'
  }
  return null
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
  const booking = order.serviceBooking && typeof order.serviceBooking === 'object' ? order.serviceBooking : null
  const itemsPreview =
    order.itemsPreview ?? order.itemPreview ?? order.serviceName ?? booking?.categoryName ?? null
  const displayId = order.orderNumber ? String(order.orderNumber) : String(order.id || '')
  const backendStatus = order.status ?? null
  const noShow = Boolean(order.noShow) || mapNoShow(backendStatus, order.cancelReason)
  const statusUpper = String(backendStatus || '').toUpperCase()
  const paymentStatus = String(order.paymentStatus || '').toUpperCase()
  const awaitingPayment = statusUpper === 'AWAITING_PAYMENT'
  const durationMin = booking?.durationMin ?? order.estimatedReadyMin ?? null
  const staffName =
    booking?.assignedStaff?.displayName || order.staffName || order.assignedStaff?.name || null
  const category = booking?.categoryName ?? order.category ?? order.serviceCategory ?? null
  const itemCount = order.itemCount ?? order.itemsCount ?? null

  let resolvedColumn = columnKey
  if (!resolvedColumn || resolvedColumn === 'auto') {
    resolvedColumn = resolveColumnKeyFromStatus(backendStatus) || 'new'
  }

  let actions = []
  let buttonLabel
  let slaLabel
  let slaValue

  if (resolvedColumn === 'new') {
    if (awaitingPayment) {
      slaLabel = 'Accepted-Awaiting payment'
      slaValue = formatCountdown(order.paymentDeadline) || undefined
      actions = []
    } else {
      slaLabel = 'Confirm within (SLA 5min)'
      slaValue =
        formatCountdown(order.vendorAcceptDeadline) ||
        (typeof order.sla === 'string' ? order.sla : undefined)
      actions = ['Accept', 'Reject']
    }
  } else if (resolvedColumn === 'upcoming' && !noShow) {
    actions = ['Check-in', 'No Show']
  } else if (resolvedColumn === 'inProgress') {
    buttonLabel = 'Mark complete'
  }

  const money = formatMoneyBhd(order.totalAmount ?? order.subtotal)

  return {
    id: displayId,
    backendId: order.id ?? null,
    orderNumber: order.orderNumber ?? null,
    when: formatWhen(order),
    customer: customerName,
    customerPhone: customer?.phone ?? null,
    service: itemsPreview != null ? String(itemsPreview) : 'Service',
    category,
    bookingType: order.orderType === 'SERVICE' ? 'Service · booking' : undefined,
    venueType: order.venueType || booking?.fulfillmentMode || undefined,
    duration: durationMin != null ? `${durationMin} mins` : order.duration || undefined,
    staff: staffName || undefined,
    price: money || undefined,
    total: money || undefined,
    subtotal: formatMoneyBhd(order.subtotal) || undefined,
    serviceFee: formatMoneyBhd(order.serviceFee) || undefined,
    vat: formatMoneyBhd(order.vatAmount) || undefined,
    paid: order.paymentMethod || undefined,
    branch: order.branch?.name ?? null,
    branchArea: order.branch?.area ?? null,
    orderType: order.orderType ?? null,
    fulfillmentType: order.fulfillmentType ?? null,
    backendStatus,
    paymentStatus: paymentStatus || null,
    itemCount,
    itemsPreview: itemsPreview != null ? String(itemsPreview) : undefined,
    servicesList:
      Array.isArray(order.items) && order.items.length > 0
        ? order.items.map((item) => ({
            name: item.name,
            qty: item.quantity ?? item.qty ?? 1,
            price: formatMoneyBhd(item.lineTotal ?? item.unitPrice),
          }))
        : undefined,
    slaLabel,
    slaValue,
    actions: noShow ? [] : actions,
    buttonLabel: noShow ? undefined : buttonLabel,
    noShow,
    noShowReason: noShow
      ? order.note || order.kitchenNote || order.cancelReason || "Guest didn't arrive within grace period ·"
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
      count: typeof data.count === 'number' ? data.count : undefined,
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

/**
 * Optimistically move a booking between board columns after a mutation.
 */
export function moveServiceBookingOnBoard(board, { from, to, orderId, updater }) {
  if (!board || typeof board !== 'object') return board
  const id = String(orderId || '')
  if (!id || !from || !to) return board

  const next = {
    ...board,
    new: [...(board.new || [])],
    upcoming: [...(board.upcoming || [])],
    inProgress: [...(board.inProgress || [])],
  }

  const fromList = next[from] || []
  const idx = fromList.findIndex(
    (item) => String(item.backendId || item.id) === id || String(item.id) === id,
  )
  if (idx < 0) return board

  let [moved] = fromList.splice(idx, 1)
  if (typeof updater === 'function') {
    moved = updater(moved) || moved
  } else if (to === 'upcoming') {
    moved = {
      ...moved,
      slaLabel: undefined,
      slaValue: undefined,
      actions: ['Check-in', 'No Show'],
      buttonLabel: undefined,
      noShow: false,
    }
  } else if (to === 'inProgress') {
    moved = {
      ...moved,
      slaLabel: undefined,
      slaValue: undefined,
      actions: [],
      buttonLabel: 'Mark complete',
      noShow: false,
    }
  } else if (to === 'new') {
    moved = {
      ...moved,
      actions: [],
      buttonLabel: undefined,
      slaLabel: 'Accepted-Awaiting payment',
    }
  }

  next[from] = fromList
  next[to] = [moved, ...(next[to] || [])]
  return next
}

export function removeServiceBookingFromBoard(board, orderId) {
  if (!board || typeof board !== 'object') return board
  const id = String(orderId || '')
  if (!id) return board

  const filterOut = (list) =>
    (list || []).filter((item) => String(item.backendId || item.id) !== id && String(item.id) !== id)

  return {
    ...board,
    new: filterOut(board.new),
    upcoming: filterOut(board.upcoming),
    inProgress: filterOut(board.inProgress),
  }
}

export const emptyVendorServiceOrders = { ...EMPTY_COLUMNS, view: 'board' }
