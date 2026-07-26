import { useMemo, useState } from 'react'
import { Calendar, ChevronDown, Download, Search, Star } from 'lucide-react'
import { cn } from '../../../components/admin/cn'

const PAGE_SIZE_OPTIONS = [10, 50, 100]
const TOTAL_ORDERS = 18420

const STATS = [
  { label: 'Total orders', value: '18,420', tone: 'ink' },
  { label: 'Delivered', value: '16,980', tone: 'green' },
  { label: 'Cancelled', value: '820', tone: 'red' },
  { label: 'GMV', value: 'BHD 90.4k', tone: 'green' },
  { label: 'AOV', value: 'BHD 4.9', tone: 'ink' },
  { label: 'On-time', value: '94%', tone: 'green' },
  { label: 'Avg delivery', value: '24 min', tone: 'ink' },
  { label: 'Refunds', value: 'BHD 2.1k', tone: 'orange' },
]

const COLUMNS = [
  'Order',
  'Date',
  'Time',
  'Mode',
  'Tier',
  'Customer',
  'Store',
  'Branch',
  'City',
  'Block',
  'Champ',
  'Vehicle',
  'Pickup km',
  'Drop-off km',
  'Total km',
  'Items',
  'Value',
  'Pay method',
  'Pay status',
  'Placed',
  'Accepted',
  'Prep',
  'Ready',
  'Picked',
  'On-way',
  'Delivered',
  'SLA',
  'Rating',
  'Status',
]

