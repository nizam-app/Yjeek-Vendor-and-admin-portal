import { ApiError } from '../../api/errors'
import {
  VENDOR_SLA_SECTIONS,
  CHAMP_SLA_SECTIONS,
  DISPATCHER_SLA_SECTIONS,
  buildSlaDefaults,
} from '../../components/admin/management/AdminVendorSlaTemplate'

function pad2(value) {
  return String(Math.max(0, Number.parseInt(value, 10) || 0)).padStart(2, '0')
}

function num(value) {
  if (value == null || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function asRecord(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
}

export function durationFromSec(seconds, operator = '≤') {
  const total = Math.max(0, Math.round(num(seconds) ?? 0))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return { operator, h: pad2(h), m: pad2(m), s: pad2(s) }
}

export function secFromDuration(value) {
  if (!value || typeof value !== 'object') return null
  const h = Number.parseInt(value.h, 10) || 0
  const m = Number.parseInt(value.m, 10) || 0
  const s = Number.parseInt(value.s, 10) || 0
  return h * 3600 + m * 60 + s
}

function percentFromPct(pct, operator = '≥') {
  const parsed = num(pct)
  if (parsed == null) return null
  return { operator, amount: String(parsed) }
}

function pctFromPercent(value) {
  if (!value || typeof value !== 'object') return null
  return num(value.amount)
}

function ratingFromApi(amount, operator = '≥') {
  const parsed = num(amount)
  if (parsed == null) return null
  return { operator, amount: String(parsed) }
}

function numberFromApi(amount, operator = '≤') {
  const parsed = num(amount)
  if (parsed == null) return null
  return { operator, amount: String(parsed) }
}

function rangeFromApi(range) {
  const source = asRecord(range)
  const min = num(source.min)
  const max = num(source.max)
  if (min == null && max == null) return null
  return { min: min == null ? '' : String(min), max: max == null ? '' : String(max) }
}

function rangeToApi(value, fallback) {
  const source = asRecord(value)
  const min = num(source.min) ?? fallback?.min ?? 0
  const max = num(source.max) ?? fallback?.max ?? min
  return { min, max: Math.max(min, max) }
}

function clockFromApi(timeStr, operator = '=') {
  const parts = String(timeStr || '00:00:00').split(':')
  let h = Number.parseInt(parts[0], 10)
  if (!Number.isFinite(h)) h = 0
  const m = Number.parseInt(parts[1], 10) || 0
  const s = Number.parseInt(parts[2], 10) || 0
  const period = h >= 12 ? 'PM' : 'AM'
  let h12 = h % 12
  if (h12 === 0) h12 = 12
  return {
    operator,
    time: `${pad2(h12)}:${pad2(m)}:${pad2(s)}`,
    period,
  }
}

function clockToApi(value) {
  if (!value || typeof value !== 'object') return null
  const parts = String(value.time || '00:00:00').split(':')
  let h = Number.parseInt(parts[0], 10)
  if (!Number.isFinite(h)) h = 0
  const m = Number.parseInt(parts[1], 10) || 0
  const s = Number.parseInt(parts[2], 10) || 0
  const period = String(value.period || 'AM').toUpperCase()
  if (period === 'PM' && h < 12) h += 12
  if (period === 'AM' && h === 12) h = 0
  h = Math.min(23, Math.max(0, h))
  return `${pad2(h)}:${pad2(m)}:${pad2(s)}`
}

function durationFromClockTime(timeStr, operator = '≤') {
  const parts = String(timeStr || '00:00:00').split(':')
  return {
    operator,
    h: pad2(Number.parseInt(parts[0], 10) || 0),
    m: pad2(Number.parseInt(parts[1], 10) || 0),
    s: pad2(Number.parseInt(parts[2], 10) || 0),
  }
}

function clockTimeFromDuration(value) {
  const seconds = secFromDuration(value)
  if (seconds == null) return null
  const wrapped = ((seconds % 86400) + 86400) % 86400
  const h = Math.floor(wrapped / 3600)
  const m = Math.floor((wrapped % 3600) / 60)
  const s = wrapped % 60
  return `${pad2(h)}:${pad2(m)}:${pad2(s)}`
}

function clockToSeconds(timeStr) {
  const parts = String(timeStr || '00:00:00').split(':')
  const h = Number.parseInt(parts[0], 10) || 0
  const m = Number.parseInt(parts[1], 10) || 0
  const s = Number.parseInt(parts[2], 10) || 0
  return h * 3600 + m * 60 + s
}

function addSecondsToClock(timeStr, extraSec) {
  const next = (clockToSeconds(timeStr) + Math.max(0, extraSec)) % 86400
  const h = Math.floor(next / 3600)
  const m = Math.floor((next % 3600) / 60)
  const s = next % 60
  return `${pad2(h)}:${pad2(m)}:${pad2(s)}`
}

function setDuration(target, key, seconds, fallback, operator) {
  if (seconds == null) return
  target[key] = durationFromSec(seconds, fallback?.[key]?.operator || operator || '≤')
}

function setPercent(target, key, pct, fallback, operator) {
  const mapped = percentFromPct(pct, fallback?.[key]?.operator || operator || '≥')
  if (mapped) target[key] = mapped
}

function setRating(target, key, amount, fallback) {
  const mapped = ratingFromApi(amount, fallback?.[key]?.operator || '≥')
  if (mapped) target[key] = mapped
}

function setNumber(target, key, amount, fallback, operator) {
  const mapped = numberFromApi(amount, fallback?.[key]?.operator || operator || '≤')
  if (mapped) target[key] = mapped
}

const WRONG_ORDER_TO_UI = {
  BEFORE_DEPARTURE: 'Before departure',
  BEFORE_DELIVERY: 'At vendor',
  IMMEDIATE: 'After delivery',
}
const WRONG_ORDER_TO_API = {
  'Before departure': 'BEFORE_DEPARTURE',
  'At vendor': 'BEFORE_DELIVERY',
  'After delivery': 'IMMEDIATE',
}

const GPS_TO_UI = {
  IMMEDIATE: 'Immediate',
  WITHIN_WINDOW: 'Within 5 min',
}
const GPS_TO_API = {
  Immediate: 'IMMEDIATE',
  'Within 5 min': 'WITHIN_WINDOW',
  'End of shift': 'WITHIN_WINDOW',
}

const SCHEDULED_TIER_MAP = {
  'same-day': 'sameDay',
  'next-day': 'nextDay',
  standard: 'days3to5',
  economy: 'customDay',
}

function mapScheduledTierFromApi(tier, fallback) {
  const source = asRecord(tier)
  const next = { ...asRecord(fallback) }
  setDuration(next, 'acceptance', source.acceptanceTimeSec, fallback)
  setDuration(next, 'champCollection', source.champCollectionTimeSec, fallback)
  setDuration(next, 'dailyOnline', source.earlyOnlineHoursSec, fallback, '≥')
  if (source.cutoffTime) {
    next.cutoff = clockFromApi(source.cutoffTime, fallback?.cutoff?.operator || '=')
  }
  if (source.preparationTimeHours != null) {
    const hours = num(source.preparationTimeHours)
    if (hours != null) {
      const h24 = Math.min(23, Math.max(0, Math.round(hours)))
      next.prepMax = clockFromApi(`${pad2(h24)}:00:00`, fallback?.prepMax?.operator || '≤')
    }
  }
  return next
}

function mapScheduledTierToApi(tier) {
  const source = asRecord(tier)
  const payload = {}
  const acceptance = secFromDuration(source.acceptance)
  const collection = secFromDuration(source.champCollection)
  const online = secFromDuration(source.dailyOnline)
  const cutoff = clockToApi(source.cutoff)
  if (acceptance != null) payload.acceptanceTimeSec = acceptance
  if (collection != null) payload.champCollectionTimeSec = collection
  if (online != null) payload.earlyOnlineHoursSec = online
  if (cutoff) payload.cutoffTime = cutoff
  const prepClock = clockToApi(source.prepMax)
  if (prepClock) {
    payload.preparationTimeHours = Math.max(0, Math.round(clockToSeconds(prepClock) / 3600))
  }
  return payload
}

function mapVendorFromConfig(config, defaults) {
  const vendor = asRecord(config.vendor)
  const hot = asRecord(vendor.hotFoodOnDemand)
  const dine = asRecord(vendor.dineIn)
  const pickup = asRecord(vendor.pickup)
  const scheduled = asRecord(vendor.scheduledDelivery)
  const services = asRecord(vendor.services)
  const vpe = asRecord(hot.vpeWeights)
  const vpi = asRecord(config.vpiWeights)

  const hotFood = { ...asRecord(defaults['hot-food']) }
  setDuration(hotFood, 'acceptance', hot.acceptanceTimeSec, defaults['hot-food'])
  setDuration(hotFood, 'champCollection', hot.champCollectionTimeSec, defaults['hot-food'])
  setDuration(hotFood, 'dailyOnline', hot.earlyOnlineHoursSec, defaults['hot-food'], '≥')
  if (hot.fullDeliveryWindowStart || hot.fullDeliveryWindowEnd) {
    hotFood.fullWindow = {
      from: durationFromClockTime(hot.fullDeliveryWindowStart || '00:00:00'),
      to: durationFromClockTime(hot.fullDeliveryWindowEnd || '23:59:59'),
    }
  }
  setDuration(hotFood, 'prepMax', hot.prepTimeLimitSec, defaults['hot-food'])
  setDuration(hotFood, 'vendorIssue', hot.customerIssueResponseSec, defaults['hot-food'])
  setPercent(hotFood, 'orderAccuracy', hot.orderAccuracyPct, defaults['hot-food'])
  setPercent(hotFood, 'onTimeReady', hot.orderRatingPct ?? config.readyOnTimeTargetPct, defaults['hot-food'])
  setPercent(hotFood, 'vpiAccuracy', vpe.accuracyWeight ?? vpi.accuracy, defaults['hot-food'], '=')
  setPercent(hotFood, 'vpiPacking', vpe.ratingWeight ?? vpi.packing, defaults['hot-food'], '=')
  setPercent(hotFood, 'vpiPrep', vpe.prepTimeWeight ?? vpi.prepTime, defaults['hot-food'], '=')
  setPercent(hotFood, 'vpiReliability', vpe.metricTypeWeight ?? vpi.reliability, defaults['hot-food'], '=')
  setDuration(hotFood, 'nonDelivery', hot.foodSafetyInvestigationSec, defaults['hot-food'])
  if (config.handoverToChampMin != null) {
    setDuration(hotFood, 'maxChampWait', Number(config.handoverToChampMin) * 60, defaults['hot-food'])
  }

  const dineIn = { ...asRecord(defaults['dine-in']) }
  setDuration(dineIn, 'acceptance', dine.acceptanceTimeSec, defaults['dine-in'])
  // Align with vendor wizard "Table ready" (tablePreparationSec) and SLA UI "Customer wait".
  setDuration(
    dineIn,
    'customerWait',
    dine.tablePreparationSec ?? dine.customerArrivalWaitSec,
    defaults['dine-in'],
  )
  setPercent(dineIn, 'reservationHonored', dine.orderAccuracyPct, defaults['dine-in'])
  setDuration(dineIn, 'billDispute', dine.issueResponseSec, defaults['dine-in'])
  setDuration(dineIn, 'reservationNotice', dine.noShowGraceSec, defaults['dine-in'], '≥')

  const pickupValues = { ...asRecord(defaults.pickup) }
  setDuration(pickupValues, 'acceptance', pickup.acceptanceTimeSec, defaults.pickup, '<')
  setDuration(pickupValues, 'customerWait', pickup.customerWaitSec, defaults.pickup)
  setDuration(pickupValues, 'maxCustomerWait', pickup.handoverSec, defaults.pickup)
  setDuration(pickupValues, 'orderHold', pickup.latePickupGraceSec, defaults.pickup, '≥')
  setPercent(pickupValues, 'onTimePrep', pickup.orderAccuracyPct, defaults.pickup)

  const scheduledValues = { ...asRecord(defaults.scheduled) }
  Object.entries(SCHEDULED_TIER_MAP).forEach(([uiKey, apiKey]) => {
    scheduledValues[uiKey] = mapScheduledTierFromApi(scheduled[apiKey], defaults.scheduled?.[uiKey])
  })
  const scheduledAll = { ...asRecord(defaults.scheduled?.all) }
  setPercent(scheduledAll, 'reliability', asRecord(scheduled.general).attendanceDuringDayPct, defaults.scheduled?.all)
  scheduledValues.all = scheduledAll

  const servicesValues = { ...asRecord(defaults.services) }
  setDuration(servicesValues, 'acceptance', services.acceptanceTimeSec, defaults.services)
  setPercent(servicesValues, 'attendance', services.serviceAttendancePct, defaults.services)
  setRating(servicesValues, 'quality', services.serviceRating, defaults.services)
  setDuration(
    servicesValues,
    'providerNoShowWait',
    services.serviceLevelAgreementSec,
    defaults.services,
  )
  setDuration(servicesValues, 'qualityReport', services.qualityReportWindowSec, defaults.services)
  setDuration(servicesValues, 'damageReport', services.inventoryDamageReportWindowSec, defaults.services)

  return {
    ...defaults,
    'hot-food': hotFood,
    'dine-in': dineIn,
    pickup: pickupValues,
    scheduled: scheduledValues,
    services: servicesValues,
  }
}

function mapChampFromConfig(config, defaults) {
  const champ = asRecord(config.champ)
  const byMode = asRecord(champ.acceptanceTimeByMode)
  const performance = asRecord(champ.performance)
  const tiers = asRecord(champ.tiers)

  const acceptance = { ...asRecord(defaults.acceptance) }
  setDuration(acceptance, 'hotFood', byMode.hotFood, defaults.acceptance)
  setDuration(acceptance, 'sameDay', byMode.sameDay, defaults.acceptance)
  setDuration(acceptance, 'nextDay', byMode.nextDay, defaults.acceptance)
  setDuration(acceptance, 'standard', byMode.standard, defaults.acceptance)
  setDuration(acceptance, 'economy', byMode.economy, defaults.acceptance)
  setDuration(acceptance, 'acceptFood', byMode.food, defaults.acceptance)
  setDuration(acceptance, 'acceptGrocery', byMode.groceryPharmacy, defaults.acceptance)
  setDuration(acceptance, 'acceptFlowers', byMode.flowers, defaults.acceptance)
  setDuration(acceptance, 'acceptElectronics', byMode.electronics, defaults.acceptance)

  const perf = { ...asRecord(defaults.performance) }
  setDuration(perf, 'doubleConfirm', performance.doubleConfirmationSec, defaults.performance)
  setPercent(perf, 'onTimeDelivery', performance.onTimeDeliveryPct, defaults.performance)
  setDuration(perf, 'workingHours', performance.workingHoursDailySec, defaults.performance, '≥')
  if (performance.peakHoursStart && performance.peakHoursEnd) {
    const span = Math.max(0, clockToSeconds(performance.peakHoursEnd) - clockToSeconds(performance.peakHoursStart))
    perf.peakHours = {
      duration: durationFromSec(span, defaults.performance?.peakHours?.duration?.operator || '≤'),
      percent: percentFromPct(
        performance.onTimeDeliveryPct,
        defaults.performance?.peakHours?.percent?.operator || '≥',
      ) || defaults.performance?.peakHours?.percent,
    }
  }
  setRating(perf, 'customerRating', performance.customerRating, defaults.performance)
  setPercent(perf, 'arrivalCompliance', performance.arrivalPickupWindowCompliancePct, defaults.performance)
  setPercent(perf, 'orderCompletion', performance.orderCompletionRatePct, defaults.performance)
  setPercent(perf, 'conductCompliance', performance.conductCompliancePct, defaults.performance)
  setDuration(perf, 'pickupArrival', performance.pickupArrivalCitySec ?? performance.pickupArrivalSuburbSec, defaults.performance)
  setDuration(perf, 'vendorWaitFood', performance.vendorWaitFoodSec, defaults.performance)
  setDuration(perf, 'vendorWaitGrocery', performance.vendorWaitGroceryPharmacySec, defaults.performance)
  setDuration(perf, 'vendorWaitFlowers', performance.vendorWaitFlowersSec, defaults.performance)
  setDuration(perf, 'vendorWaitElectronics', performance.vendorWaitElectronicsSec, defaults.performance)
  setDuration(perf, 'unreachableWait', performance.customerUnreachableWaitSec, defaults.performance)
  setNumber(perf, 'contactAttempts', performance.customerAlternativeUnreachableAttempts, defaults.performance, '=')
  if (performance.wrongOrderReportMode && WRONG_ORDER_TO_UI[performance.wrongOrderReportMode]) {
    perf.wrongOrderReport = {
      operator: defaults.performance?.wrongOrderReport?.operator || '=',
      option: WRONG_ORDER_TO_UI[performance.wrongOrderReportMode],
    }
  }
  setDuration(perf, 'emergencyOnDemand', performance.emergencyMessageOnDemandSec, defaults.performance)
  setDuration(perf, 'emergencyScheduled', performance.emergencyMessageScheduledSec, defaults.performance)
  if (performance.appGpsFailureReportMode && GPS_TO_UI[performance.appGpsFailureReportMode]) {
    perf.appGpsFailure = {
      operator: defaults.performance?.appGpsFailure?.operator || '=',
      option: GPS_TO_UI[performance.appGpsFailureReportMode],
    }
  }
  setDuration(perf, 'appGpsFixWindow', performance.appGpsFixWindowSec, defaults.performance)
  setDuration(perf, 'tempWorkaround', performance.temperatureEquipmentReturnSec, defaults.performance)
  setDuration(perf, 'champAssignment', performance.champAssignmentPlatformSec, defaults.performance)

  const tier = { ...asRecord(defaults.tier) }
  const elite = rangeFromApi(tiers.elite)
  const gold = rangeFromApi(tiers.gold)
  const silver = rangeFromApi(tiers.silver)
  const bronze = rangeFromApi(tiers.bronze)
  if (elite) tier.elite = elite
  if (gold) tier.gold = gold
  if (silver) tier.silver = silver
  if (bronze) tier.bronze = bronze
  if (tiers.atRisk) {
    tier.atRisk = numberFromApi(asRecord(tiers.atRisk).max, defaults.tier?.atRisk?.operator || '<') || tier.atRisk
  }

  return {
    ...defaults,
    acceptance,
    performance: perf,
    tier,
  }
}

function mapDispatcherFromConfig(config, defaults) {
  const dispatcher = asRecord(config.dispatcher)
  const byMode = asRecord(dispatcher.assignmentTimeByMode)
  const ack = asRecord(dispatcher.incidentAckSecByPriority)
  const resolve = asRecord(dispatcher.incidentResolveSecByPriority)

  const assignment = { ...asRecord(defaults.assignment) }
  setDuration(assignment, 'sameDay', byMode.sameDay, defaults.assignment)
  setDuration(assignment, 'nextDay', byMode.nextDay, defaults.assignment)
  setDuration(assignment, 'standard', byMode.standard, defaults.assignment)
  setDuration(assignment, 'economy', byMode.economy, defaults.assignment)

  const incidents = { ...asRecord(defaults.incidents) }
  setDuration(incidents, 'firstResponse', ack.P2 ?? ack.P1, defaults.incidents)
  setDuration(incidents, 'p1AllHands', ack.P1, defaults.incidents)
  setDuration(incidents, 'resolutionTime', resolve.P2 ?? resolve.P1, defaults.incidents)
  setPercent(incidents, 'resolutionRate', dispatcher.coverageTargetPct, defaults.incidents)
  setDuration(incidents, 'responseToChat', dispatcher.chatFirstResponseSec, defaults.incidents)
  setDuration(incidents, 'liveChatFirst', dispatcher.chatFirstResponseSec, defaults.incidents)
  setDuration(incidents, 'champContactNonDelivery', dispatcher.champResponseSec, defaults.incidents)
  setDuration(incidents, 'acknowledgeBreach', ack.P3, defaults.incidents)
  setDuration(incidents, 'resolutionPlan', resolve.P3, defaults.incidents)

  return {
    ...defaults,
    assignment,
    incidents,
  }
}

function weightsFromForm(hotFood) {
  const accuracy = Math.round(pctFromPercent(hotFood?.vpiAccuracy) ?? 20)
  const packing = Math.round(pctFromPercent(hotFood?.vpiPacking) ?? 5)
  const prepTime = Math.round(pctFromPercent(hotFood?.vpiPrep) ?? 25)
  const reliability = Math.max(0, 100 - accuracy - packing - prepTime)
  return { accuracy, packing, prepTime, reliability }
}

function sanitizeChampTiers(tierForm) {
  const elite = rangeToApi(tierForm?.elite, { min: 90, max: 100 })
  elite.max = 100
  const gold = rangeToApi(tierForm?.gold, { min: 80, max: 89 })
  gold.max = Math.min(gold.max, elite.min - 1)
  gold.min = Math.min(gold.min, gold.max)
  const silver = rangeToApi(tierForm?.silver, { min: 70, max: 79 })
  silver.max = Math.min(silver.max, gold.min - 1)
  silver.min = Math.min(silver.min, silver.max)
  const bronze = rangeToApi(tierForm?.bronze, { min: 60, max: 69 })
  bronze.max = Math.min(bronze.max, silver.min - 1)
  bronze.min = Math.min(bronze.min, bronze.max)
  const atRiskCap = num(tierForm?.atRisk?.amount)
  const atRiskMax = Math.max(0, Math.min(bronze.min - 1, atRiskCap == null ? bronze.min - 1 : atRiskCap))
  return {
    elite,
    gold,
    silver,
    bronze,
    atRisk: { min: 0, max: atRiskMax },
  }
}

function mapVendorToConfig(vendorValues) {
  const hotFood = asRecord(vendorValues['hot-food'])
  const dineIn = asRecord(vendorValues['dine-in'])
  const pickup = asRecord(vendorValues.pickup)
  const scheduled = asRecord(vendorValues.scheduled)
  const services = asRecord(vendorValues.services)
  const weights = weightsFromForm(hotFood)
  const acceptanceSec = secFromDuration(hotFood.acceptance)
  const prepSec = secFromDuration(hotFood.prepMax)
  const waitSec = secFromDuration(hotFood.maxChampWait)

  const scheduledPayload = {}
  Object.entries(SCHEDULED_TIER_MAP).forEach(([uiKey, apiKey]) => {
    scheduledPayload[apiKey] = mapScheduledTierToApi(scheduled[uiKey])
  })
  scheduledPayload.general = {
    attendanceDuringDayPct: pctFromPercent(asRecord(scheduled.all).reliability) ?? undefined,
  }

  return {
    schemaVersion: 2,
    acceptanceCutoffMin:
      acceptanceSec != null ? Math.round(acceptanceSec / 60) : undefined,
    prepTimeHotFoodMin: prepSec != null ? Math.round(prepSec / 60) : undefined,
    readyOnTimeTargetPct: pctFromPercent(hotFood.onTimeReady) ?? undefined,
    handoverToChampMin: waitSec != null ? Math.round(waitSec / 60) : undefined,
    vpiWeights: weights,
    vendor: {
      hotFoodOnDemand: {
        acceptanceTimeSec: acceptanceSec ?? undefined,
        champCollectionTimeSec: secFromDuration(hotFood.champCollection) ?? undefined,
        earlyOnlineHoursSec: secFromDuration(hotFood.dailyOnline) ?? undefined,
        fullDeliveryWindowStart: clockTimeFromDuration(hotFood.fullWindow?.from) ?? undefined,
        fullDeliveryWindowEnd: clockTimeFromDuration(hotFood.fullWindow?.to) ?? undefined,
        prepTimeLimitSec: prepSec ?? undefined,
        customerIssueResponseSec: secFromDuration(hotFood.vendorIssue) ?? undefined,
        orderAccuracyPct: pctFromPercent(hotFood.orderAccuracy) ?? undefined,
        orderRatingPct: pctFromPercent(hotFood.onTimeReady) ?? undefined,
        vpeWeights: {
          accuracyWeight: weights.accuracy,
          ratingWeight: weights.packing,
          prepTimeWeight: weights.prepTime,
          metricTypeWeight: weights.reliability,
        },
        foodSafetyInvestigationSec: secFromDuration(hotFood.nonDelivery) ?? undefined,
      },
      dineIn: {
        acceptanceTimeSec: secFromDuration(dineIn.acceptance) ?? undefined,
        // Keep both keys in sync so Vendor wizard tableReady inherits SLA Model edits.
        customerArrivalWaitSec: secFromDuration(dineIn.customerWait) ?? undefined,
        tablePreparationSec: secFromDuration(dineIn.customerWait) ?? undefined,
        orderAccuracyPct: pctFromPercent(dineIn.reservationHonored) ?? undefined,
        issueResponseSec: secFromDuration(dineIn.billDispute) ?? undefined,
        noShowGraceSec: secFromDuration(dineIn.reservationNotice) ?? undefined,
      },
      pickup: {
        acceptanceTimeSec: secFromDuration(pickup.acceptance) ?? undefined,
        customerWaitSec: secFromDuration(pickup.customerWait) ?? undefined,
        handoverSec: secFromDuration(pickup.maxCustomerWait) ?? undefined,
        latePickupGraceSec: secFromDuration(pickup.orderHold) ?? undefined,
        orderAccuracyPct: pctFromPercent(pickup.onTimePrep) ?? undefined,
      },
      scheduledDelivery: scheduledPayload,
      services: {
        acceptanceTimeSec: secFromDuration(services.acceptance) ?? undefined,
        serviceAttendancePct: pctFromPercent(services.attendance) ?? undefined,
        serviceRating: num(services.quality?.amount) ?? undefined,
        // Align with Vendor wizard "Service start time".
        serviceLevelAgreementSec: secFromDuration(services.providerNoShowWait) ?? undefined,
        qualityReportWindowSec: secFromDuration(services.qualityReport) ?? undefined,
        inventoryDamageReportWindowSec: secFromDuration(services.damageReport) ?? undefined,
      },
    },
  }
}

function mapChampToConfig(champValues, baseConfig) {
  const acceptance = asRecord(champValues.acceptance)
  const performance = asRecord(champValues.performance)
  const basePerf = asRecord(asRecord(baseConfig.champ).performance)
  const peakDuration = secFromDuration(performance.peakHours?.duration)
  const peakStart = basePerf.peakHoursStart || '16:00:00'
  const pickupArrival = secFromDuration(performance.pickupArrival)

  return {
    champ: {
      acceptanceTimeByMode: {
        hotFood: secFromDuration(acceptance.hotFood) ?? undefined,
        sameDay: secFromDuration(acceptance.sameDay) ?? undefined,
        nextDay: secFromDuration(acceptance.nextDay) ?? undefined,
        standard: secFromDuration(acceptance.standard) ?? undefined,
        economy: secFromDuration(acceptance.economy) ?? undefined,
        food: secFromDuration(acceptance.acceptFood) ?? undefined,
        groceryPharmacy: secFromDuration(acceptance.acceptGrocery) ?? undefined,
        flowers: secFromDuration(acceptance.acceptFlowers) ?? undefined,
        electronics: secFromDuration(acceptance.acceptElectronics) ?? undefined,
      },
      performance: {
        doubleConfirmationSec: secFromDuration(performance.doubleConfirm) ?? undefined,
        onTimeDeliveryPct: pctFromPercent(performance.onTimeDelivery) ?? undefined,
        workingHoursDailySec: secFromDuration(performance.workingHours) ?? undefined,
        peakHoursStart: peakStart,
        peakHoursEnd:
          peakDuration != null ? addSecondsToClock(peakStart, peakDuration) : undefined,
        customerRating: num(performance.customerRating?.amount) ?? undefined,
        arrivalPickupWindowCompliancePct: pctFromPercent(performance.arrivalCompliance) ?? undefined,
        orderCompletionRatePct: pctFromPercent(performance.orderCompletion) ?? undefined,
        conductCompliancePct: pctFromPercent(performance.conductCompliance) ?? undefined,
        pickupArrivalCitySec: pickupArrival ?? undefined,
        pickupArrivalSuburbSec: pickupArrival ?? undefined,
        vendorWaitFoodSec: secFromDuration(performance.vendorWaitFood) ?? undefined,
        vendorWaitGroceryPharmacySec: secFromDuration(performance.vendorWaitGrocery) ?? undefined,
        vendorWaitFlowersSec: secFromDuration(performance.vendorWaitFlowers) ?? undefined,
        vendorWaitElectronicsSec: secFromDuration(performance.vendorWaitElectronics) ?? undefined,
        customerUnreachableWaitSec: secFromDuration(performance.unreachableWait) ?? undefined,
        customerAlternativeUnreachableAttempts: num(performance.contactAttempts?.amount) ?? undefined,
        wrongOrderReportMode: WRONG_ORDER_TO_API[performance.wrongOrderReport?.option] || undefined,
        emergencyMessageOnDemandSec: secFromDuration(performance.emergencyOnDemand) ?? undefined,
        emergencyMessageScheduledSec: secFromDuration(performance.emergencyScheduled) ?? undefined,
        appGpsFailureReportMode: GPS_TO_API[performance.appGpsFailure?.option] || undefined,
        appGpsFixWindowSec: secFromDuration(performance.appGpsFixWindow) ?? undefined,
        temperatureEquipmentReturnSec: secFromDuration(performance.tempWorkaround) ?? undefined,
        champAssignmentPlatformSec: secFromDuration(performance.champAssignment) ?? undefined,
      },
      tiers: sanitizeChampTiers(champValues.tier),
    },
  }
}

function mapDispatcherToConfig(dispatcherValues) {
  const assignment = asRecord(dispatcherValues.assignment)
  const incidents = asRecord(dispatcherValues.incidents)
  const firstResponse = secFromDuration(incidents.firstResponse)
  const p1 = secFromDuration(incidents.p1AllHands)
  const resolution = secFromDuration(incidents.resolutionTime)
  const ackP3 = secFromDuration(incidents.acknowledgeBreach)
  const resolveP3 = secFromDuration(incidents.resolutionPlan)
  const chat = secFromDuration(incidents.liveChatFirst) ?? secFromDuration(incidents.responseToChat)

  return {
    dispatcher: {
      assignmentTimeByMode: {
        sameDay: secFromDuration(assignment.sameDay) ?? undefined,
        nextDay: secFromDuration(assignment.nextDay) ?? undefined,
        standard: secFromDuration(assignment.standard) ?? undefined,
        economy: secFromDuration(assignment.economy) ?? undefined,
      },
      incidentAckSecByPriority: {
        P1: p1 ?? firstResponse ?? undefined,
        P2: firstResponse ?? undefined,
        P3: ackP3 ?? undefined,
      },
      incidentResolveSecByPriority: {
        P1: resolution ?? undefined,
        P2: resolution ?? undefined,
        P3: resolveP3 ?? undefined,
      },
      coverageTargetPct: pctFromPercent(incidents.resolutionRate) ?? undefined,
      chatFirstResponseSec: chat ?? undefined,
      champResponseSec: secFromDuration(incidents.champContactNonDelivery) ?? undefined,
    },
  }
}

function pruneUndefined(value) {
  if (Array.isArray(value)) {
    return value.map(pruneUndefined)
  }
  if (!value || typeof value !== 'object') return value
  const output = {}
  Object.entries(value).forEach(([key, nested]) => {
    if (nested === undefined) return
    const cleaned = pruneUndefined(nested)
    if (cleaned === undefined) return
    if (cleaned && typeof cleaned === 'object' && !Array.isArray(cleaned) && Object.keys(cleaned).length === 0) {
      return
    }
    output[key] = cleaned
  })
  return output
}

export function pickWorkingSlaModel(models = []) {
  const list = Array.isArray(models) ? models.filter((item) => item && item.id) : []
  return (
    list.find((item) => item.isDefault && item.isActive !== false) ||
    list.find((item) => String(item.status || '').toUpperCase() === 'PUBLISHED' && item.isActive !== false) ||
    list.find((item) => item.isDefault) ||
    list.find((item) => String(item.status || '').toUpperCase() === 'PUBLISHED') ||
    list.find((item) => item.isActive !== false) ||
    list[0] ||
    null
  )
}

export function mapAdminSlaModelList(raw) {
  const source = asRecord(raw)
  const list = Array.isArray(source.models)
    ? source.models
    : Array.isArray(source.items)
      ? source.items
      : Array.isArray(source.slaModels)
        ? source.slaModels
        : Array.isArray(raw)
          ? raw
          : []

  return list
    .filter((item) => item && (item.id || item.slaModelId))
    .map((item) => mapAdminSlaModelRecord(item))
}

export function mapAdminSlaModelRecord(raw) {
  const source = asRecord(raw)
  const id = source.id || source.slaModelId
  if (!id) {
    throw new ApiError({ message: 'Invalid SLA model response from the server.' })
  }
  const config = asRecord(source.config || source.draftConfig)
  return {
    id: String(id),
    name: String(source.name || 'Platform SLA'),
    categoryLabel: source.categoryLabel || null,
    description: source.description || '',
    status: source.status || 'DRAFT',
    isDefault: Boolean(source.isDefault),
    isActive: source.isActive !== false,
    hasUnpublishedChanges: Boolean(source.hasUnpublishedChanges),
    currentVersion: num(source.currentVersion) ?? 0,
    config,
    // Live published rules for vendor inheritance (ignore unpublished draft).
    publishedConfig: asRecord(source.publishedConfig || source.config),
    draftConfig: source.draftConfig ? asRecord(source.draftConfig) : null,
    raw: source,
  }
}

export function mapAdminSlaTemplate(raw) {
  const source = asRecord(raw)
  return {
    name: source.name || '',
    categoryLabel: source.categoryLabel || 'Food & Beverage',
    description: source.description || '',
    config: asRecord(source.config),
  }
}

export function mapSlaConfigToForm(config) {
  const source = asRecord(config)
  const vendorDefaults = buildSlaDefaults(VENDOR_SLA_SECTIONS)
  const champDefaults = buildSlaDefaults(CHAMP_SLA_SECTIONS)
  const dispatcherDefaults = buildSlaDefaults(DISPATCHER_SLA_SECTIONS)

  return {
    vendorValues: mapVendorFromConfig(source, vendorDefaults),
    champValues: mapChampFromConfig(source, champDefaults),
    dispatcherValues: mapDispatcherFromConfig(source, dispatcherDefaults),
  }
}

export function mapSlaFormToConfig(vendorValues, champValues, dispatcherValues, baseConfig = {}) {
  const vendorPatch = mapVendorToConfig(vendorValues)
  const champPatch = mapChampToConfig(champValues, baseConfig)
  const dispatcherPatch = mapDispatcherToConfig(dispatcherValues)
  return pruneUndefined({
    ...vendorPatch,
    ...champPatch,
    ...dispatcherPatch,
  })
}
