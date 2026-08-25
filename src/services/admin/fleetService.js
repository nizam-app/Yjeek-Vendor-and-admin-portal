import { apiClient } from '../../api/client'
import { apiConfig, isAdminRealApiFeature } from '../../api/config'
import { endpoints } from '../../api/endpoints'
import {
  mapAdminChampDetailResponse,
  mapAdminChampEarningsParams,
  mapAdminChampEarningsResponse,
  mapAdminChampSuspendRequest,
  mapAdminChampTerminateRequest,
  mapAdminCreateChampRequest,
  mapAdminCreateChampResponse,
  mapAdminChampDetailToForm,
  mapAdminUpdateChampRequest,
  mapAdminCreateSupplierRequest,
  mapAdminCreateSupplierResponse,
  mapAdminUpdateSupplierRequest,
  mapAdminUpdateSupplierResponse,
  mapAdminFleetChampsListParams,
  mapAdminFleetChampsListResponse,
  mapAdminFleetSummaryResponse,
  mapAdminFleetSuppliersListResponse,
  mapAdminSupplierDetailParams,
  mapAdminSupplierDetailResponse,
  mapAdminFleetNotifyEstimateRequest,
  mapAdminFleetNotifyEstimateResponse,
  mapAdminFleetNotifyRequest,
  mapAdminFleetNotifyResponse,
  mapAdminFleetNotifyHistoryResponse,
} from '../../mappers/admin/mapAdminFleet'
import { adminStoreTypeService } from './storeTypeService'

function useFleetRealApi() {
  return isAdminRealApiFeature('fleet') || !apiConfig.adminUseMockApi
}

/**
 * Admin Fleet Management — champs / suppliers.
 *
 * Confirmed:
 *   GET /admin/fleet/summary
 *   GET /admin/fleet/champs?search=&statusTab=&vehicle=&tier=&category=&limit=
 *   POST /admin/fleet/champs
 *   GET /admin/fleet/champs/:champId — Overview
 *   GET /admin/fleet/suppliers (for create-champ supplierId)
 *
 * Feature flag: `fleet` (also used when VITE_ADMIN_USE_MOCK_API=false)
 */
