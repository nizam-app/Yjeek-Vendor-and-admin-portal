/**
 * Shared response helpers.
 *
 * Does not assume backend field names. When a real Vendor/Admin response sample
 * is available, add role-specific mappers under:
 *   src/mappers/vendor/
 *   src/mappers/admin/
 */

function createRequestId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID()
    } catch {
      // HTTP over LAN IP is not a secure context in some browsers
    }
  }
  return `req-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

/**
 * Normalize any successful HTTP/json payload into the app contract:
 * `{ data, meta }` expected by useApiResource / existing services.
 *
 * If the backend already returns `{ data, meta }`, it is preserved.
 * Otherwise the full JSON body is treated as `data`.
 */
export function normalizeSuccessResponse(payload, { requestId, headers } = {}) {
  const headerRequestId =
    (headers && typeof headers.get === 'function' && (headers.get('x-request-id') || headers.get('request-id'))) ||
    null

  if (payload && typeof payload === 'object' && !Array.isArray(payload) && 'data' in payload) {
    return {
      data: payload.data,
      meta: {
        requestId: payload.meta?.requestId || headerRequestId || requestId || createRequestId(),
        timestamp: payload.meta?.timestamp || new Date().toISOString(),
        ...(payload.meta && typeof payload.meta === 'object' ? payload.meta : {}),
      },
    }
  }

  return {
    data: payload ?? null,
    meta: {
      requestId: headerRequestId || requestId || createRequestId(),
      timestamp: new Date().toISOString(),
    },
  }
}

/**
 * Parse a fetch Response body as JSON when possible; otherwise return text.
 */
export async function parseResponseBody(response) {
  const contentType = response.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    try {
      return await response.json()
    } catch {
      return null
    }
  }

  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}
