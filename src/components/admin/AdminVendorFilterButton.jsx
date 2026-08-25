import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown, Search } from 'lucide-react'
import { Button } from './Button'
import { cn } from './cn'
import { adminVendorService } from '../../services/admin/vendorService'

/**
 * Searchable multi-select vendor filter for Live / mode boards.
 * All vendors (empty selection), one vendor, or many.
 */
export function AdminVendorFilterButton({
  selectedIds = [],
  onChange,
  extraVendors = [],
  variant = 'button',
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [remoteVendors, setRemoteVendors] = useState([])
  const rootRef = useRef(null)

  useEffect(() => {
    function onDocMouseDown(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocMouseDown)
    return () => document.removeEventListener('mousedown', onDocMouseDown)
  }, [])

  useEffect(() => {
    if (!open) return undefined
    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      setLoading(true)
      try {
        const response = await adminVendorService.listVendors({
          search: query,
          status: 'All',
          limit: 40,
          page: 1,
          sort: 'newest',
          signal: controller.signal,
        })
        if (controller.signal.aborted) return
        const rows = Array.isArray(response?.data?.rows) ? response.data.rows : []
        setRemoteVendors(
          rows.map((row) => ({ id: String(row.id), name: String(row.name || row.displayCode || row.id) })),
        )
      } catch {
        if (!controller.signal.aborted) setRemoteVendors([])
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }, 220)
    return () => {
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [open, query])

  const vendors = useMemo(() => {
    const map = new Map()
    for (const vendor of [...extraVendors, ...remoteVendors]) {
      if (!vendor?.id) continue
      map.set(String(vendor.id), { id: String(vendor.id), name: String(vendor.name || vendor.id) })
    }
    const term = query.trim().toLowerCase()
    const list = [...map.values()]
    if (!term) return list
    return list.filter((vendor) => vendor.name.toLowerCase().includes(term) || vendor.id.toLowerCase().includes(term))
  }, [extraVendors, remoteVendors, query])

  const selected = Array.isArray(selectedIds) ? selectedIds.map(String) : []
  const selectedSet = new Set(selected)

  const label = selected.length === 0
    ? 'All'
    : selected.length === 1
      ? (vendors.find((vendor) => vendor.id === selected[0])?.name
        || extraVendors.find((vendor) => String(vendor.id) === selected[0])?.name
        || '1 vendor')
      : `${selected.length} selected`

  const isPill = variant === 'pill'

  function toggleVendor(id) {
    const next = selectedSet.has(id)
      ? selected.filter((item) => item !== id)
      : [...selected, id]
    onChange?.(next)
  }

  return (
    <div ref={rootRef} className="relative">
      {isPill ? (
        <button
          type="button"
          className="h-[31px] rounded-full border border-[#dfe4e0] bg-white px-3 text-[10px] text-[#59655e]"
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
          aria-haspopup="listbox"
        >
          Vendor · <b>{label}</b>
          <ChevronDown size={11} className="ml-1 inline-block align-[-1px] text-[#7a857e]" aria-hidden />
        </button>
      ) : (
        <Button
          type="button"
          className="h-[31px] px-3"
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
          aria-haspopup="listbox"
        >
          {selected.length === 0 ? 'All vendors' : label}
          <ChevronDown size={12} strokeWidth={2.2} className="shrink-0" aria-hidden />
        </Button>
      )}
      {open ? (
        <div className={cn(
          'absolute z-50 mt-1 w-[260px] overflow-hidden rounded-md border border-[#e1e5e2] bg-white shadow-[0_10px_26px_rgba(20,30,24,.16)]',
          isPill ? 'left-0' : 'right-0',
        )}>
          <label className="flex h-[34px] items-center gap-2 border-b border-[#edf0ee] px-2.5">
            <Search size={12} className="text-[#8a948e]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="min-w-0 flex-1 border-0 bg-transparent text-[11px] outline-none"
              placeholder="Search vendors…"
              autoFocus
            />
          </label>
          <div className="max-h-[240px] overflow-y-auto py-1">
            <button
              type="button"
              onClick={() => onChange?.([])}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12px] hover:bg-[#f5f8f6]"
            >
              <span className={cn(
                'grid h-3.5 w-3.5 place-items-center rounded-sm border',
                selected.length === 0 ? 'border-[#118446] bg-[#118446] text-white' : 'border-[#c5cdc7]',
              )}>
                {selected.length === 0 ? <Check size={10} strokeWidth={3} /> : null}
              </span>
              All vendors
            </button>
            {loading ? <p className="px-3 py-2 text-[11px] text-[#78837c]">Loading…</p> : null}
            {!loading && vendors.length === 0 ? (
              <p className="px-3 py-2 text-[11px] text-[#78837c]">No vendors found.</p>
            ) : null}
            {vendors.map((vendor) => {
              const checked = selectedSet.has(vendor.id)
              return (
                <button
                  key={vendor.id}
                  type="button"
                  onClick={() => toggleVendor(vendor.id)}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12px] hover:bg-[#f5f8f6]"
                >
                  <span className={cn(
                    'grid h-3.5 w-3.5 place-items-center rounded-sm border',
                    checked ? 'border-[#118446] bg-[#118446] text-white' : 'border-[#c5cdc7]',
                  )}>
                    {checked ? <Check size={10} strokeWidth={3} /> : null}
                  </span>
                  <span className="min-w-0 truncate">{vendor.name}</span>
                </button>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}
