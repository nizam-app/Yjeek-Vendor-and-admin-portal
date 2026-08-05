import { useNow } from './useNow'
import {
  formatAcceptCountdown,
  formatPrepElapsed,
  isPrepDelayed,
  resolveAcceptDeadlineMs,
  resolvePrepStartedMs,
} from '../lib/orderTimers'

/**
 * Live accept countdown + prep elapsed for a live-board order card/modal.
 */
export function useOrderTimers(order, { trackAccept = true, trackPrep = true } = {}) {
  const wantsAccept =
    trackAccept && Boolean(order?.vendorAcceptDeadline || (order?.sla != null && order.sla !== ''))
  const wantsPrep =
    trackPrep && Boolean(order?.prepStartedAt || (order?.prepTime != null && order.prepTime !== ''))
  const now = useNow(wantsAccept || wantsPrep)

  const acceptDeadlineMs = wantsAccept ? resolveAcceptDeadlineMs(order, now) : null
  const prepStartedMs = wantsPrep ? resolvePrepStartedMs(order, now) : null

  return {
    acceptCountdown: acceptDeadlineMs != null ? formatAcceptCountdown(acceptDeadlineMs, now) : null,
    prepElapsed: prepStartedMs != null ? formatPrepElapsed(prepStartedMs, now) : null,
    prepDelay:
      prepStartedMs != null
        ? isPrepDelayed(prepStartedMs, order?.estimatedReadyMin, now) || Boolean(order?.prepDelay)
        : Boolean(order?.prepDelay),
  }
}
