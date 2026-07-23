import { useMemo } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useApiResource } from '../useApiResource'
import { useVendorBranches } from './useVendorBranches'
import { resolveVendorBoardBranchId } from './resolveVendorBoardBranchId'
import { orderService } from '../../services/vendor/orderService'

/**
 * Vendor services calendar (month grid counts).
 * Services calendar → useVendorServiceCalendar → orderService.getServiceCalendar → mapper → apiClient
 *
 * @param {{ month?: string }} [options] month as YYYY-MM
 */
export function useVendorServiceCalendar(options = {}) {
  const { user } = useAuth()
  const { data: branchesData, isLoading: branchesLoading } = useVendorBranches()
  const branchId = useMemo(
    () => resolveVendorBoardBranchId(user, branchesData?.branches),
    [user, branchesData?.branches],
  )
  const month = options.month || null

  const resource = useApiResource(
    () => {
      if (!month) {
        return Promise.resolve({ data: null, meta: null })
      }
      if (!branchId && branchesLoading) {
        return Promise.resolve({ data: null, meta: null })
      }
      return orderService.getServiceCalendar({ branchId, month })
    },
    [branchId, branchesLoading, month],
  )

  return {
    ...resource,
    isLoading: resource.isLoading || (!branchId && branchesLoading),
  }
}
