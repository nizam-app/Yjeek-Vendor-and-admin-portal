import { ApiError } from '../../api/errors'

const EMPTY_DELIVERY = {
  new: [],
  accepted: [],
  preparing: [],
  ready: [],
}

const EMPTY_DINE_IN = {
  new: [],
  confirmed: [],
  preparing: [],
  ready: [],
}

function formatMoneyBhd(value) {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'string' && /bhd/i.test(value)) return value
  const numeric = Number(value)
  if (Number.isNaN(numeric)) return String(value)
  return `${numeric.toFixed(3)} BHD`
}

function formatDineInWhen(iso) {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null

  const time = date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  })
  const day = date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
  return `${day} · ${time}`
}

function mapOrderTypeBadge(orderType) {
  const raw = String(orderType || '').trim().toUpperCase()
  if (raw === 'PICKUP') return 'Pickup'
  if (raw === 'DELIVERY') return null
  return null
}

function mapRejectedStatus(status) {
  const upper = String(status || '').trim().toUpperCase()
  if (upper === 'REJECTED' || upper.endsWith('_REJECTED') || upper.includes('REJECTED')) {
    return 'rejected'
  }
  if (upper.includes('NO_SHOW') || upper.includes('NOSHOW')) return 'no-show-cancelled'
  return null
}

function mapDineInPrepTag(dineInPrepMode) {
  const raw = String(dineInPrepMode || '').trim().toUpperCase()
  if (raw === 'PREPARE_NOW') return 'Prepare now'
  if (raw === 'PREPARE_ON_ARRIVAL') return 'Prepare on arrival'
  return undefined
}

function isUiShapedDeliveryOrder(order) {
  return (
    order &&
    typeof order === 'object' &&
    typeof order.id === 'string' &&
    typeof order.total === 'string' &&
    order.orderType == null &&
    (typeof order.items === 'string' || order.status === 'no-show-cancelled')
  )
}

function isUiShapedDineInOrder(order) {
  return (
    order &&
    typeof order === 'object' &&
    typeof order.id === 'string' &&
    typeof order.guest === 'string' &&
    !order.orderType
  )
}

function columnList(columns, ...keys) {
  if (!columns || typeof columns !== 'object') return []
  for (const key of keys) {
    if (Array.isArray(columns[key])) return columns[key]
  }
  return []
}

/**
 * Map one delivery/pickup live-board order into OrderCard UI shape.
 */
export function mapVendorLiveOrder(order) {
  if (!order || typeof order !== 'object') {
    throw new ApiError({ message: 'Invalid live order payload from the server.' })
  }

  if (isUiShapedDeliveryOrder(order)) {
    return { ...order }
  }

  const customer = order.customer && typeof order.customer === 'object' ? order.customer : null
  const branch = order.branch && typeof order.branch === 'object' ? order.branch : null
  const customerName = customer?.name ?? null
  const itemsPreview = order.itemsPreview ?? order.itemPreview ?? null
  const specialStatus = mapRejectedStatus(order.status)
  const typeBadge = mapOrderTypeBadge(order.orderType)
  const displayId = order.orderNumber ? String(order.orderNumber) : String(order.id || '')
  const itemsList = Array.isArray(order.items)
    ? order.items.map((item) => ({
        name: item.name,
        qty: item.quantity ?? item.qty ?? 1,
        price:
          item.lineTotal != null
            ? formatMoneyBhd(item.lineTotal)
            : item.unitPrice != null
              ? formatMoneyBhd(item.unitPrice)
              : item.price || '—',
      }))
    : order.itemsList

  return {
    id: displayId,
    backendId: order.id ?? null,
    orderNumber: order.orderNumber ?? null,
    total: formatMoneyBhd(order.totalAmount ?? order.subtotal),
    items: itemsPreview != null ? String(itemsPreview) : '—',
    itemsList,
    customer: customerName || '—',
    customerName,
    customerPhone: customer?.phone ?? null,
    branch: branch?.name ?? null,
    branchArea: branch?.area ?? null,
    branchAddress: order.branchAddress ?? null,
    orderType: order.orderType ?? null,
    fulfillmentType: order.fulfillmentType ?? null,
    backendStatus: order.status ?? null,
    paymentStatus: order.paymentStatus ?? null,
    paymentMethod: order.paymentMethod ?? null,
    itemCount: order.itemCount ?? null,
    subtotal: order.subtotal != null ? formatMoneyBhd(order.subtotal) : undefined,
    deliveryFee: order.deliveryFee != null ? formatMoneyBhd(order.deliveryFee) : undefined,
    serviceFee: order.serviceFee != null ? formatMoneyBhd(order.serviceFee) : undefined,
    vat: order.vatAmount != null ? formatMoneyBhd(order.vatAmount) : undefined,
    paid: order.paymentMethod
      ? String(order.paymentMethod)
          .toLowerCase()
          .replace(/_/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase())
      : undefined,
    deliveryAddress: order.deliveryAddress ?? null,
    confirmedAt: order.confirmedAt ?? null,
    createdAt: order.createdAt ?? null,
    type: typeBadge || undefined,
    status: specialStatus || undefined,
    reason: order.reason ?? order.rejectionReason ?? order.vendorRejectionReason ?? undefined,
    note: order.note ?? order.kitchenNote ?? undefined,
  }
}

