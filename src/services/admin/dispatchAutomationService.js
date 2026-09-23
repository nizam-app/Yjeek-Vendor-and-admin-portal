import { apiClient } from '../../api/client'
import { endpoints } from '../../api/endpoints'
import {
  mapAuditLogResponse,
  mapOverviewToKpis,
  mapRuleSetMeta,
  SIMULATE_MAX_LIMIT,
} from '../../mappers/admin/mapDispatchAutomation'
import { getAuditLogMock } from '../../mocks/adminAutomationAuditLog.mock'
import { automationRequestOptions } from './dispatchAutomationFeature'

/**
 * Admin Dispatch Automation — overview + audit log.
 * Feature flag: `automation`
 */
export const adminDispatchAutomationService = {
  async getOverview(options = {}) {
    const timezoneOffsetMin =
      options.timezoneOffsetMin ?? -new Date().getTimezoneOffset()

    const response = await apiClient.get(endpoints.admin.dispatchAutomation.overview, {
      ...automationRequestOptions(options),
      params: { timezoneOffsetMin },
    })

    const data = response?.data ?? {}
    return {
      data: {
        raw: data,
        kpis: mapOverviewToKpis(data),
        activeRuleSet: mapRuleSetMeta(data.activeRuleSet) ?? data.activeRuleSet ?? null,
        generatedAt: data.generatedAt,
      },
      meta: response?.meta ?? null,
    }
  },

  /**
   * @param {{ section?: string, limit?: number, from?: string, to?: string }} query
   */
  async getLog(query = {}, options = {}) {
    const params = {
      section: query.section || 'all',
      limit: query.limit ?? 100,
    }
    if (query.from) params.from = query.from
    if (query.to) params.to = query.to

    const response = await apiClient.get(endpoints.admin.dispatchAutomation.log, {
      ...automationRequestOptions(options),
      params,
    })

    const shell = getAuditLogMock()
    return {
      data: mapAuditLogResponse(response?.data ?? {}, shell),
      meta: response?.meta ?? null,
    }
  },
}

export { SIMULATE_MAX_LIMIT }
