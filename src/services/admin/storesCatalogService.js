import { apiClient } from '../../api/client'
import { endpoints } from '../../api/endpoints'

function money(value) {
  if (value == null || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function mapProduct(raw) {
  if (!raw || typeof raw !== 'object') return null
  return {
    id: raw.id,
    name: raw.name || '',
    nameAr: raw.nameAr || '',
    price: money(raw.price) ?? 0,
    imageUrl: raw.imageUrl || null,
    isActive: raw.isActive !== false,
    isAvailable: raw.isAvailable !== false,
    availableFrom: raw.availableFrom || '',
    availableTo: raw.availableTo || '',
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

/**
 * Admin product catalog (availability windows).
 * Confirmed: GET/PATCH /admin/stores/products*
 */
export const adminStoresCatalogService = {
  async listProducts(options = {}) {
    const { search, vendorId, page = 1, limit = 20, ...requestOptions } = options
    const params = { page, limit }
    if (search) params.search = String(search).trim()
    if (vendorId) params.vendorId = String(vendorId).trim()

    const response = await apiClient.get(endpoints.admin.storesCatalog.products, {
      ...requestOptions,
      params,
      scope: 'admin',
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
      ...options,
      scope: 'admin',
    })
    return mapProduct(response?.data ?? response)
  },

  async updateProduct(productId, body, options = {}) {
    const id = String(productId || '').trim()
    const response = await apiClient.patch(endpoints.admin.storesCatalog.product(id), body, {
      ...options,
      scope: 'admin',
    })
    return mapProduct(response?.data ?? response)
  },
}
