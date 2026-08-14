import { apiClient } from '../../api/client'
import { isAdminRealApiFeature } from '../../api/config'
import { endpoints } from '../../api/endpoints'
import {
  mapAdminForceCloseRequest,
  mapAdminReopenRequest,
  mapAdminUpdateVendorStoreRequest,
  mapAdminVendorDetailResponse,
  mapAdminVendorsListResponse,
  mapAdminVendorsStatusQuery,
} from '../../mappers/admin/mapAdminVendors'
import { mapAdminCreateVendorRequest } from '../../mappers/admin/mapAdminCreateVendor'
import { mapAdminStoreTypesResponse } from '../../mappers/admin/mapAdminStoreTypes'
import {
  mapAdminCreateBranchRequest,
  mapAdminUpdateBranchRequest,
  mapAdminVendorBranchesResponse,
} from '../../mappers/admin/mapAdminVendorBranches'
import {
  mapAdminCreateStaffRequest,
  mapAdminUpdateStaffRequest,
  mapAdminVendorStaffResponse,
} from '../../mappers/admin/mapAdminVendorStaff'
import {
  mapAdminDeliveryZonesResponse,
  mapAdminUpdateDeliveryZonesRequest,
} from '../../mappers/admin/mapAdminVendorDeliveryZones'
import {
  mapAdminUpdateVendorCommissionRequest,
  mapAdminVendorCommissionResponse,
  mapAdminWizardCommissionRequest,
} from '../../mappers/admin/mapAdminVendorCommission'
import {
  emptyAdminVendorPromotions,
  mapAdminCreateVendorPromotionRequest,
  mapAdminUpdateVendorPromotionRequest,
  mapAdminVendorPromotionItem,
  mapAdminVendorPromotionsResponse,
} from '../../mappers/admin/mapAdminVendorPromotions'
import {
  mapAdminUpdateVendorSlaRequest,
  mapAdminVendorSlaResponse,
} from '../../mappers/admin/mapAdminVendorSla'

/**
 * Admin vendors service.
 *
 * Confirmed:
 *   GET /admin/vendors?search=&status=all&category=&limit=&page=&sort=newest
 *   POST /admin/vendors
 *   POST /admin/vendors/:vendorId/activate
 *   GET /admin/vendors/:vendorId
 *   GET /admin/store-types
 *   GET /admin/sla-models
 *   POST /admin/vendors/:vendorId/force-close
 *   POST /admin/vendors/:vendorId/reopen
 *   POST /admin/vendors/:vendorId/suspend
 *   POST /admin/vendors/:vendorId/unsuspend
 *   GET/POST /admin/vendors/:vendorId/branches
 *   PATCH/DELETE /admin/vendors/:vendorId/branches/:branchId
 *   GET/POST /admin/vendors/:vendorId/staff
 *   GET/PATCH /admin/vendors/:vendorId/delivery-zones
 *   POST /admin/vendors/:vendorId/delivery-zones/apply-all
 *   GET/PATCH /admin/vendors/:vendorId/commission
 *   GET/POST /admin/vendors/:vendorId/promotions
 *   GET/PATCH/DELETE /admin/vendors/:vendorId/promotions/:promotionId
 *   GET/PATCH /admin/vendors/:vendorId/sla
 *
 * Feature flag: `vendors` in VITE_ADMIN_REAL_API_FEATURES.
 * Falls back to mock management payload when the feature is not enabled.
 */
