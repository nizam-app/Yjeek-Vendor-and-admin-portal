import { ApiError } from '../../api/errors'

const DAY_TO_API = {
  Monday: 'mon',
  Tuesday: 'tue',
  Wednesday: 'wed',
  Thursday: 'thu',
  Friday: 'fri',
  Saturday: 'sat',
  Sunday: 'sun',
}

const API_TO_DAY = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
}

function formatMinOrder(value) {
  if (value === null || value === undefined || value === '') return '—'
  const numeric = Number(value)
  if (Number.isNaN(numeric)) return String(value)
  return `BHD ${numeric.toFixed(3)}`
}

function formatRadius(value) {
  if (value === null || value === undefined || value === '') return '—'
  const numeric = Number(value)
  if (Number.isNaN(numeric)) return String(value)
  return `${numeric} km`
}

function formatEta(value) {
  if (value === null || value === undefined || value === '') return '—'
  const numeric = Number(value)
  if (Number.isNaN(numeric)) return String(value)
  return `${numeric} min`
}

function optionalNumber(value) {
  if (value === null || value === undefined || value === '') return undefined
  const numeric = Number(value)
  if (Number.isNaN(numeric)) return undefined
  return numeric
}

/**
 * "9:00 AM" / "11:00 PM" → "09:00" / "23:00"
 */
