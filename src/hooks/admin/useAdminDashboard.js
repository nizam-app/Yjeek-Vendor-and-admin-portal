import { useApiResource } from '../useApiResource'
import { useIntervalWhenVisible } from '../useIntervalWhenVisible'
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

  useIntervalWhenVisible(
    () => {
      resource.refetch()
    },
    Number(refreshSeconds) > 0 ? Number(refreshSeconds) * 1000 : null,
  )

  return resource
}
