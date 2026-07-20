import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Bike, Car, Check, ChevronDown, Lock, Search, Star } from 'lucide-react'

const cn = (...parts) => parts.filter(Boolean).join(' ')

const FILTER_PILL = 'inline-flex h-[30px] items-center gap-1 rounded-full border border-[#dfe4e0] bg-white px-3 text-[10px] font-medium text-[#455249]'

const orderCatalog = {
  'YJK-8001': {
    id: '#YJK-8001',
    store: 'Green store',
    place: 'Manama · 0322',
    type: 'Same day',
    destination: 'Manama · Blk 0322 · Capital',
    windowNote: 'Same day: today only',
  },
  'YJK-8002': {
    id: '#YJK-8002',
    store: 'Lulu Express',
    place: 'Muharraq · 0214',
    type: 'Next day',
    destination: 'Muharraq · Blk 0214 · Muharraq',
    windowNote: 'Next day: tomorrow only',
  },
  'YJK-8003': {
    id: '#YJK-8003',
    store: 'City mart',
    place: 'Seef · 0428',
    type: 'Standard',
    destination: 'Seef · Blk 0428 · Capital',
    windowNote: 'Standard: today → +2 days',
  },
  'YJK-8004': {
    id: '#YJK-8004',
    store: 'Sharaf DG',
    place: 'Hidd · 0114',
    type: 'Economy',
    destination: 'Hidd · Blk 0114 · Southern',
    windowNote: 'Economy: today → +4 days',
  },
  'YJK-8005': {
    id: '#YJK-8005',
    store: 'Daily needs',
    place: 'Isa Town · 0733',
    type: 'Same day',
    destination: 'Isa Town · Blk 0733 · Northern',
    windowNote: 'Same day: today only',
  },
  'YJK-8006': {
    id: '#YJK-8006',
    store: 'Quick shop',
    place: 'Sitra · 0550',
    type: 'Next day',
    destination: 'Sitra · Blk 0550 · Southern',
    windowNote: 'Next day: tomorrow only',
  },
}

const deliveryDates = [
  { id: 'thu-2', label: 'Thu 2 Jul' },
  { id: 'fri-3', label: 'Fri 3 Jul' },
  { id: 'sat-4', label: 'Sat 4 Jul' },
  { id: 'sun-5', label: 'Sun 5 Jul' },
  { id: 'mon-6', label: 'Mon 6 Jul' },
]

const timeWindows = ['10–12 PM', '12–2 PM', '2–4 PM', '4–6 PM', '6–8 PM']

