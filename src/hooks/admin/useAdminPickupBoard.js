import { useApiResource } from '../useApiResource'
import { adminDashboardService } from '../../services/admin/dashboardService'

/**
 * Admin Pickup board hook.
 * Page → useAdminPickupBoard → adminDashboardService.getPickupBoard → mapper → apiClient
 *
 * @param {{ limit?: number, region?: string }} [options]
 */
export function useAdminPickupBoard(options = {}) {
  const limit = options.limit ?? 5
  const region = options.region
  const bucket = options.bucket

  return useApiResource(
    () =>
      adminDashboardService.getPickupBoard({
        limit,
        region,
        ...(bucket ? { params: { bucket } } : {}),
      }),
    [limit, region, bucket],
  )
}