/**
 * Map one dine-in live-board order into DineInCard UI shape.
 */
export function mapVendorDineInOrder(order) {
  if (!order || typeof order !== 'object') {
    throw new ApiError({ message: 'Invalid dine-in order payload from the server.' })
  }

  if (isUiShapedDineInOrder(order)) {
    return { ...order }
  }

  const customer = order.customer && typeof order.customer === 'object' ? order.customer : null
  const branch = order.branch && typeof order.branch === 'object' ? order.branch : null
  const guestCount = order.partySize ?? order.guestCount ?? order.guests ?? null
  const displayId = order.orderNumber ? String(order.orderNumber) : String(order.id || '')
  const paymentStatus = String(order.paymentStatus || '').toUpperCase()
  const awaitingPayment = paymentStatus && paymentStatus !== 'PAID'
  const prepMode = String(order.dineInPrepMode || '').trim().toUpperCase()
  const tag = mapDineInPrepTag(order.dineInPrepMode)
  const explicitArrived = order.arrived ?? order.checkedIn ?? order.isCheckedIn
  const arrived =
    explicitArrived != null ? Boolean(explicitArrived) : prepMode === 'PREPARE_NOW'
  const when =
    formatDineInWhen(order.scheduledDineInAt) ||
    formatDineInWhen(order.arriveByAt) ||
    formatDineInWhen(order.windowStartAt) ||
    formatDineInWhen(order.scheduledAt) ||
    undefined
  const itemsPreview = order.itemsPreview ?? order.itemPreview ?? null
  const itemsList = Array.isArray(order.items)
    ? order.items.map((item) => ({
        name: item.name,
        qty: item.quantity ?? item.qty ?? 1,
        price:
          item.lineTotal != null
            ? formatMoneyBhd(item.lineTotal)
            : item.unitPrice != null
              ? formatMoneyBhd(item.unitPrice)
              : item.price || '—',
      }))
    : order.itemsList

  return {
    id: displayId,
    backendId: order.id ?? null,
    orderNumber: order.orderNumber ?? null,
    guest: customer?.name || '—',
    guests: guestCount != null && guestCount !== '' ? Number(guestCount) : null,
    customerName: customer?.name ?? null,
    customerPhone: customer?.phone ?? null,
    branch: branch?.name ?? null,
    branchArea: branch?.area ?? null,
    branchAddress: order.branchAddress ?? null,
    orderType: order.orderType ?? null,
    fulfillmentType: order.fulfillmentType ?? null,
    deliverySpeed: order.deliverySpeed ?? null,
    dineInPrepMode: order.dineInPrepMode ?? null,
    backendStatus: order.status ?? null,
    paymentStatus: order.paymentStatus ?? null,
    paymentMethod: order.paymentMethod ?? null,
    itemCount: order.itemCount ?? null,
    items: itemsPreview != null ? String(itemsPreview) : undefined,
    itemsList,
    total: formatMoneyBhd(order.totalAmount ?? order.subtotal),
    subtotal: order.subtotal != null ? formatMoneyBhd(order.subtotal) : undefined,
    deliveryFee: order.deliveryFee != null ? formatMoneyBhd(order.deliveryFee) : undefined,
    vat: order.vatAmount != null ? formatMoneyBhd(order.vatAmount) : undefined,
    paid: order.paymentMethod
      ? String(order.paymentMethod)
          .toLowerCase()
          .replace(/_/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase())
      : undefined,
    totalAmount: order.totalAmount ?? null,
    kitchenNote: order.kitchenNote ?? null,
    estimatedReadyMin: order.estimatedReadyMin ?? null,
    confirmedAt: order.confirmedAt ?? null,
    createdAt: order.createdAt ?? null,
    when,
    tag,
    arrived,
    note: awaitingPayment
      ? 'Awaiting customer payment'
      : order.kitchenNote || order.note || undefined,
  }
}

