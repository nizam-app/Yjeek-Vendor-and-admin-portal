import { ApiError } from '../../api/errors'
import {
  enrichIncidentRow,
  buildIncidentHistoryRows,
  INCIDENT_PRIORITY_RANK,
} from '../../lib/adminIncidentPresentation'

const PRIORITY_TONE = {
  P1: 'red',
  P2: 'yellow',
  P3: 'blue',
  P4: 'gray',
}

function mapStatusLabel(status, statusLabel) {
  if (statusLabel) return String(statusLabel)
  switch (String(status || '').toUpperCase()) {
    case 'OPEN':
      return 'Open'
    case 'PENDING':
      return 'Pending'
    case 'RESOLVED':
      return 'Resolved'
    default:
      return status ? String(status) : '—'
  }
}

/** Relative age from createdAt for IncidentLog time column. */
export function formatAdminIncidentRelativeTime(iso) {
  if (!iso) return ''
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''
  const mins = Math.floor((Date.now() - then) / 60000)
  if (mins < 0) return ''
  if (mins < 1) return 'now'
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 48) return `${hours}h`
  return `${Math.floor(hours / 24)}d`
}

/**
 * Map one confirmed incident list/feed item into UI log row shape.
 * @param {Record<string, unknown>} item
 */
export function mapAdminIncidentItem(item) {
  if (!item || typeof item !== 'object') return null
  if (!item.id && !item.title && !item.type) return null

  const priorityRaw = item.priorityLabel
    ? String(item.priorityLabel)
    : item.priority
      ? String(item.priority)
      : null
  const priority = priorityRaw && INCIDENT_PRIORITY_RANK[priorityRaw.toUpperCase()]
    ? priorityRaw.toUpperCase()
    : null
  const statusRaw = item.status ? String(item.status) : ''
  const statusLabel = mapStatusLabel(statusRaw, item.statusLabel)
  const statusLower = statusLabel ? statusLabel.toLowerCase() : statusRaw.toLowerCase()
  const orderNumber = item.orderNumber ? String(item.orderNumber) : null
  const title = item.title || item.type || 'Incident'
  const detail = orderNumber ? `#${orderNumber} · ${statusLower}` : statusLower

  return enrichIncidentRow({
    id: item.id ? String(item.id) : `inc-${String(title)}-${detail}`,
    priority,
    tone: priority ? (PRIORITY_TONE[priority] || 'gray') : 'gray',
    title: String(title),
    /** Alias for IncidentLog (scheduled) which uses `name`. */
    name: String(title),
    detail,
    status: statusLabel,
    statusRaw: statusRaw || null,
    type: item.type ?? null,
    note: item.note ?? null,
    cause: item.cause ?? null,
    stage: item.stage ?? null,
    reportedByCustomer: Boolean(item.reportedByCustomer),
    orderId: item.orderId ?? null,
    orderNumber,
    orderStatus: item.orderStatus ?? null,
    vendorId: item.vendorId ?? null,
    vendorName: item.vendorName ?? null,
    vendorDisplayCode: item.vendorDisplayCode ?? null,
    customerName: item.customerName ?? null,
    champName: item.champName ?? null,
    resolvedAt: item.resolvedAt ?? null,
    resolvedByName: item.resolvedByName ?? null,
    acknowledgedAt: item.acknowledgedAt ?? null,
    acknowledgedByName: item.acknowledgedByName ?? null,
    createdAt: item.createdAt ?? null,
    createdLabel: item.createdLabel ? String(item.createdLabel) : null,
    time: item.createdLabel
      ? String(item.createdLabel)
      : formatAdminIncidentRelativeTime(item.createdAt),
    metadata: item.metadata && typeof item.metadata === 'object' ? item.metadata : null,
    lifecycleState: item.lifecycleState ?? null,
    source: item.source ?? null,
    incidentClass: item.incidentClass ?? null,
    category: item.category ?? null,
    subCategory: item.subCategory ?? null,
    severity: item.severity ?? null,
    openedAt: item.openedAt ?? null,
    firstResponseAt: item.firstResponseAt ?? null,
    assignedToUserId: item.assignedToUserId ?? null,
    evidenceHoldAt: item.evidenceHoldAt ?? null,
    partyNotifiedAt: item.partyNotifiedAt ?? null,
    partyRespondedAt: item.partyRespondedAt ?? null,
    customerRemedy: item.customerRemedy ?? null,
    costBearer: item.costBearer ?? null,
    bearerWasOverridden: item.bearerWasOverridden ?? false,
    resolutionActionCode: item.resolutionActionCode ?? null,
    previousResolutionActionCode: item.previousResolutionActionCode ?? null,
    compensationAmountBhd: item.compensationAmountBhd ?? null,
    compensationType: item.compensationType ?? null,
    recurredWithin14Days: item.recurredWithin14Days ?? false,
    recurrenceCount14d: item.recurrenceCount14d ?? null,
    recurrenceContext: item.recurrenceContext ?? null,
    evidenceCount: item.evidenceCount ?? item._count?.evidence ?? 0,
    resolutionSummary: item.resolutionSummary ?? null,
    incidentSlaDeadlineAt: item.incidentSlaDeadlineAt ?? null,
    readinessManaged: item.readinessManaged ?? false,
  })
}

