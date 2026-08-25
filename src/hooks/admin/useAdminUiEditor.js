import { useMemo } from 'react'
import { apiConfig, isAdminRealApiFeature } from '../../api/config'
import { useApiResource } from '../useApiResource'
import { adminUiEditorService } from '../../services/admin/uiEditorService'

/**
 * UI Editor — apps list (Customer / Champ switcher).
 */
export function useAdminUiEditorApps() {
  const enabled = isAdminRealApiFeature('ui-editor') || !apiConfig.adminUseMockApi

  const resource = useApiResource(() => {
    if (!enabled) return Promise.resolve({ data: { apps: [] }, meta: null })
    return adminUiEditorService.getApps()
  }, [enabled])

  return {
    ...resource,
    enabled,
    apps: resource.data?.apps || [],
  }
}

/**
 * UI Editor — screen map for selected app.
 * @param {string} appKey CUSTOMER | CHAMP
 */
export function useAdminUiEditorScreenMap(appKey) {
  const enabled = isAdminRealApiFeature('ui-editor') || !apiConfig.adminUseMockApi
  const app = String(appKey || 'CUSTOMER').toUpperCase()

  const resource = useApiResource(() => {
    if (!enabled) return Promise.resolve({ data: { screens: [] }, meta: null })
    return adminUiEditorService.getScreenMap(app)
  }, [enabled, app])

  return {
    ...resource,
    enabled,
    screens: resource.data?.screens || [],
    apps: resource.data?.apps || [],
    app: resource.data?.app || app,
  }
}

/**
 * UI Editor — placements for banners tab.
 * @param {string} appKey
 * @param {string} screen
 */
export function useAdminUiEditorPlacements(appKey, screen) {
  const enabled = isAdminRealApiFeature('ui-editor') || !apiConfig.adminUseMockApi
  const app = String(appKey || 'CUSTOMER').toUpperCase()
  const screenKey = String(screen || 'home')

  const resource = useApiResource(() => {
    if (!enabled) return Promise.resolve({ data: { slots: [], screens: [] }, meta: null })
    return adminUiEditorService.getPlacements(app, screenKey)
  }, [enabled, app, screenKey])

  return {
    ...resource,
    enabled,
    slots: resource.data?.slots || [],
    screens: resource.data?.screens || [],
  }
}

/**
 * UI Editor — banners table + meta.
 * @param {string} appKey
 */
export function useAdminUiEditorBanners(appKey) {
  const enabled = isAdminRealApiFeature('ui-editor') || !apiConfig.adminUseMockApi
  const app = String(appKey || 'CUSTOMER').toUpperCase()

  const resource = useApiResource(() => {
    if (!enabled) return Promise.resolve({ data: { banners: [] }, meta: null })
    return adminUiEditorService.listBanners(app, 'all')
  }, [enabled, app])

  const metaResource = useApiResource(() => {
    if (!enabled) {
      return Promise.resolve({
        data: { screens: [], placements: [], bannerTypes: [], statuses: [] },
        meta: null,
      })
    }
    return adminUiEditorService.getBannersMeta(app)
  }, [enabled, app])

  return {
    ...resource,
    enabled,
    banners: resource.data?.banners || [],
    count: resource.data?.count ?? (resource.data?.banners || []).length,
    meta: metaResource.data || { screens: [], placements: [], bannerTypes: [], statuses: [] },
    metaLoading: metaResource.isLoading,
    metaError: metaResource.error,
    refetchMeta: metaResource.refetch,
  }
}

/**
 * UI Editor — home categories (+ home preview fallback).
 */
export function useAdminUiEditorHomeCategories() {
  const enabled = isAdminRealApiFeature('ui-editor') || !apiConfig.adminUseMockApi

  const resource = useApiResource(() => {
    if (!enabled) return Promise.resolve({ data: { categories: [] }, meta: null })
    return adminUiEditorService.getHomeCategories()
  }, [enabled])

  const previewResource = useApiResource(() => {
    if (!enabled) return Promise.resolve({ data: { categories: [] }, meta: null })
    return adminUiEditorService.getHomePreview()
  }, [enabled])

  // Home grid must come only from home_entries (ref_id FK). Do not fall back to
  // getHomePreview().categories — that lists raw Store Management rows without home FK.
  const categories = useMemo(() => resource.data?.categories || [], [resource.data])

  return {
    ...resource,
    enabled,
    categories,
    preview: previewResource.data,
    previewLoading: previewResource.isLoading,
    previewError: previewResource.error,
    refetchPreview: previewResource.refetch,
  }
}
