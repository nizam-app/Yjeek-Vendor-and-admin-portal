import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowUpRight, Check, ChevronDown, Clock3, Plus, Search, Zap } from 'lucide-react'
import { apiConfig } from '../../../api/config'
import { useAdminScheduledBoard } from '../../../hooks/admin/useAdminScheduledBoard'
import { useAdminScheduledCalendar } from '../../../hooks/admin/useAdminScheduledCalendar'
import { useAdminIncidents } from '../../../hooks/admin/useAdminIncidents'
import { useAdminChats } from '../../../hooks/admin/useAdminChats'
import { ApiState } from '../../../components/admin/ApiState'
import { Button } from '../../../components/admin/Button'
import { cn } from '../../../components/admin/cn'
import { ChatStrip } from '../../../components/admin/operations/ChatStrip'
import { IncidentLog } from '../../../components/admin/operations/IncidentLog'
import { OperationsViewTabs } from '../../../components/admin/operations/OperationsViewTabs'
import { OrderCard } from '../../../components/admin/operations/OrderCard'
import {
  ADMIN_BOARD_PREVIEW_LIMIT,
} from '../../../lib/adminBoardLimits'
import { emptyAdminScheduledCalendar } from '../../../mappers/admin/mapAdminScheduledCalendar'
import { AdminOrderDetailModal } from './AdminLiveOrdersPage'

const useAdminMocks = () => apiConfig.adminUseMockApi

function normalizeScheduledView(value) {
  if (!value) return null
  const key = String(value).toLowerCase()
  if (key === 'pipeline') return 'Pipeline'
  if (key === 'board') return 'Board'
  if (key === 'calendar') return 'Calendar'
  return null
}

const COLUMN_STAGE_LABEL = {
  new: 'New',
  response: 'Awaiting champ',
  confirmation: 'Awaiting confirm',
  confirmed: 'Confirmed',
}

function boardToneForOrder(order) {
  if (order.bannerTone === 'danger' || /expired|declined/i.test(order.payment || '')) return 'red'
  if (order.column === 'new') {
    if (/payment/i.test(order.payment || '')) return 'blue'
    if (/vendor/i.test(order.payment || '')) return 'blue'
    return 'green'
  }
  if (order.column === 'response' || order.column === 'confirmation') return 'yellow'
  return 'green'
}

function mapScheduledOrderToBoardRow(order) {
  if (!order) return null
  const type = order.deliverySpeedLabel
    || order.tags?.find((tag) => ['Same Day', 'Next Day', 'Economy', 'Standard'].includes(tag))
    || order.category
    || '—'
  const stage = order.column === 'new'
    ? `New · ${order.statusLabel || order.payment || '—'}`
    : (COLUMN_STAGE_LABEL[order.column] || order.statusLabel || '—')

  return {
    id: order.id,
    orderId: order.orderId,
    route: order.route || '—',
    type: order.priorityLabel === 'Special' ? `★ ${type}` : type,
    prep: order.prep || '—',
    window: order.slot || order.windowLabel || '—',
    champ: order.champ || '—',
    stage,
    timer: order.timer || order.timeLeftLabel || '—',
    tone: boardToneForOrder(order),
  }
}

