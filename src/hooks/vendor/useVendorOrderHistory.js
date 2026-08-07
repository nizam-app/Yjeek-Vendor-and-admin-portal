import { useApiResource } from '../useApiResource'
import { orderService } from '../../services/vendor/orderService'

/**
 * Vendor orders history list.
 * Orders history → useVendorOrderHistory → orderService.getOrderHistory → mapper → apiClient
 *
 * @param {{
 *   limit?: number,
 *   page?: number,
 *   search?: string,
 *   status?: string,
 *   type?: string,
 *   branchId?: string|null,
 *   from?: string,
 *   to?: string,
 * }} [options]
 */
export function useVendorOrderHistory(options = {}) {
  const limit = options.limit ?? 20
  const page = options.page ?? 1
  const search = String(options.search || '').trim()
  const status = String(options.status || 'all').trim()
  const type = String(options.type || '').trim()
  const branchId = options.branchId ? String(options.branchId) : ''
  const from = options.from || ''
  const to = options.to || ''

  return useApiResource(
    () =>
      orderService.getOrderHistory({
        limit,
        page,
        search: search || undefined,
        status: status || undefined,
        type: type || undefined,
        branchId: branchId || undefined,
        from: from || undefined,
        to: to || undefined,
      }),
    [limit, page, search, status, type, branchId, from, to],
  )
}
