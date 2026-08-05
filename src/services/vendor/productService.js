import { apiClient } from '../../api/client'
import { endpoints } from '../../api/endpoints'
import { ApiError } from '../../api/errors'
import {
  flattenVendorCatalogCategories,
  mapVendorCatalogBadgesResponse,
  mapVendorCatalogCategoriesResponse,
  mapVendorCatalogProduct,
  mapVendorCatalogProductsResponse,
  mapVendorCatalogStoreTypesResponse,
  buildVendorCreateProductBody,
  buildVendorUpdateProductBody,
} from '../../mappers/vendor/mapVendorCatalog'
import { vendorUploadService } from './uploadService'

function isPersistedImageUrl(value) {
  const url = String(value || '').trim()
  if (!url) return false
  if (url.startsWith('blob:') || url.startsWith('data:')) return false
  return true
}

/**
 * Merge per-slot File uploads with existing remote URLs.
 * Throws if the user selected files and any upload fails — never soft-skip.
 */
async function resolveProductImageFields(form = {}, requestOptions = {}) {
  const slotFiles = Array.isArray(form.imageFiles) ? form.imageFiles : []
  const remoteSlots = [
    form.imageUrl || null,
    ...(Array.isArray(form.imageUrls) ? form.imageUrls : []),
  ]

  const slotCount = Math.max(4, slotFiles.length, remoteSlots.length)
  const urls = []

  for (let i = 0; i < slotCount; i++) {
    const file = slotFiles[i]
    if (typeof File !== 'undefined' && file instanceof File) {
      const uploaded = await vendorUploadService.uploadImage(file, requestOptions)
      const url = uploaded?.data?.url
      if (!url) {
        throw new ApiError({
          message: 'Image upload failed. Product was not saved.',
        })
      }
      urls.push(String(url))
      continue
    }

    const remote = remoteSlots[i]
    if (isPersistedImageUrl(remote)) {
      urls.push(String(remote).trim())
    }
  }

  const unique = []
  for (const url of urls) {
    if (!unique.includes(url)) unique.push(url)
  }

  return {
    imageUrl: unique[0] || null,
    imageUrls: unique,
  }
}

/**
 * Vendor catalog service (catalog-scoped).
 * Confirmed:
 *   GET /vendor-panel/catalog/store-types
 *   GET /vendor-panel/catalog/store-types/:id/badges
 *   GET /vendor-panel/catalog/categories?platformCategoryId=
 *   GET /vendor-panel/catalog/products?platformCategoryId=
 *   GET /vendor-panel/catalog/products/:productId
 *   POST /vendor-panel/catalog/products
 *   PATCH /vendor-panel/catalog/products/:productId
 *   POST /vendor-panel/catalog/uploads/images (multipart file → data.url)
 */
export const productService = {
  /**
   * GET /vendor-panel/catalog/store-types
   * @returns {{ data: { selectedStoreTypeId: string|null, items: object[] }, meta }}
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
   * GET /vendor-panel/catalog/store-types/:id/badges
   */
  async getCatalogBadges(storeTypeId, options = {}) {
    const id = String(storeTypeId || '').trim()
    if (!id) {
      return { data: [], meta: null }
    }

    const response = await apiClient.get(endpoints.vendor.catalog.storeTypeBadges(id), {
      ...options,
      scope: 'vendor',
    })

    return {
      data: mapVendorCatalogBadgesResponse(response?.data),
      meta: response?.meta ?? null,
    }
  },

  /**
   * GET /vendor-panel/catalog/categories?platformCategoryId=
   */
  async getCatalogCategories(options = {}) {
    const { platformCategoryId, storeTypeId, params, ...requestOptions } = options
    const query = { ...(params || {}) }
    const catalogId = platformCategoryId || storeTypeId
    if (catalogId) query.platformCategoryId = String(catalogId)

    const response = await apiClient.get(endpoints.vendor.catalog.categories, {
      ...requestOptions,
      params: query,
      scope: 'vendor',
    })

    const tree = mapVendorCatalogCategoriesResponse(response?.data)

    return {
      data: {
        items: tree,
        options: flattenVendorCatalogCategories(tree),
        source: response?.data?.source || null,
      },
      meta: response?.meta ?? null,
    }
  },

  /**
   * GET /vendor-panel/catalog/products?platformCategoryId=
   * When platformCategoryId is set, do not fall back to unfiltered list.
   */
  async getCatalogProducts(options = {}) {
    const {
      platformCategoryId,
      storeTypeId,
      platformCategory,
      categoryId,
      params,
      ...requestOptions
    } = options
    const query = { ...(params || {}) }
    const catalogId = platformCategoryId || storeTypeId || null
    if (catalogId) query.platformCategoryId = String(catalogId)
    if (categoryId) query.categoryId = String(categoryId)

    const response = await apiClient.get(endpoints.vendor.catalog.products, {
      ...requestOptions,
      params: query,
      scope: 'vendor',
    })

    let items = mapVendorCatalogProductsResponse(response?.data)

    // Client-side name filter only when API filter wasn't used (legacy).
    if (!catalogId && platformCategory && items.length > 0) {
      const needle = String(platformCategory).trim().toLowerCase()
      items = items.filter((item) => {
        const name = String(item.platformCategoryName || '').toLowerCase()
        if (!name) return false
        return name === needle || name.includes(needle)
      })
    }

    if (categoryId && items.length > 0) {
      const id = String(categoryId)
      items = items.filter(
        (item) =>
          item.catalogCategoryId === id ||
          String(item.catalogCategoryName || '').toLowerCase() === id.toLowerCase(),
      )
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
   * Uploads selected imageFiles first, then sends imageUrl + imageUrls.
   * Requires platformCategoryId (or storeTypeId alias).
   */
  async createProduct(form = {}, options = {}) {
    const { catalogCategoryId, platformCategoryId, storeTypeId, params, ...requestOptions } =
      options

    const images = await resolveProductImageFields(form, requestOptions)

    const body = buildVendorCreateProductBody(
      {
        ...form,
        imageUrl: images.imageUrl,
        imageUrls: images.imageUrls,
      },
      {
        catalogCategoryId,
        platformCategoryId: platformCategoryId || storeTypeId || form.platformCategoryId,
      },
    )

    if (!body.platformCategoryId) {
      throw new Error('platformCategoryId is required to create a product.')
    }

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

  /**
   * PATCH /vendor-panel/catalog/products/:productId
   * Uploads new imageFiles; keeps existing imageUrl/imageUrls when no new file in a slot.
   */
  async updateProduct(productId, form = {}, options = {}) {
    const id = String(productId || '').trim()
    if (!id) throw new Error('Product id is required.')

    const { catalogCategoryId, platformCategoryId, storeTypeId, params, ...requestOptions } =
      options

    const images = await resolveProductImageFields(form, requestOptions)

    const body = buildVendorUpdateProductBody(
      {
        ...form,
        imageUrl: images.imageUrl,
        imageUrls: images.imageUrls,
      },
      {
        catalogCategoryId,
        platformCategoryId: platformCategoryId || storeTypeId || form.platformCategoryId,
      },
    )

    // Always send image fields on update so cleared/replaced images persist.
    body.imageUrls = images.imageUrls
    if (images.imageUrl) {
      body.imageUrl = images.imageUrl
    } else {
      body.imageUrl = null
    }

    const response = await apiClient.patch(endpoints.vendor.catalog.product(id), body, {
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
