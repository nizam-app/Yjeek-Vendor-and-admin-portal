import { useApiResource } from '../useApiResource'
import { adminDashboardService } from '../../services/admin/dashboardService'

/**
 * Admin Scheduled Orders → Calendar tab.
 * Page → useAdminScheduledCalendar → getScheduledCalendar → mapper → apiClient
 *
 * Fetches the week without location narrowing so cascading filter options
 * (governorate → city → block) stay complete; the page filters rows client-side.
 *
 * @param {{
 *   weekStart?: string,
 *   type?: string,
 *   vendorId?: string,
 *   driverId?: string,
 *   q?: string,
 *   sort?: string,
 *   limit?: number,
 *   region?: string,
 * }} [options]
 */
export function useAdminScheduledCalendar(options = {}) {
  const weekStart = options.weekStart || undefined
  const type = options.type || 'all'
  const vendorId = options.vendorId || undefined
  const driverId = options.driverId || undefined
  const q = options.q || undefined
  const sort = options.sort || 'window_asc'
  const limit = options.limit ?? 100
  const region = options.region

  return useApiResource(
    () =>
      adminDashboardService.getScheduledCalendar({
        weekStart,
        governorate: 'all',
        type,
        vendorId,
        driverId,
        q,
        sort,
        limit,
        region,
      }),
    [weekStart, type, vendorId, driverId, q, sort, limit, region],
  )
}