const ROWS = [
  {
    id: '#YJK-7791',
    date: '30 Jun',
    time: '13:42',
    mode: 'Hot food',
    tier: 'On demand',
    customer: 'Sara A.',
    store: 'Burger Hub',
    branch: 'Seef',
    city: 'Manama',
    block: '428',
    champ: 'Ali H.',
    vehicle: 'Bike',
    pickupKm: '1.2',
    dropoffKm: '3.0',
    totalKm: '4.2',
    items: 3,
    value: 'BHD 8.400',
    payMethod: 'Card',
    payStatus: 'Paid',
    placed: '13:42',
    accepted: '13:43',
    prep: '13:51',
    ready: '13:55',
    picked: '13:58',
    onWay: '14:01',
    delivered: '14:12',
    sla: 'On-time',
    rating: '4.8',
    status: 'Delivered',
  },
  {
    id: '#YJK-7790',
    date: '30 Jun',
    time: '13:18',
    mode: 'Pickup',
    tier: 'Same day',
    customer: 'Omar K.',
    store: 'Fresh Mart',
    branch: 'Juffair',
    city: 'Manama',
    block: '318',
    champ: '—',
    vehicle: '—',
    pickupKm: '—',
    dropoffKm: '—',
    totalKm: '—',
    items: 6,
    value: 'BHD 12.200',
    payMethod: 'Wallet',
    payStatus: 'Paid',
    placed: '13:18',
    accepted: '13:19',
    prep: '13:28',
    ready: '13:34',
    picked: '—',
    onWay: '—',
    delivered: '13:41',
    sla: 'On-time',
    rating: '4.6',
    status: 'Delivered',
  },
  {
    id: '#YJK-7789',
    date: '30 Jun',
    time: '12:55',
    mode: 'Services',
    tier: 'Standard',
    customer: 'Noor M.',
    store: 'Glow Spa',
    branch: 'Amwaj',
    city: 'Muharraq',
    block: '210',
    champ: 'Hassan R.',
    vehicle: 'Car',
    pickupKm: '2.1',
    dropoffKm: '4.4',
    totalKm: '6.5',
    items: 1,
    value: 'BHD 18.000',
    payMethod: 'Card',
    payStatus: 'Pending',
    placed: '12:55',
    accepted: '12:58',
    prep: '13:10',
    ready: '13:20',
    picked: '13:25',
    onWay: '13:28',
    delivered: '—',
    sla: 'Late',
    rating: '—',
    status: 'Cancelled',
  },
  {
    id: '#YJK-7788',
    date: '30 Jun',
    time: '12:31',
    mode: 'Hot food',
    tier: 'On demand',
    customer: 'Layla S.',
    store: 'Pizza Corner',
    branch: 'Riffa',
    city: 'Riffa',
    block: '905',
    champ: 'Yousef N.',
    vehicle: 'Bike',
    pickupKm: '0.8',
    dropoffKm: '2.4',
    totalKm: '3.2',
    items: 2,
    value: 'BHD 6.750',
    payMethod: 'COD',
    payStatus: 'Paid',
    placed: '12:31',
    accepted: '12:32',
    prep: '12:40',
    ready: '12:45',
    picked: '12:48',
    onWay: '12:50',
    delivered: '13:02',
    sla: 'On-time',
    rating: '4.9',
    status: 'Delivered',
  },
  {
    id: '#YJK-7787',
    date: '30 Jun',
    time: '12:04',
    mode: 'Grocery',
    tier: 'Next day',
    customer: 'Faisal B.',
    store: 'Daily Basket',
    branch: 'Isa Town',
    city: 'Isa Town',
    block: '712',
    champ: 'Khalid M.',
    vehicle: 'Car',
    pickupKm: '1.5',
    dropoffKm: '5.1',
    totalKm: '6.6',
    items: 11,
    value: 'BHD 22.900',
    payMethod: 'Wallet',
    payStatus: 'Refunded',
    placed: '12:04',
    accepted: '12:06',
    prep: '12:25',
    ready: '12:40',
    picked: '12:48',
    onWay: '12:52',
    delivered: '13:20',
    sla: 'Late',
    rating: '3.9',
    status: 'Refunded',
  },
  {
    id: '#YJK-7786',
    date: '29 Jun',
    time: '21:18',
    mode: 'Hot food',
    tier: 'On demand',
    customer: 'Huda A.',
    store: 'Sushi Lab',
    branch: 'Seef',
    city: 'Manama',
    block: '428',
    champ: 'Ali H.',
    vehicle: 'Bike',
    pickupKm: '1.1',
    dropoffKm: '2.8',
    totalKm: '3.9',
    items: 4,
    value: 'BHD 15.600',
    payMethod: 'Card',
    payStatus: 'Paid',
    placed: '21:18',
    accepted: '21:19',
    prep: '21:30',
    ready: '21:36',
    picked: '21:39',
    onWay: '21:41',
    delivered: '21:55',
    sla: 'On-time',
    rating: '5.0',
    status: 'Delivered',
  },
  {
    id: '#YJK-7785',
    date: '29 Jun',
    time: '20:42',
    mode: 'Pharmacy',
    tier: 'Same day',
    customer: 'Rami T.',
    store: 'Care Plus',
    branch: 'Budaiya',
    city: 'Northern',
    block: '554',
    champ: 'Nasser J.',
    vehicle: 'Bike',
    pickupKm: '0.6',
    dropoffKm: '3.7',
    totalKm: '4.3',
    items: 2,
    value: 'BHD 5.250',
    payMethod: 'Card',
    payStatus: 'Paid',
    placed: '20:42',
    accepted: '20:43',
    prep: '20:48',
    ready: '20:51',
    picked: '20:54',
    onWay: '20:56',
    delivered: '21:08',
    sla: 'On-time',
    rating: '4.7',
    status: 'Delivered',
  },
  {
    id: '#YJK-7784',
    date: '29 Jun',
    time: '19:55',
    mode: 'Hot food',
    tier: 'Economy',
    customer: 'Maya D.',
    store: 'Taco Street',
    branch: 'Muharraq',
    city: 'Muharraq',
    block: '208',
    champ: 'Hassan R.',
    vehicle: 'Bike',
    pickupKm: '1.8',
    dropoffKm: '4.0',
    totalKm: '5.8',
    items: 5,
    value: 'BHD 9.100',
    payMethod: 'COD',
    payStatus: 'Pending',
    placed: '19:55',
    accepted: '19:58',
    prep: '20:10',
    ready: '20:18',
    picked: '20:22',
    onWay: '20:25',
    delivered: '—',
    sla: 'Late',
    rating: '—',
    status: 'Cancelled',
  },
  {
    id: '#YJK-7783',
    date: '29 Jun',
    time: '18:20',
    mode: 'Dine-in',
    tier: 'On demand',
    customer: 'Zainab F.',
    store: 'Cafe Nova',
    branch: 'Adliya',
    city: 'Manama',
    block: '338',
    champ: '—',
    vehicle: '—',
    pickupKm: '—',
    dropoffKm: '—',
    totalKm: '—',
    items: 2,
    value: 'BHD 7.800',
    payMethod: 'Wallet',
    payStatus: 'Paid',
    placed: '18:20',
    accepted: '18:21',
    prep: '18:28',
    ready: '18:35',
    picked: '—',
    onWay: '—',
    delivered: '18:40',
    sla: 'On-time',
    rating: '4.5',
    status: 'Delivered',
  },
  {
    id: '#YJK-7782',
    date: '29 Jun',
    time: '17:05',
    mode: 'Flowers',
    tier: 'Same day',
    customer: 'Ahmed Q.',
    store: 'Bloom Co',
    branch: 'Diplomatic',
    city: 'Manama',
    block: '317',
    champ: 'Yousef N.',
    vehicle: 'Car',
    pickupKm: '2.4',
    dropoffKm: '3.1',
    totalKm: '5.5',
    items: 1,
    value: 'BHD 28.000',
    payMethod: 'Card',
    payStatus: 'Paid',
    placed: '17:05',
    accepted: '17:07',
    prep: '17:20',
    ready: '17:30',
    picked: '17:35',
    onWay: '17:38',
    delivered: '17:55',
    sla: 'On-time',
    rating: '4.9',
    status: 'Delivered',
  },
]

