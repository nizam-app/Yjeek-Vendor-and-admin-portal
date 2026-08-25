export function AdminLeaveFormModal({
  open,
  busy = false,
  title = 'Leave without saving?',
  message = 'You have unsaved changes. Leave this page without saving?',
  onStay,
  onLeave,
  onSaveDraft,
  saveDraftLabel = 'Save draft',
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[140] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/40"
        disabled={busy}
        onClick={() => !busy && onStay?.()}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-[420px] rounded-t-[16px] bg-white p-5 shadow-[0_18px_44px_rgba(0,0,0,0.28)] sm:rounded-[16px]"
      >
        <h3 className="text-[16px] font-bold text-[#17231c]">{title}</h3>
        <p className="mt-2 text-[13px] leading-relaxed text-[#7c8780]">{message}</p>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={onStay}
            className="inline-flex h-[36px] items-center rounded-full border border-[#d5dbd6] px-4 text-[12.5px] font-bold text-[#455249] hover:bg-[#f7f9f7] disabled:opacity-60"
          >
            Keep editing
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onLeave}
            className="inline-flex h-[36px] items-center rounded-full border border-[#f5c6c4] bg-white px-4 text-[12.5px] font-bold text-[#d64044] hover:bg-[#fdebec] disabled:opacity-60"
          >
            Leave without saving
          </button>
          {onSaveDraft ? (
            <button
              type="button"
              disabled={busy}
              onClick={onSaveDraft}
              className="inline-flex h-[36px] items-center rounded-full bg-[#1aa054] px-4 text-[12.5px] font-bold text-white hover:bg-[#158a47] disabled:opacity-60"
            >
              {saveDraftLabel}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
