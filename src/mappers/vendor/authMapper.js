import { ApiError } from '../../api/errors'

/** Confirmed Vendor.slaConfig.serviceModes — missing keys → false. */
export const DEFAULT_VENDOR_SERVICE_MODES = {
  hotFoodOnDemand: false,
  pickup: false,
  dineIn: false,
  scheduledDelivery: false,
  services: false,
}

/**
 * Normalize backend serviceModes into five booleans.
 * @param {unknown} raw
 */
export function mapVendorServiceModes(raw) {
  const src = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {}
  return {
    hotFoodOnDemand: Boolean(src.hotFoodOnDemand),
    pickup: Boolean(src.pickup),
    dineIn: Boolean(src.dineIn),
    scheduledDelivery: Boolean(src.scheduledDelivery),
    services: Boolean(src.services),
  }
}

/**
 * Read serviceModes from a mapped or raw auth user (safe defaults).
 * @param {object|null|undefined} user
 */
export function getVendorServiceModes(user) {
  if (user?.serviceModes && typeof user.serviceModes === 'object') {
    return mapVendorServiceModes(user.serviceModes)
  }
  return { ...DEFAULT_VENDOR_SERVICE_MODES }
}

/**
 * Stable Vendor auth user shape shared by Login and Get Me.
 * Missing optional Get Me–only fields are null (not invented).
 *
 * @param {Record<string, unknown>|null|undefined} backendUser
 */
export function mapVendorAuthUser(backendUser) {
  if (!backendUser || typeof backendUser !== 'object') {
    throw new ApiError({
      message: 'Invalid user payload from the server.',
    })
  }

  return {
    id: backendUser.id,
    email: backendUser.email,
    phone: backendUser.phone,
    countryCode: backendUser.countryCode ?? null,
    name: backendUser.displayName,
    role: 'vendor',
    backendRole: backendUser.role,
    status: backendUser.status ?? null,
    authProvider: backendUser.authProvider ?? null,
    staffRole: backendUser.staffRole,
    vendorId: backendUser.vendorId,
    vendorName: backendUser.vendorName,
    vendorLocationId: backendUser.vendorLocationId ?? null,
    isGroupAdmin: backendUser.isGroupAdmin,
    serviceModes: mapVendorServiceModes(backendUser.serviceModes),
  }
}

/**
 * Map confirmed Vendor login `data` payload.
 * @param {{ user?: object, accessToken?: string, refreshToken?: string }|null|undefined} data
 */
export function mapVendorLoginResponse(data) {
  const accessToken = data?.accessToken

  if (!accessToken || !data?.user) {
    throw new ApiError({
      message: 'Invalid login response from the server.',
    })
  }

  return {
    accessToken,
    refreshToken: data.refreshToken ?? null,
    user: mapVendorAuthUser(data.user),
  }
}

/**
 * Map confirmed Vendor Get Me `data` payload (user object at data root).
 * @param {Record<string, unknown>|null|undefined} data
 */
export function mapVendorMeResponse(data) {
  return mapVendorAuthUser(data)
}