const FILTERS = [
  { key: 'status', label: 'Status', options: ['Status · All', 'Delivered', 'Cancelled', 'Refunded'] },
  { key: 'type', label: 'Type', options: ['Type · All', 'Hot food', 'Pickup', 'Services', 'Grocery'] },
  { key: 'vendor', label: 'Vendor', options: ['Vendor · All', 'Burger Hub', 'Fresh Mart', 'Glow Spa'] },
  { key: 'zone', label: 'Zone', options: ['Zone · All', 'Manama', 'Muharraq', 'Riffa'] },
  { key: 'champ', label: 'Champ', options: ['Champ · All', 'Ali H.', 'Hassan R.', 'Yousef N.'] },
  { key: 'payment', label: 'Payment', options: ['Payment · All', 'Card', 'Wallet', 'COD'] },
  { key: 'sla', label: 'SLA', options: ['SLA · All', 'On-time', 'Late'] },
]

const statTone = {
  ink: 'text-[#17231c]',
  green: 'text-[#1aa054]',
  red: 'text-[#d6453d]',
  orange: 'text-[#c4841a]',
}

const reportBadgeTone = {
  green: 'bg-[#e6f4ea] text-[#137333]',
  purple: 'bg-[#f3e8ff] text-[#6b21a8]',
  yellow: 'bg-[#fef3c7] text-[#92400e]',
  red: 'bg-[#fee2e2] text-[#b91c1c]',
  gray: 'bg-[#eff2f0] text-[#8a948e]',
}

function payStatusTone(value) {
  if (value === 'Paid') return 'green'
  if (value === 'Pending') return 'yellow'
  if (value === 'Refunded') return 'purple'
  return 'gray'
}

function orderStatusTone(value) {
  if (value === 'Delivered') return 'green'
  if (value === 'Cancelled') return 'red'
  if (value === 'Refunded') return 'purple'
  return 'gray'
}

function slaBadgeTone(value) {
  if (value === 'On-time') return 'green'
  if (value === 'Late') return 'yellow'
  return 'gray'
}

function ReportBadge({ children, tone = 'gray' }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-[3px] text-[11px] font-semibold',
        reportBadgeTone[tone] || reportBadgeTone.gray,
      )}
    >
      {children}
    </span>
  )
}

