import { useEffect, useId, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from './cn'

function normalizeOptions(options = []) {
  return (Array.isArray(options) ? options : []).map((option) => {
    if (option && typeof option === 'object') {
      return {
        value: String(option.value ?? ''),
        label: String(option.label ?? option.value ?? ''),
      }
    }
    return { value: String(option), label: String(option) }
  })
}

/**
 * Custom filter dropdown (rounded panel + green check) — replaces native <select>.
 * Matches vendor Orders History Status dropdown style for admin filter bars.
 */
export function AdminFilterSelect({
  options = [],
  value,
  onChange,
  label,
  /** When value is empty / unmatched, show this instead of raw value (e.g. "Categories"). */
  placeholder,
  /** Extra classes on the trigger button. */
  className,
  /** Fixed / min width for trigger + menu. */
  widthClass,
  /** pill = rounded-full (fleet/reports); square = rounded-sm (users/customers). */
  shape = 'pill',
  /** Optional uppercase label above the control (customers Age/Gender). */
  fieldLabel,
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const listId = useId()
  const normalized = normalizeOptions(options)
  const selected = normalized.find((option) => option.value === value)
  const display =
    selected?.label ||
    (value !== undefined && value !== null && String(value) !== '' ? String(value) : null) ||
    placeholder ||
    label ||
    '—'

  useEffect(() => {
    if (!open) return undefined
    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false)
    }
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div className={cn('relative inline-flex flex-col', fieldLabel ? 'gap-1.5' : '')} ref={rootRef}>
      {fieldLabel ? (
        <span className="text-[10px] font-semibold uppercase tracking-[0.02em] text-[#6B736E]">
          {fieldLabel}
        </span>
      ) : null}
      <button
        type="button"
        aria-label={label || fieldLabel || 'Filter'}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        className={cn(
          'inline-flex h-[34px] items-center justify-between gap-2 border border-[#e4e8e4] bg-white pl-3 pr-2.5 text-[12px] font-medium text-[#455249] shadow-[0_1px_2px_rgba(20,40,28,.04)] hover:bg-[#fafbfa]',
          shape === 'pill' ? 'rounded-full' : 'rounded-sm',
          widthClass,
          className,
        )}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="max-w-[220px] truncate whitespace-nowrap">{display}</span>
        <ChevronDown size={13} strokeWidth={2.2} className="shrink-0 text-[#7c8780]" aria-hidden />
      </button>

      {open ? (
        <div
          id={listId}
          role="listbox"
          aria-label={label || fieldLabel || 'Options'}
          className={cn(
            'absolute left-0 top-[calc(100%+6px)] z-40 max-h-[280px] min-w-full overflow-y-auto overflow-x-hidden rounded-[10px] border border-[#e4e8e4] bg-white shadow-[0_12px_28px_rgba(26,28,26,0.14)]',
            widthClass,
          )}
        >
          {normalized.map((option, idx) => {
            const isSelected = option.value === value
            return (
              <button
                key={`${option.value}-${option.label}`}
                type="button"
                role="option"
                aria-selected={isSelected}
                className={cn(
                  'flex w-full items-center justify-between gap-3 px-3 py-[11px] text-left text-[13px]',
                  idx > 0 ? 'border-t border-[#eceeec]' : '',
                  isSelected
                    ? 'font-medium text-[#147940]'
                    : 'font-medium text-[#17231c] hover:bg-[#f7f9f7]',
                )}
                onClick={() => {
                  onChange?.(option.value)
                  setOpen(false)
                }}
              >
                <span className="whitespace-nowrap">{option.label}</span>
                {isSelected ? (
                  <span className="inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-[#1aa054]">
                    <Check size={11} strokeWidth={3} className="text-white" />
                  </span>
                ) : null}
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

export default AdminFilterSelect
