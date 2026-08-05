import { useMemo } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useApiResource } from '../useApiResource'
import { useVendorBranches } from './useVendorBranches'
import { resolveVendorBoardBranchId } from './resolveVendorBoardBranchId'
import { orderService } from '../../services/vendor/orderService'

/**
 * Vendor services board.
 * Services → useVendorServiceOrders → orderService.getServiceOrders → mapper → apiClient
 */
export function useVendorServiceOrders() {
  const { user } = useAuth()
  const { data: branchesData, isLoading: branchesLoading } = useVendorBranches()
  const branchId = useMemo(
    () => resolveVendorBoardBranchId(user, branchesData?.branches),
    [user, branchesData?.branches],
  )

  const resource = useApiResource(
    () => {
      if (!branchId && branchesLoading) {
        return Promise.resolve({ data: null, meta: null })
      }
      return orderService.getServiceOrders({ branchId })
    },
    [branchId, branchesLoading],
  )

  return {
    ...resource,
    isLoading: resource.isLoading || (!branchId && branchesLoading),
  }
}
