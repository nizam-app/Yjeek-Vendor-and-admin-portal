/**
 * Turn API media URLs into browser-displayable paths.
 *
 * Local dev: rewrite to `/uploads/...` or `/__admin_media/...` so Vite proxy
 * serves files same-origin (backend may send CORP: same-origin).
 *
 * Production: return absolute URLs on the API/media host — deployed static
 * admin has no Vite proxy, so `/uploads/...` on the SPA origin 404s.
 */

function apiOriginFromEnv() {
  const base = String(import.meta.env?.VITE_API_BASE_URL || '').trim()
  if (!base) return null
  try {
    const withoutApi = base.replace(/\/api\/v\d+\/?$/i, '')
    return new URL(withoutApi || base).origin
  } catch {
    try {
      return new URL(base).origin
    } catch {
      return null
    }
  }
}

/** Optional CDN or public media base (falls back to API origin). */
function mediaOriginFromEnv() {
  const mediaBase = String(import.meta.env?.VITE_MEDIA_BASE_URL || '').trim()
  if (mediaBase) {
    try {
      const parsed = new URL(mediaBase.replace(/\/+$/, ''))
      return parsed.origin
    } catch {
      return mediaBase.replace(/\/+$/, '')
    }
  }
  return apiOriginFromEnv()
}

function uploadsPathFromUrl(parsed) {
  const pathname = String(parsed?.pathname || '')
  // Only Yjeek upload roots — NOT WordPress `/wp-content/uploads/...` (menu import image URLs).
  if (pathname.startsWith('/uploads/')) {
    return `${pathname}${parsed.search || ''}`
  }
  // Some backends return /api/v1/uploads/...
  const apiUploads = pathname.match(/\/api\/v\d+(\/uploads\/.*)$/i)
  if (apiUploads?.[1]) {
    return `${apiUploads[1]}${parsed.search || ''}`
  }
  return null
}

function toAbsoluteMediaUrl(pathOrUrl) {
  const raw = String(pathOrUrl || '').trim()
  if (!raw) return null
  if (raw.startsWith('blob:') || raw.startsWith('data:')) return raw
  if (/^https?:\/\//i.test(raw)) return raw

  const origin = mediaOriginFromEnv()
  if (!origin) return raw.startsWith('/') ? raw : `/${raw}`

  const path = raw.startsWith('/') ? raw : `/${raw}`
  return `${origin}${path}`
}

function resolveDevMediaUrl(raw) {
  try {
    if (/^https?:\/\//i.test(raw)) {
      const parsed = new URL(raw)
      const apiOrigin = apiOriginFromEnv()
      const mediaOrigin = mediaOriginFromEnv()
      const isOwnHost =
        (apiOrigin && parsed.origin === apiOrigin) ||
        (mediaOrigin && parsed.origin === mediaOrigin)

      // Never rewrite third-party absolute URLs (WooCommerce, Webflow CDN, etc.).
      if (!isOwnHost) {
        return raw
      }

      const uploadsPath = uploadsPathFromUrl(parsed)
      if (uploadsPath) return uploadsPath

      if (apiOrigin && parsed.origin === apiOrigin) {
        return `/__admin_media${parsed.pathname}${parsed.search || ''}`
      }

      return raw
    }
  } catch {
    // fall through
  }

  // Relative paths only — do not treat `/wp-content/uploads/` as Yjeek media.
  if (raw.startsWith('/uploads/')) {
    return raw
  }
  const apiUploads = raw.match(/\/api\/v\d+(\/uploads\/.*)$/i)
  if (apiUploads?.[1]) {
    return apiUploads[1]
  }

  if (/^uploads\//i.test(raw)) {
    return `/${raw}`
  }

  if (raw.startsWith('/__admin_media')) return raw

  if (raw.startsWith('/api/') || raw.startsWith('/files/') || raw.startsWith('/media/')) {
    return `/__admin_media${raw}`
  }

  if (raw.startsWith('/')) return raw
  return `/${raw}`
}

/** Same-origin `/uploads/...` path for nginx/Vite proxy fallback when absolute URL fails. */
export function adminMediaSameOriginPath(url) {
  const raw = String(url || '').trim()
  if (!raw) return null
  return resolveDevMediaUrl(raw)
}

function resolveProdMediaUrl(raw) {
  if (/^https?:\/\//i.test(raw)) return raw

  if (raw.startsWith('/uploads/')) {
    return toAbsoluteMediaUrl(raw)
  }

  const apiUploads = raw.match(/\/api\/v\d+(\/uploads\/.*)$/i)
  if (apiUploads?.[1]) {
    return toAbsoluteMediaUrl(apiUploads[1])
  }

  if (/^uploads\//i.test(raw)) {
    return toAbsoluteMediaUrl(`/${raw}`)
  }

  if (raw.startsWith('/api/') || raw.startsWith('/files/') || raw.startsWith('/media/')) {
    return toAbsoluteMediaUrl(raw)
  }

  if (raw.startsWith('/')) return toAbsoluteMediaUrl(raw)
  return toAbsoluteMediaUrl(`/${raw}`)
}

export function resolveAdminMediaUrl(url) {
  const raw = String(url || '').trim()
  if (!raw) return null
  if (raw.startsWith('blob:') || raw.startsWith('data:')) return raw

  const isDev = Boolean(import.meta.env?.DEV)
  return isDev ? resolveDevMediaUrl(raw) : resolveProdMediaUrl(raw)
}

/** Exported for unit tests — Yjeek `/uploads` path only, never WP `/wp-content/uploads`. */
export function yjeekUploadsPathFromAbsoluteUrl(url) {
  try {
    return uploadsPathFromUrl(new URL(String(url || '').trim()))
  } catch {
    return null
  }
}

/**
 * Map POST /admin/uploads/images success payload → { url }.
 * Confirmed success URL: data.url (keep server value for create/update body).
 */
export function mapAdminUploadImageResponse(data) {
  const src = data && typeof data === 'object' && !Array.isArray(data) ? data : {}
  const nested =
    src.file && typeof src.file === 'object'
      ? src.file
      : src.image && typeof src.image === 'object'
        ? src.image
        : src.media && typeof src.media === 'object'
          ? src.media
          : null

  const rawUrl = String(
    src.url ||
      src.imageUrl ||
      src.image_url ||
      src.cdnUrl ||
      src.publicUrl ||
      src.path ||
      nested?.url ||
      nested?.imageUrl ||
      nested?.path ||
      '',
  ).trim()
  if (!rawUrl || rawUrl.startsWith('blob:') || rawUrl.startsWith('data:')) {
    return { url: null, displayUrl: null, raw: src }
  }
  return {
    url: rawUrl,
    displayUrl: resolveAdminMediaUrl(rawUrl) || rawUrl,
    raw: src,
  }
}
