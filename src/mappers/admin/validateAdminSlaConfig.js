import { mapSlaFormToConfig } from './mapAdminSlaModels'
import { isHigherTierOrderingApiKey } from './slaTierDirection'
import { slaFieldErrorId, validateDurationTierSeconds } from './validateAdminSlaTier'

const VENDOR_BLOCK_TO_SECTION = {
  hotFoodOnDemand: 'hot-food',
  dineIn: 'dine-in',
  pickup: 'pickup',
  scheduledDelivery: 'scheduled',
  services: 'services',
  groceries: 'groceries',
  flowers: 'flowers',
}

const API_METRIC_TO_FORM_KEY = {
  acceptanceTimeSec: 'acceptance',
  champCollectionTimeSec: 'champCollection',
  prepTimeLimitSec: 'prepMax',
  prepTimeLimitSecPickup: 'prepMax',
  earlyOnlineHoursSec: 'dailyOnline',
  customerIssueResponseSec: 'vendorIssue',
  foodSafetyInvestigationSec: 'nonDelivery',
  notifyCustomerDelaySec: 'notifyDelay',
  billQualityReviewSec: 'billQuality',
  markReadyWithinWindowSec: 'markReady',
  customerArrivalWaitSec: 'customerWait',
  tablePreparationSec: 'tablePrep',
  customerWaitSec: 'customerWait',
  handoverSec: 'maxCustomerWait',
  leadTimeForCancellationsSec: 'advanceCancel',
  latePickupGraceSec: 'orderHold',
  serviceLevelAgreementSec: 'providerNoShowWait',
  qualityReportWindowSec: 'qualityReport',
  inventoryDamageReportWindowSec: 'damageReport',
  catalogueContentUpdateSec: 'catalogueUpdate',
  accountManagerSupportResponseSec: 'accountSupport',
  customerWaitTimeSec: 'customerWait',
  maxCustomerWaitSec: 'maxCustomerWait',
}

const SCHEDULED_API_TIER = {
  sameDay: 'same-day',
  nextDay: 'next-day',
  days3to5: 'standard',
  customDay: 'economy',
}

const CHAMP_MODE_TO_FORM = {
  hotFood: 'hotFood',
  sameDay: 'sameDay',
  nextDay: 'nextDay',
  standard: 'standard',
  economy: 'economy',
  food: 'acceptFood',
  groceryPharmacy: 'acceptGrocery',
  flowers: 'acceptFlowers',
  electronics: 'acceptElectronics',
}

const DISPATCHER_MODE_TO_FORM = {
  sameDay: 'sameDay',
  nextDay: 'nextDay',
  standard: 'standard',
  economy: 'economy',
}

const DISPATCHER_INCIDENT_TO_FORM = {
  chatFirstResponseSec: 'liveChatFirst',
  champResponseSec: 'champContactNonDelivery',
  champContactTechFailureSec: 'champContactTech',
  vendorNonResponsiveProtocolSec: 'vendorNonResponsive',
  champAssignmentInterventionSec: 'champAssignmentIntervention',
  scheduledEmergencyRescheduleSec: 'scheduledEmergency',
  serviceConflictContactSec: 'serviceConflictContact',
  serviceConflictResolveSec: 'serviceConflictResolve',
  cashOutFinanceEscalationSec: 'cashOutEscalation',
}

const CHAMP_PERF_TO_FORM = {
  workingHoursDailySec: 'workingHours',
  doubleConfirmationSec: 'doubleConfirm',
  pickupArrivalCitySec: 'pickupArrival',
  vendorWaitFoodSec: 'vendorWaitFood',
  vendorWaitGroceryPharmacySec: 'vendorWaitGrocery',
  vendorWaitFlowersFashionSec: 'vendorWaitFlowers',
  vendorWaitElectronicsSec: 'vendorWaitElectronics',
  customerUnreachableWaitSec: 'unreachableWait',
  emergencyReassignOnDemandSec: 'emergencyOnDemand',
  emergencyReassignScheduledSec: 'emergencyScheduled',
  appGpsFixWindowSec: 'appGpsFixWindow',
  tempWorkaroundTechSec: 'tempWorkaround',
  champAssignmentPlatformSec: 'champAssignment',
}