export function mapUiTimeTo24h(value) {
  const raw = String(value || '').trim()
  if (!raw) return null
  if (/^\d{1,2}:\d{2}$/.test(raw)) {
    const [h, m] = raw.split(':').map(Number)
    if (Number.isNaN(h) || Number.isNaN(m)) return null
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  }
  const match = raw.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (!match) return null
  let hour = Number(match[1])
  const minute = Number(match[2])
  const period = match[3].toUpperCase()
  if (Number.isNaN(hour) || Number.isNaN(minute)) return null
  if (period === 'AM') {
    if (hour === 12) hour = 0
  } else if (hour !== 12) {
    hour += 12
  }
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

export function map24hToUiTime(value) {
  const raw = String(value || '').trim()
  const match = raw.match(/^(\d{1,2}):(\d{2})$/)
  if (!match) return raw || '9:00 AM'
  let hour = Number(match[1])
  const minute = match[2]
  if (Number.isNaN(hour)) return raw
  const period = hour >= 12 ? 'PM' : 'AM'
  if (hour === 0) hour = 12
  else if (hour > 12) hour -= 12
  return `${hour}:${minute} ${period}`
}

/**
 * Wizard hours UI → API openingHours (sun|mon|…|sat).
 * Closed day: "closed". Open day: { open, close } (+ optional shifts for split).
 */
export function mapWizardHoursToOpeningHours(hours) {
  if (!hours || typeof hours !== 'object') return undefined
  const openingHours = {}
  let any = false

  for (const [day, config] of Object.entries(hours)) {
    const key = DAY_TO_API[day]
    if (!key || !config || typeof config !== 'object') continue
    any = true
    if (!config.open) {
      openingHours[key] = 'closed'
      continue
    }
    const shifts = Array.isArray(config.shifts) ? config.shifts.filter(Boolean) : []
    if (!shifts.length) {
      openingHours[key] = 'closed'
      continue
    }
    const mappedShifts = shifts
      .map((shift) => {
        const open = mapUiTimeTo24h(shift.from)
        const close = mapUiTimeTo24h(shift.to)
        if (!open || !close) return null
        return { open, close }
      })
      .filter(Boolean)
    if (!mappedShifts.length) {
      openingHours[key] = 'closed'
      continue
    }
    if (mappedShifts.length === 1) {
      openingHours[key] = mappedShifts[0]
    } else {
      openingHours[key] = {
        open: mappedShifts[0].open,
        close: mappedShifts[mappedShifts.length - 1].close,
        shifts: mappedShifts,
      }
    }
  }

  return any ? openingHours : undefined
}

/**
 * API openingHours → wizard hours UI shape.
 */
export function mapOpeningHoursToWizardHours(openingHours, fallbackHours) {
  const base =
    fallbackHours && typeof fallbackHours === 'object'
      ? structuredClone
        ? structuredClone(fallbackHours)
        : JSON.parse(JSON.stringify(fallbackHours))
      : null

  if (!openingHours || typeof openingHours !== 'object' || Array.isArray(openingHours)) {
    return base
  }

  const hours = base || {}
  for (const [apiDay, dayValue] of Object.entries(openingHours)) {
    const day = API_TO_DAY[apiDay] || API_TO_DAY[String(apiDay).toLowerCase()]
    if (!day) continue
    if (dayValue === 'closed' || dayValue === false) {
      hours[day] = { open: false, mode: 'single', shifts: [] }
      continue
    }
    if (typeof dayValue === 'string') {
      hours[day] = {
        open: true,
        mode: 'single',
        shifts: [{ from: dayValue, to: dayValue }],
      }
      continue
    }
    if (dayValue && typeof dayValue === 'object') {
      const shiftsRaw = Array.isArray(dayValue.shifts) ? dayValue.shifts : null
      if (shiftsRaw?.length) {
        hours[day] = {
          open: true,
          mode: shiftsRaw.length > 1 ? 'split' : 'single',
          shifts: shiftsRaw.map((shift) => ({
            from: map24hToUiTime(shift.open || shift.from),
            to: map24hToUiTime(shift.close || shift.to),
          })),
        }
      } else if (dayValue.open && dayValue.close) {
        hours[day] = {
          open: true,
          mode: 'single',
          shifts: [
            {
              from: map24hToUiTime(dayValue.open),
              to: map24hToUiTime(dayValue.close),
            },
          ],
        }
      }
    }
  }

  return hours
}

function resolveOperationalStatus(form = {}) {
  if (form.operationalStatus) {
    const raw = String(form.operationalStatus).trim().toUpperCase()
    if (raw === 'OPEN' || raw === 'CLOSED' || raw === 'BUSY') return raw
  }
  if (typeof form.branchOnline === 'boolean') {
    return form.branchOnline ? 'OPEN' : 'CLOSED'
  }
  if (typeof form.online === 'boolean') {
    return form.online ? 'OPEN' : 'CLOSED'
  }
  return undefined
}

/**
 * Map one branch from GET/POST branches list into Branches table row.
 *
 * Confirmed fields: id, name, address, area, city, phone, radiusKm, etaMin,
 * minOrder, deliveryFee, hours, status, operationalStatus, isSuspended,
 * forceClosedUntil, isPrimary, latitude, longitude, openingHours?
 */
export function mapAdminVendorBranchListItem(branch) {
  if (!branch || typeof branch !== 'object') return null
  const id = String(branch.id || '').trim()
  if (!id) return null

  const addressLine = branch.address || branch.city || null

  const block = addressLine || (branch.isPrimary ? 'Primary' : '—')
  const radius = formatRadius(branch.radiusKm)
  const eta = formatEta(branch.etaMin)
  const minOrder = formatMinOrder(branch.minOrder)

  return {
    id,
    name: branch.name || 'Untitled',
    block,
    area: branch.area || '—',
    radius,
    eta,
    minOrder,
    detail: `${block} · radius ${radius} · ETA ${eta} · min ${minOrder}`,
    radiusKm: branch.radiusKm ?? null,
    etaMin: branch.etaMin ?? null,
    minOrderAmount: branch.minOrder ?? null,
    hours: branch.hours || '—',
    openingHours: branch.openingHours ?? null,
    status: branch.status || '—',
    operationalStatus: branch.operationalStatus ?? null,
    isSuspended: Boolean(branch.isSuspended),
    forceClosedUntil: branch.forceClosedUntil ?? null,
    isPrimary: Boolean(branch.isPrimary),
    address: branch.address ?? null,
    city: branch.city ?? null,
    phone: branch.phone ?? null,
    latitude: branch.latitude ?? null,
    longitude: branch.longitude ?? null,
    deliveryFee: branch.deliveryFee ?? null,
    areaCity: branch.area || branch.city || 'Manama',
    allowsPickup: typeof branch.allowsPickup === 'boolean' ? branch.allowsPickup : true,
    allowsDineIn: typeof branch.allowsDineIn === 'boolean' ? branch.allowsDineIn : true,
  }
}

/**
 * Map GET/POST /admin/vendors/:id/branches `data` → { count, branches }.
 */
export function mapAdminVendorBranchesResponse(data) {
  if (!data || typeof data !== 'object') {
    throw new ApiError({ message: 'Invalid vendor branches response from the server.' })
  }

  const raw = Array.isArray(data.branches) ? data.branches : Array.isArray(data) ? data : []
  const branches = raw.map(mapAdminVendorBranchListItem).filter(Boolean)

  return {
    count: Number(data.count) || branches.length,
    branches,
  }
}

/**
 * Map branch setup form → POST create body.
 * Confirmed: name, area, address, phone?, lat/lng, deliveryRadiusKm, minOrderAmount,
 * etaMin, deliveryFee, openingHours, operationalStatus, isPrimary.
 */
export function mapAdminCreateBranchRequest(form = {}) {
  const name = String(form.name || '').trim()
  if (!name) {
    throw new ApiError({ message: 'Branch name is required.' })
  }

  const area = String(form.areaCity || form.area || '').trim()
  if (!area) {
    throw new ApiError({ message: 'Area / city is required.' })
  }

  const address = String(form.address || '').trim()
  const latitude = Number(form.latitude)
  const longitude = Number(form.longitude)

  if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
    throw new ApiError({ message: 'Latitude and longitude are required.' })
  }

  const body = {
    name,
    area,
    city: String(form.city || area).trim() || area,
    address: address || undefined,
    latitude,
    longitude,
  }

  const phone = String(form.phone || '').trim()
  if (phone) body.phone = phone

  const deliveryRadiusKm = optionalNumber(form.radiusKm ?? form.deliveryRadiusKm)
  if (deliveryRadiusKm !== undefined) body.deliveryRadiusKm = deliveryRadiusKm

  const minOrderAmount = optionalNumber(form.minOrderValue ?? form.minOrderAmount ?? form.minOrder)
  if (minOrderAmount !== undefined) body.minOrderAmount = minOrderAmount

  const etaMin = optionalNumber(form.etaMin)
  if (etaMin !== undefined) body.etaMin = etaMin

  const deliveryFee = optionalNumber(form.deliveryFee)
  if (deliveryFee !== undefined) body.deliveryFee = deliveryFee

  const openingHours =
    form.openingHours ||
    mapWizardHoursToOpeningHours(form.hours)
  if (openingHours) body.openingHours = openingHours

  const operationalStatus = resolveOperationalStatus(form)
  if (operationalStatus) body.operationalStatus = operationalStatus

  if (typeof form.isPrimary === 'boolean') body.isPrimary = form.isPrimary

  if (typeof form.allowsPickup === 'boolean') body.allowsPickup = form.allowsPickup
  if (typeof form.allowsDineIn === 'boolean') body.allowsDineIn = form.allowsDineIn

  return body
}

