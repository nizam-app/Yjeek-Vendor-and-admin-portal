import { ApiError } from '../../api/errors'

function asStringList(value) {
  if (!Array.isArray(value)) return []
  return value.map((item) => String(item)).filter(Boolean)
}

function asIdLabelList(value) {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      if (!item.id) return null
      return {
        id: String(item.id),
        label: item.label ? String(item.label) : String(item.id),
      }
    })
    .filter(Boolean)
}

function asDurationList(value) {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      if (item.hours == null) return null
      return {
        hours: Number(item.hours),
        label: item.label ? String(item.label) : `${item.hours} hours`,
      }
    })
    .filter((item) => item && !Number.isNaN(item.hours))
}

/**
 * Map confirmed GET /admin/orders/action-options `data`.
 * @param {Record<string, unknown>|null|undefined} data
 */
export function mapAdminOrderActionOptionsResponse(data) {
  if (!data || typeof data !== 'object') {
    throw new ApiError({
      message: 'Invalid action options response from the server.',
    })
  }

  const cancelReasonsByCause = {}
  const rawByCause = data.cancelReasonsByCause && typeof data.cancelReasonsByCause === 'object'
    ? data.cancelReasonsByCause
    : {}
  for (const [cause, reasons] of Object.entries(rawByCause)) {
    cancelReasonsByCause[String(cause)] = asStringList(reasons)
  }

  return {
    redispatchReasons: asStringList(data.redispatchReasons),
    refundReasons: asStringList(data.refundReasons),
    refundDestinations: asIdLabelList(data.refundDestinations),
    reassignReasons: asStringList(data.reassignReasons),
    flagMetrics: asIdLabelList(data.flagMetrics),
    flagSeverities: asStringList(data.flagSeverities),
    flagActions: asIdLabelList(data.flagActions),
    flagReasons: asStringList(data.flagReasons),
    cancelCauses: asStringList(data.cancelCauses),
    cancelReasonsByCause,
    suspendTypes: asIdLabelList(data.suspendTypes),
    suspendDurations: asDurationList(data.suspendDurations),
    suspendReasons: asStringList(data.suspendReasons),
  }
}

/** Empty catalog when feature/mock off. */
export function emptyAdminOrderActionOptions() {
  return {
    redispatchReasons: [],
    refundReasons: [],
    refundDestinations: [],
    reassignReasons: [],
    flagMetrics: [],
    flagSeverities: [],
    flagActions: [],
    flagReasons: [],
    cancelCauses: [],
    cancelReasonsByCause: {},
    suspendTypes: [],
    suspendDurations: [],
    suspendReasons: [],
  }
}
