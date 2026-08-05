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
  const status = query.status ?? 'all'
  const priority = query.priority ?? 'all'
  const limit = query.limit ?? 50

  return useApiResource(() => {
    if (!useReal) {
      return Promise.resolve({ data: emptyAdminIncidents(), meta: null })
    }
    return adminIncidentService.list({ status, priority, limit })
  }, [useReal, status, priority, limit])
}
