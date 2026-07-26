import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowUpRight, Check, ChevronDown, Clock3, Plus, Search, Zap } from 'lucide-react'
import { useApiResource } from '../../../hooks/useApiResource'
import { adminService } from '../../../services/adminService'
import { ApiState } from '../../../components/admin/ApiState'
import { Button } from '../../../components/admin/Button'
import { cn } from '../../../components/admin/cn'
import { ChatStrip } from '../../../components/admin/operations/ChatStrip'
import { IncidentLog } from '../../../components/admin/operations/IncidentLog'
import { OperationsViewTabs } from '../../../components/admin/operations/OperationsViewTabs'
import { OrderCard } from '../../../components/admin/operations/OrderCard'

function AdminOperationsBoard({ mode }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const viewParam = searchParams.get('view')
  const [view, setView] = useState(() => (
    mode === 'scheduled' && ['Pipeline', 'Board', 'Calendar'].includes(viewParam)
      ? viewParam
      : 'Pipeline'
  ))

  useEffect(() => {
    if (mode !== 'scheduled') return
    if (['Pipeline', 'Board', 'Calendar'].includes(viewParam) && viewParam !== view) {
      setView(viewParam)
    }
  }, [mode, viewParam, view])

  const onViewChange = (next) => {
    setView(next)
    if (mode === 'scheduled') {
      setSearchParams(next === 'Pipeline' ? {} : { view: next }, { replace: true })
    }
  }

  const { data, error, isLoading, refetch } = useApiResource(() => adminService.getOperations(mode), [mode])
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
        <ScheduledDispatchBoard data={data} view={view} onViewChange={onViewChange} />
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
              return (
                <section key={column.key} className="min-h-[548px] min-w-[230px] rounded-lg bg-[#f1f4f1] p-2.5">
                  <div className="mb-2 flex h-6 items-center gap-2 px-1">
                    <span className="h-2 w-2 rounded-full" style={{ background: column.tone }} />
                    <h3 className="text-[10px] font-bold">{column.title}</h3>
                    <span className="rounded-full bg-white px-2 py-0.5 text-[9px] text-[#6d7871]">{cards.length}</span>
                    <span className="flex-1" />
                    {mode === 'scheduled' ? (
                      <Link
                        to={`/admin/scheduled/${column.key}`}
                        className="grid h-5 w-5 place-items-center rounded bg-white text-[#738078] hover:text-[#17231c]"
                        aria-label={`Open ${column.title} page`}
                        title={`Open ${column.title}`}
                      >
                        <ArrowUpRight size={11} />
                      </Link>
                    ) : (
                      <button className="grid h-5 w-5 place-items-center rounded bg-white text-[#738078]"><ArrowUpRight size={11} /></button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {cards.map((order, index) => <OrderCard key={`${column.key}-${order.id}-${index}`} order={order} mode={mode} />)}
                  </div>
                </section>
              )
            })}
          </div>
          <IncidentLog incidents={data.incidents} />
        </>
      )}
      {view === 'Calendar' && mode === 'scheduled' ? null : <ChatStrip chats={data.chats} />}
    </div>
  )
}

const calendarDays = [
  { key: 'mon', label: 'Mon 29 Jun' },
  { key: 'tue', label: 'Tue 30 Jun' },
  { key: 'wed', label: 'Wed 1 Jul' },
  { key: 'thu', label: 'Thu 2 Jul' },
  { key: 'fri', label: 'Fri 3 Jul' },
  { key: 'sat', label: 'Sat 4 Jul' },
  { key: 'sun', label: 'Sun 5 Jul' },
]

const calendarOrders = [
  {
    id: '#YJK-8001',
    store: 'Green store',
    place: 'Manama · 0322',
    type: 'Same day',
    slots: { mon: { kind: 'assigned', champ: 'Champ A', window: '2-4 PM' }, tue: 'assign', wed: 'assign', thu: 'empty', fri: 'assign', sat: 'assign', sun: 'empty' },
  },
  {
    id: '#YJK-8002',
    store: 'Lulu Express',
    place: 'Muharraq · 0214',
    type: 'Next day',
    slots: { mon: 'assign', tue: 'assign', wed: 'empty', thu: 'empty', fri: 'assign', sat: 'assign', sun: 'empty' },
  },
  {
    id: '#YJK-8003',
    store: 'City mart',
    place: 'Seef · 0428',
    type: 'Standard',
    slots: { mon: 'empty', tue: 'assign', wed: 'assign', thu: 'empty', fri: 'assign', sat: 'assign', sun: 'empty' },
  },
  {
    id: '#YJK-8004',
    store: 'Sharaf DG',
    place: 'Hidd · 0114',
    type: 'Economy',
    slots: { mon: 'empty', tue: 'empty', wed: 'assign', thu: 'empty', fri: 'assign', sat: 'assign', sun: 'assign' },
  },
  {
    id: '#YJK-8005',
    store: 'Daily needs',
    place: 'Isa Town · 0733',
    type: 'Same day',
    slots: { mon: 'empty', tue: 'empty', wed: 'empty', thu: 'empty', fri: 'assign', sat: 'assign', sun: 'assign' },
  },
  {
    id: '#YJK-8006',
    store: 'Quick shop',
    place: 'Sitra · 0550',
    type: 'Next day',
    slots: { mon: 'empty', tue: 'empty', wed: 'empty', thu: 'empty', fri: 'assign', sat: 'assign', sun: 'empty' },
  },
]

