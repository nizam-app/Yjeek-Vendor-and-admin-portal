import { ApiError } from '../../api/errors'

/**
 * Static Bahrain city → governorate map (mirrors backend resolveGovernorate).
 * Used to cascade filter options even when a city has 0 orders this week.
 */
export const BAHRAIN_CITY_GOVERNORATE = {
  Manama: 'Capital',
  Seef: 'Capital',
  Juffair: 'Capital',
  Adliya: 'Capital',
  'Diplomatic Area': 'Capital',
  Muharraq: 'Muharraq',
  Hidd: 'Muharraq',
  Busaiteen: 'Muharraq',
  Arad: 'Muharraq',
  Galali: 'Muharraq',
  Samaheej: 'Muharraq',
  Saar: 'Northern',
  Budaiya: 'Northern',
  Janabiya: 'Northern',
  Hamala: 'Northern',
  Barbar: 'Northern',
  Diraz: 'Northern',
  Jasra: 'Northern',
  Riffa: 'Southern',
  'Isa Town': 'Southern',
  Sitra: 'Southern',
  Askar: 'Southern',
  Awali: 'Southern',
}

export const BAHRAIN_GOVERNORATES = ['Capital', 'Muharraq', 'Northern', 'Southern']

/**
 * @param {unknown} day
 */
export function mapAdminScheduledCalendarDay(day) {
  if (!day || typeof day !== 'object') {
    throw new ApiError({ message: 'Invalid scheduled calendar day from the server.' })
  }
  const date = String(day.date || '').trim()
  return {
    key: date,
    date,
    label: String(day.label || date),
    weekday: String(day.weekday || ''),
  }
}

/**
 * @param {unknown} item
 * @param {{ key: string, date: string }[]} days
 */
export function mapAdminScheduledCalendarItem(item, days = []) {
  if (!item || typeof item !== 'object') {
    throw new ApiError({ message: 'Invalid scheduled calendar item from the server.' })
  }

  const orderNumber = String(item.orderNumber || item.id || '').trim()
  const displayId = orderNumber.startsWith('#') ? orderNumber : `#${orderNumber}`
  const city = String(item.city || '').trim()
  const block = item.block != null && String(item.block).trim() ? String(item.block).trim() : null
  const zone = item.zone != null && String(item.zone).trim() ? String(item.zone).trim() : null
  const governorate = String(item.governorate || BAHRAIN_CITY_GOVERNORATE[city] || 'Capital')
  const vendorName = String(item.vendor?.name || item.vendor?.label || 'Vendor')
  const placeParts = [city || zone, block].filter(Boolean)
  const cells = item.cells && typeof item.cells === 'object' ? item.cells : {}

  /** @type {Record<string, { kind: 'assigned', champ: string, window: string } | 'assign' | 'empty'>} */
  const slots = {}
  for (const day of days) {
    const cell = cells[day.key] || cells[day.date]
    if (!cell || !cell.available) {
      slots[day.key] = 'empty'
      continue
    }
    if (item.champ?.name) {
      slots[day.key] = {
        kind: 'assigned',
        champ: String(item.champ.name),
        window: String(cell.windowLabel || item.windowLabel || '—'),
      }
    } else {
      slots[day.key] = 'assign'
    }
  }

  return {
    id: String(item.id || orderNumber),
    orderId: String(item.id || ''),
    orderNumber: displayId,
    store: vendorName,
    place: placeParts.join(' · ') || '—',
    type: String(item.typeLabel || item.type || '—'),
    governorate,
    city,
    block,
    zone,
    champId: item.champ?.id ? String(item.champ.id) : null,
    champName: item.champ?.name ? String(item.champ.name) : null,
    vendorId: item.vendor?.id ? String(item.vendor.id) : null,
    deliveryDate: String(item.deliveryDate || ''),
    windowLabel: item.windowLabel ? String(item.windowLabel) : null,
    slots,
  }
}

/**
 * Normalize GET /admin/dashboard/boards/scheduled/calendar `data`.
 * @param {unknown} data
 */
