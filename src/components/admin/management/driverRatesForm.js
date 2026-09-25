/**
 * Driver rates form helpers (OG §06 / D07 Batch 3).
 * Pure JS — shared by AdminDriverRatesPanel and unit tests.
 *
 * On-demand: base by vehicle + free radius + extra/km.
 * Scheduled: separate Bike and Car flat grids × tier × Normal/Special — no distance.
 */

import {
  SCHEDULED_SPEED_TIER_LABELS,
  SCHEDULED_SPEED_TIERS,
} from './scheduledFeesForm.js'

export { SCHEDULED_SPEED_TIER_LABELS, SCHEDULED_SPEED_TIERS }

export const DRIVER_ON_DEMAND_KEYS = ['bikeBase', 'carBase', 'freeRadiusKm', 'extraPerKm']

export const DRIVER_SCHEDULED_TIER_KEYS = ['normal', 'special']

export const DRIVER_SCHEDULED_GRID_KEYS = ['scheduledBike', 'scheduledCar']

function emptyOnDemandForm() {
  return {
    bikeBase: '',
    carBase: '',
    freeRadiusKm: '',
    extraPerKm: '',
  }
}

function emptyScheduledTierForm() {
  return { normal: '', special: '' }
}

function emptyScheduledGridForm() {
  return {
    tiers: {
      SAME_DAY: emptyScheduledTierForm(),
      NEXT_DAY: emptyScheduledTierForm(),
      STANDARD: emptyScheduledTierForm(),
      ECONOMY: emptyScheduledTierForm(),
    },
  }
}

export function emptyDriverRatesForm() {
  return {
    onDemand: emptyOnDemandForm(),
    scheduledBike: emptyScheduledGridForm(),
    scheduledCar: emptyScheduledGridForm(),
  }
}

export const EMPTY_DRIVER_RATES = emptyDriverRatesForm()

function asInputValue(value) {
  if (value === null || value === undefined) return ''
  return String(value)
}

function pickCellValue(obj, key) {
  const cell = obj?.[key]
  if (cell && typeof cell === 'object' && 'value' in cell) return cell.value
  return obj?.[key]
}

function normalizeOnDemand(raw) {
  const src = raw && typeof raw === 'object' ? raw : {}
  return {
    bikeBase: asInputValue(pickCellValue(src, 'bikeBase')),
    carBase: asInputValue(pickCellValue(src, 'carBase')),
    freeRadiusKm: asInputValue(pickCellValue(src, 'freeRadiusKm')),
    extraPerKm: asInputValue(pickCellValue(src, 'extraPerKm')),
  }
}

function normalizeScheduledGrid(raw) {
  const base = emptyScheduledGridForm()
  if (!raw || typeof raw !== 'object') return base
  const tiersRaw = raw.tiers && typeof raw.tiers === 'object' ? raw.tiers : raw
  for (const tier of SCHEDULED_SPEED_TIERS) {
    const cell = tiersRaw[tier] && typeof tiersRaw[tier] === 'object' ? tiersRaw[tier] : {}
    base.tiers[tier] = {
      normal: asInputValue(pickCellValue(cell, 'normal')),
      special: asInputValue(pickCellValue(cell, 'special')),
    }
  }
  return base
}

/**
 * Normalize API `driverRates` (flat store-type or branch inherited) into form strings.
 * Empty/null cells stay empty — never invent zeros.
 */
export function normalizeDriverRates(raw) {
  const base = emptyDriverRatesForm()
  if (!raw || typeof raw !== 'object') return base
  base.onDemand = normalizeOnDemand(raw.onDemand)
  base.scheduledBike = normalizeScheduledGrid(raw.scheduledBike)
  base.scheduledCar = normalizeScheduledGrid(raw.scheduledCar)
  return base
}

