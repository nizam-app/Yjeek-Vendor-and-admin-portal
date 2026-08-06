import { apiClient } from '../../api/client'
import { endpoints } from '../../api/endpoints'
import {
  mapVendorPromotionAnalyticsResponse,
  mapVendorPromotionDetailResponse,
  mapVendorPromotionsResponse,
  mapVendorPromotionsSummaryResponse,
  mapVendorCreatePromotionRequest,
  mapVendorUpdatePromotionRequest,
  PROMOTION_FILTERS,
} from '../../mappers/vendor/mapVendorPromotions'

/**
 * Vendor promotions service.
 * Confirmed:
 *   GET /vendor-panel/promotions
 *   POST /vendor-panel/promotions
 *   GET /vendor-panel/promotions/summary
 *   GET /vendor-panel/promotions/:promotionId
 *   GET /vendor-panel/promotions/:promotionId/analytics
 *   PATCH /vendor-panel/promotions/:promotionId
 *   PATCH /vendor-panel/promotions/:promotionId/pause
 */
export const promotionService = {
  /**
   * GET /vendor-panel/promotions?status=&type=&search=
   */
  async getPromotionList(options = {}) {
    const { status, type, search, params, signal, ...rest } = options
    const query = { ...(params || {}) }

    const statusValue = String(status || '')
      .trim()
      .toLowerCase()
    if (statusValue && statusValue !== 'all') {
      query.status = statusValue
    }

    const typeValue = String(type || '').trim().toUpperCase()
    if (typeValue) {
      query.type = typeValue
    }

    const searchTerm = String(search || '').trim()
    if (searchTerm) {
      query.search = searchTerm
    }

    const response = await apiClient.get(endpoints.vendor.promotions.list, {
      ...rest,
      signal,
      params: query,
      scope: 'vendor',
    })

    const mapped = mapVendorPromotionsResponse(response?.data)

    return {
      data: mapped.items,
      meta: {
        ...(response?.meta || {}),
        count: mapped.count,
      },
    }
  },

  /**
   * GET /vendor-panel/promotions/summary
   */
  async getPromotionSummary(options = {}) {
    const response = await apiClient.get(endpoints.vendor.promotions.summary, {
      ...options,
      scope: 'vendor',
    })

    return {
      data: mapVendorPromotionsSummaryResponse(response?.data),
      meta: response?.meta ?? null,
    }
  },

  /**
   * GET /vendor-panel/promotions/:promotionId
   */
  async getPromotion(promotionId, options = {}) {
    const id = String(promotionId || '').trim()
    if (!id) {
      return { data: null, meta: null }
    }

    const response = await apiClient.get(endpoints.vendor.promotions.detail(id), {
      ...options,
      scope: 'vendor',
    })

    return {
      data: mapVendorPromotionDetailResponse(response?.data),
      meta: response?.meta ?? null,
    }
  },

  /**
   * GET /vendor-panel/promotions/:promotionId/analytics
   * Primary payload for the promotion detail page.
   */
  async getPromotionAnalytics(promotionId, options = {}) {
    const id = String(promotionId || '').trim()
    if (!id) {
      return { data: null, meta: null }
    }

    const response = await apiClient.get(endpoints.vendor.promotions.analytics(id), {
      ...options,
      scope: 'vendor',
    })

    return {
      data: mapVendorPromotionAnalyticsResponse(response?.data),
      meta: response?.meta ?? null,
    }
  },

  /**
   * Detail page loader: analytics first, fall back to Get if analytics fails.
   */
  async getPromotionDetailPage(promotionId, options = {}) {
    const id = String(promotionId || '').trim()
    if (!id) {
      return { data: null, meta: null }
    }

    try {
      return await this.getPromotionAnalytics(id, options)
    } catch {
      return this.getPromotion(id, options)
    }
  },

  /**
   * POST /vendor-panel/promotions
   * Confirmed Postman Create (minimal `{ name }` or full type body).
   */
  async createPromotion(form = {}, options = {}) {
    const body = mapVendorCreatePromotionRequest(form)
    const response = await apiClient.post(endpoints.vendor.promotions.create, body, {
      ...options,
      scope: 'vendor',
    })

    return {
      data: mapVendorPromotionDetailResponse(response?.data),
      meta: response?.meta ?? null,
    }
  },

  /**
   * PATCH /vendor-panel/promotions/:promotionId
   * Confirmed Postman Update (Item/category | Free delivery | Buy X Get Y).
   */
  async updatePromotion(promotionId, form = {}, options = {}) {
    const id = String(promotionId || '').trim()
    if (!id) {
      throw new Error('Promotion id is required.')
    }

    const body = mapVendorUpdatePromotionRequest(form)
    const response = await apiClient.patch(endpoints.vendor.promotions.update(id), body, {
      ...options,
      scope: 'vendor',
    })

    return {
      data: mapVendorPromotionDetailResponse(response?.data),
      meta: response?.meta ?? null,
    }
  },

  /**
   * PATCH /vendor-panel/promotions/:promotionId/pause
   * Toggle body: { isPaused: true } to pause, { isPaused: false } to resume.
   *
   * @param {string} promotionId
   * @param {boolean} [isPaused=true]
   * @param {object} [options]
   */
  async pausePromotion(promotionId, isPaused = true, options = {}) {
    const id = String(promotionId || '').trim()
    if (!id) {
      throw new Error('Promotion id is required.')
    }

    // Support pausePromotion(id, options) legacy call shape
    let paused = isPaused
    let requestOptions = options
    if (isPaused && typeof isPaused === 'object' && !Array.isArray(isPaused)) {
      requestOptions = isPaused
      paused = true
    }

    const response = await apiClient.patch(
      endpoints.vendor.promotions.pause(id),
      { isPaused: Boolean(paused) },
      {
        ...requestOptions,
        scope: 'vendor',
      },
    )

    return {
      data: mapVendorPromotionDetailResponse(response?.data),
      meta: response?.meta ?? null,
    }
  },

  /**
   * Combined page payload for Promotions list UI.
   * Fetches list + summary in parallel.
   */
  async getPromotions(options = {}) {
    const [listResult, summaryResult] = await Promise.all([
      this.getPromotionList(options).catch((error) => {
        throw error
      }),
      this.getPromotionSummary().catch(() => ({
        data: mapVendorPromotionsSummaryResponse(null),
      })),
    ])

    return {
      data: {
        promotions: listResult.data || [],
        kpis: summaryResult.data || [],
        filters: PROMOTION_FILTERS,
      },
      meta: {
        ...(listResult.meta || {}),
        count: listResult.meta?.count ?? (listResult.data || []).length,
      },
    }
  },
}
