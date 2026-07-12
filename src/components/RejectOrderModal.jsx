import { useEffect, useState } from 'react'

const deliveryRejectReasons = [
  'Item(s) out of stock',
  'Kitchen too busy right now',
  'Closing soon',
  'Cannot fulfil on time',
  'Price / menu error',
  'Other (please specify)',
]

const dineInRejectReasons = [
  'Fully booked — no tables',
  'Kitchen too busy right now',
  'Closing soon',
  'Cannot accommodate party size',
  'Closed for the day',
  'Other (please specify)',
]

function buildDineInSubtitle(order) {
  const guest = order.guest || 'Guest'
  const guests = order.guests ? `${order.guests} guests` : 'guests'
  const when = order.when || 'Today'
  return `${guest} · ${guests} · ${when}. Tell us why you're rejecting this reservation. The guest is notified and refunded if prepaid.`
}

export default function RejectOrderModal({ open, onClose, order, tab = 'delivery' }) {
  const [reason, setReason] = useState('')
  const [note, setNote] = useState('')
  const isDineIn = tab === 'dinein'

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

  const rejectReasons = isDineIn ? dineInRejectReasons : deliveryRejectReasons
  const title = isDineIn ? `Reject dine-in ${order.id}` : `Reject order ${order.id}`
  const subtitle = isDineIn
    ? buildDineInSubtitle(order)
    : "Tell us why you're rejecting this order. The customer is refunded automatically for card/wallet payments."
  const warning = isDineIn
    ? 'The guest is notified and refunded if prepaid. Frequent rejections affect your ranking.'
    : 'Frequent rejections lower your acceptance rate and dispatch priority.'

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6" role="dialog" aria-modal="true">
      <button type="button" className="absolute inset-0 bg-[rgba(0,0,0,0.25)]" aria-label="Close reject order modal" onClick={onClose} />
      <div className="relative w-[460px] max-w-full bg-white rounded-[16px] shadow-[0px_12px_40px_rgba(0,0,0,0.25)] overflow-hidden">
        <div className="flex flex-col px-[26px] py-[24px] gap-4">
          <div className="flex flex-col gap-1.5">
            <h2 className="text-[18px] font-bold leading-[22px] text-[#1A1A1A]">{title}</h2>
            <p className="text-[13px] font-normal leading-[18px] text-[#69706E]">{subtitle}</p>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-[13px] font-bold leading-[16px] text-[#1A1A1A]">Reason (required)</p>
            <div className="flex flex-col rounded-[10px] border border-[#DBE0DB] overflow-hidden px-[16px]">
              {rejectReasons.map((item, idx) => (
                <label
                  key={item}
                  className={`flex items-center justify-between gap-3 py-3 cursor-pointer ${
                    idx < rejectReasons.length - 1 ? 'border-b border-[#DBE0DB]' : ''
                  }`}
                >
                  <span className="text-[13px] font-medium leading-[16px] text-[#1A1A1A]">{item}</span>
                  <input
                    type="radio"
                    name="reject-reason"
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

          <div className="flex items-start gap-2 rounded-[10px] bg-warn-soft px-4 py-3">
            <span className="text-[14px] leading-none shrink-0" aria-hidden="true">
              ⚠️
            </span>
            <p className="text-[12.5px] font-medium leading-[18px] text-[#8a5a12]">{warning}</p>
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
