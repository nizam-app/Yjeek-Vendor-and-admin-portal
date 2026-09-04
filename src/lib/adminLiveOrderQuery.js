/** Live Orders search / vendor / type / champ / sort — client-side AND filters. */

import { orderMatchesIncidentFilters } from './adminOrderIncidentIndex.js'
import { INCIDENT_PRIORITY_RANK } from './adminIncidentPresentation.js'

export const UNASSIGNED_CHAMP_ID = '__unassigned__'

export const INCIDENT_SEVERITIES = [
  { id: 'P1', label: 'P1' },
  { id: 'P2', label: 'P2' },
  { id: 'P3', label: 'P3' },
  { id: 'P4', label: 'P4' },
  { id: 'UNCLASSIFIED', label: 'Unclassified' },
]

export const LIVE_ORDER_TYPES = [
  { id: 'hot_food', label: 'Hot food' },
  { id: 'pickup', label: 'Pickup' },
  { id: 'dine_in', label: 'Dine-in' },
  { id: 'services', label: 'Services' },
  { id: 'scheduled', label: 'Scheduled' },
]

export const LIVE_ORDER_SORTS = [
  { id: 'time_left', label: 'Time left' },
  { id: 'newest', label: 'Newest' },
  { id: 'oldest', label: 'Oldest' },
  { id: 'vendor', label: 'Vendor' },
]

export const LIVE_INCIDENT_PRIORITY_SORTS = [
  { id: 'incident_priority', label: 'P1 → P4' },
  { id: 'incident_priority_desc', label: 'P4 → P1' },
]

export const LIVE_INCIDENT_AGE_SORTS = [
  { id: 'incident_age_oldest', label: 'Incident age · oldest' },
  { id: 'incident_age_newest', label: 'Incident age · newest' },
]

export const LIVE_INCIDENT_SLA_SORTS = [
  { id: 'incident_sla_soonest', label: 'Incident SLA · soonest' },
  { id: 'incident_sla_latest', label: 'Incident SLA · latest' },
]

export const EMPTY_LIVE_ORDER_QUERY = {
  q: '',
  vendorIds: [],
  types: [],
  champIds: [],
  incidentSeverities: [],
  incidentCategories: [],
  incidentUnattended: false,
  sort: 'time_left',
}

const TYPE_IDS = new Set(LIVE_ORDER_TYPES.map((item) => item.id))
const SORT_IDS = new Set([
  ...LIVE_ORDER_SORTS.map((item) => item.id),
  ...LIVE_INCIDENT_PRIORITY_SORTS.map((item) => item.id),
  ...LIVE_INCIDENT_AGE_SORTS.map((item) => item.id),
  ...LIVE_INCIDENT_SLA_SORTS.map((item) => item.id),
])