function AdminOperationsBoard({ mode }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const viewParamRaw = searchParams.get('view')
  const viewParam = normalizeScheduledView(viewParamRaw)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [view, setView] = useState(() => (
    mode === 'scheduled' && viewParam
      ? viewParam
      : 'Pipeline'
  ))

  useEffect(() => {
    if (mode !== 'scheduled') return
    if (viewParam && viewParam !== view) {
      setView(viewParam)
    }
  }, [mode, viewParam, view])

  const onViewChange = (next) => {
    setView(next)
    if (mode === 'scheduled') {
      setSearchParams(next === 'Pipeline' ? {} : { view: next }, { replace: true })
    }
  }

  const { data, error, isLoading, refetch } = useAdminScheduledBoard({
    sort: 'time_left',
    limit: 50,
  })
  const { data: incidentsData } = useAdminIncidents()
  const incidents = Array.isArray(incidentsData?.items) ? incidentsData.items : []
  const incidentCountLabel = String(
    incidentsData?.summary?.totalOpen ?? incidentsData?.total ?? incidents.length,
  )
  const { data: chatsData } = useAdminChats()
  const chats = Array.isArray(chatsData?.items) ? chatsData.items : []
  const chatsActive = chatsData?.active ?? chats.length
  const title = mode === 'scheduled'
    ? (view === 'Board' ? 'Scheduled orders — dispatch' : view === 'Calendar' ? 'Scheduled Orders · Dispatching' : 'Scheduled orders — pipeline')
    : `${mode[0].toUpperCase()}${mode.slice(1).replace('-', ' ')} — live operations`
  if (!data) return <ApiState isLoading={isLoading} error={error} onRetry={refetch} />

  return (
    <div className={cn('px-7 pt-[18px] max-[700px]:p-4', mode === 'scheduled' ? 'pb-0' : 'pb-[18px]')}>
      {view === 'Calendar' && mode === 'scheduled' ? null : (
        <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="text-[18px] font-bold">{title}</h2></div>
        </div>
      )}
      {view === 'Board' && mode === 'scheduled' ? (
        <ScheduledDispatchBoard
          data={data}
          incidents={incidents}
          incidentCountLabel={incidentCountLabel}
          view={view}
          onViewChange={onViewChange}
        />
      ) : view === 'Calendar' && mode === 'scheduled' ? (
        <ScheduledCalendarDispatch view={view} onViewChange={onViewChange} />
      ) : (
        <>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <OperationsViewTabs view={view} onViewChange={onViewChange} />
            <span className="flex-1" />
            <Button>Zone: All ▾</Button>
            <Button primary><Zap size={12} /> Auto-assign</Button>
          </div>
          <div className="grid grid-cols-4 gap-3 overflow-x-auto max-[1100px]:grid-cols-2 max-[650px]:grid-cols-1">
            {data.columns.map((column) => {
              const cards = data.orders.filter((order) => order.column === column.key)
              const previewCards = cards.slice(0, ADMIN_BOARD_PREVIEW_LIMIT)
              const columnHref = mode === 'scheduled' ? `/admin/scheduled/${column.key}` : null
              return (
                <section key={column.key} className="min-h-[548px] min-w-[230px] rounded-lg bg-[#f1f4f1] p-2.5">
                  <div className="mb-2 flex h-6 items-center gap-2 px-1">
                    <span className="h-2 w-2 rounded-full" style={{ background: column.tone }} />
                    <h3 className="text-[10px] font-bold">{column.title}</h3>
                    <span className="rounded-full bg-white px-2 py-0.5 text-[9px] text-[#6d7871]">{cards.length}</span>
                    <span className="flex-1" />
                    {columnHref ? (
                      <Link
                        to={columnHref}
                        className="grid h-5 w-5 place-items-center rounded bg-white text-[#738078] hover:text-[#17231c]"
                        aria-label={`Open all ${column.title} orders`}
                        title={`View all ${cards.length} orders`}
                      >
                        <ArrowUpRight size={11} />
                      </Link>
                    ) : (
                      <button type="button" className="grid h-5 w-5 place-items-center rounded bg-white text-[#738078]"><ArrowUpRight size={11} /></button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {previewCards.map((order, index) => (
                      <OrderCard
                        key={`${column.key}-${order.id}-${index}`}
                        order={order}
                        mode={mode}
                        onOrderClick={mode === 'scheduled' ? setSelectedOrder : undefined}
                      />
                    ))}
                    {cards.length > ADMIN_BOARD_PREVIEW_LIMIT && columnHref ? (
                      <Link
                        to={columnHref}
                        className="flex w-full items-center justify-center rounded-[9px] border border-dashed border-[#cfd7d1] bg-white px-2 py-2 text-[10px] font-medium text-[#3d7a55] hover:border-[#1a9b53] hover:text-[#14763f]"
                      >
                        View all {cards.length} orders ↗
                      </Link>
                    ) : null}
                  </div>
                </section>
              )
            })}
          </div>
          <IncidentLog incidents={incidents} countLabel={incidentCountLabel} />
        </>
      )}
      {view === 'Calendar' && mode === 'scheduled' ? null : <ChatStrip chats={chats} activeCount={chatsActive} />}
      {selectedOrder ? (
        <AdminOrderDetailModal
          order={selectedOrder}
          preference="scheduled"
          onClose={() => setSelectedOrder(null)}
        />
      ) : null}
    </div>
  )
}

const calendarMockDays = [
  { key: 'mon', label: 'Mon 29 Jun' },
  { key: 'tue', label: 'Tue 30 Jun' },
  { key: 'wed', label: 'Wed 1 Jul' },
  { key: 'thu', label: 'Thu 2 Jul' },
  { key: 'fri', label: 'Fri 3 Jul' },
  { key: 'sat', label: 'Sat 4 Jul' },
  { key: 'sun', label: 'Sun 5 Jul' },
]

const calendarMockOrders = [
  {
    id: 'mock-8001',
    orderNumber: '#YJK-8001',
    store: 'Green store',
    place: 'Manama · 0322',
    type: 'Same day',
    governorate: 'Capital',
    city: 'Manama',
    block: '0322',
    slots: { mon: { kind: 'assigned', champ: 'Champ A', window: '2-4 PM' }, tue: 'assign', wed: 'assign', thu: 'empty', fri: 'assign', sat: 'assign', sun: 'empty' },
  },
  {
    id: 'mock-8002',
    orderNumber: '#YJK-8002',
    store: 'Lulu Express',
    place: 'Muharraq · 0214',
    type: 'Next day',
    governorate: 'Muharraq',
    city: 'Muharraq',
    block: '0214',
    slots: { mon: 'assign', tue: 'assign', wed: 'empty', thu: 'empty', fri: 'assign', sat: 'assign', sun: 'empty' },
  },
  {
    id: 'mock-8003',
    orderNumber: '#YJK-8003',
    store: 'City mart',
    place: 'Hidd · 0114',
    type: 'Standard',
    governorate: 'Muharraq',
    city: 'Hidd',
    block: '0114',
    slots: { mon: 'empty', tue: 'assign', wed: 'assign', thu: 'empty', fri: 'assign', sat: 'assign', sun: 'empty' },
  },
  {
    id: 'mock-8004',
    orderNumber: '#YJK-8004',
    store: 'Sharaf DG',
    place: 'Saar · 0531',
    type: 'Economy',
    governorate: 'Northern',
    city: 'Saar',
    block: '0531',
    slots: { mon: 'empty', tue: 'empty', wed: 'assign', thu: 'empty', fri: 'assign', sat: 'assign', sun: 'assign' },
  },
  {
    id: 'mock-8005',
    orderNumber: '#YJK-8005',
    store: 'Daily needs',
    place: 'Isa Town · 0801',
    type: 'Same day',
    governorate: 'Southern',
    city: 'Isa Town',
    block: '0801',
    slots: { mon: 'empty', tue: 'empty', wed: 'empty', thu: 'empty', fri: 'assign', sat: 'assign', sun: 'assign' },
  },
  {
    id: 'mock-8006',
    orderNumber: '#YJK-8006',
    store: 'Quick shop',
    place: 'Riffa · 0905',
    type: 'Next day',
    governorate: 'Southern',
    city: 'Riffa',
    block: '0905',
    slots: { mon: 'empty', tue: 'empty', wed: 'empty', thu: 'empty', fri: 'assign', sat: 'assign', sun: 'empty' },
  },
]

function CalendarSlotCell({ slot, onAssign }) {
  if (slot?.kind === 'assigned') {
    return (
      <div className="mx-auto min-w-[82px] rounded-[8px] border border-[#b7e4c7] bg-[#e7f6ec] px-2.5 py-2 text-center">
        <p className="text-[11px] font-bold leading-none text-[#16854a]">{slot.champ}</p>
        <p className="mt-1.5 text-[10px] font-medium leading-none text-[#3d9a62]">{slot.window}</p>
      </div>
    )
  }
  if (slot === 'assign') {
    return (
      <button
        type="button"
        onClick={onAssign}
        className="inline-flex h-[30px] min-w-[82px] items-center justify-center gap-1 rounded-[8px] border border-dashed border-[#19ad5b] bg-white px-3 text-[11px] font-semibold text-[#19ad5b] hover:bg-[#f3fbf6]"
      >
        <Plus size={12} strokeWidth={2.5} /> Assign
      </button>
    )
  }
  return <span className="mx-auto block h-1 w-1 rounded-full bg-[#d0d6d1]" />
}

function CalendarFilterDropdown({ title, items, selected, onToggle, open, onToggleOpen, emptyHint }) {
  const [query, setQuery] = useState('')
  const selectedCount = selected.length
  const visible = items.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase())
    || item.sub?.toLowerCase().includes(query.toLowerCase()),
  )
  const first = items.find((item) => item.id === selected[0])
  const valueLabel = selectedCount === 0
    ? 'All'
    : title === 'Blocks' && selectedCount > 1
      ? `${selectedCount} selected`
      : selectedCount === 1
        ? (title === 'Blocks' ? (first?.label?.replace(/^Block\s+/i, '') || first?.label) : (first?.label || '1'))
        : `${first?.label || ''} +${selectedCount - 1}`

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggleOpen}
        className={cn(
          'inline-flex h-[30px] items-center gap-1 rounded-full border px-3 text-[11px] transition',
          (open || selectedCount > 0) && 'border-[#b7e4c7] bg-[#e8f7ed] text-[#147940]',
          !open && selectedCount === 0 && 'border-[#d7ddd8] bg-white text-[#455249]',
        )}
      >
        <span className={cn('font-medium', open || selectedCount > 0 ? 'text-[#2f8f55]' : 'text-[#6a746e]')}>{title}</span>
        <span className={cn('font-bold', open || selectedCount > 0 ? 'text-[#0f6b3a]' : 'text-[#17231c]')}>· {valueLabel}</span>
        ▾
      </button>
      {open ? (
        <div className="absolute left-0 top-[36px] z-30 w-[220px] overflow-hidden rounded-[12px] border border-[#e2e6e3] bg-white shadow-[0_12px_32px_rgba(20,40,28,.16)]">
          <div className="border-b border-[#edf0ee] p-2">
            <label className="flex h-[30px] items-center gap-2 rounded-full border border-[#e2e6e3] bg-[#f7f9f7] px-2.5">
              <Search size={12} className="text-[#8a948e]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="min-w-0 flex-1 border-0 bg-transparent text-[11px] outline-none"
                placeholder="Search…"
              />
            </label>
          </div>
          <div className="max-h-[240px] space-y-0.5 overflow-y-auto p-1.5">
            {visible.length === 0 ? (
              <p className="px-2 py-3 text-center text-[11px] text-[#8a948e]">
                {emptyHint || 'No options'}
              </p>
            ) : visible.map((item) => {
              const checked = selected.includes(item.id)
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onToggle(item.id)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-[8px] px-2 py-2 text-left transition',
                    checked ? 'bg-[#e8f7ed] text-[#147940]' : item.count === 0 ? 'bg-white text-[#9aa39c]' : 'bg-white text-[#314039] hover:bg-[#f5f8f5]',
                  )}
                >
                  <span className={cn(
                    'grid h-[15px] w-[15px] shrink-0 place-items-center rounded-[3px] border',
                    checked ? 'border-[#19ad5b] bg-[#19ad5b] text-white' : 'border-[#c5cdc7] bg-white',
                  )}>
                    {checked ? <Check size={10} strokeWidth={3} /> : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[11px] font-semibold">{item.label}</span>
                    {item.sub ? <span className="block text-[9px] font-medium text-[#8a948e]">{item.sub}</span> : null}
                  </span>
                  <span className={cn(
                    'grid h-[18px] min-w-[18px] place-items-center rounded-full px-1.5 text-[9px] font-bold leading-none',
                    item.count > 0 ? 'bg-[#ffe8b8] text-[#9a6d12]' : 'bg-transparent text-[#b0b8b2]',
                  )}>{item.count}</span>
                </button>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function SimpleCalendarFilterDropdown({ title, items, selectedId, onSelect, open, onToggleOpen }) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggleOpen}
        className={cn(
          'inline-flex h-[30px] items-center gap-1 rounded-full border px-3 text-[11px] transition',
          (open || selectedId) && 'border-[#b7e4c7] bg-[#e8f7ed] text-[#147940]',
          !open && !selectedId && 'border-[#d7ddd8] bg-white text-[#455249]',
        )}
      >
        <span className={cn('font-medium', open || selectedId ? 'text-[#2f8f55]' : 'text-[#6a746e]')}>{title}</span>
        <span className={cn('font-bold', open || selectedId ? 'text-[#0f6b3a]' : 'text-[#17231c]')}>
          · {selectedId ? (items.find((i) => i.id === selectedId)?.label || '1') : 'All'}
        </span>
        ▾
      </button>
      {open ? (
        <div className="absolute left-0 top-[36px] z-30 w-[220px] overflow-hidden rounded-[12px] border border-[#e2e6e3] bg-white shadow-[0_12px_32px_rgba(20,40,28,.16)]">
          <div className="max-h-[240px] space-y-0.5 overflow-y-auto p-1.5">
            <button
              type="button"
              onClick={() => onSelect(null)}
              className={cn(
                'flex w-full items-center rounded-[8px] px-2 py-2 text-left text-[11px] font-semibold transition',
                !selectedId ? 'bg-[#e8f7ed] text-[#147940]' : 'text-[#314039] hover:bg-[#f5f8f5]',
              )}
            >
              All
            </button>
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(item.id)}
                className={cn(
                  'flex w-full items-center rounded-[8px] px-2 py-2 text-left text-[11px] font-semibold transition',
                  selectedId === item.id ? 'bg-[#e8f7ed] text-[#147940]' : 'text-[#314039] hover:bg-[#f5f8f5]',
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function ScheduledCalendarDispatch({ view, onViewChange }) {
  const navigate = useNavigate()
  const showMockChrome = useAdminMocks()
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [typeFilter, setTypeFilter] = useState(null)
  const [vendorFilter, setVendorFilter] = useState(null)
  const [champFilter, setChampFilter] = useState(null)
  const [selectedGov, setSelectedGov] = useState([])
  const [selectedCities, setSelectedCities] = useState([])
  const [selectedBlocks, setSelectedBlocks] = useState([])
  const [openFilters, setOpenFilters] = useState(() => new Set())

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(searchQuery.trim()), 250)
    return () => clearTimeout(t)
  }, [searchQuery])

  const { data: apiData, error, isLoading, refetch } = useAdminScheduledCalendar({
    q: debouncedQ || undefined,
    type: typeFilter || 'all',
    vendorId: vendorFilter || undefined,
    driverId: champFilter || undefined,
    limit: 100,
  })

  const calendar = showMockChrome && !apiData?.items?.length
    ? {
        ...emptyAdminScheduledCalendar,
        days: calendarMockDays,
        governorateCounts: [
          { key: 'Capital', label: 'Capital', count: 1 },
          { key: 'Muharraq', label: 'Muharraq', count: 2 },
          { key: 'Northern', label: 'Northern', count: 1 },
          { key: 'Southern', label: 'Southern', count: 2 },
        ],
        filters: {
          governorates: [
            { id: 'Capital', label: 'Capital', count: 1 },
            { id: 'Muharraq', label: 'Muharraq', count: 2 },
            { id: 'Northern', label: 'Northern', count: 1 },
            { id: 'Southern', label: 'Southern', count: 2 },
          ],
          cities: [
            { id: 'Manama', label: 'Manama', governorate: 'Capital', count: 1 },
            { id: 'Muharraq', label: 'Muharraq', governorate: 'Muharraq', count: 1 },
            { id: 'Hidd', label: 'Hidd', governorate: 'Muharraq', count: 1 },
            { id: 'Saar', label: 'Saar', governorate: 'Northern', count: 1 },
            { id: 'Isa Town', label: 'Isa Town', governorate: 'Southern', count: 1 },
            { id: 'Riffa', label: 'Riffa', governorate: 'Southern', count: 1 },
          ],
          blocks: [
            { id: 'Manama::0322', block: '0322', label: 'Block 0322', city: 'Manama', governorate: 'Capital', count: 1, sub: 'Manama' },
            { id: 'Muharraq::0214', block: '0214', label: 'Block 0214', city: 'Muharraq', governorate: 'Muharraq', count: 1, sub: 'Muharraq' },
            { id: 'Hidd::0114', block: '0114', label: 'Block 0114', city: 'Hidd', governorate: 'Muharraq', count: 1, sub: 'Hidd' },
            { id: 'Saar::0531', block: '0531', label: 'Block 0531', city: 'Saar', governorate: 'Northern', count: 1, sub: 'Saar' },
            { id: 'Isa Town::0801', block: '0801', label: 'Block 0801', city: 'Isa Town', governorate: 'Southern', count: 1, sub: 'Isa Town' },
            { id: 'Riffa::0905', block: '0905', label: 'Block 0905', city: 'Riffa', governorate: 'Southern', count: 1, sub: 'Riffa' },
          ],
          types: [],
          vendors: [],
          champs: [],
        },
        items: calendarMockOrders,
      }
    : (apiData || emptyAdminScheduledCalendar)

  const days = calendar.days?.length ? calendar.days : calendarMockDays
  const allCities = calendar.filters?.cities || []
  const allBlocks = calendar.filters?.blocks || []
  const govOptions = calendar.filters?.governorates?.length
    ? calendar.filters.governorates
    : (calendar.governorateCounts || []).map((g) => ({ id: g.key, label: g.label, count: g.count }))

  const cityOptions = useMemo(() => {
    if (selectedGov.length === 0) return allCities
    const allowed = new Set(selectedGov)
    return allCities.filter((c) => allowed.has(c.governorate))
  }, [allCities, selectedGov])

  const blockOptions = useMemo(() => {
    if (selectedCities.length === 0) return []
    const allowedCities = new Set(selectedCities.map((c) => c.toLowerCase()))
    return allBlocks
      .filter((b) => allowedCities.has(String(b.city || '').toLowerCase()))
      .map((b) => ({
        ...b,
        sub: b.sub || b.city,
      }))
  }, [allBlocks, selectedCities])

  // Keep child selections valid when parents change.
  useEffect(() => {
    const validCityIds = new Set(cityOptions.map((c) => c.id))
    setSelectedCities((prev) => {
      const next = prev.filter((id) => validCityIds.has(id))
      return next.length === prev.length ? prev : next
    })
  }, [cityOptions])

  useEffect(() => {
    const validBlockIds = new Set(blockOptions.map((b) => b.id))
    setSelectedBlocks((prev) => {
      const next = prev.filter((id) => validBlockIds.has(id))
      return next.length === prev.length ? prev : next
    })
  }, [blockOptions])

  const orders = useMemo(() => {
    const items = Array.isArray(calendar.items) ? calendar.items : []
    const selectedBlockKeys = new Set(
      selectedBlocks.map((id) => {
        const hit = allBlocks.find((b) => b.id === id)
        return hit ? `${hit.city}::${hit.block || hit.id}` : id
      }),
    )
    return items.filter((order) => {
      if (selectedGov.length > 0 && !selectedGov.includes(order.governorate)) return false
      if (selectedCities.length > 0 && !selectedCities.includes(order.city)) return false
      if (selectedBlocks.length > 0) {
        const block = order.block != null ? String(order.block) : ''
        const composite = `${order.city}::${block}`
        if (!selectedBlockKeys.has(composite) && !selectedBlocks.includes(block)) return false
      }
      return true
    })
  }, [calendar.items, selectedGov, selectedCities, selectedBlocks, allBlocks])

  const toggleOpen = (title) => {
    setOpenFilters((current) => {
      const next = new Set(current)
      if (next.has(title)) next.delete(title)
      else {
        next.clear()
        next.add(title)
      }
      return next
    })
  }

  const toggleGov = (id) => {
    setSelectedGov((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]))
    setSelectedCities([])
    setSelectedBlocks([])
  }

  const toggleCity = (id) => {
    setSelectedCities((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]))
    setSelectedBlocks([])
  }

  const toggleBlock = (id) => {
    setSelectedBlocks((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]))
  }

  const openAssignChamp = (order, day) => {
    const orderId = (order.orderId || order.id || '').replace(/^#/, '')
    if (!orderId) return
    const params = new URLSearchParams({
      day: day.key || day.date || '',
      window: order.windowLabel || order.slots?.[day.key]?.window || '2–4 PM',
    })
    navigate(`/admin/scheduled/assign/${encodeURIComponent(orderId)}?${params.toString()}`)
  }

  const govChips = calendar.governorateCounts?.length
    ? calendar.governorateCounts
    : govOptions.map((g) => ({ key: g.id, label: g.label, count: g.count }))

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <OperationsViewTabs view={view} onViewChange={onViewChange} />
      </div>

      <h2 className="text-[18px] font-bold tracking-[-0.02em] text-[#17231c]">Scheduled Orders · Dispatching</h2>

      <div className="mt-3 flex flex-wrap gap-2">
        {govChips.map((chip) => {
          const active = selectedGov.includes(chip.key || chip.label)
          return (
            <button
              key={chip.key || chip.label}
              type="button"
              onClick={() => toggleGov(chip.key || chip.label)}
              className={cn(
                'inline-flex h-[28px] items-center gap-1.5 rounded-full border px-3 text-[11px] font-medium transition',
                active
                  ? 'border-[#b7e4c7] bg-[#e8f7ed] text-[#147940]'
                  : 'border-[#e2e6e3] bg-white text-[#455249] hover:bg-[#f7f9f7]',
              )}
            >
              {chip.label}
              <i className="grid h-[18px] min-w-[18px] place-items-center rounded-full bg-[#f4c76a] px-1 text-[10px] not-italic font-bold leading-none text-[#7a4e08]">
                {chip.count}
              </i>
            </button>
          )
        })}
      </div>

      <section className="relative mt-4 overflow-visible rounded-[16px] border border-[#e4e8e4] bg-white shadow-[0_1px_3px_rgba(20,40,28,.04)]">
        <div className="border-b border-[#e8ebe8] px-5 py-4">
          <h3 className="text-[15px] font-bold tracking-[-0.01em] text-[#17231c]">
            {calendar.title || 'Orders × available delivery days'}
          </h3>
          <div className="mt-3.5 flex flex-wrap items-center gap-2">
            <CalendarFilterDropdown
              title="Governorates"
              items={govOptions}
              selected={selectedGov}
              onToggle={toggleGov}
              open={openFilters.has('Governorates')}
              onToggleOpen={() => toggleOpen('Governorates')}
            />
            <CalendarFilterDropdown
              title="Cities"
              items={cityOptions}
              selected={selectedCities}
              onToggle={toggleCity}
              open={openFilters.has('Cities')}
              onToggleOpen={() => toggleOpen('Cities')}
              emptyHint={selectedGov.length ? 'No cities in selected governorates' : 'No cities'}
            />
            <CalendarFilterDropdown
              title="Blocks"
              items={blockOptions}
              selected={selectedBlocks}
              onToggle={toggleBlock}
              open={openFilters.has('Blocks')}
              onToggleOpen={() => toggleOpen('Blocks')}
              emptyHint={selectedCities.length === 0 ? 'Select a city first' : 'No blocks for selected cities'}
            />
            <SimpleCalendarFilterDropdown
              title="Champ"
              items={calendar.filters?.champs || []}
              selectedId={champFilter}
              onSelect={(id) => { setChampFilter(id); toggleOpen('Champ') }}
              open={openFilters.has('Champ')}
              onToggleOpen={() => toggleOpen('Champ')}
            />
            <SimpleCalendarFilterDropdown
              title="Type"
              items={calendar.filters?.types || []}
              selectedId={typeFilter}
              onSelect={(id) => { setTypeFilter(id); toggleOpen('Type') }}
              open={openFilters.has('Type')}
              onToggleOpen={() => toggleOpen('Type')}
            />
            <SimpleCalendarFilterDropdown
              title="Vendor"
              items={calendar.filters?.vendors || []}
              selectedId={vendorFilter}
              onSelect={(id) => { setVendorFilter(id); toggleOpen('Vendor') }}
              open={openFilters.has('Vendor')}
              onToggleOpen={() => toggleOpen('Vendor')}
            />
            <span className="flex-1" />
            <label className="flex h-[30px] min-w-[160px] items-center gap-2 rounded-full border border-[#e2e6e3] bg-[#f3f5f3] px-3">
              <Search size={13} className="text-[#8a948e]" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="min-w-0 flex-1 border-0 bg-transparent text-[11px] text-[#314039] outline-none placeholder:text-[#8a948e]"
                placeholder="Search order"
              />
            </label>
          </div>
        </div>

        <div className="overflow-x-auto rounded-b-[16px]">
          {isLoading && !apiData && !showMockChrome ? (
            <p className="px-4 py-10 text-center text-[12px] text-[#78837c]">Loading calendar…</p>
          ) : error && !apiData && !showMockChrome ? (
            <div className="px-4 py-10 text-center text-[12px] text-[#78837c]">
              Unable to load calendar.{' '}
              <button type="button" className="font-semibold text-[#16854a] hover:underline" onClick={() => refetch()}>
                Retry
              </button>
            </div>
          ) : (
            <table className="w-full min-w-[1020px] border-collapse text-left">
              <thead>
                <tr className="bg-[#f7f8f7]">
                  <th className="w-[168px] border-b border-r border-[#e8ebe8] px-4 py-3 text-[10px] font-semibold uppercase tracking-[.06em] text-[#8a948e]">Order</th>
                  {days.map((day) => (
                    <th key={day.key} className="border-b border-r border-[#e8ebe8] px-2 py-3 text-center text-[12px] font-bold text-[#1a2420] last:border-r-0">{day.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={days.length + 1} className="px-4 py-10 text-center text-[12px] text-[#78837c]">
                      No calendar orders
                    </td>
                  </tr>
                ) : orders.map((order) => (
                  <tr key={order.id} className="last:[&>td]:border-b-0">
                    <td className="border-b border-r border-[#e8ebe8] px-4 py-4 align-top">
                      <p className="text-[12px] font-bold leading-none text-[#17231c]">{order.orderNumber || order.id}</p>
                      <p className="mt-1.5 text-[12px] font-semibold leading-none text-[#16854a]">{order.store}</p>
                      <p className="mt-1.5 text-[11px] leading-none text-[#7a847e]">{order.place}</p>
                      <p className="mt-1.5 text-[11px] leading-none text-[#7a847e]">{order.type}</p>
                    </td>
                    {days.map((day) => (
                      <td key={day.key} className="border-b border-r border-[#e8ebe8] px-2 py-3.5 text-center align-middle last:border-r-0">
                        <div className="flex min-h-[38px] items-center justify-center">
                          <CalendarSlotCell
                            slot={order.slots?.[day.key]}
                            onAssign={() => openAssignChamp(order, day)}
                          />
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  )
}

const dispatchRows = [
  { id: '#YJK-…50', route: 'VEERA → Juffair', type: 'Same Day', prep: '3 hrs', window: '30 Jun · 1–3 PM', champ: 'Ahmed K.', stage: 'Awaiting champ', timer: '38m to respond', tone: 'yellow' },
  { id: '#YJK-…51', route: 'Sharaf DG → Adliya', type: 'Economy', prep: '20 min', window: '30 Jun · 6–8 PM', champ: 'Yusuf R.', stage: 'Awaiting confirm', timer: '12m to confirm', tone: 'yellow' },
  { id: '#YJK-…62', route: 'The Green Kitchen → Seef', type: '★ Standard', prep: '~20 min', window: '30 Jun · 1–3 PM', champ: '—', stage: 'New · Paid', timer: '12m to confirm', tone: 'green' },
  { id: '#YJK-…63', route: 'Lulu Express → Manama', type: 'Same Day', prep: '~15 min', window: '30 Jun · 3–5 PM', champ: '—', stage: 'New · Awaiting payment', timer: '12m to confirm', tone: 'blue' },
  { id: '#YJK-…64', route: 'VEERA → Juffair', type: 'Next Day', prep: '~24 hrs', window: 'Tomorrow 5–8 PM', champ: '—', stage: 'New · Awaiting vendor', timer: '12m to confirm', tone: 'blue' },
  { id: '#YJK-…64', route: 'VEERA → Juffair', type: '★ Economy', prep: '~24 hrs', window: '01 Jul', champ: '—', stage: 'Auto-cancelled · expired', timer: '12m to confirm', tone: 'red' },
]

function ScheduledDispatchBoard({
  data,
  incidents: feedIncidents = [],
  incidentCountLabel = '0',
  view,
  onViewChange,
}) {
  const showMockChrome = useAdminMocks()
  const apiRows = (Array.isArray(data?.orders) ? data.orders : [])
    .map(mapScheduledOrderToBoardRow)
    .filter(Boolean)
  const rows = showMockChrome && apiRows.length === 0 ? dispatchRows : apiRows
  const incidents = Array.isArray(feedIncidents) ? feedIncidents : []

  const unassignedCount = apiRows.filter((row) => !row.champ || row.champ === '—').length
  const reconfirmCount = (data?.orders || []).filter((order) => order.column === 'confirmation').length
  const scheduledToday = Number(data?.counts?.all) || apiRows.length

  const snapshotRows = showMockChrome && apiRows.length === 0
    ? [['Scheduled today', '18'], ['Unassigned', '5'], ['Re-confirm pending', '2']]
    : [
        ['Scheduled today', String(scheduledToday)],
        ['Unassigned', String(unassignedCount)],
        ['Re-confirm pending', String(reconfirmCount)],
      ]

  const windowBuckets = new Map()
  for (const order of data?.orders || []) {
    const key = order.slot || order.windowLabel
    if (!key) continue
    windowBuckets.set(key, (windowBuckets.get(key) || 0) + 1)
  }
  const windowRows = showMockChrome && windowBuckets.size === 0
    ? [['1–3 PM', '4 orders'], ['3–5 PM', '2 orders'], ['6–8 PM', '9 orders'], ['8–10 PM', '3 orders']]
    : Array.from(windowBuckets.entries()).map(([label, count]) => [
        label,
        `${count} order${count === 1 ? '' : 's'}`,
      ])

  const champAvailable = showMockChrome && apiRows.length === 0 ? '12' : '—'

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_220px] items-start gap-3 max-[900px]:grid-cols-1">
      <div className="min-w-0">
        <div className="mb-3 flex items-center gap-2">
          <OperationsViewTabs view={view} onViewChange={onViewChange} />
        </div>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {['Date: Today', 'Type: All', 'Stage: All', 'Zone: All'].map((filter) => (
            <Button key={filter} className="h-[29px] px-2.5">{filter}▾</Button>
          ))}
          <span className="flex-1" />
          <Button primary className="h-[31px] px-4"><Zap size={11} /> Auto-assign</Button>
        </div>
        <section className="overflow-hidden rounded-[10px] border border-[#dfe4e0] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] table-fixed border-collapse text-left">
              <colgroup>
                <col className="w-[11%]" /><col className="w-[21%]" /><col className="w-[10%]" /><col className="w-[10%]" />
                <col className="w-[15%]" /><col className="w-[11%]" /><col className="w-[19%]" /><col className="w-[3%]" />
              </colgroup>
              <thead>
                <tr className="h-[38px] border-b border-[#e8ebe9] bg-[#fafbfa] text-[8px] uppercase tracking-[.04em] text-[#8a948e]">
                  {['Order', 'Vendor → zone', 'Type', 'Prep', 'Window', 'Champ', 'Stage', ''].map((heading, index) => (
                    <th key={`${heading}-${index}`} className="whitespace-nowrap px-3 font-medium">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-3 py-8 text-center text-[11px] text-[#78837c]">No scheduled board rows</td>
                  </tr>
                ) : rows.map((order, index) => (
                  <tr key={`${order.id}-${index}`} className="h-[54px] border-b border-[#edf0ee] last:border-0 hover:bg-[#fafcfa]">
                    <td className="whitespace-nowrap px-3 text-[10px] font-bold">{order.id}</td>
                    <td className="truncate px-3 text-[10px] font-semibold">{order.route}</td>
                    <td className="px-3"><BoardTag>{order.type}</BoardTag></td>
                    <td className="whitespace-nowrap px-3 text-[10px] text-[#566159]">{order.prep}</td>
                    <td className="whitespace-nowrap px-3 text-[10px] font-medium">{order.window}</td>
                    <td className="whitespace-nowrap px-3 text-[10px]">{order.champ}</td>
                    <td className="px-3">
                      <div className="flex items-center gap-1 whitespace-nowrap">
                        <BoardStage tone={order.tone}>{order.stage}</BoardStage>
                        <span className="inline-flex items-center gap-0.5 text-[8px] text-[#a66f13]"><Clock3 size={8} />{order.timer}</span>
                      </div>
                    </td>
                    <td className="px-1"><button type="button" className="text-[9px] font-medium text-[#16854a]">View</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <IncidentLog incidents={incidents} countLabel={incidentCountLabel} />
      </div>

      <aside className="space-y-3">
        <DispatchSummary title="Ops snapshot · Today">
          {snapshotRows.map(([label, value]) => (
            <SummaryRow key={label} label={label} value={value} alert={label === 'Unassigned' && value !== '0'} warning={label === 'Re-confirm pending' && value !== '0'} />
          ))}
        </DispatchSummary>
        <DispatchSummary title="Windows today">
          {windowRows.length === 0 ? (
            <p className="text-[10px] text-[#78837c]">No window data</p>
          ) : windowRows.map(([label, value]) => (
            <SummaryRow key={label} label={label} value={value} pill />
          ))}
        </DispatchSummary>
        <DispatchSummary title="Champ capacity">
          <SummaryRow label="Available tonight" value={champAvailable} success={champAvailable !== '0' && champAvailable !== '—'} />
          <Button primary className="mt-2 h-8 w-full rounded-[8px]"><Zap size={11} /> Auto-assign all</Button>
        </DispatchSummary>
      </aside>
    </div>
  )
}

function BoardTag({ children }) {
  const label = String(children)
  const tone = label.includes('Same Day')
    ? 'bg-[#e5f0ff] text-[#2978db]'
    : 'bg-[#f0f2f0] text-[#667169]'
  return <span className={cn('whitespace-nowrap rounded-full px-2 py-0.5 text-[8px] font-medium', tone)}>{children}</span>
}

function BoardStage({ children, tone }) {
  const tones = {
    yellow: 'bg-[#fff3d5] text-[#a06d16]',
    green: 'bg-[#e4f5e9] text-[#287a48]',
    blue: 'bg-[#e7f1fb] text-[#3575a7]',
    red: 'bg-[#fde9e9] text-[#c74747]',
  }
  return <span className={cn('rounded-full px-2 py-0.5 text-[8px] font-medium', tones[tone])}>{children}</span>
}

function DispatchSummary({ title, children }) {
  return (
    <section className="rounded-[10px] border border-[#dfe4e0] bg-white p-3 shadow-[0_1px_2px_rgba(25,45,32,.03)]">
      <h3 className="mb-3 text-[10px] font-bold">{title}</h3>
      <div className="space-y-2.5">{children}</div>
    </section>
  )
}

function SummaryRow({ label, value, alert = false, warning = false, success = false, pill = false }) {
  return (
    <div className="flex items-center justify-between text-[10px]">
      <span className="text-[#77827b]">{label}</span>
      <span className={cn(
        'font-bold text-[#17231c]',
        alert && 'text-[#d84448]',
        warning && 'text-[#b57a16]',
        success && 'text-[#16854a]',
        pill && 'rounded-full bg-[#f1f3f1] px-2 py-0.5 text-[9px] font-medium text-[#68736c]',
      )}>{value}</span>
    </div>
  )
}

export default function AdminScheduledOrdersPage() {
  return <AdminOperationsBoard mode="scheduled" />
}