export const adminVendorService = {
  /**
   * List vendors with KPIs + filters (Vendor Management page).
   * @param {{
   *   search?: string,
   *   status?: string,
   *   category?: string,
   *   limit?: number,
   *   page?: number,
   *   sort?: string,
   *   params?: object,
   *   signal?: AbortSignal,
   * }} [options]
   */
  async listVendors(options = {}) {
    const {
      search = '',
      status = 'All',
      category = '',
      limit = 20,
      page = 1,
      sort = 'newest',
      params,
      ...requestOptions
    } = options

    if (!isAdminRealApiFeature('vendors')) {
      return apiClient.get('/admin/management', {
        ...requestOptions,
        params: { type: 'vendors', ...(params || {}) },
        scope: 'admin',
      })
    }

    const query = {
      search: String(search || '').trim(),
      status: mapAdminVendorsStatusQuery(status),
      category: String(category || '').trim(),
      limit,
      page: page != null ? Number(page) || 1 : 1,
      sort: String(sort || 'newest').trim() || 'newest',
      ...(params || {}),
    }

    const response = await apiClient.get(endpoints.admin.vendors.list, {
      ...requestOptions,
      params: query,
      scope: 'admin',
      feature: 'vendors',
    })

    return {
      data: mapAdminVendorsListResponse(response?.data),
      meta: response?.meta ?? null,
    }
  },

  /**
   * Vendor detail Overview (header, KPIs, store profile, controls).
   * Nested tabs need separate list APIs — not padded with mock rows.
   *
   * @param {string} vendorId
   * @param {{ params?: object, signal?: AbortSignal }} [options]
   */
  async getVendorDetail(vendorId, options = {}) {
    const id = String(vendorId || '').trim()
    if (!id) {
      throw new Error('Vendor id is required.')
    }

    if (!isAdminRealApiFeature('vendors')) {
      return apiClient.get('/admin/vendors/detail', {
        ...options,
        params: { ...(options.params || {}), id },
        scope: 'admin',
      })
    }

    const response = await apiClient.get(endpoints.admin.vendors.detail(id), {
      ...options,
      scope: 'admin',
      feature: 'vendors',
    })

    return {
      data: mapAdminVendorDetailResponse(response?.data),
      meta: response?.meta ?? null,
    }
  },

  /**
   * Create vendor (Add vendor wizard).
   * Confirmed: POST /admin/vendors
   * Confirmed conflict: 409 CONFLICT when owner email/phone exists.
   *
   * @param {object} wizard — { form, branches, users, customFees, commissionTiers, serviceModes, activate }
   * @param {{ signal?: AbortSignal }} [options]
   */
  async createVendor(wizard = {}, options = {}) {
    if (!isAdminRealApiFeature('vendors')) {
      throw new Error('Real vendors API is required to create a vendor.')
    }

    const body = mapAdminCreateVendorRequest(wizard)

    const response = await apiClient.post(endpoints.admin.vendors.create, body, {
      ...options,
      scope: 'admin',
      feature: 'vendors',
    })

    const raw = response?.data
    const id =
      raw?.id ||
      raw?.vendorId ||
      raw?.vendor?.id ||
      null

    return {
      data: {
        id: id != null ? String(id) : null,
        raw,
      },
      meta: response?.meta ?? null,
    }
  },

  /**
   * Activate draft vendor.
   * Confirmed: POST /admin/vendors/:vendorId/activate { activate: true }
   */
  async activateVendor(vendorId, options = {}) {
    const id = String(vendorId || '').trim()
    if (!id) {
      throw new Error('Vendor id is required.')
    }

    if (!isAdminRealApiFeature('vendors')) {
      throw new Error('Real vendors API is required to activate a vendor.')
    }

    const response = await apiClient.post(
      endpoints.admin.vendors.activate(id),
      { activate: true },
      {
        ...options,
        scope: 'admin',
        feature: 'vendors',
      },
    )

    return {
      data: response?.data ?? null,
      meta: response?.meta ?? null,
    }
  },

  /**
   * List SLA models for Add vendor picker.
   * Confirmed path: GET /admin/sla-models
   */
  async listSlaModels(options = {}) {
    const { search = '', active = 'all', status = 'PUBLISHED', limit = 50, page = 1, ...requestOptions } =
      options

    if (!isAdminRealApiFeature('vendors')) {
      return { data: { slaModels: [], count: 0 }, meta: null }
    }

    const response = await apiClient.get(endpoints.admin.slaModels.list, {
      ...requestOptions,
      params: {
        search: String(search || '').trim(),
        active,
        status,
        limit,
        page,
      },
      scope: 'admin',
      feature: 'vendors',
    })

    const raw = response?.data
    const list = Array.isArray(raw?.models)
      ? raw.models
      : Array.isArray(raw?.items)
        ? raw.items
        : Array.isArray(raw?.slaModels)
          ? raw.slaModels
          : Array.isArray(raw)
            ? raw
            : []

    const slaModels = list
      .filter((item) => item && (item.id || item.slaModelId))
      .map((item) => ({
        id: String(item.id || item.slaModelId),
        name: String(item.name || item.title || item.id),
        categoryLabel: item.categoryLabel || null,
        isDefault: Boolean(item.isDefault),
      }))

    return {
      data: { slaModels, count: slaModels.length },
      meta: response?.meta ?? null,
    }
  },

  /**
   * Update vendor store info.
   * Confirmed PATCH body sample: area, logoUrl, coverUrl, cuisineTags, storeTypeId.
   * Live API also accepts name, legalName, description.
   *
   * @param {string} vendorId
   * @param {object} form
   * @param {{ signal?: AbortSignal }} [options]
   */
  async updateVendor(vendorId, form = {}, options = {}) {
    const id = String(vendorId || '').trim()
    if (!id) {
      throw new Error('Vendor id is required.')
    }

    const body = mapAdminUpdateVendorStoreRequest(form)

    if (!isAdminRealApiFeature('vendors')) {
      throw new Error('Real vendors API is required to update store info.')
    }

    const response = await apiClient.patch(endpoints.admin.vendors.detail(id), body, {
      ...options,
      scope: 'admin',
      feature: 'vendors',
    })

    return {
      data: mapAdminVendorDetailResponse(response?.data),
      meta: response?.meta ?? null,
    }
  },

  /**
   * List store types for Store type dropdown.
   * Confirmed: GET /admin/store-types → { storeTypes[] }
   *
   * @param {{ signal?: AbortSignal }} [options]
   */
  async listStoreTypes(options = {}) {
    if (!isAdminRealApiFeature('vendors')) {
      return { data: { total: 0, storeTypes: [] }, meta: null }
    }

    const response = await apiClient.get(endpoints.admin.storeTypes.list, {
      ...options,
      scope: 'admin',
      feature: 'vendors',
      params: { limit: 50, ...(options.params || {}) },
    })

    return {
      data: mapAdminStoreTypesResponse(response?.data),
      meta: response?.meta ?? null,
    }
  },

  /**
   * Force-close whole store.
   * Confirmed body: { scope: "whole_store", reason, to }
   *
   * @param {string} vendorId
   * @param {{ scope?: string, reason?: string, to?: string, from?: string, note?: string, branch?: string }} form
   * @param {{ signal?: AbortSignal }} [options]
   */
  async forceCloseVendor(vendorId, form = {}, options = {}) {
    const id = String(vendorId || '').trim()
    if (!id) {
      throw new Error('Vendor id is required.')
    }

    const body = mapAdminForceCloseRequest(form)

    if (!isAdminRealApiFeature('vendors')) {
      return {
        data: {
          forceClosed: true,
          forceClosedUntil: body.to,
          forceClosedReason: body.reason,
          status: 'Force-closed',
          storeOnline: false,
          storeOnlineHint: 'Hidden from customers',
        },
        meta: null,
      }
    }

    const response = await apiClient.post(endpoints.admin.vendors.forceClose(id), body, {
      ...options,
      scope: 'admin',
      feature: 'vendors',
    })

    return {
      data: mapAdminVendorDetailResponse(response?.data),
      meta: response?.meta ?? null,
    }
  },

  /**
   * Reopen a force-closed store or branch.
   * Body: { scope: "whole_store" } | { scope: "single_branch", branchId }
   *
   * @param {string} vendorId
   * @param {{ scope?: string, branchId?: string }} [form]
   * @param {{ signal?: AbortSignal }} [options]
   */
  async reopenVendor(vendorId, form = {}, options = {}) {
    const id = String(vendorId || '').trim()
    if (!id) {
      throw new Error('Vendor id is required.')
    }

    const body = mapAdminReopenRequest(form)

    if (!isAdminRealApiFeature('vendors')) {
      return {
        data: {
          forceClosed: false,
          forceClosedUntil: null,
          forceClosedReason: null,
          forceClosedNote: null,
          status: 'Active',
          storeOnline: true,
          storeOnlineHint: 'Visible & accepting orders',
        },
        meta: null,
      }
    }

    const response = await apiClient.post(endpoints.admin.vendors.reopen(id), body, {
      ...options,
      scope: 'admin',
      feature: 'vendors',
    })

    return {
      data: mapAdminVendorDetailResponse(response?.data),
      meta: response?.meta ?? null,
    }
  },

  /**
   * Suspend vendor.
   * Confirmed body: { reason }
   *
   * @param {string} vendorId
   * @param {{ reason?: string }} form
   * @param {{ signal?: AbortSignal }} [options]
   */
  async suspendVendor(vendorId, form = {}, options = {}) {
    const id = String(vendorId || '').trim()
    if (!id) {
      throw new Error('Vendor id is required.')
    }

    const reason = String(form.reason || '').trim()
    if (!reason) {
      throw new Error('Suspend reason is required.')
    }

    const body = { reason }

    if (!isAdminRealApiFeature('vendors')) {
      return {
        data: {
          status: 'Suspended',
          accountStatus: 'SUSPENDED',
          storeOnline: false,
          storeOnlineHint: 'Hidden from customers',
          forceClosed: false,
        },
        meta: null,
      }
    }

    const response = await apiClient.post(endpoints.admin.vendors.suspend(id), body, {
      ...options,
      scope: 'admin',
      feature: 'vendors',
    })

    return {
      data: mapAdminVendorDetailResponse(response?.data),
      meta: response?.meta ?? null,
    }
  },

  /**
   * Unsuspend vendor.
   * Confirmed: no request body.
   *
   * @param {string} vendorId
   * @param {{ signal?: AbortSignal }} [options]
   */
  async unsuspendVendor(vendorId, options = {}) {
    const id = String(vendorId || '').trim()
    if (!id) {
      throw new Error('Vendor id is required.')
    }

    if (!isAdminRealApiFeature('vendors')) {
      return {
        data: {
          status: 'Active',
          accountStatus: 'ACTIVE',
          storeOnline: true,
          storeOnlineHint: 'Visible & accepting orders',
          forceClosed: false,
        },
        meta: null,
      }
    }

    const response = await apiClient.post(endpoints.admin.vendors.unsuspend(id), null, {
      ...options,
      scope: 'admin',
      feature: 'vendors',
    })

    return {
      data: mapAdminVendorDetailResponse(response?.data),
      meta: response?.meta ?? null,
    }
  },

  /**
   * List vendor branches.
   * Confirmed shape: { count, branches[] }
   *
   * @param {string} vendorId
   * @param {{ signal?: AbortSignal }} [options]
   */
  async listBranches(vendorId, options = {}) {
    const id = String(vendorId || '').trim()
    if (!id) {
      throw new Error('Vendor id is required.')
    }

    if (!isAdminRealApiFeature('vendors')) {
      return { data: { count: 0, branches: [] }, meta: null }
    }

    const response = await apiClient.get(endpoints.admin.vendors.branches(id), {
      ...options,
      scope: 'admin',
      feature: 'vendors',
    })

    return {
      data: mapAdminVendorBranchesResponse(response?.data),
      meta: response?.meta ?? null,
    }
  },

  /**
   * Create branch.
   * Confirmed body: { name, area, address, phone?, latitude, longitude }
   * Response: { count, branches[] }
   *
   * @param {string} vendorId
   * @param {object} form
   * @param {{ signal?: AbortSignal }} [options]
   */
  async createBranch(vendorId, form = {}, options = {}) {
    const id = String(vendorId || '').trim()
    if (!id) {
      throw new Error('Vendor id is required.')
    }

    const body = mapAdminCreateBranchRequest(form)

    if (!isAdminRealApiFeature('vendors')) {
      throw new Error('Real vendors API is required to create a branch.')
    }

    const response = await apiClient.post(endpoints.admin.vendors.branches(id), body, {
      ...options,
      scope: 'admin',
      feature: 'vendors',
    })

    return {
      data: mapAdminVendorBranchesResponse(response?.data),
      meta: response?.meta ?? null,
    }
  },

  /**
   * Update branch (partial PATCH).
   * Confirmed sample body: { etaMin }. Response: { count, branches[] }.
   *
   * @param {string} vendorId
   * @param {string} branchId
   * @param {object} form
   * @param {{ signal?: AbortSignal }} [options]
   */
  async updateBranch(vendorId, branchId, form = {}, options = {}) {
    const vid = String(vendorId || '').trim()
    const bid = String(branchId || '').trim()
    if (!vid || !bid) {
      throw new Error('Vendor id and branch id are required.')
    }

    const body = mapAdminUpdateBranchRequest(form)

    if (!isAdminRealApiFeature('vendors')) {
      throw new Error('Real vendors API is required to update a branch.')
    }

    const response = await apiClient.patch(endpoints.admin.vendors.branch(vid, bid), body, {
      ...options,
      scope: 'admin',
      feature: 'vendors',
    })

    return {
      data: mapAdminVendorBranchesResponse(response?.data),
      meta: response?.meta ?? null,
    }
  },

  /**
   * Delete branch.
   * Confirmed: DELETE /admin/vendors/:vendorId/branches/:branchId (no body).
   *
   * @param {string} vendorId
   * @param {string} branchId
   * @param {{ signal?: AbortSignal }} [options]
   */
  async deleteBranch(vendorId, branchId, options = {}) {
    const vid = String(vendorId || '').trim()
    const bid = String(branchId || '').trim()
    if (!vid || !bid) {
      throw new Error('Vendor id and branch id are required.')
    }

    if (!isAdminRealApiFeature('vendors')) {
      throw new Error('Real vendors API is required to delete a branch.')
    }

    const response = await apiClient.delete(endpoints.admin.vendors.branch(vid, bid), {
      ...options,
      scope: 'admin',
      feature: 'vendors',
    })

    return {
      data: response?.data ?? null,
      meta: response?.meta ?? null,
    }
  },

  /**
   * List staff (incl. owner).
   * Confirmed: GET /admin/vendors/:vendorId/staff → { count, users[] }
   *
   * @param {string} vendorId
   * @param {{ signal?: AbortSignal }} [options]
   */
  async listStaff(vendorId, options = {}) {
    const id = String(vendorId || '').trim()
    if (!id) {
      throw new Error('Vendor id is required.')
    }

    if (!isAdminRealApiFeature('vendors')) {
      return { data: { count: 0, users: [] }, meta: null }
    }

    const response = await apiClient.get(endpoints.admin.vendors.staff(id), {
      ...options,
      scope: 'admin',
      feature: 'vendors',
    })

    return {
      data: mapAdminVendorStaffResponse(response?.data),
      meta: response?.meta ?? null,
    }
  },

  /**
   * Create staff.
   * Confirmed body: displayName, email, phone, countryCode, password, role, vendorLocationId?
   * Response: { count, users[] }
   *
   * @param {string} vendorId
   * @param {object} form
   * @param {Array<{id:string,name?:string}>} [branchOptions]
   * @param {{ signal?: AbortSignal }} [options]
   */
  async createStaff(vendorId, form = {}, branchOptions = [], options = {}) {
    const id = String(vendorId || '').trim()
    if (!id) {
      throw new Error('Vendor id is required.')
    }

    const body = mapAdminCreateStaffRequest(form, branchOptions)

    if (!isAdminRealApiFeature('vendors')) {
      throw new Error('Real vendors API is required to create staff.')
    }

    const response = await apiClient.post(endpoints.admin.vendors.staff(id), body, {
      ...options,
      scope: 'admin',
      feature: 'vendors',
    })

    return {
      data: mapAdminVendorStaffResponse(response?.data),
      meta: response?.meta ?? null,
    }
  },

  /**
   * Update staff member.
   * Confirmed: PATCH /admin/vendors/:vendorId/staff/:staffId
   */
  async updateStaff(vendorId, staffId, form = {}, branchOptions = [], options = {}) {
    const id = String(vendorId || '').trim()
    const memberId = String(staffId || '').trim()
    if (!id) throw new Error('Vendor id is required.')
    if (!memberId) throw new Error('Staff id is required.')

    const body = mapAdminUpdateStaffRequest(form, branchOptions)

    if (!isAdminRealApiFeature('vendors')) {
      throw new Error('Real vendors API is required to update staff.')
    }

    const response = await apiClient.patch(endpoints.admin.vendors.staffMember(id, memberId), body, {
      ...options,
      scope: 'admin',
      feature: 'vendors',
    })

    if (response?.data?.users || response?.data?.count != null) {
      return {
        data: mapAdminVendorStaffResponse(response.data),
        meta: response?.meta ?? null,
      }
    }

    return {
      data: response?.data ?? null,
      meta: response?.meta ?? null,
    }
  },

  /**
   * Get delivery zones (defaults + per-branch + coverage).
   * Confirmed: GET /admin/vendors/:vendorId/delivery-zones
   *
   * @param {string} vendorId
   * @param {{ signal?: AbortSignal }} [options]
   */
  async getDeliveryZones(vendorId, options = {}) {
    const id = String(vendorId || '').trim()
    if (!id) {
      throw new Error('Vendor id is required.')
    }

    if (!isAdminRealApiFeature('vendors')) {
      return { data: mapAdminDeliveryZonesResponse({ general: {}, branches: [], coverage: null }), meta: null }
    }

    const response = await apiClient.get(endpoints.admin.vendors.deliveryZones(id), {
      ...options,
      scope: 'admin',
      feature: 'vendors',
    })

    return {
      data: mapAdminDeliveryZonesResponse(response?.data),
      meta: response?.meta ?? null,
    }
  },

  /**
   * Update delivery zone defaults.
   * Confirmed sample: { deliveryRadiusKm, minOrderAmount, freeDeliveryOver }
   *
   * @param {string} vendorId
   * @param {object} form
   * @param {{ signal?: AbortSignal }} [options]
   */
  async updateDeliveryZones(vendorId, form = {}, options = {}) {
    const id = String(vendorId || '').trim()
    if (!id) {
      throw new Error('Vendor id is required.')
    }

    const body = mapAdminUpdateDeliveryZonesRequest(form)

    if (!isAdminRealApiFeature('vendors')) {
      throw new Error('Real vendors API is required to update delivery zones.')
    }

    const response = await apiClient.patch(endpoints.admin.vendors.deliveryZones(id), body, {
      ...options,
      scope: 'admin',
      feature: 'vendors',
    })

    return {
      data: response?.data ? mapAdminDeliveryZonesResponse(response.data) : null,
      meta: response?.meta ?? null,
      raw: response,
    }
  },

  /**
   * Apply zone defaults to all branches.
   * Confirmed: POST .../delivery-zones/apply-all (no body)
   *
   * @param {string} vendorId
   * @param {{ signal?: AbortSignal }} [options]
   */
  async applyDeliveryZonesToAll(vendorId, options = {}) {
    const id = String(vendorId || '').trim()
    if (!id) {
      throw new Error('Vendor id is required.')
    }

    if (!isAdminRealApiFeature('vendors')) {
      throw new Error('Real vendors API is required to apply delivery zones.')
    }

    const response = await apiClient.post(endpoints.admin.vendors.deliveryZonesApplyAll(id), {}, {
      ...options,
      scope: 'admin',
      feature: 'vendors',
    })

    return {
      data: response?.data ? mapAdminDeliveryZonesResponse(response.data) : null,
      meta: response?.meta ?? null,
      raw: response,
    }
  },

  /**
   * Get commission & fees.
   * Confirmed: GET /admin/vendors/:vendorId/commission
   *
   * @param {string} vendorId
   * @param {{ signal?: AbortSignal }} [options]
   */
  async getCommission(vendorId, options = {}) {
    const id = String(vendorId || '').trim()
    if (!id) {
      throw new Error('Vendor id is required.')
    }

    if (!isAdminRealApiFeature('vendors')) {
      throw new Error('Real vendors API is required to load commission.')
    }

    const response = await apiClient.get(endpoints.admin.vendors.commission(id), {
      ...options,
      scope: 'admin',
      feature: 'vendors',
    })

    return {
      data: mapAdminVendorCommissionResponse(response?.data),
      meta: response?.meta ?? null,
    }
  },

  /**
   * Update commission & fees.
   * Confirmed percent: { model: "PERCENT_OF_ORDER", commissionRate: 15 }
   * Confirmed tiered: { model: "TIERED", commissionTiers, customFees }
   * Response data matches GET commission shape (percent confirmed full object).
   *
   * @param {string} vendorId
   * @param {object} form — detail modal UI object, or wizard form when options.wizard
   * @param {{
   *   signal?: AbortSignal,
   *   wizard?: boolean,
   *   customFees?: array,
   *   commissionTiers?: array,
   *   includeSharedFees?: boolean,
   * }} [options]
   */
  async updateCommission(vendorId, form = {}, options = {}) {
    const id = String(vendorId || '').trim()
    if (!id) {
      throw new Error('Vendor id is required.')
    }

    const {
      wizard = false,
      customFees,
      commissionTiers,
      includeSharedFees,
      ...requestOptions
    } = options

    const body = wizard
      ? mapAdminWizardCommissionRequest(form, {
          customFees,
          commissionTiers,
          includeSharedFees,
        })
      : mapAdminUpdateVendorCommissionRequest(form)

    if (!isAdminRealApiFeature('vendors')) {
      throw new Error('Real vendors API is required to update commission.')
    }

    const response = await apiClient.patch(endpoints.admin.vendors.commission(id), body, {
      ...requestOptions,
      scope: 'admin',
      feature: 'vendors',
    })

    if (response?.data) {
      return {
        data: mapAdminVendorCommissionResponse(response.data),
        meta: response?.meta ?? null,
      }
    }

    return this.getCommission(id, requestOptions)
  },

  /**
   * List promotions.
   * Confirmed: GET /admin/vendors/:vendorId/promotions → { count, promotions[] }
   */
  async listPromotions(vendorId, options = {}) {
    const id = String(vendorId || '').trim()
    if (!id) {
      throw new Error('Vendor id is required.')
    }

    if (!isAdminRealApiFeature('vendors')) {
      return { data: emptyAdminVendorPromotions(), meta: null }
    }

    const response = await apiClient.get(endpoints.admin.vendors.promotions(id), {
      ...options,
      scope: 'admin',
      feature: 'vendors',
    })

    return {
      data: mapAdminVendorPromotionsResponse(response?.data),
      meta: response?.meta ?? null,
    }
  },

  /**
   * Get one promotion.
   * Confirmed 404: { success:false, error:{ code:"NOT_FOUND", message:"Promotion not found" } }
   */
  async getPromotion(vendorId, promotionId, options = {}) {
    const id = String(vendorId || '').trim()
    const promoId = String(promotionId || '').trim()
    if (!id || !promoId) {
      throw new Error('Vendor id and promotion id are required.')
    }

    if (!isAdminRealApiFeature('vendors')) {
      throw new Error('Real vendors API is required to load a promotion.')
    }

    const response = await apiClient.get(endpoints.admin.vendors.promotion(id, promoId), {
      ...options,
      scope: 'admin',
      feature: 'vendors',
    })

    return {
      data: mapAdminVendorPromotionItem(response?.data),
      meta: response?.meta ?? null,
    }
  },

  /**
   * Create promotion.
   * Confirmed POST body: name, type, discountValue, scope, startsAt, endsAt
   */
  async createPromotion(vendorId, form = {}, options = {}) {
    const id = String(vendorId || '').trim()
    if (!id) {
      throw new Error('Vendor id is required.')
    }

    const body = mapAdminCreateVendorPromotionRequest(form)

    if (!isAdminRealApiFeature('vendors')) {
      throw new Error('Real vendors API is required to create a promotion.')
    }

    const response = await apiClient.post(endpoints.admin.vendors.promotions(id), body, {
      ...options,
      scope: 'admin',
      feature: 'vendors',
    })

    return {
      data: mapAdminVendorPromotionItem(response?.data),
      meta: response?.meta ?? null,
    }
  },

  /**
   * Update promotion.
   * Confirmed Postman sample: { name }
   */
  async updatePromotion(vendorId, promotionId, form = {}, options = {}) {
    const id = String(vendorId || '').trim()
    const promoId = String(promotionId || '').trim()
    if (!id || !promoId) {
      throw new Error('Vendor id and promotion id are required.')
    }

    const body = mapAdminUpdateVendorPromotionRequest(form)

    if (!isAdminRealApiFeature('vendors')) {
      throw new Error('Real vendors API is required to update a promotion.')
    }

    const response = await apiClient.patch(endpoints.admin.vendors.promotion(id, promoId), body, {
      ...options,
      scope: 'admin',
      feature: 'vendors',
    })

    return {
      data: response?.data ? mapAdminVendorPromotionItem(response.data) : null,
      meta: response?.meta ?? null,
    }
  },

  /**
   * Get vendor SLA (rules + 30d compliance when present).
   * Confirmed: GET /admin/vendors/:vendorId/sla
   */
  async getSla(vendorId, options = {}) {
    const id = String(vendorId || '').trim()
    if (!id) {
      throw new Error('Vendor id is required.')
    }

    if (!isAdminRealApiFeature('vendors')) {
      throw new Error('Real vendors API is required to load SLA.')
    }

    const response = await apiClient.get(endpoints.admin.vendors.sla(id), {
      ...options,
      scope: 'admin',
      feature: 'vendors',
    })

    return {
      data: mapAdminVendorSlaResponse(response?.data),
      meta: response?.meta ?? null,
    }
  },

  /**
   * Update vendor SLA (apply model / customize).
   * Confirmed sample: { slaModelId, serviceModes, config }
   */
  async updateSla(vendorId, form = {}, options = {}) {
    const id = String(vendorId || '').trim()
    if (!id) {
      throw new Error('Vendor id is required.')
    }

    const body = mapAdminUpdateVendorSlaRequest(form)

    if (!isAdminRealApiFeature('vendors')) {
      throw new Error('Real vendors API is required to update SLA.')
    }

    const response = await apiClient.patch(endpoints.admin.vendors.sla(id), body, {
      ...options,
      scope: 'admin',
      feature: 'vendors',
    })

    if (response?.data) {
      return {
        data: mapAdminVendorSlaResponse(response.data),
        meta: response?.meta ?? null,
      }
    }

    return this.getSla(id, options)
  },
}
