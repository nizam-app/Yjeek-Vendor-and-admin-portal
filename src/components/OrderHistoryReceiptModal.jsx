import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import { orderService } from '../services/vendor/orderService'

function formatPrice(price) {
  if (price === null || price === undefined || price === '') return 'BHD 0.000'
  if (typeof price === 'number') return `BHD ${price.toFixed(3)}`
  if (String(price).includes('BHD')) return String(price)
  const numeric = Number(String(price).replace(/[^\d.-]/g, ''))
  if (!Number.isNaN(numeric) && String(price).trim() !== '') return `BHD ${numeric.toFixed(3)}`
  return String(price)
}

function DashDivider() {
  return (
    <svg width="380" height="1" viewBox="0 0 380 1" className="w-full max-w-full shrink-0" role="separator" aria-hidden="true">
      <line x1="0" y1="0.5" x2="380" y2="0.5" stroke="#CCD1CC" strokeWidth="1" strokeDasharray="5 4" />
    </svg>
  )
}

function MetaRow({
  label,
  value,
  labelClass = 'text-[12.5px] font-medium text-[#69706E]',
  valueClass = 'text-[12.5px] font-medium text-[#1A1A1A]',
}) {
  return (
    <div className="flex w-full min-h-[15px] items-center gap-2">
      <span className={`shrink-0 leading-[15px] ${labelClass}`}>{label}</span>
      <span className="min-w-2 flex-1" />
      <span className={`shrink-0 text-right leading-[15px] ${valueClass}`}>{value}</span>
    </div>
  )
}

/**
 * Order history receipt modal.
 * Fetches GET /vendor-panel/orders/:orderId/receipt when opened.
 */
export default function OrderHistoryReceiptModal({ open, onClose, orderId = null, order = null }) {
  const [receipt, setReceipt] = useState(null)
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!open) return undefined
    function onKeyDown(event) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  useEffect(() => {
    if (!open) {
      setReceipt(null)
      setError(null)
      setIsLoading(false)
      return undefined
    }

    const id = String(orderId || order?.backendId || '').trim()
    if (!id) {
      setReceipt(order || null)
      setError(null)
      setIsLoading(false)
      return undefined
    }

    let cancelled = false
    setIsLoading(true)
    setError(null)

    orderService
      .getOrderReceipt(id)
      .then((response) => {
        if (cancelled) return
        setReceipt(response?.data || null)
        setIsLoading(false)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err)
        setReceipt(null)
        setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, orderId, order?.backendId])

  if (!open) return null

  const view = receipt || null
  const items = view?.items?.length ? view.items : []

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-6" role="dialog" aria-modal="true">
      <button type="button" className="absolute inset-0 bg-[rgba(0,0,0,0.25)]" aria-label="Close receipt" onClick={onClose} />
      <div className="relative max-h-[90vh] w-[440px] max-w-full overflow-hidden rounded-[16px] bg-white shadow-[0px_12px_40px_rgba(0,0,0,0.25)]">
        <div className="flex max-h-[90vh] flex-col gap-3 overflow-y-auto px-6 pt-6 pb-[22px]">
          {isLoading && !view ? (
            <p className="py-10 text-center text-[13px] text-ink-muted">Loading receipt…</p>
          ) : null}

          {error && !view ? (
            <div className="py-10 text-center text-[13px] text-danger">
              Unable to load receipt.{' '}
              <button
                type="button"
                className="underline"
                onClick={() => {
                  const id = String(orderId || order?.backendId || '').trim()
                  if (!id) return
                  setIsLoading(true)
                  setError(null)
                  orderService
                    .getOrderReceipt(id)
                    .then((response) => {
                      setReceipt(response?.data || null)
                      setIsLoading(false)
                    })
                    .catch((err) => {
                      setError(err)
                      setIsLoading(false)
                    })
                }}
              >
                Try again
              </button>
            </div>
          ) : null}

          {view ? (
            <>
              <div className="flex flex-col items-start gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-[20px] bg-[#E3F2EB] px-3 py-[5px] text-[11px] font-bold leading-[14px] text-[#127036]">
                  <Check size={12} strokeWidth={3} />
                  {String(view.badge || view.status || 'Receipt').toUpperCase()}
                </span>
                <h2 className="text-[16px] font-bold leading-[19px] text-[#1A1A1A]">{view.branch}</h2>
                <p className="text-[11px] font-normal leading-[14px] text-[#949C94]">
                  Order {view.id}
                  {view.when ? ` · ${view.when}` : ''}
                  {view.customer && view.customer !== '—' ? ` · ${view.customer}` : ''}
                </p>
              </div>

              <DashDivider />

              <div className="flex flex-col gap-2">
                {items.length === 0 ? (
                  <p className="text-[12.5px] text-[#69706E]">No items on this receipt.</p>
                ) : (
                  items.map((item, idx) => (
                    <div key={`${item.name}-${idx}`} className="flex w-full min-h-[15px] items-center gap-2">
                      <span className="shrink-0 text-[12.5px] font-medium leading-[15px] text-[#69706E]">
                        {item.qty}× {item.name}
                      </span>
                      <span className="min-w-2 flex-1" />
                      <span className="shrink-0 text-[12.5px] font-medium leading-[15px] text-[#1A1A1A]">
                        {formatPrice(item.price)}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <DashDivider />

              <div className="flex flex-col gap-[7px]">
                <MetaRow label="Subtotal" value={formatPrice(view.subtotal || view.total)} />
                <MetaRow label="Delivery" value={formatPrice(view.delivery || 'BHD 0.000')} />
                {view.serviceFee ? <MetaRow label="Service fee" value={formatPrice(view.serviceFee)} /> : null}
                {view.discount && view.discount !== 'BHD 0.000' ? (
                  <MetaRow label="Discount" value={formatPrice(view.discount)} />
                ) : null}
                {view.vat ? <MetaRow label="VAT" value={formatPrice(view.vat)} /> : null}
                <div className="flex w-full min-h-[19px] items-center gap-2">
                  <span className="shrink-0 text-[14px] font-bold leading-[17px] text-[#1A1A1A]">Total</span>
                  <span className="min-w-2 flex-1" />
                  <span className="shrink-0 text-[16px] font-bold leading-[19px] text-[#1A1A1A]">
                    {formatPrice(view.total)}
                  </span>
                </div>
                {view.paid ? <MetaRow label="Paid" value={view.paid} /> : null}
              </div>

              <div className="mt-auto w-full pt-1">
                <button
                  type="button"
                  className="h-12 w-full rounded-full bg-green-light-bg text-[14px] font-bold leading-[17px] text-white hover:brightness-[0.96]"
                  onClick={() => window.print?.()}
                >
                  Print receipt
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}
