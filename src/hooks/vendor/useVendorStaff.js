import { useApiResource } from '../useApiResource'
import { staffService } from '../../services/vendor/staffService'

/**
 * Vendor staff list hook.
 * Page → useVendorStaff → staffService → mapper → apiClient
 */
export function useVendorStaff() {
  return useApiResource(() => staffService.getStaff(), [])
}
