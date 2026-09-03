/** Centralized incident presentation for Live Orders / Admin incident UI. */

export const INCIDENT_PRIORITY_RANK = { P1: 1, P2: 2, P3: 3, P4: 4 }

export const INCIDENT_SEVERITY_UNCLASSIFIED = 'UNCLASSIFIED'

export const INCIDENT_PRIORITY_TONE = {
  P1: 'red',
  P2: 'yellow',
  P3: 'blue',
  P4: 'gray',
}

export const RESOLUTION_ACTION_LABELS = {
  REDELIVERED_SAME_ORDER: 'Redelivered',
  REFUND_FULL: 'Full refund',
  REFUND_PARTIAL: 'Partial refund',
  WALLET_CREDIT_GOODWILL: 'Goodwill credit',
  WALLET_CREDIT_SLA_BREACH: 'SLA breach credit',
  VOUCHER_ISSUED: 'Voucher issued',
  ITEM_REPLACED_BY_VENDOR: 'Item replaced',
  ORDER_CANCELLED_NO_CHARGE: 'Order cancelled',
  REASSIGNED_TO_NEW_CHAMP: 'Reassigned champ',
  DISPATCH_MANUAL_OVERRIDE: 'Redispatched',
  VENDOR_WARNED: 'Vendor flagged',
  VENDOR_SUSPENDED_TEMP: 'Vendor suspended',
  ITEM_SUSPENDED_PENDING_REVIEW: 'Item suspended',
  PENALTY_APPLIED_VPI: 'VPI penalty applied',
  PENALTY_APPLIED_CPI: 'CPI penalty applied',
  CHAMP_WARNED: 'Champ warned',
  CHAMP_SUSPENDED_TEMP: 'Champ suspended',
  ESCALATED_TO_AGENCY: 'Escalated to agency',
  ESCALATED_TO_INVESTIGATION: 'Escalated to investigation',
  CUSTOMER_EDUCATED_NO_ACTION: 'Customer educated',
  NO_ACTION_UNFOUNDED: 'No action — unfounded',
  PENDING_EXTERNAL: 'Pending external',
}

const LIFECYCLE_LABELS = {
  OPEN: 'Open',
  TRIAGED: 'Triaged',
  UNDER_INVESTIGATION: 'Under investigation',
  AWAITING_PARTY_RESPONSE: 'Awaiting party response',
  ACTION_TAKEN: 'Action taken',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
  REOPENED: 'Reopened',
}

const SOURCE_LABELS = {
  CUSTOMER_CHAT: 'Customer',
  CHAMP_REPORT: 'Champ',
  VENDOR_REPORT: 'Vendor',
  SYSTEM_ALERT: 'System',
  DISPATCHER: 'Dispatcher',
  ZOOOD_LANE: 'ZooOD',
}

const EVIDENCE_KIND_LABELS = {
  PHOTO: 'Photo',
  CHAT_TRANSCRIPT: 'Chat transcript',
  GPS_TRAIL: 'GPS trail',
  DOCUMENT: 'Document',
}

const COST_BEARER_LABELS = {
  VENDOR: 'Vendor',
  AGENCY: 'Champ agency',
  PLATFORM: 'Yjeek',
  CUSTOMER: 'Customer',
  SHARED: 'Shared',
  NOT_APPLICABLE: 'Not applicable',
}

export const CUSTOMER_REMEDY_LABELS = {
  REDELIVERY: 'Redelivery',
  REPLACEMENT: 'Replacement',
  REFUND_FULL: 'Full refund',
  REFUND_PARTIAL: 'Partial refund',
  GOODWILL_CREDIT: 'Goodwill credit',
  NONE: 'None',
}

export const ENFORCEMENT_LABELS = {
  WARNING: 'Warning',
  TEMP_SUSPENSION: 'Temporary suspension',
  TERMINATION: 'Termination',
  NONE: 'None',
}

export function formatCustomerRemedyLabel(value) {
  if (!value) return null
  return CUSTOMER_REMEDY_LABELS[value] || humanizeEnum(value)
}

export function formatEnforcementLabel(value) {
  if (!value) return null
  return ENFORCEMENT_LABELS[value] || humanizeEnum(value)
}

