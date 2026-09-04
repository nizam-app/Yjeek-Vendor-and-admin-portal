import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { cn } from './cn'
import { adminOrderService } from '../../services/admin/orderService'
import { ApiError, formatApiErrorMessage } from '../../api/errors'

const labelClass = 'mb-1.5 block text-[12px] font-medium text-[#7c8780]'
const inputClass =
  'box-border h-[40px] w-full appearance-none rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white px-3 pr-9 text-[13px] text-[#17231c] outline-none transition focus:border-[#d64044]'

/** Confirmed sample + UI design labels (not in action-options catalog). */
const ITEM_DISPOSITIONS = [
  { id: 'CHAMP_KEEPS', label: 'Champ keeps items' },
  { id: 'RETURN_TO_VENDOR', label: 'Return items to vendor' },
]

/** Confirmed sample FULL + UI design Partial / No refund. */
const REFUND_OPTIONS = [
  { id: 'FULL', labelPrefix: 'Full refund' },
  { id: 'PARTIAL', label: 'Partial refund' },
  { id: 'NONE', label: 'No refund' },
]

function causeLabel(cause) {
  const raw = String(cause || '')
  return raw
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

/**
 * Cancel order modal — Take action → Cancel order.
 * Confirmed POST: { itemDisposition, refund, cause, reason }
 * Note is UI-only (not in API body).
 */
export default function AdminCancelOrderModal({
  open,
  onClose,
  orderId,
  orderNumber = null,
  orderValueLabel = null,
  causes = [],
  reasonsByCause = {},
  incidentId = null,
  onSuccess,
}) {
  const [itemDisposition, setItemDisposition] = useState('CHAMP_KEEPS')
  const [refund, setRefund] = useState('FULL')
  const [cause, setCause] = useState('')
  const [reason, setReason] = useState('')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const causeOptions = Array.isArray(causes) ? causes.filter(Boolean).map(String) : []
  const reasonOptions = useMemo(() => {
    if (!cause || !reasonsByCause || typeof reasonsByCause !== 'object') return []
    const list = reasonsByCause[cause]
    return Array.isArray(list) ? list.filter(Boolean).map(String) : []
  }, [cause, reasonsByCause])

  useEffect(() => {
    if (!open) return
    setItemDisposition('CHAMP_KEEPS')
    setRefund('FULL')
    setNote('')
    setError(null)
    const firstCause = causeOptions[0] || ''
    setCause(firstCause)
    setReason('')
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset on open/order
  }, [open, orderId])

  useEffect(() => {
    if (!open) return
    setReason('')
  }, [open, cause])

  useEffect(() => {
    if (!open || reason) return
    if (!reasonOptions.length) return
    setReason(reasonOptions[0])
  }, [open, reason, reasonOptions])

  useEffect(() => {
    if (!open) return undefined
    function onKeyDown(e) {
      if (e.key === 'Escape' && !submitting) onClose?.()
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, submitting, onClose])

  if (!open) return null

  const subtitle = [
    orderNumber ? `#${orderNumber}` : null,
    orderValueLabel || null,
  ]
    .filter(Boolean)
    .join(' · ')

  async function handleSubmit(event) {
    event.preventDefault()
    if (!orderId || submitting) return

    setError(null)
    setSubmitting(true)
    try {
      if (!String(cause || '').trim()) {
        throw new ApiError({ message: 'Select a cancel cause.' })
      }
      if (!String(reason || '').trim()) {
        throw new ApiError({ message: 'Select a cancel reason.' })
      }
      if (!String(itemDisposition || '').trim()) {
        throw new ApiError({ message: 'Select item disposition.' })
      }
      if (!String(refund || '').trim()) {
        throw new ApiError({ message: 'Select a refund option.' })
      }

      await adminOrderService.cancel(orderId, {
        itemDisposition: String(itemDisposition).trim(),
        refund: String(refund).trim(),
        cause: String(cause).trim(),
        reason: String(reason).trim(),
        ...(incidentId ? { incidentId: String(incidentId) } : {}),
      })
      onSuccess?.()
      onClose?.()
    } catch (err) {
      setError(formatApiErrorMessage(err, 'Failed to cancel order.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close cancel order modal"
        onClick={submitting ? undefined : onClose}
        className="absolute inset-0 bg-black/40"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancel-order-title"
        className="relative flex max-h-[calc(100vh-32px)] w-full max-w-[480px] flex-col overflow-hidden rounded-[16px] bg-white shadow-[0_12px_40px_rgba(20,40,28,.18)]"
      >
        <div className="flex shrink-0 items-start gap-3 px-5 pt-5 pb-3">
          <div className="min-w-0 flex-1">
            <h2 id="cancel-order-title" className="text-[16px] font-bold text-[#17231c]">
              Cancel order
            </h2>
            {subtitle ? (
              <p className="mt-0.5 truncate text-[12px] text-[#7c8780]">{subtitle}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-[#8a948e] hover:bg-[#f3f5f3] hover:text-[#455249] disabled:opacity-50"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 pb-2">
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.06em] text-[#8a948e]">
                Items
              </p>
              <div className="space-y-2">
                {ITEM_DISPOSITIONS.map((option) => {
                  const selected = itemDisposition === option.id
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setItemDisposition(option.id)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-[12px] border px-3.5 py-3 text-left transition',
                        selected
                          ? 'border-[#1aa054] bg-[#f3faf5]'
                          : 'border-[#e4e8e4] bg-white hover:border-[#c5ced0]',
                      )}
                    >
                      <span
                        className={cn(
                          'grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full border-2',
                          selected ? 'border-[#1aa054]' : 'border-[#c5ced0]',
                        )}
                      >
                        {selected ? <span className="h-2.5 w-2.5 rounded-full bg-[#1aa054]" /> : null}
                      </span>
                      <span className="text-[13px] font-medium text-[#17231c]">{option.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.06em] text-[#8a948e]">
                Refund
              </p>
              <div className="space-y-2">
                {REFUND_OPTIONS.map((option) => {
                  const selected = refund === option.id
                  const label =
                    option.id === 'FULL' && orderValueLabel
                      ? `${option.labelPrefix} — ${orderValueLabel}`
                      : option.label || option.labelPrefix
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setRefund(option.id)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-[12px] border px-3.5 py-3 text-left transition',
                        selected
                          ? 'border-[#1aa054] bg-[#f3faf5]'
                          : 'border-[#e4e8e4] bg-white hover:border-[#c5ced0]',
                      )}
                    >
                      <span
                        className={cn(
                          'grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full border-2',
                          selected ? 'border-[#1aa054]' : 'border-[#c5ced0]',
                        )}
                      >
                        {selected ? <span className="h-2.5 w-2.5 rounded-full bg-[#1aa054]" /> : null}
                      </span>
                      <span className="text-[13px] font-medium text-[#17231c]">{label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.06em] text-[#8a948e]">
                Cause
              </p>
              {causeOptions.length === 0 ? (
                <p className="rounded-[10px] border border-[#e8ebe9] bg-[#fafbfa] px-3 py-3 text-[12px] text-[#7c8780]">
                  No cancel causes from API.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {causeOptions.map((item) => {
                    const selected = cause === item
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setCause(item)}
                        className={cn(
                          'inline-flex h-[34px] items-center rounded-full border px-3.5 text-[12px] font-medium transition',
                          selected
                            ? 'border-[#1aa054] bg-[#f3faf5] text-[#127338]'
                            : 'border-[#e4e8e4] bg-white text-[#455249] hover:border-[#c5ced0]',
                        )}
                      >
                        {causeLabel(item)}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            <label className="block">
              <span className={labelClass}>Reason</span>
              <div className="relative">
                <select
                  className={inputClass}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  disabled={submitting || reasonOptions.length === 0}
                >
                  {reasonOptions.length === 0 ? (
                    <option value="">No reasons for this cause</option>
                  ) : (
                    reasonOptions.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))
                  )}
                </select>
                <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[10px] text-[#69756d]">
                  ▾
                </span>
              </div>
            </label>

            <label className="block">
              <span className={labelClass}>Note (optional)</span>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                disabled={submitting}
                rows={2}
                placeholder="Add a note for the log…"
                className="box-border w-full resize-none rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white px-3 py-2.5 text-[13px] text-[#17231c] outline-none transition placeholder:text-[#9aa49d] focus:border-[#d64044]"
              />
            </label>

            <div className="flex items-start gap-2 rounded-[10px] bg-[#fdebec] px-3.5 py-3">
              <AlertTriangle size={14} className="mt-0.5 shrink-0 text-[#d64044]" strokeWidth={2.2} />
              <p className="text-[12px] leading-[16px] text-[#d64044]">
                Cancelling is final and cannot be undone. The customer and vendor are notified.
              </p>
            </div>

            {error ? (
              <div className="rounded-[10px] bg-[#fdebec] px-3.5 py-2.5 text-[12px] text-[#d64044]">
                {error}
              </div>
            ) : null}
          </div>

          <div className="flex shrink-0 items-center justify-end gap-2.5 border-t border-[#edf0ee] px-5 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="inline-flex h-[36px] items-center justify-center rounded-full border border-[#e4e8e4] bg-white px-4 text-[13px] font-medium text-[#455249] hover:bg-[#f6f8f6] disabled:opacity-60"
            >
              Keep order
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-[36px] items-center justify-center gap-1.5 rounded-full bg-[#d64044] px-4 text-[13px] font-medium text-white hover:brightness-[0.96] disabled:opacity-60"
            >
              <X size={14} strokeWidth={2.4} />
              {submitting ? 'Cancelling…' : 'Cancel order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