function mapSummary(summary) {
  if (!summary || typeof summary !== 'object') {
    return {
      open: 0,
      pending: 0,
      resolved: 0,
      criticalOpen: 0,
      totalOpen: 0,
    }
  }
  return {
    open: Number(summary.open) || 0,
    pending: Number(summary.pending) || 0,
    resolved: Number(summary.resolved) || 0,
    criticalOpen: Number(summary.criticalOpen) || 0,
    totalOpen: Number(summary.totalOpen) || 0,
  }
}

/**
 * Map confirmed GET /admin/incidents `data`
 * (also compatible with older dashboard feed that only returns `{ items }`).
 * @param {Record<string, unknown>|null|undefined} data
 */
export function mapAdminIncidentsResponse(data) {
  if (!data || typeof data !== 'object') {
    throw new ApiError({
      message: 'Invalid incidents list response from the server.',
    })
  }

  const items = (Array.isArray(data.items) ? data.items : [])
    .map((item) => mapAdminIncidentItem(item))
    .filter(Boolean)

  return {
    page: data.page != null ? Number(data.page) : 1,
    limit: data.limit != null ? Number(data.limit) : items.length,
    total: data.total != null ? Number(data.total) : items.length,
    summary: mapSummary(data.summary),
    items,
  }
}

export function emptyAdminIncidents() {
  return {
    page: 1,
    limit: 50,
    total: 0,
    summary: {
      open: 0,
      pending: 0,
      resolved: 0,
      criticalOpen: 0,
      totalOpen: 0,
    },
    items: [],
  }
}

function formatWhen(iso) {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleString([], {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

/**
 * Build incident history from confirmed timestamps + actor names.
 * No invented events — only rows the API actually sent.
 */
export function mapAdminIncidentHistory(incident) {
  if (!incident) return []
  const enriched = enrichIncidentRow(incident)
  return buildIncidentHistoryRows(enriched).map((row, index) => ({
    id: row.id || `event-${index}`,
    label: row.label,
    actor: row.actor,
    at: row.at
      ? new Date(row.at).toLocaleString([], {
          day: '2-digit',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })
      : null,
  }))
}

/**
 * Map GET /admin/incidents/:id `data`.
 */
export function mapAdminIncidentDetail(data) {
  const item = mapAdminIncidentItem(data)
  if (!item) {
    throw new ApiError({ message: 'Invalid incident detail from the server.' })
  }

  return {
    ...item,
    order: data?.order && typeof data.order === 'object' ? data.order : null,
    evidence: Array.isArray(data?.evidence) ? data.evidence : [],
    typedActions: Array.isArray(data?.typedActions) ? data.typedActions : [],
    availableActions: Array.isArray(data?.availableActions) ? data.availableActions : [],
    chatConversationId: data?.chatConversationId ?? null,
    canResolve: Boolean(data?.canResolve),
    history: mapAdminIncidentHistory(item),
  }
}

