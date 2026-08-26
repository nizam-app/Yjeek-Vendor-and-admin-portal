import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, Bell, ChevronDown, Flag, RefreshCw, Search } from 'lucide-react'
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
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 48) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function parseOrderIdFromHint(hint) {
  const match = String(hint || '').match(/\/orders\/([^/?#]+)/)
  return match ? decodeURIComponent(match[1]) : null
}

function parseVendorIdFromHint(hint) {
  const match = String(hint || '').match(/\/vendors\/([^/?#]+)/)
  return match ? decodeURIComponent(match[1]) : null
}

function priorityBadgeClass(priority) {
  const value = String(priority || '').toUpperCase()
  if (value === 'P1' || value === 'CRITICAL' || value === 'HIGH') {
    return 'bg-[#fdebec] text-[#d64044]'
  }
  if (value === 'P2' || value === 'MEDIUM') {
    return 'bg-[#fde8ef] text-[#c23a6b]'
  }
  if (value === 'P3' || value === 'LOW') {
    return 'bg-[#fff1e6] text-[#c46a1b]'
  }
  return 'bg-[#eef2f0] text-[#5f6b64]'
}

export function AdminTopbarTools() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { region, setRegion, setMapFocus, clearMapFocus } = useAdminShell()

  const [regionOpen, setRegionOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [results, setResults] = useState([])
  const [bellOpen, setBellOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [notifFilter, setNotifFilter] = useState('all')
  const [notifLoading, setNotifLoading] = useState(false)
  const [markingAll, setMarkingAll] = useState(false)

  const regionRef = useRef(null)
  const searchRef = useRef(null)
  const bellRef = useRef(null)
  const hasNotifCacheRef = useRef(false)
  const pendingReadKeysRef = useRef(new Set())

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.isRead).length,
    [notifications],
  )

  const visibleNotifications = useMemo(
    () =>
      notifFilter === 'unread'
        ? notifications.filter((item) => !item.isRead)
        : notifications,
    [notifications, notifFilter],
  )

  hasNotifCacheRef.current = notifications.length > 0

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

  async function fetchNotifications({ quiet = false } = {}) {
    if (!quiet) setNotifLoading(true)
    try {
      // Always load the full feed so the bell badge is available before open.
      // Unread filtering is applied client-side from this same payload.
      const response = await adminSearchService.listNotifications({ filter: 'all' })
      const incoming = response?.data?.items || []
      setNotifications(
        incoming.map((item) => {
          const key = `${item.kind}:${item.id}`
          if (!item.isRead && pendingReadKeysRef.current.has(key)) {
            return { ...item, isRead: true }
          }
          if (item.isRead) pendingReadKeysRef.current.delete(key)
          return item
        }),
      )
    } catch {
      if (!quiet) setNotifications([])
    } finally {
      if (!quiet) setNotifLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setNotifLoading(true)
      try {
        const response = await adminSearchService.listNotifications({ filter: 'all' })
        if (cancelled) return
        setNotifications(response?.data?.items || [])
      } catch {
        if (!cancelled) setNotifications([])
      } finally {
        if (!cancelled) setNotifLoading(false)
      }
    })()

    const id = window.setInterval(() => {
      void fetchNotifications({ quiet: true })
    }, 30000)

    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [])

  useEffect(() => {
    if (!bellOpen) return
    // Soft refresh when opening — keep existing rows visible while updating.
    void fetchNotifications({ quiet: hasNotifCacheRef.current })
  }, [bellOpen])

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

  async function markItemRead(item) {
    if (item.isRead) return
    const key = `${item.kind}:${item.id}`
    pendingReadKeysRef.current.add(key)
    setNotifications((prev) =>
      prev.map((row) =>
        row.id === item.id && row.kind === item.kind ? { ...row, isRead: true } : row,
      ),
    )
    try {
      await adminSearchService.markNotificationRead({ kind: item.kind, id: item.id })
      pendingReadKeysRef.current.delete(key)
    } catch (err) {
      console.warn('[admin] mark notification read failed', err?.message || err)
      pendingReadKeysRef.current.delete(key)
      setNotifications((prev) =>
        prev.map((row) =>
          row.id === item.id && row.kind === item.kind ? { ...row, isRead: false } : row,
        ),
      )
    }
  }

  async function selectNotification(item) {
    // Fire-and-forget mark so navigation isn't blocked; state stays optimistic unless API fails.
    void markItemRead(item)
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

  async function handleMarkAllRead() {
    if (!unreadCount || markingAll) return
    setMarkingAll(true)
    const previous = notifications
    const pendingKeys = previous.filter((row) => !row.isRead).map((row) => `${row.kind}:${row.id}`)
    pendingKeys.forEach((key) => pendingReadKeysRef.current.add(key))
    setNotifications((prev) => prev.map((row) => ({ ...row, isRead: true })))
    try {
      await adminSearchService.markAllNotificationsRead()
      pendingKeys.forEach((key) => pendingReadKeysRef.current.delete(key))
    } catch (err) {
      console.warn('[admin] mark all notifications read failed', err?.message || err)
      pendingKeys.forEach((key) => pendingReadKeysRef.current.delete(key))
      setNotifications(previous)
    } finally {
      setMarkingAll(false)
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

  const badgeLabel = unreadCount > 99 ? '99+' : String(unreadCount)

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
            onFocus={(event) => {
              // Drop map pin focus so InfoWindow ✕ cannot steal the caret from search.
              clearMapFocus()
              event.target.select()
              if (results.length || searchError || query.trim().length >= 2) setSearchOpen(true)
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
          }}
          aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : 'Notifications'}
          aria-expanded={bellOpen}
          className="relative grid h-7 w-7 place-items-center rounded-md hover:bg-[#f3f6f4]"
        >
          <Bell size={15} strokeWidth={1.7} />
          {unreadCount > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 grid min-h-[15px] min-w-[15px] place-items-center rounded-full bg-[#d92d35] px-1 text-[9px] font-semibold leading-none text-white">
              {badgeLabel}
            </span>
          ) : null}
        </button>
        {bellOpen ? (
          <div className="absolute right-0 z-40 mt-1.5 w-[380px] overflow-hidden rounded-xl border border-[#e6ebe8] bg-white shadow-[0_12px_40px_rgba(20,30,24,.14)]">
            <div className="flex items-center justify-between gap-2 px-3.5 pb-1 pt-3">
              <p className="text-[14px] font-semibold tracking-[-0.01em] text-[#17231c]">Notifications</p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void fetchNotifications({ quiet: hasNotifCacheRef.current })}
                  disabled={notifLoading}
                  aria-label="Refresh notifications"
                  className="grid h-7 w-7 place-items-center rounded-md text-[#8a948d] hover:bg-[#f3f5f4] hover:text-[#536158] disabled:opacity-50"
                >
                  <RefreshCw size={14} className={cn(notifLoading && 'animate-spin')} />
                </button>
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  disabled={!unreadCount || markingAll}
                  className={cn(
                    'shrink-0 text-[11px] font-medium underline-offset-2',
                    unreadCount && !markingAll
                      ? 'text-[#14763f] hover:underline'
                      : 'cursor-default text-[#a3aaa5]',
                  )}
                >
                  {markingAll ? 'Marking…' : 'Mark all as read'}
                </button>
              </div>
            </div>

            <div className="px-3.5 pb-2.5 pt-1">
              <div className="flex gap-1 rounded-lg bg-[#f3f5f4] p-1">
                {[
                  { id: 'all', label: 'All', count: notifications.length },
                  { id: 'unread', label: 'Unread', count: unreadCount },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setNotifFilter(tab.id)}
                    className={cn(
                      'flex flex-1 items-center justify-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-colors',
                      notifFilter === tab.id
                        ? 'bg-white text-[#17231c] shadow-[0_1px_2px_rgba(20,30,24,.08)]'
                        : 'text-[#6b756e] hover:text-[#3a4540]',
                    )}
                  >
                    {tab.label}
                    <span
                      className={cn(
                        'rounded-full px-1.5 py-px text-[10px] font-semibold tabular-nums',
                        notifFilter === tab.id
                          ? 'bg-[#eef2f0] text-[#536158]'
                          : 'bg-[#e5e9e6] text-[#7a847d]',
                      )}
                    >
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="max-h-[440px] space-y-2 overflow-y-auto bg-[#f7f8f7] px-3 pb-3 pt-1">
              {notifLoading && !visibleNotifications.length ? (
                <p className="rounded-lg border border-[#e8ece9] bg-white px-3 py-4 text-center text-[11px] text-[#78837c]">
                  Loading…
                </p>
              ) : visibleNotifications.length === 0 ? (
                <p className="rounded-lg border border-[#e8ece9] bg-white px-3 py-4 text-center text-[11px] text-[#78837c]">
                  {notifFilter === 'unread' ? 'You’re all caught up.' : 'No open alerts.'}
                </p>
              ) : (
                visibleNotifications.map((item) => {
                  const kindLabel = item.kind === 'incident' ? 'Incident' : 'Vendor flag'
                  const Icon = item.kind === 'incident' ? AlertTriangle : Flag
                  return (
                    <button
                      key={`${item.kind}-${item.id}`}
                      type="button"
                      onClick={() => selectNotification(item)}
                      className={cn(
                        'flex w-full gap-2.5 rounded-lg border bg-white px-3 py-2.5 text-left transition-colors hover:border-[#cfd8d2]',
                        item.isRead ? 'border-[#e8ece9]' : 'border-[#d7e6dc]',
                      )}
                    >
                      <span
                        className={cn(
                          'mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full',
                          item.kind === 'incident' ? 'bg-[#e8f5ee] text-[#14763f]' : 'bg-[#fff1e6] text-[#c46a1b]',
                        )}
                      >
                        <Icon size={14} strokeWidth={2} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className={cn(
                            'line-clamp-2 text-[12px] leading-[1.35] text-[#17231c]',
                            item.isRead ? 'font-normal' : 'font-semibold',
                          )}
                        >
                          {item.title}
                        </span>
                        <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          <span className="inline-flex items-center rounded-full bg-[#eef2f0] px-1.5 py-0.5 text-[9px] font-medium text-[#5f6b64]">
                            {kindLabel}
                          </span>
                          {item.priority ? (
                            <span
                              className={cn(
                                'inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-medium',
                                priorityBadgeClass(item.priority),
                              )}
                            >
                              {item.priority}
                            </span>
                          ) : null}
                        </span>
                        {item.createdAt ? (
                          <span className="mt-1.5 block text-[10px] text-[#8a948d]">
                            {relativeTime(item.createdAt)}
                          </span>
                        ) : null}
                      </span>
                    </button>
                  )
                })
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