const champProfiles = [
  {
    id: 'DRV-2210',
    name: 'Sami R.',
    capacity: 5,
    gov: 'Southern',
    city: 'Riffa',
    block: '0905',
    tier: 'Gold',
    rating: 4.6,
    type: 'Full-time',
    vehicle: 'Car',
    allowed: true,
    dist: '0.8 km',
    jobsByDate: {
      'thu-2': [
        { id: '#YJK-7820', store: 'Lulu Express', dest: 'Riffa · Blk 0905', time: 'from 4:00 PM to 6:00 PM' },
        { id: '#YJK-7831', store: 'CityMeds', dest: 'Hidd · Blk 0114', time: 'from 6:00 PM to 8:00 PM' },
      ],
      'fri-3': [
        { id: '#YJK-7901', store: 'Green Kitchen', dest: 'Manama · Blk 0322', time: 'from 2:00 PM to 4:00 PM' },
        { id: '#YJK-7908', store: 'VEERA', dest: 'Juffair · Blk 0412', time: 'from 4:00 PM to 6:00 PM' },
        { id: '#YJK-7912', store: 'Sharaf DG', dest: 'Hidd · Blk 0114', time: 'from 6:00 PM to 8:00 PM' },
      ],
      'sat-4': [
        { id: '#YJK-8010', store: 'Lulu Express', dest: 'Riffa · Blk 0905', time: 'from 12:00 PM to 2:00 PM' },
      ],
      'sun-5': [],
      'mon-6': [
        { id: '#YJK-8102', store: 'City mart', dest: 'Seef · Blk 0428', time: 'from 10:00 AM to 12:00 PM' },
        { id: '#YJK-8105', store: 'Daily needs', dest: 'Isa Town · Blk 0733', time: 'from 2:00 PM to 4:00 PM' },
        { id: '#YJK-8111', store: 'Quick shop', dest: 'Sitra · Blk 0550', time: 'from 4:00 PM to 6:00 PM' },
        { id: '#YJK-8118', store: 'Fresh basket', dest: 'Riffa · Blk 0911', time: 'from 6:00 PM to 8:00 PM' },
      ],
    },
  },
  {
    id: 'DRV-2225',
    name: 'Noora F.',
    capacity: 5,
    gov: 'Southern',
    city: 'Riffa',
    block: '0905',
    tier: 'Silver',
    rating: 4.1,
    type: 'Freelance',
    vehicle: 'Bike',
    allowed: false,
    dist: '1.4 km',
    jobsByDate: {
      'thu-2': [
        { id: '#YJK-7805', store: 'Green Kitchen', dest: 'Manama · Blk 0322', time: 'from 12:00 PM to 2:00 PM' },
      ],
      'fri-3': [
        { id: '#YJK-7920', store: 'CityMeds', dest: 'Hidd · Blk 0114', time: 'from 12:00 PM to 2:00 PM' },
        { id: '#YJK-7926', store: 'Green store', dest: 'Manama · Blk 0322', time: 'from 4:00 PM to 6:00 PM' },
      ],
      'sat-4': [
        { id: '#YJK-8021', store: 'Sharaf DG', dest: 'Hidd · Blk 0114', time: 'from 10:00 AM to 12:00 PM' },
        { id: '#YJK-8024', store: 'Lulu Express', dest: 'Riffa · Blk 0905', time: 'from 12:00 PM to 2:00 PM' },
        { id: '#YJK-8029', store: 'City mart', dest: 'Seef · Blk 0428', time: 'from 2:00 PM to 4:00 PM' },
      ],
      'sun-5': [
        { id: '#YJK-8080', store: 'VEERA', dest: 'Juffair · Blk 0412', time: 'from 2:00 PM to 4:00 PM' },
      ],
      'mon-6': [],
    },
  },
  {
    id: 'DRV-2262',
    name: 'Yousef A.',
    capacity: 4,
    gov: 'Capital',
    city: 'Manama',
    block: '0322',
    tier: 'Elite',
    rating: 4.9,
    type: 'Partner',
    vehicle: 'Car',
    allowed: true,
    dist: '3.4 km',
    jobsByDate: {
      'thu-2': [
        { id: '#YJK-7860', store: 'Green store', dest: 'Manama · Blk 0322', time: 'from 2:00 PM to 4:00 PM' },
        { id: '#YJK-7862', store: 'Lulu Express', dest: 'Seef · Blk 0428', time: 'from 4:00 PM to 6:00 PM' },
        { id: '#YJK-7866', store: 'VEERA', dest: 'Adliya · Blk 0361', time: 'from 6:00 PM to 8:00 PM' },
      ],
      'fri-3': [
        { id: '#YJK-7930', store: 'City mart', dest: 'Seef · Blk 0428', time: 'from 12:00 PM to 2:00 PM' },
      ],
      'sat-4': [],
      'sun-5': [
        { id: '#YJK-8088', store: 'Sharaf DG', dest: 'Hidd · Blk 0114', time: 'from 10:00 AM to 12:00 PM' },
        { id: '#YJK-8091', store: 'CityMeds', dest: 'Seef · Blk 0428', time: 'from 2:00 PM to 4:00 PM' },
      ],
      'mon-6': [
        { id: '#YJK-8120', store: 'Green store', dest: 'Manama · Blk 0322', time: 'from 12:00 PM to 2:00 PM' },
      ],
    },
  },
  {
    id: 'DRV-2201',
    name: 'Khalid A.',
    capacity: 5,
    gov: 'Muharraq',
    city: 'Muharraq',
    block: '0214',
    tier: 'Gold',
    rating: 4.4,
    type: 'Full-time',
    vehicle: 'Car',
    allowed: true,
    dist: '4.8 km',
    jobsByDate: {
      'thu-2': [],
      'fri-3': [
        { id: '#YJK-7950', store: 'Lulu Express', dest: 'Muharraq · Blk 0214', time: 'from 4:00 PM to 6:00 PM' },
      ],
      'sat-4': [
        { id: '#YJK-8060', store: 'CityMeds', dest: 'Muharraq · Blk 0214', time: 'from 2:00 PM to 4:00 PM' },
        { id: '#YJK-8064', store: 'Green store', dest: 'Manama · Blk 0322', time: 'from 6:00 PM to 8:00 PM' },
      ],
      'sun-5': [
        { id: '#YJK-8100', store: 'Lulu Express', dest: 'Muharraq · Blk 0214', time: 'from 12:00 PM to 2:00 PM' },
        { id: '#YJK-8101', store: 'VEERA', dest: 'Adliya · Blk 0361', time: 'from 2:00 PM to 4:00 PM' },
      ],
      'mon-6': [
        { id: '#YJK-8130', store: 'Quick shop', dest: 'Sitra · Blk 0550', time: 'from 4:00 PM to 6:00 PM' },
        { id: '#YJK-8134', store: 'Daily needs', dest: 'Isa Town · Blk 0733', time: 'from 6:00 PM to 8:00 PM' },
      ],
    },
  },
]

