import { ApiError } from '../../api/errors'

function formatMoneyBhd(value) {
  if (value === null || value === undefined || value === '') return 'BHD 0.000'
  if (typeof value === 'string' && /bhd/i.test(value)) return value
  const numeric = Number(value)
  if (Number.isNaN(numeric)) return String(value)
  return `BHD ${numeric.toFixed(3)}`
}

function mapOrderType(orderType) {
  const raw = String(orderType || '').trim().toUpperCase()
  if (raw === 'DELIVERY') return 'Delivery'
  if (raw === 'PICKUP') return 'Pickup'
  if (raw === 'DINE_IN') return 'Dine-in'
  if (raw === 'SERVICE' || raw === 'SERVICES') return 'Services'
  if (!raw) return null
  return raw
    .replace(/[_-]+/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function mapStatusLabel(status) {
  const raw = String(status || '').trim()
  if (!raw) return null
  if (!/[_A-Z]/.test(raw) || raw.includes(' ')) return raw
  return raw
    .replace(/[_-]+/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function isUiShapedReceipt(receipt) {
  return (
    receipt &&
    typeof receipt === 'object' &&
    typeof receipt.branch === 'string' &&
    (typeof receipt.id === 'string' || typeof receipt.orderNumber === 'string') &&
    Array.isArray(receipt.items) &&
    receipt.vendorName == null &&
    receipt.branchName == null
  )
}

/**
 * Map GET /vendor-panel/orders/:orderId/receipt into receipt modal UI shape.
 * Confirmed fields: orderNumber, status, vendorName, branchName, orderType,
 * fulfillmentType, deliverySpeed, customerName, items[], subtotal, deliveryFee,
 * serviceFee, discountAmount. Optional money/payment fields when present.
 */
export function mapVendorOrderReceiptResponse(data) {
  if (!data || typeof data !== 'object') {
    throw new ApiError({ message: 'Invalid order receipt response from the server.' })
  }

  if (data.receipt && typeof data.receipt === 'object') {
    return mapVendorOrderReceiptResponse(data.receipt)
  }

  if (isUiShapedReceipt(data)) {
    return {
      ...data,
      id: data.id || data.orderNumber,
      badge: data.badge || data.paid || data.paymentStatus || data.status || 'Receipt',
    }
  }

  const items = Array.isArray(data.items)
    ? data.items.map((item) => ({
        qty: item.quantity ?? item.qty ?? 1,
        name: item.name || item.title || 'Item',
        price: formatMoneyBhd(item.lineTotal ?? item.unitPrice ?? item.price),
        unitPrice: item.unitPrice != null ? formatMoneyBhd(item.unitPrice) : undefined,
      }))
    : []

  const totalSource =
    data.grandTotal ?? data.totalAmount ?? data.total ?? data.subtotal ?? null
  const paymentLabel =
    data.paymentMethod ||
    data.paid ||
    (data.paymentStatus ? mapStatusLabel(data.paymentStatus) : null) ||
    null

  return {
    id: data.orderNumber ? String(data.orderNumber) : String(data.id || ''),
    orderNumber: data.orderNumber ?? null,
    status: mapStatusLabel(data.status),
    badge: mapStatusLabel(data.paymentStatus || data.status) || 'Receipt',
    vendorName: data.vendorName ?? null,
    branch: data.branchName || data.branch || data.vendorName || '—',
    branchName: data.branchName ?? null,
    type: mapOrderType(data.orderType),
    orderType: data.orderType ?? null,
    fulfillmentType: data.fulfillmentType ?? null,
    deliverySpeed: data.deliverySpeed ?? null,
    customer: data.customerName || data.customer || '—',
    customerName: data.customerName ?? null,
    when: data.when || data.paidAt || data.createdAt || data.completedAt || null,
    items,
    subtotal: formatMoneyBhd(data.subtotal),
    delivery: formatMoneyBhd(data.deliveryFee ?? 0),
    serviceFee: data.serviceFee != null ? formatMoneyBhd(data.serviceFee) : null,
    discount: data.discountAmount != null ? formatMoneyBhd(data.discountAmount) : null,
    vat: data.vatAmount != null ? formatMoneyBhd(data.vatAmount) : null,
    total: formatMoneyBhd(totalSource),
    paid: paymentLabel,
    paymentMethod: data.paymentMethod ?? null,
    paymentStatus: data.paymentStatus ?? null,
  }
}
