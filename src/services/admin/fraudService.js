import { apiClient } from '../../api/client'

export const adminFraudService = {
  /**
   * List review flags
   * @param {{ status?: 'pending' | 'decided' | 'all', signal?: string, limit?: number, offset?: number }} params
   */
  async listFlags(params = {}) {
    const searchParams = new URLSearchParams()
    if (params.status) searchParams.set('status', params.status)
    if (params.signal) searchParams.set('signal', params.signal)
    if (params.limit) searchParams.set('limit', String(params.limit))
    if (params.offset) searchParams.set('offset', String(params.offset))

    const query = searchParams.toString()
    const path = `/admin/marketing/fraud/flags${query ? `?${query}` : ''}`
    const res = await apiClient.get(path)
    return res.data
  },

  /**
   * Get single flag detail
   * @param {string} flagId
   */
  async getFlag(flagId) {
    const res = await apiClient.get(`/admin/marketing/fraud/flags/${encodeURIComponent(flagId)}`)
    return res.data
  },

  /**
   * Decision 1: Release frozen credits & restore referral balance (Super Admin only)
   * @param {string} flagId
   */
  async releaseFlag(flagId) {
    const res = await apiClient.post(`/admin/marketing/fraud/flags/${encodeURIComponent(flagId)}/release`)
    return res.data
  },

  /**
   * Decision 2: Cancel credits & keep block (Super Admin only)
   * @param {string} flagId
   */
  async cancelCredits(flagId) {
    const res = await apiClient.post(`/admin/marketing/fraud/flags/${encodeURIComponent(flagId)}/cancel-credits`)
    return res.data
  },

  /**
   * Decision 3: Suspend account (Super Admin only)
   * @param {string} flagId
   * @param {{ note?: string, targetCustomerId?: string }} [payload]
   */
  async suspendAccount(flagId, payload = {}) {
    const res = await apiClient.post(`/admin/marketing/fraud/flags/${encodeURIComponent(flagId)}/suspend-account`, payload)
    return res.data
  },
}
