import { apiClient } from '../../api/client'
import { endpoints } from '../../api/endpoints'
import {
  mapFleetChampsToPodRows,
  mapPodSettingsFromApi,
  mapPodSettingsToApiPatch,
  validatePodPlatformSettings,
} from '../../mappers/admin/mapAdminPodAutomation'
import { automationRequestOptions } from './dispatchAutomationFeature'

/**
 * Automation → Pay on Delivery real APIs (Fleet + SystemConfig).
 * Does NOT call DispatchRuleSet.
 */
export const adminPodAutomationService = {
  async loadPage(options = {}) {
    const requestOpts = automationRequestOptions({ ...options, forceReal: true })
    const [settingsResponse, champsResponse] = await Promise.all([
      apiClient.get(endpoints.admin.settings.root, requestOpts),
      apiClient.get(endpoints.admin.fleet.champs, {
        ...requestOpts,
        params: { limit: 100, page: 1, statusTab: 'all' },
      }),
    ])

    const settingsRaw = settingsResponse?.data ?? null
    const settings = mapPodSettingsFromApi(settingsRaw)
    const champs = mapFleetChampsToPodRows(champsResponse?.data, settings)

    return {
      settings,
      champs,
      settingsRaw,
      champsRaw: champsResponse?.data ?? null,
      meta: {
        settings: settingsResponse?.meta ?? null,
        champs: champsResponse?.meta ?? null,
      },
    }
  },

  async saveGlobalSettings(editable, options = {}) {
    const patch = mapPodSettingsToApiPatch(editable)
    const error = validatePodPlatformSettings(patch.pod)
    if (error) throw new Error(error)

    const response = await apiClient.patch(
      endpoints.admin.settings.root,
      patch,
      automationRequestOptions({ ...options, forceReal: true }),
    )
    return {
      settings: mapPodSettingsFromApi(response?.data),
      raw: response?.data ?? null,
      meta: response?.meta ?? null,
    }
  },

  async setChampPodEnabled(champId, podEnabled, options = {}) {
    const id = String(champId || '').trim()
    if (!id) throw new Error('Champ id is required.')
    const response = await apiClient.patch(
      endpoints.admin.fleet.champ(id),
      { podEnabled: Boolean(podEnabled) },
      automationRequestOptions({ ...options, forceReal: true }),
    )
    return { data: response?.data ?? null, meta: response?.meta ?? null }
  },

  async setChampPodMaxFloat(champId, podMaxFloat, options = {}) {
    const id = String(champId || '').trim()
    if (!id) throw new Error('Champ id is required.')
    const max = Number(podMaxFloat)
    if (!Number.isFinite(max) || max < 0) {
      throw new Error('Max float must be a non-negative number.')
    }
    const response = await apiClient.patch(
      endpoints.admin.fleet.champ(id),
      { podMaxFloat: max },
      automationRequestOptions({ ...options, forceReal: true }),
    )
    return { data: response?.data ?? null, meta: response?.meta ?? null }
  },

  /** Full reconciliation only — amount is audit metadata when provided. */
  async reconcileChampPodFull(champId, { note } = {}, options = {}) {
    const id = String(champId || '').trim()
    if (!id) throw new Error('Champ id is required.')
    const body = {}
    const trimmed = String(note || '').trim()
    if (trimmed) body.note = trimmed
    const response = await apiClient.post(
      endpoints.admin.fleet.champReconcilePod(id),
      body,
      automationRequestOptions({ ...options, forceReal: true }),
    )
    return { data: response?.data ?? null, meta: response?.meta ?? null }
  },
}
