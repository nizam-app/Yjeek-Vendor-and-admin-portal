import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { Badge } from '../../../components/admin/Badge'
import { cn } from '../../../components/admin/cn'

const AUDIENCE_OPTIONS = ['All champs', 'Online', 'By category', 'By zone', 'Selected']
const MESSAGE_TYPES = ['Info', 'Incentive', 'Alert', 'Policy']
const SCHEDULE_OPTIONS = ['Send now', 'Schedule later']

const HISTORY = [
  {
    id: 1,
    notification: 'Peak hour bonus',
    audience: 'Online champs',
    sentTo: 148,
    date: '2 Mar',
    status: 'Delivered',
  },
  {
    id: 2,
    notification: 'New zone: Hidd',
    audience: 'By zone',
    sentTo: 18,
    date: '26 Feb',
    status: 'Delivered',
  },
  {
    id: 3,
    notification: 'Policy update',
    audience: 'All champs',
    sentTo: 312,
    date: '20 Feb',
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

export default function AdminNotifyChampsPage() {
  const navigate = useNavigate()
  const goBack = () => navigate('/admin/fleet')

  const [audience, setAudience] = useState('Online')
  const [messageType, setMessageType] = useState('Incentive')
  const [title, setTitle] = useState('🔥 Peak hour bonus active!')
  const [body, setBody] = useState('Go online now — earn +BHD 0.500 extra per trip from 7–9 PM.')
  const [push, setPush] = useState(true)
  const [sms, setSms] = useState(false)
  const [schedule, setSchedule] = useState('Send now')

  return (
    <div className="px-5 pb-10 pt-4 max-[700px]:px-3">
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={goBack}
          className="inline-flex h-[34px] shrink-0 items-center gap-1 rounded-full border border-[#e4e8e4] bg-white px-3 text-[13px] font-medium text-[#455249] shadow-[0_1px_2px_rgba(20,40,28,.04)] hover:bg-[#f6f8f6]"
        >
          <ChevronLeft size={15} strokeWidth={2.2} />
          Champs
        </button>
        <div className="min-w-0">
          <h2 className="text-[20px] font-bold tracking-[-0.02em] text-[#17231c]">Notify champs</h2>
          <p className="mt-0.5 text-[12.5px] text-[#7c8780]">
            Push a message to all champs or a target group.
          </p>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-[minmax(0,1.7fr)_minmax(260px,1fr)] items-start gap-4 max-[900px]:grid-cols-1">
        <div className="space-y-4">
          <Card title="Audience">
            <p className={labelClass}>Send to</p>
            <Segmented options={AUDIENCE_OPTIONS} value={audience} onChange={setAudience} />
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
              <Toggle label="SMS" checked={sms} onChange={setSms} />
            </div>

            <div className="mt-4">
              <p className={labelClass}>Schedule</p>
              <Segmented options={SCHEDULE_OPTIONS} value={schedule} onChange={setSchedule} />
            </div>
          </Card>
        </div>

        <Card title="Preview" className="sticky top-[60px]">
          <div className="rounded-[12px] border border-[#eceeec] bg-[#f6f8f6] p-3.5">
            <div className="flex items-start gap-2.5">
              <div className="grid h-8 w-8 shrink-0 place-items-center items-center rounded-sm bg-[#E3F2EB] text-[13px] font-bold text-[#2E9E4D]">
                Y
              </div>
              <div className="min-w-0">
                <p className="text-[12px] font-medium text-[#7c8780]">Yjeek Champ</p>
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
            className="mt-4 inline-flex h-[40px] items-center justify-center rounded-full bg-[#1aa054] px-4 text-[13px] font-bold text-white hover:bg-[#158a47]"
          >
            Send notification
          </button>
        </Card>
      </div>

      <Card title="Notification history">
        <div className="overflow-hidden rounded-[12px] border border-[#eceeec]">
          <div className="w-full max-w-full overflow-x-auto overscroll-x-contain touch-pan-x [-webkit-overflow-scrolling:touch]">
            <table className="w-full min-w-[640px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[#edf0ee] bg-[#f6f8f6]">
                  {['Notification', 'Audience', 'Sent to', 'Date', 'Status'].map((column) => (
                    <th
                      key={column}
                      className="whitespace-nowrap px-4 py-2.5 text-[10px] font-medium uppercase tracking-[0.05em] text-[#8a948e]"
                    >
                      {column}
                    </th>
                  ))}
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
                      {row.sentTo}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-[12.5px] text-[#455249]">
                      {row.date}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5">
                      <Badge tone="green">{row.status}</Badge>
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
