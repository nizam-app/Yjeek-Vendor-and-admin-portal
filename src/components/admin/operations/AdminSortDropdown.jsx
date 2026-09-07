import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '../cn'

/**
 * Sort trigger + radio menu. Label stays separate from the value ("Sort:" then "Time left").
 */
export function AdminSortDropdown({
  value,
  options = [],
  onChange,
  align = 'left',
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const selected = options.find((item) => String(item.id) === String(value)) || options[0] || null

  useEffect(() => {
    function onDocMouseDown(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocMouseDown)
    return () => document.removeEventListener('mousedown', onDocMouseDown)
  }, [])

  return (
    <div ref={rootRef} className="relative inline-flex items-center gap-1.5">
      <span className="text-[10px] font-medium text-[#59655e]">Sort:</span>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="inline-flex h-[31px] items-center gap-1 rounded-full border border-[#dfe4e0] bg-white px-3 text-[10px] font-medium text-[#14763f]"
      >
        <span className="max-w-[11rem] truncate">{selected?.label || 'Time left'}</span>
        <ChevronDown size={11} className="shrink-0 text-[#7a857e]" aria-hidden />
      </button>
      {open ? (
        <div
          className={cn(
            'absolute top-[calc(100%+4px)] z-50 w-[220px] overflow-hidden rounded-[10px] border border-[#e1e5e2] bg-white py-1.5 shadow-[0_10px_26px_rgba(20,30,24,.16)]',
            align === 'right' ? 'right-0' : 'left-0',
          )}
          role="listbox"
        >
          {options.map((option) => {
            const checked = String(option.id) === String(selected?.id)
            return (
              <button
                key={option.id}
                type="button"
                role="option"
                aria-selected={checked}
                onClick={() => {
                  onChange?.(option.id)
                  setOpen(false)
                }}
                className="flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-[12px] text-[#101a14] hover:bg-[#f5f8f6]"
              >
                <span
                  className={cn(
                    'grid h-[15px] w-[15px] shrink-0 place-items-center rounded-full border',
                    checked ? 'border-[#1aa054] bg-[#1aa054] text-white' : 'border-[#c5cdc7] bg-white',
                  )}
                >
                  {checked ? <Check size={9} strokeWidth={3} /> : null}
                </span>
                <span className="min-w-0 truncate">{option.label}</span>
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
