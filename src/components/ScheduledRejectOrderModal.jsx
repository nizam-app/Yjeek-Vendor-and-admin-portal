import { useEffect, useState } from 'react'
import warningIcon from '../assets/warning-icon.png'

const scheduledRejectReasons = [
  'Item(s) out of stock for that day',
  'Closed at the scheduled time',
  'Kitchen capacity full for that window',
  'Cannot fulfil at the scheduled time',
  'Branch unavailable that day',
  'Other (please specify)',
]

export default function ScheduledRejectOrderModal({ open, onClose, order }) {
  const [reason, setReason] = useState('')
  const [note, setNote] = useState('')

  useEffect(() => {
    if (!open) return
    function onKeyDown(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  useEffect(() => {
    if (!open) {
      setReason('')
      setNote('')
    }
  }, [open])

  if (!open || !order) return null

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-6" role="dialog" aria-modal="true">
      <button type="button" className="absolute inset-0 bg-[rgba(0,0,0,0.25)]" aria-label="Close reject scheduled order modal" onClick={onClose} />
      <div className="relative w-[460px] max-w-full bg-white rounded-[16px] shadow-[0px_12px_40px_rgba(0,0,0,0.25)] overflow-hidden">
        <div className="flex flex-col px-[26px] py-[24px] gap-4">
          <div className="flex flex-col gap-1.5">
            <h2 className="text-[18px] font-bold leading-[22px] text-[#1A1A1A]">Reject scheduled order {order.id}</h2>
            <p className="text-[13px] font-normal leading-[18px] text-[#69706E]">
              Tell us why you can&apos;t fulfil this scheduled order. The customer is notified and refunded if prepaid.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-[13px] font-bold leading-[16px] text-[#1A1A1A]">Reason (required)</p>
            <div className="flex flex-col rounded-[10px] border border-[#DBE0DB] overflow-hidden px-[16px]">
              {scheduledRejectReasons.map((item, idx) => (
                <label
                  key={item}
                  className={`flex items-center justify-between gap-3 py-3 cursor-pointer ${
                    idx < scheduledRejectReasons.length - 1 ? 'border-b border-[#DBE0DB]' : ''
                  }`}
                >
                  <span className="text-[13px] font-medium leading-[16px] text-[#1A1A1A]">{item}</span>
                  <input
                    type="radio"
                    name="scheduled-reject-reason"
                    value={item}
                    checked={reason === item}
                    onChange={() => setReason(item)}
                    className="w-[18px] h-[18px] shrink-0 accent-[#1A1A1A]"
                  />
                </label>
              ))}
            </div>
          </div>

          <textarea
            className="box-border flex w-full h-16 resize-none items-start rounded-[12px] border-[1.3px] border-dashed border-[#B3BDB5] bg-white p-[14px] text-[13px] font-normal leading-[18px] text-[#1A1A1A] placeholder:text-[#949C94] outline-none"
            placeholder="Add a note (optional)…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />

          <div className="flex items-center gap-2 rounded-[10px] bg-warn-soft px-4 py-3">
            <img src={warningIcon} alt="" className="w-[18px] h-[18px] object-contain shrink-0" aria-hidden="true" />
            <p className="text-[12.5px] font-medium leading-[18px] text-[#8a5a12]">
              Rejecting an accepted scheduled order close to its window may carry a penalty.
            </p>
          </div>

          <div className="flex gap-3 w-full">
            <button
              type="button"
              className="flex-1 h-12 bg-white border-[1.2px] border-[#DBE0DB] rounded-full text-[14px] font-semibold leading-[17px] text-[#1A1A1A] hover:bg-[#f7f9f7]"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className="flex-1 h-12 bg-danger rounded-full text-[14px] font-bold leading-[17px] text-white hover:brightness-[0.96] disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!reason}
              onClick={onClose}
            >
              Confirm rejection
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
