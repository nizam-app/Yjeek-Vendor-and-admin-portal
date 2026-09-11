import { apiClient } from '../../api/client'
import { isAdminRealApiFeature } from '../../api/config'
import { endpoints } from '../../api/endpoints'
import { ApiError } from '../../api/errors'
import {
  mapAdminMenuImport,
  mapAdminMenuImportList,
  mapAdminMenuImportReview,
} from '../../mappers/admin/mapAdminMenuImport'

function requireFeature() {
  if (!isAdminRealApiFeature('menu-import')) {
    throw new ApiError({ message: 'Menu import API is not enabled.' })
  }
}

function opts(options = {}) {
  return {
    ...options,
    scope: 'admin',
    feature: 'menu-import',
  }
}

function unwrapImport(response) {
  return mapAdminMenuImport(response?.data)
}

/**
 * Admin Menu Import BFF.
 * Feature flag: `menu-import` in VITE_ADMIN_REAL_API_FEATURES.
 */
export const adminMenuImportService = {
  async list(vendorId, options = {}) {
    requireFeature()
    const params = {}
    if (options.page) params.page = options.page
    if (options.limit) params.limit = options.limit
    if (options.status) params.status = options.status
    const response = await apiClient.get(endpoints.admin.vendors.menuImports(vendorId), {
      ...opts(options),
      params,
    })
    return mapAdminMenuImportList(response?.data)
  },

  async create(vendorId, body, options = {}) {
    requireFeature()
    const response = await apiClient.post(
      endpoints.admin.vendors.menuImports(vendorId),
      body,
      opts({ ...options, timeout: options.timeout ?? 30_000 }),
    )
    return unwrapImport(response)
  },

  async previewSpreadsheet(vendorId, body, options = {}) {
    requireFeature()
    const response = await apiClient.post(
      endpoints.admin.vendors.menuImportSpreadsheetPreview(vendorId),
      body,
      opts({ ...options, timeout: options.timeout ?? 30_000 }),
    )
    return response?.data ?? null
  },

  async get(vendorId, importId, options = {}) {
    requireFeature()
    const response = await apiClient.get(
      endpoints.admin.vendors.menuImport(vendorId, importId),
      opts(options),
    )
    return unwrapImport(response)
  },

  async cancel(vendorId, importId, options = {}) {
    requireFeature()
    const response = await apiClient.post(
      endpoints.admin.vendors.menuImportCancel(vendorId, importId),
      null,
      opts(options),
    )
    return unwrapImport(response)
  },

  async retry(vendorId, importId, options = {}) {
    requireFeature()
    const response = await apiClient.post(
      endpoints.admin.vendors.menuImportRetry(vendorId, importId),
      null,
      opts({ ...options, timeout: options.timeout ?? 30_000 }),
    )
    return unwrapImport(response)
  },

  async remove(vendorId, importId, options = {}) {
    requireFeature()
    return apiClient.delete(endpoints.admin.vendors.menuImport(vendorId, importId), opts(options))
  },

  async getReview(vendorId, importId, options = {}) {
    requireFeature()
    const response = await apiClient.get(
      endpoints.admin.vendors.menuImportReview(vendorId, importId),
      opts(options),
    )
    return mapAdminMenuImportReview(response?.data)
  },

  async createCategory(vendorId, importId, body, options = {}) {
    requireFeature()
    const response = await apiClient.post(
      endpoints.admin.vendors.menuImportReviewCategories(vendorId, importId),
      body,
      opts(options),
    )
    return response?.data
  },

  async patchCategory(vendorId, importId, categoryId, body, options = {}) {
    requireFeature()
    const response = await apiClient.patch(
      endpoints.admin.vendors.menuImportReviewCategory(vendorId, importId, categoryId),
      body,
      opts(options),
    )
    return response?.data
  },

  async deleteCategory(vendorId, importId, categoryId, options = {}) {
    requireFeature()
    return apiClient.delete(
      endpoints.admin.vendors.menuImportReviewCategory(vendorId, importId, categoryId),
      opts(options),
    )
  },

  async createItem(vendorId, importId, body, options = {}) {
    requireFeature()
    const response = await apiClient.post(
      endpoints.admin.vendors.menuImportReviewItems(vendorId, importId),
      body,
      opts(options),
    )
    return response?.data
  },

  async patchItem(vendorId, importId, itemId, body, options = {}) {
    requireFeature()
    const response = await apiClient.patch(
      endpoints.admin.vendors.menuImportReviewItem(vendorId, importId, itemId),
      body,
      opts(options),
    )
    return response?.data
  },

  async deleteItem(vendorId, importId, itemId, options = {}) {
    requireFeature()
    return apiClient.delete(
      endpoints.admin.vendors.menuImportReviewItem(vendorId, importId, itemId),
      opts(options),
    )
  },

  async verifyPriceParity(vendorId, importId, options = {}) {
    requireFeature()
    const response = await apiClient.post(
      endpoints.admin.vendors.menuImportPriceParity(vendorId, importId),
      { isPriceParityVerified: true },
      opts(options),
    )
    return unwrapImport(response)
  },

  async publish(vendorId, importId, options = {}) {
    requireFeature()
    const response = await apiClient.post(
      endpoints.admin.vendors.menuImportPublish(vendorId, importId),
      null,
      opts({ ...options, timeout: options.timeout ?? 30_000 }),
    )
    return unwrapImport(response)
  },
}