const calendarFilterConfig = {
  Governorates: [
    { id: 'capital', label: 'Capital', count: 12 },
    { id: 'muharraq', label: 'Muharraq', count: 7 },
    { id: 'northern', label: 'Northern', count: 0 },
    { id: 'southern', label: 'Southern', count: 0 },
  ],
  Cities: [
    { id: 'manama', label: 'Manama', count: 12 },
    { id: 'muharraq-city', label: 'Muharraq', count: 5 },
    { id: 'seef', label: 'Seef', count: 2 },
    { id: 'arad', label: 'Arad', count: 2 },
    { id: 'juffair', label: 'Juffair', count: 0 },
    { id: 'riffa', label: 'Riffa', count: 1 },
    { id: 'isa', label: 'Isa Town', count: 0 },
  ],
  Blocks: [
    { id: 'b0322', label: 'Block 0322', sub: 'Manama', count: 8 },
    { id: 'b0214', label: 'Block 0214', sub: 'Muharraq', count: 8 },
    { id: 'b0428', label: 'Block 0428', sub: 'Seef', count: 1 },
    { id: 'b0911', label: 'Block 0911', sub: 'Riffa', count: 1 },
    { id: 'b0346', label: 'Block 0346', sub: 'Manama', count: 0 },
    { id: 'b0733', label: 'Block 0733', sub: 'Isa Town', count: 0 },
  ],
}

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

