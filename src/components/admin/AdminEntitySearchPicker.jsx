import { useEffect, useId, useRef, useState } from 'react'
import { Plus, Search, X } from 'lucide-react'
import { cn } from './cn'

const labelClass = 'mb-1.5 block text-[12px] font-medium leading-none text-[#7c8780]'
const inputClass =
  'box-border h-[40px] w-full rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white px-3 text-[13px] text-[#17231c] outline-none transition placeholder:text-[#9aa49d] focus:border-[#1aa054]'

/**
 * Search picker for admin entities (vendors, etc.).
 *
 * - Default: multi-select (chips + optional raw-id Add).
 * - `maxSelected={1}`: single-select — pick one, clear to choose another.
 *
 * @param {{
 *   label: string,
 *   placeholder?: string,
 *   helperText?: string,
 *   selected: Array<{ id: string, label: string, meta?: string }>,
 *   onChange: (next: Array<{ id: string, label: string, meta?: string }>) => void,
 *   searchFn: (query: string, opts?: { signal?: AbortSignal }) => Promise<Array<{ id: string, label: string, meta?: string }>>,
 *   disabled?: boolean,
 *   allowRawIdAdd?: boolean,
 *   minQueryLength?: number,
 *   maxSelected?: number,
 *   className?: string,
 * }} props
 */
