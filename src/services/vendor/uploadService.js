import { apiClient } from '../../api/client'
import { apiConfig } from '../../api/config'
import { endpoints } from '../../api/endpoints'
import { ApiError } from '../../api/errors'
import { mapAdminUploadImageResponse } from '../../mappers/admin/mapAdminUpload'

/** Backend-aligned client limit for vendor catalog image uploads (5 MB). */
export const VENDOR_IMAGE_UPLOAD_MAX_BYTES = 5 * 1024 * 1024

export const VENDOR_IMAGE_UPLOAD_ACCEPT = 'image/jpeg,image/png,image/webp'

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/jpg'])

/** Cache the first upload path that succeeds this session. */
let resolvedUploadPath = null

/**
 * Candidate upload routes — `/vendor-panel/uploads/images` is not on this backend
 * ("Route not found"). Try catalog-scoped and shared upload paths.
 */
const UPLOAD_PATH_CANDIDATES = [
  '/vendor-panel/catalog/uploads/images',
  '/vendor-panel/catalog/upload',
  '/vendor-panel/media/images',
  '/vendor-panel/uploads',
  '/vendor-panel/upload',
  '/uploads/images',
  endpoints.vendor.uploads.images,
]

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

function isRouteNotFound(error) {
  const status = Number(error?.status || error?.statusCode || 0)
  const message = String(error?.message || '').toLowerCase()
  return status === 404 || message.includes('route not found') || message.includes('not found')
}

async function postUpload(path, formData, options = {}) {
  return apiClient.post(path, formData, {
    ...options,
    scope: 'vendor',
    forceReal: !apiConfig.vendorUseMockApi,
  })
}

/**
 * Vendor image uploads — tries known candidate paths until one succeeds.
 */
export const vendorUploadService = {
  /**
   * @param {File} file
   * @param {{ signal?: AbortSignal, productId?: string }} [options]
   * @returns {Promise<{ data: { url: string }, meta: object|null, raw: unknown }>}
   */
  async uploadImage(file, options = {}) {
    validateVendorImageFile(file)

    const { productId, ...requestOptions } = options
    const paths = []

    if (productId) {
      paths.push(
        `/vendor-panel/catalog/products/${encodeURIComponent(String(productId))}/images`,
        `/vendor-panel/catalog/products/${encodeURIComponent(String(productId))}/image`,
      )
    }

    if (resolvedUploadPath) paths.push(resolvedUploadPath)
    for (const path of UPLOAD_PATH_CANDIDATES) {
      if (!paths.includes(path)) paths.push(path)
    }

    let lastError = null

    for (const path of paths) {
      // Try common multipart field names used by this backend family.
      for (const fieldName of ['file', 'image', 'images']) {
        try {
          const formData = new FormData()
          formData.append(fieldName, file, file.name)

          const response = await postUpload(path, formData, requestOptions)
          const mapped = mapAdminUploadImageResponse(response?.data)
          const url =
            mapped.url ||
            response?.data?.imageUrl ||
            response?.data?.url ||
            (Array.isArray(response?.data?.imageUrls) ? response.data.imageUrls[0] : null)

          if (!url) {
            lastError = new ApiError({
              message: 'Upload succeeded but no image URL was returned.',
              details: response?.data,
            })
            continue
          }

          if (!productId) resolvedUploadPath = path

          return {
            data: { url: String(url) },
            meta: response?.meta ?? null,
            raw: response?.data ?? null,
          }
        } catch (err) {
          lastError = err
          // Wrong field name → try next field; missing route → try next path.
          if (isRouteNotFound(err)) break
          const message = String(err?.message || '').toLowerCase()
          if (message.includes('file') || message.includes('image') || Number(err?.status) === 400) {
            continue
          }
          // Auth / server errors should surface immediately.
          if (!isRouteNotFound(err) && Number(err?.status) >= 500) throw err
        }
      }
    }

    throw (
      lastError ||
      new ApiError({
        message: 'Image upload endpoint was not found on the server.',
      })
    )
  },
}