function splitCsv(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function setOrDelete(params, key, value) {
  if (value) params.set(key, value)
  else params.delete(key)
}

export function parseLiveOrderQuery(searchParams) {
  const sort = String(searchParams?.get?.('sort') || 'time_left')
  const incidentUnattended = String(searchParams?.get?.('unattended') || '') === '1'
  return {
    q: String(searchParams?.get?.('q') || ''),
    vendorIds: splitCsv(searchParams?.get?.('vendor')),
    types: splitCsv(searchParams?.get?.('type')).filter((id) => TYPE_IDS.has(id)),
    champIds: splitCsv(searchParams?.get?.('champ')),
    incidentSeverities: splitCsv(searchParams?.get?.('isev')).filter((id) => INCIDENT_SEVERITIES.some((s) => s.id === id)),
    incidentCategories: splitCsv(searchParams?.get?.('icat')),
    incidentUnattended,
    sort: SORT_IDS.has(sort) ? sort : 'time_left',
  }
}

/** Keep unrelated params (bucket, region, …) while writing filter keys. */
export function writeLiveOrderQuery(searchParams, query) {
  const next = new URLSearchParams(searchParams)
  const q = String(query?.q || '').trim()
  const vendorIds = Array.isArray(query?.vendorIds) ? query.vendorIds.filter(Boolean) : []
  const types = Array.isArray(query?.types) ? query.types.filter((id) => TYPE_IDS.has(id)) : []
  const champIds = Array.isArray(query?.champIds) ? query.champIds.filter(Boolean) : []
  const incidentSeverities = Array.isArray(query?.incidentSeverities) ? query.incidentSeverities.filter(Boolean) : []
  const incidentCategories = Array.isArray(query?.incidentCategories) ? query.incidentCategories.filter(Boolean) : []
  const sort = SORT_IDS.has(query?.sort) ? query.sort : 'time_left'

  setOrDelete(next, 'q', q)
  setOrDelete(next, 'vendor', vendorIds.join(','))
  setOrDelete(next, 'type', types.join(','))
  setOrDelete(next, 'champ', champIds.join(','))
  setOrDelete(next, 'isev', incidentSeverities.join(','))
  setOrDelete(next, 'icat', incidentCategories.join(','))
  if (query?.incidentUnattended) next.set('unattended', '1')
  else next.delete('unattended')
  if (sort && sort !== 'time_left') next.set('sort', sort)
  else next.delete('sort')
  return next
}

export function liveOrderQueryIsActive(query) {
  if (!query) return false
  return Boolean(
    String(query.q || '').trim()
    || (query.vendorIds && query.vendorIds.length)
    || (query.types && query.types.length)
    || (query.champIds && query.champIds.length)
    || (query.incidentSeverities && query.incidentSeverities.length)
    || (query.incidentCategories && query.incidentCategories.length)
    || query.incidentUnattended,
  )
}

export function champIdOf(order) {
  return String(order?.rider?.id || order?.champ?.id || '')
}

export function champNameOf(order) {
  const name = String(order?.rider?.name || order?.champ?.name || '').trim()
  return name || 'Unassigned'
}

export function isUnassignedChamp(order) {
  const id = champIdOf(order)
  const name = champNameOf(order).toLowerCase()
  return !id || name === 'unassigned'
}

export function orderTypeKeys(order) {
  const keys = []
  const orderType = String(order?.orderType || '').toUpperCase()
  const fulfillment = String(order?.fulfillmentType || '').toUpperCase()
  const category = String(order?.temperature || order?.category || '')

  if (fulfillment === 'SCHEDULED' || order?.schedule === 'Scheduled') keys.push('scheduled')
  if (orderType === 'PICKUP' || category === 'Pickup') keys.push('pickup')
  if (orderType === 'DINE_IN' || category === 'Dine-in') keys.push('dine_in')
  if (orderType === 'SERVICE' || category === 'Service' || category === 'Services') keys.push('services')
  if (orderType === 'DELIVERY' || category === 'Hot food') keys.push('hot_food')
  if (!keys.includes('pickup') && !keys.includes('dine_in') && !keys.includes('services') && !keys.includes('hot_food')) {
    keys.push('hot_food')
  }
  return keys
}

function haystack(order) {
  return [
    order?.id,
    order?.orderId,
    order?.orderNumber,
    order?.vendor,
    order?.vendorArea,
    champNameOf(order),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

export function orderMatchesLiveQuery(order, query) {
  if (!query) return true

  const q = String(query.q || '').trim().toLowerCase()
  if (q && !haystack(order).includes(q)) return false

  const vendorIds = Array.isArray(query.vendorIds) ? query.vendorIds.map(String).filter(Boolean) : []
  if (vendorIds.length && !vendorIds.includes(String(order?.vendorId || ''))) return false

  const types = Array.isArray(query.types) ? query.types.filter((id) => TYPE_IDS.has(id)) : []
  if (types.length) {
    const keys = orderTypeKeys(order)
    if (!types.some((id) => keys.includes(id))) return false
  }

  const champIds = Array.isArray(query.champIds) ? query.champIds.map(String).filter(Boolean) : []
  if (champIds.length) {
    const allowUnassigned = champIds.includes(UNASSIGNED_CHAMP_ID)
    const id = champIdOf(order)
    const unassigned = isUnassignedChamp(order)
    const idMatch = id && champIds.includes(id)
    if (!idMatch && !(allowUnassigned && unassigned)) return false
  }

  if (!orderMatchesIncidentFilters(order, query)) return false

  return true
}

function incidentPriorityRank(order) {
  const priority = order?.incidentSummary?.highestPriority ?? order?.incidentPriority ?? null
  if (!priority) return 99
  return INCIDENT_PRIORITY_RANK[priority] ?? 99
}

export function sortLiveOrders(orders, sort) {
  const list = Array.isArray(orders) ? [...orders] : []
  const key = SORT_IDS.has(sort) ? sort : 'time_left'

  list.sort((a, b) => {
    if (key === 'vendor') {
      return String(a?.vendor || '').localeCompare(String(b?.vendor || ''), undefined, { sensitivity: 'base' })
    }
    const aCreated = a?.createdAt ? Date.parse(a.createdAt) : NaN
    const bCreated = b?.createdAt ? Date.parse(b.createdAt) : NaN
    if (key === 'newest') {
      if (!Number.isNaN(aCreated) && !Number.isNaN(bCreated)) return bCreated - aCreated
      return (Number(a?.elapsedMin) || 0) - (Number(b?.elapsedMin) || 0)
    }
    if (key === 'oldest') {
      if (!Number.isNaN(aCreated) && !Number.isNaN(bCreated)) return aCreated - bCreated
      return (Number(b?.elapsedMin) || 0) - (Number(a?.elapsedMin) || 0)
    }
    if (key === 'incident_priority') {
      const byPriority = incidentPriorityRank(a) - incidentPriorityRank(b)
      if (byPriority !== 0) return byPriority
      return (Number(b?.elapsedMin) || 0) - (Number(a?.elapsedMin) || 0)
    }
    if (key === 'incident_priority_desc') {
      const byPriority = incidentPriorityRank(b) - incidentPriorityRank(a)
      if (byPriority !== 0) return byPriority
      return (Number(b?.elapsedMin) || 0) - (Number(a?.elapsedMin) || 0)
    }
    if (key === 'incident_age_oldest' || key === 'incident_age_newest') {
      const aTs = a?.incidentSummary?.oldestOpenedAt ? Date.parse(a.incidentSummary.oldestOpenedAt) : NaN
      const bTs = b?.incidentSummary?.oldestOpenedAt ? Date.parse(b.incidentSummary.oldestOpenedAt) : NaN
      if (Number.isNaN(aTs) && Number.isNaN(bTs)) return 0
      if (Number.isNaN(aTs)) return 1
      if (Number.isNaN(bTs)) return -1
      return key === 'incident_age_newest' ? bTs - aTs : aTs - bTs
    }
    if (key === 'incident_sla_soonest' || key === 'incident_sla_latest') {
      const aTs = a?.incidentSummary?.incidentSlaDeadlineAt
        ? Date.parse(a.incidentSummary.incidentSlaDeadlineAt)
        : NaN
      const bTs = b?.incidentSummary?.incidentSlaDeadlineAt
        ? Date.parse(b.incidentSummary.incidentSlaDeadlineAt)
        : NaN
      if (Number.isNaN(aTs) && Number.isNaN(bTs)) return 0
      if (Number.isNaN(aTs)) return 1
      if (Number.isNaN(bTs)) return -1
      return key === 'incident_sla_latest' ? bTs - aTs : aTs - bTs
    }
    return (Number(b?.elapsedMin) || 0) - (Number(a?.elapsedMin) || 0)
  })

  return list
}

export function applyLiveOrderQuery(orders, query) {
  const matched = (Array.isArray(orders) ? orders : []).filter((order) => orderMatchesLiveQuery(order, query))
  return sortLiveOrders(matched, query?.sort)
}

export function filterOpsBoardLiveQuery(columns, query) {
  const list = Array.isArray(columns) ? columns : []
  return list.map((column) => {
    const orders = applyLiveOrderQuery(column.orders, query)
    return { ...column, orders, count: orders.length }
  })
}

export function champsFromOrders(orders) {
  const map = new Map()
  for (const order of Array.isArray(orders) ? orders : []) {
    if (isUnassignedChamp(order)) {
      continue
    }
    const id = champIdOf(order)
    if (!id || map.has(id)) continue
    map.set(id, { id, label: champNameOf(order) })
  }
  const items = [...map.values()].sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }))
  items.unshift({ id: UNASSIGNED_CHAMP_ID, label: 'Unassigned' })
  return items
}

