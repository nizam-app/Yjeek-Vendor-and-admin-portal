import { useEffect, useState } from 'react'
import { Trash2, X } from 'lucide-react'

const labelClass = 'mb-1.5 block text-[12px] font-medium text-[#7c8780]'
const inputClass =
  'box-border h-[40px] w-full rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white px-3 text-[13px] text-[#17231c] outline-none transition placeholder:text-[#9aa49d] focus:border-[#d64044]'

/**
 * Type-to-confirm delete for DELETE /admin/marketing/notifications/:id.
 * Matches AdminDeleteBranchModal layout and styling.
 */
export default function AdminDeleteNotificationModal({
  open,
  onClose,
  notificationTitle = '',
  onConfirm,
}) {
  const [confirmText, setConfirmText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const expectedName = String(notificationTitle || '').trim()

  useEffect(() => {
    if (!open) return
    setConfirmText('')
    setSubmitting(false)
    setError(null)
  }, [open])

  useEffect(() => {
    if (!open) return
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

  const canDelete =
    Boolean(expectedName) && confirmText.trim() === expectedName && !submitting

  async function handleConfirm() {
    if (!canDelete) return
    setError(null)
    setSubmitting(true)
    try {
      await onConfirm?.()
      onClose?.()
    } catch (err) {
      setError(err?.message || 'Failed to delete notification.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close delete notification modal"
        onClick={submitting ? undefined : onClose}
        className="absolute inset-0 bg-black/40"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-notification-title"
        className="relative w-full max-w-[480px] overflow-hidden rounded-[14px] bg-white shadow-[0_12px_40px_rgba(20,40,28,.18)]"
      >
        <div className="flex items-center gap-3 px-5 py-4">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#fdebec] text-[#d64044]">
            <Trash2 size={16} strokeWidth={2.2} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="delete-notification-title" className="text-[16px] font-bold text-[#17231c]">
              Delete notification
            </h2>
            <p className="mt-0.5 text-[12px] text-[#7c8780]">
              This can&apos;t be undone
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="grid h-8 w-8 place-items-center rounded-md text-[#8a948e] hover:bg-[#f3f5f3] hover:text-[#455249] disabled:opacity-50"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <div className="flex items-end gap-2 rounded-[10px] bg-[#fdebec] px-3.5 py-3">
            <span className="text-[16px] text-[#d64044]">⚠</span>
            <p className="text-[12px] leading-[16px] text-[#d64044]">
              Permanently removes{' '}
              <span className="font-semibold">{expectedName || 'this notification'}</span>
              . Delivery stats for this send will be lost.
            </p>
          </div>

          <label className="block">
            <span className={labelClass}>
              Type <span className="font-bold text-[#d64044]">{expectedName || 'notification title'}</span>{' '}
              to confirm
            </span>
            <input
              type="text"
              autoFocus
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              disabled={submitting || !expectedName}
              placeholder={expectedName || 'Notification title'}
              autoComplete="off"
              spellCheck={false}
              className={inputClass}
            />
          </label>

          {error ? (
            <div className="rounded-[10px] bg-[#fdebec] px-3.5 py-2.5 text-[12px] text-[#d64044]">
              {error}
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-2.5 border-t border-[#edf0ee] px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="inline-flex h-[36px] items-center justify-center rounded-full border border-[#e4e8e4] bg-white px-4 text-[13px] font-medium text-[#455249] hover:bg-[#f6f8f6] disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!canDelete}
            className="inline-flex h-[36px] items-center justify-center gap-1.5 rounded-full bg-[#d64044] px-4 text-[13px] font-medium text-white hover:brightness-[0.96] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Trash2 size={14} />
            {submitting ? 'Deleting…' : 'Delete notification'}
          </button>
        </div>
      </div>
    </div>
  )
}
