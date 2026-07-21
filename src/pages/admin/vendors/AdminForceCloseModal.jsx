import { useState } from 'react'
import { AlertTriangle, ChevronDown, X } from 'lucide-react'

const cn = (...parts) => parts.filter(Boolean).join(' ')

const labelClass = 'mb-1.5 block text-[12px] font-medium text-[#7c8780]'
const inputClass =
  'box-border h-[40px] w-full rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white px-3 text-[13px] text-[#17231c] outline-none transition placeholder:text-[#9aa49d] focus:border-[#1aa054]'

const REASONS = [
  'Emergency / maintenance',
  'Out of stock',
  'Staff shortage',
  'Kitchen closed',
  'Other',
]

const DEFAULT_BRANCHES = ['Manama — Al Seef', 'Juffair — Road 2401', 'Riffa — East']

export default function AdminForceCloseModal({
  open,
  onClose,
  storeName = 'Green Kitchen',
  branchName = 'Manama — Al Seef',
  branches = DEFAULT_BRANCHES,
  defaultScope = 'branch',
  onConfirm,
}) {
  const [scope, setScope] = useState(defaultScope === 'store' ? 'Whole store' : 'Single branch')
  const [branch, setBranch] = useState(branchName || branches[0] || 'Manama — Al Seef')
  const [reason, setReason] = useState(REASONS[0])
  const [from, setFrom] = useState('9 Apr 2026 · 14:00')
  const [to, setTo] = useState('9 Apr 2026 · 18:00')
  const [note, setNote] = useState('')

  if (!open) return null

  const handleConfirm = () => {
    onConfirm?.({
      scope,
      branch: scope === 'Single branch' ? branch : null,
      reason,
      from,
      to,
      note,
    })
    onClose?.()
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close force close modal"
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="force-close-title"
        className="relative w-full max-w-[520px] overflow-hidden rounded-[14px] bg-white shadow-[0_12px_40px_rgba(20,40,28,.18)]"
      >
        <div className="flex items-center gap-3 border-b border-[#edf0ee] px-5 py-4">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#fff3d6] text-[#c4841a]">
            <AlertTriangle size={16} strokeWidth={2.2} />
          </span>
          <div className="min-w-0 ">
            <h2 id="force-close-title" className="text-[16px] font-bold text-[#17231c]">
              Force close
            </h2>
            <p className="mt-0.5 text-[12px] text-[#7c8780]">
              {storeName} · temporarily stop orders
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-md text-[#8a948e] hover:bg-[#f3f5f3] hover:text-[#455249]"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <div className="flex w-fit items-center gap-2 rounded-[10px] bg-[#fff7d8] px-3.5 py-3">
            <AlertTriangle size={14} className="mt-0.5 shrink-0 text-[#c4841a]" />
            <p className="text-[12px] leading-[16px] text-[#c4841a]">
              Customers will see the store/branch as closed until reopened.
            </p>
          </div>

          <div>
            <span className={labelClass}>Scope</span>
            <div className="flex w-fit items-center rounded-[10px] bg-[#e9ebe9] p-[3px]">
              {['Whole store', 'Single branch'].map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setScope(option)}
                  className={cn(
                    'h-[32px] rounded-[8px] px-3 text-[12px]',
                    scope === option
                      ? 'bg-white font-bold text-[#17231c] shadow-[0_1px_3px_rgba(20,40,28,.12)]'
                      : 'font-medium text-[#69756d]',
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <label className="block w-fit">
            <span className={labelClass}>Branch (if single)</span>
            <div className="relative">
              <select
                className={cn(inputClass, 'appearance-none pr-9', scope !== 'Single branch' && 'opacity-60')}
                value={branch}
                disabled={scope !== 'Single branch'}
                onChange={(e) => setBranch(e.target.value)}
              >
                {branches.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#7c8780]" />
            </div>
          </label>

          <label className="block w-fit">
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
              <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#7c8780]" />
            </div>
          </label>

          <div className="grid grid-cols-2 gap-3 max-[520px]:grid-cols-1">
            <label className="block">
              <span className={labelClass}>From</span>
              <input className={inputClass} value={from} onChange={(e) => setFrom(e.target.value)} />
            </label>
            <label className="block">
              <span className={labelClass}>To</span>
              <input className={inputClass} value={to} onChange={(e) => setTo(e.target.value)} />
            </label>
          </div>

          <label className="inline-block w-fit">
            <span className={labelClass}>Note (optional)</span>
            <input
              className={inputClass}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. kitchen maintenance until 5 PM"
            />
          </label>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-[#edf0ee] px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-[36px] items-center rounded-full border border-[#e4e8e4] bg-white px-4 text-[13px] font-medium text-[#455249] hover:bg-[#f6f8f6]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="inline-flex h-[36px] items-center rounded-full bg-[#c4841a] px-4 text-[13px] font-bold text-white hover:bg-[#a86f12]"
          >
            Force close
          </button>
        </div>
      </div>
    </div>
  )
}
