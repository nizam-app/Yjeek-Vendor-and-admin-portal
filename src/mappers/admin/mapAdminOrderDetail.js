import { ApiError } from '../../api/errors'

const ACTION_LABELS = {
  REASSIGN_CHAMP: { group: 'Dispatch', icon: '↻', label: 'Reassign champ', tone: 'text-[#2876c7]' },
  REDISPATCH: { group: 'Dispatch', icon: '↻', label: 'Redispatch order', tone: 'text-[#2876c7]' },
  REFUND: { group: 'Resolution', icon: '↝', label: 'Refund — full/partial', tone: 'text-[#18a653]' },
  CANCEL: { group: 'Resolution', icon: '×', label: 'Cancel order', tone: 'text-[#d92f35]' },
  SUSPEND_CHAMP: { group: 'Enforcement · Ops', icon: '⊘', label: 'Suspend champ', tone: 'text-[#dc2931]' },
  FLAG_VENDOR: { group: 'Enforcement · Ops', icon: '⚑', label: 'Flag vendor', tone: 'text-[#d92f35]' },
  MARK_RESOLVED: { group: 'Close-out', icon: '✓', label: 'Mark resolved', tone: 'text-[#18a653]' },
}

export function humanizeAdminStatus(status) {
  if (!status) return '—'
  return String(status)
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

export function formatAdminMoney(amount, currency = 'BHD') {
  if (amount === null || amount === undefined || amount === '') return '—'
  const numeric = Number(amount)
  if (Number.isNaN(numeric)) return '—'
  const formatted = numeric.toFixed(3)
  return `${currency} ${formatted}`
}

function formatClock(iso) {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
}

function formatPayment(payment) {
  if (!payment || typeof payment !== 'object') return '—'
  const method = payment.method
    ? String(payment.method).replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
    : '—'
  const status = payment.status ? String(payment.status).toLowerCase() : ''
  return status ? `${method} · ${status}` : method
}

function formatDropoff(dropoff) {
  if (!dropoff || typeof dropoff !== 'object') return '—'
  const parts = [dropoff.line1, dropoff.area, dropoff.city].filter(Boolean)
  if (parts.length) return parts.join(', ')
  if (dropoff.block) return `Blk ${dropoff.block}`
  return '—'
}

function formatPickup(pickup) {
  if (!pickup || typeof pickup !== 'object') return '—'
  const name = pickup.name || ''
  const area = pickup.area || ''
  if (name && area) return `${name}, ${area}`
  return name || area || pickup.address || '—'
}

/**
 * Map API timeline entries only — do not invent missing stages.
 * @param {unknown[]} timeline
 * @param {string|null} currentStatus
 */
export function mapAdminOrderTimeline(timeline, currentStatus) {
  const entries = Array.isArray(timeline) ? timeline : []
  return entries
    .map((entry, index) => {
      if (!entry || typeof entry !== 'object') return null
      const status = entry.status || '—'
      const label = humanizeAdminStatus(status)
      const time = entry.at ? formatClock(entry.at) : '—'
      const isLast = index === entries.length - 1
      const matchesCurrent = currentStatus && String(status) === String(currentStatus)
      let state = 'done'
      if (matchesCurrent || (isLast && !currentStatus)) state = 'active'
      return { label, time, state, status: String(status), note: entry.note ?? null, at: entry.at ?? null }
    })
    .filter(Boolean)
}

function mapOrderIncidents(incidents) {
  if (!Array.isArray(incidents)) return []
  return incidents
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const statusRaw = String(item.status || '').toUpperCase()
      const statusLabel =
        statusRaw === 'RESOLVED' ? 'Resolved' : statusRaw === 'PENDING' ? 'Pending' : statusRaw === 'OPEN' ? 'Open' : humanizeAdminStatus(item.status)
      const statusTone = statusRaw === 'RESOLVED' ? 'green' : statusRaw === 'PENDING' ? 'yellow' : 'red'
      const badges = []
      if (item.cause) badges.push([`Cause: ${humanizeAdminStatus(item.cause)}`, 'yellow'])
      if (item.stage) badges.push([`Stage: ${item.stage}`, 'gray'])
      if (item.reportedByCustomer) badges.push(['Reported', 'blue'])

      return {
        id: item.id ? String(item.id) : null,
        title: item.title || item.type || 'Incident',
        status: statusLabel,
        statusTone,
        badges,
        detail: item.note || '—',
        meta: [
          item.cause ? humanizeAdminStatus(item.cause) : null,
          item.createdAt ? formatClock(item.createdAt) : null,
          item.resolvedByName ? `resolved by ${item.resolvedByName}` : null,
          item.resolvedAt ? `resolved ${formatClock(item.resolvedAt)}` : null,
        ]
          .filter(Boolean)
          .join(' · '),
        priority: item.priority ?? null,
        type: item.type ?? null,
      }
    })
    .filter(Boolean)
}

