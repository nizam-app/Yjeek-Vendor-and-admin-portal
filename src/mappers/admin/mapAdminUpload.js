/**
 * Turn API media URLs into browser-displayable same-origin paths.
 *
 * Backend list sample: http://host:3000/uploads/banners/...
 * That host sends Cross-Origin-Resource-Policy: same-origin, which blocks
 * <img> loads from the Vite app origin. Rewrite to `/uploads/...` so the
 * Vite (or reverse-proxy) `/uploads` proxy can serve them same-origin.
 */
export function resolveAdminMediaUrl(url) {
  const raw = String(url || '').trim()
  if (!raw) return null
  if (raw.startsWith('blob:') || raw.startsWith('data:')) return raw

  try {
    if (/^https?:\/\//i.test(raw)) {
      const parsed = new URL(raw)
      const uploadsIndex = parsed.pathname.indexOf('/uploads/')
      if (uploadsIndex >= 0) {
        return `${parsed.pathname.slice(uploadsIndex)}${parsed.search || ''}`
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

  if (raw.startsWith('/')) return raw
  return `/${raw}`
}

/**
 * Map POST /admin/uploads/images success payload → { url }.
 * Confirmed success URL: data.url (keep server value for create/update body).
 */
export function mapAdminUploadImageResponse(data) {
  const src = data && typeof data === 'object' && !Array.isArray(data) ? data : {}
  const rawUrl = String(src.url || src.imageUrl || src.cdnUrl || src.publicUrl || '').trim()
  if (!rawUrl || rawUrl.startsWith('blob:') || rawUrl.startsWith('data:')) {
    return { url: null, displayUrl: null, raw: src }
  }
  return {
    url: rawUrl,
    displayUrl: resolveAdminMediaUrl(rawUrl) || rawUrl,
    raw: src,
  }
}