export function mapAdminScheduledCalendarResponse(data) {
  if (!data || typeof data !== 'object') {
    throw new ApiError({ message: 'Invalid scheduled calendar response from the server.' })
  }

  const days = Array.isArray(data.days)
    ? data.days.map(mapAdminScheduledCalendarDay)
    : []

  const items = Array.isArray(data.items)
    ? data.items.map((item) => mapAdminScheduledCalendarItem(item, days))
    : []

  const govCountsRaw = Array.isArray(data.governorateCounts) ? data.governorateCounts : []
  const governorateCounts = BAHRAIN_GOVERNORATES.map((key) => {
    const hit = govCountsRaw.find((g) => String(g.key || g.label) === key)
    return {
      key,
      label: key,
      count: Number(hit?.count) || 0,
    }
  })

  const filters = data.filters && typeof data.filters === 'object' ? data.filters : {}

  const citiesFromApi = Array.isArray(filters.cities)
    ? filters.cities.map((c) => ({
        id: String(c.key || c.label || ''),
        label: String(c.label || c.key || ''),
        governorate: String(c.governorate || BAHRAIN_CITY_GOVERNORATE[c.key || c.label] || 'Capital'),
        count: Number(c.count) || 0,
      })).filter((c) => c.id)
    : []

  // Merge static cities so cascade options stay complete when a city has 0 orders.
  const cityMap = new Map(citiesFromApi.map((c) => [c.id.toLowerCase(), c]))
  for (const [city, governorate] of Object.entries(BAHRAIN_CITY_GOVERNORATE)) {
    const key = city.toLowerCase()
    if (!cityMap.has(key)) {
      cityMap.set(key, { id: city, label: city, governorate, count: 0 })
    }
  }
  const cities = [...cityMap.values()].sort((a, b) => a.label.localeCompare(b.label))

  const blocks = Array.isArray(filters.blocks)
    ? filters.blocks.map((b) => {
        const city = String(b.city || '')
        const blockKey = String(b.key || b.label || '')
        const labelRaw = String(b.label || b.key || '')
        return {
          id: city ? `${city}::${blockKey}` : blockKey,
          block: blockKey,
          label: labelRaw.startsWith('Block') ? labelRaw : `Block ${labelRaw}`,
          city,
          governorate: String(b.governorate || BAHRAIN_CITY_GOVERNORATE[city] || 'Capital'),
          count: Number(b.count) || 0,
          sub: city || undefined,
        }
      }).filter((b) => b.block)
    : []

  const governorates = BAHRAIN_GOVERNORATES.map((key) => {
    const fromFilters = Array.isArray(filters.governorates)
      ? filters.governorates.find((g) => String(g.key || g.label) === key)
      : null
    const fromChips = governorateCounts.find((g) => g.key === key)
    return {
      id: key,
      label: key,
      count: Number(fromFilters?.count ?? fromChips?.count) || 0,
    }
  })

  const types = Array.isArray(filters.types)
    ? filters.types.map((t) => ({
        id: String(t.key || t.id || ''),
        label: String(t.label || t.key || ''),
      })).filter((t) => t.id)
    : []

  const vendors = Array.isArray(filters.vendors)
    ? filters.vendors.map((v) => ({
        id: String(v.id || ''),
        label: String(v.name || v.label || ''),
      })).filter((v) => v.id)
    : []

  const champs = Array.isArray(filters.champs)
    ? filters.champs.map((c) => ({
        id: String(c.id || ''),
        label: String(c.name || c.label || ''),
      })).filter((c) => c.id)
    : []

  return {
    view: 'calendar',
    title: String(data.title || 'Orders × available delivery days'),
    weekStart: data.weekStart ? String(data.weekStart) : null,
    weekEnd: data.weekEnd ? String(data.weekEnd) : null,
    days,
    governorateCounts,
    filters: {
      governorates,
      cities,
      blocks,
      types,
      vendors,
      champs,
    },
    counts: {
      orders: Number(data.counts?.orders) || items.length,
      allMatched: Number(data.counts?.allMatched) || items.length,
      scheduledToday: Number(data.counts?.scheduledToday) || items.length,
    },
    items,
  }
}

export const emptyAdminScheduledCalendar = {
  view: 'calendar',
  title: 'Orders × available delivery days',
  weekStart: null,
  weekEnd: null,
  days: [],
  governorateCounts: BAHRAIN_GOVERNORATES.map((key) => ({ key, label: key, count: 0 })),
  filters: {
    governorates: BAHRAIN_GOVERNORATES.map((id) => ({ id, label: id, count: 0 })),
    cities: Object.entries(BAHRAIN_CITY_GOVERNORATE).map(([id, governorate]) => ({
      id,
      label: id,
      governorate,
      count: 0,
    })),
    blocks: [],
    types: [],
    vendors: [],
    champs: [],
  },
  counts: { orders: 0, allMatched: 0, scheduledToday: 0 },
  items: [],
}
