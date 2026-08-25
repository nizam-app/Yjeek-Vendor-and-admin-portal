import { BAHRAIN_CITY_GOVERNORATE, BAHRAIN_GOVERNORATES } from '../mappers/admin/mapAdminScheduledCalendar'

export const SCHEDULED_DATE_OPTIONS = [
  { id: 'today', label: 'Today' },
  { id: 'tomorrow', label: 'Tomorrow' },
  { id: 'this_week', label: 'This week' },
  { id: 'custom', label: 'Custom range' },
]

export const SCHEDULED_TYPE_OPTIONS = [
  { id: 'SAME_DAY', label: 'Same-Day' },
  { id: 'NEXT_DAY', label: 'Next day' },
  { id: 'ECONOMY', label: 'Economy' },
  { id: 'STANDARD', label: 'Standard' },
]

export const SCHEDULED_STAGE_OPTIONS = [
  { id: 'new', label: 'New' },
  { id: 'response', label: 'Awaiting champ response' },
  { id: 'confirmation', label: 'Awaiting champ confirmation' },
  { id: 'confirmed', label: 'Confirmed' },
]

export const EMPTY_SCHEDULED_BOARD_QUERY = {
  dates: ['today'],
  types: [],
  stages: [],
  zones: [],
  dateFrom: '',
  dateTo: '',
}

const DATE_IDS = new Set(SCHEDULED_DATE_OPTIONS.map((item) => item.id))
const TYPE_IDS = new Set(SCHEDULED_TYPE_OPTIONS.map((item) => item.id))
const STAGE_IDS = new Set(SCHEDULED_STAGE_OPTIONS.map((item) => item.id))

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

function startOfDay(date) {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

function endOfDay(date) {
  const next = new Date(date)
  next.setHours(23, 59, 59, 999)
  return next
}

function addDays(date, days) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

/** Monday 00:00 → Sunday 23:59, local. */
function thisWeekRange(now = new Date()) {
  const start = startOfDay(now)
  const weekday = start.getDay()
  const mondayOffset = weekday === 0 ? -6 : 1 - weekday
  start.setDate(start.getDate() + mondayOffset)
  return { start, end: endOfDay(addDays(start, 6)) }
}

export function parseScheduledBoardQuery(searchParams) {
  const rawDate = searchParams?.get?.('date')
  let dates
  if (rawDate == null || rawDate === '') dates = ['today']
  else if (rawDate === 'all') dates = []
  else dates = splitCsv(rawDate).filter((id) => DATE_IDS.has(id))

  return {
    dates,
    types: splitCsv(searchParams?.get?.('stype')).filter((id) => TYPE_IDS.has(id)),
    stages: splitCsv(searchParams?.get?.('stage')).filter((id) => STAGE_IDS.has(id)),
    zones: splitCsv(searchParams?.get?.('zone')),
    dateFrom: String(searchParams?.get?.('from') || ''),
    dateTo: String(searchParams?.get?.('to') || ''),
  }
}

export function writeScheduledBoardQuery(searchParams, query) {
  const next = new URLSearchParams(searchParams)
  const dates = Array.isArray(query?.dates) ? query.dates.filter((id) => DATE_IDS.has(id)) : []
  const types = Array.isArray(query?.types) ? query.types.filter((id) => TYPE_IDS.has(id)) : []
  const stages = Array.isArray(query?.stages) ? query.stages.filter((id) => STAGE_IDS.has(id)) : []
  const zones = Array.isArray(query?.zones) ? query.zones.filter(Boolean) : []

  if (dates.length === 0) next.set('date', 'all')
  else if (dates.length === 1 && dates[0] === 'today') next.delete('date')
  else next.set('date', dates.join(','))

  setOrDelete(next, 'stype', types.join(','))
  setOrDelete(next, 'stage', stages.join(','))
  setOrDelete(next, 'zone', zones.join(','))
  setOrDelete(next, 'from', dates.includes('custom') ? String(query?.dateFrom || '').trim() : '')
  setOrDelete(next, 'to', dates.includes('custom') ? String(query?.dateTo || '').trim() : '')
  return next
}

export function scheduledBoardQueryIsActive(query) {
  if (!query) return false
  const dates = query.dates || []
  const defaultToday = dates.length === 1 && dates[0] === 'today' && !query.dateFrom && !query.dateTo
  if (!defaultToday && dates.length > 0) return true
  if (dates.length === 0 && (query.types?.length || query.stages?.length || query.zones?.length)) return true
  return Boolean(query.types?.length || query.stages?.length || query.zones?.length)
}

function orderWindowDate(order) {
  const raw = order?.windowStartAt || order?.windowEndAt || order?.scheduledAt || order?.createdAt
  if (!raw) return null
  const date = new Date(raw)
  return Number.isNaN(date.getTime()) ? null : date
}

function rangesForQuery(query, now = new Date()) {
  const dates = Array.isArray(query?.dates) ? query.dates : []
  if (!dates.length) return null
  const ranges = []
  if (dates.includes('today')) {
    ranges.push({ start: startOfDay(now), end: endOfDay(now) })
  }
  if (dates.includes('tomorrow')) {
    const day = addDays(now, 1)
    ranges.push({ start: startOfDay(day), end: endOfDay(day) })
  }
  if (dates.includes('this_week')) {
    ranges.push(thisWeekRange(now))
  }
  if (dates.includes('custom')) {
    const from = String(query.dateFrom || '').trim()
    const to = String(query.dateTo || '').trim()
    if (from) {
      const start = startOfDay(new Date(`${from}T00:00:00`))
      const end = endOfDay(new Date(`${(to || from)}T00:00:00`))
      if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
        ranges.push({ start, end })
      }
    }
  }
  return ranges
}