function TimeCell({ value }) {
  return (
    <td className="whitespace-nowrap px-3 py-2.5">
      {value === '—' ? (
        <span className="text-[#9aa39c]">—</span>
      ) : (
        <span className="font-bold text-[#137333]">{value}</span>
      )}
    </td>
  )
}

function StatusBadge({ value, toneFn }) {
  if (!value || value === '—') {
    return <ReportBadge tone="gray">—</ReportBadge>
  }
  return <ReportBadge tone={toneFn(value)}>{value}</ReportBadge>
}

function FilterSelect({ options, value, onChange, label }) {
  return (
    <div className="relative inline-flex h-[34px] shrink-0 items-center rounded-full border border-[#e4e8e4] bg-white pl-3 pr-7 text-[12px] font-medium text-[#455249]">
      <span className="whitespace-nowrap">{value}</span>
      <ChevronDown
        size={13}
        strokeWidth={2.2}
        className="pointer-events-none absolute right-2.5 text-[#7c8780]"
        aria-hidden
      />
      <select
        aria-label={label}
        className="absolute inset-0 h-full w-full cursor-pointer appearance-none opacity-0 outline-none"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  )
}

function DateFilter({ label, value, onChange }) {
  return (
    <label className="relative inline-flex h-[34px] shrink-0 items-center gap-2 rounded-full border border-[#e4e8e4] bg-white pl-3 pr-3 text-[12px] font-medium text-[#455249]">
      <span className="whitespace-nowrap text-[#7c8780]">{label}</span>
      <span className="whitespace-nowrap">{value}</span>
      <Calendar size={13} strokeWidth={2.2} className="text-[#7c8780]" aria-hidden />
      <input
        type="date"
        aria-label={label}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0 outline-none"
        onChange={(event) => {
          if (!event.target.value) return
          const date = new Date(`${event.target.value}T00:00:00`)
          onChange(
            date.toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
            }),
          )
        }}
      />
    </label>
  )
}

function pageNumbers(current, total) {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1)
  if (current <= 3) return [1, 2, 3, '…', total]
  if (current >= total - 2) return [1, '…', total - 2, total - 1, total]
  return [1, '…', current, '…', total]
}

