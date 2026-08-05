import { useApiResource } from '../useApiResource'
import { adminDashboardService } from '../../services/admin/dashboardService'

/**
 * Admin Dine-in board hook.
 * Page → useAdminDineInBoard → adminDashboardService.getDineInBoard → mapper → apiClient
 *
 * @param {{ limit?: number, region?: string }} [options]
 */
export function useAdminDineInBoard(options = {}) {
  const limit = options.limit ?? 5
  const region = options.region
  const bucket = options.bucket

  return useApiResource(
    () =>
      adminDashboardService.getDineInBoard({
        limit,
        region,
        ...(bucket ? { params: { bucket } } : {}),
      }),
    [limit, region, bucket],
  )
}
