import { useEffect } from 'react'
import { Check, X } from 'lucide-react'
import motoBike from '../assets/moto_bike.png'

function Divider() {
  return <div className="w-full h-px bg-[#CCD1CC] shrink-0" role="separator" aria-hidden="true" />
}

const checklistItems = [
  'Items complete & matched to ticket',
  'Tamper-evident seal applied',
  'Bag labelled with order #',
]

export default function HandoverChampModal({ open, onClose, order }) {
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

  if (!open || !order) return null

  const champName = order.champName || 'Ahmed Ali'

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6" role="dialog" aria-modal="true">
      <button type="button" className="absolute inset-0 bg-[rgba(0,0,0,0.25)]" aria-label="Close handover modal" onClick={onClose} />
      <div className="relative w-[640px] max-w-full bg-white rounded-[16px]  shadow-[0px_12px_40px_rgba(41,120,219,0.18)] overflow-hidden">
        <div className="flex flex-col py-[18px] gap-4">
          <div className="flex items-center justify-between gap-3 px-[24px]">
            <div className="flex items-center gap-2.5 min-w-0">
              <h2 className="text-[16px] font-bold leading-[19px] text-[#1A1A1A] truncate">Order {order.id}</h2>
              <span className="inline-flex items-center rounded-full border border-green-active-text bg-green-active-bg py-[3px] px-[10px] text-[10px] font-bold uppercase text-green-active-text shrink-0">
                READY
              </span>
            </div>
            <button
              type="button"
              className="w-8 h-8 rounded-[8px] border-0 bg-transparent text-[#949C94] hover:bg-[#f7f9f7] grid place-items-center shrink-0"
              onClick={onClose}
              aria-label="Close"
            >
              <X size={18} strokeWidth={2} />
            </button>
          </div>

          <Divider />

          <div className="flex items-center gap-2.5 rounded-[10px] bg-[#E8F1FB] px-4 py-3 mx-[24px]">
            <img src={motoBike} alt="" className="w-6 h-6 object-contain shrink-0" aria-hidden="true" />
            <p className="text-[13px] font-medium leading-[16px] text-[#2B6CB0]">
              Champ arriving — {champName}
            </p>
          </div>

          <div className="flex w-full flex-col items-start gap-3 text-left px-[24px]">
            <h3 className="w-full text-[13px] font-bold leading-[16px] text-[#1A1A1A]">Packaging &amp; handover checklist</h3>
            <ul className="flex w-full list-none flex-col items-start gap-2.5 p-0 m-0">
              {checklistItems.map((item) => (
                <li key={item} className="flex w-full items-center justify-start gap-2.5 p-0 m-0">
                  <span className="w-[18px] h-[18px] rounded-[5px] bg-green-primary grid place-items-center shrink-0">
                    <Check size={12} strokeWidth={3} className="text-white" />
                  </span>
                  <span className="text-[13px] font-medium leading-[16px] text-[#1A1A1A]">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="px-[24px]">
            <button
              type="button"
              className="flex items-center justify-center gap-2 w-full h-12 bg-green-primary rounded-[10px] text-[14px] font-bold leading-[17px] text-white hover:brightness-[0.96]"
              onClick={onClose}
            >
              <Check size={16} strokeWidth={3} />
              Hand over to champ
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