/**
 * Group confirmed availableActions into Take-action menu sections.
 * Unknown action codes are skipped (not invented).
 * @param {unknown[]} actions
 * @param {{ hasChamp?: boolean }} [options]
 */
export function mapAdminAvailableActions(actions, options = {}) {
  const list = Array.isArray(actions) ? actions : []
  const groups = new Map()
  const hasChamp = options.hasChamp == null ? true : Boolean(options.hasChamp)

  for (const code of list) {
    const key = String(code || '')
    const meta = ACTION_LABELS[key]
    if (!meta) continue
    // Suspend requires an assigned champ (driverId) — hide when unassigned.
    if (key === 'SUSPEND_CHAMP' && !hasChamp) continue
    if (!groups.has(meta.group)) groups.set(meta.group, [])
    groups.get(meta.group).push({
      code: key,
      icon: meta.icon,
      label: meta.label,
      tone: meta.tone,
    })
  }

  return Array.from(groups.entries()).map(([title, items]) => ({ title, actions: items }))
}

function computeRemainingRefundable(data, payment) {
  if (data?.remainingRefundable != null && data.remainingRefundable !== '') {
    const n = Number(data.remainingRefundable)
    if (!Number.isNaN(n)) return Math.max(0, n)
  }

  const paid = Number(payment?.amount ?? data?.summary?.orderValue ?? data?.totals?.totalAmount)
  if (Number.isNaN(paid)) return null

  const refunds = Array.isArray(data?.refunds) ? data.refunds : []
  const refunded = refunds.reduce((sum, entry) => {
    if (!entry || typeof entry !== 'object') return sum
    const status = String(entry.status || '').toUpperCase()
    if (status && !['COMPLETED', 'PAID', 'SUCCESS'].includes(status)) return sum
    const amount = Number(entry.amount)
    return sum + (Number.isNaN(amount) ? 0 : amount)
  }, 0)

  return Math.max(0, paid - refunded)
}

/**
 * Map confirmed GET /admin/orders/:id `data` into Admin order-detail modal shape.
 * @param {Record<string, unknown>|null|undefined} data
 */
