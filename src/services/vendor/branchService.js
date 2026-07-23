import { apiClient } from '../../api/client'
import { endpoints } from '../../api/endpoints'
import { mapVendorBranch, mapVendorBranchesResponse } from '../../mappers/vendor/mapVendorBranches'

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
 * Confirmed: list, get, update, set status, close-all, open-all.
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
    const id = encodeURIComponent(String(branchId || '').trim())
    const response = await apiClient.get(`${endpoints.vendor.branches}/${id}`, {
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
   * Confirmed body fields include phone + etaMin.
   * Also sends other form fields that exist on the branch model.
   */
  async updateBranch(branchId, payload = {}, options = {}) {
    const id = encodeURIComponent(String(branchId || '').trim())
    const body = {
      phone: payload.phone,
      etaMin: toNumberOrNull(payload.etaMin),
    }

    if (payload.name !== undefined) body.name = payload.name
    if (payload.address !== undefined) body.address = payload.address
    if (payload.radiusKm !== undefined) body.radiusKm = toNumberOrNull(payload.radiusKm)
    if (payload.minOrderAmount !== undefined || payload.minOrderValue !== undefined) {
      body.minOrderAmount = toNumberOrNull(
        payload.minOrderAmount !== undefined ? payload.minOrderAmount : payload.minOrderValue,
      )
    }

    const response = await apiClient.patch(`${endpoints.vendor.branches}/${id}`, body, {
      ...options,
      scope: 'vendor',
    })

    return {
      data: mapVendorBranch(response?.data),
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

    return {
      data: mapVendorBranchesResponse(response?.data),
      meta: response?.meta ?? null,
    }
  },
}
