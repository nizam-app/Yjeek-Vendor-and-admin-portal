import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, Search } from 'lucide-react'
import { cn } from '../cn'

/**
 * Pill multi-select (or single-select) used on Live Orders full view / board.
 */
export function AdminFilterDropdown({
  label,
  allLabel = 'All',
  options = [],
  selectedIds = [],
  onChange,
  searchable = false,
  searchPlaceholder = 'Search…',
  multiple = true,
  showAll = true,
  align = 'left',
  rounded = 'full',
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const rootRef = useRef(null)

  useEffect(() => {
    function onDocMouseDown(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocMouseDown)
    return () => document.removeEventListener('mousedown', onDocMouseDown)
  }, [])

  useEffect(() => {
    if (!open) setQuery('')
  }, [open])

  const selected = Array.isArray(selectedIds) ? selectedIds.map(String) : []
  const selectedSet = new Set(selected)
  const term = query.trim().toLowerCase()
  const visible = (Array.isArray(options) ? options : []).filter((option) => {
    if (!term) return true
    return String(option.label || '').toLowerCase().includes(term)
      || String(option.id || '').toLowerCase().includes(term)
  })

  const summary = selected.length === 0
    ? allLabel
    : selected.length === 1
      ? (options.find((option) => String(option.id) === selected[0])?.label || '1 selected')
      : `${selected.length} selected`

  function selectAll() {
    onChange?.([])
    if (!multiple) setOpen(false)
  }

  function toggle(id) {
    const value = String(id)
    if (!multiple) {
      onChange?.([value])
      setOpen(false)
      return
    }
    const next = selectedSet.has(value)
      ? selected.filter((item) => item !== value)
      : [...selected, value]
    onChange?.(next)
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={cn(
          'h-[31px] border border-[#dfe4e0] bg-white px-3 text-[10px] text-[#59655e]',
          rounded === 'md' ? 'rounded-md' : 'rounded-full',
        )}
      >
        {label} · <b>{summary}</b>
        <ChevronDown size={11} className="ml-1 inline-block align-[-1px] text-[#7a857e]" aria-hidden />
      </button>
      {open ? (
        <div className={cn(
          'absolute z-50 mt-1 w-[240px] overflow-hidden rounded-md border border-[#e1e5e2] bg-white shadow-[0_10px_26px_rgba(20,30,24,.16)]',
          align === 'right' ? 'right-0' : 'left-0',
        )}>
          {searchable ? (
            <label className="flex h-[34px] items-center gap-2 border-b border-[#edf0ee] px-2.5">
              <Search size={12} className="text-[#8a948e]" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="min-w-0 flex-1 border-0 bg-transparent text-[11px] outline-none"
                placeholder={searchPlaceholder}
                autoFocus
              />
            </label>
          ) : null}
          <div className="max-h-[240px] overflow-y-auto py-1">
            {showAll ? (
              <button
                type="button"
                onClick={selectAll}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12px] hover:bg-[#f5f8f6]"
              >
                <span className={cn(
                  'grid h-3.5 w-3.5 place-items-center rounded-sm border',
                  selected.length === 0 ? 'border-[#118446] bg-[#118446] text-white' : 'border-[#c5cdc7]',
                )}>
                  {selected.length === 0 ? <Check size={10} strokeWidth={3} /> : null}
                </span>
                {label} · {allLabel}
              </button>
            ) : null}
            {visible.length === 0 ? (
              <p className="px-3 py-2 text-[11px] text-[#78837c]">No matches.</p>
            ) : null}
            {visible.map((option) => {
              const checked = selectedSet.has(String(option.id))
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => toggle(option.id)}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12px] hover:bg-[#f5f8f6]"
                >
                  <span className={cn(
                    'grid h-3.5 w-3.5 place-items-center rounded-sm border',
                    checked ? 'border-[#118446] bg-[#118446] text-white' : 'border-[#c5cdc7]',
                  )}>
                    {checked ? <Check size={10} strokeWidth={3} /> : null}
                  </span>
                  <span className="min-w-0 truncate">{option.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}
