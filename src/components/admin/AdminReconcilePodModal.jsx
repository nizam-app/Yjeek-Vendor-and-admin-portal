import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import warningIcon from '../../assets/⚠.png'
import { formatApiErrorMessage } from '../../api/errors'
import { adminService } from '../../services/adminService'

const labelClass = 'mb-1.5 block text-[12px] font-medium text-[#7c8780]'
const inputClass =
  'box-border h-[40px] w-full rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white px-3 text-[13px] text-[#1C211F] outline-none transition placeholder:text-[#9aa49d] focus:border-[#1aa054]'

/**
 * Reconcile outstanding POD / COD cash — Fleet champ detail.
 * Confirmed: POST /admin/fleet/champs/:champId/reconcile-pod
 * Body: { note?, amount? }
 */
export default function AdminReconcilePodModal({
  open,
  onClose,
  champId = null,
  champName = '',
  codAmount = 'BHD 0.000',
  podCashBalance = null,
  onSuccess,
}) {
  const [note, setNote] = useState('Banked COD / POD float cleared after shift')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setNote('Banked COD / POD float cleared after shift')
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
      await adminService.reconcileAdminFleetChampPod(id, {
        note: note.trim() || undefined,
      })
      onSuccess?.()
      onClose?.()
    } catch (err) {
      setError(formatApiErrorMessage(err, 'Failed to reconcile POD cash.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close reconcile POD modal"
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
        disabled={submitting}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="reconcile-pod-title"
        className="relative w-full max-w-[480px] overflow-hidden rounded-[16px] bg-white shadow-[0_12px_40px_rgba(20,40,28,.18)]"
      >
        <div className="flex items-center gap-3 px-5 py-4">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-[#fff4e5]">
            <img src={warningIcon} alt="" className="h-4 w-4 object-contain" />
          </span>
          <h2 id="reconcile-pod-title" className="min-w-0 flex-1 text-[16px] font-bold text-[#17231c]">
            Reconcile POD cash
          </h2>
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

        <div className="space-y-4 px-5 pb-4">
          <div className="rounded-[10px] border border-[#eceeec] bg-[#f6f8f6] px-3.5 py-3">
            <p className="text-[12px] leading-[18px] text-[#69756d]">
              {champName ? (
                <>
                  Clear outstanding cash for <span className="font-semibold text-[#17231c]">{champName}</span>.
                  {' '}
                </>
              ) : null}
              This zeros POD float and wallet pending cash so the champ can go online from the driver app.
              It does not set them online automatically.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[10px] border border-[#eceeec] px-3.5 py-3">
              <p className="text-[11px] font-medium uppercase tracking-[0.02em] text-[#7c8780]">COD outstanding</p>
              <p className="mt-1 text-[15px] font-bold text-[#17231c]">{codAmount}</p>
            </div>
            {podCashBalance ? (
              <div className="rounded-[10px] border border-[#eceeec] px-3.5 py-3">
                <p className="text-[11px] font-medium uppercase tracking-[0.02em] text-[#7c8780]">POD float</p>
                <p className="mt-1 text-[15px] font-bold text-[#17231c]">{podCashBalance}</p>
              </div>
            ) : null}
          </div>

          {error ? (
            <div className="rounded-[10px] border border-[#f0c9c6] bg-[#fff5f4] px-3.5 py-3 text-[12.5px] text-[#b42318]">
              {error}
            </div>
          ) : null}

          <label className="block">
            <span className={labelClass}>Note (optional)</span>
            <input
              className={inputClass}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Banked COD / POD float cleared after shift"
              disabled={submitting}
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="inline-flex h-[40px] items-center rounded-full border border-[#dfe4e0] bg-white px-4 text-[13px] font-medium text-[#17231c] hover:bg-[#f6f8f6]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting}
            className="inline-flex h-[40px] items-center rounded-full bg-[#1aa054] px-4 text-[13px] font-bold text-white hover:bg-[#168f49] disabled:opacity-60"
          >
            {submitting ? 'Reconciling…' : 'Reconcile POD cash'}
          </button>
        </div>
      </div>
    </div>
  )
}
