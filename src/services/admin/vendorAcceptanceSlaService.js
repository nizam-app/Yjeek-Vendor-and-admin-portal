import { apiClient } from '../../api/client'
import { endpoints } from '../../api/endpoints'
import {
  mapAdminSlaModelList,
  pickWorkingSlaModel,
} from '../../mappers/admin/mapAdminSlaModels'
import {
  pickChampOfferWindowsFromSlaConfig,
  pickHotFoodEffectiveAcceptance,
} from '../../mappers/admin/mapDispatchAutomation'
import { automationRequestOptions } from './dispatchAutomationFeature'

/**
 * Read-only SLA effective timing for Automation display (P5D-B).
 * Uses existing GET /admin/sla-models — does not write SLA or DispatchRuleSet.
 */
export const vendorAcceptanceSlaService = {
  async getHotFoodEffective(options = {}) {
    const response = await apiClient.get(endpoints.admin.slaModels.list, {
      ...automationRequestOptions(options),
      params: { active: 'true', limit: 50, page: 1 },
    })

    const models = mapAdminSlaModelList(response?.data)
    const model = pickWorkingSlaModel(models)
    if (!model) {
      return {
        data: {
          model: null,
          hotFood: null,
          effectiveVendorAcceptance: null,
        },
        meta: response?.meta ?? null,
      }
    }

    const effective =
      model.effectiveVendorAcceptance ||
      model.raw?.effectiveVendorAcceptance ||
      null
    const hotFood = pickHotFoodEffectiveAcceptance(effective)

    return {
      data: {
        model,
        hotFood,
        effectiveVendorAcceptance: effective,
      },
      meta: response?.meta ?? null,
    }
  },

  /**
   * Champ offer TTLs for Radius Expansion (from Champ SLA acceptanceTimeByMode).
   * Read-only — edit on SLA Models → Champ. No hardcoded demo TTLs.
   */
  async getChampOfferWindows(options = {}) {
    const response = await apiClient.get(endpoints.admin.slaModels.list, {
      ...automationRequestOptions(options),
      params: { active: 'true', limit: 50, page: 1 },
    })

    const models = mapAdminSlaModelList(response?.data)
    const model = pickWorkingSlaModel(models)
    if (!model) {
      return {
        data: {
          model: null,
          hotFoodOfferSec: null,
          otherOnDemandOfferSec: null,
          source: null,
        },
        meta: response?.meta ?? null,
      }
    }

    const config = model.publishedConfig || model.config || null
    const windows = pickChampOfferWindowsFromSlaConfig(config)

    return {
      data: {
        model: {
          id: model.id,
          name: model.name,
          currentVersion: model.currentVersion,
          isDefault: model.isDefault,
        },
        ...windows,
      },
      meta: response?.meta ?? null,
    }
  },
}
