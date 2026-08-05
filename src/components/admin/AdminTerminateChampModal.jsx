import { useEffect, useState } from 'react'
import { ChevronDown, X } from 'lucide-react'
import { formatApiErrorMessage } from '../../api/errors'
import { adminService } from '../../services/adminService'
import { cn } from './cn'

const labelClass = 'mb-1.5 block text-[12px] font-medium text-[#7c8780]'
const inputClass =
  'box-border h-[40px] w-full rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white px-3 text-[13px] text-[#1C211F] outline-none transition placeholder:text-[#9aa49d] focus:border-[#1aa054]'

const REASONS = [
  'Conduct violation',
  'Document fraud',
  'Repeated cancellations',
  'Safety incident',
  'Contract ended',
  'Other',
]

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function formatEffectiveDate(date = new Date()) {
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`
}

/**
 * Terminate champ — Fleet champ detail.
 * Confirmed: POST /admin/fleet/champs/:champId/terminate
 * Body: { reason, effectiveDate?, note? }
 * COD outstanding is display-only (server wallet).
 */
export default function AdminTerminateChampModal({
  open,
  onClose,
  champName = 'Champ',
  champId = '',
  defaultCod = 'BHD 0.000',
  onSuccess,
}) {
  const [reason, setReason] = useState(REASONS[0])
  const [effectiveDate, setEffectiveDate] = useState(formatEffectiveDate())
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setReason(REASONS[0])
    setEffectiveDate(formatEffectiveDate())
    setNote('')
    setError('')
    setSubmitting(false)
  }, [open, champId])

  if (!open) return null

  const handleConfirm = async () => {
    setError('')
    const id = String(champId || '').trim()
    if (!id) {
      setError('Champ id is missing.')
      return
    }

    setSubmitting(true)
    try {
      await adminService.terminateAdminFleetChamp(id, {
        reason,
        effectiveDate,
        note,
      })
      onSuccess?.()
      onClose?.()
    } catch (err) {
      setError(formatApiErrorMessage(err, 'Failed to terminate champ.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close terminate champ modal"
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
        disabled={submitting}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="terminate-champ-title"
        className="relative w-full max-w-[480px] overflow-hidden rounded-[16px] bg-white shadow-[0_12px_40px_rgba(20,40,28,.18)]"
      >
        <div className="flex items-start gap-3 px-5 py-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 id="terminate-champ-title" className="text-[16px] font-bold text-[#17231c]">
                Terminate champ
              </h2>
              <span className="inline-flex rounded-full bg-[#fdebec] px-2.5 py-[3px] text-[11px] font-bold text-[#d64044]">
                Permanent
              </span>
            </div>
            <p className="mt-1 text-[12.5px] text-[#7c8780]">
              {champName}
              {champId ? ` · ${champId}` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-[#8a948e] hover:bg-[#f3f5f3] hover:text-[#455249]"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 px-5 pb-4">
          {error ? (
            <div className="rounded-[10px] border border-[#f0c9c6] bg-[#fff5f4] px-3.5 py-3 text-[12.5px] text-[#b42318]">
              {error}
            </div>
          ) : null}

          <label className="block">
            <span className={labelClass}>Reason</span>
            <div className="relative">
              <select
                className={cn(inputClass, 'appearance-none pr-9')}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={submitting}
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

          <label className="block">
            <span className={labelClass}>Effective date</span>
            <div className="relative">
              <input
                className={cn(inputClass, 'pr-9')}
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
                placeholder="29 Jun 2026"
                disabled={submitting}
              />
              <ChevronDown
                size={14}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#7c8780]"
              />
            </div>
          </label>

          <label className="block">
            <span className={labelClass}>COD outstanding</span>
            <input
              className={cn(inputClass, 'bg-[#f6f8f6] text-[#7c8780]')}
              value={defaultCod}
              readOnly
              aria-readonly="true"
            />
            <p className="mt-1 text-[11px] text-[#7c8780]">
              Settled from champ wallet automatically — not editable.
            </p>
          </label>

          <label className="block">
            <span className={labelClass}>Internal note</span>
            <textarea
              className="box-border min-h-[88px] w-full resize-y rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white px-3 py-2.5 text-[13px] text-[#1C211F] outline-none transition placeholder:text-[#9aa49d] focus:border-[#1aa054] disabled:opacity-60"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Reason details / reference..."
              disabled={submitting}
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="inline-flex h-[40px] items-center rounded-full border border-[#dfe4e0] bg-white px-4 text-[13px] font-medium text-[#17231c] hover:bg-[#f6f8f6] disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting}
            className="inline-flex h-[40px] items-center gap-1.5 rounded-full bg-[#d64044] px-4 text-[13px] font-bold text-white hover:bg-[#c0383c] disabled:opacity-60"
          >
            {submitting ? 'Terminating…' : '⊘ Terminate champ'}
          </button>
        </div>
      </div>
    </div>
  )
}
