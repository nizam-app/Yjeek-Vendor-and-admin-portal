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
 */
export const adminIncidentService = {
  async list(options = {}) {
    const {
      status = 'all',
      priority = 'all',
      limit = 50,
      orderIds,
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
        ...(orderIds ? { orderIds } : {}),
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

  async startInvestigation(incidentId, options = {}) {
    const id = String(incidentId || '').trim()
    if (!id) throw new ApiError({ message: 'Incident id is required.' })
    const response = await apiClient.post(endpoints.admin.incidents.startInvestigation(id), {}, {
      ...options,
      scope: 'admin',
      feature: 'dashboard',
    })
    return { data: mapAdminIncidentDetail(response?.data), meta: response?.meta ?? null }
  },

  async requestPartyResponse(incidentId, options = {}) {
    const id = String(incidentId || '').trim()
    if (!id) throw new ApiError({ message: 'Incident id is required.' })
    const response = await apiClient.post(endpoints.admin.incidents.requestPartyResponse(id), {}, {
      ...options,
      scope: 'admin',
      feature: 'dashboard',
    })
    return { data: mapAdminIncidentDetail(response?.data), meta: response?.meta ?? null }
  },

  async escalateSeverity(incidentId, options = {}) {
    const id = String(incidentId || '').trim()
    if (!id) throw new ApiError({ message: 'Incident id is required.' })
    const response = await apiClient.post(endpoints.admin.incidents.escalateSeverity(id), {}, {
      ...options,
      scope: 'admin',
      feature: 'dashboard',
    })
    return { data: mapAdminIncidentDetail(response?.data), meta: response?.meta ?? null }
  },

  async addEvidence(incidentId, body, options = {}) {
    const id = String(incidentId || '').trim()
    if (!id) throw new ApiError({ message: 'Incident id is required.' })
    const response = await apiClient.post(endpoints.admin.incidents.addEvidence(id), body, {
      ...options,
      scope: 'admin',
      feature: 'dashboard',
    })
    return { data: mapAdminIncidentDetail(response?.data), meta: response?.meta ?? null }
  },

  async runAction(incidentId, body, options = {}) {
    const id = String(incidentId || '').trim()
    if (!id) throw new ApiError({ message: 'Incident id is required.' })
    const response = await apiClient.post(endpoints.admin.incidents.actions(id), body, {
      ...options,
      scope: 'admin',
      feature: 'dashboard',
    })
    return {
      data: response?.data ?? null,
      meta: response?.meta ?? null,
    }
  },

  async getRefundContext(incidentId, options = {}) {
    const id = String(incidentId || '').trim()
    if (!id) throw new ApiError({ message: 'Incident id is required.' })
    const response = await apiClient.get(endpoints.admin.incidents.refundContext(id), {
      ...options,
      scope: 'admin',
      feature: 'dashboard',
    })
    return { data: response?.data ?? null, meta: response?.meta ?? null }
  },

  async listRefundApprovals(options = {}) {
    const { status = 'PENDING_APPROVAL', limit = 50, ...requestOptions } = options
    const response = await apiClient.get(endpoints.admin.incidents.refundApprovals, {
      ...requestOptions,
      params: { status, limit },
      scope: 'admin',
      feature: 'dashboard',
    })
    return { data: response?.data ?? [], meta: response?.meta ?? null }
  },

  async approveRefund(approvalId, options = {}) {
    const id = String(approvalId || '').trim()
    if (!id) throw new ApiError({ message: 'Approval id is required.' })
    const response = await apiClient.post(endpoints.admin.incidents.approveRefund(id), {}, {
      ...options,
      scope: 'admin',
      feature: 'dashboard',
    })
    return { data: response?.data ?? null, meta: response?.meta ?? null }
  },

  async rejectRefund(approvalId, body, options = {}) {
    const id = String(approvalId || '').trim()
    if (!id) throw new ApiError({ message: 'Approval id is required.' })
    const response = await apiClient.post(endpoints.admin.incidents.rejectRefund(id), body, {
      ...options,
      scope: 'admin',
      feature: 'dashboard',
    })
    return { data: response?.data ?? null, meta: response?.meta ?? null }
  },

  async getResolveContext(incidentId, options = {}) {
    const id = String(incidentId || '').trim()
    if (!id) throw new ApiError({ message: 'Incident id is required.' })
    const response = await apiClient.get(endpoints.admin.incidents.resolveContext(id), {
      ...options,
      scope: 'admin',
      feature: 'dashboard',
    })
    return { data: response?.data ?? null, meta: response?.meta ?? null }
  },

  async resolveTyped(incidentId, body, options = {}) {
    const id = String(incidentId || '').trim()
    if (!id) throw new ApiError({ message: 'Incident id is required.' })
    const response = await apiClient.post(endpoints.admin.incidents.resolveTyped(id), body, {
      ...options,
      scope: 'admin',
      feature: 'dashboard',
    })
    return { data: response?.data ?? null, meta: response?.meta ?? null }
  },

  async seniorSignOff(incidentId, options = {}) {
    const id = String(incidentId || '').trim()
    if (!id) throw new ApiError({ message: 'Incident id is required.' })
    const response = await apiClient.post(endpoints.admin.incidents.seniorSignOff(id), {}, {
      ...options,
      scope: 'admin',
      feature: 'dashboard',
    })
    return { data: response?.data ?? null, meta: response?.meta ?? null }
  },
}
