import { useApiResource } from '../useApiResource'
import { adminDashboardService } from '../../services/admin/dashboardService'

/**
 * Admin Dine-in board hook.
 * Page → useAdminDineInBoard → adminDashboardService.getDineInBoard → mapper → apiClient
 *
 * @param {{ limit?: number, region?: string }} [options]
 */
export function useAdminDineInBoard(options = {}) {
  const limit = options.limit ?? 50
  const region = options.region

  return useApiResource(
    () =>
      adminDashboardService.getDineInBoard({
        limit,
        region,
      }),
    [limit, region],
  )
}
