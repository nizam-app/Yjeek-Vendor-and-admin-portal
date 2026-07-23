import { useAuth } from '../../context/AuthContext'
import { useApiResource } from '../useApiResource'
import { dashboardService } from '../../services/vendor/dashboardService'

/**
 * Vendor Dashboard read hook.
 * Page → useVendorDashboard → dashboardService → mapper → apiClient
 *
 * @param {{ rangeLabel?: string }} [options]
 */
export function useVendorDashboard(options = {}) {
  const { user } = useAuth()
  const rangeLabel = options.rangeLabel || 'Day'
  const branchId = user?.vendorLocationId || null

  return useApiResource(
    () =>
      dashboardService.getDashboard({
        branchId,
        rangeLabel,
      }),
    [branchId, rangeLabel],
  )
}
