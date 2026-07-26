import { apiClient } from '../../api/client'
import { endpoints } from '../../api/endpoints'
import { mapVendorBranch, mapVendorBranchesResponse } from '../../mappers/vendor/mapVendorBranches'
import {
  buildBranchMenuUpdateBody,
  mapVendorBranchMenuResponse,
} from '../../mappers/vendor/mapVendorBranchMenu'
import { mapUiHoursToApiOpeningHours } from '../../mappers/vendor/mapVendorOpeningHours'

function toNumberOrNull(value) {
  if (value === '' || value === null || value === undefined) return null
  const numeric = Number(value)
  return Number.isNaN(numeric) ? null : numeric
}

const UI_STATUS_TO_API = {
  Open: 'OPEN',
  Busy: 'BUSY',
  Closed: 'CLOSED',
}

/** Fired when vendor branch list/status changes so Topbar + Branches stay in sync. */
export const VENDOR_BRANCHES_UPDATED_EVENT = 'yjeek:vendor-branches-updated'

export function notifyVendorBranchesUpdated() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(VENDOR_BRANCHES_UPDATED_EVENT))
}

/**
 * Vendor branches service.
 * Confirmed: list, get, update (incl. openingHours), set status, close-all, open-all,
 * delete, get/update branch menu.
 */
export const branchService = {
  async getBranches(options = {}) {
    const response = await apiClient.get(endpoints.vendor.branches, {
      ...options,
      scope: 'vendor',
    })

    return {
      data: mapVendorBranchesResponse(response?.data),
      meta: response?.meta ?? null,
    }
  },

  /**
   * GET /vendor-panel/branches/:branchId
   */
  async getBranch(branchId, options = {}) {
    const response = await apiClient.get(endpoints.vendor.branch(branchId), {
      ...options,
      scope: 'vendor',
    })

    return {
      data: mapVendorBranch(response?.data),
      meta: response?.meta ?? null,
    }
  },

  /**
   * PATCH /vendor-panel/branches/:branchId
   * Confirmed Postman body: name, address, phone, deliveryRadiusKm, etaMin,
   * minOrderAmount, openingHours.
   */
  async updateBranch(branchId, payload = {}, options = {}) {
    const body = {
      phone: payload.phone,
      etaMin: toNumberOrNull(payload.etaMin),
    }

    if (payload.name !== undefined) body.name = payload.name
    if (payload.address !== undefined) body.address = payload.address

    const radius =
      payload.deliveryRadiusKm !== undefined ? payload.deliveryRadiusKm : payload.radiusKm
    if (radius !== undefined) body.deliveryRadiusKm = toNumberOrNull(radius)

    if (payload.minOrderAmount !== undefined || payload.minOrderValue !== undefined) {
      body.minOrderAmount = toNumberOrNull(
        payload.minOrderAmount !== undefined ? payload.minOrderAmount : payload.minOrderValue,
      )
    }

    if (payload.openingHours !== undefined) {
      body.openingHours = payload.openingHours
    } else if (payload.hours !== undefined) {
      body.openingHours = mapUiHoursToApiOpeningHours(payload.hours)
    }

    const response = await apiClient.patch(endpoints.vendor.branch(branchId), body, {
      ...options,
      scope: 'vendor',
    })

    notifyVendorBranchesUpdated()

    return {
      data: mapVendorBranch(response?.data),
      meta: response?.meta ?? null,
    }
  },

  /**
   * DELETE /vendor-panel/branches/:branchId
   * Confirmed from Postman "Delete Branch".
   */
  async deleteBranch(branchId, options = {}) {
    const response = await apiClient.delete(endpoints.vendor.branch(branchId), {
      ...options,
      scope: 'vendor',
    })

    notifyVendorBranchesUpdated()

    return {
      data: response?.data ?? { success: true },
      meta: response?.meta ?? null,
    }
  },

  /**
   * PATCH /vendor-panel/branches/:branchId/status
   * Confirmed from Postman "Set status OPEN". Body uses API enum status.
   * @param {string} branchId
   * @param {'Open'|'Busy'|'Closed'|'OPEN'|'BUSY'|'CLOSED'} status
   */
  async setBranchStatus(branchId, status, options = {}) {
    const id = encodeURIComponent(String(branchId || '').trim())
    const raw = String(status || '').trim()
    const apiStatus = UI_STATUS_TO_API[raw] || raw.toUpperCase()

    const response = await apiClient.patch(
      `${endpoints.vendor.branches}/${id}/status`,
      { status: apiStatus },
      {
        ...options,
        scope: 'vendor',
      },
    )

    notifyVendorBranchesUpdated()

    return {
      data: mapVendorBranch(response?.data),
      meta: response?.meta ?? null,
    }
  },

  /**
   * PATCH /vendor-panel/branches/close-all
   * Returns the same list shape as GET branches (`count` + `branches`).
   */
  async closeAllBranches(options = {}) {
    const response = await apiClient.patch(
      endpoints.vendor.branchesCloseAll,
      {},
      {
        ...options,
        scope: 'vendor',
      },
    )

    notifyVendorBranchesUpdated()

    return {
      data: mapVendorBranchesResponse(response?.data),
      meta: response?.meta ?? null,
    }
  },

  /**
   * PATCH /vendor-panel/branches/open-all
   * Returns the same list shape as GET branches (`count` + `branches`).
   */
  async openAllBranches(options = {}) {
    const response = await apiClient.patch(
      endpoints.vendor.branchesOpenAll,
      {},
      {
        ...options,
        scope: 'vendor',
      },
    )

    notifyVendorBranchesUpdated()

    return {
      data: mapVendorBranchesResponse(response?.data),
      meta: response?.meta ?? null,
    }
  },

  /**
   * GET /vendor-panel/catalog/branches/:branchId/menu
   * Confirmed from Postman "GET Branch menu".
   */
  async getBranchMenu(branchId, options = {}) {
    const response = await apiClient.get(endpoints.vendor.catalog.branchMenu(branchId), {
      ...options,
      scope: 'vendor',
    })

    return {
      data: mapVendorBranchMenuResponse(response?.data),
      meta: response?.meta ?? null,
    }
  },

  /**
   * PATCH /vendor-panel/catalog/branches/:branchId/menu
   * Confirmed from Postman "PATCH Edit Branch menu".
   * Accepts either a raw `{ items, categories }` payload or a mapped menu tree
   * (auto-built via buildBranchMenuUpdateBody).
   */
  async updateBranchMenu(branchId, payload = {}, options = {}) {
    const body = Array.isArray(payload)
      ? buildBranchMenuUpdateBody(payload)
      : Array.isArray(payload?.menu)
        ? buildBranchMenuUpdateBody(payload.menu)
        : payload?.items || payload?.categories
          ? {
              items: payload.items || [],
              categories: payload.categories || [],
            }
          : buildBranchMenuUpdateBody(payload)

    const response = await apiClient.patch(
      endpoints.vendor.catalog.branchMenu(branchId),
      body,
      {
        ...options,
        scope: 'vendor',
      },
    )

    return {
      data: mapVendorBranchMenuResponse(response?.data),
      meta: response?.meta ?? null,
    }
  },
}
