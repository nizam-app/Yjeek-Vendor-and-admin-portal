import { useEffect, useMemo, useRef, useState } from 'react'
import { Bell, ChevronDown, Search } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAdminShell } from '../../context/AdminShellContext'
import { adminSearchService } from '../../services/admin/searchService'
import { ADMIN_REGION_OPTIONS, adminRegionLabel } from '../../lib/adminRegions'
import { cn } from './cn'

function relativeTime(iso) {
  if (!iso) return ''
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''
  const mins = Math.floor((Date.now() - then) / 60000)
  if (mins < 1) return 'now'
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 48) return `${hours}h`
  return `${Math.floor(hours / 24)}d`
}

function parseOrderIdFromHint(hint) {
  const match = String(hint || '').match(/\/orders\/([^/?#]+)/)
  return match ? decodeURIComponent(match[1]) : null
}

function parseVendorIdFromHint(hint) {
  const match = String(hint || '').match(/\/vendors\/([^/?#]+)/)
  return match ? decodeURIComponent(match[1]) : null
}

export function AdminTopbarTools() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { region, setRegion, setMapFocus } = useAdminShell()

  const [regionOpen, setRegionOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [results, setResults] = useState([])
  const [bellOpen, setBellOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [notifLoading, setNotifLoading] = useState(false)

  const regionRef = useRef(null)
  const searchRef = useRef(null)
  const bellRef = useRef(null)

  useEffect(() => {
    function onDocMouseDown(event) {
      if (!regionRef.current?.contains(event.target)) setRegionOpen(false)
      if (!searchRef.current?.contains(event.target)) setSearchOpen(false)
      if (!bellRef.current?.contains(event.target)) setBellOpen(false)
    }
    document.addEventListener('mousedown', onDocMouseDown)
    return () => document.removeEventListener('mousedown', onDocMouseDown)
  }, [])

  useEffect(() => {
    const term = query.trim()
    if (term.length < 2) {
      setResults([])
      setSearchError('')
      setSearchLoading(false)
      return undefined
    }

    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      setSearchLoading(true)
      setSearchError('')
      try {
        const response = await adminSearchService.search({ q: term, limit: 8, signal: controller.signal })
        if (controller.signal.aborted) return
        setResults(response?.data?.items || [])
        setSearchOpen(true)
      } catch (err) {
        if (controller.signal.aborted) return
        setResults([])
        setSearchError(err?.message || 'Search failed.')
        setSearchOpen(true)
      } finally {
        if (!controller.signal.aborted) setSearchLoading(false)
      }
    }, 280)

    return () => {
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [query])

  async function loadNotifications() {
    setNotifLoading(true)
    try {
      const response = await adminSearchService.listNotifications()
      setNotifications(response?.data?.items || [])
    } catch {
      setNotifications([])
    } finally {
      setNotifLoading(false)
    }
  }

  useEffect(() => {
    loadNotifications()
    const id = window.setInterval(loadNotifications, 30000)
    return () => window.clearInterval(id)
  }, [])

  function goToDashboardIfNeeded() {
    if (!pathname.startsWith('/admin/dashboard')) {
      navigate('/admin/dashboard')
    }
  }

  function selectSearchItem(item) {
    setSearchOpen(false)
    setQuery(item.label)

    if (item.type === 'customer') {
      navigate(`/admin/customers/${encodeURIComponent(item.id)}`)
      return
    }

    goToDashboardIfNeeded()
    setMapFocus({
      type: item.type,
      id: item.id,
      label: item.label,
      subtitle: item.subtitle,
    })
  }

  function selectNotification(item) {
    setBellOpen(false)
    const orderId = parseOrderIdFromHint(item.linkHint)
    const vendorId = parseVendorIdFromHint(item.linkHint)

    if (item.kind === 'incident') {
      goToDashboardIfNeeded()
      setMapFocus({
        type: 'incident',
        id: item.id,
        orderId,
        label: item.title,
      })
      return
    }

    if (vendorId) {
      navigate(`/admin/vendors/${encodeURIComponent(vendorId)}`)
      return
    }
    if (orderId) {
      goToDashboardIfNeeded()
      setMapFocus({ type: 'order', id: orderId, label: item.title })
    }
  }

  const grouped = useMemo(() => {
    const groups = []
    for (const item of results) {
      const last = groups[groups.length - 1]
      if (!last || last.label !== item.group) groups.push({ label: item.group, items: [item] })
      else last.items.push(item)
    }
    return groups
  }, [results])

  return (
    <div className="flex items-center gap-2">
      <div ref={regionRef} className="relative">
        <button
          type="button"
          onClick={() => {
            setRegionOpen((open) => !open)
            setSearchOpen(false)
            setBellOpen(false)
          }}
          aria-haspopup="listbox"
          aria-expanded={regionOpen}
          className="flex h-[25px] items-center gap-1 rounded-md border border-[#dfe4e0] px-2 text-[12px] text-[#536158] hover:bg-[#f6f7f6]"
        >
          <span>🌍</span>
          {adminRegionLabel(region)}
          <ChevronDown size={10} />
        </button>
        {regionOpen ? (
          <ul
            role="listbox"
            className="absolute right-0 z-40 mt-1 min-w-[210px] overflow-hidden rounded-md border border-[#e1e5e2] bg-white py-1 shadow-[0_10px_26px_rgba(20,30,24,.16)]"
          >
            {ADMIN_REGION_OPTIONS.map((option) => (
              <li key={option.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={region === option.value}
                  onClick={() => {
                    setRegion(option.value)
                    setRegionOpen(false)
                  }}
                  className={cn(
                    'flex w-full px-3 py-1.5 text-left text-[12px] hover:bg-[#f5f8f6]',
                    region === option.value ? 'font-medium text-[#14763f]' : 'text-[#3a4540]',
                  )}
                >
                  {option.label}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div ref={searchRef} className="relative max-[700px]:hidden">
        <label className="flex h-[27px] w-[220px] items-center gap-2 rounded-md bg-[#f6f7f6] px-2.5">
          <Search size={13} className="text-[#89938c]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => {
              if (results.length || searchError) setSearchOpen(true)
            }}
            className="min-w-0 flex-1 border-0 bg-transparent text-[12px] outline-none"
            placeholder="Search orders, vendors, champs…"
            aria-label="Search orders, vendors, champs"
          />
        </label>
        {searchOpen ? (
          <div className="absolute right-0 z-40 mt-1 w-[280px] overflow-hidden rounded-md border border-[#e1e5e2] bg-white shadow-[0_10px_26px_rgba(20,30,24,.16)]">
            {searchLoading ? (
              <p className="px-3 py-2 text-[11px] text-[#78837c]">Searching…</p>
            ) : searchError ? (
              <p className="px-3 py-2 text-[11px] text-[#a15b58]">{searchError}</p>
            ) : results.length === 0 ? (
              <p className="px-3 py-2 text-[11px] text-[#78837c]">
                {query.trim().length < 2 ? 'Type at least 2 characters.' : 'No matching records.'}
              </p>
            ) : (
              grouped.map((group) => (
                <div key={group.label}>
                  <p className="bg-[#f5f6f7] px-3 py-1 text-[9px] font-bold uppercase tracking-wide text-[#929ba6]">
                    {group.label}
                  </p>
                  {group.items.map((item) => (
                    <button
                      key={`${item.type}-${item.id}`}
                      type="button"
                      onClick={() => selectSearchItem(item)}
                      className="flex w-full flex-col px-3 py-1.5 text-left hover:bg-[#f5f8f6]"
                    >
                      <span className="truncate text-[12px] font-medium text-[#202722]">{item.label}</span>
                      {item.subtitle ? (
                        <span className="truncate text-[10px] text-[#77827b]">{item.subtitle}</span>
                      ) : null}
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        ) : null}
      </div>

      <div ref={bellRef} className="relative">
        <button
          type="button"
          onClick={() => {
            const next = !bellOpen
            setBellOpen(next)
            setRegionOpen(false)
            setSearchOpen(false)
            if (next) loadNotifications()
          }}
          aria-label="Notifications"
          aria-expanded={bellOpen}
          className="relative grid h-7 w-7 place-items-center rounded-md hover:bg-[#f3f6f4]"
        >
          <Bell size={15} strokeWidth={1.7} />
          {notifications.length ? (
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#e14b42]" />
          ) : null}
        </button>
        {bellOpen ? (
          <div className="absolute right-0 z-40 mt-1 w-[300px] overflow-hidden rounded-md border border-[#e1e5e2] bg-white shadow-[0_10px_26px_rgba(20,30,24,.16)]">
            <div className="border-b border-[#edf0ee] px-3 py-2 text-[12px] font-bold">Notifications</div>
            <div className="max-h-[320px] overflow-y-auto">
              {notifLoading && !notifications.length ? (
                <p className="px-3 py-3 text-[11px] text-[#78837c]">Loading…</p>
              ) : notifications.length === 0 ? (
                <p className="px-3 py-3 text-[11px] text-[#78837c]">No open alerts.</p>
              ) : (
                notifications.map((item) => (
                  <button
                    key={`${item.kind}-${item.id}`}
                    type="button"
                    onClick={() => selectNotification(item)}
                    className="flex w-full flex-col border-b border-[#f0f2f0] px-3 py-2 text-left last:border-0 hover:bg-[#f5f8f6]"
                  >
                    <span className="flex items-center gap-2">
                      {item.priority ? (
                        <span className="rounded bg-[#fdebec] px-1.5 text-[9px] font-medium text-[#d64044]">
                          {item.priority}
                        </span>
                      ) : null}
                      <span className="truncate text-[12px] font-medium text-[#202722]">{item.title}</span>
                    </span>
                    <span className="mt-0.5 truncate text-[10px] text-[#77827b]">
                      {item.kind === 'incident' ? 'Incident' : 'Vendor flag'}
                      {item.createdAt ? ` · ${relativeTime(item.createdAt)}` : ''}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