export function vendorsFromOrders(orders) {
  const map = new Map()
  for (const order of Array.isArray(orders) ? orders : []) {
    if (!order?.vendorId) continue
    map.set(String(order.vendorId), {
      id: String(order.vendorId),
      name: String(order.vendor || 'Vendor'),
    })
  }
  return [...map.values()]
}

export function liveOrderFilterChips(query, { vendors = [], champs = [] } = {}) {
  const chips = []
  const q = String(query?.q || '').trim()
  if (q) chips.push({ key: 'q', label: `Search · ${q}` })

  for (const id of query?.vendorIds || []) {
    const vendor = vendors.find((item) => String(item.id) === String(id))
    chips.push({ key: `vendor:${id}`, label: vendor?.name || 'Vendor', group: 'vendor', id })
  }

  for (const id of query?.types || []) {
    const type = LIVE_ORDER_TYPES.find((item) => item.id === id)
    chips.push({ key: `type:${id}`, label: type?.label || id, group: 'type', id })
  }

  for (const id of query?.champIds || []) {
    const champ = champs.find((item) => String(item.id) === String(id))
    chips.push({
      key: `champ:${id}`,
      label: champ?.label || (id === UNASSIGNED_CHAMP_ID ? 'Unassigned' : 'Champ'),
      group: 'champ',
      id,
    })
  }

  for (const id of query?.incidentSeverities || []) {
    chips.push({ key: `isev:${id}`, label: `Severity · ${id}`, group: 'isev', id })
  }

  for (const id of query?.incidentCategories || []) {
    chips.push({ key: `icat:${id}`, label: `Incident · ${id}`, group: 'icat', id })
  }

  if (query?.incidentUnattended) {
    chips.push({ key: 'unattended', label: 'Unattended', group: 'unattended' })
  }

  return chips
}

export function removeLiveOrderChip(query, chip) {
  const next = {
    ...EMPTY_LIVE_ORDER_QUERY,
    ...query,
    vendorIds: [...(query.vendorIds || [])],
    types: [...(query.types || [])],
    champIds: [...(query.champIds || [])],
    incidentSeverities: [...(query.incidentSeverities || [])],
    incidentCategories: [...(query.incidentCategories || [])],
  }
  if (chip.key === 'q') {
    next.q = ''
    return next
  }
  if (chip.group === 'vendor') next.vendorIds = next.vendorIds.filter((id) => id !== chip.id)
  if (chip.group === 'type') next.types = next.types.filter((id) => id !== chip.id)
  if (chip.group === 'champ') next.champIds = next.champIds.filter((id) => id !== chip.id)
  if (chip.group === 'isev') next.incidentSeverities = next.incidentSeverities.filter((id) => id !== chip.id)
  if (chip.group === 'icat') next.incidentCategories = next.incidentCategories.filter((id) => id !== chip.id)
  if (chip.group === 'unattended') next.incidentUnattended = false
  return next
}
