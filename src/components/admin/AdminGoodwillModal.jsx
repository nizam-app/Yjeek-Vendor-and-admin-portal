import { useEffect, useState } from 'react'
import { Gift, X } from 'lucide-react'
import { adminIncidentService } from '../../services/admin/incidentService'
import { formatApiErrorMessage } from '../../api/errors'
import { formatAdminMoney } from '../../mappers/admin/mapAdminOrderDetail'
import { formatCostBearerLabel } from '../../lib/adminIncidentPresentation'

const labelClass = 'mb-1.5 block text-[12px] font-medium text-[#7c8780]'
const inputClass =
  'box-border h-[40px] w-full rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white px-3 text-[13px] text-[#17231c] outline-none transition focus:border-[#1aa054]'

const FALLBACK_BEARERS = ['PLATFORM', 'VENDOR', 'AGENCY', 'CUSTOMER', 'SHARED']

export default function AdminGoodwillModal({
  open,
  onClose,
  orderId,
  incidentId = null,
  currency = 'BHD',
  onSuccess,
}) {
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('Customer goodwill gesture')
  const [note, setNote] = useState('')
  const [costBearer, setCostBearer] = useState('')
  const [bearerOverrideReason, setBearerOverrideReason] = useState('')
  const [refundContext, setRefundContext] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const derivedBearer = refundContext?.derivedCostBearer ?? null
  const bearerOverridden =
    derivedBearer && costBearer && String(costBearer) !== String(derivedBearer)
  const bearerOptions =
    Array.isArray(refundContext?.costBearerOptions) && refundContext.costBearerOptions.length
      ? refundContext.costBearerOptions
      : FALLBACK_BEARERS.map((value) => ({
          value,
          selectLabel: formatCostBearerLabel(value, { select: true }),
        }))

  useEffect(() => {
    if (!open) return
    setAmount('')
    setReason('Customer goodwill gesture')
    setNote('')
    setCostBearer('')
    setBearerOverrideReason('')
    setError(null)
    setRefundContext(null)
  }, [open, orderId])

  useEffect(() => {
    if (!open || !incidentId) return undefined
    let cancelled = false
    adminIncidentService
      .getRefundContext(incidentId)
      .then((res) => {
        if (cancelled) return
        const ctx = res?.data ?? null
        setRefundContext(ctx)
        const initial = ctx?.costBearer || ctx?.derivedCostBearer || ''
        setCostBearer(initial && initial !== 'NOT_APPLICABLE' ? String(initial) : '')
      })
      .catch((err) => {
        if (!cancelled) setError(formatApiErrorMessage(err, 'Failed to load cost bearer.'))
      })
    return () => {
      cancelled = true
    }
  }, [open, incidentId])

  if (!open) return null

  async function handleSubmit(event) {
    event.preventDefault()
    if (!orderId || !incidentId || submitting) return
    const creditAmount = Number(amount)
    if (!String(amount).trim() || Number.isNaN(creditAmount) || creditAmount <= 0) {
      setError('Enter a valid goodwill amount.')
      return
    }
    if (!costBearer) {
      setError('Cost bearer is required for goodwill credit.')
      return
    }
    if (bearerOverridden && !String(bearerOverrideReason || '').trim()) {
      setError('Add a note when changing the pre-filled cost bearer.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const result = await adminIncidentService.runAction(incidentId, {
        action: 'GOODWILL_CREDIT',
        creditAmount,
        reason: String(reason || '').trim() || 'Goodwill credit',
        note: String(note || '').trim() || undefined,
        costBearer,
        bearerOverrideReason: bearerOverridden
          ? String(bearerOverrideReason).trim()
          : undefined,
        idempotencyKey: `goodwill-${incidentId}-${Date.now()}`,
      })
      const payload = result?.data ?? result
      if (payload?.actionResult?.idempotentReplay) {
        setError('Goodwill credit was already recorded for this incident.')
        return
      }
      onSuccess?.(payload)
      onClose?.()
    } catch (err) {
      setError(formatApiErrorMessage(err, 'Failed to issue goodwill credit.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center p-4">
      <button type="button" aria-label="Close" onClick={submitting ? undefined : onClose} className="absolute inset-0 bg-black/40" />
      <div role="dialog" aria-modal="true" className="relative w-full max-w-[440px] rounded-[16px] bg-white p-5 shadow-lg">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[16px] font-bold text-[#17231c]">Goodwill credit</h2>
            <p className="mt-0.5 text-[12px] text-[#7c8780]">Separate from refund — wallet adjustment only</p>
          </div>
          <button type="button" onClick={onClose} disabled={submitting} className="grid h-8 w-8 place-items-center rounded-md text-[#8a948e] hover:bg-[#f3f5f3]">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <label className="block">
            <span className={labelClass}>Amount ({currency})</span>
            <input type="number" min="0" step="0.001" className={inputClass} value={amount} onChange={(e) => setAmount(e.target.value)} disabled={submitting} />
          </label>
          <label className="block">
            <span className={labelClass}>
              Cost bearer <span className="text-[#8C401D]">Required</span>
            </span>
            {derivedBearer ? (
              <p className="mb-1.5 text-[11px] text-[#7c8780]">
                Pre-filled from cause: {formatCostBearerLabel(derivedBearer, { select: true })}
              </p>
            ) : null}
            <select
              className={inputClass}
              value={costBearer}
              onChange={(e) => setCostBearer(e.target.value)}
              disabled={submitting}
              required
            >
              <option value="">Select bearer…</option>
              {bearerOptions.map((row) => {
                const value = typeof row === 'string' ? row : row.value
                const label =
                  typeof row === 'string'
                    ? formatCostBearerLabel(row, { select: true })
                    : row.selectLabel || row.label || formatCostBearerLabel(value, { select: true })
                return (
                  <option key={value} value={value}>
                    {label}
                  </option>
                )
              })}
            </select>
          </label>
          {bearerOverridden ? (
            <label className="block">
              <span className={labelClass}>Override reason (required)</span>
              <textarea
                value={bearerOverrideReason}
                onChange={(e) => setBearerOverrideReason(e.target.value)}
                disabled={submitting}
                rows={2}
                placeholder="Why is the cause-derived bearer being changed?"
                className="box-border w-full resize-none rounded-[8px] border border-[rgba(0,0,0,0.1)] px-3 py-2 text-[13px] outline-none focus:border-[#1aa054]"
              />
            </label>
          ) : null}
          <label className="block">
            <span className={labelClass}>Reason</span>
            <input className={inputClass} value={reason} onChange={(e) => setReason(e.target.value)} disabled={submitting} />
          </label>
          <label className="block">
            <span className={labelClass}>Note (optional)</span>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} disabled={submitting} rows={2} className="box-border w-full resize-none rounded-[8px] border border-[rgba(0,0,0,0.1)] px-3 py-2 text-[13px] outline-none focus:border-[#1aa054]" />
          </label>
          {amount ? (
            <p className="text-[12px] text-[#657068]">Customer will receive {formatAdminMoney(Number(amount), currency)}</p>
          ) : null}
          {error ? <div className="rounded-[10px] bg-[#fdebec] px-3 py-2 text-[12px] text-[#d64044]">{error}</div> : null}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} disabled={submitting} className="h-[36px] rounded-full border px-4 text-[13px]">Cancel</button>
            <button type="submit" disabled={submitting || !incidentId} className="inline-flex h-[36px] items-center gap-1.5 rounded-full bg-[#1aa054] px-4 text-[13px] text-white disabled:opacity-60">
              <Gift size={14} />
              {submitting ? 'Issuing…' : 'Issue goodwill'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
