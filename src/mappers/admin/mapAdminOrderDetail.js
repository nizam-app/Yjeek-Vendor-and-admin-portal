import { ApiError } from '../../api/errors'
import { enrichIncidentRow } from '../../lib/adminIncidentPresentation'

const ACTION_LABELS = {
  REASSIGN_CHAMP: { group: 'Dispatch', icon: '↻', label: 'Reassign champ', tone: 'text-[#2876c7]' },
  REDISPATCH: { group: 'Dispatch', icon: '↻', label: 'Redispatch order', tone: 'text-[#2876c7]' },
  REDELIVER: { group: 'Dispatch', icon: '📦', label: 'Redeliver', tone: 'text-[#2876c7]' },
  REPLACE: { group: 'Dispatch', icon: '📦', label: 'Replace items', tone: 'text-[#2876c7]' },
  REFUND: { group: 'Resolution', icon: '↩', label: 'Refund — full/partial', tone: 'text-[#18a653]' },
  GOODWILL_CREDIT: { group: 'Resolution', icon: '🎁', label: 'Goodwill credit', tone: 'text-[#18a653]' },
  CANCEL: { group: 'Resolution', icon: '×', label: 'Cancel order', tone: 'text-[#d92f35]' },
  START_INVESTIGATION: { group: 'Investigate', icon: '🔍', label: 'Start investigation', tone: 'text-[#2876c7]' },
  REQUEST_PARTY_RESPONSE: { group: 'Investigate', icon: '💬', label: 'Request party response', tone: 'text-[#2876c7]' },
  ESCALATE_SEVERITY: { group: 'Investigate', icon: '⬆', label: 'Escalate severity', tone: 'text-[#c68618]' },
  SUSPEND_CHAMP: { group: 'Enforcement', icon: '⊘', label: 'Suspend champ', tone: 'text-[#dc2931]' },
  FLAG_VENDOR: { group: 'Enforcement', icon: '⚑', label: 'Flag vendor', tone: 'text-[#d92f35]' },
  APPLY_VPI_PENALTY: { group: 'Enforcement', icon: '⚠', label: 'Apply VPI penalty', tone: 'text-[#d92f35]' },
  APPLY_CPI_PENALTY: { group: 'Enforcement', icon: '⚠', label: 'Apply CPI penalty', tone: 'text-[#d92f35]' },
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
      const statusRaw = String(item.status || item.lifecycleState || '').toUpperCase()
      const resolved =
        statusRaw === 'RESOLVED' || statusRaw === 'CLOSED' || item.resolvedAt != null
      const statusLabel = resolved
        ? 'Solved'
        : statusRaw === 'PENDING' || statusRaw === 'OPEN' || statusRaw === 'REOPENED'
          ? 'Pending'
          : humanizeAdminStatus(item.status || item.lifecycleState)
      const statusTone = resolved ? 'green' : 'yellow'
      const openedClock = item.openedAt
        ? formatClock(item.openedAt)
        : item.createdAt
          ? formatClock(item.createdAt)
          : null
      const metaParts = []
      if (item.reportedByCustomer) metaParts.push('Reported by customer')
      else if (item.source) metaParts.push(String(item.source).replace(/_/g, ' '))
      else metaParts.push('Auto')
      if (openedClock) metaParts.push(openedClock)
      if (resolved && item.resolvedAt) {
        metaParts.push(
          `resolved ${formatClock(item.resolvedAt)}${item.resolvedByName ? ` by ${item.resolvedByName}` : ''}`,
        )
      } else if (!resolved) {
        metaParts.push(item.acknowledgedByName ? `with ${item.acknowledgedByName}` : 'awaiting Ops action')
      }

      return enrichIncidentRow({
        id: item.id ? String(item.id) : null,
        title: item.title || item.type || 'Incident',
        status: statusLabel,
        statusRaw: resolved ? 'RESOLVED' : statusRaw || 'OPEN',
        statusTone,
        detail: item.note || '—',
        meta: metaParts.filter(Boolean).join(' · '),
        priority: item.priority ?? null,
        type: item.type ?? null,
        note: item.note ?? null,
        cause: item.cause ?? null,
        stage: item.stage ?? null,
        reportedByCustomer: item.reportedByCustomer ?? false,
        createdAt: item.createdAt ?? null,
        resolvedAt: item.resolvedAt ?? null,
        resolvedByName: item.resolvedByName ?? null,
        lifecycleState: item.lifecycleState ?? null,
        source: item.source ?? null,
        category: item.category ?? null,
        categoryLabel: item.categoryLabel ?? null,
        openedAt: item.openedAt ?? null,
        firstResponseAt: item.firstResponseAt ?? null,
        acknowledgedAt: item.acknowledgedAt ?? null,
        acknowledgedByName: item.acknowledgedByName ?? null,
        recurredWithin14Days: item.recurredWithin14Days ?? false,
        recurrenceCount14d: item.recurrenceCount14d ?? null,
        recurrenceContext: item.recurrenceContext ?? null,
        evidenceCount: item.evidenceCount ?? (Array.isArray(item.evidence) ? item.evidence.length : 0),
        evidence: Array.isArray(item.evidence) ? item.evidence : [],
        resolutionActionCode: item.resolutionActionCode ?? null,
        previousResolutionActionCode: item.previousResolutionActionCode ?? null,
        costBearer: item.costBearer ?? null,
        compensationAmountBhd: item.compensationAmountBhd ?? null,
        customerRemedy: item.customerRemedy ?? null,
        incidentSlaDeadlineAt: item.incidentSlaDeadlineAt ?? null,
        readinessManaged: item.readinessManaged ?? false,
        evidenceHoldAt: item.evidenceHoldAt ?? null,
        chatConversationId: item.chatConversationId ?? null,
        openedBy: item.openedBy ?? null,
        slaBreached: Boolean(item.slaBreached),
      })
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

  const codes = [...new Set([...list, 'START_INVESTIGATION', 'REQUEST_PARTY_RESPONSE', 'ESCALATE_SEVERITY', 'REDELIVER', 'REPLACE', 'GOODWILL_CREDIT', 'APPLY_VPI_PENALTY', 'APPLY_CPI_PENALTY'])]

  for (const code of codes) {
    const key = String(code || '')
    const meta = ACTION_LABELS[key]
    if (!meta) continue
    if (key === 'SUSPEND_CHAMP' && !hasChamp) continue
    if (!groups.has(meta.group)) groups.set(meta.group, [])
    groups.get(meta.group).push({
      code: key,
      icon: meta.icon,
      label: meta.label,
      tone: meta.tone,
      disabled: Boolean(meta.deferred),
      deferredReason: meta.deferred ? 'Coming in a later phase' : null,
    })
  }

  const groupOrder = ['Dispatch', 'Resolution', 'Investigate', 'Enforcement', 'Close-out']
  return groupOrder
    .filter((title) => groups.has(title))
    .map((title) => ({ title, actions: groups.get(title) }))
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
      vehicle:
        [champ?.vehicleType, champ?.plateNumber].filter(Boolean).join(' ') ||
        champ?.vehicle ||
        '—',
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
    pickupLabel: formatPickup(locations.pickup),
    dropoffLabel: formatDropoff(locations.dropoff),
    itemCount,
    vendorAcceptance:
      data.vendorAcceptance && typeof data.vendorAcceptance === 'object'
        ? data.vendorAcceptance
        : null,
  }
}
