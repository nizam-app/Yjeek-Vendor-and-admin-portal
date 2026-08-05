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
 */
export function useVendorLiveOrders(board = 'delivery') {
  const { user } = useAuth()
  const branchId = user?.vendorLocationId || null

  return useApiResource(
    () =>
      orderService.getLiveOrders({
        board,
        branchId,
      }),
    [board, branchId],
  )
}
