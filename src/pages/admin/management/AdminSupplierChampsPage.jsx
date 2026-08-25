import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Search } from 'lucide-react'
import motoBikeIcon from '../../../assets/moto_bike.png'
import carIcon from '../../../assets/💨.png'
import { useApiResource } from '../../../hooks/useApiResource'
import { apiConfig, isAdminRealApiFeature } from '../../../api/config'
import { adminService } from '../../../services/adminService'
import { ApiErrorBanner, ApiState } from '../../../components/admin/ApiState'
import { Badge } from '../../../components/admin/Badge'

function statusTone(status) {
  if (status === 'Online') return 'green'
  if (status === 'On delivery') return 'blue'
  if (status === 'Suspended') return 'red'
  return 'gray'
}

function VehicleLabel({ type }) {
  if (type === 'Bike') {
    return (
      <span className="inline-flex items-center gap-1.5">
        <img src={motoBikeIcon} alt="" className="h-3.5 w-3.5 object-contain" />
        Bike
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5">
      <img src={carIcon} alt="" className="h-3.5 w-3.5 object-contain" />
      Car
    </span>
  )
}

export default function AdminSupplierChampsPage() {
  const { supplierId } = useParams()
  const navigate = useNavigate()
  const useRealFleet = isAdminRealApiFeature('fleet') || !apiConfig.adminUseMockApi
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const limit = 50

  const { data: supplierData } = useApiResource(
    () => {
      if (!useRealFleet) {
        return Promise.resolve({ data: { name: 'Supplier', champsCount: 0 } })
      }
      return adminService.getAdminFleetSupplier(supplierId, {})
    },
    [supplierId, useRealFleet],
  )

  const { data, error, isLoading, refetch } = useApiResource(
    () => {
      if (!useRealFleet) {
        return Promise.resolve({
          data: {
            rows: [],
            pagination: { page: 1, limit, total: 0 },
          },
        })
      }
      return adminService.listAdminFleetChamps({
        supplierId,
        search: query,
        statusTab: 'All',
        limit,
        page,
        includeSummary: false,
      })
    },
    [supplierId, useRealFleet, query, page],
  )

  const supplierName = supplierData?.name || 'Supplier'
  const rows = data?.rows || []
  const pagination = data?.pagination || { page: 1, limit, total: rows.length }
  const totalPages = Math.max(1, Math.ceil((pagination.total || 0) / limit))

  const titleCount = useMemo(() => {
    if (pagination.total != null) return pagination.total
    return supplierData?.champsCount ?? rows.length
  }, [pagination.total, supplierData?.champsCount, rows.length])

  if (!useRealFleet) {
    return (
      <div className="px-5 pb-10 pt-4 max-[700px]:px-3">
        <ApiState
          error="Real fleet API is required to view supplier champs."
          onRetry={() => navigate(`/admin/fleet/suppliers/${encodeURIComponent(supplierId)}`)}
        />
      </div>
    )
  }

  if (isLoading && rows.length === 0 && !error) {
    return <ApiState isLoading onRetry={refetch} />
  }

  return (
    <div className="px-5 pb-10 pt-4 max-[700px]:px-3">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(`/admin/fleet/suppliers/${encodeURIComponent(supplierId)}`)}
          className="inline-flex h-[34px] shrink-0 items-center gap-1 rounded-full border border-[#e4e8e4] bg-white px-3 text-[13px] font-medium text-[#455249] shadow-[0_1px_2px_rgba(20,40,28,.04)] hover:bg-[#f6f8f6]"
        >
          <ChevronLeft size={15} strokeWidth={2.2} />
          Supplier
        </button>
        <div className="min-w-0 flex-1">
          <h2 className="text-[22px] font-bold tracking-[-0.02em] text-[#17231c]">
            Champs · {supplierName}
          </h2>
          <p className="mt-0.5 text-[12.5px] text-[#7c8780]">{titleCount} champs under this supplier</p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <label className="inline-flex h-[36px] min-w-[220px] flex-1 items-center gap-2 rounded-full border border-[#e4e8e4] bg-white px-3 shadow-[0_1px_2px_rgba(20,40,28,.03)]">
          <Search size={15} className="shrink-0 text-[#8a948e]" />
          <input
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setPage(1)
            }}
            placeholder="Search champs…"
            className="min-w-0 flex-1 border-0 bg-transparent p-0 text-[13px] text-[#17231c] outline-none placeholder:text-[#9aa49d]"
          />
        </label>
      </div>

      {error ? <ApiErrorBanner error={error} onRetry={refetch} className="mb-4" /> : null}

      <section className="rounded-[14px] border border-[#eceeec] bg-white p-5 shadow-[0_1px_2px_rgba(20,40,28,.03)] max-[700px]:p-4">
        <div className="overflow-hidden rounded-[12px] border border-[#eceeec]">
          <div className="w-full max-w-full overflow-x-auto overscroll-x-contain touch-pan-x [-webkit-overflow-scrolling:touch]">
            <table className="w-full min-w-[640px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[#edf0ee] bg-[#f6f8f6]">
                  {['Champ', 'Vehicle', 'Contact', 'Status', 'Tier'].map((column) => (
                    <th
                      key={column}
                      className="whitespace-nowrap px-4 py-2.5 text-[10px] font-medium uppercase tracking-[0.05em] text-[#8a948e]"
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-[13px] text-[#7c8780]">
                      {isLoading ? 'Loading champs…' : 'No champs found for this supplier.'}
                    </td>
                  </tr>
                ) : null}
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className="cursor-pointer border-b border-[#edf0ee] bg-white last:border-0 hover:bg-[#f6f8f6]"
                    onClick={() => navigate(`/admin/fleet/${encodeURIComponent(row.id)}`)}
                  >
                    <td className="whitespace-nowrap px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-bold"
                          style={{ background: row.avatarBg, color: row.avatarText }}
                        >
                          {row.initials}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-medium text-[#17231c]">{row.name}</p>
                          <p className="truncate text-[11px] text-[#7c8780]">{row.displayId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-[12.5px] text-[#455249]">
                      <VehicleLabel type={row.vehicle} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-[12.5px] text-[#455249]">
                      {row.contact}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5">
                      <Badge tone={statusTone(row.status)}>{row.status}</Badge>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-[12.5px] text-[#455249]">
                      {row.tier || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {totalPages > 1 ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[12px] text-[#7c8780]">
              Page {pagination.page} of {totalPages} · {pagination.total} champs
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1 || isLoading}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className="inline-flex h-[32px] items-center rounded-full border border-[#e4e8e4] bg-white px-3 text-[12px] font-bold text-[#17231c] disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= totalPages || isLoading}
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                className="inline-flex h-[32px] items-center rounded-full border border-[#e4e8e4] bg-white px-3 text-[12px] font-bold text-[#17231c] disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  )
}
