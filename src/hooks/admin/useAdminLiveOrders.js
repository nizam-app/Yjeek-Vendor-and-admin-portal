import { useApiResource } from '../useApiResource'
import { useIntervalWhenVisible } from '../useIntervalWhenVisible'
import { adminDashboardService } from '../../services/admin/dashboardService'

/**
 * Admin Live Orders board hook.
 * Page → useAdminLiveOrders → adminDashboardService.getLiveOrders → mapper → apiClient
 *
 * @param {{ bucket?: string, sort?: string, limit?: number, region?: string }} [options]
 */
export function useAdminLiveOrders(options = {}) {
  const bucket = options.bucket || 'all'
  const sort = options.sort || 'time_left'
  const limit = options.limit ?? 5
  const region = options.region

  const resource = useApiResource(
    () =>
      adminDashboardService.getLiveOrders({
        bucket,
        sort,
        limit,
        region,
      }),
    [bucket, sort, limit, region],
  )

  const refreshSeconds = resource.data?.refreshIntervalSeconds

  useIntervalWhenVisible(
    () => {
      resource.refetch()
    },
    Number(refreshSeconds) > 0 ? Number(refreshSeconds) * 1000 : null,
  )

  return resource
}