function humanizeEnum(value) {
  if (!value) return null
  return String(value)
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

export function formatIncidentAge(isoOrDate) {
  if (!isoOrDate) return null
  const then = isoOrDate instanceof Date ? isoOrDate.getTime() : new Date(isoOrDate).getTime()
  if (Number.isNaN(then)) return null
  const mins = Math.floor((Date.now() - then) / 60000)
  if (mins < 0) return null
  if (mins < 1) return 'now'
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 48) return `${hours}h`
  return `${Math.floor(hours / 24)}d`
}

export function normalizeIncidentPriority(incident) {
  const raw = incident?.priority || incident?.severity || incident?.priorityLabel || null
  if (!raw) return null
  const value = String(raw).toUpperCase()
  return INCIDENT_PRIORITY_RANK[value] ? value : null
}

export function incidentPriorityTone(priority) {
  return INCIDENT_PRIORITY_TONE[priority] || 'gray'
}

export function highestIncidentPriority(incidents) {
  const list = Array.isArray(incidents) ? incidents : []
  let best = null
  let bestRank = 99
  for (const incident of list) {
    const priority = normalizeIncidentPriority(incident)
    if (!priority) continue
    const rank = INCIDENT_PRIORITY_RANK[priority] ?? 99
    if (rank < bestRank) {
      bestRank = rank
      best = priority
    }
  }
  return best
}

export function formatIncidentCategory(incident) {
  if (!incident) return null
  if (incident.categoryLabel) return String(incident.categoryLabel)
  if (incident.category) return humanizeEnum(incident.category)
  if (incident.type) return String(incident.type)
  if (incident.title) return String(incident.title)
  return null
}

export function formatLifecycleLabel(incident) {
  if (!incident) return null
  const lifecycle = incident.lifecycleState
  if (lifecycle && LIFECYCLE_LABELS[lifecycle]) return LIFECYCLE_LABELS[lifecycle]
  if (incident.statusLabel) return String(incident.statusLabel)
  if (incident.status) return humanizeEnum(incident.status)
  return null
}

export function formatSourceLabel(incident) {
  if (!incident) return null
  if (incident.source && SOURCE_LABELS[incident.source]) return SOURCE_LABELS[incident.source]
  if (incident.reportedByCustomer) return 'Customer'
  if (incident.cause) return humanizeEnum(incident.cause)
  return null
}

export function isOpenIncident(incident) {
  const status = String(incident?.statusRaw || incident?.status || '').toUpperCase()
  if (status === 'RESOLVED') return false
  const lifecycle = String(incident?.lifecycleState || '').toUpperCase()
  if (lifecycle === 'RESOLVED' || lifecycle === 'CLOSED') return false
  return true
}

export function isIncidentUnattended(incident) {
  if (!incident || !isOpenIncident(incident)) return false
  if (incident.firstResponseAt || incident.acknowledgedAt || incident.assignedToUserId) return false
  return true
}

export function formatAttentionState(incident) {
  if (!incident) return null
  if (!isOpenIncident(incident)) {
    return incident.resolvedByName ? `Resolved · ${incident.resolvedByName}` : 'Resolved'
  }
  if (isIncidentUnattended(incident)) return 'Unattended'
  if (incident.acknowledgedByName) return `Acknowledged · ${incident.acknowledgedByName}`
  if (incident.lifecycleState === 'UNDER_INVESTIGATION') return 'Under investigation'
  if (incident.lifecycleState === 'AWAITING_PARTY_RESPONSE') return 'Awaiting party response'
  if (incident.partyRespondedAt) return 'Party responded'
  if (incident.firstResponseAt) return 'In progress'
  return formatLifecycleLabel(incident) || 'Open'
}

export function formatRecurrenceOrdinal(count) {
  if (typeof count !== 'number' || count < 2) return null
  const suffix = count % 100 >= 11 && count % 100 <= 13
    ? 'th'
    : count % 10 === 1
      ? 'st'
      : count % 10 === 2
        ? 'nd'
        : count % 10 === 3
          ? 'rd'
          : 'th'
  return `${count}${suffix} claim · 14d`
}

