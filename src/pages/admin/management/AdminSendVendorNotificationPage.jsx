import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, ChevronLeft, MoreVertical, Plus, X } from 'lucide-react'
import { Badge } from '../../../components/admin/Badge'
import { cn } from '../../../components/admin/cn'

const AUDIENCE_OPTIONS = ['All vendors', 'By category', 'By status', 'Selected']
const MESSAGE_TYPES = ['Info', 'Promo', 'Alert', 'Policy']
const SCHEDULE_OPTIONS = ['Send now', 'Schedule later']
const VENDOR_OPTIONS = ['Green Kitchen', 'Lulu Express', 'CityMeds', 'Marina Café', 'Fresh Mart']
const DATE_RANGE_OPTIONS = ['Date range', 'Last 7 days', 'Last 30 days', 'This year']
const CHANNEL_FILTERS = ['All channels', 'Push', 'Email', 'SMS']

const HISTORY = [
  {
    id: 'ntf-ramadan',
    notification: 'Ramadan vendor program',
    type: 'Promo',
    audience: 'All vendors',
    channel: 'Push · Email',
    sentTo: '48',
    date: '2 Mar 2026',
    time: '09:00',
    status: 'Delivered',
  },
  {
    id: 'ntf-commission',
    notification: 'Commission policy update',
    type: 'Policy',
    audience: 'All vendors',
    channel: 'Email',
    sentTo: '52',
    date: '26 Feb 2026',
    time: '14:30',
    status: 'Delivered',
  },
  {
    id: 'ntf-pickup',
    notification: 'Pickup feature is live',
    type: 'Info',
    audience: 'By category: Food',
    channel: 'Push',
    sentTo: '31',
    date: '20 Feb 2026',
    time: '11:00',
    status: 'Delivered',
  },
  {
    id: 'ntf-payout-change',
    notification: 'Payout cycle change',
    type: 'Alert',
    audience: 'Selected',
    channel: 'Push · Email',
    sentTo: '12',
    date: '9 Apr 2026',
    time: '08:00',
    status: 'Scheduled',
  },
]

const labelClass = 'mb-1.5 block text-[12px] font-medium text-[#7c8780]'
const inputClass =
  'box-border h-[40px] w-full rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white px-3 text-[13px] text-[#17231c] outline-none transition placeholder:text-[#9aa49d] focus:border-[#1aa054]'

function Card({ title, children, className }) {
  return (
    <section
      className={cn(
        'rounded-[14px] border border-[#eceeec] bg-white p-5 shadow-[0_1px_2px_rgba(20,40,28,.03)] max-[700px]:p-4',
        className,
      )}
    >
      {title ? <h3 className="mb-4 text-[15px] font-bold text-[#17231c]">{title}</h3> : null}
      {children}
    </section>
  )
}

function Segmented({ options, value, onChange, className }) {
  return (
    <div
      className={cn(
        'inline-flex max-w-full flex-wrap items-center gap-1 rounded-[10px] bg-[#ebeceb] p-[4px]',
        className,
      )}
    >
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={cn(
            'h-[32px] shrink-0 rounded-[8px] px-3 text-[12.5px] whitespace-nowrap transition',
            value === option
              ? 'bg-white font-bold text-[#17231c] shadow-[0_1px_3px_rgba(20,40,28,.12)]'
              : 'font-medium text-[#69756d] hover:text-[#455249]',
          )}
        >
          {option}
        </button>
      ))}
    </div>
  )
}

function Toggle({ label, checked, onChange }) {
  return (
    <div className="flex items-center gap-2.5">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-[28px] w-[48px] shrink-0 rounded-full transition',
          checked ? 'bg-[#1aa054]' : 'bg-[#d5dbd7]',
        )}
      >
        <span
          className={cn(
            'absolute top-[3px] h-[22px] w-[22px] rounded-full bg-white shadow transition',
            checked ? 'left-[23px]' : 'left-[3px]',
          )}
        />
      </button>
      <span className="text-[13px] font-medium text-[#455249]">{label}</span>
    </div>
  )
}