function extractOnDemandMeta(raw) {
  if (!raw || typeof raw !== 'object') return null
  const hasInherited = DRIVER_ON_DEMAND_KEYS.some((key) => {
    const field = raw[key]
    return field && typeof field === 'object' && 'state' in field
  })
  if (!hasInherited) return null
  const out = {}
  for (const key of DRIVER_ON_DEMAND_KEYS) {
    const field = raw[key]
    if (field && typeof field === 'object' && 'state' in field) {
      out[key] = {
        state: String(field.state || 'inherited').toLowerCase(),
        defaultValue: field.defaultValue,
      }
    }
  }
  return out
}

function extractScheduledGridMeta(raw) {
  if (!raw || typeof raw !== 'object') return null
  const tiersRaw = raw.tiers && typeof raw.tiers === 'object' ? raw.tiers : raw
  const hasInherited = SCHEDULED_SPEED_TIERS.some((tier) => {
    const cell = tiersRaw[tier]
    if (!cell || typeof cell !== 'object') return false
    return Object.values(cell).some((v) => v && typeof v === 'object' && 'state' in v)
  })
  if (!hasInherited) return null

  const tiers = {}
  for (const tier of SCHEDULED_SPEED_TIERS) {
    const cell = tiersRaw[tier] && typeof tiersRaw[tier] === 'object' ? tiersRaw[tier] : {}
    const out = {}
    for (const key of DRIVER_SCHEDULED_TIER_KEYS) {
      const field = cell[key]
      if (field && typeof field === 'object' && 'state' in field) {
        out[key] = {
          state: String(field.state || 'inherited').toLowerCase(),
          defaultValue: field.defaultValue,
        }
      }
    }
    tiers[tier] = out
  }
  return { tiers }
}

/**
 * Extract per-field inheritance meta from branch/vendor GET `driverRates`.
 */
export function extractDriverRatesFieldMeta(raw) {
  if (!raw || typeof raw !== 'object') return null
  const onDemand = extractOnDemandMeta(raw.onDemand)
  const scheduledBike = extractScheduledGridMeta(raw.scheduledBike)
  const scheduledCar = extractScheduledGridMeta(raw.scheduledCar)
  if (!onDemand && !scheduledBike && !scheduledCar) return null
  return { onDemand, scheduledBike, scheduledCar }
}

function emptyToNull(value) {
  const trimmed = String(value ?? '').trim()
  return trimmed === '' ? null : trimmed
}

/**
 * Build PUT body for `driverRates`.
 * Empty money/km → null. Never emits distance keys on scheduled grids.
 * Always emits separate scheduledBike and scheduledCar.
 */
export function buildDriverRatesPayload(form) {
  const src = form || EMPTY_DRIVER_RATES
  const onDemandSrc = src.onDemand || emptyOnDemandForm()

  const buildGrid = (grid) => {
    const tiersIn = grid?.tiers || emptyScheduledGridForm().tiers
    const tiers = {}
    for (const tier of SCHEDULED_SPEED_TIERS) {
      const cell = tiersIn[tier] || emptyScheduledTierForm()
      tiers[tier] = {
        normal: emptyToNull(cell.normal),
        special: emptyToNull(cell.special),
      }
    }
    return { tiers }
  }

  return {
    onDemand: {
      bikeBase: emptyToNull(onDemandSrc.bikeBase),
      carBase: emptyToNull(onDemandSrc.carBase),
      freeRadiusKm: emptyToNull(onDemandSrc.freeRadiusKm),
      extraPerKm: emptyToNull(onDemandSrc.extraPerKm),
    },
    scheduledBike: buildGrid(src.scheduledBike),
    scheduledCar: buildGrid(src.scheduledCar),
  }
}

/** True if payload has both scheduledBike and scheduledCar (not a shared set). */
export function hasSeparateScheduledDriverGrids(payload) {
  if (!payload || typeof payload !== 'object') return false
  return (
    payload.scheduledBike != null &&
    typeof payload.scheduledBike === 'object' &&
    payload.scheduledCar != null &&
    typeof payload.scheduledCar === 'object' &&
    !('scheduled' in payload && payload.scheduledBike === payload.scheduledCar)
  )
}
