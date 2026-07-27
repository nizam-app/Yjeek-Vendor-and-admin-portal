import { useApiResource } from '../useApiResource'
import { adminDashboardService } from '../../services/admin/dashboardService'

/**
 * Admin Scheduled Orders pipeline hook.
 * Page → useAdminScheduledBoard → adminDashboardService.getScheduledBoard → mapper → apiClient
 *
 * @param {{ sort?: string, limit?: number, region?: string }} [options]
 */
export function useAdminScheduledBoard(options = {}) {
  const sort = options.sort || 'time_left'
  const limit = options.limit ?? 50
  const region = options.region

  return useApiResource(
    () =>
      adminDashboardService.getScheduledBoard({
        sort,
        limit,
        region,
      }),
    [sort, limit, region],
  )
}
