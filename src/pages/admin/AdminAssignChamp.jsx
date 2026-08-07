import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Bike, Car, Check, ChevronDown, Lock, Search, Star } from 'lucide-react'
import { ApiState } from '../../components/admin/ApiState'
import { isAdminRealApiFeature } from '../../api/config'
import { ApiError, formatApiErrorMessage } from '../../api/errors'
import { adminOrderService } from '../../services/admin/orderService'
import { useAdminOrderDetail } from '../../hooks/admin/useAdminOrderDetail'
import { useAdminOrderActionOptions } from '../../hooks/admin/useAdminOrderActionOptions'

const cn = (...parts) => parts.filter(Boolean).join(' ')

const FALLBACK_DATES = [
  { id: 'today', label: 'Today' },
  { id: 'tomorrow', label: 'Tomorrow' },
  { id: 'day-2', label: '+2 days' },
  { id: 'day-3', label: '+3 days' },
  { id: 'day-4', label: '+4 days' },
]

const FALLBACK_WINDOWS = ['10–12 PM', '12–2 PM', '2–4 PM', '4–6 PM', '6–8 PM']

const SORT_OPTIONS = [
  { id: 'nearest', label: 'Nearest' },
  { id: 'rating', label: 'Top rated' },
  { id: 'load', label: 'Lightest load' },
  { id: 'name', label: 'Name A–Z' },
]

const ALLOWED_OPTIONS = [
  { id: 'yes', label: 'Allowed' },
  { id: 'no', label: 'Not allowed' },
]

function uniqueOptionList(champs, key) {
  const seen = new Map()
  for (const champ of champs) {
    const raw = champ?.[key]
    if (raw == null || raw === '') continue
    const id = String(raw)
    if (!seen.has(id)) seen.set(id, { id, label: id })
  }
  return Array.from(seen.values()).sort((a, b) => a.label.localeCompare(b.label))
}

function tierClass(tier) {
  if (tier === 'Gold' || tier === 'GOLD') return 'bg-[#fff3d6] text-[#9a6d12]'
  if (tier === 'Elite' || tier === 'ELITE') return 'bg-[#eee8ff] text-[#734dbf]'
  return 'bg-[#eff2f0] text-[#667069]'
}

function dash(value) {
  if (value == null || value === '') return '—'
  return value
}

function formatDistance(distanceKm) {
  if (distanceKm == null || distanceKm === '') return '—'
  const n = Number(distanceKm)
  if (Number.isNaN(n)) return String(distanceKm)
  return `${n} km`
}

function buildOrderHeader(order, fallbackId) {
  if (!order) {
    return {
      displayId: fallbackId ? `#${fallbackId}` : '—',
      store: '—',
      place: '—',
      type: '—',
      destination: '—',
      windowNote: 'delivery window from order',
    }
  }

  const dropoff = order.summaryRows?.find(([label]) => label === 'Drop-off')?.[1] || '—'
  const pickup = order.summaryRows?.find(([label]) => label === 'Pickup')?.[1] || '—'
  const type = order.orderType
    ? String(order.orderType).replace(/_/g, ' ')
    : order.category && order.category !== '—'
      ? order.category
      : order.fulfillmentLabel || '—'

  return {
    displayId: order.orderNumber ? `#${order.orderNumber}` : order.id || `#${fallbackId}`,
    store: order.vendor?.name && order.vendor.name !== '—' ? order.vendor.name : 'Vendor',
    place: dropoff !== '—' ? dropoff : pickup,
    type,
    destination: dropoff,
    windowNote: type !== '—' ? String(type) : 'order delivery window',
  }
}

function LockedField({ label, value }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-medium text-[#6f7973]">{label}</span>
      <span className="flex h-[38px] items-center justify-between gap-2 rounded-[8px] border border-[#e4e8e4] bg-[#f6f7f6] px-3 text-[12px] font-medium text-[#455249]">
        <span className="truncate">{value}</span>
        <Lock size={13} className="shrink-0 text-[#c9a227]" />
      </span>
    </label>
  )
}

