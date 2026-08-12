/**
 * Turn API media URLs into browser-displayable same-origin paths.
 *
 * Backend list sample: http://host:3000/uploads/banners/...
 * That host sends Cross-Origin-Resource-Policy: same-origin, which blocks
 * <img> loads from the Vite app origin. Rewrite to `/uploads/...` so the
 * Vite (or reverse-proxy) `/uploads` proxy can serve them same-origin.
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

function uploadsPathFromUrl(parsed) {
  const pathname = String(parsed?.pathname || '')
  const uploadsIndex = pathname.indexOf('/uploads/')
  if (uploadsIndex >= 0) {
    return `${pathname.slice(uploadsIndex)}${parsed.search || ''}`
  }
  // Some backends return /api/v1/uploads/...
  const apiUploads = pathname.match(/\/api\/v\d+(\/uploads\/.*)$/i)
  if (apiUploads?.[1]) {
    return `${apiUploads[1]}${parsed.search || ''}`
  }
  return null
}

export function resolveAdminMediaUrl(url) {
  const raw = String(url || '').trim()
  if (!raw) return null
  if (raw.startsWith('blob:') || raw.startsWith('data:')) return raw

  try {
    if (/^https?:\/\//i.test(raw)) {
      const parsed = new URL(raw)
      const uploadsPath = uploadsPathFromUrl(parsed)
      if (uploadsPath) return uploadsPath

      // Same host as API but not under /uploads — still proxy via Vite media bridge
      // so CORP: same-origin from the API host cannot block the admin SPA.
      const apiOrigin = apiOriginFromEnv()
      if (apiOrigin && parsed.origin === apiOrigin) {
        return `/__admin_media${parsed.pathname}${parsed.search || ''}`
      }

      return raw
    }
  } catch {
    // fall through
  }

  const uploadsIndex = raw.indexOf('/uploads/')
  if (uploadsIndex >= 0) {
    return raw.slice(uploadsIndex)
  }

  if (/^uploads\//i.test(raw)) {
    return `/${raw}`
  }

  if (raw.startsWith('/__admin_media')) return raw
  if (raw.startsWith('/')) return raw
  return `/${raw}`
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
