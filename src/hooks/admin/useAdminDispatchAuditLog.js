import { useApiResource } from '../useApiResource'
import { isAutomationRealApi } from '../../services/admin/dispatchAutomationFeature'
import { adminDispatchAutomationService } from '../../services/admin/dispatchAutomationService'

/**
 * Audit Log — real read-only vendor acceptance + rule changes.
 */
export function useAdminDispatchAuditLog(query = {}) {
  const enabled = isAutomationRealApi()
  const section = query.section || 'all'
  const limit = query.limit ?? 100

  const resource = useApiResource(() => {
    if (!enabled) {
      return Promise.resolve({ data: null, meta: null })
    }
    return adminDispatchAutomationService.getLog({ section, limit })
  }, [enabled, section, limit])

  return {
    ...resource,
    enabled,
    catalog: resource.data,
  }
}
