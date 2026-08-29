import { useEffect, useState } from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '../cn'
import AdminMediaImage from '../AdminMediaImage'
import { formatApiErrorMessage } from '../../../api/errors'
import { adminUiEditorService } from '../../../services/admin/uiEditorService'

function formatBhd(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '0.000'
  return n.toFixed(3)
}

export default function AddExclusiveProductsModal({
  open,
  onClose,
  onSubmit,
  isSubmitting = false,
}) {
  const [search, setSearch] = useState('')
  const [products, setProducts] = useState([])
  const [selected, setSelected] = useState(() => new Set())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!open) return undefined
    setSearch('')
    setSelected(new Set())
    setError(null)
    return undefined
  }, [open])

  useEffect(() => {
    if (!open) return undefined
    const timer = setTimeout(() => {
      setLoading(true)
      adminUiEditorService
        .searchExclusiveOfferProducts({ search: search.trim(), limit: 30 })
        .then((result) => {
          setProducts(result?.data?.products || [])
        })
        .catch((err) => setError(err))
        .finally(() => setLoading(false))
    }, search.trim() ? 250 : 0)
    return () => clearTimeout(timer)
  }, [open, search])

  if (!open) return null

  const toggleProduct = (product) => {
    if (!product?.id || product.alreadySelected) return
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(product.id)) next.delete(product.id)
      else next.add(product.id)
      return next
    })
  }

  const handleAdd = async () => {
    const productIds = [...selected]
    if (!productIds.length) {
      setError(
        Object.assign(new Error('Select at least one product.'), {
          message: 'Select at least one product.',
        }),
      )
      return
    }
    try {
      await onSubmit?.({ productIds })
    } catch (err) {
      setError(err)
    }
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/40"
        disabled={isSubmitting}
        onClick={() => !isSubmitting && onClose?.()}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-[520px] rounded-t-[16px] bg-white p-5 shadow-[0_18px_44px_rgba(0,0,0,0.28)] sm:rounded-[16px]"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-[16px] font-bold text-[#17231c]">Add products</h3>
            <p className="mt-0.5 text-[12.5px] text-[#7c8780]">
              Search catalog products to feature in Super Exclusive offers.
            </p>
          </div>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-[8px] text-[#8a948e] hover:bg-[#f7f9f7]"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="relative mb-3">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8a948e]" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search products…"
            className="h-[40px] w-full rounded-[10px] border border-[#e4e8e4] bg-[#fafbfa] pl-9 pr-3 text-[13px] text-[#17231c] outline-none focus:border-[#1aa054]"
          />
        </div>

        {error ? (
          <p className="mb-3 text-[13px] text-[#c91a24]">
            {formatApiErrorMessage(error, 'Unable to load products.')}
          </p>
        ) : null}

        <div className="mb-4 max-h-[360px] space-y-1.5 overflow-y-auto pr-1">
          {loading ? <p className="text-[13px] text-[#8a948e]">Searching products…</p> : null}
          {!loading && products.length === 0 ? (
            <p className="text-[13px] text-[#8a948e]">No products found.</p>
          ) : null}
          {!loading
            ? products.map((product) => {
                const isSelected = selected.has(product.id)
                const disabled = product.alreadySelected || isSubmitting
                return (
                  <button
                    key={product.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => toggleProduct(product)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-[10px] border px-3 py-2 text-left transition',
                      isSelected ? 'border-[#1aa054] bg-[#eef8f1]' : 'border-[#e4e8e4] bg-white',
                      disabled && 'cursor-not-allowed opacity-55',
                    )}
                  >
                    {product.imageUrl ? (
                      <AdminMediaImage
                        src={product.imageUrl}
                        className="h-10 w-10 shrink-0 rounded-[8px] object-cover"
                        fallbackClassName="h-10 w-10 shrink-0 rounded-[8px] bg-[#eceeec]"
                        iconSize={14}
                      />
                    ) : (
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[8px] bg-[#eceeec] text-[10px] font-bold text-[#8a948e]">
                        IMG
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-semibold text-[#17231c]">
                        {product.name}
                      </span>
                      <span className="mt-0.5 block truncate text-[11.5px] text-[#8a948e]">
                        {product.vendor?.name || 'Vendor'} · BHD {formatBhd(product.price)}
                        {product.alreadySelected ? ' · Already added' : ''}
                      </span>
                    </span>
                    <span
                      className={cn(
                        'grid h-5 w-5 shrink-0 place-items-center rounded-[6px] border text-[11px] font-bold',
                        isSelected
                          ? 'border-[#1aa054] bg-[#1aa054] text-white'
                          : 'border-[#d5dbd6] bg-white text-transparent',
                      )}
                    >
                      ✓
                    </span>
                  </button>
                )
              })
            : null}
        </div>

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="inline-flex h-[38px] items-center rounded-full border border-[#d5dbd6] bg-white px-4 text-[12.5px] font-bold text-[#455249] hover:bg-[#f7f9f7] disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSubmitting || selected.size === 0}
            onClick={handleAdd}
            className="inline-flex h-[38px] items-center rounded-full bg-[#1aa054] px-4 text-[12.5px] font-bold text-white hover:bg-[#158a47] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Adding…' : `Add ${selected.size || ''} product${selected.size === 1 ? '' : 's'}`}
          </button>
        </div>
      </div>
    </div>
  )
}
