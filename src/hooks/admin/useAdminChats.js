import { useApiResource } from '../useApiResource'
import { useIntervalWhenVisible } from '../useIntervalWhenVisible'
import { isAdminRealApiFeature } from '../../api/config'
import { adminDashboardService } from '../../services/admin/dashboardService'

/**
 * Admin Open chats strip.
 * Silent-polls so a customer/champ message appears without a full page refresh.
 *
 * @param {{ refreshSeconds?: number }} [options]
 */
export function useAdminChats(options = {}) {
  const useReal = isAdminRealApiFeature('dashboard')
  const refreshSeconds = options.refreshSeconds ?? 12

  const resource = useApiResource(() => {
    if (!useReal) {
      return Promise.resolve({ data: { active: 0, unreadTotal: 0, items: [] }, meta: null })
    }
    return adminDashboardService.getChats()
  }, [useReal])

  useIntervalWhenVisible(
    async () => {
      try {
        const response = await adminDashboardService.getChats()
        resource.setData(response?.data || { active: 0, unreadTotal: 0, items: [] })
      } catch {
        // Keep the last successful strip; live orders already surface API errors.
      }
    },
    Number(refreshSeconds) > 0 ? Number(refreshSeconds) * 1000 : null,
    useReal,
  )

  return resource
}
