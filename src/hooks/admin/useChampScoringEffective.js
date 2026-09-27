import { useApiResource } from '../useApiResource'
import { isAutomationRealApi } from '../../services/admin/dispatchAutomationFeature'
import { adminDispatchAutomationService } from '../../services/admin/dispatchAutomationService'

/**
 * Published SLA + DSA CPI catalog for Automation → Champ Scoring.
 */
export function useChampScoringEffective() {
  const enabled = isAutomationRealApi()

  const resource = useApiResource(() => {
    if (!enabled) {
      return Promise.resolve({ data: null, meta: null })
    }
    return adminDispatchAutomationService.getChampScoring()
  }, [enabled])

  return {
    ...resource,
    enabled,
    effective: resource.data ?? null,
  }
}
