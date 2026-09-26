import { apiClient } from '../../api/client'
import { endpoints } from '../../api/endpoints'
import { ApiError } from '../../api/errors'
import {
  flattenCatalogCategoryOptions,
  mapAdminCatalogCategory,
  mapAdminCatalogProduct,
  mapAdminVendorCatalog,
} from '../../mappers/admin/mapAdminVendorCatalog'

function mapProduct(raw) {
  if (!raw || typeof raw !== 'object') return null
  const mapped = mapAdminCatalogProduct(raw)
  if (!mapped) return null
  return {
    ...mapped,
    vendor: raw.vendor
      ? {
          id: raw.vendor.id,
          name: raw.vendor.name || '',
          logoUrl: raw.vendor.logoUrl || null,
        }
      : null,
    platformCategory: raw.platformCategory || null,
    catalogCategory: raw.catalogCategory || null,
  }
}

function requestOptions(options = {}) {
  return {
    ...options,
    scope: 'admin',
  }
}

/**
 * Admin product catalog + vendor Menu Settings live menu.
 * Confirmed: GET/PATCH/DELETE /admin/stores/products*
 * Menu Settings: GET/POST vendor catalog + categories under /admin/stores/vendors/:id/*
 */
export const adminStoresCatalogService = {
  async listProducts(options = {}) {
    const { search, vendorId, page = 1, limit = 20, ...rest } = options
    const params = { page, limit }
    if (search) params.search = String(search).trim()
    if (vendorId) params.vendorId = String(vendorId).trim()

    const response = await apiClient.get(endpoints.admin.storesCatalog.products, {
      ...requestOptions(rest),
      params,
    })
    const data = response?.data ?? response
    const products = Array.isArray(data?.products)
      ? data.products.map(mapProduct).filter(Boolean)
      : []

    return {
      page: data?.page ?? page,
      limit: data?.limit ?? limit,
      total: data?.total ?? products.length,
      products,
    }
  },

  async getProduct(productId, options = {}) {
    const id = String(productId || '').trim()
    const response = await apiClient.get(endpoints.admin.storesCatalog.product(id), {
      ...requestOptions(options),
    })
    return mapProduct(response?.data ?? response)
  },

  async updateProduct(productId, body, options = {}) {
    const id = String(productId || '').trim()
    const response = await apiClient.patch(endpoints.admin.storesCatalog.product(id), body, {
      ...requestOptions(options),
    })
    return mapProduct(response?.data ?? response)
  },

  async deleteProduct(productId, options = {}) {
    const id = String(productId || '').trim()
    const response = await apiClient.delete(endpoints.admin.storesCatalog.product(id), {
      ...requestOptions(options),
    })
    return mapProduct(response?.data ?? response)
  },

  async getVendorCatalog(vendorId, options = {}) {
    const id = String(vendorId || '').trim()
    if (!id) throw new ApiError({ message: 'Vendor id is required.' })
    const response = await apiClient.get(endpoints.admin.storesCatalog.vendorCatalog(id), {
      ...requestOptions(options),
    })
    const mapped = mapAdminVendorCatalog(response?.data ?? response)
    return {
      ...mapped,
      categoryOptions: flattenCatalogCategoryOptions(mapped.catalogCategories),
    }
  },

  async createVendorProduct(vendorId, body, options = {}) {
    const id = String(vendorId || '').trim()
    if (!id) throw new ApiError({ message: 'Vendor id is required.' })
    const response = await apiClient.post(
      endpoints.admin.storesCatalog.vendorProducts(id),
      body,
      requestOptions(options),
    )
    return mapProduct(response?.data ?? response)
  },

  async createCatalogCategory(vendorId, body, options = {}) {
    const id = String(vendorId || '').trim()
    if (!id) throw new ApiError({ message: 'Vendor id is required.' })
    const response = await apiClient.post(
      endpoints.admin.storesCatalog.vendorCatalogCategory(id),
      body,
      requestOptions(options),
    )
    return mapAdminCatalogCategory(response?.data ?? response)
  },

  async updateCatalogCategory(vendorId, categoryId, body, options = {}) {
    const vid = String(vendorId || '').trim()
    const cid = String(categoryId || '').trim()
    if (!vid || !cid) throw new ApiError({ message: 'Vendor and category ids are required.' })
    const response = await apiClient.patch(
      endpoints.admin.storesCatalog.vendorCatalogCategory(vid, cid),
      body,
      requestOptions(options),
    )
    return mapAdminCatalogCategory(response?.data ?? response)
  },

  async deleteCatalogCategory(vendorId, categoryId, options = {}) {
    const vid = String(vendorId || '').trim()
    const cid = String(categoryId || '').trim()
    if (!vid || !cid) throw new ApiError({ message: 'Vendor and category ids are required.' })
    const response = await apiClient.delete(
      endpoints.admin.storesCatalog.vendorCatalogCategory(vid, cid),
      requestOptions(options),
    )
    return response?.data ?? response
  },
}
