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
import { vendorUploadService } from './uploadService'

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
   * Local image Files are uploaded first (when an upload route exists), then
   * URLs are included in the JSON body. Falls back to multipart create.
   */
  async createProduct(form = {}, options = {}) {
    const { catalogCategoryId, params, ...requestOptions } = options
    const files = (Array.isArray(form.imageFiles) ? form.imageFiles : []).filter(
      (file) => typeof File !== 'undefined' && file instanceof File,
    )

    const uploadedUrls = []
    for (const file of files) {
      try {
        const uploaded = await vendorUploadService.uploadImage(file, requestOptions)
        if (uploaded?.data?.url) uploadedUrls.push(uploaded.data.url)
      } catch {
        // Upload route may not exist yet — try multipart / create without URL.
        break
      }
    }

    const body = buildVendorCreateProductBody(
      {
        ...form,
        imageUrl: uploadedUrls[0] || form.imageUrl || null,
        imageUrls: uploadedUrls.length
          ? uploadedUrls
          : Array.isArray(form.imageUrls)
            ? form.imageUrls
            : [],
      },
      { catalogCategoryId },
    )

    const remainingFiles =
      uploadedUrls.length > 0 ? [] : files

    let response
    if (remainingFiles.length > 0) {
      try {
        response = await this.createProductMultipart(body, remainingFiles, {
          ...requestOptions,
          params,
        })
      } catch {
        // Backend may only accept JSON create — product still saves without images.
        response = await apiClient.post(endpoints.vendor.catalog.products, body, {
          ...requestOptions,
          params,
          scope: 'vendor',
        })
      }
    } else {
      response = await apiClient.post(endpoints.vendor.catalog.products, body, {
        ...requestOptions,
        params,
        scope: 'vendor',
      })
    }

    let raw = response?.data?.id
      ? response.data
      : response?.data?.item || response?.data?.product || response?.data

    // After JSON create, attach leftover files to the new product id.
    if (raw?.id && remainingFiles.length > 0 && !raw.imageUrl) {
      const attached = []
      for (const file of remainingFiles) {
        try {
          const uploaded = await vendorUploadService.uploadImage(file, {
            ...requestOptions,
            productId: raw.id,
          })
          if (uploaded?.data?.url) attached.push(uploaded.data.url)
        } catch {
          break
        }
      }
      if (attached.length) {
        raw = {
          ...raw,
          imageUrl: attached[0],
          imageUrls: attached,
        }
      }
    }

    return {
      data: mapVendorCatalogProduct(raw),
      meta: response?.meta ?? null,
    }
  },

  /**
   * Multipart create fallback when a dedicated upload route is missing.
   */
  async createProductMultipart(body, files, options = {}) {
    const { params, ...requestOptions } = options
    const formData = new FormData()

    Object.entries(body || {}).forEach(([key, value]) => {
      if (value === undefined || value === null) return
      if (typeof value === 'object') {
        formData.append(key, JSON.stringify(value))
      } else {
        formData.append(key, String(value))
      }
    })

    files.forEach((file, index) => {
      formData.append('images', file, file.name)
      if (index === 0) {
        formData.append('image', file, file.name)
        formData.append('file', file, file.name)
      }
    })

    return apiClient.post(endpoints.vendor.catalog.products, formData, {
      ...requestOptions,
      params,
      scope: 'vendor',
    })
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
