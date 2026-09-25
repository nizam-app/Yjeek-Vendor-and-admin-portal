import { apiClient } from '../../api/client'
import { apiConfig, isAdminRealApiFeature } from '../../api/config'
import { endpoints } from '../../api/endpoints'
import {
  mapAdminAddBadgeRequest,
  mapAdminAddMenuCategoryRequest,
  mapAdminBadgeItem,
  mapAdminCreateStoreTypeRequest,
  mapAdminMenuCategoryItem,
  mapAdminStoreTypeDetail,
  mapAdminStoreTypesListPage,
  mapAdminStoreTypesResponse,
  mapAdminUpdateBadgeRequest,
  mapAdminUpdateMenuCategoryRequest,
  mapAdminUpdateStoreTypeRequest,
} from '../../mappers/admin/mapAdminStoreTypes'

function useRealStoreTypesApi() {
  return isAdminRealApiFeature('store-types') || !apiConfig.adminUseMockApi
}

/**
 * Admin Store types (Store Management).
 *
 * Confirmed:
 *   GET /admin/store-types/summary
 *   GET /admin/store-types
 *   GET /admin/store-types/:storeTypeId
 *   POST /admin/store-types
 *   PATCH /admin/store-types/:storeTypeId
 *
 * Feature flag: `store-types` in VITE_ADMIN_REAL_API_FEATURES
 * Also on when VITE_ADMIN_USE_MOCK_API=false (same pattern as fleet).
 */
