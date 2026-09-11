import { useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from './cn'

const ghostBtn =
  'inline-flex size-8 items-center justify-center rounded-full text-[#637068] hover:bg-[#f3f5f3] disabled:opacity-50'
const outlineBtn =
  'inline-flex h-[36px] items-center justify-center rounded-full border border-[#dfe4e0] bg-white px-4 text-[12.5px] font-medium text-[#127338] hover:bg-[#f6f8f6] disabled:opacity-50'
const dangerBtn =
  'inline-flex h-[36px] items-center justify-center rounded-full bg-[#d64044] px-4 text-[12.5px] font-bold text-white hover:bg-[#c0392b] disabled:opacity-50'

export default function AdminConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  tone = 'danger',
  busy = false,
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    if (!open) return undefined
    function onKeyDown(event) {
      if (event.key === 'Escape' && !busy) onCancel?.()
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, busy, onCancel])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/30 p-4">
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-[420px] rounded-[14px] bg-white p-5 shadow-[0_12px_40px_rgba(20,40,28,.18)]"
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <h3 className="text-[15px] font-bold text-[#17231c]">{title}</h3>
          <button
            type="button"
            className={ghostBtn}
            disabled={busy}
            onClick={onCancel}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
        <p className="text-[13px] leading-[20px] text-[#455249]">{message}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className={outlineBtn} disabled={busy} onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={cn(tone === 'danger' ? dangerBtn : outlineBtn)}
            disabled={busy}
            onClick={onConfirm}
          >
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
