import { apiClient } from '../../api/client'
import { endpoints } from '../../api/endpoints'
import {
  deepCloneConfig,
  forceLiveEnabledFalse,
  getEditableConfig,
  mapRuleSetMeta,
  pickWorkingRuleSet,
  SIMULATE_MAX_LIMIT,
  stripForbiddenMutations,
} from '../../mappers/admin/mapDispatchAutomation'
import { automationRequestOptions } from './dispatchAutomationFeature'

/**
 * Admin Dispatch Rule Sets.
 * Feature flag: `automation`
 *
 * PATCH always sends a FULL config (see mapDispatchAutomation.js).
 */
export const adminDispatchRulesService = {
  async list(options = {}) {
    const response = await apiClient.get(endpoints.admin.dispatchRules.list, {
      ...automationRequestOptions(options),
    })
    const rows = Array.isArray(response?.data)
      ? response.data
      : Array.isArray(response?.data?.items)
        ? response.data.items
        : []
    return { data: rows, meta: response?.meta ?? null }
  },

  async getById(ruleSetId, options = {}) {
    const id = String(ruleSetId || '').trim()
    if (!id) throw new Error('Dispatch rule set id is required.')

    const response = await apiClient.get(endpoints.admin.dispatchRules.detail(id), {
      ...automationRequestOptions(options),
    })
    const rule = response?.data
    return {
      data: {
        rule,
        meta: mapRuleSetMeta(rule),
        draftConfig: getEditableConfig(rule),
      },
      meta: response?.meta ?? null,
    }
  },

  /**
   * Resolve working rule: overview.activeRuleSet preferred, else list pick.
   */
  async getWorking(options = {}) {
    let preferredId = options.preferredId || null
    if (!preferredId && options.overviewActiveId) {
      preferredId = options.overviewActiveId
    }

    if (!preferredId) {
      const listResult = await this.list(options)
      const picked = pickWorkingRuleSet(listResult.data)
      if (!picked?.id) {
        return {
          data: { rule: null, meta: null, draftConfig: null, empty: true },
          meta: listResult.meta,
        }
      }
      preferredId = picked.id
    }

    return this.getById(preferredId, options)
  },

  async getTemplate(options = {}) {
    const response = await apiClient.get(endpoints.admin.dispatchRules.template, {
      ...automationRequestOptions(options),
    })
    return {
      data: deepCloneConfig(response?.data),
      meta: response?.meta ?? null,
    }
  },

  /**
   * Create a DRAFT rule set (default platform config from template when config omitted).
   * Used when DB has zero rule sets so Automation screens can load.
   */
  async create(input = {}, options = {}) {
    const name = String(input.name || 'Platform default dispatch rules').trim()
    const body = { name }
    if (input.config && typeof input.config === 'object') {
      body.config = stripForbiddenMutations(forceLiveEnabledFalse(input.config))
    }

    const response = await apiClient.post(
      endpoints.admin.dispatchRules.list,
      body,
      automationRequestOptions(options),
    )
    const rule = response?.data
    return {
      data: {
        rule,
        meta: mapRuleSetMeta(rule),
        draftConfig: getEditableConfig(rule),
        empty: false,
      },
      meta: response?.meta ?? null,
    }
  },

  /**
   * Ensure at least one rule set exists: list → create from template if empty → return working.
   */
  async getWorkingOrCreate(options = {}) {
    const working = await this.getWorking(options)
    if (!working?.data?.empty) return working

    const template = await this.getTemplate(options)
    const created = await this.create(
      {
        name: 'Platform default dispatch rules',
        config: template.data,
      },
      options,
    )
    return created
  },

  /**
   * Save Changes — PATCH draft with FULL merged config.
   * Caller must pass fullConfig already merged via apply*Edits.
   */
  async updateDraft(ruleSetId, fullConfig, options = {}) {
    const id = String(ruleSetId || '').trim()
    if (!id) throw new Error('Dispatch rule set id is required.')
    if (!fullConfig || typeof fullConfig !== 'object') {
      throw new Error('Full dispatch config is required for PATCH.')
    }

    const config = stripForbiddenMutations(forceLiveEnabledFalse(fullConfig))
    const response = await apiClient.patch(
      endpoints.admin.dispatchRules.detail(id),
      { config },
      automationRequestOptions(options),
    )
    const rule = response?.data
    return {
      data: {
        rule,
        meta: mapRuleSetMeta(rule),
        draftConfig: getEditableConfig(rule),
      },
      meta: response?.meta ?? null,
    }
  },

  /**
   * P2C safety: always GET latest draft before applying section edits, then PATCH.
   * Prevents a stale tab from wiping another tab's recent saves.
   *
   * @param {string} ruleSetId
   * @param {(latestConfig: object, editable: object) => object} applyEdits
   * @param {object} editable
   */
  async mergeLatestAndPatch(ruleSetId, applyEdits, editable, options = {}) {
    if (typeof applyEdits !== 'function') {
      throw new Error('applyEdits function is required.')
    }
    const latest = await this.getById(ruleSetId, options)
    const base = latest.data?.draftConfig
    if (!base || typeof base !== 'object') {
      throw new Error('Latest draft config is missing.')
    }
    const fullConfig = applyEdits(base, editable)
    return this.updateDraft(ruleSetId, fullConfig, options)
  },

  /**
   * Save Automation — activate/publish current draft.
   */
  async activate(ruleSetId, note, options = {}) {
    const id = String(ruleSetId || '').trim()
    if (!id) throw new Error('Dispatch rule set id is required.')

    const body = {}
    if (note) body.note = note

    const response = await apiClient.post(
      endpoints.admin.dispatchRules.activate(id),
      body,
      automationRequestOptions(options),
    )
    const rule = response?.data
    return {
      data: {
        rule,
        meta: mapRuleSetMeta(rule),
        draftConfig: getEditableConfig(rule),
      },
      meta: response?.meta ?? null,
    }
  },

  /**
   * Side-effect-free shadow simulate. Backend max = 100.
   */
  async simulate(ruleSetId, input = {}, options = {}) {
    const id = String(ruleSetId || '').trim()
    if (!id) throw new Error('Dispatch rule set id is required.')

    const limit = Math.min(
      Math.max(Number(input.limit) || SIMULATE_MAX_LIMIT, 1),
      SIMULATE_MAX_LIMIT,
    )
    const body = { limit }
    if (Array.isArray(input.orderIds) && input.orderIds.length) {
      body.orderIds = input.orderIds.slice(0, SIMULATE_MAX_LIMIT)
    }

    const response = await apiClient.post(
      endpoints.admin.dispatchRules.simulate(id),
      body,
      automationRequestOptions(options),
    )
    return {
      data: response?.data ?? null,
      meta: response?.meta ?? null,
    }
  },
}
