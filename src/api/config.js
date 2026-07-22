/**
 * Shared API configuration (role-neutral).
 *
 * Change only VITE_API_BASE_URL to point every Vendor (and future Admin) request
 * at a different backend. Never hardcode origins, ports, or `/api/v1` elsewhere.
 */

function readBooleanEnv(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback
  const normalized = String(value).trim().toLowerCase()
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false
  return fallback
}

/**
 * Normalize VITE_API_BASE_URL: trim whitespace and strip trailing slashes.
 * Does not log or expose the raw secret-bearing env bag.
 */
function normalizeApiBaseUrl(rawValue) {
  if (rawValue === undefined || rawValue === null) return ''
  return String(rawValue).trim().replace(/\/+$/, '')
}

const legacyUseMockApi = readBooleanEnv(import.meta.env.VITE_USE_MOCK_API, undefined)

/** Normalized backend API base (includes `/api/v1` when provided via env). */
export const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL)

/**
 * Vendor mock mode.
 * - Explicit VITE_VENDOR_USE_MOCK_API wins.
 * - Legacy VITE_USE_MOCK_API applies to Vendor only (never Admin).
 * - Default true: keep existing mock UI until a real Vendor API is wired.
 * - Set VITE_VENDOR_USE_MOCK_API=false only after connecting confirmed endpoints.
 */
const vendorUseMockApi = readBooleanEnv(
  import.meta.env.VITE_VENDOR_USE_MOCK_API,
  legacyUseMockApi !== undefined ? legacyUseMockApi : true,
)

/**
 * Admin mock mode.
 * Default: true — existing Admin mock behavior until Admin API is wired.
 */
const adminUseMockApi = readBooleanEnv(import.meta.env.VITE_ADMIN_USE_MOCK_API, true)

const timeoutMs = Number(import.meta.env.VITE_API_TIMEOUT_MS) || 30000

if (!vendorUseMockApi && !API_BASE_URL) {
  const message =
    '[yjeek:api] VITE_API_BASE_URL is required when VITE_VENDOR_USE_MOCK_API=false. ' +
    'Set it in `.env`, e.g. VITE_API_BASE_URL=http://host:port/api/v1'
  if (import.meta.env.DEV) {
    console.error(message)
  }
  throw new Error(message)
}

if (import.meta.env.DEV && API_BASE_URL && !/^https?:\/\//i.test(API_BASE_URL)) {
  console.error(
    '[yjeek:api] VITE_API_BASE_URL must be an absolute http(s) URL (scheme + host). ' +
      'Set it in `.env` (see `.env.example`).',
  )
}

export const apiConfig = {
  /** @deprecated Prefer API_BASE_URL — kept for existing imports. */
  baseUrl: API_BASE_URL,
  timeoutMs,
  vendorUseMockApi,
  adminUseMockApi,
}

/**
 * Resolve whether a request should use the mock client.
 * @param {'vendor' | 'admin' | 'shared'} scope
 */
export function shouldUseMockApi(scope = 'vendor') {
  if (scope === 'admin') return apiConfig.adminUseMockApi
  return apiConfig.vendorUseMockApi
}

/**
 * Infer portal scope from a relative endpoint path.
 * Admin real-API paths will live under endpoints.admin when integrated.
 * Existing Admin mock paths start with `/admin`.
 */
export function resolveRequestScope(url = '') {
  const path = String(url).split('?')[0]
  if (path === '/admin' || path.startsWith('/admin/')) return 'admin'
  return 'vendor'
}

/**
 * Join the normalized API base URL with a relative endpoint path.
 *
 * Accepts:
 *   "vendor-panel/auth/login"
 *   "/vendor-panel/auth/login"
 * Both become: `${API_BASE_URL}/vendor-panel/auth/login`
 *
 * Preserves query strings on the endpoint. Rejects absolute http(s) URLs in
 * development so callers cannot accidentally bypass VITE_API_BASE_URL.
 *
 * @param {string} endpoint Relative API path (optionally with ?query)
 * @returns {string} Absolute request URL
 */
export function buildApiUrl(endpoint) {
  if (endpoint === undefined || endpoint === null || String(endpoint).trim() === '') {
    throw new Error('[yjeek:api] buildApiUrl requires a relative endpoint path.')
  }

  const raw = String(endpoint).trim()

  if (/^https?:\/\//i.test(raw)) {
    const message =
      '[yjeek:api] buildApiUrl only accepts relative endpoint paths. ' +
      'Put the origin in VITE_API_BASE_URL, not in endpoints or services.'
    if (import.meta.env.DEV) {
      console.error(message)
    }
    throw new Error(message)
  }

  if (!API_BASE_URL) {
    throw new Error('[yjeek:api] VITE_API_BASE_URL is not configured.')
  }

  const questionIndex = raw.indexOf('?')
  const pathPart = questionIndex === -1 ? raw : raw.slice(0, questionIndex)
  const queryPart = questionIndex === -1 ? '' : raw.slice(questionIndex)

  const normalizedPath = pathPart.replace(/^\/+/, '').replace(/\/+$/, '')
  if (!normalizedPath) {
    throw new Error('[yjeek:api] buildApiUrl received an empty path.')
  }

  return `${API_BASE_URL}/${normalizedPath}${queryPart}`
}