export const adminStoreTypeService = {
  /**
   * Store types management page (KPIs from summary + table from list).
   *
   * @param {{ signal?: AbortSignal, params?: Record<string, unknown> }} [options]
   */
  async listForPage(options = {}) {
    if (!useRealStoreTypesApi()) {
      return { data: null, meta: null }
    }

    const requestOpts = {
      ...options,
      scope: 'admin',
      feature: 'store-types',
      forceReal: !apiConfig.adminUseMockApi,
    }

    const [listResponse, summaryResponse] = await Promise.all([
      apiClient.get(endpoints.admin.storeTypes.list, {
        ...requestOpts,
        params: { ...(options.params || {}) },
      }),
      apiClient.get(endpoints.admin.storeTypes.summary, requestOpts),
    ])

    return {
      data: mapAdminStoreTypesListPage(listResponse?.data, summaryResponse?.data),
      meta: listResponse?.meta ?? null,
    }
  },

  /**
   * Lightweight list for dropdowns / champ allowed-store-type chips.
   * Returns `{ id, name, slug }` objects only (Rule 9 — chips valued by slug).
   *
   * @param {{ signal?: AbortSignal, params?: Record<string, unknown> }} [options]
   * @returns {Promise<{ data: { total: number, storeTypes: Array<{ id: string, name: string, slug: string|null }> }, meta: unknown }>}
   */
  async listStoreTypes(options = {}) {
    if (!useRealStoreTypesApi() && !isAdminRealApiFeature('vendors') && !isAdminRealApiFeature('fleet')) {
      return { data: { total: 0, storeTypes: [] }, meta: null }
    }

    const feature = useRealStoreTypesApi()
      ? 'store-types'
      : isAdminRealApiFeature('vendors')
        ? 'vendors'
        : 'fleet'

    const response = await apiClient.get(endpoints.admin.storeTypes.list, {
      ...options,
      scope: 'admin',
      feature,
      forceReal: !apiConfig.adminUseMockApi,
      params: { limit: 100, ...(options.params || {}) },
    })

    return {
      data: mapAdminStoreTypesResponse(response?.data),
      meta: response?.meta ?? null,
    }
  },

  /**
   * Store types for Add Champ chips / fleet category filter (name label, slug value).
   * Only Visible (published) store types from Store Management; requires slug.
   *
   * @param {{ signal?: AbortSignal, params?: Record<string, unknown> }} [options]
   */
  async listStoreTypesForChampForm(options = {}) {
    const result = await this.listStoreTypes({
      ...options,
      params: { visibleOnly: true, ...(options.params || {}) },
    })
    const storeTypes = (result?.data?.storeTypes || [])
      .filter((item) => item && item.id && item.name && item.slug && item.visible !== false)
      .map((item) => ({
        id: String(item.id),
        name: String(item.name),
        slug: String(item.slug).trim().toLowerCase(),
      }))

    return {
      data: { total: storeTypes.length, storeTypes },
      meta: result?.meta ?? null,
    }
  },

  /**
   * Store type detail for edit page.
   *
   * @param {string} storeTypeId
   * @param {{ signal?: AbortSignal }} [options]
   */
  async getStoreType(storeTypeId, options = {}) {
    const id = String(storeTypeId || '').trim()
    if (!id) {
      throw new Error('Store type id is required.')
    }

    if (!useRealStoreTypesApi()) {
      return { data: null, meta: null }
    }

    const response = await apiClient.get(endpoints.admin.storeTypes.detail(id), {
      ...options,
      scope: 'admin',
      feature: 'store-types',
      forceReal: true,
    })

    return {
      data: mapAdminStoreTypeDetail(response?.data),
      meta: response?.meta ?? null,
    }
  },

  /**
   * Create store type.
   * Confirmed: POST /admin/store-types
   *
   * @param {object} form
   * @param {{ signal?: AbortSignal }} [options]
   */
  async createStoreType(form, options = {}) {
    const body = mapAdminCreateStoreTypeRequest(form)

    if (!useRealStoreTypesApi()) {
      return {
        data: {
          id: `local-${Date.now()}`,
          ...body,
          visible: Boolean(body.isActive),
          orderModes: [],
        },
        meta: null,
      }
    }

    const response = await apiClient.post(endpoints.admin.storeTypes.list, body, {
      ...options,
      scope: 'admin',
      feature: 'store-types',
      forceReal: true,
    })

    const raw = response?.data
    return {
      data: raw?.id ? mapAdminStoreTypeDetail(raw) : raw,
      meta: response?.meta ?? null,
    }
  },

  /**
   * Update store type (edit page Save / Publish).
   * Confirmed: PATCH /admin/store-types/:storeTypeId
   *
   * @param {string} storeTypeId
   * @param {object} form
   * @param {{ signal?: AbortSignal }} [options]
   */
  async updateStoreType(storeTypeId, form, options = {}) {
    const id = String(storeTypeId || '').trim()
    if (!id) {
      throw new Error('Store type id is required.')
    }

    const body = mapAdminUpdateStoreTypeRequest(form)

    if (!useRealStoreTypesApi()) {
      return { data: { id, ...body }, meta: null }
    }

    const response = await apiClient.patch(endpoints.admin.storeTypes.detail(id), body, {
      ...options,
      scope: 'admin',
      feature: 'store-types',
      forceReal: true,
    })

    const raw = response?.data
    if (raw && typeof raw === 'object' && raw.id) {
      try {
        return {
          data: mapAdminStoreTypeDetail({
            ...raw,
            menuCategories: Array.isArray(raw.menuCategories) ? raw.menuCategories : [],
            badges: Array.isArray(raw.badges) ? raw.badges : [],
          }),
          meta: response?.meta ?? null,
        }
      } catch {
        return { data: raw, meta: response?.meta ?? null }
      }
    }

    return { data: raw ?? { id, ...body }, meta: response?.meta ?? null }
  },

  /**
   * Publish store type (list Visible / Show).
   * POST /admin/store-types/:storeTypeId/publish
   */
  async publishStoreType(storeTypeId, options = {}) {
    const id = String(storeTypeId || '').trim()
    if (!id) throw new Error('Store type id is required.')

    if (!useRealStoreTypesApi()) {
      return { data: { id, visible: true, publishStatus: 'PUBLISHED', isActive: true }, meta: null }
    }

    const response = await apiClient.post(endpoints.admin.storeTypes.publish(id), {}, {
      ...options,
      scope: 'admin',
      feature: 'store-types',
      forceReal: true,
    })
    const raw = response?.data
    return {
      data: raw?.id ? mapAdminStoreTypeDetail(raw) : raw,
      meta: response?.meta ?? null,
    }
  },

  /**
   * Move store type to draft (list Hidden / Hide).
   * POST /admin/store-types/:storeTypeId/draft
   */
  async draftStoreType(storeTypeId, options = {}) {
    const id = String(storeTypeId || '').trim()
    if (!id) throw new Error('Store type id is required.')

    if (!useRealStoreTypesApi()) {
      return { data: { id, visible: false, publishStatus: 'DRAFT', isActive: false }, meta: null }
    }

    const response = await apiClient.post(endpoints.admin.storeTypes.draft(id), {}, {
      ...options,
      scope: 'admin',
      feature: 'store-types',
      forceReal: true,
    })
    const raw = response?.data
    return {
      data: raw?.id ? mapAdminStoreTypeDetail(raw) : raw,
      meta: response?.meta ?? null,
    }
  },

  async addMenuCategory(storeTypeId, form, options = {}) {
    const id = String(storeTypeId || '').trim()
    if (!id) throw new Error('Store type id is required.')
    const body = mapAdminAddMenuCategoryRequest(form)

    if (!useRealStoreTypesApi()) {
      return {
        data: mapAdminMenuCategoryItem({
          id: `local-cat-${Date.now()}`,
          storeTypeId: id,
          parentId: body.parentId || null,
          name: body.name,
          isVisible: true,
          sortOrder: body.sortOrder,
          itemCount: 0,
        }),
        meta: null,
      }
    }

    const response = await apiClient.post(endpoints.admin.storeTypes.menuCategories(id), body, {
      ...options,
      scope: 'admin',
      feature: 'store-types',
      forceReal: true,
    })
    return { data: mapAdminMenuCategoryItem(response?.data), meta: response?.meta ?? null }
  },

  async updateMenuCategory(storeTypeId, menuCategoryId, form, options = {}) {
    const typeId = String(storeTypeId || '').trim()
    const catId = String(menuCategoryId || '').trim()
    if (!typeId || !catId) throw new Error('Store type id and menu category id are required.')
    const body = mapAdminUpdateMenuCategoryRequest(form)

    if (!useRealStoreTypesApi()) {
      return {
        data: mapAdminMenuCategoryItem({
          id: catId,
          storeTypeId: typeId,
          name: body.name || form.name || 'Category',
          isVisible: body.isVisible ?? form.visible ?? true,
          sortOrder: Number(form.sortOrder) || 1,
          itemCount: Number(form.itemCount) || 0,
          parentId: form.parentId ?? null,
        }),
        meta: null,
      }
    }

    const response = await apiClient.patch(
      endpoints.admin.storeTypes.menuCategory(typeId, catId),
      body,
      { ...options, scope: 'admin', feature: 'store-types', forceReal: true },
    )
    return { data: mapAdminMenuCategoryItem(response?.data), meta: response?.meta ?? null }
  },

  async deleteMenuCategory(storeTypeId, menuCategoryId, options = {}) {
    const typeId = String(storeTypeId || '').trim()
    const catId = String(menuCategoryId || '').trim()
    if (!typeId || !catId) throw new Error('Store type id and menu category id are required.')

    if (!useRealStoreTypesApi()) {
      return { data: { deleted: true, id: catId }, meta: null }
    }

    const response = await apiClient.delete(endpoints.admin.storeTypes.menuCategory(typeId, catId), {
      ...options,
      scope: 'admin',
      feature: 'store-types',
      forceReal: true,
    })
    return { data: response?.data ?? { deleted: true, id: catId }, meta: response?.meta ?? null }
  },

  async addBadge(storeTypeId, form, options = {}) {
    const id = String(storeTypeId || '').trim()
    if (!id) throw new Error('Store type id is required.')
    const body = mapAdminAddBadgeRequest(form)

    if (!useRealStoreTypesApi()) {
      return {
        data: mapAdminBadgeItem({
          id: `local-badge-${Date.now()}`,
          ...body,
        }),
        meta: null,
      }
    }

    const response = await apiClient.post(endpoints.admin.storeTypes.badges(id), body, {
      ...options,
      scope: 'admin',
      feature: 'store-types',
      forceReal: true,
    })
    return { data: mapAdminBadgeItem(response?.data), meta: response?.meta ?? null }
  },

  async updateBadge(storeTypeId, badgeId, form, options = {}) {
    const typeId = String(storeTypeId || '').trim()
    const id = String(badgeId || '').trim()
    if (!typeId || !id) throw new Error('Store type id and badge id are required.')
    const body = mapAdminUpdateBadgeRequest(form)

    if (!useRealStoreTypesApi()) {
      return {
        data: mapAdminBadgeItem({
          id,
          label: body.label || form.label || 'Badge',
          color: body.color || form.bg || '#e8f7ed',
          icon: form.icon || null,
          sortOrder: body.sortOrder ?? form.sortOrder ?? 1,
        }),
        meta: null,
      }
    }

    const response = await apiClient.patch(endpoints.admin.storeTypes.badge(typeId, id), body, {
      ...options,
      scope: 'admin',
      feature: 'store-types',
      forceReal: true,
    })
    return { data: mapAdminBadgeItem(response?.data), meta: response?.meta ?? null }
  },

  async deleteBadge(storeTypeId, badgeId, options = {}) {
    const typeId = String(storeTypeId || '').trim()
    const id = String(badgeId || '').trim()
    if (!typeId || !id) throw new Error('Store type id and badge id are required.')

    if (!useRealStoreTypesApi()) {
      return { data: { deleted: true, id }, meta: null }
    }

    const response = await apiClient.delete(endpoints.admin.storeTypes.badge(typeId, id), {
      ...options,
      scope: 'admin',
      feature: 'store-types',
      forceReal: true,
    })
    return { data: response?.data ?? { deleted: true, id }, meta: response?.meta ?? null }
  },

  /**
   * Delivery Fees v1 — GET store-type delivery defaults (includes allowedVehicles).
   * Confirmed: GET /admin/store-types/:storeTypeId/delivery-defaults
   *
   * @param {string} storeTypeId
   * @param {{ signal?: AbortSignal }} [options]
   */
  async getDeliveryDefaults(storeTypeId, options = {}) {
    const id = String(storeTypeId || '').trim()
    if (!id) throw new Error('Store type id is required.')

    if (!useRealStoreTypesApi()) {
      return {
        data: {
          storeTypeId: id,
          allowedVehicles: { bike: true, car: true },
          hotFoodOnDemand: null,
          scheduled: null,
          driverRates: null,
        },
        meta: null,
      }
    }

    const response = await apiClient.get(endpoints.admin.storeTypes.deliveryDefaults(id), {
      ...options,
      scope: 'admin',
      feature: 'store-types',
      forceReal: true,
    })
    return { data: response?.data ?? null, meta: response?.meta ?? null }
  },

  /**
   * Delivery Fees v1 — PUT allowed vehicles only (no cascade to vendors/branches).
   * Confirmed: PUT /admin/store-types/:storeTypeId/allowed-vehicles
   *
   * @param {string} storeTypeId
   * @param {{ bike: boolean, car: boolean }} vehicles
   * @param {{ signal?: AbortSignal }} [options]
   */
  async updateAllowedVehicles(storeTypeId, vehicles, options = {}) {
    const id = String(storeTypeId || '').trim()
    if (!id) throw new Error('Store type id is required.')

    const body = {
      bike: Boolean(vehicles?.bike),
      car: Boolean(vehicles?.car),
    }

    if (!useRealStoreTypesApi()) {
      return {
        data: {
          storeTypeId: id,
          allowedVehicles: body,
        },
        meta: null,
      }
    }

    const response = await apiClient.put(endpoints.admin.storeTypes.allowedVehicles(id), body, {
      ...options,
      scope: 'admin',
      feature: 'store-types',
      forceReal: true,
    })
    return { data: response?.data ?? { storeTypeId: id, allowedVehicles: body }, meta: response?.meta ?? null }
  },

  /**
   * Delivery Fees v1 — PUT store-type delivery defaults (hot-food + scheduled; no cascade).
   * Confirmed: PUT /admin/store-types/:storeTypeId/delivery-defaults
   * Do not send maxContribution or customer.maxDistanceKm as inputs.
   * Do not send radius / perKm / maxDistance on scheduled.
   *
   * @param {string} storeTypeId
   * @param {{ allowedVehicles?: { bike: boolean, car: boolean }, hotFoodOnDemand?: object | null, scheduled?: object | null, driverRates?: object | null }} body
   * @param {{ signal?: AbortSignal }} [options]
   */
  async updateDeliveryDefaults(storeTypeId, body, options = {}) {
    const id = String(storeTypeId || '').trim()
    if (!id) throw new Error('Store type id is required.')

    const payload = body && typeof body === 'object' ? body : {}

    if (!useRealStoreTypesApi()) {
      return {
        data: {
          storeTypeId: id,
          allowedVehicles: payload.allowedVehicles ?? { bike: true, car: true },
          hotFoodOnDemand: payload.hotFoodOnDemand ?? null,
          scheduled: payload.scheduled !== undefined ? payload.scheduled : null,
          driverRates: payload.driverRates !== undefined ? payload.driverRates : null,
        },
        meta: null,
      }
    }

    const response = await apiClient.put(endpoints.admin.storeTypes.deliveryDefaults(id), payload, {
      ...options,
      scope: 'admin',
      feature: 'store-types',
      forceReal: true,
    })
    return { data: response?.data ?? null, meta: response?.meta ?? null }
  },

  /**
   * Delivery Fees v1 / D05 — convert preview before turning a class off (OG §03).
   * Confirmed: GET /admin/store-types/:id/item-classes/convert-preview?disable=SPECIAL|NORMAL
   *
   * @param {string} storeTypeId
   * @param {'NORMAL'|'SPECIAL'} disable
   * @param {{ signal?: AbortSignal }} [options]
   */
  async getItemClassConvertPreview(storeTypeId, disable, options = {}) {
    const id = String(storeTypeId || '').trim()
    if (!id) throw new Error('Store type id is required.')

    const disableClass = String(disable || '').trim().toUpperCase()
    if (disableClass !== 'NORMAL' && disableClass !== 'SPECIAL') {
      throw new Error('disable must be NORMAL or SPECIAL.')
    }

    if (!useRealStoreTypesApi()) {
      return {
        data: {
          disable: disableClass,
          remaining: disableClass === 'SPECIAL' ? 'NORMAL' : 'SPECIAL',
          convertAction: disableClass === 'SPECIAL' ? 'convert_to_normal' : 'convert_to_special',
          vendorCount: 0,
          categoryCount: 0,
          itemCount: 0,
        },
        meta: null,
      }
    }

    const response = await apiClient.get(
      endpoints.admin.storeTypes.itemClassConvertPreview(id, disableClass),
      {
        ...options,
        scope: 'admin',
        feature: 'store-types',
        forceReal: true,
      },
    )

    const raw = response?.data && typeof response.data === 'object' ? response.data : {}
    return {
      data: {
        disable: raw.disable === 'NORMAL' ? 'NORMAL' : 'SPECIAL',
        remaining: raw.remaining === 'SPECIAL' ? 'SPECIAL' : 'NORMAL',
        convertAction:
          raw.convertAction === 'convert_to_special' ? 'convert_to_special' : 'convert_to_normal',
        vendorCount: Number(raw.vendorCount) || 0,
        categoryCount: Number(raw.categoryCount) || 0,
        itemCount: Number(raw.itemCount) || 0,
      },
      meta: response?.meta ?? null,
    }
  },
}
