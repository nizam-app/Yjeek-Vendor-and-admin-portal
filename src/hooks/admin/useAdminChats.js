import { useApiResource } from '../useApiResource'
import { isAdminRealApiFeature } from '../../api/config'
import { adminDashboardService } from '../../services/admin/dashboardService'

/**
 * Admin Open chats strip.
 * Page → useAdminChats → adminDashboardService.getChats → mapper → apiClient
 *
 * When dashboard real API is off, returns empty items (no mock padding).
 */
export function useAdminChats() {
  const useReal = isAdminRealApiFeature('dashboard')

  return useApiResource(() => {
    if (!useReal) {
      return Promise.resolve({ data: { active: 0, items: [] }, meta: null })
    }
    return adminDashboardService.getChats()
  }, [useReal])
}
