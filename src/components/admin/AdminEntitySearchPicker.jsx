import { useEffect, useId, useRef, useState } from 'react'
import { Plus, X } from 'lucide-react'
import { cn } from './cn'

const labelClass = 'mb-1.5 block text-[12px] font-medium text-[#7c8780]'
const inputClass =
  'box-border h-[40px] w-full rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white px-3 text-[13px] text-[#17231c] outline-none transition placeholder:text-[#9aa49d] focus:border-[#1aa054]'

/**
 * Multi-select search picker: type a name → suggestions → chip with real id.
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
}) {
  const listId = useId()
  const rootRef = useRef(null)
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [highlight, setHighlight] = useState(-1)

  const selectedIds = new Set(selected.map((item) => item.id))

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
    const term = String(query || '').trim()
    if (term.length < 2) {
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
        setOpen(true)
        setHighlight(next.length ? 0 : -1)
      } catch (err) {
        if (controller.signal.aborted) return
        setSuggestions([])
        setSearchError(err?.message || 'Search failed.')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }, 300)

    return () => {
      controller.abort()
      window.clearTimeout(timer)
    }
    // selectedIds content changes when chips change — intentional.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, searchFn, selected])

  function addItem(item) {
    if (!item?.id) return
    const id = String(item.id)
    if (selectedIds.has(id)) return
    onChange([
      ...selected,
      {
        id,
        label: String(item.label || id),
        ...(item.meta ? { meta: String(item.meta) } : {}),
      },
    ])
    setQuery('')
    setSuggestions([])
    setOpen(false)
    setHighlight(-1)
  }

  function removeItem(id) {
    onChange(selected.filter((item) => item.id !== id))
  }

  function addRawId() {
    if (!allowRawIdAdd) return
    const id = String(query || '').trim()
    if (!id) return
    addItem({ id, label: id })
  }

  return (
    <div ref={rootRef} className="mt-4 space-y-2">
      <p className={labelClass}>{label}</p>
      <div className="flex flex-wrap items-center gap-2">
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
              if (suggestions.length) setOpen(true)
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

        {open && String(query || '').trim().length >= 2 ? (
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
                No matches. {allowRawIdAdd ? 'You can still Add a raw id.' : null}
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
                    onClick={() => addItem(item)}
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
        ) : null}
      </div>

      {helperText ? <p className="text-[11.5px] text-[#8a948e]">{helperText}</p> : null}
    </div>
  )
}
