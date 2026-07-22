import { useState } from 'react'
import { ChevronDown, X } from 'lucide-react'
import banIcon from '../../assets/⛔.png'
import { cn } from './cn'

const labelClass = 'mb-1.5 block text-[12px] font-medium text-[#7c8780]'
const inputClass =
  'box-border h-[40px] w-full rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white px-3 text-[13px] text-[#1C211F] outline-none transition placeholder:text-[#9aa49d] focus:border-[#1aa054]'

const REASONS = [
  'Conduct violation',
  'Document fraud',
  'Repeated cancellations',
  'Safety incident',
  'Other',
]

export default function AdminTerminateChampModal({
  open,
  onClose,
  champName = 'Champ',
  champId = '',
  defaultCod = 'BHD 12.000',
  onConfirm,
}) {
  const [reason, setReason] = useState(REASONS[0])
  const [effectiveDate, setEffectiveDate] = useState('29 Jun 2026')
  const [cod, setCod] = useState(defaultCod)
  const [note, setNote] = useState('')

  if (!open) return null

  const handleConfirm = () => {
    onConfirm?.({ reason, effectiveDate, cod, note })
    onClose?.()
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close terminate champ modal"
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="terminate-champ-title"
        className="relative w-full max-w-[480px] overflow-hidden rounded-[16px] bg-white shadow-[0_12px_40px_rgba(20,40,28,.18)]"
      >
        <div className="flex items-start gap-3 px-5 py-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 id="terminate-champ-title" className="text-[16px] font-bold text-[#17231c]">
                Terminate champ
              </h2>
              <span className="inline-flex rounded-full bg-[#fdebec] px-2.5 py-[3px] text-[11px] font-bold text-[#d64044]">
                Permanent
              </span>
            </div>
            <p className="mt-1 text-[12.5px] text-[#7c8780]">
              {champName}
              {champId ? ` · ${champId}` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-[#8a948e] hover:bg-[#f3f5f3] hover:text-[#455249]"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 px-5 pb-4">
          <label className="block">
            <span className={labelClass}>Reason</span>
            <div className="relative">
              <select
                className={cn(inputClass, 'appearance-none pr-9')}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              >
                {REASONS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#7c8780]"
              />
            </div>
          </label>

          <label className="block">
            <span className={labelClass}>Effective date</span>
            <div className="relative">
              <input
                className={cn(inputClass, 'pr-9')}
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
              />
              <ChevronDown
                size={14}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#7c8780]"
              />
            </div>
          </label>

          <label className="block">
            <span className={labelClass}>COD outstanding</span>
            <input
              className={inputClass}
              value={cod}
              onChange={(e) => setCod(e.target.value)}
            />
          </label>

          <label className="block">
            <span className={labelClass}>Internal note</span>
            <textarea
              className="box-border min-h-[88px] w-full resize-y rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white px-3 py-2.5 text-[13px] text-[#1C211F] outline-none transition placeholder:text-[#9aa49d] focus:border-[#1aa054]"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Reason details / reference..."
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 px-5 py-4">
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
            className="inline-flex h-[40px] items-center gap-1.5 rounded-full bg-[#d64044] px-4 text-[13px] font-bold text-white hover:bg-[#c0383c]"
          >
            ⊘ 
            Terminate champ
          </button>
        </div>
      </div>
    </div>
  )
}
