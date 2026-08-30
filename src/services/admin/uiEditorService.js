import { apiClient } from '../../api/client'
import { apiConfig, isAdminRealApiFeature } from '../../api/config'
import { endpoints } from '../../api/endpoints'
import {
  mapAdminCreateHomeCategoryRequest,
  mapAdminPatchHomeCategoryRequest,
  mapAdminReorderHomeCategoriesRequest,
  mapAdminUiEditorApps,
  mapAdminUiEditorBannerDetail,
  mapAdminUiEditorBanners,
  mapAdminUiEditorBannersMeta,
  mapAdminUiEditorBannerTargets,
  mapAdminUiEditorCatalog,
  mapAdminUiEditorHelpPage,
  mapAdminUiEditorHomeCategories,
  mapAdminUiEditorHomePreview,
  mapAdminUiEditorPages,
  mapAdminUiEditorPlacements,
  mapAdminUiEditorPreview,
  mapAdminUiEditorPublishRequest,
  mapAdminUiEditorScreenMap,
  mapAdminUpdateBannerRequest,
  mapAdminCreateBannerRequest,
  mapAdminUpsertHelpPageRequest,
  mapAdminUiEditorExclusiveOffers,
  mapAdminExclusiveOfferProducts,
  mapAdminUpdateExclusiveSectionRequest,
  mapAdminAddExclusiveOfferItemsRequest,
  mapAdminReorderExclusiveOfferItemsRequest,
  mapAdminPatchExclusiveOfferItemRequest,
} from '../../mappers/admin/mapAdminUiEditor'
import { adminHomeCatalogMock } from '../../mocks/admin.mock'

function useRealUiEditorApi() {
  return isAdminRealApiFeature('ui-editor') || !apiConfig.adminUseMockApi
}

function requestOptions(options = {}) {
  return {
    ...options,
    scope: 'admin',
    feature: 'ui-editor',
    forceReal: !apiConfig.adminUseMockApi,
  }
}

/**
 * Admin UI Editor.
 *
 * Confirmed (Postman 17 — Banners & ads):
 *   GET    /admin/ui-editor/placements?app=&screen=
 *   GET    /admin/ui-editor/preview?app=&screen=
 *   GET    /admin/ui-editor/banners/meta?app=
 *   GET    /admin/ui-editor/banners/targets?tapAction=
 *   GET    /admin/ui-editor/banners?app=&status=
 *   POST   /admin/ui-editor/banners
 *   GET    /admin/ui-editor/banners/:id
 *   PATCH  /admin/ui-editor/banners/:id
 *   DELETE /admin/ui-editor/banners/:id
 */
