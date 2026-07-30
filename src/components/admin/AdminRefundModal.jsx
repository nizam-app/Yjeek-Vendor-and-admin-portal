import { useEffect, useState } from 'react'
import { Undo2, X } from 'lucide-react'
import { cn } from './cn'
import { adminOrderService } from '../../services/admin/orderService'
import { ApiError, formatApiErrorMessage } from '../../api/errors'
import { formatAdminMoney } from '../../mappers/admin/mapAdminOrderDetail'

const labelClass = 'mb-1.5 block text-[12px] font-medium text-[#7c8780]'
const inputClass =
  'box-border h-[40px] w-full appearance-none rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white px-3 pr-9 text-[13px] text-[#17231c] outline-none transition focus:border-[#1aa054]'

function optionValue(item) {
  if (typeof item === 'string') return item
  return String(item?.id || item?.label || '')
}

function optionLabel(item) {
  if (typeof item === 'string') return item
  return String(item?.label || item?.id || '')
}

function destinationUiLabel(item) {
  return optionLabel(item)
}

/**
 * Refund modal — Take action → Refund — full/partial.
 * Confirmed POST: { type, amount?, destination, reason, idempotencyKey }
 * Note is UI-only (not in API body).
 */
export default function AdminRefundModal({
  open,
  onClose,
  orderId,
  orderValueLabel = null,
  orderValueAmount = null,
  remainingRefundable = null,
  paymentLabel = null,
  currency = 'BHD',
  reasons = [],
  destinations = [],
  onSuccess,
}) {
  const [refundType, setRefundType] = useState('FULL')
  const [refundAmount, setRefundAmount] = useState('')
  const [destination, setDestination] = useState('')
  const [reason, setReason] = useState('')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const reasonOptions = Array.isArray(reasons) ? reasons.filter(Boolean) : []
  const destinationOptions = Array.isArray(destinations) ? destinations.filter(Boolean) : []

  const maxRefundable =
    remainingRefundable != null && !Number.isNaN(Number(remainingRefundable))
      ? Number(remainingRefundable)
      : orderValueAmount

  const fullAmountLabel =
    maxRefundable != null
      ? formatAdminMoney(maxRefundable, currency)
      : orderValueLabel || formatAdminMoney(0, currency)

  useEffect(() => {
    if (!open) return
    setRefundType('FULL')
    setRefundAmount('')
    setReason('')
    setNote('')
    setError(null)
    const firstDest = destinationOptions[0]
    setDestination(firstDest ? optionValue(firstDest) : '')
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset on open/order
  }, [open, orderId])

  useEffect(() => {
    if (!open || reason) return
    const first = reasonOptions[0]
    if (!first) return
    setReason(optionValue(first))
  }, [open, reason, reasonOptions])

  useEffect(() => {
    if (!open || destination || !destinationOptions.length) return
    setDestination(optionValue(destinationOptions[0]))
  }, [open, destination, destinationOptions])

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

  const subtitleParts = [
    orderValueLabel ? `Order value ${orderValueLabel}` : null,
    maxRefundable != null ? `Refundable ${formatAdminMoney(maxRefundable, currency)}` : null,
    paymentLabel && paymentLabel !== '—' ? paymentLabel : null,
  ].filter(Boolean)

  async function handleSubmit(event) {
    event.preventDefault()
    if (!orderId || submitting) return

    setError(null)
    setSubmitting(true)
    try {
      if (!String(reason || '').trim()) {
        throw new ApiError({ message: 'Select a refund reason.' })
      }
      if (!String(destination || '').trim()) {
        throw new ApiError({ message: 'Select a refund destination.' })
      }

      const body = {
        type: refundType === 'PARTIAL' ? 'PARTIAL' : 'FULL',
        destination: String(destination).trim(),
        reason: String(reason).trim(),
        idempotencyKey: `admin-refund-${orderId}-${Date.now()}`,
      }

      if (body.type === 'PARTIAL') {
        const amount = Number(refundAmount)
        if (!String(refundAmount || '').trim() || Number.isNaN(amount) || amount <= 0) {
          throw new ApiError({ message: 'Enter a valid partial refund amount.' })
        }
        if (maxRefundable != null && amount > maxRefundable) {
          throw new ApiError({
            message: `Partial amount cannot exceed remaining refundable (${formatAdminMoney(maxRefundable, currency)}).`,
          })
        }
        body.amount = amount
      }

      const result = await adminOrderService.refund(orderId, body)
      onSuccess?.(result?.data || null)
      onClose?.()
    } catch (err) {
      setError(formatApiErrorMessage(err, 'Failed to issue refund.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close refund modal"
        onClick={submitting ? undefined : onClose}
        className="absolute inset-0 bg-black/40"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="refund-modal-title"
        className="relative flex max-h-[calc(100vh-32px)] w-full max-w-[480px] flex-col overflow-hidden rounded-[16px] bg-white shadow-[0_12px_40px_rgba(20,40,28,.18)]"
      >
        <div className="flex shrink-0 items-start gap-3 px-5 pt-5 pb-3">
          <div className="min-w-0 flex-1">
            <h2 id="refund-modal-title" className="text-[16px] font-bold text-[#17231c]">
              Refund
            </h2>
            {subtitleParts.length ? (
              <p className="mt-0.5 truncate text-[12px] text-[#7c8780]">{subtitleParts.join(' · ')}</p>
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
            <div className="space-y-2">
              {[
                { id: 'FULL', label: `Full refund — ${fullAmountLabel}` },
                { id: 'PARTIAL', label: 'Partial refund' },
              ].map((option) => {
                const selected = refundType === option.id
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setRefundType(option.id)}
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

            <label className="block">
              <span className={labelClass}>Partial amount</span>
              <input
                type="number"
                min="0"
                step="0.001"
                className={cn(inputClass, 'pr-3', refundType !== 'PARTIAL' && 'bg-[#f7f8f7] text-[#9aa49d]')}
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                placeholder="BHD 0.000"
                disabled={submitting || refundType !== 'PARTIAL'}
              />
            </label>

            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.06em] text-[#8a948e]">
                Refund to
              </p>
              {destinationOptions.length === 0 ? (
                <p className="rounded-[10px] border border-[#e8ebe9] bg-[#fafbfa] px-3 py-3 text-[12px] text-[#7c8780]">
                  No refund destinations from API.
                </p>
              ) : (
                <div className="space-y-2">
                  {destinationOptions.map((item) => {
                    const id = optionValue(item)
                    const selected = destination === id
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setDestination(id)}
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
                          {selected ? (
                            <span className="h-2.5 w-2.5 rounded-full bg-[#1aa054]" />
                          ) : null}
                        </span>
                        <span className="text-[13px] font-medium text-[#17231c]">
                          {destinationUiLabel(item)}
                        </span>
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
                    <option value="">No reasons from API</option>
                  ) : (
                    reasonOptions.map((item) => (
                      <option key={optionValue(item)} value={optionValue(item)}>
                        {optionLabel(item)}
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
                className="box-border w-full resize-none rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white px-3 py-2.5 text-[13px] text-[#17231c] outline-none transition placeholder:text-[#9aa49d] focus:border-[#1aa054]"
              />
            </label>

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
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-[36px] items-center justify-center gap-1.5 rounded-full bg-[#1aa054] px-4 text-[13px] font-medium text-white hover:bg-[#158a47] disabled:opacity-60"
            >
              <Undo2 size={14} strokeWidth={2.2} />
              {submitting ? 'Issuing…' : 'Issue refund'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
