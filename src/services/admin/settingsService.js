import { apiClient } from '../../api/client'
import { apiConfig, isAdminRealApiFeature } from '../../api/config'
import { endpoints } from '../../api/endpoints'
import {
  mapAdminPatchGeneralRequest,
  mapAdminPatchLocalizationRequest,
  mapAdminPatchNotificationsRequest,
  mapAdminPatchSecurityRequest,
  mapAdminSettingsAll,
  mapAdminSettingsGeneral,
  mapAdminSettingsLocalization,
  mapAdminSettingsNotifications,
  mapAdminSettingsPageState,
  mapAdminSettingsSecurity,
} from '../../mappers/admin/mapAdminSettings'

function useRealSettingsApi() {
  return isAdminRealApiFeature('settings') || !apiConfig.adminUseMockApi
}

function settingsRequestOptions(options = {}) {
  return {
    ...options,
    scope: 'admin',
    feature: 'settings',
    forceReal: !apiConfig.adminUseMockApi,
  }
}

/**
 * Admin Settings.
 *
 * Confirmed:
 *   GET  /admin/settings
 *   GET/PATCH /admin/settings/general
 *   GET/PATCH /admin/settings/localization
 *   GET/PATCH /admin/settings/notifications
 *   GET/PATCH /admin/settings/security
 *
 * Feature flag: `settings` (also on when VITE_ADMIN_USE_MOCK_API=false)
 */
export const adminSettingsService = {
  async getAll(options = {}) {
    if (!useRealSettingsApi()) return { data: null, meta: null }

    const response = await apiClient.get(endpoints.admin.settings.root, settingsRequestOptions(options))
    return {
      data: mapAdminSettingsAll(response?.data),
      meta: response?.meta ?? null,
      raw: response?.data ?? null,
    }
  },

  async getGeneral(options = {}) {
    if (!useRealSettingsApi()) return { data: null, meta: null }

    const response = await apiClient.get(
      endpoints.admin.settings.general,
      settingsRequestOptions(options),
    )
    return {
      data: mapAdminSettingsGeneral(response?.data),
      meta: response?.meta ?? null,
      raw: response?.data ?? null,
    }
  },

  /**
   * Settings page bootstrap: GET all + section GETs in parallel.
   */
  async getForPage(options = {}) {
    if (!useRealSettingsApi()) return { data: null, meta: null }

    const requestOpts = settingsRequestOptions(options)
    const [allResponse, generalResponse, localizationResponse, notificationsResponse, securityResponse] =
      await Promise.all([
        apiClient.get(endpoints.admin.settings.root, requestOpts),
        apiClient.get(endpoints.admin.settings.general, requestOpts),
        apiClient.get(endpoints.admin.settings.localization, requestOpts),
        apiClient.get(endpoints.admin.settings.notifications, requestOpts),
        apiClient.get(endpoints.admin.settings.security, requestOpts),
      ])

    return {
      data: mapAdminSettingsPageState(
        allResponse?.data,
        generalResponse?.data,
        localizationResponse?.data,
        notificationsResponse?.data,
        securityResponse?.data,
        options.defaults,
      ),
      meta: allResponse?.meta ?? null,
    }
  },

  async patchGeneral(form, options = {}) {
    if (!useRealSettingsApi()) {
      throw new Error('Settings API is not enabled.')
    }

    const body = mapAdminPatchGeneralRequest(form)
    const response = await apiClient.patch(
      endpoints.admin.settings.general,
      body,
      settingsRequestOptions(options),
    )

    return {
      data: mapAdminSettingsGeneral(response?.data) || mapAdminSettingsGeneral(body),
      meta: response?.meta ?? null,
      raw: response?.data ?? null,
    }
  },

  async patchLocalization(form, options = {}) {
    if (!useRealSettingsApi()) {
      throw new Error('Settings API is not enabled.')
    }

    const body = mapAdminPatchLocalizationRequest(form)
    const response = await apiClient.patch(
      endpoints.admin.settings.localization,
      body,
      settingsRequestOptions(options),
    )

    return {
      data: mapAdminSettingsLocalization(response?.data) || mapAdminSettingsLocalization(body),
      meta: response?.meta ?? null,
      raw: response?.data ?? null,
    }
  },

  async patchNotifications(form, options = {}) {
    if (!useRealSettingsApi()) {
      throw new Error('Settings API is not enabled.')
    }

    const body = mapAdminPatchNotificationsRequest(form)
    const response = await apiClient.patch(
      endpoints.admin.settings.notifications,
      body,
      settingsRequestOptions(options),
    )

    return {
      data: mapAdminSettingsNotifications(response?.data) || mapAdminSettingsNotifications(body),
      meta: response?.meta ?? null,
      raw: response?.data ?? null,
    }
  },

  async patchSecurity(form, options = {}) {
    if (!useRealSettingsApi()) {
      throw new Error('Settings API is not enabled.')
    }

    const body = mapAdminPatchSecurityRequest(form)
    const response = await apiClient.patch(
      endpoints.admin.settings.security,
      body,
      settingsRequestOptions(options),
    )

    return {
      data: mapAdminSettingsSecurity(response?.data) || mapAdminSettingsSecurity(body),
      meta: response?.meta ?? null,
      raw: response?.data ?? null,
    }
  },

  /**
   * Save the active settings tab.
   * @param {'general'|'localization'|'notifications'|'security'} tabId
   * @param {object} form
   */
  async saveTab(tabId, form, options = {}) {
    const tab = String(tabId || '').trim().toLowerCase()
    if (tab === 'general') return this.patchGeneral(form, options)
    if (tab === 'localization') return this.patchLocalization(form, options)
    if (tab === 'notifications') return this.patchNotifications(form, options)
    if (tab === 'security') return this.patchSecurity(form, options)
    throw new Error('This settings tab cannot be saved yet.')
  },
}
