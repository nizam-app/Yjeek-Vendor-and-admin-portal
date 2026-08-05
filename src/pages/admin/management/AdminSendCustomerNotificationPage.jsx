import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Plus, X } from 'lucide-react'
import { useApiResource } from '../../../hooks/useApiResource'
import { apiConfig, isAdminRealApiFeature } from '../../../api/config'
import { formatApiErrorMessage } from '../../../api/errors'
import { adminService } from '../../../services/adminService'
import { ApiState } from '../../../components/admin/ApiState'
import { Badge } from '../../../components/admin/Badge'
import { cn } from '../../../components/admin/cn'

const AUDIENCE_OPTIONS = ['All customers', 'By segment', 'By city', 'Selected']
const MESSAGE_TYPES = ['Promo', 'Info', 'Order', 'Wallet']
const SCHEDULE_OPTIONS = ['Send now', 'Schedule later']

const labelClass = 'mb-1.5 block text-[12px] font-medium text-[#7c8780]'
const inputClass =
  'box-border h-[40px] w-full rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white px-3 text-[13px] text-[#17231c] outline-none transition placeholder:text-[#9aa49d] focus:border-[#1aa054]'

function useRealMarketing() {
  return isAdminRealApiFeature('marketing') || !apiConfig.adminUseMockApi
}

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