function inAnyRange(date, ranges) {
  if (!ranges || !ranges.length) return true
  if (!date) return false
  const time = date.getTime()
  return ranges.some((range) => time >= range.start.getTime() && time <= range.end.getTime())
}

export function orderDispatchType(order) {
  const speed = String(order?.deliverySpeed || '').toUpperCase()
  if (TYPE_IDS.has(speed)) return speed
  const label = String(order?.deliverySpeedLabel || order?.type || '')
    .replace('★ ', '')
    .trim()
    .toLowerCase()
  if (label === 'same day' || label === 'same-day') return 'SAME_DAY'
  if (label === 'next day') return 'NEXT_DAY'
  if (label === 'economy') return 'ECONOMY'
  if (label === 'standard') return 'STANDARD'
  const tags = Array.isArray(order?.tags) ? order.tags : []
  for (const tag of tags) {
    const value = String(tag).toLowerCase()
    if (value === 'same day' || value === 'same-day') return 'SAME_DAY'
    if (value === 'next day') return 'NEXT_DAY'
    if (value === 'economy') return 'ECONOMY'
    if (value === 'standard') return 'STANDARD'
  }
  return null
}

export function orderZoneKeys(order) {
  const area = String(order?.vendorArea || '').trim()
  const keys = []
  if (area) {
    keys.push(area)
    const gov = BAHRAIN_CITY_GOVERNORATE[area]
    if (gov) keys.push(gov)
  }
  return keys
}

export function zonesFromOrders(orders) {
  const extra = new Map()
  for (const order of Array.isArray(orders) ? orders : []) {
    const area = String(order?.vendorArea || '').trim()
    if (!area) continue
    if (BAHRAIN_GOVERNORATES.includes(area)) continue
    extra.set(area, { id: area, label: area })
  }
  return [
    ...BAHRAIN_GOVERNORATES.map((id) => ({ id, label: id })),
    ...[...extra.values()].sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' })),
  ]
}

export function orderMatchesScheduledBoardQuery(order, query) {
  if (!query) return true

  const ranges = rangesForQuery(query)
  if (ranges && ranges.length && !inAnyRange(orderWindowDate(order), ranges)) return false

  const types = Array.isArray(query.types) ? query.types : []
  if (types.length) {
    const type = orderDispatchType(order)
    if (!type || !types.includes(type)) return false
  }

  const stages = Array.isArray(query.stages) ? query.stages : []
  if (stages.length && !stages.includes(String(order?.column || ''))) return false

  const zones = Array.isArray(query.zones) ? query.zones : []
  if (zones.length) {
    const keys = orderZoneKeys(order)
    if (!zones.some((zone) => keys.includes(zone))) return false
  }

  return true
}

export function filterScheduledOrders(orders, query) {
  return (Array.isArray(orders) ? orders : []).filter((order) => orderMatchesScheduledBoardQuery(order, query))
}

export function scheduledBoardFilterChips(query, { zones = [] } = {}) {
  const chips = []
  for (const id of query?.dates || []) {
    if (id === 'today' && (query.dates || []).length === 1 && !(query.types?.length || query.stages?.length || query.zones?.length)) {
      continue
    }
    const option = SCHEDULED_DATE_OPTIONS.find((item) => item.id === id)
    let label = option?.label || id
    if (id === 'custom' && (query.dateFrom || query.dateTo)) {
      label = `Custom · ${query.dateFrom || '…'} → ${query.dateTo || '…'}`
    }
    chips.push({ key: `date:${id}`, label, group: 'dates', id })
  }
  for (const id of query?.types || []) {
    const option = SCHEDULED_TYPE_OPTIONS.find((item) => item.id === id)
    chips.push({ key: `type:${id}`, label: option?.label || id, group: 'types', id })
  }
  for (const id of query?.stages || []) {
    const option = SCHEDULED_STAGE_OPTIONS.find((item) => item.id === id)
    chips.push({ key: `stage:${id}`, label: option?.label || id, group: 'stages', id })
  }
  for (const id of query?.zones || []) {
    const zone = zones.find((item) => item.id === id)
    chips.push({ key: `zone:${id}`, label: zone?.label || id, group: 'zones', id })
  }
  return chips
}

export function removeScheduledBoardChip(query, chip) {
  const next = {
    ...EMPTY_SCHEDULED_BOARD_QUERY,
    ...query,
    dates: [...(query.dates || [])],
    types: [...(query.types || [])],
    stages: [...(query.stages || [])],
    zones: [...(query.zones || [])],
  }
  if (chip.group && Array.isArray(next[chip.group])) {
    next[chip.group] = next[chip.group].filter((id) => id !== chip.id)
  }
  if (chip.id === 'custom') {
    next.dateFrom = ''
    next.dateTo = ''
  }
  return next
}
