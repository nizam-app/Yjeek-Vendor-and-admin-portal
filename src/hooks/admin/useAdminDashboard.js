import { useEffect } from 'react'
import { useApiResource } from '../useApiResource'
import { adminDashboardService } from '../../services/admin/dashboardService'

/**
 * Admin Full Overview dashboard hook.
 * Page → useAdminDashboard → adminDashboardService → mapper → apiClient
 *
 * @param {{ region?: string }} [options]
 */
export function useAdminDashboard(options = {}) {
  const region = options.region || 'BH'

  const resource = useApiResource(
    () => adminDashboardService.getDashboard({ region }),
    [region],
  )

  const refreshSeconds = resource.data?.autoRefreshSeconds

  useEffect(() => {
    if (!refreshSeconds || Number(refreshSeconds) < 1) return undefined

    const intervalId = window.setInterval(() => {
      resource.refetch()
    }, Number(refreshSeconds) * 1000)

    return () => window.clearInterval(intervalId)
  }, [refreshSeconds, resource.refetch])

  return resource
}