function Segmented({ options, value, onChange, className, disabled = false }) {
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
          disabled={disabled}
          onClick={() => onChange(option)}
          className={cn(
            'h-[32px] flex-1 shrink-0 rounded-[8px] px-3 text-[12.5px] whitespace-nowrap transition disabled:opacity-60',
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

function Toggle({ label, checked, onChange, disabled = false }) {
  return (
    <div className="flex items-center gap-2.5">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-[28px] w-[48px] shrink-0 rounded-full transition disabled:opacity-60',
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
  if (status === 'Delivered' || status === 'Sent') return 'green'
  if (status === 'Scheduled') return 'yellow'
  return 'gray'
}

function buildScheduledAt(dateValue, timeValue) {
  const dateRaw = String(dateValue || '').trim()
  const timeRaw = String(timeValue || '').trim()
  if (!dateRaw || !timeRaw) return ''

  // Prefer HTML date (YYYY-MM-DD) + time (HH:mm)
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateRaw)) {
    const iso = new Date(`${dateRaw}T${timeRaw}:00`)
    if (!Number.isNaN(iso.getTime())) return iso.toISOString()
  }

  const parsed = new Date(`${dateRaw} ${timeRaw}`)
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString()
  return ''
}

export default function AdminSendCustomerNotificationPage() {
  const navigate = useNavigate()
  const useReal = useRealMarketing()
  const goBack = () => navigate('/admin/marketing')

  const [audience, setAudience] = useState('By segment')
  const [segmentIds, setSegmentIds] = useState([])
  const [segmentInput, setSegmentInput] = useState('')
  const [messageType, setMessageType] = useState('Promo')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [push, setPush] = useState(true)
  const [email, setEmail] = useState(true)
  const [sms, setSms] = useState(false)
  const [schedule, setSchedule] = useState('Send now')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [actionError, setActionError] = useState('')
  const [actionSuccess, setActionSuccess] = useState('')

  const {
    data: historyData,
    error: historyError,
    isLoading: historyLoading,
    refetch: refetchHistory,
  } = useApiResource(
    () => {
      if (useReal) {
        return adminService.listAdminCustomerNotificationHistory({ limit: 20 })
      }
      return Promise.resolve({
        data: {
          rows: [
            {
              id: 'mock-1',
              notification: 'Ramadan cashback 10%',
              audience: 'All customers',
              channel: 'Push · Email',
              sentTo: '12,480',
              date: '2 Mar',
              status: 'Delivered',
            },
          ],
        },
      })
    },
    [useReal],
  )

  const historyRows = historyData?.rows || []

  function removeSegmentId(id) {
    setSegmentIds((prev) => prev.filter((item) => item !== id))
  }

  function addSegmentId() {
    const id = String(segmentInput || '').trim()
    if (!id) return
    setSegmentIds((prev) => (prev.includes(id) ? prev : [...prev, id]))
    setSegmentInput('')
  }

  async function handleSend() {
    setActionError('')
    setActionSuccess('')
    setSubmitting(true)
    try {
      const response = await adminService.sendAdminCustomerNotification({
        audience,
        segmentIds,
        type: messageType,
        title,
        body,
        push,
        email,
        sms,
        schedule,
        scheduledAt: buildScheduledAt(date, time),
      })
      const createdTitle = response?.data?.title || title
      setActionSuccess(`Sent: ${createdTitle}`)
      navigate('/admin/customers')
    } catch (err) {
      setActionError(formatApiErrorMessage(err, 'Failed to send notification.'))
    } finally {
      setSubmitting(false)
    }
  }

  const showIdPicker = audience === 'By segment' || audience === 'Selected'
  const idPickerLabel = audience === 'Selected' ? 'Customer ids' : 'Segment ids'

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

      {actionError ? (
        <div className="mb-4 rounded-[12px] border border-[#f0c9c6] bg-[#fff5f4] px-4 py-3 text-[13px] text-[#b42318]">
          {actionError}
        </div>
      ) : null}
      {actionSuccess ? (
        <div className="mb-4 rounded-[12px] border border-[#b7e4c7] bg-[#f0faf4] px-4 py-3 text-[13px] text-[#147940]">
          {actionSuccess}
        </div>
      ) : null}

      <div className="mb-4 grid grid-cols-[minmax(0,1.7fr)_minmax(260px,1fr)] items-start gap-4 max-[900px]:grid-cols-1">
        <div className="space-y-4">
          <Card title="Audience">
            <p className={labelClass}>Send to</p>
            <Segmented
              options={AUDIENCE_OPTIONS}
              value={audience}
              onChange={setAudience}
              disabled={submitting}
            />

            {showIdPicker ? (
              <div className="mt-4 space-y-2">
                <p className={labelClass}>{idPickerLabel}</p>
                <div className="flex flex-wrap items-center gap-2">
                  {segmentIds.map((id) => (
                    <span
                      key={id}
                      className="inline-flex h-[30px] max-w-full items-center gap-1.5 rounded-full border border-[#1aa054] bg-[#e8f7ed] px-2.5 text-[12px] font-bold text-[#147940]"
                    >
                      <span className="truncate">{id}</span>
                      <button
                        type="button"
                        aria-label={`Remove ${id}`}
                        disabled={submitting}
                        onClick={() => removeSegmentId(id)}
                        className="grid h-4 w-4 place-items-center rounded-full text-[#147940] hover:bg-[#d8f0e0]"
                      >
                        <X size={11} strokeWidth={2.4} />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    className={cn(inputClass, 'max-w-[320px]')}
                    value={segmentInput}
                    disabled={submitting}
                    placeholder={
                      audience === 'Selected'
                        ? 'Paste customer id then Add'
                        : 'Paste segment id then Add'
                    }
                    onChange={(event) => setSegmentInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        addSegmentId()
                      }
                    }}
                  />
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={addSegmentId}
                    className="inline-flex h-[40px] items-center gap-1 rounded-full border border-[#1aa054] bg-white px-3 text-[12px] font-bold text-[#1aa054] hover:bg-[#e8f7ed] disabled:opacity-60"
                  >
                    <Plus size={13} strokeWidth={2.4} />
                    Add
                  </button>
                </div>
                <p className="text-[11.5px] text-[#8a948e]">
                  API expects real ids in <code>segmentIds</code>
                  {audience === 'Selected' ? ' (use customer ids here until a dedicated field exists).' : '.'}
                </p>
              </div>
            ) : null}

            {audience === 'By city' ? (
              <p className="mt-4 text-[12.5px] text-[#7c8780]">
                By city is sent as <code>audience: by_city</code>. City filters are not in the
                confirmed create body yet.
              </p>
            ) : null}

            <p className="mt-4 text-[12.5px] text-[#7c8780]">Estimated recipients</p>
            <p className="text-[12px] text-[#8a948e]">Wire estimate API when you share a sample.</p>
          </Card>

          <Card title="Message">
            <p className={labelClass}>Type</p>
            <Segmented
              options={MESSAGE_TYPES}
              value={messageType}
              onChange={setMessageType}
              disabled={submitting}
            />

            <label className="mt-4 block">
              <span className={labelClass}>Title</span>
              <input
                className={inputClass}
                value={title}
                disabled={submitting}
                placeholder="e.g. Ramadan cashback — 10% back!"
                onChange={(event) => setTitle(event.target.value)}
              />
            </label>

            <label className="mt-3 block">
              <span className={labelClass}>Body</span>
              <textarea
                className="box-border min-h-[96px] w-full resize-y rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white px-3 py-2.5 text-[13px] text-[#17231c] outline-none transition placeholder:text-[#9aa49d] focus:border-[#1aa054]"
                value={body}
                disabled={submitting}
                placeholder="Order this Ramadan and get 10% wallet cashback on every order."
                onChange={(event) => setBody(event.target.value)}
              />
            </label>

            <div className="mt-4 flex flex-wrap items-center gap-5">
              <Toggle label="Push" checked={push} onChange={setPush} disabled={submitting} />
              <Toggle label="Email" checked={email} onChange={setEmail} disabled={submitting} />
              <Toggle label="SMS" checked={sms} onChange={setSms} disabled={submitting} />
            </div>

            <div className="mt-4">
              <p className={labelClass}>Schedule</p>
              <Segmented
                options={SCHEDULE_OPTIONS}
                value={schedule}
                onChange={setSchedule}
                disabled={submitting}
              />
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3 max-[520px]:grid-cols-1">
              <label className="block min-w-0">
                <span className={labelClass}>Date</span>
                <input
                  type="date"
                  className={cn(inputClass, 'cursor-pointer')}
                  value={date}
                  disabled={submitting}
                  onClick={(event) => {
                    if (schedule !== 'Schedule later') setSchedule('Schedule later')
                    try {
                      event.currentTarget.showPicker?.()
                    } catch {
                      // Older browsers: native click still opens the picker when supported.
                    }
                  }}
                  onFocus={(event) => {
                    if (schedule !== 'Schedule later') setSchedule('Schedule later')
                    try {
                      event.currentTarget.showPicker?.()
                    } catch {
                      // ignore
                    }
                  }}
                  onChange={(event) => setDate(event.target.value)}
                />
              </label>
              <label className="block min-w-0">
                <span className={labelClass}>Time</span>
                <input
                  type="time"
                  className={cn(inputClass, 'cursor-pointer')}
                  value={time}
                  disabled={submitting}
                  onClick={(event) => {
                    if (schedule !== 'Schedule later') setSchedule('Schedule later')
                    try {
                      event.currentTarget.showPicker?.()
                    } catch {
                      // ignore
                    }
                  }}
                  onFocus={(event) => {
                    if (schedule !== 'Schedule later') setSchedule('Schedule later')
                    try {
                      event.currentTarget.showPicker?.()
                    } catch {
                      // ignore
                    }
                  }}
                  onChange={(event) => setTime(event.target.value)}
                />
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
            disabled={submitting}
            onClick={handleSend}
            className="mt-4 inline-flex h-[40px] w-full items-center justify-center rounded-full bg-[#1aa054] px-4 text-[13px] font-bold text-white hover:bg-[#158a47] disabled:opacity-60"
          >
            {submitting ? 'Sending…' : 'Send notification'}
          </button>
        </Card>
      </div>

      <Card title="Notification history">
        {historyLoading && !historyRows.length ? (
          <ApiState isLoading />
        ) : historyError && !historyRows.length ? (
          <ApiState error={historyError} onRetry={refetchHistory} />
        ) : (
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
                  {historyRows.length ? (
                    historyRows.map((row) => (
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
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-[13px] text-[#7c8780]">
                        No customer notifications yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