function mapDeliveryColumnOrders(list) {
  if (!Array.isArray(list)) return []
  return list
    .map((item) => {
      try {
        return mapVendorLiveOrder(item)
      } catch {
        return null
      }
    })
    .filter(Boolean)
}

function mapDineInColumnOrders(list) {
  if (!Array.isArray(list)) return []
  return list
    .map((item) => {
      try {
        return mapVendorDineInOrder(item)
      } catch {
        return null
      }
    })
    .filter(Boolean)
}

/**
 * Normalize live board response for LiveOrders / LiveOrderColumn.
 * Prefer API `columns` shape (delivery_pickup / dine_in) over legacy mock shape.
 */
export function mapVendorLiveOrdersResponse(data, { board = 'delivery' } = {}) {
  if (data && typeof data === 'object' && data.columns && typeof data.columns === 'object') {
    const columns = data.columns
    if (board === 'dinein') {
      return {
        delivery: { ...EMPTY_DELIVERY },
        dineIn: {
          new: mapDineInColumnOrders(columnList(columns, 'new')),
          confirmed: mapDineInColumnOrders(columnList(columns, 'confirmed')),
          preparing: mapDineInColumnOrders(columnList(columns, 'preparing')),
          ready: mapDineInColumnOrders(columnList(columns, 'readyForGuest', 'ready')),
        },
      }
    }

    return {
      delivery: {
        new: mapDeliveryColumnOrders(columnList(columns, 'new')),
        accepted: mapDeliveryColumnOrders(columnList(columns, 'accepted')),
        preparing: mapDeliveryColumnOrders(columnList(columns, 'preparing')),
        ready: mapDeliveryColumnOrders(columnList(columns, 'ready', 'readyForChamp', 'readyForHandover')),
      },
      dineIn: { ...EMPTY_DINE_IN },
    }
  }

  if (data && typeof data === 'object' && (data.delivery || data.dineIn)) {
    return {
      delivery: {
        new: data.delivery?.new || [],
        accepted: data.delivery?.accepted || [],
        preparing: data.delivery?.preparing || [],
        ready: data.delivery?.ready || [],
      },
      dineIn: {
        new: data.dineIn?.new || [],
        confirmed: data.dineIn?.confirmed || [],
        preparing: data.dineIn?.preparing || [],
        ready: data.dineIn?.ready || data.dineIn?.readyForGuest || [],
      },
    }
  }

  throw new ApiError({ message: 'Invalid live orders response from the server.' })
}

export const emptyVendorLiveOrders = {
  delivery: { ...EMPTY_DELIVERY },
  dineIn: { ...EMPTY_DINE_IN },
}

function sameLiveOrder(a, b) {
  if (!a || !b) return false
  const aIds = [a.backendId, a.id, a.orderNumber].filter(Boolean).map(String)
  const bIds = [b.backendId, b.id, b.orderNumber].filter(Boolean).map(String)
  return aIds.some((id) => bIds.includes(id))
}

/**
 * After POST accept: remove from New and place in Accepted (delivery) or Confirmed (dine-in).
 */
export function moveAcceptedOrderOnLiveBoard(boardData, { board = 'delivery', previousOrder, acceptedOrder } = {}) {
  if (!boardData || typeof boardData !== 'object') return boardData
  const moved = acceptedOrder || previousOrder
  if (!moved) return boardData

  if (board === 'dinein') {
    const dineIn = boardData.dineIn || { ...EMPTY_DINE_IN }
    return {
      ...boardData,
      dineIn: {
        new: (dineIn.new || []).filter((order) => !sameLiveOrder(order, previousOrder || moved)),
        confirmed: [
          moved,
          ...(dineIn.confirmed || []).filter((order) => !sameLiveOrder(order, previousOrder || moved)),
        ],
        preparing: dineIn.preparing || [],
        ready: dineIn.ready || [],
      },
    }
  }

  const delivery = boardData.delivery || { ...EMPTY_DELIVERY }
  return {
    ...boardData,
    delivery: {
      new: (delivery.new || []).filter((order) => !sameLiveOrder(order, previousOrder || moved)),
      accepted: [
        moved,
        ...(delivery.accepted || []).filter((order) => !sameLiveOrder(order, previousOrder || moved)),
      ],
      preparing: delivery.preparing || [],
      ready: delivery.ready || [],
    },
  }
}

