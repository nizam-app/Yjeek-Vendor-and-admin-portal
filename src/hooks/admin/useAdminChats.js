import { useEffect } from 'react'
import { useApiResource } from '../useApiResource'
import { isAdminRealApiFeature } from '../../api/config'
import { adminDashboardService } from '../../services/admin/dashboardService'

/**
 * Admin Open chats strip.
 * Silent-polls so a customer/champ message appears without a full page refresh.
 *
 * @param {{ refreshSeconds?: number }} [options]
 */
export function useAdminChats(options = {}) {
  const useReal = isAdminRealApiFeature('dashboard')
  const refreshSeconds = options.refreshSeconds ?? 3

  const resource = useApiResource(() => {
    if (!useReal) {
      return Promise.resolve({ data: { active: 0, unreadTotal: 0, items: [] }, meta: null })
    }
    return adminDashboardService.getChats()
  }, [useReal])

  useEffect(() => {
    if (!useReal || !refreshSeconds || Number(refreshSeconds) < 1) return undefined

    const intervalId = window.setInterval(async () => {
      try {
        const response = await adminDashboardService.getChats()
        resource.setData(response?.data || { active: 0, unreadTotal: 0, items: [] })
      } catch {
        // Keep the last successful strip; live orders already surface API errors.
      }
    }, Number(refreshSeconds) * 1000)

    return () => window.clearInterval(intervalId)
  }, [useReal, refreshSeconds, resource.setData])

  return resource
}