/**
 * Map branch setup form → PATCH update body.
 * Uses confirmed branch field names (deliveryRadiusKm / minOrderAmount).
 */
export function mapAdminUpdateBranchRequest(form = {}) {
  const body = {}

  const name = String(form.name || '').trim()
  if (name) body.name = name

  const area = String(form.areaCity || form.area || '').trim()
  if (area) body.area = area

  const city = String(form.city || '').trim()
  if (city) body.city = city
  else if (area) body.city = area

  const address = String(form.address || '').trim()
  if (address) body.address = address

  const phone = String(form.phone || '').trim()
  if (phone) body.phone = phone

  const latitude = optionalNumber(form.latitude)
  if (latitude !== undefined) body.latitude = latitude

  const longitude = optionalNumber(form.longitude)
  if (longitude !== undefined) body.longitude = longitude

  const etaMin = optionalNumber(form.etaMin)
  if (etaMin !== undefined) body.etaMin = etaMin

  const deliveryRadiusKm = optionalNumber(form.radiusKm ?? form.deliveryRadiusKm)
  if (deliveryRadiusKm !== undefined) body.deliveryRadiusKm = deliveryRadiusKm

  const minOrderAmount = optionalNumber(form.minOrderValue ?? form.minOrderAmount ?? form.minOrder)
  if (minOrderAmount !== undefined) body.minOrderAmount = minOrderAmount

  const deliveryFee = optionalNumber(form.deliveryFee)
  if (deliveryFee !== undefined) body.deliveryFee = deliveryFee

  const openingHours =
    form.openingHours ||
    (form.hours ? mapWizardHoursToOpeningHours(form.hours) : undefined)
  if (openingHours) body.openingHours = openingHours

  const operationalStatus = resolveOperationalStatus(form)
  if (operationalStatus) body.operationalStatus = operationalStatus

  if (typeof form.isPrimary === 'boolean') body.isPrimary = form.isPrimary

  if (typeof form.allowsPickup === 'boolean') body.allowsPickup = form.allowsPickup
  if (typeof form.allowsDineIn === 'boolean') body.allowsDineIn = form.allowsDineIn

  if (Object.keys(body).length === 0) {
    throw new ApiError({ message: 'No branch fields to update.' })
  }

  return body
}
