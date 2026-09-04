import { useApiResource } from '../useApiResource'
import { isAdminRealApiFeature } from '../../api/config'
import { adminIncidentService } from '../../services/admin/incidentService'

export function useAdminRefundApprovals(query = {}) {
  const useReal = isAdminRealApiFeature('dashboard')
  const enabled = query.enabled !== false
  const status = query.status ?? 'PENDING_APPROVAL'
  const limit = query.limit ?? 50

  return useApiResource(() => {
    if (!enabled || !useReal) {
      return Promise.resolve({ data: [], meta: null })
    }
    return adminIncidentService.listRefundApprovals({ status, limit })
  }, [useReal, enabled, status, limit])
}
