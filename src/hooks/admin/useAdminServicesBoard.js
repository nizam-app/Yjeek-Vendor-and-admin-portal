import { useApiResource } from '../useApiResource'
import { adminDashboardService } from '../../services/admin/dashboardService'

/**
 * Admin Services board hook.
 * Page → useAdminServicesBoard → adminDashboardService.getServicesBoard → mapper → apiClient
 *
 * @param {{ limit?: number, region?: string }} [options]
 */
export function useAdminServicesBoard(options = {}) {
  const limit = options.limit ?? 50
  const region = options.region

  return useApiResource(
    () =>
      adminDashboardService.getServicesBoard({
        limit,
        region,
      }),
    [limit, region],
  )
}
