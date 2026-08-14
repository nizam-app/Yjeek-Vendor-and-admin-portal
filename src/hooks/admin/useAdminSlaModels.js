import { apiConfig, isAdminRealApiFeature } from '../../api/config'
import { useApiResource } from '../useApiResource'
import { adminSlaModelsService } from '../../services/admin/slaModelsService'

/**
 * Admin SLA Models page bootstrap (template + list + working model).
 */
export function useAdminSlaModels() {
  const enabled = isAdminRealApiFeature('sla-models') || !apiConfig.adminUseMockApi

  const resource = useApiResource(() => {
    if (!enabled) {
      return Promise.resolve({ data: null, meta: null })
    }
    return adminSlaModelsService.getForPage()
  }, [enabled])

  return {
    ...resource,
    enabled,
    pageData: resource.data,
  }
}