export function formatRecurrenceLabel(incident) {
  if (!incident) return null
  const count =
    incident.recurrenceCount14d ??
    incident.recurrenceCount ??
    incident.metadata?.recurrenceCount
  const ordinal = formatRecurrenceOrdinal(count)
  if (ordinal) return ordinal
  if (incident.recurredWithin14Days) return 'Repeated within 14d'
  return null
}

export function pickBestRecurrenceLabel(incidents) {
  if (!Array.isArray(incidents) || incidents.length === 0) return null
  let best = null
  let bestCount = 0
  for (const incident of incidents) {
    const count = incident.recurrenceCount14d ?? 0
    const label = formatRecurrenceLabel(incident)
    if (label && count >= bestCount) {
      best = label
      bestCount = count
    }
  }
  return best
}

export function formatResolutionLabel(code) {
  if (!code) return null
  return RESOLUTION_ACTION_LABELS[code] || humanizeEnum(code)
}

export function formatCostBearerLabel(bearer) {
  if (!bearer) return null
  return COST_BEARER_LABELS[bearer] || humanizeEnum(bearer)
}

export function formatEvidenceKind(kind) {
  if (!kind) return 'Evidence'
  return EVIDENCE_KIND_LABELS[kind] || humanizeEnum(kind)
}

export function incidentOpenedAt(incident) {
  return incident?.openedAt || incident?.createdAt || null
}

export function enrichIncidentRow(item) {
  if (!item || typeof item !== 'object') return item
  const priority = normalizeIncidentPriority(item)
  const openedAt = incidentOpenedAt(item)
  return {
    ...item,
    priority,
    severityLabel: priority || INCIDENT_SEVERITY_UNCLASSIFIED,
    tone: priority ? incidentPriorityTone(priority) : 'gray',
    categoryLabel: formatIncidentCategory(item),
    ageLabel: formatIncidentAge(openedAt),
    openedAt,
    lifecycleLabel: formatLifecycleLabel(item),
    sourceLabel: formatSourceLabel(item),
    attentionLabel: formatAttentionState(item),
    unattended: isIncidentUnattended(item),
    recurrenceLabel: formatRecurrenceLabel(item),
    resolutionLabel: isOpenIncident(item)
      ? null
      : formatResolutionLabel(item.resolutionActionCode),
    previousResolutionLabel: isOpenIncident(item)
      ? formatResolutionLabel(item.previousResolutionActionCode)
      : null,
    costBearerLabel: formatCostBearerLabel(item.costBearer),
  }
}

export function buildIncidentHistoryRows(incident) {
  if (!incident) return []
  const rows = []
  const opened = incidentOpenedAt(incident)
  if (opened) {
    rows.push({
      id: 'opened',
      label: 'Opened',
      actor: incident.reportedByCustomer
        ? `Reported by customer${incident.customerName ? ` · ${incident.customerName}` : ''}`
        : incident.sourceLabel || incident.source
          ? `Source · ${incident.sourceLabel || humanizeEnum(incident.source)}`
          : 'System',
      at: opened,
    })
  }
  if (incident.firstResponseAt) {
    rows.push({
      id: 'first-response',
      label: 'First response',
      actor: incident.acknowledgedByName || 'Admin',
      at: incident.firstResponseAt,
    })
  } else if (incident.acknowledgedAt) {
    rows.push({
      id: 'acknowledged',
      label: 'Acknowledged',
      actor: incident.acknowledgedByName || 'Admin',
      at: incident.acknowledgedAt,
    })
  }
  if (incident.partyNotifiedAt) {
    rows.push({
      id: 'party-notified',
      label: 'Party notified',
      actor: 'Ops',
      at: incident.partyNotifiedAt,
    })
  }
  if (incident.partyRespondedAt) {
    rows.push({
      id: 'party-responded',
      label: 'Party responded',
      actor: 'Party',
      at: incident.partyRespondedAt,
    })
  }
  if (incident.resolvedAt) {
    rows.push({
      id: 'resolved',
      label: 'Resolved',
      actor: incident.resolvedByName || incident.resolutionSummary?.resolvedByName || 'Admin',
      at: incident.resolvedAt,
    })
  }
  return rows
}
