import { useAuth } from '../../context/AuthContext'
import { useApiResource } from '../useApiResource'
import { orderService } from '../../services/vendor/orderService'

/**
 * Vendor live orders board.
 * LiveOrders → useVendorLiveOrders → orderService.getLiveOrders → mapper → apiClient
 *
 * Branch scoping matches Dashboard: only send `branchId` when the staff account
 * is bound to a location (`user.vendorLocationId`).
 *
 * Do NOT fall back to primary/first branch — that filters `vendorLocationId = X`
 * and hides orders with no branch (Dashboard Recent orders shows Branch: —).
 *
 * @param {'delivery'|'dinein'} board
 * @param {{ search?: string }} [options]
 */
export function useVendorLiveOrders(board = 'delivery', options = {}) {
  const { user } = useAuth()
  const branchId = user?.vendorLocationId || null
  const search = String(options.search || '').trim()

  return useApiResource(
    () =>
      orderService.getLiveOrders({
        board,
        branchId,
        search: search || undefined,
      }),
    [board, branchId, search],
  )
}
