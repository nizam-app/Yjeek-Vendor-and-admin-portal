import { apiConfig, isAdminRealApiFeature } from '../../api/config'
import { useApiResource } from '../useApiResource'
import { adminSettingsService } from '../../services/admin/settingsService'

/**
 * Admin Settings page data (GET /admin/settings + GET /admin/settings/general).
 */
export function useAdminSettings() {
  const enabled = isAdminRealApiFeature('settings') || !apiConfig.adminUseMockApi

  const resource = useApiResource(() => {
    if (!enabled) {
      return Promise.resolve({ data: null, meta: null })
    }
    return adminSettingsService.getForPage()
  }, [enabled])

  return {
    ...resource,
    enabled,
    pageData: resource.data,
  }
}
