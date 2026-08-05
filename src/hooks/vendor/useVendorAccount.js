import { useApiResource } from '../useApiResource'
import { vendorProfileService } from '../../services/vendor/vendorProfileService'

/**
 * Vendor account page hook.
 * Page → useVendorAccount → vendorProfileService → mapper → apiClient
 */
export function useVendorAccount() {
  return useApiResource(() => vendorProfileService.getAccount(), [])
}
