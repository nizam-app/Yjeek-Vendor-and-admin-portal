import { useApiResource } from '../useApiResource'
import { branchService } from '../../services/vendor/branchService'

/**
 * Load branch menu for BranchMenu page.
 * BranchMenu → useVendorBranchMenu → branchService.getBranchMenu → apiClient
 */
export function useVendorBranchMenu(branchId) {
  const decoded = branchId ? decodeURIComponent(branchId) : ''
  return useApiResource(
    () => {
      if (!decoded) {
        return Promise.reject(Object.assign(new Error('Branch id is required.'), { status: 404 }))
      }
      return branchService.getBranchMenu(decoded)
    },
    [decoded],
  )
}