function FilterChip({ icon, options, value, onChange, label }) {
  return (
    <div className="relative inline-flex h-[30px] items-center gap-1.5 rounded-full border border-[#e4e8e4] bg-white pl-3 pr-7 text-[12px] font-medium text-[#455249] transition hover:bg-[#f6f8f6]">
      {icon ? (
        <span className="text-[12px] leading-none" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      <span className="whitespace-nowrap">{value}</span>
      <ChevronDown
        size={12}
        strokeWidth={2.2}
        className="pointer-events-none absolute right-2.5 text-[#7c8780]"
        aria-hidden
      />
      <select
        aria-label={label}
        className="absolute inset-0 h-full w-full cursor-pointer appearance-none border-0 bg-transparent p-0 opacity-0 outline-none"
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

function historyTone(status) {
  if (status === 'Delivered') return 'green'
  if (status === 'Scheduled') return 'yellow'
  return 'gray'
}

export default function AdminSendVendorNotificationPage() {
  const navigate = useNavigate()
  const goBack = () => navigate('/admin/marketing')

  const [audience, setAudience] = useState('All vendors')
  const [vendors, setVendors] = useState(['Green Kitchen', 'Lulu Express', 'CityMeds'])
  const [messageType, setMessageType] = useState('Info')
  const [title, setTitle] = useState('New: Ramadan vendor program')
  const [body, setBody] = useState('Enroll now to get featured placement during Ramadan…')
  const [push, setPush] = useState(true)
  const [email, setEmail] = useState(true)
  const [sms, setSms] = useState(false)
  const [schedule, setSchedule] = useState('Send now')
  const [date, setDate] = useState('9 Apr 2026')
  const [time, setTime] = useState('09:00')
  const [dateRange, setDateRange] = useState('Date range')
  const [channelFilter, setChannelFilter] = useState('All channels')

  function removeVendor(name) {
    setVendors((prev) => prev.filter((item) => item !== name))
  }

  function addVendor() {
    const next = VENDOR_OPTIONS.find((item) => !vendors.includes(item))
    if (next) setVendors((prev) => [...prev, next])
  }

  const visibleHistory = HISTORY.filter(
    (row) => channelFilter === 'All channels' || row.channel.includes(channelFilter),
  )

  return (
    <div className="px-5 pb-10 pt-4 max-[700px]:px-3">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={goBack}
          className="inline-flex h-[34px] shrink-0 items-center gap-1 rounded-full border border-[#e4e8e4] bg-white px-3 text-[13px] font-medium text-[#455249] shadow-[0_1px_2px_rgba(20,40,28,.04)] hover:bg-[#f6f8f6]"
        >
          <ChevronLeft size={15} strokeWidth={2.2} />
          Back
        </button>
        <div className="min-w-0">
          <h2 className="text-[20px] font-bold tracking-[-0.02em] text-[#17231c]">
            Send notification
          </h2>
          <p className="mt-0.5 text-[12.5px] text-[#7c8780]">
            Push a message to all vendors or a custom audience
          </p>
        </div>
      </div>

      <div className="mb-4 inline-flex items-center gap-1">
        {['Notifications', 'Promo codes'].map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => {
              navigate(item === 'Promo codes' ? '/admin/marketing/promo-codes' : '/admin/marketing')
            }}
            className={cn(
              'h-[34px] rounded-full px-4 text-[12.5px] font-bold transition',
              item === 'Notifications'
                ? 'bg-[#e8f7ed] text-[#1aa054]'
                : 'bg-white text-[#69756d] ring-1 ring-[#e4e8e4] hover:text-[#455249]',
            )}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="mb-4 grid grid-cols-[minmax(0,1.7fr)_minmax(260px,1fr)] items-start gap-4 max-[900px]:grid-cols-1">
        <div className="space-y-4">
          <Card title="Audience">
            <p className={labelClass}>Send to</p>
            <Segmented options={AUDIENCE_OPTIONS} value={audience} onChange={setAudience} />

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {vendors.map((vendor) => (
                <span
                  key={vendor}
                  className="inline-flex h-[30px] items-center gap-1.5 rounded-full border border-[#1aa054] bg-[#e8f7ed] px-2.5 text-[12px] font-bold text-[#147940]"
                >
                  {vendor}
                  <button
                    type="button"
                    aria-label={`Remove ${vendor}`}
                    onClick={() => removeVendor(vendor)}
                    className="grid h-4 w-4 place-items-center rounded-full text-[#147940] hover:bg-[#d8f0e0]"
                  >
                    <X size={11} strokeWidth={2.4} />
                  </button>
                </span>
              ))}
              <button
                type="button"
                onClick={addVendor}
                className="inline-flex h-[30px] items-center gap-1 rounded-full border border-[#1aa054] bg-white px-2.5 text-[12px] font-bold text-[#1aa054] hover:bg-[#e8f7ed]"
              >
                <Plus size={13} strokeWidth={2.4} />
                Add vendor
              </button>
            </div>

            <p className="mt-5 text-[12.5px] text-[#7c8780]">Estimated recipients</p>
          </Card>

          <Card title="Message">
            <p className={labelClass}>Type</p>
            <Segmented options={MESSAGE_TYPES} value={messageType} onChange={setMessageType} />

            <label className="mt-4 block">
              <span className={labelClass}>Title</span>
              <input
                className={inputClass}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </label>

            <label className="mt-3 block">
              <span className={labelClass}>Body</span>
              <textarea
                className="box-border min-h-[96px] w-full resize-y rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white px-3 py-2.5 text-[13px] text-[#17231c] outline-none transition placeholder:text-[#9aa49d] focus:border-[#1aa054]"
                value={body}
                onChange={(event) => setBody(event.target.value)}
              />
            </label>

            <div className="mt-4 flex flex-wrap items-center gap-5">
              <Toggle label="Push" checked={push} onChange={setPush} />
              <Toggle label="Email" checked={email} onChange={setEmail} />
              <Toggle label="SMS" checked={sms} onChange={setSms} />
            </div>

            <div className="mt-4">
              <p className={labelClass}>Schedule</p>
              <Segmented options={SCHEDULE_OPTIONS} value={schedule} onChange={setSchedule} />
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3 max-[520px]:grid-cols-1">
              <label className="block min-w-0">
                <span className={labelClass}>Date</span>
                <div className="relative">
                  <span
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[15px] leading-none"
                    aria-hidden="true"
                  >
                    📅
                  </span>
                  <input
                    className={cn(inputClass, 'pl-9')}
                    value={date}
                    onChange={(event) => setDate(event.target.value)}
                  />
                </div>
              </label>
              <label className="block min-w-0">
                <span className={labelClass}>Time</span>
                <div className="relative">
                  <span
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[15px] leading-none"
                    aria-hidden="true"
                  >
                    🕒
                  </span>
                  <input
                    className={cn(inputClass, 'pl-9')}
                    value={time}
                    onChange={(event) => setTime(event.target.value)}
                  />
                </div>
              </label>
            </div>
          </Card>
        </div>

        <Card title="Preview" className="sticky top-[60px]">
          <div className="rounded-[12px] border border-[#eceeec] bg-[#f6f8f6] p-3.5">
            <div className="flex items-center gap-2.5">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-sm bg-[#E3F2EB] text-[13px] font-bold text-[#2E9E4D]">
                Y
              </div>
              <p className="text-[12px] font-bold text-[#1C211F]">Yjeek Admin</p>
            </div>
            <p className="mt-2 text-[13px] font-bold leading-snug text-[#17231c]">
              {title || 'Notification title'}
            </p>
            <p className="mt-1 text-[12px] leading-snug text-[#455249]">
              {body || 'Notification body'}
            </p>
          </div>

          <button
            type="button"
            onClick={goBack}
            className="mt-4 inline-flex h-[36px] items-center justify-center rounded-full bg-[#1aa054] px-4 text-[13px] font-bold text-white hover:bg-[#158a47]"
          >
            Send notification
          </button>
        </Card>
      </div>

      <Card>
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-[15px] font-bold text-[#17231c]">Notification history</h3>
            <p className="mt-0.5 text-[12px] text-[#7c8780]">Everything sent to vendors</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <FilterChip
              icon="📅"
              label="Filter by date range"
              options={DATE_RANGE_OPTIONS}
              value={dateRange}
              onChange={setDateRange}
            />
            <FilterChip
              label="Filter by channel"
              options={CHANNEL_FILTERS}
              value={channelFilter}
              onChange={setChannelFilter}
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-[12px] border border-[#eceeec]">
          <div className="w-full max-w-full overflow-x-auto overscroll-x-contain touch-pan-x [-webkit-overflow-scrolling:touch]">
            <table className="w-full min-w-[860px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[#edf0ee] bg-[#f6f8f6]">
                  {['Notification', 'Audience', 'Channel', 'Sent to', 'Date', 'Time', 'Status'].map(
                    (column) => (
                      <th
                        key={column}
                        className="whitespace-nowrap px-4 py-2.5 text-[10px] font-medium uppercase tracking-[0.05em] text-[#8a948e]"
                      >
                        {column}
                      </th>
                    ),
                  )}
                  <th />
                </tr>
              </thead>
              <tbody className="bg-white">
                {visibleHistory.map((row) => (
                  <tr
                    key={row.id}
                    role="link"
                    tabIndex={0}
                    onClick={() => navigate(`/admin/marketing/notifications/${row.id}`)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        navigate(`/admin/marketing/notifications/${row.id}`)
                      }
                    }}
                    className="cursor-pointer border-b border-[#edf0ee] bg-white last:border-0 hover:bg-[#fafbfa]"
                  >
                    <td className="whitespace-nowrap px-4 py-3">
                      <p className="text-[13px] font-medium text-[#17231c]">{row.notification}</p>
                      <p className="mt-0.5 text-[11px] text-[#8a948e]">{row.type}</p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-[12.5px] text-[#455249]">
                      {row.audience}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-[12.5px] text-[#455249]">
                      {row.channel}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-[12.5px] text-[#455249]">
                      {row.sentTo}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-[12.5px] text-[#455249]">
                      {row.date}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-[12.5px] text-[#455249]">
                      {row.time}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <Badge tone={historyTone(row.status)}>{row.status}</Badge>
                    </td>
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        aria-label={`More options for ${row.notification}`}
                        onClick={(event) => event.stopPropagation()}
                        className="grid h-7 w-7 place-items-center rounded-md text-[#7d8781] hover:bg-[#f3f6f4]"
                      >
                        <MoreVertical size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  )
}
