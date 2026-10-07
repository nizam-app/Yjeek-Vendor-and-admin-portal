export function slaFieldErrorId(tab, sectionId, tierId, fieldKey) {
  return ['sla-field', tab, sectionId, tierId || '_', fieldKey].join('::')
}

function durationPartsToSec(parts) {
  if (!parts || typeof parts !== 'object') return null
  const h = Number.parseInt(parts.h, 10) || 0
  const m = Number.parseInt(parts.m, 10) || 0
  const s = Number.parseInt(parts.s, 10) || 0
  return h * 3600 + m * 60 + s
}

function readTierSeconds(formTier) {
  if (!formTier || typeof formTier !== 'object') {
    return { target: 0, atRisk: 0, critical: 0 }
  }
  const target = durationPartsToSec(formTier.target) ?? durationPartsToSec(formTier) ?? 0
  const atRisk = durationPartsToSec(formTier.atRisk) ?? target
  const critical = durationPartsToSec(formTier.critical) ?? atRisk
  return { target, atRisk, critical }
}

export function validateDurationTierSeconds(target, atRisk, critical, higherIsBetter = false) {
  const issues = []
  if (!higherIsBetter) {
    if (target > atRisk) {
      issues.push({
        tierPart: 'atRisk',
        message: 'At-risk threshold must be greater than or equal to target',
      })
    }
    if (atRisk > critical) {
      issues.push({
        tierPart: 'critical',
        message: 'Critical threshold must be greater than or equal to at-risk',
      })
    }
  } else {
    if (target < atRisk) {
      issues.push({
        tierPart: 'atRisk',
        message: 'At-risk threshold must be less than or equal to target',
      })
    }
    if (atRisk < critical) {
      issues.push({
        tierPart: 'critical',
        message: 'Critical threshold must be less than or equal to at-risk',
      })
    }
  }
  return issues
}

export function validateDurationTierForm(formTier, higherIsBetter = false) {
  const { target, atRisk, critical } = readTierSeconds(formTier)
  return validateDurationTierSeconds(target, atRisk, critical, higherIsBetter)
}

export function groupSlaValidationErrors(errors) {
  const map = {}
  for (const entry of errors) {
    let row = map[entry.id]
    if (!row) {
      row = { messages: [], tiers: {} }
      map[entry.id] = row
    }
    if (!row.tiers[entry.tierPart]) {
      row.tiers[entry.tierPart] = entry.message
      row.messages.push(entry.message)
    }
  }
  return map
}
