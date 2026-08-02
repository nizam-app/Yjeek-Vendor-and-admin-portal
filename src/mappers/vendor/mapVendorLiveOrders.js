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

function formatCountdown(deadline) {
  if (!deadline) return null
  const deadlineMs = new Date(deadline).getTime()
  if (Number.isNaN(deadlineMs)) return null

  const remainingSeconds = Math.max(0, Math.ceil((deadlineMs - Date.now()) / 1000))
  const minutes = Math.floor(remainingSeconds / 60)
  const seconds = remainingSeconds % 60
  return remainingSeconds > 0 ? `${minutes}:${String(seconds).padStart(2, '0')}` : 'Expired'
}

function formatElapsedSince(startedAt) {
  if (!startedAt) return null
  const startedMs = new Date(startedAt).getTime()
  if (Number.isNaN(startedMs)) return null

  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - startedMs) / 1000))
  const minutes = Math.floor(elapsedSeconds / 60)
  const seconds = elapsedSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function normalizePrimaryAction(action) {
  if (!action || typeof action !== 'object') return null
  const key = String(action.key || '').trim()
  const label = String(action.label || '').trim()
  const method = String(action.method || '').trim().toUpperCase()
  const path = String(action.path || '').trim()
  if (!key || !label || !method || !path) return null
  return { key, label, method, path }
}