function SelectField({ label, value, options, onChange, disabled = false }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-medium text-[#6f7973]">{label}</span>
      <span className="relative block">
        <select
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className="h-[38px] w-full appearance-none rounded-[8px] border border-[#dfe4e0] bg-white px-3 pr-9 text-[12px] font-medium text-[#17231c] outline-none transition focus:border-[#19ad5b] focus:ring-2 focus:ring-[#19ad5b]/15 disabled:bg-[#f6f7f6] disabled:text-[#8a948e]"
        >
          {options.map((option) => (
            <option key={typeof option === 'string' ? option : option.id} value={typeof option === 'string' ? option : option.id}>
              {typeof option === 'string' ? option : option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={14}
          className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[#6f7973]"
          aria-hidden
        />
      </span>
    </label>
  )
}

/** Single-select pill dropdown used for champ filters / sort. */
function AssignFilterDropdown({
  title,
  items,
  value,
  onChange,
  open,
  onToggleOpen,
  allLabel = 'All',
  align = 'left',
  emptyHint = 'No options',
  allowClear = true,
  emphasize = undefined,
}) {
  const active = emphasize ?? (allowClear ? Boolean(value) : open)
  const selectedLabel = value
    ? (items.find((item) => item.id === value)?.label || value)
    : allLabel

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggleOpen}
        aria-expanded={open}
        className={cn(
          'inline-flex h-[30px] items-center gap-1 rounded-full border px-3 text-[11px] transition',
          (open || active) && 'border-[#b7e4c7] bg-[#e8f7ed] text-[#147940]',
          !open && !active && 'border-[#d7ddd8] bg-white text-[#455249] hover:bg-[#f7f9f7]',
        )}
      >
        <span className={cn('font-medium', open || active ? 'text-[#2f8f55]' : 'text-[#6a746e]')}>{title}</span>
        <span className={cn('max-w-[110px] truncate font-bold', open || active ? 'text-[#0f6b3a]' : 'text-[#17231c]')}>
          · {selectedLabel}
        </span>
        <ChevronDown size={12} className={cn('shrink-0 opacity-70 transition', open && 'rotate-180')} />
      </button>
      {open ? (
        <div
          className={cn(
            'absolute top-[36px] z-40 w-[220px] overflow-hidden rounded-[12px] border border-[#e2e6e3] bg-white shadow-[0_12px_32px_rgba(20,40,28,.16)]',
            align === 'right' ? 'right-0' : 'left-0',
          )}
        >
          <div className="max-h-[260px] space-y-0.5 overflow-y-auto p-1.5">
            {allowClear ? (
              <button
                type="button"
                onClick={() => onChange(null)}
                className={cn(
                  'flex w-full items-center gap-2 rounded-[8px] px-2.5 py-2 text-left transition',
                  !value ? 'bg-[#e8f7ed] text-[#147940]' : 'text-[#314039] hover:bg-[#f5f8f5]',
                )}
              >
                <span className={cn(
                  'grid h-[15px] w-[15px] shrink-0 place-items-center rounded-full border',
                  !value ? 'border-[#19ad5b] bg-[#19ad5b] text-white' : 'border-[#c5cdc7] bg-white',
                )}>
                  {!value ? <Check size={9} strokeWidth={3} /> : null}
                </span>
                <span className="text-[11px] font-semibold">{allLabel}</span>
              </button>
            ) : null}
            {items.length === 0 ? (
              <p className="px-2 py-3 text-center text-[11px] text-[#8a948e]">{emptyHint}</p>
            ) : (
              items.map((item) => {
                const selected = value === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onChange(item.id)}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-[8px] px-2.5 py-2 text-left transition',
                      selected ? 'bg-[#e8f7ed] text-[#147940]' : 'text-[#314039] hover:bg-[#f5f8f5]',
                    )}
                  >
                    <span className={cn(
                      'grid h-[15px] w-[15px] shrink-0 place-items-center rounded-full border',
                      selected ? 'border-[#19ad5b] bg-[#19ad5b] text-white' : 'border-[#c5cdc7] bg-white',
                    )}>
                      {selected ? <Check size={9} strokeWidth={3} /> : null}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[11px] font-semibold">{item.label}</span>
                  </button>
                )
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function ChampOrdersPopover({ champ, dateLabel, anchorRect, onMouseEnter, onMouseLeave }) {
  if (!anchorRect || typeof document === 'undefined') return null

  const left = Math.min(anchorRect.left, window.innerWidth - 376)
  const top = anchorRect.bottom + 6
  const active = champ.activeCount

  return createPortal(
    <div
      data-champ-popover
      className="fixed z-[9999] flex w-[360px] flex-col items-start gap-[9px] rounded-[12px] border-[1.2px] border-[#E0E3E0] bg-white px-[15px] py-[13px] shadow-[0px_8px_22px_rgba(0,0,0,0.18)]"
      style={{ left: Math.max(12, left), top }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="flex flex-col items-start gap-[2px]">
        <p className="text-[13px] font-bold leading-4 text-[#1C211F]">
          {champ.name || champ.id} — orders on {dateLabel}
        </p>
        <p className="text-[11px] font-normal leading-[13px] text-[#6B736E]">
          {active != null ? `${active} active order(s)` : 'No per-date order details available'}
        </p>
      </div>
      <p className="w-full rounded-[8px] border border-[#E0E3E0] bg-[#F6F7F6] px-3 py-2.5 text-[11px] text-[#6B736E]">
        {active != null
          ? `This champ currently has ${active} active order(s).`
          : 'No orders listed for this date.'}
      </p>
    </div>,
    document.body,
  )
}

export function AdminAssignChamp() {
  const navigate = useNavigate()
  const { orderId: rawId = '' } = useParams()
  const [searchParams] = useSearchParams()
  const orderKey = decodeURIComponent(rawId).replace(/^#/, '')
  const useReal = isAdminRealApiFeature('dashboard')

  const { data: order, error: orderError, isLoading: orderLoading, refetch: refetchOrder } = useAdminOrderDetail(orderKey)
  const { data: actionOptions } = useAdminOrderActionOptions()

  const [nearbyLoading, setNearbyLoading] = useState(false)
  const [nearbyError, setNearbyError] = useState(null)
  const [nearbyData, setNearbyData] = useState(null)
  const [selectedChamp, setSelectedChamp] = useState('')
  const [query, setQuery] = useState('')
  const [filterGov, setFilterGov] = useState(null)
  const [filterCity, setFilterCity] = useState(null)
  const [filterVehicle, setFilterVehicle] = useState(null)
  const [filterType, setFilterType] = useState(null)
  const [filterTier, setFilterTier] = useState(null)
  const [filterAllowed, setFilterAllowed] = useState(null)
  const [sortBy, setSortBy] = useState('nearest')
  const [openFilter, setOpenFilter] = useState(null)
  const filterBarRef = useRef(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  const initialDate = searchParams.get('day') || FALLBACK_DATES[0].id
  const initialWindow = searchParams.get('window') || FALLBACK_WINDOWS[2]
  const [deliveryDate, setDeliveryDate] = useState(
    FALLBACK_DATES.some((d) => d.id === initialDate) ? initialDate : FALLBACK_DATES[0].id,
  )
  const [timeWindow, setTimeWindow] = useState(
    FALLBACK_WINDOWS.includes(initialWindow) ? initialWindow : FALLBACK_WINDOWS[2],
  )

  const [hoverChamp, setHoverChamp] = useState(null)
  const [hoverRect, setHoverRect] = useState(null)
  const [pinnedChamp, setPinnedChamp] = useState(null)
  const hoverCloseTimer = useRef(null)

  const header = useMemo(() => buildOrderHeader(order, orderKey), [order, orderKey])
  const selectedDateLabel = FALLBACK_DATES.find((d) => d.id === deliveryDate)?.label || deliveryDate

  useEffect(() => {
    if (!useReal || !orderKey) {
      setNearbyData(null)
      setNearbyError(null)
      return undefined
    }

    let cancelled = false
    setNearbyLoading(true)
    setNearbyError(null)

    adminOrderService
      .getNearbyChamps(orderKey)
      .then((response) => {
        if (cancelled) return
        const data = response?.data || null
        setNearbyData(data)
        const first = data?.nearby?.[0]
        if (first?.id) setSelectedChamp(String(first.id))
        else setSelectedChamp('')
      })
      .catch((err) => {
        if (cancelled) return
        setNearbyError(formatApiErrorMessage(err, 'Failed to load nearby champs.'))
        setNearbyData(null)
        setSelectedChamp('')
      })
      .finally(() => {
        if (!cancelled) setNearbyLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [useReal, orderKey])

  const showPopover = (champId, el, { pin = false } = {}) => {
    if (hoverCloseTimer.current) {
      clearTimeout(hoverCloseTimer.current)
      hoverCloseTimer.current = null
    }
    const rect = el.getBoundingClientRect()
    setHoverChamp(champId)
    setHoverRect({
      left: rect.left,
      bottom: rect.bottom,
      top: rect.top,
      right: rect.right,
    })
    if (pin) setPinnedChamp(champId)
  }

  const keepPopoverOpen = () => {
    if (hoverCloseTimer.current) {
      clearTimeout(hoverCloseTimer.current)
      hoverCloseTimer.current = null
    }
  }

  const scheduleCloseHover = () => {
    if (pinnedChamp) return
    hoverCloseTimer.current = setTimeout(() => {
      setHoverChamp(null)
      setHoverRect(null)
    }, 120)
  }

  useEffect(() => () => {
    if (hoverCloseTimer.current) clearTimeout(hoverCloseTimer.current)
  }, [])

  useEffect(() => {
    if (!hoverChamp && !pinnedChamp) return undefined
    const onScroll = () => {
      setHoverChamp(null)
      setHoverRect(null)
      setPinnedChamp(null)
    }
    const onDocClick = (e) => {
      if (!pinnedChamp) return
      if (e.target.closest('[data-champ-popover]') || e.target.closest('[data-champ-name]')) return
      setPinnedChamp(null)
      setHoverChamp(null)
      setHoverRect(null)
    }
    window.addEventListener('scroll', onScroll, true)
    document.addEventListener('mousedown', onDocClick)
    return () => {
      window.removeEventListener('scroll', onScroll, true)
      document.removeEventListener('mousedown', onDocClick)
    }
  }, [hoverChamp, pinnedChamp])

  const champs = useMemo(() => {
    const list = nearbyData?.nearby || []
    const q = query.trim().toLowerCase()

    const mapped = list.map((champ) => {
      const loadCount = champ.activeCount
      const capacity = champ.capacity
      const load = loadCount != null && capacity != null
        ? `${loadCount} / ${capacity}`
        : loadCount != null
          ? String(loadCount)
          : '—'
      return {
        ...champ,
        displayCode: champ.code || champ.id,
        load,
        total: loadCount != null ? loadCount : '—',
        dist: formatDistance(champ.distanceKm),
      }
    })

    const filtered = mapped.filter((champ) => {
      if (filterGov && String(champ.gov || '') !== filterGov) return false
      if (filterCity && String(champ.city || '') !== filterCity) return false
      if (filterVehicle && String(champ.vehicle || '') !== filterVehicle) return false
      if (filterType && String(champ.type || '') !== filterType) return false
      if (filterTier && String(champ.tier || '') !== filterTier) return false
      if (filterAllowed === 'yes' && champ.allowed !== true) return false
      if (filterAllowed === 'no' && champ.allowed !== false) return false
      if (!q) return true
      return [champ.name, champ.id, champ.code, champ.city, champ.gov, champ.vehicle, champ.tier, champ.type]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q)
    })

    const distanceValue = (champ) => {
      const n = Number(champ.distanceKm)
      return Number.isFinite(n) ? n : Number.POSITIVE_INFINITY
    }
    const ratingValue = (champ) => {
      const n = Number(champ.rating)
      return Number.isFinite(n) ? n : -1
    }
    const loadValue = (champ) => {
      const n = Number(champ.activeCount)
      return Number.isFinite(n) ? n : Number.POSITIVE_INFINITY
    }

    filtered.sort((a, b) => {
      if (sortBy === 'rating') return ratingValue(b) - ratingValue(a)
      if (sortBy === 'load') return loadValue(a) - loadValue(b)
      if (sortBy === 'name') {
        return String(a.name || a.id).localeCompare(String(b.name || b.id))
      }
      return distanceValue(a) - distanceValue(b)
    })

    return filtered
  }, [
    nearbyData,
    query,
    filterGov,
    filterCity,
    filterVehicle,
    filterType,
    filterTier,
    filterAllowed,
    sortBy,
  ])

  const filterOptions = useMemo(() => {
    const source = nearbyData?.nearby || []
    const govScoped = filterGov
      ? source.filter((champ) => String(champ.gov || '') === filterGov)
      : source

    return {
      governorate: uniqueOptionList(source, 'gov'),
      city: uniqueOptionList(govScoped, 'city'),
      vehicle: uniqueOptionList(source, 'vehicle'),
      type: uniqueOptionList(source, 'type'),
      tier: uniqueOptionList(source, 'tier'),
      allowed: ALLOWED_OPTIONS,
      sort: SORT_OPTIONS,
    }
  }, [nearbyData, filterGov])

  useEffect(() => {
    if (!filterCity) return
    if (!filterOptions.city.some((item) => item.id === filterCity)) {
      setFilterCity(null)
    }
  }, [filterCity, filterOptions.city])

  useEffect(() => {
    if (!openFilter) return undefined
    const onDocClick = (event) => {
      if (filterBarRef.current?.contains(event.target)) return
      setOpenFilter(null)
    }
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpenFilter(null)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [openFilter])

  const toggleFilter = (key) => {
    setOpenFilter((current) => (current === key ? null : key))
  }

  const setFilterValue = (key, setter) => (next) => {
    setter(next)
    setOpenFilter(null)
  }

  const activePopoverId = pinnedChamp || hoverChamp
  const hoveredChamp = champs.find((champ) => champ.id === activePopoverId)

  async function handleConfirm() {
    if (!orderKey || submitting) return
    setSubmitError(null)
    setSubmitting(true)
    try {
      const driverId = String(selectedChamp || '').trim()
      if (!driverId) throw new ApiError({ message: 'Select a champ to assign.' })

      const reasonOptions = Array.isArray(actionOptions?.reassignReasons)
        ? actionOptions.reassignReasons.filter(Boolean)
        : []
      const reason = String(
        reasonOptions[0]
        || (nearbyData?.currentChamp ? 'Reassign champ' : 'Scheduled assignment'),
      )

      await adminOrderService.reassignChamp(orderKey, {
        driverId,
        reason,
        notifyCustomer: true,
      })
      navigate('/admin/scheduled')
    } catch (err) {
      setSubmitError(formatApiErrorMessage(err, 'Failed to assign champ.'))
    } finally {
      setSubmitting(false)
    }
  }

  if (!useReal) {
    return (
      <div className="p-7 text-[12px] text-[#78837c]">
        Assign champ requires the dashboard real-API feature. Enable <code>dashboard</code> in{' '}
        <code>VITE_ADMIN_REAL_API_FEATURES</code>.
      </div>
    )
  }

  if (!order && (orderLoading || orderError)) {
    return <ApiState isLoading={orderLoading} error={orderError} onRetry={refetchOrder} />
  }

  return (
    <div className="px-7 py-[18px] max-[700px]:p-4">
      <div className="flex flex-wrap items-start gap-3">
        <Link
          to="/admin/scheduled"
          className="inline-flex h-[34px] shrink-0 items-center gap-1.5 rounded-[8px] border border-[#dfe4e0] bg-white px-3 text-[12px] font-medium text-[#17231c] hover:bg-[#f7f9f7]"
        >
          <ArrowLeft size={14} /> Back
        </Link>
        <div className="min-w-0">
          <h2 className="text-[20px] font-bold tracking-[-0.02em] text-[#17231c]">Assign champ</h2>
          <p className="mt-1 text-[12px] text-[#6f7973]">
            Order {header.displayId} · {header.store} → {header.place} · {header.type}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <p className="mb-2 text-[11px] font-medium text-[#6f7973]">Action</p>
        <button type="button" className="inline-flex h-[32px] items-center rounded-[8px] border border-[#17231c] bg-white px-3.5 text-[11px] font-semibold text-[#17231c]">
          Assign champ
        </button>
      </div>

      <section className="mt-4 rounded-[12px] border border-[#e4e8e4] bg-white p-4 shadow-[0_1px_3px_rgba(20,40,28,.04)]">
        <div>
          <h3 className="text-[14px] font-bold text-[#17231c]">Order & schedule</h3>
          <p className="mt-0.5 text-[11px] text-[#7a847e]">Pick the delivery day and time window</p>
        </div>

        <div className="mt-4 grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-3 max-[800px]:grid-cols-1">
          <LockedField label="Destination (where)" value={header.destination} />
          <LockedField label="Delivery type" value={header.type} />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 max-[800px]:grid-cols-1">
          <SelectField
            label="Delivery date"
            value={deliveryDate}
            options={FALLBACK_DATES}
            onChange={setDeliveryDate}
          />
          <SelectField
            label="Time window"
            value={timeWindow}
            options={FALLBACK_WINDOWS}
            onChange={setTimeWindow}
          />
        </div>

        <div className="mt-3 flex items-start gap-2 rounded-[8px] border border-[#d7e8f7] bg-[#eef6fd] px-3 py-2.5 text-[11px] text-[#2f6ea3]">
          <Lock size={13} className="mt-0.5 shrink-0 text-[#c9a227]" />
          <span>Only dates inside this order&apos;s delivery window are selectable ({header.windowNote}).</span>
        </div>
      </section>

      <section className="relative mt-4 overflow-visible rounded-[12px] border border-[#e4e8e4] bg-white shadow-[0_1px_3px_rgba(20,40,28,.04)]">
        <div className="border-b border-[#edf0ee] px-4 py-3">
          <h3 className="text-[14px] font-bold text-[#17231c]">Available champs</h3>
          <p className="mt-0.5 text-[11px] text-[#7a847e]">
            Nearby champs for this order{selectedDateLabel ? ` · planning date ${selectedDateLabel}` : ''}
          </p>
          <div ref={filterBarRef} className="mt-3 flex flex-wrap items-center gap-2">
            <label className="flex h-[30px] min-w-[170px] items-center gap-2 rounded-full border border-[#e2e6e3] bg-[#f3f5f3] px-3">
              <Search size={13} className="text-[#8a948e]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="min-w-0 flex-1 border-0 bg-transparent text-[11px] outline-none placeholder:text-[#8a948e]"
                placeholder="Search champ…"
              />
            </label>
            <AssignFilterDropdown
              title="Governorate"
              items={filterOptions.governorate}
              value={filterGov}
              onChange={(next) => {
                setFilterGov(next)
                setFilterCity(null)
                setOpenFilter(null)
              }}
              open={openFilter === 'gov'}
              onToggleOpen={() => toggleFilter('gov')}
              emptyHint="No governorates in list"
            />
            <AssignFilterDropdown
              title="City"
              items={filterOptions.city}
              value={filterCity}
              onChange={setFilterValue('city', setFilterCity)}
              open={openFilter === 'city'}
              onToggleOpen={() => toggleFilter('city')}
              emptyHint={filterGov ? 'No cities in this governorate' : 'No cities in list'}
            />
            <AssignFilterDropdown
              title="Vehicle"
              items={filterOptions.vehicle}
              value={filterVehicle}
              onChange={setFilterValue('vehicle', setFilterVehicle)}
              open={openFilter === 'vehicle'}
              onToggleOpen={() => toggleFilter('vehicle')}
              emptyHint="No vehicles in list"
            />
            <AssignFilterDropdown
              title="Type"
              items={filterOptions.type}
              value={filterType}
              onChange={setFilterValue('type', setFilterType)}
              open={openFilter === 'type'}
              onToggleOpen={() => toggleFilter('type')}
              emptyHint="No types in list"
            />
            <AssignFilterDropdown
              title="Tier"
              items={filterOptions.tier}
              value={filterTier}
              onChange={setFilterValue('tier', setFilterTier)}
              open={openFilter === 'tier'}
              onToggleOpen={() => toggleFilter('tier')}
              emptyHint="No tiers in list"
            />
            <AssignFilterDropdown
              title="Allowed"
              items={filterOptions.allowed}
              value={filterAllowed}
              onChange={setFilterValue('allowed', setFilterAllowed)}
              open={openFilter === 'allowed'}
              onToggleOpen={() => toggleFilter('allowed')}
            />
            <span className="flex-1" />
            <AssignFilterDropdown
              title="Sort"
              items={filterOptions.sort}
              value={sortBy}
              onChange={(next) => {
                if (next) setSortBy(next)
                setOpenFilter(null)
              }}
              open={openFilter === 'sort'}
              onToggleOpen={() => toggleFilter('sort')}
              align="right"
              allowClear={false}
              emphasize={openFilter === 'sort' || sortBy !== 'nearest'}
            />
          </div>
        </div>

        {nearbyLoading ? (
          <div className="px-4 py-10 text-center text-[12px] text-[#78837c]">Loading nearby champs…</div>
        ) : nearbyError ? (
          <div className="m-4 rounded-lg border border-[#f2cccc] bg-[#fff5f5] p-4 text-[12px] text-[#a93e42]">
            {nearbyError}
          </div>
        ) : champs.length === 0 ? (
          <div className="px-4 py-10 text-center text-[12px] text-[#78837c]">
            {nearbyData?.nearby?.length
              ? 'No champs match these filters'
              : 'No nearby champs available'}
          </div>
        ) : (
          <div className="overflow-x-auto overflow-y-visible rounded-b-[12px]">
            <table className="w-full min-w-[1100px] border-collapse text-left">
              <thead>
                <tr className="bg-[#f7f8f7] text-[9px] font-semibold uppercase tracking-[.04em] text-[#8a948e]">
                  <th className="w-10 px-3 py-2.5" />
                  <th className="px-2 py-2.5">Champ</th>
                  <th className="px-2 py-2.5">Orders</th>
                  <th className="px-2 py-2.5">Gov</th>
                  <th className="px-2 py-2.5">City</th>
                  <th className="px-2 py-2.5">Block</th>
                  <th className="px-2 py-2.5">Tier</th>
                  <th className="px-2 py-2.5">Rating</th>
                  <th className="px-2 py-2.5">Type</th>
                  <th className="px-2 py-2.5">Vehicle</th>
                  <th className="px-2 py-2.5">Allowed</th>
                  <th className="px-2 py-2.5">Dist</th>
                  <th className="px-2 py-2.5 pr-4">Orders</th>
                </tr>
              </thead>
              <tbody>
                {champs.map((champ) => {
                  const active = selectedChamp === champ.id
                  return (
                    <tr
                      key={champ.id}
                      onClick={() => setSelectedChamp(champ.id)}
                      className={cn(
                        'cursor-pointer border-t border-[#edf0ee] transition',
                        active ? 'bg-[#e8f7ed]' : 'bg-white hover:bg-[#f7faf8]',
                      )}
                    >
                      <td className="px-3 py-3">
                        <span className={cn(
                          'grid h-[16px] w-[16px] place-items-center rounded-full border',
                          active ? 'border-[#19ad5b] bg-[#19ad5b] text-white' : 'border-[#c5cdc7] bg-white',
                        )}>
                          {active ? <span className="h-1.5 w-1.5 rounded-full bg-white" /> : null}
                        </span>
                      </td>
                      <td className="px-2 py-3">
                        <button
                          type="button"
                          data-champ-name
                          className="whitespace-nowrap text-left text-[12px] font-bold text-[#17231c]"
                          onMouseEnter={(e) => showPopover(champ.id, e.currentTarget)}
                          onMouseLeave={scheduleCloseHover}
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedChamp(champ.id)
                            if (pinnedChamp === champ.id) {
                              setPinnedChamp(null)
                              setHoverChamp(null)
                              setHoverRect(null)
                              return
                            }
                            showPopover(champ.id, e.currentTarget, { pin: true })
                          }}
                        >
                          <span className="underline decoration-[#c5cdc7] decoration-dotted underline-offset-2 hover:text-[#16854a]">
                            {champ.name || champ.id}
                          </span>
                          <span className="font-medium text-[#8a948e]"> · {champ.displayCode}</span>
                        </button>
                      </td>
                      <td className="px-2 py-3">
                        <span className="inline-flex rounded-full bg-[#e5f5eb] px-2 py-0.5 text-[11px] font-bold text-[#24834e]">
                          {champ.load}
                        </span>
                      </td>
                      <td className="px-2 py-3 text-[11px] text-[#455249]">{dash(champ.gov)}</td>
                      <td className="px-2 py-3 text-[11px] text-[#455249]">{dash(champ.city)}</td>
                      <td className="px-2 py-3 text-[11px] text-[#455249]">{dash(champ.block)}</td>
                      <td className="px-2 py-3">
                        {champ.tier ? (
                          <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', tierClass(champ.tier))}>{champ.tier}</span>
                        ) : '—'}
                      </td>
                      <td className="px-2 py-3">
                        {champ.rating != null ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#17231c]">
                            <Star size={11} className="fill-[#f0b429] text-[#f0b429]" /> {champ.rating}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-2 py-3 text-[11px] text-[#455249]">{dash(champ.type)}</td>
                      <td className="px-2 py-3">
                        {champ.vehicle ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-[#455249]">
                            {/bike|scooter/i.test(champ.vehicle) ? <Bike size={12} /> : <Car size={12} />}
                            {champ.vehicle}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-2 py-3">
                        {champ.allowed == null ? (
                          <span className="text-[11px] text-[#8a948e]">—</span>
                        ) : (
                          <span className={cn(
                            'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium',
                            champ.allowed ? 'bg-[#e5f5eb] text-[#24834e]' : 'bg-[#fdebec] text-[#c54749]',
                          )}>
                            {champ.allowed ? '✓ Allowed' : '✕ Not allowed'}
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-3 text-[11px] text-[#455249]">{champ.dist}</td>
                      <td className="px-2 py-3 pr-4 text-[12px] font-semibold text-[#17231c]">{champ.total}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="mt-4 flex w-full max-w-[560px] flex-col items-start overflow-hidden rounded-[14px] border-[1.4px] border-[#DBD18C] bg-[#FCF7DB] shadow-[0px_4px_14px_rgba(0,0,0,0.12)]">
        <div className="flex w-full flex-row items-start bg-[#FCEDB3] px-[18px] py-[14px]">
          <p className="text-[14.5px] font-bold leading-[18px] text-[#8C610D]">📝 Note — selected date drives the champ load</p>
        </div>
        <div className="flex w-full flex-col items-start gap-[14px] p-[18px]">
          {[
            'When a date is selected, the number of orders each champ has MUST change to match that date.',
            'Example: select Date 1 → champ has 5 orders on Date 1. Select Date 2 → the number changes → the champ has only 1 order on Date 2.',
            'The small hover popover (orders shown when hovering the champ name) must ALSO change its orders & details based on the selected date.',
          ].map((line) => (
            <div key={line} className="flex w-full flex-row items-start gap-2">
              <span className="shrink-0 text-[13px] font-bold leading-4 text-[#127338]">•</span>
              <p className="flex-1 text-[13px] font-normal leading-4 text-[#1C211F]">{line}</p>
            </div>
          ))}
        </div>
      </div>

      {submitError ? (
        <div className="mt-4 rounded-lg border border-[#f2cccc] bg-[#fff5f5] px-4 py-3 text-[12px] text-[#a93e42]">
          {submitError}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <Link
          to="/admin/scheduled"
          className="relative z-0 inline-flex h-[36px] items-center rounded-[8px] border border-[#dfe4e0] bg-white px-4 text-[12px] font-medium text-[#17231c]"
        >
          Cancel
        </Link>
        <button
          type="button"
          disabled={submitting || !selectedChamp || nearbyLoading}
          onClick={handleConfirm}
          className="relative z-0 inline-flex h-[36px] items-center gap-1.5 rounded-[8px] bg-[#19ad5b] px-4 text-[12px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Check size={14} strokeWidth={2.5} />
          {submitting ? 'Assigning…' : 'Confirm assignment'}
        </button>
      </div>

      {hoveredChamp && hoverRect ? (
        <ChampOrdersPopover
          champ={hoveredChamp}
          dateLabel={selectedDateLabel}
          anchorRect={hoverRect}
          onMouseEnter={keepPopoverOpen}
          onMouseLeave={scheduleCloseHover}
        />
      ) : null}
    </div>
  )
}