export const adminUiEditorService = {
  async getApps(options = {}) {
    if (!useRealUiEditorApi()) return { data: { apps: [] }, meta: null }

    const response = await apiClient.get(endpoints.admin.uiEditor.apps, requestOptions(options))
    return {
      data: mapAdminUiEditorApps(response?.data),
      meta: response?.meta ?? null,
    }
  },

  async getScreenMap(app = 'CUSTOMER', options = {}) {
    if (!useRealUiEditorApi()) return { data: { screens: [] }, meta: null }

    const response = await apiClient.get(endpoints.admin.uiEditor.screenMap, {
      ...requestOptions(options),
      params: { app: String(app || 'CUSTOMER').toUpperCase(), ...(options.params || {}) },
    })
    return {
      data: mapAdminUiEditorScreenMap(response?.data),
      meta: response?.meta ?? null,
    }
  },

  async getPlacements(app = 'CUSTOMER', screen = 'home', options = {}) {
    if (!useRealUiEditorApi()) return { data: { slots: [], screens: [] }, meta: null }

    const response = await apiClient.get(endpoints.admin.uiEditor.placements, {
      ...requestOptions(options),
      params: {
        app: String(app || 'CUSTOMER').toUpperCase(),
        screen: String(screen || 'home'),
        ...(options.params || {}),
      },
    })
    return {
      data: mapAdminUiEditorPlacements(response?.data),
      meta: response?.meta ?? null,
    }
  },

  async getPreview(app = 'CUSTOMER', screen = 'home', options = {}) {
    if (!useRealUiEditorApi()) {
      throw new Error('UI Editor API is not enabled.')
    }

    const response = await apiClient.get(endpoints.admin.uiEditor.preview, {
      ...requestOptions(options),
      params: {
        app: String(app || 'CUSTOMER').toUpperCase(),
        screen: String(screen || 'home'),
        ...(options.params || {}),
      },
    })
    return {
      data: mapAdminUiEditorPreview(response?.data),
      meta: response?.meta ?? null,
      raw: response?.data ?? null,
    }
  },

  async getBannersMeta(app = 'CUSTOMER', options = {}) {
    if (!useRealUiEditorApi()) {
      return { data: { screens: [], placements: [], bannerTypes: [], statuses: [] }, meta: null }
    }

    const response = await apiClient.get(endpoints.admin.uiEditor.banners.meta, {
      ...requestOptions(options),
      params: { app: String(app || 'CUSTOMER').toUpperCase(), ...(options.params || {}) },
    })
    return {
      data: mapAdminUiEditorBannersMeta(response?.data),
      meta: response?.meta ?? null,
    }
  },

  async getBannerTargets(tapAction = 'OPEN_STORE', options = {}) {
    if (!useRealUiEditorApi()) return { data: { targets: [] }, meta: null }

    const response = await apiClient.get(endpoints.admin.uiEditor.banners.targets, {
      ...requestOptions(options),
      params: {
        tapAction: String(tapAction || 'OPEN_STORE').toUpperCase(),
        ...(options.params || {}),
      },
    })
    return {
      data: mapAdminUiEditorBannerTargets(response?.data),
      meta: response?.meta ?? null,
    }
  },

  async listBanners(app = 'CUSTOMER', status = 'all', options = {}) {
    if (!useRealUiEditorApi()) return { data: { banners: [] }, meta: null }

    const response = await apiClient.get(endpoints.admin.uiEditor.banners.list, {
      ...requestOptions(options),
      params: {
        app: String(app || 'CUSTOMER').toUpperCase(),
        status,
        ...(options.params || {}),
      },
    })
    return {
      data: mapAdminUiEditorBanners(response?.data),
      meta: response?.meta ?? null,
    }
  },

  async getBanner(bannerId, options = {}) {
    if (!useRealUiEditorApi()) {
      throw new Error('UI Editor API is not enabled.')
    }
    const id = String(bannerId || '').trim()
    if (!id) throw new Error('Banner id is required.')

    const response = await apiClient.get(endpoints.admin.uiEditor.banners.detail(id), requestOptions(options))
    return {
      data: mapAdminUiEditorBannerDetail(response?.data),
      meta: response?.meta ?? null,
      raw: response?.data ?? null,
    }
  },

  async createBanner(form, { appTarget = 'CUSTOMER', placements = [] } = {}, options = {}) {
    if (!useRealUiEditorApi()) {
      throw new Error('UI Editor API is not enabled.')
    }

    const body = mapAdminCreateBannerRequest(form, { appTarget, placements })
    const response = await apiClient.post(
      endpoints.admin.uiEditor.banners.create,
      body,
      requestOptions(options),
    )
    const mapped =
      mapAdminUiEditorBannerDetail(response?.data) ||
      mapAdminUiEditorBannerDetail({ ...body, id: response?.data?.id })
    // Keep the uploaded imageUrl even if the create response omits it.
    if (mapped && !mapped.imageUrl && body.imageUrl) {
      mapped.imageUrl = body.imageUrl
    }
    return {
      data: mapped,
      meta: response?.meta ?? null,
      raw: response?.data ?? null,
    }
  },

  async updateBanner(bannerId, form, { appTarget = 'CUSTOMER', placements = [] } = {}, options = {}) {
    if (!useRealUiEditorApi()) {
      throw new Error('UI Editor API is not enabled.')
    }
    const id = String(bannerId || '').trim()
    if (!id) throw new Error('Banner id is required.')

    const body = mapAdminUpdateBannerRequest(form, { appTarget, placements })
    const response = await apiClient.patch(
      endpoints.admin.uiEditor.banners.detail(id),
      body,
      requestOptions(options),
    )
    const mapped =
      mapAdminUiEditorBannerDetail(response?.data) ||
      mapAdminUiEditorBannerDetail({ ...body, id })
    if (mapped && !mapped.imageUrl && body.imageUrl) {
      mapped.imageUrl = body.imageUrl
    }
    return {
      data: mapped,
      meta: response?.meta ?? null,
      raw: response?.data ?? null,
    }
  },

  async deleteBanner(bannerId, options = {}) {
    if (!useRealUiEditorApi()) {
      throw new Error('UI Editor API is not enabled.')
    }
    const id = String(bannerId || '').trim()
    if (!id) throw new Error('Banner id is required.')

    const response = await apiClient.delete(
      endpoints.admin.uiEditor.banners.detail(id),
      requestOptions(options),
    )
    return {
      data: response?.data ?? { id, deleted: true },
      meta: response?.meta ?? null,
    }
  },

  async publish(app = 'CUSTOMER', options = {}) {
    if (!useRealUiEditorApi()) {
      throw new Error('UI Editor API is not enabled.')
    }

    const body = mapAdminUiEditorPublishRequest(app)
    const response = await apiClient.post(
      endpoints.admin.uiEditor.publish,
      body,
      requestOptions(options),
    )
    return {
      data: response?.data ?? body,
      meta: response?.meta ?? null,
    }
  },

  async getHomePreview(options = {}) {
    if (!useRealUiEditorApi()) return { data: { categories: [] }, meta: null }

    const response = await apiClient.get(
      endpoints.admin.uiEditor.home.preview,
      requestOptions(options),
    )
    return {
      data: mapAdminUiEditorHomePreview(response?.data),
      meta: response?.meta ?? null,
    }
  },

  async getHomeCatalog(options = {}) {
    if (!useRealUiEditorApi()) {
      return {
        data: {
          storeTypes: adminHomeCatalogMock.storeTypes,
          orderModes: adminHomeCatalogMock.orderModes,
        },
        meta: null,
      }
    }
    const response = await apiClient.get(
      endpoints.admin.uiEditor.home.catalog,
      requestOptions(options),
    )
    return { data: response?.data || { storeTypes: [], orderModes: [] }, meta: response?.meta ?? null }
  },

  async getHomeCategories(options = {}) {
    if (!useRealUiEditorApi()) return { data: { categories: [] }, meta: null }

    const response = await apiClient.get(
      endpoints.admin.uiEditor.home.categories,
      requestOptions(options),
    )
    return {
      data: mapAdminUiEditorHomeCategories(response?.data),
      meta: response?.meta ?? null,
    }
  },

  async createHomeCategory(input = {}, options = {}) {
    if (!useRealUiEditorApi()) {
      throw new Error('UI Editor API is not enabled.')
    }

    const body = mapAdminCreateHomeCategoryRequest(input)
    const response = await apiClient.post(
      endpoints.admin.uiEditor.home.categories,
      body,
      requestOptions(options),
    )
    const mapped = mapAdminUiEditorHomeCategories(
      response?.data?.categories
        ? response.data
        : { categories: [response?.data || { ...body, id: response?.data?.id }] },
    )
    return {
      data: mapped.categories[0] || null,
      categories: mapped.categories,
      meta: response?.meta ?? null,
      raw: response?.data ?? null,
    }
  },

  async reorderHomeCategories(categories = [], options = {}) {
    if (!useRealUiEditorApi()) {
      throw new Error('UI Editor API is not enabled.')
    }

    const body = mapAdminReorderHomeCategoriesRequest(categories)
    const response = await apiClient.patch(
      endpoints.admin.uiEditor.home.categoriesReorder,
      body,
      requestOptions(options),
    )
    return {
      data: mapAdminUiEditorHomeCategories(response?.data),
      meta: response?.meta ?? null,
      raw: response?.data ?? null,
    }
  },

  async patchHomeCategory(categoryId, patch = {}, options = {}) {
    if (!useRealUiEditorApi()) {
      throw new Error('UI Editor API is not enabled.')
    }
    const id = String(categoryId || '').trim()
    if (!id) throw new Error('Category id is required.')

    const body = mapAdminPatchHomeCategoryRequest(patch)
    const response = await apiClient.patch(
      endpoints.admin.uiEditor.home.category(id),
      body,
      requestOptions(options),
    )
    const mapped = mapAdminUiEditorHomeCategories(
      response?.data?.categories
        ? response.data
        : { categories: [response?.data || { ...body, id }] },
    )
    return {
      data: mapped.categories[0] || null,
      meta: response?.meta ?? null,
      raw: response?.data ?? null,
    }
  },

  async deleteHomeCategory(categoryId, options = {}) {
    if (!useRealUiEditorApi()) {
      throw new Error('UI Editor API is not enabled.')
    }
    const id = String(categoryId || '').trim()
    if (!id) throw new Error('Category id is required.')

    const response = await apiClient.delete(
      endpoints.admin.uiEditor.home.category(id),
      requestOptions(options),
    )
    return {
      data: response?.data ?? { deleted: true, id },
      meta: response?.meta ?? null,
      raw: response?.data ?? null,
    }
  },

  async cleanupHomeCategories(options = {}) {
    if (!useRealUiEditorApi()) {
      throw new Error('UI Editor API is not enabled.')
    }

    const response = await apiClient.post(
      endpoints.admin.uiEditor.home.categoriesCleanup,
      {},
      requestOptions(options),
    )
    return {
      data: mapAdminUiEditorHomeCategories(response?.data),
      meta: response?.meta ?? null,
      raw: response?.data ?? null,
    }
  },

  async publishHomeCategories(options = {}) {
    if (!useRealUiEditorApi()) {
      throw new Error('UI Editor API is not enabled.')
    }

    const response = await apiClient.post(
      endpoints.admin.uiEditor.home.categoriesPublish,
      {},
      requestOptions(options),
    )
    return {
      data: response?.data ?? { published: true },
      meta: response?.meta ?? null,
    }
  },

  async getCatalog(options = {}) {
    if (!useRealUiEditorApi()) return { data: { items: [] }, meta: null }

    const response = await apiClient.get(
      endpoints.admin.uiEditor.catalog,
      requestOptions(options),
    )
    return {
      data: mapAdminUiEditorCatalog(response?.data),
      meta: response?.meta ?? null,
    }
  },

  async listPages(status = 'all', options = {}) {
    if (!useRealUiEditorApi()) return { data: { pages: [] }, meta: null }

    const response = await apiClient.get(endpoints.admin.uiEditor.pages.list, {
      ...requestOptions(options),
      params: { status, ...(options.params || {}) },
    })
    return {
      data: mapAdminUiEditorPages(response?.data),
      meta: response?.meta ?? null,
    }
  },

  async ensurePages(options = {}) {
    if (!useRealUiEditorApi()) {
      throw new Error('UI Editor API is not enabled.')
    }

    const response = await apiClient.post(
      endpoints.admin.uiEditor.pages.ensure,
      {},
      requestOptions(options),
    )
    return {
      data: mapAdminUiEditorPages(response?.data),
      meta: response?.meta ?? null,
      raw: response?.data ?? null,
    }
  },

  async getHelpPage(options = {}) {
    if (!useRealUiEditorApi()) {
      return {
        data: mapAdminUiEditorHelpPage({
          title: 'Help & Support',
          isPublished: false,
          content: { title: 'Help & Support', subtitle: '', supportEmail: '', topics: [], faq: [] },
        }),
        meta: null,
      }
    }

    const response = await apiClient.get(
      endpoints.admin.uiEditor.pages.help,
      requestOptions(options),
    )
    return {
      data: mapAdminUiEditorHelpPage(response?.data),
      meta: response?.meta ?? null,
    }
  },

  async upsertHelpPage(input = {}, options = {}) {
    if (!useRealUiEditorApi()) {
      throw new Error('UI Editor API is not enabled.')
    }

    const body = mapAdminUpsertHelpPageRequest(input)
    const response = await apiClient.put(
      endpoints.admin.uiEditor.pages.help,
      body,
      requestOptions(options),
    )
    return {
      data: mapAdminUiEditorHelpPage(response?.data || body),
      meta: response?.meta ?? null,
      raw: response?.data ?? null,
    }
  },

  async publishHelpPage(options = {}) {
    if (!useRealUiEditorApi()) {
      throw new Error('UI Editor API is not enabled.')
    }

    const response = await apiClient.post(
      endpoints.admin.uiEditor.pages.helpPublish,
      {},
      requestOptions(options),
    )
    return {
      data: response?.data ?? { published: true },
      meta: response?.meta ?? null,
    }
  },

  async unpublishHelpPage(options = {}) {
    if (!useRealUiEditorApi()) {
      throw new Error('UI Editor API is not enabled.')
    }

    const response = await apiClient.post(
      endpoints.admin.uiEditor.pages.helpUnpublish,
      {},
      requestOptions(options),
    )
    return {
      data: response?.data ?? { published: false },
      meta: response?.meta ?? null,
    }
  },

  async getExclusiveOffers(options = {}) {
    if (!useRealUiEditorApi()) return { data: { section: {}, summary: {}, items: [] }, meta: null }

    const response = await apiClient.get(
      endpoints.admin.uiEditor.home.exclusiveOffers,
      requestOptions(options),
    )
    return {
      data: mapAdminUiEditorExclusiveOffers(response?.data),
      meta: response?.meta ?? null,
    }
  },

  async updateExclusiveOffersSection(patch = {}, options = {}) {
    if (!useRealUiEditorApi()) {
      throw new Error('UI Editor API is not enabled.')
    }

    const body = mapAdminUpdateExclusiveSectionRequest(patch)
    const response = await apiClient.patch(
      endpoints.admin.uiEditor.home.exclusiveOffers,
      body,
      requestOptions(options),
    )
    return {
      data: mapAdminUiEditorExclusiveOffers(response?.data),
      meta: response?.meta ?? null,
      raw: response?.data ?? null,
    }
  },

  async searchExclusiveOfferProducts(params = {}, options = {}) {
    if (!useRealUiEditorApi()) return { data: { products: [], total: 0 }, meta: null }

    const response = await apiClient.get(
      endpoints.admin.uiEditor.home.exclusiveOffersProducts,
      {
        ...requestOptions(options),
        params: {
          search: params.search || undefined,
          page: params.page || 1,
          limit: params.limit || 20,
          vendorId: params.vendorId || undefined,
          storeTypeId: params.storeTypeId || undefined,
          availableOnly: params.availableOnly === false ? false : params.availableOnly || undefined,
          includeSelected: params.includeSelected || undefined,
          ...(options.params || {}),
        },
      },
    )
    return {
      data: mapAdminExclusiveOfferProducts(response?.data),
      meta: response?.meta ?? null,
    }
  },

  async addExclusiveOfferItems(input = {}, options = {}) {
    if (!useRealUiEditorApi()) {
      throw new Error('UI Editor API is not enabled.')
    }

    const body = mapAdminAddExclusiveOfferItemsRequest(input)
    const response = await apiClient.post(
      endpoints.admin.uiEditor.home.exclusiveOffersItems,
      body,
      requestOptions(options),
    )
    return {
      data: mapAdminUiEditorExclusiveOffers(response?.data),
      meta: response?.meta ?? null,
      raw: response?.data ?? null,
    }
  },

  async reorderExclusiveOfferItems(items = [], options = {}) {
    if (!useRealUiEditorApi()) {
      throw new Error('UI Editor API is not enabled.')
    }

    const body = mapAdminReorderExclusiveOfferItemsRequest(items)
    const response = await apiClient.patch(
      endpoints.admin.uiEditor.home.exclusiveOffersItemsReorder,
      body,
      requestOptions(options),
    )
    return {
      data: mapAdminUiEditorExclusiveOffers(response?.data),
      meta: response?.meta ?? null,
      raw: response?.data ?? null,
    }
  },

  async patchExclusiveOfferItem(itemId, patch = {}, options = {}) {
    if (!useRealUiEditorApi()) {
      throw new Error('UI Editor API is not enabled.')
    }
    const id = String(itemId || '').trim()
    if (!id) throw new Error('Exclusive offer item id is required.')

    const body = mapAdminPatchExclusiveOfferItemRequest(patch)
    const response = await apiClient.patch(
      endpoints.admin.uiEditor.home.exclusiveOfferItem(id),
      body,
      requestOptions(options),
    )
    return {
      data: mapAdminUiEditorExclusiveOffers(response?.data),
      meta: response?.meta ?? null,
      raw: response?.data ?? null,
    }
  },

  async deleteExclusiveOfferItem(itemId, options = {}) {
    if (!useRealUiEditorApi()) {
      throw new Error('UI Editor API is not enabled.')
    }
    const id = String(itemId || '').trim()
    if (!id) throw new Error('Exclusive offer item id is required.')

    const response = await apiClient.delete(
      endpoints.admin.uiEditor.home.exclusiveOfferItem(id),
      requestOptions(options),
    )
    return {
      data: mapAdminUiEditorExclusiveOffers(response?.data),
      meta: response?.meta ?? null,
      raw: response?.data ?? null,
    }
  },

  async publishExclusiveOffers(options = {}) {
    if (!useRealUiEditorApi()) {
      throw new Error('UI Editor API is not enabled.')
    }

    const response = await apiClient.post(
      endpoints.admin.uiEditor.home.exclusiveOffersPublish,
      {},
      requestOptions(options),
    )
    return {
      data: mapAdminUiEditorExclusiveOffers(response?.data),
      meta: response?.meta ?? null,
      raw: response?.data ?? null,
    }
  },
}
