import { useEffect, useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { adminIncidentService } from '../../services/admin/incidentService'
import { formatApiErrorMessage } from '../../api/errors'

/**
 * Choose VPI or CPI penalty and apply via incident runAction API.
 */
export default function AdminApplyPenaltyModal({
  open,
  onClose,
  incidentId = null,
  onSuccess,
}) {
  const [kind, setKind] = useState('APPLY_VPI_PENALTY')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!open) return
    setKind('APPLY_VPI_PENALTY')
    setReason('')
    setError(null)
  }, [open])

  if (!open) return null

  async function handleSubmit(event) {
    event.preventDefault()
    if (!incidentId || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      const result = await adminIncidentService.runAction(incidentId, {
        action: kind,
        reason: String(reason || '').trim() || undefined,
      })
      const payload = result?.data ?? result
      if (payload?.actionResult?.idempotentReplay) {
        setError('This penalty was already applied for this incident.')
        return
      }
      onSuccess?.(payload)
      onClose?.()
    } catch (err) {
      setError(formatApiErrorMessage(err, 'Failed to apply penalty.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        onClick={submitting ? undefined : onClose}
        className="absolute inset-0 bg-black/40"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-[420px] rounded-[16px] bg-white p-5 shadow-lg"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[16px] font-bold text-[#17231c]">Apply penalty</h2>
            <p className="mt-0.5 text-[12px] text-[#7c8780]">VPI (vendor) or CPI (champ)</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="grid h-8 w-8 place-items-center rounded-md text-[#8a948e] hover:bg-[#f3f5f3]"
          >
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'APPLY_VPI_PENALTY', label: 'VPI · Vendor' },
              { id: 'APPLY_CPI_PENALTY', label: 'CPI · Champ' },
            ].map((option) => (
              <button
                key={option.id}
                type="button"
                disabled={submitting}
                aria-pressed={kind === option.id}
                onClick={() => setKind(option.id)}
                className={`rounded-[8px] border px-3 py-2 text-[12px] font-semibold ${
                  kind === option.id
                    ? 'border-[#c62828] bg-[#fff0ed] text-[#c62828]'
                    : 'border-[#e4e8e4] bg-white text-[#536158]'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <label className="block">
            <span className="mb-1.5 block text-[12px] font-medium text-[#7c8780]">Reason (optional)</span>
            <input
              className="box-border h-[40px] w-full rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white px-3 text-[13px] outline-none focus:border-[#1aa054]"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              disabled={submitting}
              placeholder="Why this penalty?"
            />
          </label>
          {error ? (
            <div className="rounded-[10px] bg-[#fdebec] px-3 py-2 text-[12px] text-[#d64044]">{error}</div>
          ) : null}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="h-[36px] rounded-full border px-4 text-[13px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !incidentId}
              className="inline-flex h-[36px] items-center gap-1.5 rounded-full bg-[#c62828] px-4 text-[13px] text-white disabled:opacity-60"
            >
              <AlertTriangle size={14} />
              {submitting ? 'Applying…' : 'Apply penalty'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
