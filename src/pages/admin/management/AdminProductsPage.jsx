import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock3, Pencil, Search, X } from 'lucide-react'
import { ApiErrorBanner, TableBodySkeleton } from '../../../components/admin/ApiState'
import { Badge } from '../../../components/admin/Badge'
import AdminMediaImage from '../../../components/admin/AdminMediaImage'
import { adminStoresCatalogService } from '../../../services/admin/storesCatalogService'
import { formatApiErrorMessage } from '../../../api/errors'
import { showError, showSuccess } from '../../../utils/toast'

const inputClass =
  'box-border h-[40px] w-full rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white px-3 text-[13px] text-[#17231c] outline-none focus:border-[#1aa054]'
const primaryBtn =
  'inline-flex h-[34px] items-center justify-center gap-1.5 rounded-full bg-[#1aa054] px-4 text-[12px] font-bold text-white hover:bg-[#158a47] disabled:opacity-50'
const outlineBtn =
  'inline-flex h-[34px] items-center justify-center gap-1.5 rounded-full border border-[#dfe4e0] bg-white px-3 text-[12px] font-medium text-[#127338] hover:bg-[#f6f8f6] disabled:opacity-50'

function openNativeTimePicker(event) {
  try {
    event.currentTarget.showPicker?.()
  } catch {
    /* unsupported */
  }
}

function formatWindow(from, to) {
  if (!from && !to) return 'All day'
  if (from && to) return `${from} – ${to}`
  if (from) return `From ${from}`
  return `Until ${to}`
}

export default function AdminProductsPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editRow, setEditRow] = useState(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await adminStoresCatalogService.listProducts({
        search: query || undefined,
        page,
        limit: 20,
      })
      setRows(data.products)
      setTotal(data.total)
    } catch (err) {
      setError(err)
      setRows([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [page, query])

  useEffect(() => {
    void load()
  }, [load])

  const submitSearch = (event) => {
    event.preventDefault()
    setPage(1)
    setQuery(search.trim())
  }

  const handleSave = async ({ availableFrom, availableTo }) => {
    if (!editRow?.id) return
    setSaving(true)
    try {
      await adminStoresCatalogService.updateProduct(editRow.id, {
        availableFrom: availableFrom || null,
        availableTo: availableTo || null,
      })
      showSuccess('Availability updated.')
      setEditRow(null)
      await load()
    } catch (err) {
      showError(formatApiErrorMessage(err, 'Failed to update availability.'))
    } finally {
      setSaving(false)
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / 20))

  return (
    <div className="px-5 py-4 pb-8 max-[700px]:px-3">
      <div className="mb-3.5 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[20px] font-bold tracking-[-0.02em] text-[#17231c]">Products</h2>
          <p className="mt-1 max-w-[560px] text-[12.5px] leading-[18px] text-[#7c8780]">
            Set daily availability windows (Bahrain time). Products outside the window are hidden
            from customer menus.
          </p>
        </div>
        <button type="button" className={outlineBtn} onClick={() => navigate('/admin/stores')}>
          Store types
        </button>
      </div>

      <form onSubmit={submitSearch} className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[240px] flex-1">
          <Search
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8a948e]"
          />
          <input
            className={`${inputClass} pl-9`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products or vendors…"
          />
        </div>
        <button type="submit" className={primaryBtn}>
          Search
        </button>
      </form>

      <ApiErrorBanner error={error} onRetry={load} />

      <section className="overflow-hidden rounded-[14px] border border-[#eceeec] bg-white shadow-[0_1px_2px_rgba(20,40,28,.03)]">
        <div className="w-full max-w-full overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-[#f7f8f7] text-[11px] font-semibold uppercase tracking-[0.04em] text-[#7c8780]">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Vendor</th>
                <th className="px-4 py-3">Availability</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Edit</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableBodySkeleton columns={5} rows={6} />
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-[13px] text-[#8a948e]">
                    No products found.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="border-t border-[#eceeec]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="size-10 overflow-hidden rounded-[8px] bg-[#f3f5f3]">
                          {row.imageUrl ? (
                            <AdminMediaImage
                              src={row.imageUrl}
                              alt=""
                              className="size-full object-cover"
                            />
                          ) : null}
                        </div>
                        <div>
                          <p className="text-[13px] font-semibold text-[#17231c]">{row.name}</p>
                          <p className="text-[11px] text-[#8a948e]">BHD {row.price.toFixed(3)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-[#455249]">
                      {row.vendor?.name || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 text-[12.5px] text-[#17231c]">
                        <Clock3 size={13} className="text-[#1aa054]" />
                        {formatWindow(row.availableFrom, row.availableTo)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={row.isAvailable && row.isActive ? 'green' : 'gray'}>
                        {row.isAvailable && row.isActive ? 'Live' : 'Off'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        className={outlineBtn}
                        onClick={() => setEditRow(row)}
                      >
                        <Pencil size={13} />
                        Hours
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 ? (
          <div className="flex items-center justify-between border-t border-[#eceeec] px-4 py-3">
            <p className="text-[12px] text-[#7c8780]">
              Page {page} of {totalPages} · {total} products
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                className={outlineBtn}
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <button
                type="button"
                className={outlineBtn}
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </section>

      {editRow ? (
        <AvailabilityModal
          product={editRow}
          busy={saving}
          onClose={() => setEditRow(null)}
          onSave={handleSave}
        />
      ) : null}
    </div>
  )
}

function AvailabilityModal({ product, busy, onClose, onSave }) {
  const [availableFrom, setAvailableFrom] = useState(product.availableFrom || '')
  const [availableTo, setAvailableTo] = useState(product.availableTo || '')

  useEffect(() => {
    setAvailableFrom(product.availableFrom || '')
    setAvailableTo(product.availableTo || '')
  }, [product])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
      <div className="w-full max-w-[420px] rounded-[14px] border border-[#eceeec] bg-white p-5 shadow-lg">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-[16px] font-bold text-[#17231c]">Edit availability</h3>
            <p className="mt-1 text-[12.5px] text-[#7c8780]">{product.name}</p>
          </div>
          <button type="button" className="rounded-full p-1.5 hover:bg-[#f3f5f3]" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="flex gap-3">
          <label className="flex-1">
            <span className="mb-1.5 block text-[12px] font-medium text-[#7c8780]">Available from</span>
            <input
              type="time"
              step={300}
              className={`${inputClass} cursor-pointer [color-scheme:light]`}
              value={availableFrom}
              onClick={openNativeTimePicker}
              onChange={(e) => setAvailableFrom(e.target.value)}
            />
          </label>
          <label className="flex-1">
            <span className="mb-1.5 block text-[12px] font-medium text-[#7c8780]">Available to</span>
            <input
              type="time"
              step={300}
              className={`${inputClass} cursor-pointer [color-scheme:light]`}
              value={availableTo}
              onClick={openNativeTimePicker}
              onChange={(e) => setAvailableTo(e.target.value)}
            />
          </label>
        </div>
        <p className="mt-2 text-[11.5px] text-[#8a948e]">
          Leave blank for all-day. Times use Bahrain (UTC+3).
        </p>

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className={outlineBtn} onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button
            type="button"
            className={primaryBtn}
            disabled={busy}
            onClick={() => onSave({ availableFrom, availableTo })}
          >
            {busy ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
