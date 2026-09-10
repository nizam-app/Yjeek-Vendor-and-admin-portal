import { Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useApiResource } from '../../../hooks/useApiResource'
import { apiConfig, isAdminRealApiFeature } from '../../../api/config'
import { adminService } from '../../../services/adminService'
import { ApiErrorBanner, TableBodySkeleton } from '../../../components/admin/ApiState'
import { Badge } from '../../../components/admin/Badge'
import { cn } from '../../../components/admin/cn'

const VIEW_TABS = ['Notifications', 'Promo codes', 'Promo categories', 'Geofence offers']
const COLUMNS = ['Vendor', 'Offer', 'Radius', 'Coupon', 'Window', 'Status', 'Triggered', 'Expiry', '']

function useRealMarketing() {
  return isAdminRealApiFeature('marketing') || !apiConfig.adminUseMockApi
}

function statusTone(status) {
  const s = String(status || '').toUpperCase()
  if (s === 'ACTIVE') return 'green'
  if (s === 'PAUSED') return 'yellow'
  if (s === 'DRAFT') return 'blue'
  if (s === 'EXPIRED') return 'gray'
  return 'gray'
}

function formatExpiry(value) {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleString()
  } catch {
    return '—'
  }
}

export default function AdminGeofenceCampaignsPage() {
  const navigate = useNavigate()
  const useReal = useRealMarketing()

  const { data, error, isLoading, refetch } = useApiResource(
    () => {
      if (!useReal) {
        return Promise.resolve({ data: { columns: COLUMNS, rows: [] }, meta: null })
      }
      return adminService.listAdminGeofenceCampaigns({
        status: 'all',
        limit: 50,
      })
    },
    [useReal],
  )

  const rows = Array.isArray(data?.rows) ? data.rows : []
  const columns = Array.isArray(data?.columns) && data.columns.length ? data.columns : COLUMNS
  const showSkeleton = isLoading && !error && !rows.length

  return (
    <div className="px-5 py-4 pb-8 max-[700px]:px-3">
      <div className="mb-3.5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[20px] font-bold tracking-[-0.02em] text-[#17231c]">
            Geofence offers
          </h2>
          <p className="mt-0.5 text-[12.5px] text-[#7c8780]">
            Push a time-limited coupon when a customer enters a vendor radius.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/admin/marketing/geofence/new')}
          className="inline-flex h-[34px] items-center gap-1.5 rounded-full bg-[#1aa054] px-4 text-[12px] font-bold text-white shadow-[0_1px_2px_rgba(20,40,28,.15)] hover:bg-[#158a47]"
        >
          <Plus size={14} strokeWidth={2.2} />
          New geofence offer
        </button>
      </div>

      <div className="mb-4 inline-flex flex-wrap items-center gap-1">
        {VIEW_TABS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => {
              if (item === 'Promo codes') navigate('/admin/marketing/promo-codes')
              else if (item === 'Promo categories') navigate('/admin/marketing/promo-categories')
              else if (item === 'Geofence offers') navigate('/admin/marketing/geofence')
              else navigate('/admin/marketing')
            }}
            className={cn(
              'relative h-[34px] rounded-full px-4 text-[12.5px] font-bold transition',
              item === 'Geofence offers'
                ? 'bg-[#e8f7ed] text-[#1aa054]'
                : 'bg-white text-[#69756d] ring-1 ring-[#e4e8e4] hover:text-[#455249]',
            )}
          >
            {item}
            {item === 'Geofence offers' ? (
              <span className="absolute -right-1 -top-1 rounded-[3px] bg-[#8C3A2B] px-1 py-px text-[7.5px] font-bold tracking-[0.08em] text-white">
                NEW
              </span>
            ) : null}
          </button>
        ))}
      </div>

      <ApiErrorBanner error={error} onRetry={refetch} />

      <section className="rounded-[14px] border border-[#eceeec] bg-white p-5 shadow-[0_1px_2px_rgba(20,40,28,.03)] max-[700px]:p-4">
        <h3 className="mb-4 text-[15px] font-bold text-[#17231c]">All geofence campaigns</h3>
        <div className="overflow-hidden rounded-[12px] border border-[#eceeec]">
          <div className="w-full max-w-full overflow-x-auto overscroll-x-contain touch-pan-x [-webkit-overflow-scrolling:touch]">
            <table className="w-full min-w-[860px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[#edf0ee] bg-[#f6f8f6]">
                  {columns.map((column) => (
                    <th
                      key={column || 'actions'}
                      className="whitespace-nowrap px-4 py-2.5 text-[10px] font-medium uppercase tracking-[0.05em] text-[#8a948e]"
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {showSkeleton ? (
                  <TableBodySkeleton columns={columns.length} rows={5} />
                ) : rows.length ? (
                  rows.map((row) => (
                    <tr key={row.id} className="border-b border-[#edf0ee] bg-white last:border-0">
                      <td className="whitespace-nowrap px-4 py-3.5 text-[12.5px] font-semibold text-[#17231c]">
                        {row.vendorName || '—'}
                      </td>
                      <td className="max-w-[220px] truncate px-4 py-3.5 text-[12.5px] text-[#455249]">
                        {row.title || row.notificationTitle || '—'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-[12.5px] text-[#455249]">
                        {row.radiusMeters}m
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-[12.5px] font-bold text-[#1aa054]">
                        {row.promoCode || row.promo?.code || '—'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-[12.5px] text-[#455249]">
                        {row.offerWindowMinutes} min
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5">
                        <Badge tone={statusTone(row.status)}>{row.status}</Badge>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-[12.5px] text-[#455249]">
                        {row.stats?.triggered ?? 0}
                        {(row.stats?.opened != null || row.stats?.used != null) && (
                          <span className="text-[#8a948e]">
                            {' '}
                            · {row.stats?.opened ?? 0} open · {row.stats?.used ?? 0} used
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-[12.5px] text-[#455249]">
                        {formatExpiry(row.endsAt)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-right">
                        <button
                          type="button"
                          className="text-[12px] font-semibold text-[#1aa054] hover:underline"
                          onClick={() =>
                            navigate(`/admin/marketing/geofence/${encodeURIComponent(row.id)}/edit`)
                          }
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="px-4 py-10 text-center text-[13px] text-[#7c8780]"
                    >
                      No geofence offers yet. Create a promo code first, then link it here.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  )
}