export function AdminEntitySearchPicker({
  label,
  placeholder = 'Type a name to search…',
  helperText,
  selected = [],
  onChange,
  searchFn,
  disabled = false,
  allowRawIdAdd = true,
  minQueryLength = 2,
  maxSelected,
  className,
}) {
  const listId = useId()
  const rootRef = useRef(null)
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [highlight, setHighlight] = useState(-1)

  const isSingle = maxSelected === 1
  const selectedIds = new Set(selected.map((item) => item.id))
  const singleSelected = isSingle ? selected[0] ?? null : null
  const atCapacity = Number.isFinite(maxSelected) && selected.length >= maxSelected

  useEffect(() => {
    function onDocMouseDown(event) {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false)
        setHighlight(-1)
      }
    }
    document.addEventListener('mousedown', onDocMouseDown)
    return () => document.removeEventListener('mousedown', onDocMouseDown)
  }, [])

  useEffect(() => {
    if (isSingle && singleSelected) {
      setQuery('')
      setSuggestions([])
      setOpen(false)
      setLoading(false)
      setSearchError('')
      return undefined
    }

    const term = String(query || '').trim()
    if (term.length < minQueryLength) {
      setSuggestions([])
      setLoading(false)
      setSearchError('')
      return undefined
    }

    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      setLoading(true)
      setSearchError('')
      try {
        const rows = await searchFn(term, { signal: controller.signal })
        if (controller.signal.aborted) return
        const next = (Array.isArray(rows) ? rows : [])
          .filter((row) => row?.id && !selectedIds.has(String(row.id)))
          .slice(0, 8)
        setSuggestions(next)
        setHighlight(next.length ? 0 : -1)
        if (term.length > 0) setOpen(true)
      } catch (err) {
        if (controller.signal.aborted) return
        setSuggestions([])
        setSearchError(err?.message || 'Search failed.')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }, minQueryLength === 0 ? 0 : 300)

    return () => {
      controller.abort()
      window.clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, searchFn, selected, minQueryLength, isSingle, singleSelected])

  function addItem(item) {
    if (!item?.id) return
    const id = String(item.id)
    const nextItem = {
      id,
      label: String(item.label || id),
      ...(item.meta ? { meta: String(item.meta) } : {}),
      ...(Array.isArray(item.orderTypes) && item.orderTypes.length
        ? {
          orderTypes: item.orderTypes
            .map((t) => String(t || '').trim().toUpperCase())
            .filter(Boolean),
        }
        : {}),
    };

    if (isSingle) {
      onChange([nextItem]);
    } else {
      if (selectedIds.has(id)) return;
      if (Number.isFinite(maxSelected) && selected.length >= maxSelected) return;
      onChange([...selected, nextItem]);
    }
    setQuery('')
    setSuggestions([])
    setOpen(false)
    setHighlight(-1)
  }

  function removeItem(id) {
    onChange(selected.filter((item) => item.id !== id))
  }

  function clearAll() {
    onChange([])
  }

  function addRawId() {
    if (!allowRawIdAdd) return
    const id = String(query || '').trim()
    if (!id) return
    addItem({ id, label: id })
  }

  return (
    <div ref={rootRef} className={cn('min-w-0', className)}>
      <p className={labelClass}>{label}</p>

      {isSingle ? (
        singleSelected ? (
          <div
            className={cn(
              inputClass,
              'flex items-center gap-2 border-[#1aa054] bg-[#f3fbf6] pr-2',
            )}
            title={singleSelected.id}
          >
            <span className="min-w-0 flex-1 truncate font-semibold text-[#147940]">
              {singleSelected.label}
            </span>
            {singleSelected.meta ? (
              <span className="hidden shrink-0 text-[11px] font-medium text-[#7c8780] sm:inline">
                {singleSelected.meta}
              </span>
            ) : null}
            <button
              type="button"
              aria-label={`Clear ${singleSelected.label}`}
              disabled={disabled}
              onClick={clearAll}
              className="grid h-7 w-7 shrink-0 place-items-center rounded-[6px] text-[#147940] hover:bg-[#d8f0e0] disabled:opacity-50"
            >
              <X size={14} strokeWidth={2.4} />
            </button>
          </div>
        ) : (
          <div className="relative">
            <Search
              size={15}
              strokeWidth={2}
              className="pointer-events-none absolute left-3 top-1/2 z-[1] -translate-y-1/2 text-[#9aa49d]"
              aria-hidden
            />
            <input
              className={cn(inputClass, 'pl-9')}
              value={query}
              disabled={disabled}
              placeholder={placeholder}
              role="combobox"
              aria-expanded={open}
              aria-controls={listId}
              aria-autocomplete="list"
              onChange={(event) => {
                setQuery(event.target.value)
                setOpen(true)
              }}
              onFocus={() => {
                if (minQueryLength === 0 || suggestions.length) setOpen(true)
              }}
              onKeyDown={(event) => {
                if (event.key === 'ArrowDown') {
                  event.preventDefault()
                  if (!suggestions.length) return
                  setOpen(true)
                  setHighlight((prev) => (prev + 1) % suggestions.length)
                  return
                }
                if (event.key === 'ArrowUp') {
                  event.preventDefault()
                  if (!suggestions.length) return
                  setOpen(true)
                  setHighlight((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1))
                  return
                }
                if (event.key === 'Enter') {
                  event.preventDefault()
                  if (open && highlight >= 0 && suggestions[highlight]) {
                    addItem(suggestions[highlight])
                    return
                  }
                  addRawId()
                  return
                }
                if (event.key === 'Escape') {
                  setOpen(false)
                  setHighlight(-1)
                }
              }}
            />
            {open && String(query || '').trim().length >= minQueryLength ? (
              <SuggestionList
                listId={listId}
                loading={loading}
                searchError={searchError}
                suggestions={suggestions}
                highlight={highlight}
                setHighlight={setHighlight}
                onPick={addItem}
                allowRawIdAdd={allowRawIdAdd}
              />
            ) : null}
          </div>
        )
      ) : (
        <>
          {selected.length > 0 ? (
            <div className="mb-2 flex flex-wrap items-center gap-2">
              {selected.map((item) => (
                <span
                  key={item.id}
                  className="inline-flex h-[30px] max-w-full items-center gap-1.5 rounded-full border border-[#1aa054] bg-[#e8f7ed] px-2.5 text-[12px] font-bold text-[#147940]"
                  title={item.id}
                >
                  <span className="truncate">{item.label}</span>
                  <button
                    type="button"
                    aria-label={`Remove ${item.label}`}
                    disabled={disabled}
                    onClick={() => removeItem(item.id)}
                    className="grid h-4 w-4 place-items-center rounded-full text-[#147940] hover:bg-[#d8f0e0]"
                  >
                    <X size={11} strokeWidth={2.4} />
                  </button>
                </span>
              ))}
            </div>
          ) : null}

          {!atCapacity ? (
            <div className="relative max-w-[420px]">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  className={cn(inputClass, 'max-w-[320px]')}
                  value={query}
                  disabled={disabled}
                  placeholder={placeholder}
                  role="combobox"
                  aria-expanded={open}
                  aria-controls={listId}
                  aria-autocomplete="list"
                  onChange={(event) => {
                    setQuery(event.target.value)
                    setOpen(true)
                  }}
                  onFocus={() => {
                    if (minQueryLength === 0 || suggestions.length) setOpen(true)
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'ArrowDown') {
                      event.preventDefault()
                      if (!suggestions.length) return
                      setOpen(true)
                      setHighlight((prev) => (prev + 1) % suggestions.length)
                      return
                    }
                    if (event.key === 'ArrowUp') {
                      event.preventDefault()
                      if (!suggestions.length) return
                      setOpen(true)
                      setHighlight((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1))
                      return
                    }
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      if (open && highlight >= 0 && suggestions[highlight]) {
                        addItem(suggestions[highlight])
                        return
                      }
                      addRawId()
                      return
                    }
                    if (event.key === 'Escape') {
                      setOpen(false)
                      setHighlight(-1)
                    }
                  }}
                />
                {allowRawIdAdd ? (
                  <button
                    type="button"
                    disabled={disabled || !String(query || '').trim()}
                    onClick={addRawId}
                    className="inline-flex h-[40px] items-center gap-1 rounded-full border border-[#1aa054] bg-white px-3 text-[12px] font-bold text-[#1aa054] hover:bg-[#e8f7ed] disabled:opacity-60"
                  >
                    <Plus size={13} strokeWidth={2.4} />
                    Add
                  </button>
                ) : null}
              </div>

              {open && String(query || '').trim().length >= minQueryLength ? (
                <SuggestionList
                  listId={listId}
                  loading={loading}
                  searchError={searchError}
                  suggestions={suggestions}
                  highlight={highlight}
                  setHighlight={setHighlight}
                  onPick={addItem}
                  allowRawIdAdd={allowRawIdAdd}
                />
              ) : null}
            </div>
          ) : null}
        </>
      )}

      {helperText ? <p className="mt-1 text-[11.5px] text-[#8a948e]">{helperText}</p> : null}
    </div>
  )
}

