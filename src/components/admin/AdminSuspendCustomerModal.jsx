import { useState } from 'react'
import { AlertTriangle, Ban, ChevronDown, X } from 'lucide-react'
import { cn } from './cn'

const labelClass = 'mb-1.5 block text-[12px] font-medium text-[#7c8780]'
const inputClass =
  'box-border h-[40px] w-full rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white px-3 text-[13px] text-[#1C211F] outline-none transition placeholder:text-[#9aa49d] focus:border-[#1aa054]'

const REASONS = [
  'Fraud / chargeback',
  'Abuse / harassment',
  'Multiple cancellations',
  'Suspicious activity',
  'Other',
]

const DURATIONS = ['Until reviewed', '7 days', '30 days', 'Permanent']

export default function AdminSuspendCustomerModal({
  open,
  onClose,
  customerName = 'Customer',
  onConfirm,
}) {
  const [reason, setReason] = useState(REASONS[0])
  const [duration, setDuration] = useState(DURATIONS[0])
  const [note, setNote] = useState('')
  const [notify, setNotify] = useState(false)

  if (!open) return null

  const handleConfirm = () => {
    onConfirm?.({ reason, duration, note, notify })
    onClose?.()
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close suspend customer modal"
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="suspend-customer-title"
        className="relative w-full max-w-[480px] overflow-hidden rounded-[14px] bg-white shadow-[0_12px_40px_rgba(20,40,28,.18)]"
      >
        <div className="flex items-center gap-3  px-5 py-4">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#fdebec] text-[#d64044]">
            <Ban size={16} strokeWidth={2.2} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="suspend-customer-title" className="text-[16px] font-bold text-[#17231c]">
              Suspend customer
            </h2>
            <p className="mt-0.5 text-[12px] text-[#7c8780]">
              {customerName} · blocks ordering &amp; login
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-md text-[#8a948e] hover:bg-[#f3f5f3] hover:text-[#455249]"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <div className="flex items-end gap-2 rounded-[10px] bg-[#fdebec] px-3.5 py-3">
          <span className="text-[16px] text-[#d64044]">⚠</span>
            <p className="text-[12px] leading-[16px] text-[#d64044]">
              Customer can&apos;t place orders or log in until reactivated.
            </p>
          </div>

          <label className="block">
            <span className={labelClass}>Reason</span>
            <div className="relative">
              <select
                className={cn(inputClass, 'appearance-none pr-9')}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              >
                {REASONS.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#7c8780]"
              />
            </div>
          </label>

          <div>
            <span className={labelClass}>Duration</span>
            <div className="flex flex-wrap items-center rounded-[10px] bg-[#e9ebe9] p-[3px]">
              {DURATIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setDuration(option)}
                  className={cn(
                    'h-[32px] flex-1 rounded-[8px] px-2.5 text-[12px] whitespace-nowrap',
                    duration === option
                      ? 'bg-white font-bold text-[#17231c] shadow-[0_1px_3px_rgba(20,40,28,.12)]'
                      : 'font-medium text-[#69756d]',
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <label className="block">
            <span className={labelClass}>Internal note (optional)</span>
            <input
              className={inputClass}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. multiple disputed orders"
            />
          </label>

          <div className="flex items-center justify-between gap-3 rounded-[10px] border border-[#edf0ee] px-3.5 py-3">
            <div className="min-w-0">
              <p className="text-[13px] font-bold text-[#17231c]">Notify customer</p>
              <p className="mt-0.5 text-[12px] text-[#7c8780]">Send suspension email</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={notify}
              onClick={() => setNotify((prev) => !prev)}
              className={cn(
                'relative h-[28px] w-[48px] shrink-0 rounded-full transition',
                notify ? 'bg-[#1aa054]' : 'bg-[#d5dbd7]',
              )}
            >
              <span
                className={cn(
                  'absolute top-[3px] h-[22px] w-[22px] rounded-full bg-white shadow transition',
                  notify ? 'left-[23px]' : 'left-[3px]',
                )}
              />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-[#edf0ee] px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-[40px] items-center rounded-full border border-[#dfe4e0] bg-white px-4 text-[13px] font-medium text-[#17231c] hover:bg-[#f6f8f6]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="inline-flex h-[40px] items-center rounded-full bg-[#d64044] px-4 text-[13px] font-bold text-white hover:bg-[#c0383c]"
          >
            Suspend customer
          </button>
        </div>
      </div>
    </div>
  )
}