export const adminFleetService = {
  /**
   * Fleet KPI summary for Champs list header cards.
   * Confirmed: GET /admin/fleet/summary
   */
  async getFleetSummary(options = {}) {
    if (!useFleetRealApi()) {
      return { data: { stats: [], summary: {} }, meta: null }
    }

    const response = await apiClient.get(endpoints.admin.fleet.summary, {
      ...options,
      scope: 'admin',
      feature: 'fleet',
      forceReal: !apiConfig.adminUseMockApi,
    })

    return {
      data: mapAdminFleetSummaryResponse(response?.data),
      meta: response?.meta ?? null,
    }
  },

  /**
   * List champs (tabs + filters).
   * Confirmed: GET /admin/fleet/champs
   * Empty `champs: []` is valid.
   * Summary is best-effort — list still renders if summary fails.
   */
  async listChamps(filters = {}, options = {}) {
    if (!useFleetRealApi()) {
      throw new Error('Real fleet API is required to list champs.')
    }

    const params = mapAdminFleetChampsListParams(filters)
    const includeSummary = filters.includeSummary !== false

    const listPromise = apiClient.get(endpoints.admin.fleet.champs, {
      ...options,
      params,
      scope: 'admin',
      feature: 'fleet',
      forceReal: !apiConfig.adminUseMockApi,
    })

    const summaryPromise = includeSummary
      ? this.getFleetSummary(options).catch(() => ({ data: null, meta: null }))
      : Promise.resolve({ data: null, meta: null })

    const storeTypesPromise = adminStoreTypeService
      .listStoreTypesForChampForm(options)
      .catch(() => ({ data: { storeTypes: [] }, meta: null }))

    const [listResponse, summaryResult, storeTypesResult] = await Promise.all([
      listPromise,
      summaryPromise,
      storeTypesPromise,
    ])

    return {
      data: mapAdminFleetChampsListResponse(
        listResponse?.data,
        summaryResult?.data?.stats || null,
        storeTypesResult?.data?.storeTypes || [],
      ),
      meta: listResponse?.meta ?? null,
    }
  },

  /**
   * Champ Overview (profile + KPIs + controls).
   * Confirmed: GET /admin/fleet/champs/:champId
   */
  async getChamp(champId, options = {}) {
    if (!useFleetRealApi()) {
      throw new Error('Real fleet API is required to load champ detail.')
    }

    const id = String(champId || '').trim()
    if (!id) {
      throw new Error('Champ id is required.')
    }

    const response = await apiClient.get(endpoints.admin.fleet.champ(id), {
      ...options,
      scope: 'admin',
      feature: 'fleet',
      forceReal: !apiConfig.adminUseMockApi,
    })

    return {
      data: mapAdminChampDetailResponse(response?.data),
      meta: response?.meta ?? null,
    }
  },

  /**
   * Champ documents list.
   * Confirmed: GET /admin/fleet/champs/:champId/documents
   */
  async listChampDocuments(champId, options = {}) {
    if (!useFleetRealApi()) {
      throw new Error('Real fleet API is required to load champ documents.')
    }

    const id = String(champId || '').trim()
    if (!id) {
      throw new Error('Champ id is required.')
    }

    const response = await apiClient.get(endpoints.admin.fleet.champDocuments(id), {
      ...options,
      scope: 'admin',
      feature: 'fleet',
      forceReal: !apiConfig.adminUseMockApi,
    })

    return {
      data: response?.data ?? null,
      meta: response?.meta ?? null,
    }
  },

  /**
   * Suspend champ.
   * Confirmed: POST /admin/fleet/champs/:champId/suspend
   * Body: { reason, duration, note?, notifyChamp }
   * Errors: 409 when champ has an active delivery.
   */
  async suspendChamp(champId, form = {}, options = {}) {
    if (!useFleetRealApi()) {
      throw new Error('Real fleet API is required to suspend a champ.')
    }

    const id = String(champId || '').trim()
    if (!id) {
      throw new Error('Champ id is required.')
    }

    const body = mapAdminChampSuspendRequest(form)
    const response = await apiClient.post(endpoints.admin.fleet.champSuspend(id), body, {
      ...options,
      scope: 'admin',
      feature: 'fleet',
      forceReal: !apiConfig.adminUseMockApi,
    })

    return {
      data: response?.data ?? null,
      meta: response?.meta ?? null,
    }
  },

  /**
   * Unsuspend champ.
   * Confirmed: POST /admin/fleet/champs/:champId/unsuspend
   * Errors: 400 when champ is not suspended.
   */
  async unsuspendChamp(champId, options = {}) {
    if (!useFleetRealApi()) {
      throw new Error('Real fleet API is required to unsuspend a champ.')
    }

    const id = String(champId || '').trim()
    if (!id) {
      throw new Error('Champ id is required.')
    }

    const response = await apiClient.post(endpoints.admin.fleet.champUnsuspend(id), null, {
      ...options,
      scope: 'admin',
      feature: 'fleet',
      forceReal: !apiConfig.adminUseMockApi,
    })

    return {
      data: response?.data ?? null,
      meta: response?.meta ?? null,
    }
  },

  /**
   * Terminate champ (permanent / scheduled).
   * Confirmed: POST /admin/fleet/champs/:champId/terminate
   * Body: { reason, effectiveDate?, note? }
   */
  async terminateChamp(champId, form = {}, options = {}) {
    if (!useFleetRealApi()) {
      throw new Error('Real fleet API is required to terminate a champ.')
    }

    const id = String(champId || '').trim()
    if (!id) {
      throw new Error('Champ id is required.')
    }

    const body = mapAdminChampTerminateRequest(form)
    const response = await apiClient.post(endpoints.admin.fleet.champTerminate(id), body, {
      ...options,
      scope: 'admin',
      feature: 'fleet',
      forceReal: !apiConfig.adminUseMockApi,
    })

    return {
      data: response?.data ?? null,
      meta: response?.meta ?? null,
    }
  },

  /**
   * Clear outstanding POD / COD cash so the champ can go online from the driver app.
   * Confirmed: POST /admin/fleet/champs/:champId/reconcile-pod
   * Body: { note?, amount? }
   */
  async reconcileChampPod(champId, form = {}, options = {}) {
    if (!useFleetRealApi()) {
      throw new Error('Real fleet API is required to reconcile champ POD cash.')
    }

    const id = String(champId || '').trim()
    if (!id) {
      throw new Error('Champ id is required.')
    }

    const body = {}
    const note = String(form.note || '').trim()
    if (note) body.note = note
    if (form.amount != null && form.amount !== '') {
      const amount = Number(form.amount)
      if (!Number.isNaN(amount) && amount >= 0) body.amount = amount
    }

    const response = await apiClient.post(endpoints.admin.fleet.champReconcilePod(id), body, {
      ...options,
      scope: 'admin',
      feature: 'fleet',
      forceReal: !apiConfig.adminUseMockApi,
    })

    const payload = response?.data
    let data = payload ?? null
    if (payload && typeof payload === 'object') {
      try {
        data = mapAdminChampDetailResponse(payload)
      } catch {
        data = payload
      }
    }

    return {
      data,
      meta: response?.meta ?? null,
    }
  },

  /**
   * Set champ online / offline.
   * Confirmed: POST /admin/fleet/champs/:champId/online
   * Body: { online: boolean }
   * Errors: 403 POD_CASH_OUTSTANDING when outstanding POD cash must be reconciled.
   *
   * @param {string} champId
   * @param {boolean} online
   * @param {{ signal?: AbortSignal }} [options]
   */
  async setChampOnline(champId, online, options = {}) {
    if (!useFleetRealApi()) {
      throw new Error('Real fleet API is required to set champ online status.')
    }

    const id = String(champId || '').trim()
    if (!id) {
      throw new Error('Champ id is required.')
    }

    const response = await apiClient.post(
      endpoints.admin.fleet.champOnline(id),
      { online: Boolean(online) },
      {
        ...options,
        scope: 'admin',
        feature: 'fleet',
        forceReal: !apiConfig.adminUseMockApi,
      },
    )

    const payload = response?.data
    // Some responses return updated champ overview; otherwise keep raw payload.
    let data = payload ?? null
    if (payload && typeof payload === 'object') {
      try {
        data = mapAdminChampDetailResponse(payload)
      } catch {
        data = payload
      }
    }

    return {
      data,
      meta: response?.meta ?? null,
    }
  },

  /**
   * Supplier options / partners list.
   * Confirmed path: GET /admin/fleet/suppliers
   * Envelope not fully screenshot-confirmed — mapped flexibly.
   */
  async listSuppliers(options = {}) {
    if (!useFleetRealApi()) {
      return { data: { suppliers: [] }, meta: null }
    }

    const response = await apiClient.get(endpoints.admin.fleet.suppliers, {
      ...options,
      scope: 'admin',
      feature: 'fleet',
      forceReal: !apiConfig.adminUseMockApi,
    })

    return {
      data: { suppliers: mapAdminFleetSuppliersListResponse(response?.data) },
      meta: response?.meta ?? null,
    }
  },

  /**
   * Supplier detail & performance.
   * Confirmed: GET /admin/fleet/suppliers/:supplierId?from=&to=
   */
  async getSupplier(supplierId, filters = {}, options = {}) {
    if (!useFleetRealApi()) {
      throw new Error('Real fleet API is required to load supplier detail.')
    }

    const id = String(supplierId || '').trim()
    if (!id) {
      throw new Error('Supplier id is required.')
    }

    const params = mapAdminSupplierDetailParams(filters)
    const response = await apiClient.get(endpoints.admin.fleet.supplier(id), {
      ...options,
      params,
      scope: 'admin',
      feature: 'fleet',
      forceReal: !apiConfig.adminUseMockApi,
    })

    return {
      data: mapAdminSupplierDetailResponse(response?.data),
      meta: response?.meta ?? null,
    }
  },

  /**
   * Champ earnings tab.
   * Confirmed: GET /admin/fleet/champs/:champId/earnings?from=&to=&limit=
   * Empty `breakdown: []` is valid.
   */
  async getChampEarnings(champId, filters = {}, options = {}) {
    if (!useFleetRealApi()) {
      throw new Error('Real fleet API is required to load champ earnings.')
    }

    const id = String(champId || '').trim()
    if (!id) {
      throw new Error('Champ id is required.')
    }

    const params = mapAdminChampEarningsParams(filters)
    const response = await apiClient.get(endpoints.admin.fleet.champEarnings(id), {
      ...options,
      params,
      scope: 'admin',
      feature: 'fleet',
      forceReal: !apiConfig.adminUseMockApi,
    })

    return {
      data: mapAdminChampEarningsResponse(response?.data),
      meta: response?.meta ?? null,
    }
  },

  /**
   * Create supplier.
   * Confirmed: POST /admin/fleet/suppliers → 201
   */
  async createSupplier(form = {}, options = {}) {
    if (!useFleetRealApi()) {
      throw new Error('Real fleet API is required to create a supplier.')
    }

    const body = mapAdminCreateSupplierRequest(form)
    const response = await apiClient.post(endpoints.admin.fleet.suppliers, body, {
      ...options,
      scope: 'admin',
      feature: 'fleet',
      forceReal: !apiConfig.adminUseMockApi,
    })

    return {
      data: mapAdminCreateSupplierResponse(response?.data),
      meta: response?.meta ?? null,
    }
  },

  /**
   * Deactivate supplier and suspend active champs under it.
   * Confirmed: POST /admin/fleet/suppliers/:supplierId/deactivate
   */
  async deactivateSupplier(supplierId, options = {}) {
    if (!useFleetRealApi()) {
      throw new Error('Real fleet API is required to deactivate a supplier.')
    }

    const id = String(supplierId || '').trim()
    if (!id) {
      throw new Error('Supplier id is required.')
    }

    const response = await apiClient.post(endpoints.admin.fleet.supplierDeactivate(id), null, {
      ...options,
      scope: 'admin',
      feature: 'fleet',
      forceReal: !apiConfig.adminUseMockApi,
    })

    return {
      data: response?.data ?? null,
      meta: response?.meta ?? null,
    }
  },

  /**
   * Reactivate supplier and restore champs suspended by supplier deactivation.
   * Confirmed: POST /admin/fleet/suppliers/:supplierId/activate
   */
  async activateSupplier(supplierId, options = {}) {
    if (!useFleetRealApi()) {
      throw new Error('Real fleet API is required to activate a supplier.')
    }

    const id = String(supplierId || '').trim()
    if (!id) {
      throw new Error('Supplier id is required.')
    }

    const response = await apiClient.post(endpoints.admin.fleet.supplierActivate(id), null, {
      ...options,
      scope: 'admin',
      feature: 'fleet',
      forceReal: !apiConfig.adminUseMockApi,
    })

    return {
      data: response?.data ?? null,
      meta: response?.meta ?? null,
    }
  },

  /**
   * Update supplier.
   * Confirmed: PATCH /admin/fleet/suppliers/:supplierId
   * Postman sample body: { contactPerson, commissionPct }
   */
  async updateSupplier(supplierId, form = {}, options = {}) {
    if (!useFleetRealApi()) {
      throw new Error('Real fleet API is required to update a supplier.')
    }

    const id = String(supplierId || '').trim()
    if (!id) {
      throw new Error('Supplier id is required.')
    }

    const body = mapAdminUpdateSupplierRequest(form)
    const response = await apiClient.patch(endpoints.admin.fleet.supplier(id), body, {
      ...options,
      scope: 'admin',
      feature: 'fleet',
      forceReal: !apiConfig.adminUseMockApi,
    })

    return {
      data: mapAdminUpdateSupplierResponse(response?.data),
      meta: response?.meta ?? null,
    }
  },

  /**
   * Create champ.
   * Confirmed: POST /admin/fleet/champs → 201
   * Response: champ { header, kpis, profile, controls, suspension } + temporaryPassword
   */
  async createChamp(form = {}, options = {}) {
    if (!useFleetRealApi()) {
      throw new Error('Real fleet API is required to create a champ.')
    }

    const body = mapAdminCreateChampRequest(form)
    const response = await apiClient.post(endpoints.admin.fleet.champs, body, {
      ...options,
      scope: 'admin',
      feature: 'fleet',
      forceReal: !apiConfig.adminUseMockApi,
    })

    return {
      data: mapAdminCreateChampResponse(response?.data),
      meta: response?.meta ?? null,
    }
  },

  /**
   * Update champ.
   * Confirmed: PATCH /admin/fleet/champs/:champId
   */
  async updateChamp(champId, form = {}, options = {}) {
    if (!useFleetRealApi()) {
      throw new Error('Real fleet API is required to update a champ.')
    }

    const id = String(champId || '').trim()
    if (!id) {
      throw new Error('Champ id is required.')
    }

    const body = mapAdminUpdateChampRequest(form)
    const response = await apiClient.patch(endpoints.admin.fleet.champ(id), body, {
      ...options,
      scope: 'admin',
      feature: 'fleet',
      forceReal: !apiConfig.adminUseMockApi,
    })

    return {
      data: mapAdminChampDetailResponse(response?.data),
      meta: response?.meta ?? null,
    }
  },

  /**
   * Estimate notify recipients.
   * Confirmed: POST /admin/fleet/notify/estimate
   */
  async estimateNotify(form = {}, options = {}) {
    if (!useFleetRealApi()) {
      throw new Error('Real fleet API is required to estimate notify audience.')
    }

    const body = mapAdminFleetNotifyEstimateRequest(form)
    const response = await apiClient.post(endpoints.admin.fleet.notifyEstimate, body, {
      ...options,
      scope: 'admin',
      feature: 'fleet',
      forceReal: !apiConfig.adminUseMockApi,
    })

    return {
      data: mapAdminFleetNotifyEstimateResponse(response?.data),
      meta: response?.meta ?? null,
    }
  },

  /**
   * Send / schedule fleet notification.
   * Confirmed: POST /admin/fleet/notify
   */
  async sendNotify(form = {}, options = {}) {
    if (!useFleetRealApi()) {
      throw new Error('Real fleet API is required to notify champs.')
    }

    const body = mapAdminFleetNotifyRequest(form)
    const response = await apiClient.post(endpoints.admin.fleet.notify, body, {
      ...options,
      scope: 'admin',
      feature: 'fleet',
      forceReal: !apiConfig.adminUseMockApi,
    })

    return {
      data: mapAdminFleetNotifyResponse(response?.data),
      meta: response?.meta ?? null,
    }
  },

  /**
   * Notification history.
   * Confirmed: GET /admin/fleet/notify/history
   */
  async listNotifyHistory(options = {}) {
    if (!useFleetRealApi()) {
      return { data: { count: 0, rows: [] }, meta: null }
    }

    const response = await apiClient.get(endpoints.admin.fleet.notifyHistory, {
      ...options,
      scope: 'admin',
      feature: 'fleet',
      forceReal: !apiConfig.adminUseMockApi,
    })

    return {
      data: mapAdminFleetNotifyHistoryResponse(response?.data),
      meta: response?.meta ?? null,
    }
  },
}
