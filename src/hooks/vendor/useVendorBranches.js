import { useEffect } from 'react'
import { useApiResource } from '../useApiResource'
import {
  branchService,
  VENDOR_BRANCHES_UPDATED_EVENT,
} from '../../services/vendor/branchService'

/**
 * Vendor branches list hook.
 * Page/Topbar → useVendorBranches → branchService → mapper → apiClient
 * Refetches when Topbar/Branches mutate status so both stay in sync.
 */
export function useVendorBranches() {
  const resource = useApiResource(() => branchService.getBranches(), [])

  useEffect(() => {
    function onUpdated() {
      resource.refetch()
    }
    window.addEventListener(VENDOR_BRANCHES_UPDATED_EVENT, onUpdated)
    return () => window.removeEventListener(VENDOR_BRANCHES_UPDATED_EVENT, onUpdated)
  }, [resource.refetch])

  return resource
}
