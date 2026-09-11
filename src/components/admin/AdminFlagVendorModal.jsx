import { useEffect, useState } from 'react'
import { AlertTriangle, Flag, X } from 'lucide-react'
import { cn } from './cn'
import { adminOrderService } from '../../services/admin/orderService'
import { ApiError, formatApiErrorMessage } from '../../api/errors'

const labelClass = 'mb-1.5 block text-[12px] font-medium text-[#7c8780]'
const inputClass =
  'box-border h-[40px] w-full appearance-none rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white px-3 pr-9 text-[13px] text-[#17231c] outline-none transition focus:border-[#e07a2f]'

function optionValue(item) {
  if (typeof item === 'string') return item
  return String(item?.id || item?.label || '')
}

function optionLabel(item) {
  if (typeof item === 'string') return item
  return String(item?.label || item?.id || '')
}

function severityLabel(item) {
  const raw = optionLabel(item)
  return raw
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

/**
 * Flag vendor modal — Take action → Flag vendor.
 * Confirmed POST: { metric, severity, action, reason, notifyVendor }
 * Evidence/note is UI-only (not in API body).
 */
export default function AdminFlagVendorModal({
  open,
  onClose,
  orderId,
  orderNumber = null,
  vendorName = null,
  vendorBranch = null,
  metrics = [],
  severities = [],
  actions = [],
  reasons = [],
  incidentId = null,
  onSuccess,
}) {
  const [metric, setMetric] = useState('')
  const [severity, setSeverity] = useState('')
  const [flagAction, setFlagAction] = useState('')
  const [reason, setReason] = useState('')
  const [note, setNote] = useState('')
  const [notifyVendor, setNotifyVendor] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const metricOptions = Array.isArray(metrics) ? metrics.filter(Boolean) : []
  const severityOptions = Array.isArray(severities) ? severities.filter(Boolean) : []
  const actionOptions = Array.isArray(actions) ? actions.filter(Boolean) : []
  const reasonOptions = Array.isArray(reasons) ? reasons.filter(Boolean) : []

  useEffect(() => {
    if (!open) return
    setNote('')
    setError(null)
    setNotifyVendor(true)
    setMetric(metricOptions[0] ? optionValue(metricOptions[0]) : '')
    setSeverity(severityOptions[0] ? optionValue(severityOptions[0]) : '')
    setFlagAction(actionOptions[0] ? optionValue(actionOptions[0]) : '')
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

  const headerSubtitle = [vendorName, vendorBranch && vendorBranch !== '—' ? vendorBranch : null]
    .filter(Boolean)
    .join(' · ')
  const contextLine = [
    vendorName,
    orderNumber ? `#${orderNumber}` : null,
  ]
    .filter(Boolean)
    .join(' · ')

  async function handleSubmit(event) {
    event.preventDefault()
    if (!orderId || submitting) return

    setError(null)
    setSubmitting(true)
    try {
      if (!String(metric || '').trim()) {
        throw new ApiError({ message: 'Select a VPI metric to flag.' })
      }
      if (!String(severity || '').trim()) {
        throw new ApiError({ message: 'Select a severity.' })
      }
      if (!String(flagAction || '').trim()) {
        throw new ApiError({ message: 'Select an action.' })
      }
      if (!String(reason || '').trim()) {
        throw new ApiError({ message: 'Select a reason.' })
      }

      await adminOrderService.flagVendor(orderId, {
        metric: String(metric).trim(),
        severity: String(severity).trim(),
        action: String(flagAction).trim(),
        reason: String(reason).trim(),
        notifyVendor,
        ...(incidentId ? { incidentId: String(incidentId) } : {}),
      })
      onSuccess?.()
      onClose?.()
    } catch (err) {
      setError(formatApiErrorMessage(err, 'Failed to flag vendor.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close flag vendor modal"
        onClick={submitting ? undefined : onClose}
        className="absolute inset-0 bg-black/40"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="flag-vendor-title"
        className="relative flex max-h-[calc(100vh-32px)] w-full max-w-[520px] flex-col overflow-hidden rounded-[16px] bg-white shadow-[0_12px_40px_rgba(20,40,28,.18)]"
      >
        <div className="flex shrink-0 items-start gap-3 px-5 pt-5 pb-3">
          <div className="min-w-0 flex-1">
            <h2 id="flag-vendor-title" className="text-[16px] font-bold text-[#17231c]">
              Flag vendor
            </h2>
            {headerSubtitle ? (
              <p className="mt-0.5 truncate text-[12px] text-[#7c8780]">{headerSubtitle}</p>
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
            {contextLine ? (
              <div className="flex items-center gap-2 rounded-[10px] bg-[#f3f5f3] px-3.5 py-3">
                <span className="text-[14px] text-[#69756d]" aria-hidden>
                  ⌁
                </span>
                <p className="truncate text-[12px] leading-[16px] text-[#455249]">{contextLine}</p>
              </div>
            ) : null}

            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.06em] text-[#8a948e]">
                VPI metric to flag
              </p>
              {metricOptions.length === 0 ? (
                <p className="rounded-[10px] border border-[#e8ebe9] bg-[#fafbfa] px-3 py-3 text-[12px] text-[#7c8780]">
                  No flag metrics from API.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {metricOptions.map((item) => {
                    const id = optionValue(item)
                    const selected = metric === id
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setMetric(id)}
                        className={cn(
                          'inline-flex h-[34px] items-center rounded-full border px-3.5 text-[12px] font-medium transition',
                          selected
                            ? 'border-[#e07a2f] bg-[#fff4eb] text-[#c45f18]'
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

            <label className="block">
              <span className={labelClass}>Severity</span>
              <div className="relative">
                <select
                  className={inputClass}
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  disabled={submitting || severityOptions.length === 0}
                >
                  {severityOptions.length === 0 ? (
                    <option value="">No severities from API</option>
                  ) : (
                    severityOptions.map((item) => (
                      <option key={optionValue(item)} value={optionValue(item)}>
                        {severityLabel(item)}
                      </option>
                    ))
                  )}
                </select>
                <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[10px] text-[#69756d]">
                  ▾
                </span>
              </div>
            </label>

            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.06em] text-[#8a948e]">
                Action
              </p>
              {actionOptions.length === 0 ? (
                <p className="rounded-[10px] border border-[#e8ebe9] bg-[#fafbfa] px-3 py-3 text-[12px] text-[#7c8780]">
                  No flag actions from API.
                </p>
              ) : (
                <div className="space-y-2">
                  {actionOptions.map((item) => {
                    const id = optionValue(item)
                    const selected = flagAction === id
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setFlagAction(id)}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-[12px] border px-3.5 py-3 text-left transition',
                          selected
                            ? 'border-[#e07a2f] bg-[#fff4eb]'
                            : 'border-[#e4e8e4] bg-white hover:border-[#c5ced0]',
                        )}
                      >
                        <span
                          className={cn(
                            'grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full border-2',
                            selected ? 'border-[#e07a2f]' : 'border-[#c5ced0]',
                          )}
                        >
                          {selected ? (
                            <span className="h-2.5 w-2.5 rounded-full bg-[#e07a2f]" />
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

            <div className="flex items-start gap-2 rounded-[10px] bg-[#fff4eb] px-3.5 py-3">
              <AlertTriangle size={14} className="mt-0.5 shrink-0 text-[#c45f18]" strokeWidth={2.2} />
              <p className="text-[12px] leading-[16px] text-[#c45f18]">
                Vendor breach recorded against this order. Formal VPA review may follow repeated
                flags.
              </p>
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
              <span className={labelClass}>Evidence / note</span>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                disabled={submitting}
                rows={3}
                placeholder="Reference incident IDs, timestamps…"
                className="box-border w-full resize-none rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white px-3 py-2.5 text-[13px] text-[#17231c] outline-none transition placeholder:text-[#9aa49d] focus:border-[#e07a2f]"
              />
            </label>

            <div className="flex items-center justify-between gap-3">
              <p className="text-[13px] text-[#17231c]">Notify vendor of the flag</p>
              <button
                type="button"
                role="switch"
                aria-checked={notifyVendor}
                aria-label="Notify vendor"
                disabled={submitting}
                onClick={() => setNotifyVendor((prev) => !prev)}
                className={cn(
                  'box-border flex h-[22px] w-[38px] shrink-0 items-center rounded-[11px] px-[3px] transition-colors',
                  notifyVendor ? 'justify-end bg-[#2E9E4D]' : 'justify-start bg-[#C7CFC7]',
                )}
              >
                <span className="size-4 shrink-0 rounded-lg bg-white" />
              </button>
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
              disabled={submitting}
              className="inline-flex h-[36px] items-center justify-center gap-1.5 rounded-full bg-[#e07a2f] px-4 text-[13px] font-medium text-white hover:brightness-[0.96] disabled:opacity-60"
            >
              <Flag size={14} strokeWidth={2.2} fill="currentColor" />
              {submitting ? 'Flagging…' : 'Flag vendor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
