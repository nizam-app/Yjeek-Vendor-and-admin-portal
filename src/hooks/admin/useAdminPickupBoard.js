import { useApiResource } from '../useApiResource'
import { adminDashboardService } from '../../services/admin/dashboardService'

/**
 * Admin Pickup board hook.
 * Page → useAdminPickupBoard → adminDashboardService.getPickupBoard → mapper → apiClient
 *
 * @param {{ limit?: number, region?: string }} [options]
 */
export function useAdminPickupBoard(options = {}) {
  const limit = options.limit ?? 50
  const region = options.region

  return useApiResource(
    () =>
      adminDashboardService.getPickupBoard({
        limit,
        region,
      }),
    [limit, region],
  )
}