export default function AdminReportsPage() {
  const [period, setPeriod] = useState('Last 30 days')
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState(
    Object.fromEntries(FILTERS.map((item) => [item.key, item.options[0]])),
  )
  const [fromDate, setFromDate] = useState('01 Jun')
  const [toDate, setToDate] = useState('30 Jun')
  const [sort, setSort] = useState('Sort: Newest')
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(1)

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return ROWS.filter((row) => {
      if (q) {
        const haystack = [row.id, row.customer, row.store, row.champ, row.branch].join(' ').toLowerCase()
        if (!haystack.includes(q)) return false
      }
      if (filters.status !== 'Status · All' && row.status !== filters.status) return false
      if (filters.type !== 'Type · All' && row.mode !== filters.type) return false
      if (filters.vendor !== 'Vendor · All' && row.store !== filters.vendor) return false
      if (filters.zone !== 'Zone · All' && row.city !== filters.zone) return false
      if (filters.champ !== 'Champ · All' && row.champ !== filters.champ) return false
      if (filters.payment !== 'Payment · All' && row.payMethod !== filters.payment) return false
      if (filters.sla !== 'SLA · All' && row.sla !== filters.sla) return false
      return true
    })
  }, [filters, query])

  const totalPages = Math.max(1, Math.ceil(TOTAL_ORDERS / pageSize))
  const shownFrom = (page - 1) * pageSize + 1
  const shownTo = Math.min(page * pageSize, TOTAL_ORDERS)
  const visibleRows = filteredRows.slice(0, Math.min(pageSize, filteredRows.length))

  return (
    <div className="px-5 py-4 pb-8 max-[700px]:px-3">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[20px] font-bold tracking-[-0.02em] text-[#17231c]">Orders report</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <FilterSelect
            label="Period"
            value={`Period · ${period}`}
            options={['Period · Last 7 days', 'Period · Last 30 days', 'Period · Last 90 days', 'Period · This year']}
            onChange={(value) => setPeriod(value.replace(/^Period · /, ''))}
          />
          <button
            type="button"
            className="inline-flex h-[34px] items-center gap-1.5 rounded-full bg-[#1aa054] px-4 text-[12.5px] font-bold text-white shadow-[0_1px_2px_rgba(20,40,28,.15)] hover:bg-[#158a47]"
          >
            <Download size={14} strokeWidth={2.2} />
            Export
          </button>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-8 gap-2.5 max-[1400px]:grid-cols-4 max-[800px]:grid-cols-2 max-[480px]:grid-cols-1">
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className="rounded-[14px] border border-[#eceeec] bg-white px-3.5 py-3 shadow-[0_1px_2px_rgba(20,40,28,.03)]"
          >
            <p className={cn('text-[20px] font-bold tracking-[-0.02em]', statTone[stat.tone])}>{stat.value}</p>
            <p className="mt-1 text-[11.5px] text-[#7c8780]">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="mb-3 rounded-[14px] border border-[#eceeec] bg-white p-3 shadow-[0_1px_2px_rgba(20,40,28,.03)]">
        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex h-[34px] min-w-[220px] flex-1 items-center gap-2 rounded-full border border-[#e4e8e4] bg-white px-3 text-[12px] text-[#455249] max-[700px]:min-w-full">
            <Search size={14} className="shrink-0 text-[#7c8780]" />
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                setPage(1)
              }}
              className="min-w-0 flex-1 border-0 bg-transparent outline-none placeholder:text-[#9aa39c]"
              placeholder="Search order, customer, vendor, champ…"
            />
          </label>

          {FILTERS.map((filter) => (
            <FilterSelect
              key={filter.key}
              label={filter.label}
              options={filter.options}
              value={filters[filter.key]}
              onChange={(value) => {
                setFilters((prev) => ({ ...prev, [filter.key]: value }))
                setPage(1)
              }}
            />
          ))}

          <DateFilter label="From" value={fromDate} onChange={setFromDate} />
          <DateFilter label="To" value={toDate} onChange={setToDate} />
        </div>

        <div className="mt-2">
          <FilterSelect
            label="Sort"
            value={sort}
            options={['Sort: Newest', 'Sort: Oldest', 'Sort: Highest value', 'Sort: Lowest value']}
            onChange={setSort}
          />
        </div>
      </div>

      <section className="overflow-hidden rounded-[14px] border border-[#eceeec] bg-white shadow-[0_1px_2px_rgba(20,40,28,.03)]">
        <div className="w-full max-w-full overflow-x-auto overscroll-x-contain touch-pan-x [-webkit-overflow-scrolling:touch]">
          <table className="w-full min-w-[2200px] border-collapse text-left">
            <thead>
              <tr className="border-b border-[#edf0ee] bg-[#f6f8f6]">
                {COLUMNS.map((column) => (
                  <th
                    key={column}
                    className="whitespace-nowrap px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.05em] text-[#8a948e]"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => (
                <tr
                  key={row.id}
                  className="cursor-pointer border-b border-[#edf0ee] text-[12px] text-[#455249] hover:bg-[#f8faf8]"
                >
                  <td className="whitespace-nowrap px-3 py-2.5 font-semibold ">{row.id}</td>
                  <td className="whitespace-nowrap px-3 py-2.5">{row.date}</td>
                  <td className="whitespace-nowrap px-3 py-2.5">{row.time}</td>
                  <td className="whitespace-nowrap px-3 py-2.5">{row.mode}</td>
                  <td className="whitespace-nowrap px-3 py-2.5">{row.tier}</td>
                  <td className="whitespace-nowrap px-3 py-2.5">{row.customer}</td>
                  <td className="whitespace-nowrap px-3 py-2.5">{row.store}</td>
                  <td className="whitespace-nowrap px-3 py-2.5">{row.branch}</td>
                  <td className="whitespace-nowrap px-3 py-2.5">{row.city}</td>
                  <td className="whitespace-nowrap px-3 py-2.5">{row.block}</td>
                  <td className="whitespace-nowrap px-3 py-2.5">{row.champ}</td>
                  <td className="whitespace-nowrap px-3 py-2.5">{row.vehicle}</td>
                  <td className="whitespace-nowrap px-3 py-2.5">{row.pickupKm === '—' ? '—' : `${row.pickupKm} km`}</td>
                  <td className="whitespace-nowrap px-3 py-2.5">{row.dropoffKm === '—' ? '—' : `${row.dropoffKm} km`}</td>
                  <td className="whitespace-nowrap px-3 py-2.5">{row.totalKm === '—' ? '—' : `${row.totalKm} km`}</td>
                  <td className="whitespace-nowrap px-3 py-2.5">{row.items}</td>
                  <td className="whitespace-nowrap px-3 py-2.5 font-medium text-[#17231c]">{row.value}</td>
                  <td className="whitespace-nowrap px-3 py-2.5">{row.payMethod}</td>
                  <td className="whitespace-nowrap px-3 py-2.5">
                    <StatusBadge value={row.payStatus} toneFn={payStatusTone} />
                  </td>
                  <TimeCell value={row.placed} />
                  <TimeCell value={row.accepted} />
                  <TimeCell value={row.prep} />
                  <TimeCell value={row.ready} />
                  <TimeCell value={row.picked} />
                  <TimeCell value={row.onWay} />
                  <TimeCell value={row.delivered} />
                  <td className="whitespace-nowrap px-3 py-2.5">
                    <StatusBadge value={row.sla} toneFn={slaBadgeTone} />
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5">
                    {row.rating === '—' ? (
                      <span className="text-[#9aa39c]">—</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-medium text-[#17231c]">
                        <Star size={11} className="fill-[#17231c] text-[#17231c]" />
                        {row.rating}
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5">
                    <StatusBadge value={row.status} toneFn={orderStatusTone} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#edf0ee] px-4 py-3">
          <p className="text-[11.5px] text-[#8a948e]">
            ← Scroll horizontally to see all columns · click a row for full order details →
          </p>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              className="inline-flex h-[30px] items-center rounded-[8px] border border-[#e4e8e4] bg-white px-2.5 text-[12px] font-semibold text-[#455249] disabled:cursor-not-allowed disabled:opacity-40 hover:bg-[#f8faf8]"
            >
              ‹ Prev
            </button>
            {pageNumbers(page, totalPages).map((item, index) =>
              item === '…' ? (
                <span key={`ellipsis-${index}`} className="px-1 text-[12px] text-[#8a948e]">
                  …
                </span>
              ) : (
                <button
                  key={item}
                  type="button"
                  onClick={() => setPage(item)}
                  className={cn(
                    'inline-flex h-[30px] min-w-[30px] items-center justify-center rounded-[8px] text-[12px] font-semibold transition',
                    page === item
                      ? 'bg-[#1aa054] text-white'
                      : 'border border-[#e4e8e4] bg-white text-[#455249] hover:bg-[#f8faf8]',
                  )}
                >
                  {item}
                </button>
              ),
            )}
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              className="inline-flex h-[30px] items-center rounded-[8px] border border-[#e4e8e4] bg-white px-2.5 text-[12px] font-semibold text-[#455249] disabled:cursor-not-allowed disabled:opacity-40 hover:bg-[#f8faf8]"
            >
              Next ›
            </button>
          </div>
        </div>
      </section>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px] text-[#7c8780]">
        <span>Rows per page:</span>
        {PAGE_SIZE_OPTIONS.map((size) => (
          <button
            key={size}
            type="button"
            onClick={() => {
              setPageSize(size)
              setPage(1)
            }}
            className={cn(
              'inline-flex h-[28px] min-w-[34px] items-center justify-center rounded-[8px] border px-2.5 text-[12px] font-bold transition',
              pageSize === size
                ? 'border-[#1aa054] bg-white text-[#1aa054]'
                : 'border-[#e4e8e4] bg-white text-[#69756d] hover:text-[#455249]',
            )}
          >
            {size}
          </button>
        ))}
        <span className="ml-1">
          Showing {shownFrom}–{shownTo} of {TOTAL_ORDERS.toLocaleString()}
        </span>
      </div>
    </div>
  )
}