function SuggestionList({
  listId,
  loading,
  searchError,
  suggestions,
  highlight,
  setHighlight,
  onPick,
  allowRawIdAdd,
}) {
  return (
    <ul
      id={listId}
      role="listbox"
      className="absolute z-20 mt-1 max-h-[220px] w-full overflow-auto rounded-[10px] border border-[#e4e8e4] bg-white py-1 shadow-[0_8px_24px_rgba(20,40,28,.12)]"
    >
      {loading ? (
        <li className="px-3 py-2 text-[12.5px] text-[#7c8780]">Searching…</li>
      ) : searchError ? (
        <li className="px-3 py-2 text-[12.5px] text-[#b42318]">{searchError}</li>
      ) : suggestions.length === 0 ? (
        <li className="px-3 py-2 text-[12.5px] text-[#7c8780]">
          No matches.
          {allowRawIdAdd ? ' Press Enter to use this as an id.' : ''}
        </li>
      ) : (
        suggestions.map((item, index) => (
          <li key={item.id} role="option" aria-selected={index === highlight}>
            <button
              type="button"
              className={cn(
                'flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left transition',
                index === highlight ? 'bg-[#e8f7ed]' : 'hover:bg-[#f6f8f6]',
              )}
              onMouseEnter={() => setHighlight(index)}
              onClick={() => onPick(item)}
            >
              <span className="text-[13px] font-semibold text-[#17231c]">{item.label}</span>
              {item.meta ? (
                <span className="text-[11.5px] text-[#7c8780]">{item.meta}</span>
              ) : null}
            </button>
          </li>
        ))
      )}
    </ul>
  )
}
