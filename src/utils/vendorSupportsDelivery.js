const DELIVERY_SERVICE_MODE_LABELS = new Set([
  'Hot food · on demand',
  'Scheduled delivery',
])

/**
 * Whether the vendor offers any delivery mode (on-demand or scheduled).
 * Used to gate cash-on-delivery admin controls and create payloads.
 */
export function vendorSupportsDelivery({ orderTypes, serviceModes } = {}) {
  if (Array.isArray(orderTypes) && orderTypes.length > 0) {
    return orderTypes.includes('DELIVERY')
  }
  if (Array.isArray(serviceModes) && serviceModes.length > 0) {
    return serviceModes.some((label) => DELIVERY_SERVICE_MODE_LABELS.has(label))
  }
  return true
}
