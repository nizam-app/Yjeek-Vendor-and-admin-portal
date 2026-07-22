import { API_BASE_URL, apiConfig, buildApiUrl, resolveRequestScope, shouldUseMockApi } from './config'
import { endpoints } from './endpoints'
import {
  ApiError,
  createApiErrorFromResponse,
  createNetworkError,
  createTimeoutError,
} from './errors'
import { mockClient } from './mockClient'
import { normalizeSuccessResponse, parseResponseBody } from './response'
import { clearAdminAuth, clearVendorAuth, getAccessTokenForScope } from './token'

export { buildApiUrl } from './config'
export const UNAUTHORIZED_EVENT = 'yjeek:unauthorized'

/**
 * Append query params to an absolute URL produced by buildApiUrl.
 * Base URL joining lives only in buildApiUrl — methods must not reimplement it.
 */
function withQueryParams(absoluteUrl, params) {
  if (!params || typeof params !== 'object') return absoluteUrl

  const url = new URL(absoluteUrl)
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return
    if (Array.isArray(value)) {
      value.forEach((item) => url.searchParams.append(key, String(item)))
      return
    }
    url.searchParams.set(key, String(value))
  })
  return url.toString()
}

function mergeSignals(userSignal, timeoutController) {
  if (!userSignal) return timeoutController.signal
  if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.any === 'function') {
    return AbortSignal.any([userSignal, timeoutController.signal])
  }

  if (userSignal.aborted) {
    timeoutController.abort(userSignal.reason)
    return timeoutController.signal
  }

  userSignal.addEventListener(
    'abort',
    () => {
      timeoutController.abort(userSignal.reason)
    },
    { once: true },
  )
  return timeoutController.signal
}

function handleUnauthorized(scope) {
  if (scope === 'admin') {
    clearAdminAuth()
  } else {
    clearVendorAuth()
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(UNAUTHORIZED_EVENT, {
        detail: { role: scope === 'admin' ? 'admin' : 'vendor' },
      }),
    )
  }
}

/**
 * Role-neutral HTTP client.
 * Vendor and future Admin services both call this same client:
 *   apiClient.get(endpoints.vendor.dashboard)
 *   apiClient.get(endpoints.admin.dashboard)
 */
async function httpRequest({
  method = 'GET',
  url,
  params,
  body,
  headers = {},
  signal,
  timeout = apiConfig.timeoutMs,
  skipAuth = false,
  scope: scopeOverride,
} = {}) {
  if (!url) {
    throw new ApiError({ message: 'Request URL is required.' })
  }

  const scope = scopeOverride || resolveRequestScope(url)

  if (shouldUseMockApi(scope)) {
    return mockClient.request({ method, url, params, body, headers, signal })
  }

  const timeoutController = new AbortController()
  const timeoutId =
    timeout > 0
      ? setTimeout(() => {
          timeoutController.abort(new DOMException('Request timed out', 'TimeoutError'))
        }, timeout)
      : null

  const finalSignal = mergeSignals(signal, timeoutController)
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData
  const requestHeaders = { ...headers }

  if (!skipAuth) {
    const token = getAccessTokenForScope(scope)
    if (token) {
      requestHeaders.Authorization = `Bearer ${token}`
    }
  }

  // Do not manually set Content-Type for FormData — the browser sets the boundary.
  if (body !== undefined && body !== null && !isFormData && !requestHeaders['Content-Type']) {
    requestHeaders['Content-Type'] = 'application/json'
  }

  let requestBody
  if (body === undefined || body === null) {
    requestBody = undefined
  } else if (isFormData || typeof body === 'string') {
    requestBody = body
  } else {
    requestBody = JSON.stringify(body)
  }

  const requestUrl = withQueryParams(buildApiUrl(url), params)

  try {
    const response = await fetch(requestUrl, {
      method: method.toUpperCase(),
      headers: requestHeaders,
      body: ['GET', 'HEAD'].includes(method.toUpperCase()) ? undefined : requestBody,
      signal: finalSignal,
    })

    const payload = await parseResponseBody(response)

    if (!response.ok) {
      const error = createApiErrorFromResponse({
        status: response.status,
        payload,
        requestId: response.headers.get('x-request-id') || response.headers.get('request-id'),
      })

      if (response.status === 401) {
        handleUnauthorized(scope)
      }

      throw error
    }

    return normalizeSuccessResponse(payload, {
      headers: response.headers,
    })
  } catch (error) {
    if (error instanceof ApiError) throw error

    const isTimeout =
      error?.name === 'TimeoutError' ||
      (error?.name === 'AbortError' && timeoutController.signal.aborted && !signal?.aborted)

    if (isTimeout) {
      throw createTimeoutError(error)
    }

    // Caller-aborted requests should surface as AbortError, not ApiError.
    if (error?.name === 'AbortError') {
      throw error
    }

    throw createNetworkError(error)
  } finally {
    if (timeoutId) clearTimeout(timeoutId)
  }
}

function createMethod(method) {
  return (url, bodyOrOptions, maybeOptions) => {
    const hasBody = !['GET', 'HEAD', 'DELETE'].includes(method)
    if (!hasBody) {
      return httpRequest({ method, url, ...(bodyOrOptions || {}) })
    }

    // post/put/patch(url, body, options) OR post/put/patch(url, options) when body omitted
    if (
      maybeOptions === undefined &&
      bodyOrOptions &&
      typeof bodyOrOptions === 'object' &&
      !Array.isArray(bodyOrOptions) &&
      !(typeof FormData !== 'undefined' && bodyOrOptions instanceof FormData) &&
      ('params' in bodyOrOptions ||
        'headers' in bodyOrOptions ||
        'signal' in bodyOrOptions ||
        'timeout' in bodyOrOptions ||
        'skipAuth' in bodyOrOptions ||
        'scope' in bodyOrOptions ||
        'body' in bodyOrOptions)
    ) {
      const { body, ...options } = bodyOrOptions
      return httpRequest({ method, url, body, ...options })
    }

    return httpRequest({ method, url, body: bodyOrOptions, ...(maybeOptions || {}) })
  }
}

export const apiClient = {
  request: httpRequest,
  get: createMethod('GET'),
  post: createMethod('POST'),
  put: createMethod('PUT'),
  patch: createMethod('PATCH'),
  delete: createMethod('DELETE'),
}

/**
 * Development-only URL resolution check.
 * Does not send a network request and does not log credentials or tokens.
 */
function verifyVendorLoginUrlResolution() {
  if (!import.meta.env.DEV) return
  if (!API_BASE_URL) return

  const fromEndpoint = buildApiUrl(endpoints.vendor.auth.login)
  const withLeadingSlash = buildApiUrl('/vendor-panel/auth/login')
  const withoutLeadingSlash = buildApiUrl('vendor-panel/auth/login')
  const expected = `${API_BASE_URL}/vendor-panel/auth/login`

  const ok =
    fromEndpoint === expected &&
    withLeadingSlash === expected &&
    withoutLeadingSlash === expected &&
    !fromEndpoint.includes('/api/v1//') &&
    !fromEndpoint.includes('v1vendor-panel')

  if (ok) {
    console.info('[yjeek:api] Vendor login URL resolved:', fromEndpoint)
  } else {
    console.error('[yjeek:api] Vendor login URL resolution failed.', {
      fromEndpoint,
      withLeadingSlash,
      withoutLeadingSlash,
      expected,
    })
  }
}

verifyVendorLoginUrlResolution()

export default apiClient
