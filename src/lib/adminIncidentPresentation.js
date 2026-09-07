/** Centralized incident presentation for Live Orders / Admin incident UI. */

import {
  INCIDENT_CATEGORY_LABELS,
  RESOLUTION_ACTION_LABELS,
  incidentCategoryLabel,
  resolutionActionLabel,
} from './incidentTaxonomy.js'

export { RESOLUTION_ACTION_LABELS, INCIDENT_CATEGORY_LABELS }

export const INCIDENT_PRIORITY_RANK = { P1: 1, P2: 2, P3: 3, P4: 4 }

export const INCIDENT_SEVERITY_UNCLASSIFIED = 'UNCLASSIFIED'

export const INCIDENT_PRIORITY_TONE = {
  P1: 'red',
  P2: 'yellow',
  P3: 'blue',
  P4: 'gray',
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

const COST_BEARER_SELECT_LABELS = {
  ...COST_BEARER_LABELS,
  VENDOR: 'Vendor — recoverable',
  AGENCY: 'Champ agency — recoverable',
}

const CAUSE_CHIP_LABELS = {
  VENDOR: 'Vendor',
  CHAMP: 'Champ',
  CUSTOMER: 'Customer',
  SYSTEM: 'System',
  UNKNOWN: 'Unknown',
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
  const fromTaxonomy = incidentCategoryLabel(incident.category)
  if (fromTaxonomy) return fromTaxonomy
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

/**
 * Live viewer presence, else the dispatcher who first opened/acknowledged.
 * Keeps "Open · Name" on the board after the modal is closed.
 */
export function resolveOpenedBy(incident) {
  if (!incident || !isOpenIncident(incident)) return null
  if (incident.openedBy?.displayName || incident.openedBy?.userId) {
    return incident.openedBy
  }
  if (Array.isArray(incident.activeViewers) && incident.activeViewers.length > 0) {
    const viewer = incident.activeViewers.find((row) => row?.displayName || row?.userId)
    if (viewer) return viewer
  }
  if (incident.acknowledgedByName) {
    return {
      userId: incident.acknowledgedById || null,
      displayName: incident.acknowledgedByName,
      openedAt: incident.acknowledgedAt || null,
      lastSeenAt: null,
      openForMs: null,
    }
  }
  return null
}

/**
 * Viewers to show in order/incident detail "Open by …" banner.
 * Prefers other live viewers; else self live presence; else claimed opener.
 */
export function buildOpenPresenceBanner({
  activeViewers = [],
  incidents = [],
  currentUserId = null,
} = {}) {
  const live = (Array.isArray(activeViewers) ? activeViewers : []).filter(
    (viewer) => viewer?.displayName || viewer?.userId,
  )
  const others = currentUserId
    ? live.filter((viewer) => viewer.userId !== currentUserId)
    : live
  if (others.length) return others
  if (live.length) return live

  const list = Array.isArray(incidents) ? incidents : []
  for (const incident of list) {
    const openedBy = resolveOpenedBy(incident)
    if (openedBy?.displayName) {
      return [
        {
          userId: openedBy.userId || null,
          displayName: openedBy.displayName,
          openForMs: openedBy.openForMs ?? null,
          openedAt: openedBy.openedAt ?? null,
        },
      ]
    }
  }
  return []
}

export function isIncidentUnattended(incident) {
  if (!incident || !isOpenIncident(incident)) return false
  // Soft presence or claimed opener → not unattended.
  if (resolveOpenedBy(incident)) return false
  if (incident.firstResponseAt || incident.acknowledgedAt || incident.assignedToUserId) return false
  return true
}

export function formatAttentionState(incident) {
  if (!incident) return null
  if (!isOpenIncident(incident)) {
    return incident.resolvedByName ? `Resolved · ${incident.resolvedByName}` : 'Resolved'
  }
  const openedBy = resolveOpenedBy(incident)
  if (openedBy?.displayName) {
    const duration = formatOpenDuration(openedBy.openForMs)
    return duration ? `Open · ${openedBy.displayName} · ${duration}` : `Open · ${openedBy.displayName}`
  }
  if (isIncidentUnattended(incident)) return 'Unattended'
  if (incident.lifecycleState === 'UNDER_INVESTIGATION') return 'Under investigation'
  if (incident.lifecycleState === 'AWAITING_PARTY_RESPONSE') return 'Awaiting party response'
  if (incident.partyRespondedAt) return 'Party responded'
  if (incident.firstResponseAt) return 'In progress'
  return formatLifecycleLabel(incident) || 'Open'
}

export function formatOpenDuration(ms) {
  const n = Number(ms)
  if (!Number.isFinite(n) || n < 0) return null
  const totalSec = Math.floor(n / 1000)
  if (totalSec < 60) return `${totalSec}s`
  const mins = Math.floor(totalSec / 60)
  const sec = totalSec % 60
  if (mins < 60) return `${mins}m ${String(sec).padStart(2, '0')}s`
  const hours = Math.floor(mins / 60)
  return `${hours}h ${mins % 60}m`
}

/** Live countdown chip: `04:12 to SLA` or `Overdue 01:20`. */
export function formatSlaCountdown(deadlineIso, now = Date.now()) {
  if (!deadlineIso) return null
  const end = new Date(deadlineIso).getTime()
  if (Number.isNaN(end)) return null
  const diff = end - now
  const abs = Math.abs(diff)
  const totalSec = Math.floor(abs / 1000)
  const mm = String(Math.floor(totalSec / 60)).padStart(2, '0')
  const ss = String(totalSec % 60).padStart(2, '0')
  if (diff < 0) return `Overdue ${mm}:${ss}`
  return `${mm}:${ss} to SLA`
}

export function formatIncidentStatusWithSla(incident, now = Date.now()) {
  if (!isOpenIncident(incident)) {
    return incident?.lifecycleLabel || incident?.status || 'Resolved'
  }
  const countdown = formatSlaCountdown(incident?.incidentSlaDeadlineAt, now)
  const base = incident?.lifecycleLabel || incident?.status || 'Pending'
  return countdown ? `${base} · ${countdown}` : base
}

export function formatRecurrenceOrdinal(count, noun = 'claim') {
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
  return `${count}${suffix} ${noun} · 14d`
}

export function formatRecurrenceChips(incident) {
  if (!incident) return []
  const ctx = incident.recurrenceContext && typeof incident.recurrenceContext === 'object'
    ? incident.recurrenceContext
    : {}
  const hasDimCounts =
    ctx.customerClaimCount14d != null ||
    ctx.vendorIncidentCount14d != null ||
    ctx.champIncidentCount14d != null
  const customer = hasDimCounts
    ? Number(ctx.customerClaimCount14d) || 0
    : incident.recurrenceCount14d ??
      incident.recurrenceCount ??
      incident.metadata?.recurrenceCount
  const vendor = hasDimCounts ? Number(ctx.vendorIncidentCount14d) || 0 : 0
  const champ = hasDimCounts ? Number(ctx.champIncidentCount14d) || 0 : 0
  const chips = []
  const customerLabel = formatRecurrenceOrdinal(customer, 'claim')
  if (customerLabel) chips.push({ key: 'customer', label: customerLabel })
  const vendorLabel = formatRecurrenceOrdinal(vendor, 'vendor incident')
  if (vendorLabel) chips.push({ key: 'vendor', label: vendorLabel })
  const champLabel = formatRecurrenceOrdinal(champ, 'champ incident')
  if (champLabel) chips.push({ key: 'champ', label: champLabel })
  if (!chips.length && incident.recurredWithin14Days) {
    chips.push({ key: 'repeat', label: 'Repeated within 14d' })
  }
  return chips
}

export function formatRecurrenceLabel(incident) {
  return formatRecurrenceChips(incident)[0]?.label || null
}

export function pickBestRecurrenceLabel(incidents) {
  if (!Array.isArray(incidents) || incidents.length === 0) return null
  const chips = []
  for (const incident of incidents) {
    chips.push(...formatRecurrenceChips(incident))
  }
  const customer = chips.find((row) => row.key === 'customer')
  if (customer) return customer.label
  return chips[0]?.label || null
}

export function pickRecurrenceChips(incidents) {
  if (!Array.isArray(incidents) || incidents.length === 0) return []
  const seen = new Set()
  const chips = []
  for (const incident of incidents) {
    for (const chip of formatRecurrenceChips(incident)) {
      if (seen.has(chip.key)) continue
      seen.add(chip.key)
      chips.push(chip)
    }
  }
  return chips
}

export function formatResolutionLabel(code) {
  if (!code) return null
  return resolutionActionLabel(code) || RESOLUTION_ACTION_LABELS[code] || humanizeEnum(code)
}

export function formatCostBearerLabel(bearer, opts = {}) {
  if (!bearer) return null
  const table = opts.select ? COST_BEARER_SELECT_LABELS : COST_BEARER_LABELS
  return table[bearer] || humanizeEnum(bearer)
}

export function formatIncidentDisplayId(id) {
  if (!id) return null
  const raw = String(id).trim()
  if (!raw) return null
  if (/^INC-/i.test(raw)) return raw.toUpperCase()
  if (raw.length > 10) return `INC-${raw.slice(-6).toUpperCase()}`
  return `INC-${raw}`
}

export function formatCauseChip(cause) {
  if (!cause) return null
  const raw = String(cause).trim()
  if (!raw) return null
  if (/^cause:/i.test(raw)) return raw.replace(/^cause:\s*/i, 'Cause: ')
  const key = raw.toUpperCase().replace(/\s+/g, '_')
  const label = CAUSE_CHIP_LABELS[key] || humanizeEnum(raw)
  return `Cause: ${label}`
}

export function formatStageChip(stage) {
  if (!stage) return null
  const raw = String(stage).trim()
  if (!raw) return null
  if (/^stage:/i.test(raw)) {
    const rest = raw.replace(/^stage:\s*/i, '')
    return `Stage: ${rest}`
  }
  const pretty = humanizeEnum(raw)
  const sentence = pretty ? pretty.charAt(0) + pretty.slice(1).toLowerCase() : raw
  return `Stage: ${sentence}`
}

export function formatCompensationTypeLabel(type) {
  if (!type) return null
  const raw = String(type).toUpperCase()
  if (raw.includes('VOUCHER')) return 'Voucher'
  if (raw.includes('REFUND')) return 'Refund'
  if (raw.includes('REDELIVER')) return 'Redelivery'
  if (raw.includes('REPLACE')) return 'Replacement'
  if (raw === 'NONE') return null
  if (raw.includes('WALLET') || raw.includes('GOODWILL') || raw.includes('CREDIT')) return 'Wallet'
  return humanizeEnum(type)
}

export function formatCompensationRecord({
  amount,
  compensationType,
  costBearer,
  currency = 'BHD',
} = {}) {
  const parts = []
  if (amount != null && amount !== '' && Number.isFinite(Number(amount)) && Number(amount) > 0) {
    const numeric = Number(amount)
    parts.push(`${currency} ${numeric.toFixed(3)}`)
    const typeLabel = formatCompensationTypeLabel(compensationType) || 'Wallet'
    parts.push(typeLabel)
  }
  const bearer = formatCostBearerLabel(costBearer)
  if (bearer) parts.push(`borne by ${bearer}`)
  return parts.length ? parts.join(' · ') : null
}

export function formatResolvedByLine({ name, role, at } = {}) {
  const parts = []
  if (name) parts.push(name)
  parts.push(role ? humanizeEnum(role) : 'Ops')
  if (at) {
    const date = at instanceof Date ? at : new Date(at)
    if (!Number.isNaN(date.getTime())) {
      parts.push(
        date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
      )
    }
  }
  return parts.join(' · ')
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
  const slaCountdownLabel = formatSlaCountdown(item.incidentSlaDeadlineAt)
  const openedBy = resolveOpenedBy(item)
  return {
    ...item,
    priority,
    severityLabel: priority || INCIDENT_SEVERITY_UNCLASSIFIED,
    tone: priority ? incidentPriorityTone(priority) : 'gray',
    categoryLabel: formatIncidentCategory(item),
    ageLabel: formatIncidentAge(openedAt),
    openedAt,
    openedBy,
    lifecycleLabel: formatLifecycleLabel(item),
    sourceLabel: formatSourceLabel(item),
    attentionLabel: formatAttentionState({ ...item, openedBy }),
    unattended: isIncidentUnattended({ ...item, openedBy }),
    recurrenceLabel: formatRecurrenceLabel(item),
    recurrenceChips: formatRecurrenceChips(item),
    slaCountdownLabel,
    statusWithSlaLabel: formatIncidentStatusWithSla(item),
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