function mapReadyLabel(order) {
  const status = String(order?.status || '').trim().toUpperCase()
  const driverName = order?.driver?.name

  if (status === 'ON_THE_WAY') {
    return driverName ? `On the way · ${driverName}` : 'On the way'
  }
  if (status === 'DRIVER_ASSIGNED') {
    return driverName ? `Driver assigned · ${driverName}` : 'Driver assigned'
  }
  if (status === 'READY_FOR_PICKUP') {
    return String(order?.orderType || '').toUpperCase() === 'PICKUP'
      ? 'Ready · awaiting customer'
      : 'Ready · awaiting champ'
  }
  return null
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
  const primaryAction = normalizePrimaryAction(order.primaryAction)
  const prepTime = formatElapsedSince(order.prepStartedAt)
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
    deliverySpeed: order.deliverySpeed ?? null,
    estimatedReadyMin: order.estimatedReadyMin ?? null,
    vendorAcceptDeadline: order.vendorAcceptDeadline ?? null,
    paymentDeadline: order.paymentDeadline ?? null,
    windowStartAt: order.windowStartAt ?? null,
    windowEndAt: order.windowEndAt ?? null,
    arriveByAt: order.arriveByAt ?? null,
    scheduledAt: order.scheduledAt ?? null,
    prepStartedAt: order.prepStartedAt ?? null,
    readyAt: order.readyAt ?? null,
    handedOverAt: order.handedOverAt ?? null,
    confirmedAt: order.confirmedAt ?? null,
    createdAt: order.createdAt ?? null,
    driver: order.driver ?? null,
    champName: order.driver?.name ?? null,
    sla: formatCountdown(order.vendorAcceptDeadline) || undefined,
    prepTime: prepTime || undefined,
    prepDelay:
      prepTime && order.estimatedReadyMin != null
        ? (Date.now() - new Date(order.prepStartedAt).getTime()) / 60000 >
          Number(order.estimatedReadyMin)
        : false,
    readyLabel: mapReadyLabel(order) || undefined,
    primaryAction,
    handoverType:
      primaryAction?.key === 'HANDOVER_TO_CHAMP'
        ? 'champ'
        : primaryAction?.key === 'HANDOVER_TO_CUSTOMER'
          ? 'customer'
          : undefined,
    handoverLabel: primaryAction?.label || undefined,
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
  const primaryAction = normalizePrimaryAction(order.primaryAction)
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
    vendorAcceptDeadline: order.vendorAcceptDeadline ?? null,
    sla: formatCountdown(order.vendorAcceptDeadline) || undefined,
    prepStartedAt: order.prepStartedAt ?? null,
    primaryAction,
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
        tab: data.tab ?? 'dine_in',
        activeCount:
          typeof data.activeCount === 'number'
            ? data.activeCount
            : Object.values(columns).reduce(
                (count, list) => count + (Array.isArray(list) ? list.length : 0),
                0,
              ),
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
      tab: data.tab ?? 'delivery_pickup',
      activeCount:
        typeof data.activeCount === 'number'
          ? data.activeCount
          : Object.values(columns).reduce(
              (count, list) => count + (Array.isArray(list) ? list.length : 0),
              0,
            ),
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
      tab: data.tab ?? null,
      activeCount:
        typeof data.activeCount === 'number'
          ? data.activeCount
          : null,
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
  tab: null,
  activeCount: 0,
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

/**
 * After POST start-preparing: move Accepted/Confirmed → Preparing.
 */
export function moveOrderToPreparingOnLiveBoard(
  boardData,
  { board = 'delivery', previousOrder, preparingOrder } = {},
) {
  if (!boardData || typeof boardData !== 'object') return boardData
  const moved = preparingOrder || previousOrder
  if (!moved) return boardData

  const nextMoved = {
    ...moved,
    prepStartedAt: moved.prepStartedAt || new Date().toISOString(),
    prepTime: moved.prepTime || '00:00',
    primaryAction: moved.primaryAction ?? null,
    sla: undefined,
  }

  if (board === 'dinein') {
    const dineIn = boardData.dineIn || { ...EMPTY_DINE_IN }
    return {
      ...boardData,
      dineIn: {
        new: dineIn.new || [],
        confirmed: (dineIn.confirmed || []).filter(
          (order) => !sameLiveOrder(order, previousOrder || moved),
        ),
        preparing: [
          nextMoved,
          ...(dineIn.preparing || []).filter(
            (order) => !sameLiveOrder(order, previousOrder || moved),
          ),
        ],
        ready: dineIn.ready || [],
      },
    }
  }

  const delivery = boardData.delivery || { ...EMPTY_DELIVERY }
  return {
    ...boardData,
    delivery: {
      new: delivery.new || [],
      accepted: (delivery.accepted || []).filter(
        (order) => !sameLiveOrder(order, previousOrder || moved),
      ),
      preparing: [
        nextMoved,
        ...(delivery.preparing || []).filter(
          (order) => !sameLiveOrder(order, previousOrder || moved),
        ),
      ],
      ready: delivery.ready || [],
    },
  }
}

/**
 * After POST mark-ready: move Preparing → Ready.
 */
export function moveOrderToReadyOnLiveBoard(
  boardData,
  { board = 'delivery', previousOrder, readyOrder } = {},
) {
  if (!boardData || typeof boardData !== 'object') return boardData
  const moved = readyOrder || previousOrder
  if (!moved) return boardData

  const nextMoved = {
    ...moved,
    prepTime: undefined,
    prepDelay: false,
    readyLabel: moved.readyLabel || undefined,
    primaryAction: moved.primaryAction ?? null,
  }

  if (board === 'dinein') {
    const dineIn = boardData.dineIn || { ...EMPTY_DINE_IN }
    return {
      ...boardData,
      dineIn: {
        new: dineIn.new || [],
        confirmed: dineIn.confirmed || [],
        preparing: (dineIn.preparing || []).filter(
          (order) => !sameLiveOrder(order, previousOrder || moved),
        ),
        ready: [
          nextMoved,
          ...(dineIn.ready || []).filter((order) => !sameLiveOrder(order, previousOrder || moved)),
        ],
      },
    }
  }

  const delivery = boardData.delivery || { ...EMPTY_DELIVERY }
  return {
    ...boardData,
    delivery: {
      new: delivery.new || [],
      accepted: delivery.accepted || [],
      preparing: (delivery.preparing || []).filter(
        (order) => !sameLiveOrder(order, previousOrder || moved),
      ),
      ready: [
        nextMoved,
        ...(delivery.ready || []).filter((order) => !sameLiveOrder(order, previousOrder || moved)),
      ],
    },
  }
}

/**
 * After POST reject: remove the order from the New column (leaves the live board).
 */
export function removeRejectedOrderFromLiveBoard(boardData, { board = 'delivery', order } = {}) {
  if (!boardData || typeof boardData !== 'object' || !order) return boardData

  if (board === 'dinein') {
    const dineIn = boardData.dineIn || { ...EMPTY_DINE_IN }
    return {
      ...boardData,
      dineIn: {
        ...dineIn,
        new: (dineIn.new || []).filter((item) => !sameLiveOrder(item, order)),
      },
      activeCount:
        typeof boardData.activeCount === 'number'
          ? Math.max(0, boardData.activeCount - 1)
          : boardData.activeCount,
    }
  }

  const delivery = boardData.delivery || { ...EMPTY_DELIVERY }
  return {
    ...boardData,
    delivery: {
      ...delivery,
      new: (delivery.new || []).filter((item) => !sameLiveOrder(item, order)),
    },
    activeCount:
      typeof boardData.activeCount === 'number'
        ? Math.max(0, boardData.activeCount - 1)
        : boardData.activeCount,
  }
}

/**
 * After POST complete: remove the order from the Ready column (leaves the live board).
 */
export function removeCompletedOrderFromLiveBoard(boardData, { board = 'delivery', order } = {}) {
  if (!boardData || typeof boardData !== 'object' || !order) return boardData

  if (board === 'dinein') {
    const dineIn = boardData.dineIn || { ...EMPTY_DINE_IN }
    return {
      ...boardData,
      dineIn: {
        ...dineIn,
        ready: (dineIn.ready || []).filter((item) => !sameLiveOrder(item, order)),
      },
      activeCount:
        typeof boardData.activeCount === 'number'
          ? Math.max(0, boardData.activeCount - 1)
          : boardData.activeCount,
    }
  }

  const delivery = boardData.delivery || { ...EMPTY_DELIVERY }
  return {
    ...boardData,
    delivery: {
      ...delivery,
      ready: (delivery.ready || []).filter((item) => !sameLiveOrder(item, order)),
    },
    activeCount:
      typeof boardData.activeCount === 'number'
        ? Math.max(0, boardData.activeCount - 1)
        : boardData.activeCount,
  }
}

