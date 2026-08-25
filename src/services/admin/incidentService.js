import { apiClient } from '../../api/client'
import { isAdminRealApiFeature } from '../../api/config'
import { endpoints } from '../../api/endpoints'
import { ApiError } from '../../api/errors'
import {
  emptyAdminIncidents,
  mapAdminIncidentDetail,
  mapAdminIncidentsResponse,
} from '../../mappers/admin/mapAdminIncidents'

/**
 * Admin incidents service.
 *
 * Confirmed:
 * - GET /admin/incidents?status=&priority=&limit=
 * - GET /admin/incidents/:incidentId
 * - POST /admin/incidents/:incidentId/resolve (also used from order take-action)
 */
export const adminIncidentService = {
  /**
   * GET /admin/incidents
   * @param {{ status?: string, priority?: string, limit?: number, signal?: AbortSignal, params?: object }} [options]
   */
  async list(options = {}) {
    const {
      status = 'all',
      priority = 'all',
      limit = 50,
      params,
      ...requestOptions
    } = options

    if (!isAdminRealApiFeature('dashboard')) {
      return { data: emptyAdminIncidents(), meta: null }
    }

    const response = await apiClient.get(endpoints.admin.incidents.list, {
      ...requestOptions,
      params: {
        status,
        priority,
        limit,
        ...params,
      },
      scope: 'admin',
      feature: 'dashboard',
    })

    return {
      data: mapAdminIncidentsResponse(response?.data),
      meta: response?.meta ?? null,
    }
  },

  /**
   * GET /admin/incidents/:incidentId
   * @param {string} incidentId
   */
  async get(incidentId, options = {}) {
    const id = String(incidentId || '').trim()
    if (!id) {
      throw new ApiError({ message: 'Incident id is required.' })
    }

    const response = await apiClient.get(endpoints.admin.incidents.detail(id), {
      ...options,
      scope: 'admin',
      feature: 'dashboard',
    })

    return {
      data: mapAdminIncidentDetail(response?.data),
      meta: response?.meta ?? null,
    }
  },

  /**
   * POST /admin/incidents/:incidentId/resolve
   * @param {string} incidentId
   * @param {{ outcome: string }} body
   */
  async resolve(incidentId, body, options = {}) {
    const id = String(incidentId || '').trim()
    if (!id) {
      throw new ApiError({ message: 'Incident id is required.' })
    }
    return apiClient.post(endpoints.admin.incidents.resolve(id), body, {
      ...options,
      scope: 'admin',
      feature: 'dashboard',
    })
  },
}
