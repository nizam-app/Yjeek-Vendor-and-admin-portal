import { useApiResource } from '../useApiResource'
import { branchService } from '../../services/vendor/branchService'

/**
 * Load a single Vendor branch by id.
 * EditBranch → useVendorBranch → branchService.getBranch → apiClient
 */
export function useVendorBranch(branchId) {
  const decoded = branchId ? decodeURIComponent(branchId) : ''
  return useApiResource(
    () => {
      if (!decoded) {
        return Promise.reject(Object.assign(new Error('Branch id is required.'), { status: 404 }))
      }
      return branchService.getBranch(decoded)
    },
    [decoded],
  )
}
