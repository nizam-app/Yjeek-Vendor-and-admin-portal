import { useMemo } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useApiResource } from '../useApiResource'
import { useVendorBranches } from './useVendorBranches'
import { resolveVendorBoardBranchId } from './resolveVendorBoardBranchId'
import { orderService } from '../../services/vendor/orderService'

/**
 * Vendor scheduled orders board.
 * Scheduled → useVendorScheduledOrders → orderService.getScheduledOrders → mapper → apiClient
 *
 * @param {{ date?: string, window?: string, sort?: string, search?: string }} [filters]
 */
export function useVendorScheduledOrders(filters = {}) {
  const { user } = useAuth()
  const { data: branchesData, isLoading: branchesLoading } = useVendorBranches()
  const branchId = useMemo(
    () => resolveVendorBoardBranchId(user, branchesData?.branches),
    [user, branchesData?.branches],
  )
  const date = filters.date || 'today'
  const window = filters.window
  const sort = filters.sort
  const search = filters.search

  const resource = useApiResource(
    () => {
      if (!branchId && branchesLoading) {
        return Promise.resolve({ data: null, meta: null })
      }
      return orderService.getScheduledOrders({
        branchId,
        date,
        window,
        sort,
        search,
      })
    },
    [branchId, branchesLoading, date, window, sort, search],
  )

  return {
    ...resource,
    isLoading: resource.isLoading || (!branchId && branchesLoading),
  }
}