function deepMerge(target, source) {
  if (!source || typeof source !== 'object' || Array.isArray(source)) return target
  const output = { ...target }
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      output[key] = deepMerge(asObject(output[key]), value)
    } else if (value !== undefined) {
      output[key] = value
    }
  }
  return output
}

function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
}

export function mergeSlaConfigForValidation(baseConfig, vendorValues, champValues, dispatcherValues) {
  const patch = mapSlaFormToConfig(vendorValues, champValues, dispatcherValues, baseConfig)
  return deepMerge(deepMerge({}, asObject(baseConfig)), patch)
}

export function mapConfigPathToFormRef(pathParts) {
  if (!pathParts?.length) return null
  const path = [...pathParts]

  if (path[0] === 'vendor' && path.length >= 3) {
    const block = path[1]
    const sectionId = VENDOR_BLOCK_TO_SECTION[block]
    if (!sectionId) return null

    if (block === 'scheduledDelivery' && path.length >= 4) {
      const tierId = SCHEDULED_API_TIER[path[2]]
      const fieldKey = API_METRIC_TO_FORM_KEY[path[3]] || path[3]
      if (!tierId) return null
      return { tab: 'vendor', sectionId, tierId, fieldKey }
    }

    if (block === 'services' && path[2] === 'leadTimeForCancellationsSec') {
      return { tab: 'vendor', sectionId: 'scheduled', tierId: 'all', fieldKey: 'advanceCancel' }
    }

    const fieldKey = API_METRIC_TO_FORM_KEY[path[2]] || path[2]
    return { tab: 'vendor', sectionId, tierId: null, fieldKey }
  }

  if (path[0] === 'champ' && path.length >= 3) {
    if (path[1] === 'acceptanceTimeByMode') {
      const fieldKey = CHAMP_MODE_TO_FORM[path[2]]
      if (!fieldKey) return null
      return { tab: 'champ', sectionId: 'acceptance', tierId: null, fieldKey }
    }
    if (path[1] === 'performance') {
      const fieldKey = CHAMP_PERF_TO_FORM[path[2]]
      if (!fieldKey) return null
      return { tab: 'champ', sectionId: 'performance', tierId: null, fieldKey }
    }
  }

  if (path[0] === 'dispatcher' && path.length >= 3) {
    if (path[1] === 'assignmentTimeByMode') {
      const fieldKey = DISPATCHER_MODE_TO_FORM[path[2]]
      if (!fieldKey) return null
      return { tab: 'dispatcher', sectionId: 'assignment', tierId: null, fieldKey }
    }
    if (path[1] === 'incidentAckSecByPriority' || path[1] === 'incidentResolveSecByPriority') {
      const priority = path[2]
      if (priority === 'P1') return { tab: 'dispatcher', sectionId: 'incidents', tierId: null, fieldKey: 'p1AllHands' }
      if (priority === 'P2') return { tab: 'dispatcher', sectionId: 'incidents', tierId: null, fieldKey: 'firstResponse' }
      if (priority === 'P3') {
        return {
          tab: 'dispatcher',
          sectionId: 'incidents',
          tierId: null,
          fieldKey: path[1] === 'incidentAckSecByPriority' ? 'acknowledgeBreach' : 'resolutionPlan',
        }
      }
      if (priority === 'P4' && path[1] === 'incidentResolveSecByPriority') {
        return { tab: 'dispatcher', sectionId: 'incidents', tierId: null, fieldKey: 'cashOutEscalation' }
      }
    }
    const incidentField = DISPATCHER_INCIDENT_TO_FORM[path[1]]
    if (incidentField) {
      return { tab: 'dispatcher', sectionId: 'incidents', tierId: null, fieldKey: incidentField }
    }
    if (path[1] === 'coverageTargetPct') {
      return { tab: 'dispatcher', sectionId: 'incidents', tierId: null, fieldKey: 'resolutionRate' }
    }
    if (path[1] === 'opsLifecycle' && path.length >= 3) {
      const OPS_FIELD_TO_FORM = {
        champDsaEvidenceReviewSec: 'champDsaEvidence',
        champDsaResponseWindowSec: 'champDsaResponse',
        fraudReviewSec: 'fraudReview',
        engFixSec: 'engFix',
        systemOutageReplySec: 'outageReply',
        systemOutageRootCauseSec: 'outageRootCause',
      }
      const fieldKey = OPS_FIELD_TO_FORM[path[2]]
      if (fieldKey) {
        return { tab: 'dispatcher', sectionId: 'ops', tierId: null, fieldKey }
      }
    }
    if (path[1] === 'vendorNonResponsiveProtocolSec') {
      return { tab: 'dispatcher', sectionId: 'incidents', tierId: null, fieldKey: 'vendorNonResponsive' }
    }
  }

  if (path[0] === 'vendor' && path[1] === 'hotFoodOnDemand' && path[2] === 'handoverToChampSec') {
    return { tab: 'vendor', sectionId: 'hot-food', tierId: null, fieldKey: 'maxChampWait' }
  }

  return null
}