export function mapAdminOrderDetailResponse(data) {
  if (!data || typeof data !== 'object') {
    throw new ApiError({ message: 'Invalid order detail response from the server.' })
  }

  const payment = data.payment && typeof data.payment === 'object' ? data.payment : null
  const summary = data.summary && typeof data.summary === 'object' ? data.summary : {}
  const totals = data.totals && typeof data.totals === 'object' ? data.totals : {}
  const locations = data.locations && typeof data.locations === 'object' ? data.locations : {}
  const customer = data.customer && typeof data.customer === 'object' ? data.customer : null
  const vendor = data.vendor && typeof data.vendor === 'object' ? data.vendor : null
  const champ = data.champ && typeof data.champ === 'object' ? data.champ : null
  const currency = summary.currency || 'BHD'
  const statusLabel = humanizeAdminStatus(data.status)
  const stageLabel = data.stageLabel ? humanizeAdminStatus(data.stageLabel) : statusLabel
  const fulfillment =
    data.fulfillmentType === 'SCHEDULED'
      ? 'scheduled'
      : data.fulfillmentType === 'ON_DEMAND'
        ? 'on demand'
        : data.fulfillmentType
          ? String(data.fulfillmentType).toLowerCase().replace(/_/g, ' ')
          : null

  const items = (Array.isArray(data.items) ? data.items : [])
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const name = item.name || 'Item'
      const qty = item.quantity != null ? Number(item.quantity) : null
      return {
        id: item.id ?? null,
        name: qty != null ? `${name} ×${qty}` : String(name),
        price: formatAdminMoney(item.lineTotal ?? item.unitPrice, currency),
        quantity: qty,
        unitPrice: item.unitPrice ?? null,
        lineTotal: item.lineTotal ?? null,
      }
    })
    .filter(Boolean)

  const itemCount = summary.itemCount != null ? Number(summary.itemCount) : items.length
  const orderValue = formatAdminMoney(summary.orderValue ?? totals.totalAmount ?? payment?.amount, currency)
  const distanceKm = data.distanceKm == null || data.distanceKm === '' ? null : Number(data.distanceKm)
  const schedule =
    data.schedule && typeof data.schedule === 'object' ? data.schedule : null
  const scheduleWindow =
    data.windowLabel
    || data.scheduledWindowLabel
    || schedule?.windowLabel
    || schedule?.label
    || null
  const isScheduled = data.fulfillmentType === 'SCHEDULED'
  const distanceLabel = distanceKm == null || Number.isNaN(distanceKm) ? '—' : `${distanceKm} km`

  const liveSummaryRows = [
    ['Items', `${itemCount} item${itemCount === 1 ? '' : 's'}`],
    ['Order value', orderValue],
    ['Payment', formatPayment(payment)],
    ['Distance', distanceLabel],
    ['Pickup', formatPickup(locations.pickup)],
    ['Drop-off', formatDropoff(locations.dropoff)],
  ]

  const scheduledSummaryRows = [
    ['Items', `${itemCount} item${itemCount === 1 ? '' : 's'}`],
    ['Order value', orderValue],
    ['Schedule', scheduleWindow ? String(scheduleWindow) : '—'],
    ['Payment', formatPayment(payment)],
    ['Distance', distanceLabel],
    ['Pickup', formatPickup(locations.pickup)],
    ['Drop-off', formatDropoff(locations.dropoff)],
  ]

  const liveTotalsRows = [
    ['Subtotal', formatAdminMoney(totals.subtotal, currency)],
    ['Delivery fee', formatAdminMoney(totals.deliveryFee, currency)],
    ['Discount', `– ${formatAdminMoney(totals.discountAmount, currency)}`],
    ['Total', formatAdminMoney(totals.totalAmount ?? summary.orderValue, currency)],
  ]

  const scheduledTotalsRows = [
    ['Subtotal', formatAdminMoney(totals.subtotal, currency)],
    ['Delivery fee', formatAdminMoney(totals.deliveryFee, currency)],
    ['VAT', formatAdminMoney(totals.vatAmount, currency)],
    ['Discount', `– ${formatAdminMoney(totals.discountAmount, currency)}`],
    ['Total', formatAdminMoney(totals.totalAmount ?? summary.orderValue, currency)],
  ]

  return {
    id: data.orderNumber || data.id,
    orderId: data.id ?? null,
    orderNumber: data.orderNumber ? String(data.orderNumber) : null,
    status: data.status ?? null,
    statusLabel,
    stageLabel,
    category: data.category || '—',
    orderType: data.orderType ?? null,
    fulfillmentType: data.fulfillmentType ?? null,
    fulfillmentLabel: fulfillment,
    isScheduled,
    scheduleWindow: scheduleWindow ? String(scheduleWindow) : null,
    placedAt: data.placedAt ?? null,
    placedClock: formatClock(data.placedAt),
    slaBreached: Boolean(data.slaBreached),
    reported: Boolean(data.reported),
    incidentCount: Number(data.incidentCount) || 0,
    bucket: data.bucket ?? null,
    paymentLabel: formatPayment(payment),
    orderValue,
    orderValueAmount: (() => {
      const raw = summary.orderValue ?? totals.totalAmount ?? payment?.amount
      if (raw == null || raw === '') return null
      const n = Number(raw)
      return Number.isNaN(n) ? null : n
    })(),
    remainingRefundable: computeRemainingRefundable(data, payment),
    currency,
    distanceLabel,
    summaryRows: isScheduled ? scheduledSummaryRows : liveSummaryRows,
    items,
    totalsRows: isScheduled ? scheduledTotalsRows : liveTotalsRows,
    timeline: mapAdminOrderTimeline(data.timeline, data.status),
    customer: {
      name: customer?.name || '—',
      phone: customer?.phone || '—',
      address: customer?.address || '—',
      memberSince: customer?.memberSince != null ? String(customer.memberSince) : '—',
    },
    vendor: {
      name: vendor?.name || '—',
      branch: vendor?.branch || '—',
      phone: vendor?.phone || '—',
      prepTimeMin: vendor?.prepTimeMin != null ? `${vendor.prepTimeMin} min` : '—',
    },
    champ: {
      id: champ?.id ? String(champ.id) : null,
      name: champ?.name || 'Unassigned',
      vehicle: champ?.vehicle || champ?.vehicleType || '—',
      phone: champ?.phone || '—',
      status: champ?.status || (champ?.name ? 'Assigned' : 'Unassigned'),
    },
    people: [
      {
        title: 'Customer',
        rows: [
          ['Name', customer?.name || '—'],
          ['Phone', customer?.phone || '—'],
          ['Address', customer?.address || '—'],
        ],
      },
      {
        title: 'Vendor',
        rows: [
          ['Store', vendor?.name || '—'],
          ['Branch', vendor?.branch || '—'],
          ['Phone', vendor?.phone || '—'],
        ],
      },
      {
        title: 'Champ',
        rows: [
          ['Name', champ?.name || 'Unassigned'],
          ['Vehicle', champ?.vehicle || champ?.vehicleType || '—'],
          ['Status', champ?.status || (champ?.name ? 'Assigned' : 'Unassigned')],
        ],
      },
    ],
    incidents: mapOrderIncidents(data.incidents),
    actionGroups: mapAdminAvailableActions(data.availableActions, {
      hasChamp: Boolean(champ?.id),
    }),
    availableActions: Array.isArray(data.availableActions) ? data.availableActions.map(String) : [],
    conversationId: data.conversationId ?? null,
  }
}
