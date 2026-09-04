import { useApiResource } from '../useApiResource'
import { isAdminRealApiFeature } from '../../api/config'
import { adminIncidentService } from '../../services/admin/incidentService'
import { emptyAdminIncidents } from '../../mappers/admin/mapAdminIncidents'

/**
 * Admin Incidents Log — List incidents.
 * Page → useAdminIncidents → adminIncidentService.list → mapper → apiClient
 *
 * Confirmed: GET /admin/incidents?status=all&priority=all&limit=50
 * When dashboard real API is off, returns empty items (no mock padding).
 */
export function useAdminIncidents(query = {}) {
  const useReal = isAdminRealApiFeature('dashboard')
  const enabled = query.enabled !== false
  const status = query.status ?? 'all'
  const priority = query.priority ?? 'all'
  const limit = query.limit ?? 50
  const orderIds = query.orderIds ?? null

  return useApiResource(() => {
    if (!enabled || !useReal) {
      return Promise.resolve({ data: emptyAdminIncidents(), meta: null })
    }
    return adminIncidentService.list({ status, priority, limit, orderIds })
  }, [useReal, enabled, status, priority, limit, orderIds])
}
