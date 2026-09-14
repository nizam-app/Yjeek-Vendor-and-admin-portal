import { useApiResource } from '../useApiResource'
import { isAutomationRealApi } from '../../services/admin/dispatchAutomationFeature'
import { adminDispatchAutomationService } from '../../services/admin/dispatchAutomationService'

/**
 * Overview KPIs for Automation → Dispatch Rules header.
 */
export function useAdminDispatchOverview() {
  const enabled = isAutomationRealApi()

  const resource = useApiResource(() => {
    if (!enabled) {
      return Promise.resolve({ data: null, meta: null })
    }
    return adminDispatchAutomationService.getOverview()
  }, [enabled])

  return {
    ...resource,
    enabled,
    kpis: resource.data?.kpis ?? null,
    activeRuleSet: resource.data?.activeRuleSet ?? null,
  }
}
