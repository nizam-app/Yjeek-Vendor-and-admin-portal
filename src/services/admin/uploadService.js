import { apiClient } from '../../api/client'
import { apiConfig, isAdminRealApiFeature } from '../../api/config'
import { endpoints } from '../../api/endpoints'
import { ApiError } from '../../api/errors'
import { mapAdminUploadImageResponse } from '../../mappers/admin/mapAdminUpload'

/** Backend-aligned client limit for banner / admin image uploads (5 MB). */
export const ADMIN_IMAGE_UPLOAD_MAX_BYTES = 5 * 1024 * 1024

export const ADMIN_IMAGE_UPLOAD_ACCEPT = 'image/jpeg,image/png,image/webp'

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/jpg'])

function useRealUploadApi() {
  return (
    isAdminRealApiFeature('uploads') ||
    isAdminRealApiFeature('ui-editor') ||
    !apiConfig.adminUseMockApi
  )
}

function requestOptions(options = {}) {
  return {
    ...options,
    scope: 'admin',
    feature: options.feature || 'uploads',
    forceReal: !apiConfig.adminUseMockApi,
  }
}

/**
 * Validate a File before upload (type + size).
 * @param {File} file
 * @param {{ maxBytes?: number }} [options]
 */
export function validateAdminImageFile(file, { maxBytes = ADMIN_IMAGE_UPLOAD_MAX_BYTES } = {}) {
  if (!file || !(file instanceof File)) {
    throw new ApiError({ message: 'Please choose an image file.' })
  }

  const type = String(file.type || '').toLowerCase()
  const name = String(file.name || '').toLowerCase()
  const byExt =
    name.endsWith('.jpg') ||
    name.endsWith('.jpeg') ||
    name.endsWith('.png') ||
    name.endsWith('.webp')

  if (!ALLOWED_TYPES.has(type) && !byExt) {
    throw new ApiError({ message: 'Only JPEG, PNG, and WebP images are allowed.' })
  }

  if (file.size > maxBytes) {
    const mb = Math.round((maxBytes / (1024 * 1024)) * 10) / 10
    throw new ApiError({
      message: `Image is too large. Maximum size is ${mb} MB.`,
    })
  }

  return true
}

/**
 * Admin image uploads.
 *
 * Confirmed: POST /admin/uploads/images
 * Content-Type: multipart/form-data
 * File field: file
 * Success URL: data.url
 */
export const adminUploadService = {
  /**
   * @param {File} file
   * @param {{ signal?: AbortSignal, feature?: string, category?: string }} [options]
   * @returns {Promise<{ data: { url: string }, meta: object|null, raw: unknown }>}
   */
  async uploadImage(file, options = {}) {
    if (!useRealUploadApi()) {
      throw new ApiError({ message: 'Admin upload API is not enabled.' })
    }

    validateAdminImageFile(file)

    const formData = new FormData()
    formData.append('file', file)

    const response = await apiClient.post(
      endpoints.admin.uploads.images,
      formData,
      requestOptions(options),
    )

    const mapped = mapAdminUploadImageResponse(response?.data)
    if (!mapped.url) {
      throw new ApiError({
        message: 'Upload succeeded but no image URL was returned.',
        details: response?.data,
      })
    }

    return {
      data: { url: mapped.url },
      meta: response?.meta ?? null,
      raw: response?.data ?? null,
    }
  },

  /**
   * Fleet / champ document & vehicle image upload.
   * POST /admin/uploads/fleet-images?category=documents|avatars|vehicle-photos
   *
   * @param {File} file
   * @param {{ signal?: AbortSignal, feature?: string, category?: string }} [options]
   */
  async uploadFleetImage(file, options = {}) {
    if (
      !useRealUploadApi() &&
      !isAdminRealApiFeature('fleet') &&
      apiConfig.adminUseMockApi
    ) {
      throw new ApiError({ message: 'Admin fleet upload API is not enabled.' })
    }

    validateAdminImageFile(file)

    const category = String(options.category || 'documents').trim() || 'documents'
    const formData = new FormData()
    formData.append('file', file)

    const response = await apiClient.post(
      `${endpoints.admin.uploads.fleetImages}?category=${encodeURIComponent(category)}`,
      formData,
      requestOptions({ ...options, feature: options.feature || 'fleet' }),
    )

    const mapped = mapAdminUploadImageResponse(response?.data)
    if (!mapped.url) {
      throw new ApiError({
        message: 'Upload succeeded but no image URL was returned.',
        details: response?.data,
      })
    }

    return {
      data: { url: mapped.url, category },
      meta: response?.meta ?? null,
      raw: response?.data ?? null,
    }
  },
}
