import { useEffect, useId, useRef, useState } from 'react'
import { Check, ChevronDown, Search } from 'lucide-react'
import { cn } from './cn'

/**
 * Full-width searchable multi-select for admin forms (Notify champs, etc.).
 */
export function AdminFormMultiSelect({
  options = [],
  selectedIds = [],
  onChange,
  placeholder = 'Select…',
  searchPlaceholder = 'Search…',
  disabled = false,
  loading = false,
  emptyLabel = 'No options available.',
  className,
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const rootRef = useRef(null)
  const listId = useId()

  const selected = Array.isArray(selectedIds) ? selectedIds.map(String) : []
  const selectedSet = new Set(selected)
  const normalized = (Array.isArray(options) ? options : []).map((option) => ({
    id: String(option.id ?? option.value ?? ''),
    label: String(option.label ?? option.name ?? option.id ?? ''),
  })).filter((option) => option.id)

  const term = query.trim().toLowerCase()
  const visible = normalized.filter((option) => {
    if (!term) return true
    return option.label.toLowerCase().includes(term) || option.id.toLowerCase().includes(term)
  })

  const summary = loading
    ? 'Loading…'
    : selected.length === 0
      ? placeholder
      : selected.length === 1
        ? (normalized.find((option) => option.id === selected[0])?.label || '1 selected')
        : `${selected.length} selected`

  useEffect(() => {
    if (!open) setQuery('')
  }, [open])

  useEffect(() => {
    if (!open) return undefined
    function onDocMouseDown(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocMouseDown)
    return () => document.removeEventListener('mousedown', onDocMouseDown)
  }, [open])

  function toggle(id) {
    const value = String(id)
    const next = selectedSet.has(value)
      ? selected.filter((item) => item !== value)
      : [...selected, value]
    onChange?.(next)
  }

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        type="button"
        disabled={disabled || loading}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => {
          if (disabled || loading) return
          setOpen((current) => !current)
        }}
        className={cn(
          'box-border flex h-[40px] w-full items-center justify-between gap-2 rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white px-3 text-left text-[13px] text-[#17231c] outline-none transition focus:border-[#1aa054]',
          disabled || loading ? 'cursor-not-allowed opacity-60' : 'hover:border-[#cfd5d0]',
          selected.length === 0 ? 'text-[#9aa49d]' : 'text-[#17231c]',
        )}
      >
        <span className="min-w-0 truncate">{summary}</span>
        <ChevronDown size={14} className="shrink-0 text-[#7c8780]" aria-hidden />
      </button>

      {open ? (
        <div
          id={listId}
          role="listbox"
          aria-multiselectable="true"
          className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 overflow-hidden rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white shadow-[0_10px_26px_rgba(20,30,24,.16)]"
        >
          <label className="flex h-[36px] items-center gap-2 border-b border-[#edf0ee] px-3">
            <Search size={13} className="text-[#8a948e]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="min-w-0 flex-1 border-0 bg-transparent text-[12px] text-[#17231c] outline-none placeholder:text-[#9aa49d]"
              placeholder={searchPlaceholder}
              autoFocus
            />
          </label>
          <div className="max-h-[220px] overflow-y-auto py-1">
            {visible.length === 0 ? (
              <p className="px-3 py-2 text-[12px] text-[#78837c]">
                {normalized.length === 0 ? emptyLabel : 'No matches.'}
              </p>
            ) : null}
            {visible.map((option) => {
              const checked = selectedSet.has(option.id)
              return (
                <button
                  key={option.id}
                  type="button"
                  role="option"
                  aria-selected={checked}
                  onClick={() => toggle(option.id)}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] hover:bg-[#f5f8f6]"
                >
                  <span
                    className={cn(
                      'grid h-4 w-4 shrink-0 place-items-center rounded-[4px] border',
                      checked ? 'border-[#118446] bg-[#118446] text-white' : 'border-[#c5cdc7]',
                    )}
                  >
                    {checked ? <Check size={11} strokeWidth={3} /> : null}
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

export default AdminFormMultiSelect
