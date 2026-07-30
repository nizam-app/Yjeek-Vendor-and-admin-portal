import { useEffect, useState } from 'react'
import { AlertTriangle, Ban, X } from 'lucide-react'
import { cn } from './cn'
import { adminOrderService } from '../../services/admin/orderService'
import { ApiError, formatApiErrorMessage } from '../../api/errors'

const labelClass = 'mb-1.5 block text-[12px] font-medium text-[#7c8780]'
const inputClass =
  'box-border h-[40px] w-full appearance-none rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white px-3 pr-9 text-[13px] text-[#17231c] outline-none transition focus:border-[#d64044]'

function optionValue(item) {
  if (typeof item === 'string') return item
  if (item?.hours != null) return String(item.hours)
  return String(item?.id || item?.label || '')
}

function optionLabel(item) {
  if (typeof item === 'string') return item
  return String(item?.label || item?.id || '')
}

function needsDuration(type) {
  return String(type || '').toUpperCase() === 'TEMPORARY'
}

/**
 * Suspend champ from order — Take action → Suspend champ.
 * Confirmed POST /admin/orders/:orderId/suspend-champ
 * Body: { type, durationHours?, reason, driverId }
 * Evidence/note is UI-only (not in API body).
 */
export default function AdminOrderSuspendChampModal({
  open,
  onClose,
  orderId,
  champ = null,
  champId = null,
  types = [],
  durations = [],
  reasons = [],
  onSuccess,
}) {
  const [suspendType, setSuspendType] = useState('')
  const [durationHours, setDurationHours] = useState('')
  const [reason, setReason] = useState('')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const typeOptions = Array.isArray(types) ? types.filter(Boolean) : []
  const durationOptions = Array.isArray(durations) ? durations.filter(Boolean) : []
  const reasonOptions = Array.isArray(reasons) ? reasons.filter(Boolean) : []

  const resolvedChampId = String(champ?.id || champId || '').trim()
  const champSubtitle = [champ?.name, resolvedChampId || null]
    .filter(Boolean)
    .filter((part, index, all) => all.indexOf(part) === index)
    .join(' · ')

  useEffect(() => {
    if (!open) return
    setNote('')
    setError(null)
    const firstType = typeOptions[0]
    const typeId = firstType ? optionValue(firstType) : 'TEMPORARY'
    setSuspendType(typeId)
    const firstDuration = durationOptions[0]
    setDurationHours(firstDuration ? optionValue(firstDuration) : '')
    setReason('')
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset on open/order
  }, [open, orderId])

  useEffect(() => {
    if (!open || reason) return
    const first = reasonOptions[0]
    if (!first) return
    setReason(optionValue(first))
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

  const showDuration = needsDuration(suspendType)

  async function handleSubmit(event) {
    event.preventDefault()
    if (!orderId || submitting) return

    setError(null)
    setSubmitting(true)
    try {
      if (!resolvedChampId) {
        throw new ApiError({ message: 'No champ assigned on this order to suspend.' })
      }
      if (!String(suspendType || '').trim()) {
        throw new ApiError({ message: 'Select a suspension type.' })
      }
      if (!String(reason || '').trim()) {
        throw new ApiError({ message: 'Select a suspend reason.' })
      }

      const body = {
        type: String(suspendType).trim(),
        reason: String(reason).trim(),
        driverId: resolvedChampId,
      }

      if (needsDuration(body.type)) {
        const hours = Number(durationHours)
        if (!durationHours || Number.isNaN(hours)) {
          throw new ApiError({ message: 'Select a suspension duration.' })
        }
        body.durationHours = hours
      }

      await adminOrderService.suspendChamp(orderId, body)
      onSuccess?.()
      onClose?.()
    } catch (err) {
      setError(formatApiErrorMessage(err, 'Failed to suspend champ.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close suspend champ modal"
        onClick={submitting ? undefined : onClose}
        className="absolute inset-0 bg-black/40"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-suspend-champ-title"
        className="relative flex max-h-[calc(100vh-32px)] w-full max-w-[480px] flex-col overflow-hidden rounded-[16px] bg-white shadow-[0_12px_40px_rgba(20,40,28,.18)]"
      >
        <div className="flex shrink-0 items-start gap-3 px-5 pt-5 pb-3">
          <div className="min-w-0 flex-1">
            <h2 id="order-suspend-champ-title" className="text-[16px] font-bold text-[#17231c]">
              Suspend champ
            </h2>
            {champSubtitle ? (
              <p className="mt-0.5 truncate text-[12px] text-[#7c8780]">{champSubtitle}</p>
            ) : (
              <p className="mt-0.5 text-[12px] text-[#d64044]">No champ on this order</p>
            )}
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
                Suspension type
              </p>
              {typeOptions.length === 0 ? (
                <p className="rounded-[10px] border border-[#e8ebe9] bg-[#fafbfa] px-3 py-3 text-[12px] text-[#7c8780]">
                  No suspend types from API.
                </p>
              ) : (
                <div className="space-y-2">
                  {typeOptions.map((item) => {
                    const id = optionValue(item)
                    const selected = suspendType === id
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setSuspendType(id)}
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
                          {optionLabel(item)}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {showDuration ? (
              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.06em] text-[#8a948e]">
                  Duration
                </p>
                {durationOptions.length === 0 ? (
                  <p className="rounded-[10px] border border-[#e8ebe9] bg-[#fafbfa] px-3 py-3 text-[12px] text-[#7c8780]">
                    No durations from API.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {durationOptions.map((item) => {
                      const id = optionValue(item)
                      const selected = String(durationHours) === id
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setDurationHours(id)}
                          className={cn(
                            'inline-flex h-[34px] items-center rounded-full border px-3.5 text-[12px] font-medium transition',
                            selected
                              ? 'border-[#1aa054] bg-[#f3faf5] text-[#127338]'
                              : 'border-[#e4e8e4] bg-white text-[#455249] hover:border-[#c5ced0]',
                          )}
                        >
                          {optionLabel(item)}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            ) : null}

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
              <span className={labelClass}>Evidence / note</span>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                disabled={submitting}
                rows={3}
                placeholder="Reference incident IDs, GPS logs…"
                className="box-border w-full resize-none rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white px-3 py-2.5 text-[13px] text-[#17231c] outline-none transition placeholder:text-[#9aa49d] focus:border-[#d64044]"
              />
            </label>

            <div className="flex items-start gap-2 rounded-[10px] bg-[#fdebec] px-3.5 py-3">
              <AlertTriangle size={14} className="mt-0.5 shrink-0 text-[#d64044]" strokeWidth={2.2} />
              <p className="text-[12px] leading-[16px] text-[#d64044]">
                The champ cannot accept new orders while suspended. Due process applies per DSA — the
                champ has 48 hours to respond in writing.
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
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !resolvedChampId}
              className="inline-flex h-[36px] items-center justify-center gap-1.5 rounded-full bg-[#d64044] px-4 text-[13px] font-medium text-white hover:brightness-[0.96] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Ban size={14} strokeWidth={2.2} />
              {submitting ? 'Suspending…' : 'Suspend champ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
