import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

const CONFIRM_WORD = 'delete'

/**
 * Type-to-confirm modal before DELETE /vendor-panel/branches/:branchId.
 * Delete action stays disabled until the vendor types "delete".
 */
export default function DeleteBranchModal({
  open,
  branchName = '',
  isDeleting = false,
  error = '',
  onClose,
  onConfirm,
}) {
  const [confirmText, setConfirmText] = useState('')

  useEffect(() => {
    if (!open) return
    function onKeyDown(e) {
      if (e.key === 'Escape' && !isDeleting) onClose?.()
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, isDeleting, onClose])

  useEffect(() => {
    if (!open) setConfirmText('')
  }, [open])

  if (!open) return null

  const canDelete = confirmText.trim() === CONFIRM_WORD && !isDeleting

  async function handleConfirm() {
    if (!canDelete) return
    await onConfirm?.()
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-branch-title"
    >
      <button
        type="button"
        aria-label="Close delete confirmation"
        onClick={isDeleting ? undefined : onClose}
        className="absolute inset-0 bg-black/40"
      />

      <div className="relative w-full max-w-[440px] overflow-hidden rounded-[16px] bg-white shadow-[0_12px_40px_rgba(20,40,28,.18)]">
        <div className="flex items-start gap-3 border-b border-[#F0E0E0] px-5 py-4">
          <div className="min-w-0 flex-1">
            <h2 id="delete-branch-title" className="text-[16px] font-bold text-[#DB2626]">
              Delete this branch?
            </h2>
            <p className="mt-1 text-[13px] leading-relaxed text-[#69706E]">
              This permanently removes{' '}
              <span className="font-semibold text-[#1A1A1A]">{branchName || 'this branch'}</span>{' '}
              and its menu. This can&apos;t be undone.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-[#8a948e] hover:bg-[#f3f5f3] hover:text-[#455249] disabled:opacity-50"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3 px-5 py-4">
          <label className="block">
            <span className="mb-1.5 block text-[12.5px] font-medium text-[#69706E]">
              Type <span className="font-bold text-[#DB2626]">{CONFIRM_WORD}</span> to confirm
            </span>
            <input
              type="text"
              autoFocus
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              disabled={isDeleting}
              placeholder={CONFIRM_WORD}
              autoComplete="off"
              spellCheck={false}
              className="box-border h-[42px] w-full rounded-[9px] border border-[#D6DBD6] bg-white px-3 text-[13px] font-medium text-[#1A1A1A] outline-none placeholder:text-[#B0B8B0] focus:border-[#DB2626] disabled:opacity-60"
            />
          </label>

          {error ? (
            <div className="rounded-md bg-[#FDECEC] px-3 py-2.5 text-[12.5px] text-[#DB2626]">
              {error}
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-2.5 border-t border-[#EEF1EE] px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="inline-flex h-[40px] items-center justify-center rounded-full border border-[#D6DBD6] bg-white px-4 text-[13px] font-medium text-[#1A1A1A] hover:bg-[#fafbfa] disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!canDelete}
            className="inline-flex h-[40px] items-center justify-center gap-1.5 rounded-full bg-[#DB2626] px-4 text-[13px] font-medium text-white hover:brightness-[0.96] disabled:cursor-not-allowed disabled:opacity-40"
          >
            🗑
            {isDeleting ? 'Deleting…' : 'Delete branch'}
          </button>
        </div>
      </div>
    </div>
  )
}
