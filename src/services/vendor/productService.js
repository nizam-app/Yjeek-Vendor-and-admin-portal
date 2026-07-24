import { apiClient } from '../../api/client'
import { endpoints } from '../../api/endpoints'
import {
  flattenVendorCatalogCategories,
  mapVendorCatalogCategoriesResponse,
  mapVendorCatalogProduct,
  mapVendorCatalogProductsResponse,
  mapVendorCatalogStoreTypesResponse,
  buildVendorCreateProductBody,
} from '../../mappers/vendor/mapVendorCatalog'

/**
 * Vendor catalog service.
 * Confirmed:
 *   GET /vendor-panel/catalog/store-types
 *   GET /vendor-panel/catalog/categories
 *   GET /vendor-panel/catalog/products
 *   GET /vendor-panel/catalog/products/:productId
 *   POST /vendor-panel/catalog/products
 */
export const productService = {
  /**
   * GET /vendor-panel/catalog/store-types
   */
  async getCatalogStoreTypes(options = {}) {
    const response = await apiClient.get(endpoints.vendor.catalog.storeTypes, {
      ...options,
      scope: 'vendor',
    })

    return {
      data: mapVendorCatalogStoreTypesResponse(response?.data),
      meta: response?.meta ?? null,
    }
  },

  /**
   * GET /vendor-panel/catalog/categories
   */
  async getCatalogCategories(options = {}) {
    const response = await apiClient.get(endpoints.vendor.catalog.categories, {
      ...options,
      scope: 'vendor',
    })

    const tree = mapVendorCatalogCategoriesResponse(response?.data)

    return {
      data: {
        items: tree,
        options: flattenVendorCatalogCategories(tree),
      },
      meta: response?.meta ?? null,
    }
  },

  /**
   * GET /vendor-panel/catalog/products
   */
  async getCatalogProducts(options = {}) {
    const { platformCategory, categoryId, params, ...requestOptions } = options
    const query = { ...(params || {}) }
    if (categoryId) query.categoryId = String(categoryId)

    const response = await apiClient.get(endpoints.vendor.catalog.products, {
      ...requestOptions,
      params: query,
      scope: 'vendor',
    })

    let items = mapVendorCatalogProductsResponse(response?.data)

    if (platformCategory && items.length > 0) {
      const needle = String(platformCategory).trim().toLowerCase()
      const filtered = items.filter((item) => {
        const name = String(item.platformCategoryName || '').toLowerCase()
        if (!name) return true
        return name === needle || name.includes(needle)
      })
      if (filtered.length > 0) items = filtered
    }

    if (categoryId && items.length > 0) {
      const id = String(categoryId)
      const filtered = items.filter(
        (item) =>
          item.catalogCategoryId === id ||
          String(item.catalogCategoryName || '').toLowerCase() === id.toLowerCase(),
      )
      if (filtered.length > 0) items = filtered
    }

    return {
      data: items,
      meta: {
        ...(response?.meta || {}),
        count: response?.data?.count ?? items.length,
      },
    }
  },

  /**
   * GET /vendor-panel/catalog/products/:productId
   * Confirmed detail fields for Edit product modal.
   */
  async getProduct(productId, options = {}) {
    const response = await apiClient.get(endpoints.vendor.catalog.product(productId), {
      ...options,
      scope: 'vendor',
    })

    const raw = response?.data?.id
      ? response.data
      : response?.data?.item || response?.data?.product || response?.data

    return {
      data: mapVendorCatalogProduct(raw),
      meta: response?.meta ?? null,
    }
  },

  /**
   * POST /vendor-panel/catalog/products
   * Confirmed 201 response returns the created product object.
   */
  async createProduct(form = {}, options = {}) {
    const { catalogCategoryId, params, ...requestOptions } = options
    const body = buildVendorCreateProductBody(form, { catalogCategoryId })

    const response = await apiClient.post(endpoints.vendor.catalog.products, body, {
      ...requestOptions,
      params,
      scope: 'vendor',
    })

    const raw = response?.data?.id
      ? response.data
      : response?.data?.item || response?.data?.product || response?.data

    return {
      data: mapVendorCatalogProduct(raw),
      meta: response?.meta ?? null,
    }
  },

  /** @deprecated Prefer getCatalogProducts */
  getCatalogItems(options = {}) {
    return this.getCatalogProducts(options)
  },

  getServiceBookings(options = {}) {
    return apiClient.get(endpoints.vendor.services.bookings, { ...options, scope: 'vendor' })
  },

  /** @deprecated Prefer orderService.getServiceCalendar */
  getServiceCalendar(options = {}) {
    const { branchId, month, params, ...requestOptions } = options
    const query = { ...(params || {}) }
    if (month) query.month = String(month)
    if (branchId) query.branchId = String(branchId)
    return apiClient.get(endpoints.vendor.orders.servicesCalendar, {
      ...requestOptions,
      params: query,
      scope: 'vendor',
    })
  },
}