function tierClass(tier) {
  if (tier === 'Gold') return 'bg-[#fff3d6] text-[#9a6d12]'
  if (tier === 'Elite') return 'bg-[#eee8ff] text-[#734dbf]'
  return 'bg-[#eff2f0] text-[#667069]'
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

function SelectField({ label, value, options, onChange }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-medium text-[#6f7973]">{label}</span>
      <span className="relative block">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-[38px] w-full appearance-none rounded-[8px] border border-[#dfe4e0] bg-white px-3 pr-8 text-[12px] font-medium text-[#17231c] outline-none"
        >
          {options.map((option) => (
            <option key={typeof option === 'string' ? option : option.id} value={typeof option === 'string' ? option : option.id}>
              {typeof option === 'string' ? option : option.label}
            </option>
          ))}
        </select>
        <ChevronDown size={13} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#8a948e]" />
      </span>
    </label>
  )
}

function ChampOrdersPopover({ champ, dateLabel, jobs, anchorRect, onMouseEnter, onMouseLeave }) {
  if (!anchorRect || typeof document === 'undefined') return null

  const left = Math.min(anchorRect.left, window.innerWidth - 376)
  const top = anchorRect.bottom + 6

  return createPortal(
    <div
      data-champ-popover
      className="fixed z-[9999] flex w-[360px] flex-col items-start gap-[9px] rounded-[12px] border-[1.2px] border-[#E0E3E0] bg-white px-[15px] py-[13px] shadow-[0px_8px_22px_rgba(0,0,0,0.18)]"
      style={{ left: Math.max(12, left), top }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="flex flex-col items-start gap-[2px]">
        <p className="text-[13px] font-bold leading-4 text-[#1C211F]">{champ.name} — orders on {dateLabel}</p>
        <p className="text-[11px] font-normal leading-[13px] text-[#6B736E]">{jobs.length} order(s) this date</p>
      </div>

      {jobs.length === 0 ? (
        <p className="w-full rounded-[8px] border border-[#E0E3E0] bg-[#F6F7F6] px-3 py-2.5 text-[11px] text-[#6B736E]">No orders on this date.</p>
      ) : (
        jobs.map((job) => (
          <article
            key={job.id}
            className="flex w-full flex-col items-start gap-1 self-stretch rounded-[8px] border border-[#E0E3E0] bg-[#F6F7F6] px-3 py-2.5"
          >
            <div className="flex w-full flex-row items-center gap-2">
              <span className="text-[12px] font-bold leading-[15px] text-[#1C211F]">{job.id}</span>
            </div>
            <div className="flex flex-row items-center gap-[5px]">
              <span className="text-[11px] leading-[13px] text-[#6B736E]" aria-hidden="true">🏬</span>
              <span className="text-[11.5px] font-semibold leading-[14px] text-[#1C211F]">
                {job.store} → {job.dest}
              </span>
            </div>
            <div className="flex w-full flex-row flex-wrap items-center gap-x-[14px] gap-y-1">
              <span className="inline-flex items-center gap-[5px]">
                <span className="text-[11px] leading-[13px] text-[#6B736E]" aria-hidden="true">🕒</span>
                <span className="text-[11.5px] font-semibold leading-[14px] text-[#127338]">{job.time}</span>
              </span>
              <span className="inline-flex items-center gap-[5px]">
                <span className="text-[11px] leading-[13px] text-[#6B736E]" aria-hidden="true">📅</span>
                <span className="text-[11.5px] font-semibold leading-[14px] text-[#127338]">{dateLabel}</span>
              </span>
            </div>
          </article>
        ))
      )}
    </div>,
    document.body,
  )
}

export function AdminAssignChamp() {
  const { orderId: rawId = 'YJK-8004' } = useParams()
  const [searchParams] = useSearchParams()
  const orderKey = decodeURIComponent(rawId).replace(/^#/, '')
  const order = orderCatalog[orderKey] || {
    id: `#${orderKey}`,
    store: 'Vendor',
    place: 'Manama · 0000',
    type: 'Standard',
    destination: 'Manama · Blk 0000 · Capital',
    windowNote: 'Standard: today → +2 days',
  }

  const initialDate = searchParams.get('day') || 'thu-2'
  const initialWindow = searchParams.get('window') || '2–4 PM'

  const [deliveryDate, setDeliveryDate] = useState(
    deliveryDates.some((d) => d.id === initialDate) ? initialDate : 'thu-2',
  )
  const [timeWindow, setTimeWindow] = useState(
    timeWindows.includes(initialWindow) ? initialWindow : '2–4 PM',
  )
  const [selectedChamp, setSelectedChamp] = useState('DRV-2210')
  const [query, setQuery] = useState('')
  const [hoverChamp, setHoverChamp] = useState(null)
  const [hoverRect, setHoverRect] = useState(null)
  const [pinnedChamp, setPinnedChamp] = useState(null)
  const hoverCloseTimer = useRef(null)

  const showPopover = (champId, el, { pin = false } = {}) => {
    if (hoverCloseTimer.current) {
      clearTimeout(hoverCloseTimer.current)
      hoverCloseTimer.current = null
    }
    const rect = el.getBoundingClientRect()
    const nextRect = {
      left: rect.left,
      bottom: rect.bottom,
      top: rect.top,
      right: rect.right,
    }
    setHoverChamp(champId)
    setHoverRect(nextRect)
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

  const selectedDateLabel = deliveryDates.find((d) => d.id === deliveryDate)?.label || deliveryDate

  const champs = useMemo(() => {
    const q = query.trim().toLowerCase()
    return champProfiles
      .map((champ) => {
        const jobs = champ.jobsByDate[deliveryDate] || []
        return {
          ...champ,
          jobs,
          orders: jobs.length,
          load: `${jobs.length} / ${champ.capacity}`,
          total: Object.values(champ.jobsByDate).reduce((sum, list) => sum + list.length, 0),
        }
      })
      .filter((champ) => {
        if (!q) return true
        return champ.name.toLowerCase().includes(q)
          || champ.id.toLowerCase().includes(q)
          || champ.city.toLowerCase().includes(q)
          || champ.gov.toLowerCase().includes(q)
      })
  }, [deliveryDate, query])

  const activePopoverId = pinnedChamp || hoverChamp
  const hoveredChamp = champs.find((champ) => champ.id === activePopoverId)

  return (
    <div className="px-7 py-[18px] max-[700px]:p-4">
      <div className="flex flex-wrap items-start gap-3">
        <Link
          to="/admin/scheduled?view=Calendar"
          className="inline-flex h-[34px] shrink-0 items-center gap-1.5 rounded-[8px] border border-[#dfe4e0] bg-white px-3 text-[12px] font-medium text-[#17231c] hover:bg-[#f7f9f7]"
        >
          <ArrowLeft size={14} /> Back
        </Link>
        <div className="min-w-0">
          <h2 className="text-[20px] font-bold tracking-[-0.02em] text-[#17231c]">Assign champ</h2>
          <p className="mt-1 text-[12px] text-[#6f7973]">
            Order {order.id} · {order.store} → {order.place} · {order.type}
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
          <LockedField label="Destination (where)" value={order.destination} />
          <LockedField label="Delivery type" value={order.type} />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 max-[800px]:grid-cols-1">
          <SelectField
            label="Delivery date"
            value={deliveryDate}
            options={deliveryDates}
            onChange={setDeliveryDate}
          />
          <SelectField
            label="Time window"
            value={timeWindow}
            options={timeWindows}
            onChange={setTimeWindow}
          />
        </div>

        <div className="mt-3 flex items-start gap-2 rounded-[8px] border border-[#d7e8f7] bg-[#eef6fd] px-3 py-2.5 text-[11px] text-[#2f6ea3]">
          <Lock size={13} className="mt-0.5 shrink-0 text-[#c9a227]" />
          <span>Only dates inside this order&apos;s delivery window are selectable ({order.windowNote}).</span>
        </div>
      </section>

      <section className="relative mt-4 overflow-visible rounded-[12px] border border-[#e4e8e4] bg-white shadow-[0_1px_3px_rgba(20,40,28,.04)]">
        <div className="border-b border-[#edf0ee] px-4 py-3">
          <h3 className="text-[14px] font-bold text-[#17231c]">Available champs</h3>
          <p className="mt-0.5 text-[11px] text-[#7a847e]">Load shown for {selectedDateLabel}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <label className="flex h-[30px] min-w-[170px] items-center gap-2 rounded-full border border-[#e2e6e3] bg-[#f3f5f3] px-3">
              <Search size={13} className="text-[#8a948e]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="min-w-0 flex-1 border-0 bg-transparent text-[11px] outline-none placeholder:text-[#8a948e]"
                placeholder="Search champ…"
              />
            </label>
            {['Governorate · All', 'City · All', 'Vehicle · All', 'Type · All', 'Tier · All', 'Allowed · All'].map((filter) => (
              <button key={filter} type="button" className={FILTER_PILL}>
                {filter} <ChevronDown size={10} />
              </button>
            ))}
            <span className="flex-1" />
            <button type="button" className={FILTER_PILL}>
              Sort · Nearest <ChevronDown size={10} />
            </button>
          </div>
        </div>

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
                        <span className="underline decoration-[#c5cdc7] decoration-dotted underline-offset-2 hover:text-[#16854a]">{champ.name}</span>
                        <span className="font-medium text-[#8a948e]"> · {champ.id}</span>
                      </button>
                    </td>
                    <td className="px-2 py-3">
                      <span className="inline-flex rounded-full bg-[#e5f5eb] px-2 py-0.5 text-[11px] font-bold text-[#24834e]">
                        {champ.load}
                      </span>
                    </td>
                    <td className="px-2 py-3 text-[11px] text-[#455249]">{champ.gov}</td>
                    <td className="px-2 py-3 text-[11px] text-[#455249]">{champ.city}</td>
                    <td className="px-2 py-3 text-[11px] text-[#455249]">{champ.block}</td>
                    <td className="px-2 py-3">
                      <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', tierClass(champ.tier))}>{champ.tier}</span>
                    </td>
                    <td className="px-2 py-3">
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#17231c]">
                        <Star size={11} className="fill-[#f0b429] text-[#f0b429]" /> {champ.rating}
                      </span>
                    </td>
                    <td className="px-2 py-3 text-[11px] text-[#455249]">{champ.type}</td>
                    <td className="px-2 py-3">
                      <span className="inline-flex items-center gap-1 text-[11px] text-[#455249]">
                        {champ.vehicle === 'Bike' ? <Bike size={12} /> : <Car size={12} />}
                        {champ.vehicle}
                      </span>
                    </td>
                    <td className="px-2 py-3">
                      <span className={cn(
                        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium',
                        champ.allowed ? 'bg-[#e5f5eb] text-[#24834e]' : 'bg-[#fdebec] text-[#c54749]',
                      )}>
                        {champ.allowed ? '✓ Allowed' : '✕ Not allowed'}
                      </span>
                    </td>
                    <td className="px-2 py-3 text-[11px] text-[#455249]">{champ.dist}</td>
                    <td className="px-2 py-3 pr-4 text-[12px] font-semibold text-[#17231c]">{champ.total}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
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

      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <Link
          to="/admin/scheduled?view=Calendar"
          className="relative z-0 inline-flex h-[36px] items-center rounded-[8px] border border-[#dfe4e0] bg-white px-4 text-[12px] font-medium text-[#17231c]"
        >
          Cancel
        </Link>
        <Link
          to="/admin/scheduled?view=Calendar"
          className="relative z-0 inline-flex h-[36px] items-center gap-1.5 rounded-[8px] bg-[#19ad5b] px-4 text-[12px] font-semibold text-white"
        >
          <Check size={14} strokeWidth={2.5} /> Confirm assignment
        </Link>
      </div>

      {hoveredChamp && hoverRect ? (
        <ChampOrdersPopover
          champ={hoveredChamp}
          dateLabel={selectedDateLabel}
          jobs={hoveredChamp.jobs}
          anchorRect={hoverRect}
          onMouseEnter={keepPopoverOpen}
          onMouseLeave={scheduleCloseHover}
        />
      ) : null}
    </div>
  )
}