function CalendarFilterDropdown({ title, items, selected, onToggle, open, onToggleOpen }) {
  const [query, setQuery] = useState('')
  const selectedCount = selected.length
  const visible = items.filter((item) => item.label.toLowerCase().includes(query.toLowerCase()) || item.sub?.toLowerCase().includes(query.toLowerCase()))
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
            {visible.map((item) => {
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

function ScheduledCalendarDispatch({ view, onViewChange }) {
  const navigate = useNavigate()
  const [openFilters, setOpenFilters] = useState(() => new Set())
  const [selected, setSelected] = useState({
    Governorates: ['capital', 'muharraq'],
    Cities: ['manama', 'muharraq-city', 'seef', 'arad'],
    Blocks: ['b0322', 'b0214', 'b0428', 'b0911'],
  })

  const toggleItem = (group, id) => {
    setSelected((current) => {
      const list = current[group]
      return {
        ...current,
        [group]: list.includes(id) ? list.filter((item) => item !== id) : [...list, id],
      }
    })
  }

  const toggleOpen = (title) => {
    setOpenFilters((current) => {
      const next = new Set(current)
      if (next.has(title)) next.delete(title)
      else next.add(title)
      return next
    })
  }

  const openAssignChamp = (order, day) => {
    const orderId = order.id.replace(/^#/, '')
    const dayMap = {
      mon: 'thu-2',
      tue: 'thu-2',
      wed: 'thu-2',
      thu: 'thu-2',
      fri: 'fri-3',
      sat: 'sat-4',
      sun: 'sun-5',
    }
    const params = new URLSearchParams({
      day: dayMap[day.key] || 'thu-2',
      window: '2–4 PM',
    })
    navigate(`/admin/scheduled/assign/${encodeURIComponent(orderId)}?${params.toString()}`)
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <OperationsViewTabs view={view} onViewChange={onViewChange} />
      </div>

      <h2 className="text-[18px] font-bold tracking-[-0.02em] text-[#17231c]">Scheduled Orders · Dispatching</h2>

      <div className="mt-3 flex flex-wrap gap-2">
        {[
          ['Capital', 5],
          ['Muharraq', 5],
          ['Northern', 5],
          ['Southern', 9],
        ].map(([name, count]) => (
          <span key={name} className="inline-flex h-[28px] items-center gap-1.5 rounded-full border border-[#e2e6e3] bg-white px-3 text-[11px] font-medium text-[#455249]">
            {name}
            <i className="grid h-[18px] min-w-[18px] place-items-center rounded-full bg-[#f4c76a] px-1 text-[10px] not-italic font-bold leading-none text-[#7a4e08]">{count}</i>
          </span>
        ))}
      </div>

      <section className="relative mt-4 overflow-visible rounded-[16px] border border-[#e4e8e4] bg-white shadow-[0_1px_3px_rgba(20,40,28,.04)]">
        <div className="border-b border-[#e8ebe8] px-5 py-4">
          <h3 className="text-[15px] font-bold tracking-[-0.01em] text-[#17231c]">Orders × available delivery days</h3>
          <div className="mt-3.5 flex flex-wrap items-center gap-2">
            <CalendarFilterDropdown
              title="Governorates"
              items={calendarFilterConfig.Governorates}
              selected={selected.Governorates}
              onToggle={(id) => toggleItem('Governorates', id)}
              open={openFilters.has('Governorates')}
              onToggleOpen={() => toggleOpen('Governorates')}
            />
            <CalendarFilterDropdown
              title="Cities"
              items={calendarFilterConfig.Cities}
              selected={selected.Cities}
              onToggle={(id) => toggleItem('Cities', id)}
              open={openFilters.has('Cities')}
              onToggleOpen={() => toggleOpen('Cities')}
            />
            <CalendarFilterDropdown
              title="Blocks"
              items={calendarFilterConfig.Blocks}
              selected={selected.Blocks}
              onToggle={(id) => toggleItem('Blocks', id)}
              open={openFilters.has('Blocks')}
              onToggleOpen={() => toggleOpen('Blocks')}
            />
            {['Champ', 'Type', 'Vendor'].map((filter) => (
              <button key={filter} type="button" className="inline-flex h-[30px] items-center gap-1 rounded-full border border-[#d7ddd8] bg-white px-3 text-[11px] transition">
                <span className="font-medium text-[#6a746e]">{filter}</span>
                <span className="font-bold text-[#17231c]">· All</span>
                ▾
              </button>
            ))}
            <span className="flex-1" />
            <label className="flex h-[30px] min-w-[160px] items-center gap-2 rounded-full border border-[#e2e6e3] bg-[#f3f5f3] px-3">
              <Search size={13} className="text-[#8a948e]" />
              <input className="min-w-0 flex-1 border-0 bg-transparent text-[11px] text-[#314039] outline-none placeholder:text-[#8a948e]" placeholder="Search order" />
            </label>
          </div>
          <div className="mt-2.5">
            <button type="button" className="inline-flex h-[28px] items-center gap-1 rounded-full border border-[#d7ddd8] bg-white px-3 text-[11px] font-medium text-[#455249]">
              Sort ▾
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-b-[16px]">
          <table className="w-full min-w-[1020px] border-collapse text-left">
            <thead>
              <tr className="bg-[#f7f8f7]">
                <th className="w-[168px] border-b border-r border-[#e8ebe8] px-4 py-3 text-[10px] font-semibold uppercase tracking-[.06em] text-[#8a948e]">Order</th>
                {calendarDays.map((day) => (
                  <th key={day.key} className="border-b border-r border-[#e8ebe8] px-2 py-3 text-center text-[12px] font-bold text-[#1a2420] last:border-r-0">{day.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {calendarOrders.map((order) => (
                <tr key={order.id} className="last:[&>td]:border-b-0">
                  <td className="border-b border-r border-[#e8ebe8] px-4 py-4 align-top">
                    <p className="text-[12px] font-bold leading-none text-[#17231c]">{order.id}</p>
                    <p className="mt-1.5 text-[12px] font-semibold leading-none text-[#16854a]">{order.store}</p>
                    <p className="mt-1.5 text-[11px] leading-none text-[#7a847e]">{order.place}</p>
                    <p className="mt-1.5 text-[11px] leading-none text-[#7a847e]">{order.type}</p>
                  </td>
                  {calendarDays.map((day) => (
                    <td key={day.key} className="border-b border-r border-[#e8ebe8] px-2 py-3.5 text-center align-middle last:border-r-0">
                      <div className="flex min-h-[38px] items-center justify-center">
                        <CalendarSlotCell
                          slot={order.slots[day.key]}
                          onAssign={() => openAssignChamp(order, day)}
                        />
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
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

function ScheduledDispatchBoard({ data, view, onViewChange }) {
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
                {dispatchRows.map((order, index) => (
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
                    <td className="px-1"><button className="text-[9px] font-medium text-[#16854a]">View</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <IncidentLog incidents={[
          ...data.incidents.slice(0, 3),
          { priority: 'P4', name: 'Address unclear', detail: '#YJK-…48 · clarified', status: 'Resolved', time: '2h' },
        ]} countLabel="5 today" />
      </div>

      <aside className="space-y-3">
        <DispatchSummary title="Ops snapshot · Today">
          {[['Scheduled today', '18'], ['Unassigned', '5'], ['Re-confirm pending', '2']].map(([label, value]) => (
            <SummaryRow key={label} label={label} value={value} alert={label === 'Unassigned'} warning={label === 'Re-confirm pending'} />
          ))}
        </DispatchSummary>
        <DispatchSummary title="Windows today">
          {[['1–3 PM', '4 orders'], ['3–5 PM', '2 orders'], ['6–8 PM', '9 orders'], ['8–10 PM', '3 orders']].map(([label, value]) => (
            <SummaryRow key={label} label={label} value={value} pill />
          ))}
        </DispatchSummary>
        <DispatchSummary title="Champ capacity">
          <SummaryRow label="Available tonight" value="12" success />
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
