import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Plus, X } from 'lucide-react'
import { Badge } from '../../../components/admin/Badge'
import { cn } from '../../../components/admin/cn'

const AUDIENCE_OPTIONS = ['All customers', 'By segment', 'By city', 'Selected']
const MESSAGE_TYPES = ['Promo', 'Info', 'Order', 'Wallet']
const SCHEDULE_OPTIONS = ['Send now', 'Schedule later']
const SEGMENT_OPTIONS = ['VIP', 'New', 'Lapsed', 'High spenders']

const HISTORY = [
  {
    id: 1,
    notification: 'Ramadan cashback 10%',
    audience: 'All customers',
    channel: 'Push · Email',
    sentTo: '12,480',
    date: '2 Mar',
    status: 'Delivered',
  },
  {
    id: 2,
    notification: 'Free delivery weekend',
    audience: 'Segment: Lapsed',
    channel: 'Push',
    sentTo: '1,540',
    date: '28 Feb',
    status: 'Delivered',
  },
  {
    id: 3,
    notification: 'Eid teaser',
    audience: 'By city: Riffa',
    channel: 'Push · SMS',
    sentTo: '830',
    date: '9 Apr',
    status: 'Scheduled',
  },
  {
    id: 4,
    notification: 'Wallet top-up bonus',
    audience: 'Selected',
    channel: 'Email',
    sentTo: '220',
    date: '12 Feb',
    status: 'Delivered',
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
        'flex  items-center gap-1 rounded-[10px] bg-[#ebeceb] p-[4px]',
        className,
      )}
    >
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={cn(
            'h-[32px] flex-1 shrink-0 rounded-[8px] px-3 text-[12.5px] whitespace-nowrap transition',
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

function historyTone(status) {
  if (status === 'Delivered') return 'green'
  if (status === 'Scheduled') return 'yellow'
  return 'gray'
}

export default function AdminSendCustomerNotificationPage() {
  const navigate = useNavigate()
  const goBack = () => navigate('/admin/marketing')

  const [audience, setAudience] = useState('By segment')
  const [segments, setSegments] = useState(['VIP', 'New'])
  const [messageType, setMessageType] = useState('Promo')
  const [title, setTitle] = useState('🌙 Ramadan cashback — 10% back!')
  const [body, setBody] = useState(
    'Order this Ramadan and get 10% wallet cashback on every order...',
  )
  const [push, setPush] = useState(true)
  const [email, setEmail] = useState(true)
  const [sms, setSms] = useState(false)
  const [schedule, setSchedule] = useState('Send now')
  const [date, setDate] = useState('9 Apr 2026')
  const [time, setTime] = useState('18:00')

  function removeSegment(name) {
    setSegments((prev) => prev.filter((item) => item !== name))
  }

  function addSegment() {
    const next = SEGMENT_OPTIONS.find((item) => !segments.includes(item))
    if (next) setSegments((prev) => [...prev, next])
  }

  return (
    <div className="px-5 pb-10 pt-4 max-[700px]:px-3">
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={goBack}
          className="inline-flex h-[34px] shrink-0 items-center gap-1 rounded-full border border-[#e4e8e4] bg-white px-3 text-[13px] font-medium text-[#455249] shadow-[0_1px_2px_rgba(20,40,28,.04)] hover:bg-[#f6f8f6]"
        >
          <ChevronLeft size={15} strokeWidth={2.2} />
          Back
        </button>
        <h2 className="text-[20px] font-bold tracking-[-0.02em] text-[#17231c]">
          Send notification
        </h2>
      </div>

      <div className="mb-4 grid grid-cols-[minmax(0,1.7fr)_minmax(260px,1fr)] items-start gap-4 max-[900px]:grid-cols-1">
        <div className="space-y-4">
          <Card title="Audience">
            <p className={labelClass}>Send to</p>
            <Segmented options={AUDIENCE_OPTIONS} value={audience} onChange={setAudience} />

            {audience === 'By segment' ? (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {segments.map((segment) => (
                  <span
                    key={segment}
                    className="inline-flex h-[30px] items-center gap-1.5 rounded-full border border-[#1aa054] bg-[#e8f7ed] px-2.5 text-[12px] font-bold text-[#147940]"
                  >
                    {segment}
                    <button
                      type="button"
                      aria-label={`Remove ${segment}`}
                      onClick={() => removeSegment(segment)}
                      className="grid h-4 w-4 place-items-center rounded-full text-[#147940] hover:bg-[#d8f0e0]"
                    >
                      <X size={11} strokeWidth={2.4} />
                    </button>
                  </span>
                ))}
                <button
                  type="button"
                  onClick={addSegment}
                  className="inline-flex h-[30px] items-center gap-1 rounded-full border border-[#1aa054] bg-white px-2.5 text-[12px] font-bold text-[#1aa054] hover:bg-[#e8f7ed]"
                >
                  <Plus size={13} strokeWidth={2.4} />
                  Add segment
                </button>
              </div>
            ) : null}

            <p className="mt-4 text-[12.5px] text-[#7c8780]">Estimated recipients</p>
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
              <div className="min-w-0">
                <p className="text-[12px] font-bold text-[#1C211F]">Yjeek</p>
              </div>
            </div>
            <p className="mt-0.5 text-[13px] font-bold leading-snug text-[#17231c]">
              {title || 'Notification title'}
            </p>
            <p className="mt-1 text-[12px] leading-snug text-[#455249]">
              {body || 'Notification body'}
            </p>
          </div>

          <button
            type="button"
            onClick={goBack}
            className="mt-4 inline-flex h-[40px] w-full items-center justify-center rounded-full bg-[#1aa054] px-4 text-[13px] font-bold text-white hover:bg-[#158a47]"
          >
            Send notification
          </button>
        </Card>
      </div>

      <Card title="Notification history">
        <div className="overflow-hidden rounded-[12px] border border-[#eceeec]">
          <div className="w-full max-w-full overflow-x-auto overscroll-x-contain touch-pan-x [-webkit-overflow-scrolling:touch]">
            <table className="w-full min-w-[760px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[#edf0ee] bg-[#f6f8f6]">
                  {['Notification', 'Audience', 'Channel', 'Sent to', 'Date', 'Status'].map(
                    (column) => (
                      <th
                        key={column}
                        className="whitespace-nowrap px-4 py-2.5 text-[10px] font-medium uppercase tracking-[0.05em] text-[#8a948e]"
                      >
                        {column}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {HISTORY.map((row) => (
                  <tr key={row.id} className="border-b border-[#edf0ee] bg-white last:border-0">
                    <td className="whitespace-nowrap px-4 py-3.5 text-[13px] font-medium text-[#17231c]">
                      {row.notification}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-[12.5px] text-[#455249]">
                      {row.audience}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-[12.5px] text-[#455249]">
                      {row.channel}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-[12.5px] text-[#455249]">
                      {row.sentTo}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-[12.5px] text-[#455249]">
                      {row.date}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5">
                      <Badge tone={historyTone(row.status)}>{row.status}</Badge>
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
