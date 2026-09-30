import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { formatApiErrorMessage } from '../../api/errors'

/**
 * Short confirm for Super Admin deletes (store type, vendor, champ, admin account).
 */
export default function AdminSuperDeleteModal({
  open,
  title = 'Delete this?',
  message = 'This cannot be undone.',
  confirmLabel = 'Delete',
  onClose,
  onConfirm,
}) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!open) return
    setSubmitting(false)
    setError(null)
  }, [open])

  useEffect(() => {
    if (!open) return undefined
    function onKeyDown(event) {
      if (event.key === 'Escape' && !submitting) onClose?.()
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, submitting, onClose])

  if (!open) return null

  async function handleConfirm() {
    if (submitting) return
    setSubmitting(true)
    setError(null)
    try {
      await onConfirm?.()
    } catch (err) {
      setError(formatApiErrorMessage(err, 'Could not delete.'))
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-[rgba(23,35,28,.45)] p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="super-delete-title"
        className="w-full max-w-[420px] rounded-[16px] bg-white p-5 shadow-[0_16px_40px_rgba(20,40,28,.18)]"
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <h3 id="super-delete-title" className="text-[16px] font-bold text-[#17231c]">
            {title}
          </h3>
          <button
            type="button"
            className="grid h-8 w-8 place-items-center rounded-md text-[#8a948e] hover:bg-[#f3f5f3]"
            aria-label="Close"
            disabled={submitting}
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>
        <p className="text-[13px] leading-[19px] text-[#59655e]">{message}</p>
        {error ? (
          <p className="mt-3 rounded-[8px] border border-[#f5d0d0] bg-[#fdebec] px-3 py-2 text-[12.5px] text-[#d64044]">
            {error}
          </p>
        ) : null}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            disabled={submitting}
            onClick={onClose}
            className="inline-flex h-[34px] items-center rounded-full border border-[#dfe4e0] bg-white px-4 text-[12px] font-medium text-[#455249] hover:bg-[#f6f8f6] disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={handleConfirm}
            className="inline-flex h-[34px] items-center rounded-full bg-[#d64044] px-4 text-[12px] font-bold text-white hover:bg-[#c23338] disabled:opacity-60"
          >
            {submitting ? 'Deleting…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
