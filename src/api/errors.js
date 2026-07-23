/**
 * Normalized API error used by the shared HTTP client and hooks.
 */

export const API_ERROR_TYPES = {
  VALIDATION: 'validation',
  UNAUTHORIZED: 'unauthorized',
  FORBIDDEN: 'forbidden',
  NOT_FOUND: 'not_found',
  CONFLICT: 'conflict',
  UNPROCESSABLE: 'unprocessable',
  SERVER: 'server',
  NETWORK: 'network',
  TIMEOUT: 'timeout',
  UNKNOWN: 'unknown',
}

function typeFromStatus(status) {
  if (status === 401) return API_ERROR_TYPES.UNAUTHORIZED
  if (status === 403) return API_ERROR_TYPES.FORBIDDEN
  if (status === 404) return API_ERROR_TYPES.NOT_FOUND
  if (status === 409) return API_ERROR_TYPES.CONFLICT
  if (status === 422) return API_ERROR_TYPES.UNPROCESSABLE
  if (status === 400) return API_ERROR_TYPES.VALIDATION
  if (status >= 500) return API_ERROR_TYPES.SERVER
  return API_ERROR_TYPES.UNKNOWN
}

function defaultMessageForType(type, status) {
  switch (type) {
    case API_ERROR_TYPES.VALIDATION:
      return 'Validation failed.'
    case API_ERROR_TYPES.UNAUTHORIZED:
      return 'Your session has expired. Please sign in again.'
    case API_ERROR_TYPES.FORBIDDEN:
      return 'You do not have permission to perform this action.'
    case API_ERROR_TYPES.NOT_FOUND:
      return 'The requested resource was not found.'
    case API_ERROR_TYPES.CONFLICT:
      return 'This request conflicts with the current state.'
    case API_ERROR_TYPES.UNPROCESSABLE:
      return 'The request could not be processed.'
    case API_ERROR_TYPES.SERVER:
      return 'A server error occurred. Please try again later.'
    case API_ERROR_TYPES.NETWORK:
      return 'Network error. Check your connection and try again.'
    case API_ERROR_TYPES.TIMEOUT:
      return 'The request timed out. Please try again.'
    default:
      return status ? `Request failed with status ${status}.` : 'Request failed.'
  }
}

/**
 * @typedef {Object} ApiErrorOptions
 * @property {string} [type]
 * @property {number|null} [status]
 * @property {string} [message]
 * @property {unknown} [details]
 * @property {Record<string, string[]|string>|null} [fieldErrors]
 * @property {string|null} [requestId]
 * @property {unknown} [raw]
 */

export class ApiError extends Error {
  /**
   * @param {ApiErrorOptions} options
   */
  constructor({
    type = API_ERROR_TYPES.UNKNOWN,
    status = null,
    message,
    details = null,
    fieldErrors = null,
    requestId = null,
    raw = null,
  } = {}) {
    super(message || defaultMessageForType(type, status))
    this.name = 'ApiError'
    this.type = type
    this.status = status
    this.details = details
    this.fieldErrors = fieldErrors
    this.requestId = requestId
    this.raw = raw
  }

  get isUnauthorized() {
    return this.type === API_ERROR_TYPES.UNAUTHORIZED || this.status === 401
  }

  get isValidation() {
    return (
      this.type === API_ERROR_TYPES.VALIDATION ||
      this.type === API_ERROR_TYPES.UNPROCESSABLE ||
      this.status === 400 ||
      this.status === 422
    )
  }
}

/**
 * Best-effort extraction of field-level validation errors from unknown payloads.
 * Supports confirmed Vendor shape: `{ error: { details: { email: ["..."] } } }`.
 */
export function extractFieldErrors(payload) {
  if (!payload || typeof payload !== 'object') return null

  const candidates = [
    payload.errors,
    payload.fieldErrors,
    payload.validationErrors,
    payload.data?.errors,
    payload.error?.details,
    payload.details,
  ]
  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) continue
    return candidate
  }

  return null
}

/**
 * Prefer email / password field messages, then any first field message.
 * @param {Record<string, string[]|string>|null|undefined} fieldErrors
 * @param {string[]} [preferredFields]
 */
export function getFirstFieldErrorMessage(fieldErrors, preferredFields = ['email', 'password']) {
  if (!fieldErrors || typeof fieldErrors !== 'object') return null

  const readMessage = (value) => {
    if (Array.isArray(value)) {
      const first = value.find((item) => typeof item === 'string' && item.trim())
      return first || null
    }
    if (typeof value === 'string' && value.trim()) return value
    return null
  }

  for (const field of preferredFields) {
    const message = readMessage(fieldErrors[field])
    if (message) return message
  }

  for (const value of Object.values(fieldErrors)) {
    const message = readMessage(value)
    if (message) return message
  }

  return null
}

export function createApiErrorFromResponse({ status, payload, requestId = null, fallbackMessage }) {
  const type = typeFromStatus(status)
  const nestedError =
    payload?.error && typeof payload.error === 'object' && !Array.isArray(payload.error)
      ? payload.error
      : null

  const message =
    (typeof payload?.message === 'string' && payload.message) ||
    (typeof nestedError?.message === 'string' && nestedError.message) ||
    (typeof payload?.error === 'string' && payload.error) ||
    (typeof payload?.detail === 'string' && payload.detail) ||
    fallbackMessage ||
    defaultMessageForType(type, status)

  return new ApiError({
    type,
    status,
    message,
    details: nestedError?.details ?? payload?.details ?? payload?.data ?? null,
    fieldErrors: extractFieldErrors(payload),
    requestId: requestId || payload?.requestId || payload?.meta?.requestId || null,
    raw: payload,
  })
}

export function createNetworkError(cause) {
  return new ApiError({
    type: API_ERROR_TYPES.NETWORK,
    status: null,
    message: defaultMessageForType(API_ERROR_TYPES.NETWORK),
    raw: cause,
  })
}

export function createTimeoutError(cause) {
  return new ApiError({
    type: API_ERROR_TYPES.TIMEOUT,
    status: null,
    message: defaultMessageForType(API_ERROR_TYPES.TIMEOUT),
    raw: cause,
  })
}
