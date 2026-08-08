import { useEffect, useState } from 'react'
import warningIcon from '../assets/warning-icon.png'
import { SERVICE_REJECT_REASONS } from '../mappers/vendor/mapVendorRejectionReason'

export default function ServiceRejectBookingModal({
  open,
  onClose,
  order,
  onConfirm,
  isSubmitting = false,
  error = null,
}) {
  const [reason, setReason] = useState('')
  const [note, setNote] = useState('')

  useEffect(() => {
    if (!open) return undefined
    function onKeyDown(event) {
      if (event.key === 'Escape' && !isSubmitting) onClose?.()
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, onClose, isSubmitting])

  useEffect(() => {
    if (!open) {
      setReason('')
      setNote('')
    }
  }, [open])

  if (!open || !order) return null

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-6" role="dialog" aria-modal="true">
      <button
        type="button"
        className="absolute inset-0 bg-[rgba(0,0,0,0.25)]"
        aria-label="Close reject service booking modal"
        onClick={() => {
          if (!isSubmitting) onClose?.()
        }}
      />
      <div className="relative w-[460px] max-w-full overflow-hidden rounded-[16px] bg-white shadow-[0px_12px_40px_rgba(0,0,0,0.25)]">
        <div className="flex flex-col gap-4 px-[26px] py-[24px]">
          <div className="flex flex-col gap-1.5">
            <h2 className="text-[18px] font-bold leading-[22px] text-[#1A1A1A]">
              Reject service booking {order.id}
            </h2>
            <p className="text-[13px] font-normal leading-[18px] text-[#69706E]">
              Tell us why you can&apos;t fulfil this service booking. The customer is notified and
              refunded if prepaid.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-[13px] font-bold leading-[16px] text-[#1A1A1A]">Reason (required)</p>
            <div className="flex flex-col overflow-hidden rounded-[10px] border border-[#DBE0DB] px-[16px]">
              {SERVICE_REJECT_REASONS.map((item, idx) => (
                <label
                  key={item.label}
                  className={`flex cursor-pointer items-center justify-between gap-3 py-3 ${
                    idx < SERVICE_REJECT_REASONS.length - 1 ? 'border-b border-[#DBE0DB]' : ''
                  }`}
                >
                  <span className="text-[13px] font-medium leading-[16px] text-[#1A1A1A]">
                    {item.label}
                  </span>
                  <input
                    type="radio"
                    name="service-reject-reason"
                    value={item.label}
                    checked={reason === item.label}
                    onChange={() => setReason(item.label)}
                    disabled={isSubmitting}
                    className="h-[18px] w-[18px] shrink-0 accent-[#1A1A1A]"
                  />
                </label>
              ))}
            </div>
          </div>

          <textarea
            className="box-border flex h-16 w-full resize-none items-start rounded-[12px] border-[1.3px] border-dashed border-[#B3BDB5] bg-white p-[14px] text-[13px] font-normal leading-[18px] text-[#1A1A1A] outline-none placeholder:text-[#949C94] disabled:opacity-60"
            placeholder="Add a note (optional)…"
            value={note}
            disabled={isSubmitting}
            onChange={(event) => setNote(event.target.value)}
          />

          <div className="flex items-center gap-2 rounded-[10px] bg-warn-soft px-4 py-3">
            <img
              src={warningIcon}
              alt=""
              className="h-[18px] w-[18px] shrink-0 object-contain"
              aria-hidden="true"
            />
            <p className="text-[12.5px] font-medium leading-[18px] text-[#8a5a12]">
              Rejecting an accepted service booking close to its window may carry a penalty.
            </p>
          </div>

          {error ? (
            <p className="text-[12.5px] font-medium text-danger">
              {error.message || 'Failed to reject booking.'}
            </p>
          ) : null}

          <div className="flex w-full gap-3">
            <button
              type="button"
              className="h-12 flex-1 rounded-full border-[1.2px] border-[#DBE0DB] bg-white text-[14px] font-medium leading-[17px] text-[#1A1A1A] hover:bg-[#f7f9f7] disabled:opacity-50"
              disabled={isSubmitting}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className="h-12 flex-1 rounded-full bg-danger text-[14px] font-bold leading-[17px] text-white hover:brightness-[0.96] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!reason || isSubmitting}
              onClick={() => onConfirm?.({ reason, note })}
            >
              {isSubmitting ? 'Rejecting…' : 'Confirm rejection'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
