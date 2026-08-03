import { useEffect } from 'react'
import { useApiResource } from '../useApiResource'
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

  useEffect(() => {
    if (!refreshSeconds || Number(refreshSeconds) < 1) return undefined

    const intervalId = window.setInterval(() => {
      resource.refetch()
    }, Number(refreshSeconds) * 1000)

    return () => window.clearInterval(intervalId)
  }, [refreshSeconds, resource.refetch])

  return resource
}
