import { apiClient } from '../../api/client'
import { apiConfig } from '../../api/config'
import { endpoints } from '../../api/endpoints'
import { ApiError } from '../../api/errors'
import { mapAdminUploadImageResponse } from '../../mappers/admin/mapAdminUpload'

/** Backend-aligned client limit for vendor catalog image uploads (5 MB). */
export const VENDOR_IMAGE_UPLOAD_MAX_BYTES = 5 * 1024 * 1024

export const VENDOR_IMAGE_UPLOAD_ACCEPT = 'image/jpeg,image/png,image/webp'

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/jpg'])

/**
 * Confirmed: POST /vendor-panel/catalog/uploads/images
 * multipart field: `file` → data.url
 */
const CONFIRMED_UPLOAD_PATH = endpoints.vendor.uploads.images

/**
 * Validate a File before upload (type + size).
 * @param {File} file
 * @param {{ maxBytes?: number }} [options]
 */
export function validateVendorImageFile(file, { maxBytes = VENDOR_IMAGE_UPLOAD_MAX_BYTES } = {}) {
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

async function postUpload(path, formData, options = {}) {
  return apiClient.post(path, formData, {
    ...options,
    scope: 'vendor',
    forceReal: !apiConfig.vendorUseMockApi,
  })
}

function extractUploadUrl(response) {
  const mapped = mapAdminUploadImageResponse(response?.data)
  return (
    mapped.url ||
    response?.data?.imageUrl ||
    response?.data?.url ||
    (Array.isArray(response?.data?.imageUrls) ? response.data.imageUrls[0] : null) ||
    null
  )
}

/**
 * Vendor catalog image uploads.
 * Confirmed path: POST /vendor-panel/catalog/uploads/images (field: file).
 */
export const vendorUploadService = {
  /**
   * @param {File} file
   * @param {{ signal?: AbortSignal, productId?: string }} [options]
   * @returns {Promise<{ data: { url: string }, meta: object|null, raw: unknown }>}
   */
  async uploadImage(file, options = {}) {
    validateVendorImageFile(file)

    // productId kept for call-site compatibility; upload is catalog-scoped.
    const { productId: _productId, ...requestOptions } = options

    const formData = new FormData()
    formData.append('file', file, file.name)

    const response = await postUpload(CONFIRMED_UPLOAD_PATH, formData, requestOptions)
    const url = extractUploadUrl(response)

    if (!url) {
      throw new ApiError({
        message: 'Upload succeeded but no image URL was returned.',
        details: response?.data,
      })
    }

    return {
      data: { url: String(url) },
      meta: response?.meta ?? null,
      raw: response?.data ?? null,
    }
  },
}
