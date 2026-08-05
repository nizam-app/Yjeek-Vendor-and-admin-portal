import { useEffect, useState } from 'react'
import { Ban, ChevronDown, X } from 'lucide-react'
import { cn } from './cn'

const labelClass = 'mb-1.5 block text-[12px] font-medium text-[#7c8780]'
const inputClass =
  'box-border h-[40px] w-full rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white px-3 text-[13px] text-[#17231c] outline-none transition placeholder:text-[#9aa49d] focus:border-[#1aa054]'

/** Reasons aligned with Postman sample + common ops cases. */
const REASONS = [
  'Repeated SLA breaches',
  'Policy violation',
  'Fraud / abuse',
  'Quality complaints',
  'Other',
]

/**
 * Suspend vendor — collects `reason` for POST /admin/vendors/:id/suspend.
 */
export default function AdminSuspendVendorModal({
  open,
  onClose,
  storeName = 'Vendor',
  onConfirm,
}) {
  const [reason, setReason] = useState(REASONS[0])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!open) return
    setReason(REASONS[0])
    setSubmitting(false)
    setError(null)
  }, [open])

  if (!open) return null

  const handleConfirm = async () => {
    setError(null)
    setSubmitting(true)
    try {
      await onConfirm?.({ reason })
      onClose?.()
    } catch (err) {
      setError(err?.message || 'Suspend failed.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close suspend vendor modal"
        onClick={onClose}
        disabled={submitting}
        className="absolute inset-0 bg-black/40"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="suspend-vendor-title"
        className="relative w-full max-w-[480px] overflow-hidden rounded-[14px] bg-white shadow-[0_12px_40px_rgba(20,40,28,.18)]"
      >
        <div className="flex items-center gap-3 px-5 py-4">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#fdebec] text-[#d64044]">
            <Ban size={16} strokeWidth={2.2} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="suspend-vendor-title" className="text-[16px] font-bold text-[#17231c]">
              Suspend vendor
            </h2>
            <p className="mt-0.5 text-[12px] text-[#7c8780]">
              {storeName} · blocks ordering &amp; visibility
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="grid h-8 w-8 place-items-center rounded-md text-[#8a948e] hover:bg-[#f3f5f3] hover:text-[#455249]"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <div className="flex items-end gap-2 rounded-[10px] bg-[#fdebec] px-3.5 py-3">
            <span className="text-[16px] text-[#d64044]">⚠</span>
            <p className="text-[12px] leading-[16px] text-[#d64044]">
              Vendor goes offline and cannot accept orders until unsuspended.
            </p>
          </div>

          <label className="block">
            <span className={labelClass}>Reason</span>
            <div className="relative">
              <select
                className={cn(inputClass, 'appearance-none pr-9')}
                value={reason}
                disabled={submitting}
                onChange={(e) => setReason(e.target.value)}
              >
                {REASONS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#7c8780]"
              />
            </div>
          </label>

          {error ? <p className="text-[12px] font-medium text-[#d64044]">{error}</p> : null}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-[#edf0ee] px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="inline-flex h-[36px] items-center rounded-full border border-[#e4e8e4] bg-white px-4 text-[13px] font-medium text-[#455249] hover:bg-[#f6f8f6]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting}
            className="inline-flex h-[36px] items-center rounded-full bg-[#d64044] px-4 text-[13px] font-bold text-white hover:bg-[#c23538] disabled:opacity-60"
          >
            {submitting ? 'Suspending…' : 'Suspend vendor'}
          </button>
        </div>
      </div>
    </div>
  )
}
