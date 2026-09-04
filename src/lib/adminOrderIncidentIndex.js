import {
  enrichIncidentRow,
  formatIncidentAge,
  highestIncidentPriority,
  incidentOpenedAt,
  isIncidentUnattended,
  isOpenIncident,
  pickBestRecurrenceLabel,
} from './adminIncidentPresentation.js'

function orderKey(order) {
  return String(order?.orderId || order?.id || '')
}

export function buildOrderIncidentIndex(incidents) {
  const byOrder = new Map()
  for (const raw of Array.isArray(incidents) ? incidents : []) {
    const incident = enrichIncidentRow(raw)
    const orderId = incident.orderId ? String(incident.orderId) : null
    if (!orderId) continue
    if (!byOrder.has(orderId)) byOrder.set(orderId, [])
    byOrder.get(orderId).push(incident)
  }

  const index = new Map()
  for (const [orderId, list] of byOrder.entries()) {
    const open = list.filter(isOpenIncident)
    const primary = open[0] || list[0]
    const oldestOpenedAt = list.reduce((min, row) => {
      const at = incidentOpenedAt(row)
      if (!at) return min
      const ts = new Date(at).getTime()
      if (Number.isNaN(ts)) return min
      if (min == null || ts < min) return ts
      return min
    }, null)

    index.set(orderId, {
      orderId,
      incidents: list,
      openIncidents: open,
      count: open.length || list.length,
      totalCount: list.length,
      highestPriority: highestIncidentPriority(open.length ? open : list),
      primaryCategory: primary?.categoryLabel || null,
      primarySourceLabel: primary?.sourceLabel || null,
      oldestOpenedAt: oldestOpenedAt != null ? new Date(oldestOpenedAt).toISOString() : null,
      ageLabel: oldestOpenedAt != null ? formatIncidentAge(new Date(oldestOpenedAt).toISOString()) : null,
      unattended: open.some(isIncidentUnattended),
      categories: [...new Set(list.map((row) => row.categoryLabel).filter(Boolean))],
      recurrenceLabel: pickBestRecurrenceLabel(open.length ? open : list),
      attentionLabel: (open.find((row) => row.openedBy?.displayName) || primary)?.attentionLabel || null,
      openedBy: open.find((row) => row.openedBy)?.openedBy || null,
      slaCountdownLabel: primary?.slaCountdownLabel || null,
      incidentSlaDeadlineAt: primary?.incidentSlaDeadlineAt || null,
    })
  }
  return index
}

export function mergeOrderIncidentSummary(order, index) {
  if (!order) return order
  const key = orderKey(order)
  const summary = index?.get?.(key)
  if (!summary) {
    return {
      ...order,
      incidentSummary: order.hasIncident
        ? {
            count: Number(order.incidentCount) || 1,
            highestPriority: order.incidentPriority || null,
            ageLabel: null,
            primaryCategory: null,
            unattended: false,
          }
        : null,
    }
  }
  return {
    ...order,
    hasIncident: summary.count > 0 || order.hasIncident,
    incidentCount: summary.count,
    incidentPriority: summary.highestPriority || order.incidentPriority || null,
    incidentSummary: summary,
  }
}

export function mergeBoardOrdersWithIncidents(columns, index) {
  return (Array.isArray(columns) ? columns : []).map((column) => ({
    ...column,
    orders: (column.orders || []).map((order) => mergeOrderIncidentSummary(order, index)),
  }))
}

export function orderMatchesIncidentFilters(order, query) {
  if (!query) return true
  const summary = order?.incidentSummary
  const severities = Array.isArray(query.incidentSeverities) ? query.incidentSeverities : []
  if (severities.length) {
    const highest = summary?.highestPriority ?? null
    const matches = severities.some((id) => {
      if (id === 'UNCLASSIFIED') return Boolean(order?.hasIncident) && !highest
      return highest === id
    })
    if (!matches) return false
  }
  const categories = Array.isArray(query.incidentCategories) ? query.incidentCategories : []
  if (categories.length) {
    const orderCategories = summary?.categories || []
    if (!categories.some((id) => orderCategories.includes(id))) return false
  }
  if (query.incidentUnattended) {
    if (!summary?.unattended) return false
  }
  if (query.incidentOnly && !order?.hasIncident) return false
  return true
}

export function incidentCategoriesFromIndex(index) {
  const set = new Set()
  for (const summary of index.values()) {
    for (const category of summary.categories || []) set.add(category)
  }
  return [...set].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
    .map((label) => ({ id: label, label }))
}

export function countUnattendedIncidents(incidents) {
  return (Array.isArray(incidents) ? incidents : []).filter(isIncidentUnattended).length
}

export function sortOrdersByIncidentAge(orders, direction = 'oldest') {
  const list = [...(Array.isArray(orders) ? orders : [])]
  list.sort((a, b) => {
    const aTs = a?.incidentSummary?.oldestOpenedAt ? Date.parse(a.incidentSummary.oldestOpenedAt) : NaN
    const bTs = b?.incidentSummary?.oldestOpenedAt ? Date.parse(b.incidentSummary.oldestOpenedAt) : NaN
    const aRank = normalizeIncidentPriority({ priority: a?.incidentSummary?.highestPriority }) || 'P9'
    const bRank = normalizeIncidentPriority({ priority: b?.incidentSummary?.highestPriority }) || 'P9'
    if (Number.isNaN(aTs) && Number.isNaN(bTs)) {
      return String(aRank).localeCompare(String(bRank))
    }
    if (Number.isNaN(aTs)) return 1
    if (Number.isNaN(bTs)) return -1
    return direction === 'newest' ? bTs - aTs : aTs - bTs
  })
  return list
}
