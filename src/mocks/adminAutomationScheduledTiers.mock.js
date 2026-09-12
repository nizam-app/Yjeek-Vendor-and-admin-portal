import { createDuration, createOperatorNumber } from './adminAutomationDispatchRules.mock'

function createClock(h, m) {
  return {
    h: String(h).padStart(2, '0'),
    m: String(m).padStart(2, '0'),
  }
}

/** Frontend mock source for Automation → Scheduled Tiers. */

export function createScheduledTiersEditableDefaults() {
  return {
    sameDay: {
      cutoffTime: createDuration('≤', 12, 0, 0),
      batchTime: createClock(12, 0),
      assignmentKpi: createDuration('≤', 0, 30, 0),
      deliveryUpperBound: createClock(22, 0),
      doubleConfirmHours: createOperatorNumber('≥', 3),
    },
    nextDay: {
      cutoffTime: createDuration('≤', 22, 0, 0),
      batchTime: createClock(0, 0),
      assignmentKpi: createDuration('≤', 2, 0, 0),
      paymentWindowEnabled: true,
      doubleConfirmHours: createOperatorNumber('≥', 3),
    },
    standard: {
      assignmentKpi: createDuration('≤', 24, 0, 0),
      paymentWindowEnabled: true,
    },
    economy: {
      assignmentKpi: createDuration('≤', 48, 0, 0),
      paymentWindowEnabled: true,
    },
  }
}

export function getScheduledTiersMock() {
  return {
    header: {
      title: 'Scheduled Tier Configuration',
      subtitle: 'KPI windows, cutoff times, payment windows, and double-confirm rules per tier',
    },
    paymentBanner: {
      label: '5-minute payment window — scheduled + dine-in only',
      body: 'Applies to Next Day, Standard, Economy, and Dine-in. Does NOT apply to Same Day (standard after-accept flow) or on-demand (waiting screen → payment). These are distinct flows — never mix them.',
    },
    sameDay: {
      title: '⚡ Same Day',
      cutoffHint: 'noon — auto-disabled after',
      assignmentHint: 'complete by 12:30',
      deliveryHint: 'vendor open → 22:00',
      paymentNa: 'Not applicable',
      doubleConfirmUnit: 'hrs from acceptance',
    },
    nextDay: {
      title: '📅 Next Day',
      paymentToggleLabel: 'Active',
      doubleConfirmUnit: 'hrs before timeslot',
    },
    standard: {
      title: '📦 Standard',
      rollingBadge: 'Rolling — no cutoff',
      deliveryBadge: '1–3 days · vendor open → 22:00',
      assignmentHint: 'from confirmed order',
      paymentToggleLabel: 'Active',
    },
    economy: {
      title: '🗓️ Economy',
      rollingBadge: 'Rolling — no cutoff',
      deliveryBadge: '5–7 days · vendor open → 22:00',
      assignmentHint: 'from confirmed order',
      paymentToggleLabel: 'Active',
    },
    editable: createScheduledTiersEditableDefaults(),
  }
}

export function cloneScheduledTiersEditable(editable) {
  return structuredClone(editable)
}

function durationTotalSeconds(duration) {
  const h = Number.parseInt(duration?.h, 10) || 0
  const m = Number.parseInt(duration?.m, 10) || 0
  const s = Number.parseInt(duration?.s, 10) || 0
  return h * 3600 + m * 60 + s
}

function isValidClock(clock) {
  const h = Number.parseInt(clock?.h, 10)
  const m = Number.parseInt(clock?.m, 10)
  return Number.isFinite(h) && h >= 0 && h <= 23 && Number.isFinite(m) && m >= 0 && m <= 59
}

export function validateScheduledTiers(editable) {
  const { sameDay, nextDay, standard, economy } = editable || {}

  if (!isValidClock(sameDay?.batchTime) || !isValidClock(sameDay?.deliveryUpperBound)) {
    return 'Same Day batch time and delivery upper bound must be valid clock times.'
  }
  if (durationTotalSeconds(sameDay?.assignmentKpi) <= 0) {
    return 'Same Day assignment KPI must be greater than 0.'
  }
  const sameDayConfirm = Number.parseFloat(sameDay?.doubleConfirmHours?.value)
  if (!Number.isFinite(sameDayConfirm) || sameDayConfirm <= 0) {
    return 'Same Day double-confirm threshold must be greater than 0.'
  }

  if (!isValidClock(nextDay?.batchTime)) {
    return 'Next Day batch time must be a valid clock time.'
  }
  if (durationTotalSeconds(nextDay?.assignmentKpi) <= 0) {
    return 'Next Day assignment KPI must be greater than 0.'
  }
  const nextDayConfirm = Number.parseFloat(nextDay?.doubleConfirmHours?.value)
  if (!Number.isFinite(nextDayConfirm) || nextDayConfirm <= 0) {
    return 'Next Day double-confirm threshold must be greater than 0.'
  }

  if (durationTotalSeconds(standard?.assignmentKpi) <= 0) {
    return 'Standard assignment KPI must be greater than 0.'
  }
  if (durationTotalSeconds(economy?.assignmentKpi) <= 0) {
    return 'Economy assignment KPI must be greater than 0.'
  }

  return null
}