function tierIssuesFromSeconds(target, atRisk, critical, higherIsBetter) {
  return validateDurationTierSeconds(target, atRisk, critical, higherIsBetter)
}

function pushTierErrors(pathParts, tierPart, message, out) {
  const ref = mapConfigPathToFormRef(pathParts)
  if (ref) {
    out.push({
      id: slaFieldErrorId(ref.tab, ref.sectionId, ref.tierId, ref.fieldKey),
      tab: ref.tab,
      sectionId: ref.sectionId,
      tierId: ref.tierId,
      fieldKey: ref.fieldKey,
      tierPart,
      message,
    })
    return
  }
  const label = pathParts.filter(Boolean).join(' · ')
  out.push({
    id: `sla-config::${pathParts.join('.')}`,
    tab: 'vendor',
    sectionId: null,
    tierId: null,
    fieldKey: null,
    tierPart,
    message: `${label}: ${message}`,
    unmapped: true,
  })
}

function walkConfigNode(node, pathParts, out) {
  if (!node || typeof node !== 'object') return
  if (Array.isArray(node)) {
    node.forEach((item, index) => walkConfigNode(item, [...pathParts, String(index)], out))
    return
  }

  if (
    typeof node.target === 'number' &&
    typeof node.atRisk === 'number' &&
    typeof node.critical === 'number'
  ) {
    const metricKey = pathParts[pathParts.length - 1] || 'metric'
    const higherIsBetter = isHigherTierOrderingApiKey(metricKey)
    const issues = tierIssuesFromSeconds(node.target, node.atRisk, node.critical, higherIsBetter)
    for (const issue of issues) {
      pushTierErrors(pathParts, issue.tierPart, issue.message, out)
    }
    return
  }

  for (const [key, value] of Object.entries(node)) {
    walkConfigNode(value, [...pathParts, key], out)
  }
}

export function validateAdminSlaMergedConfig(config) {
  const out = []
  walkConfigNode(config, [], out)
  return out
}

export function collectZodFieldErrorIssues(fieldErrors, path = [], out = []) {
  if (!fieldErrors || typeof fieldErrors !== 'object') return out
  for (const [key, value] of Object.entries(fieldErrors)) {
    if (['target', 'atRisk', 'critical'].includes(key) && Array.isArray(value)) {
      const message = value.find((item) => typeof item === 'string' && item.trim())
      if (message) out.push({ path: [...path], tierPart: key, message })
      continue
    }
    if (Array.isArray(value) && value.every((item) => typeof item === 'string')) {
      const message = value.find((item) => typeof item === 'string' && item.trim())
      if (message) out.push({ path: [...path, key], tierPart: 'critical', message })
      continue
    }
    if (value && typeof value === 'object') {
      collectZodFieldErrorIssues(value, [...path, key], out)
    }
  }
  return out
}

export function mapApiFieldErrorsToSlaValidation(fieldErrors) {
  const issues = collectZodFieldErrorIssues(fieldErrors)
  const out = []
  for (const issue of issues) {
    pushTierErrors(issue.path, issue.tierPart, issue.message, out)
  }
  return out
}

export function validateAdminSlaBeforeSave({
  vendorValues,
  champValues,
  dispatcherValues,
  baseConfig = {},
}) {
  const merged = mergeSlaConfigForValidation(baseConfig, vendorValues, champValues, dispatcherValues)
  const configErrors = validateAdminSlaMergedConfig(merged)
  return configErrors
}
