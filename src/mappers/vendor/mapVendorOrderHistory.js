import { ApiError } from '../../api/errors'

function formatMoneyBhd(value) {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'string' && /bhd/i.test(value)) return value
  const numeric = Number(value)
  if (Number.isNaN(numeric)) return String(value)
  return `${numeric.toFixed(3)} BHD`
}

function formatWhen(isoOrLabel) {
  if (!isoOrLabel) return '—'
  if (typeof isoOrLabel === 'string' && !/^\d{4}-\d{2}-\d{2}/.test(isoOrLabel) && Number.isNaN(Date.parse(isoOrLabel))) {
    return isoOrLabel
  }
  const date = new Date(isoOrLabel)
  if (Number.isNaN(date.getTime())) return String(isoOrLabel)
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function mapOrderType(orderType) {
  const raw = String(orderType || '').trim().toUpperCase()
  if (raw === 'DELIVERY') return 'Delivery'
  if (raw === 'PICKUP') return 'Pickup'
  if (raw === 'DINE_IN') return 'Dine-in'
  if (raw === 'SERVICE' || raw === 'SERVICES') return 'Services'
  if (!raw) return '—'
  return raw
    .replace(/[_-]+/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function mapStatusLabel(status) {
  const raw = String(status || '').trim()
  if (!raw) return '—'
  if (!/[_A-Z]/.test(raw) || raw.includes(' ')) return raw
  return raw
    .replace(/[_-]+/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function isUiShapedHistoryOrder(order) {
  return (
    order &&
    typeof order === 'object' &&
    typeof order.id === 'string' &&
    typeof order.type === 'string' &&
    typeof order.customer === 'string' &&
    order.orderType == null
  )
}

/**
 * Map one history order into Orders history table / detail UI shape.
 * Confirmed list fields: id, orderNumber, orderType, fulfillmentType,
 * deliverySpeed, status, paymentStatus, paymentMethod, branch, customer.
 * Money / when / items / timeline are optional when present on the payload.
 */
export function mapVendorOrderHistoryItem(order) {
  if (!order || typeof order !== 'object') {
    throw new ApiError({ message: 'Invalid order history payload from the server.' })
  }

  if (isUiShapedHistoryOrder(order)) {
    return { ...order, backendId: order.backendId ?? null }
  }

  const customer = order.customer && typeof order.customer === 'object' ? order.customer : null
  const branch = order.branch && typeof order.branch === 'object' ? order.branch : null
  const displayId = order.orderNumber ? String(order.orderNumber) : String(order.id || '')

  const whenSource =
    order.when ||
    order.completedAt ||
    order.cancelledAt ||
    order.deliveredAt ||
    order.createdAt ||
    order.placedAt ||
    order.updatedAt ||
    null

  const items = Array.isArray(order.items)
    ? order.items.map((item) => ({
        qty: item.quantity ?? item.qty ?? 1,
        name: item.name || item.title || 'Item',
        price: formatMoneyBhd(item.lineTotal ?? item.unitPrice ?? item.price),
      }))
    : []

  const timeline = Array.isArray(order.timeline)
    ? order.timeline.map((event) => ({
        label: event.label || event.status || 'Event',
        time: formatWhen(event.time || event.at || event.timestamp),
      }))
    : []

  return {
    id: displayId,
    backendId: order.id ?? null,
    orderNumber: order.orderNumber ?? null,
    type: mapOrderType(order.orderType || order.type),
    status: mapStatusLabel(order.status),
    branch: branch?.name ?? (typeof order.branch === 'string' ? order.branch : '—'),
    branchArea: branch?.area ?? null,
    branchId: branch?.id ?? null,
    customer: customer?.name ?? (typeof order.customer === 'string' ? order.customer : '—'),
    customerPhone: customer?.phone ?? null,
    when: formatWhen(whenSource),
    total: formatMoneyBhd(order.totalAmount ?? order.total ?? order.subtotal),
    paymentStatus: order.paymentStatus ?? null,
    paymentMethod: order.paymentMethod ?? null,
    fulfillmentType: order.fulfillmentType ?? null,
    deliverySpeed: order.deliverySpeed ?? null,
    partySize: order.partySize ?? null,
    orderType: order.orderType ?? null,
    backendStatus: order.status ?? null,
    items,
    subtotal: order.subtotal != null ? formatMoneyBhd(order.subtotal) : undefined,
    delivery: order.deliveryFee != null ? formatMoneyBhd(order.deliveryFee) : undefined,
    vat: order.vatAmount != null ? formatMoneyBhd(order.vatAmount) : undefined,
    paid: order.paymentMethod || undefined,
    timeline,
  }
}

function mapHistoryOrders(list) {
  return list
    .map((item) => {
      try {
        return mapVendorOrderHistoryItem(item)
      } catch {
        return null
      }
    })
    .filter(Boolean)
}

function mapHistoryPagination(pagination, ordersLength, fallbackLimit = 20) {
  const source = pagination && typeof pagination === 'object' ? pagination : {}
  const limit = Number(source.limit) || fallbackLimit
  const total = Number(source.total)
  const resolvedTotal = Number.isFinite(total) ? total : ordersLength
  const page = Math.max(1, Number(source.page) || 1)
  const pagesFromApi = Number(source.pages)
  const pages = Number.isFinite(pagesFromApi)
    ? Math.max(0, pagesFromApi)
    : Math.ceil(resolvedTotal / limit) || 0

  return {
    page,
    limit,
    total: resolvedTotal,
    pages,
  }
}

/**
 * Normalize history list response into UI shape.
 * Confirmed shape: { orders: [...], pagination?: { page, limit, total, pages } }
 */
export function mapVendorOrderHistoryResponse(data) {
  if (Array.isArray(data)) {
    const orders = mapHistoryOrders(data)
    return {
      orders,
      pagination: mapHistoryPagination(null, orders.length),
    }
  }

  if (data && typeof data === 'object' && Array.isArray(data.orders)) {
    const orders = mapHistoryOrders(data.orders)
    return {
      orders,
      pagination: mapHistoryPagination(data.pagination, orders.length),
    }
  }

  throw new ApiError({ message: 'Invalid order history response from the server.' })
}

/**
 * Normalize a single order-detail payload into history UI shape.
 * Confirmed: GET /vendor-panel/orders/:orderId → { id, orderNumber, ... }
 */
export function mapVendorOrderDetailResponse(data) {
  if (data && typeof data === 'object' && data.order && typeof data.order === 'object') {
    return mapVendorOrderHistoryItem(data.order)
  }
  return mapVendorOrderHistoryItem(data)
}

export const emptyVendorOrderHistory = {
  orders: [],
  pagination: { page: 1, limit: 20, total: 0, pages: 0 },
}
