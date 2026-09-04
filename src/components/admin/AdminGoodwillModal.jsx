import { useEffect, useState } from 'react'
import { Gift, X } from 'lucide-react'
import { adminIncidentService } from '../../services/admin/incidentService'
import { ApiError, formatApiErrorMessage } from '../../api/errors'
import { formatAdminMoney } from '../../mappers/admin/mapAdminOrderDetail'

const labelClass = 'mb-1.5 block text-[12px] font-medium text-[#7c8780]'
const inputClass =
  'box-border h-[40px] w-full rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white px-3 text-[13px] text-[#17231c] outline-none transition focus:border-[#1aa054]'

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
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!open) return
    setAmount('')
    setReason('Customer goodwill gesture')
    setNote('')
    setError(null)
  }, [open, orderId])

  if (!open) return null

  async function handleSubmit(event) {
    event.preventDefault()
    if (!orderId || !incidentId || submitting) return
    const creditAmount = Number(amount)
    if (!String(amount).trim() || Number.isNaN(creditAmount) || creditAmount <= 0) {
      setError('Enter a valid goodwill amount.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const result = await adminIncidentService.runAction(incidentId, {
        action: 'GOODWILL_CREDIT',
        creditAmount,
        reason: String(reason || '').trim() || 'Goodwill credit',
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
