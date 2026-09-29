import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Plus, X } from 'lucide-react'
import { useApiResource } from '../../../hooks/useApiResource'
import { apiConfig, isAdminRealApiFeature } from '../../../api/config'
import { formatApiErrorMessage } from '../../../api/errors'
import { adminService } from '../../../services/adminService'
import { AdminEntitySearchPicker } from '../../../components/admin/AdminEntitySearchPicker'
import { AdminDatePicker } from '../../../components/admin/AdminDatePicker'
import { ApiState } from '../../../components/admin/ApiState'
import { Badge } from '../../../components/admin/Badge'
import { cn } from '../../../components/admin/cn'
import { formatMarketingNotifySendSuccess } from '../../../mappers/admin/mapAdminMarketingNotifications'

const AUDIENCE_OPTIONS = ['All customers', 'By segment', 'One phone', 'By city', 'Selected']
const DEEP_LINK_OPTIONS = [
  { value: 'none', label: 'No deep link' },
  { value: 'vendor', label: 'Vendor' },
  { value: 'category', label: 'Category' },
  { value: 'voucher', label: 'Voucher' },
  { value: 'rewards', label: 'My Rewards' },
  { value: 'url', label: 'External URL' },
]
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

function defaultScheduleFields() {
  const shifted = new Date(Date.now() + 60 * 60 * 1000 + 3 * 60 * 60 * 1000)
  const pad = (n) => String(n).padStart(2, '0')
  return {
    date: `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())}`,
    time: `${pad(shifted.getUTCHours())}:${pad(shifted.getUTCMinutes())}`,
  }
}

function openTimePicker(event) {
  try {
    event.currentTarget.showPicker?.()
  } catch {
    // Older browsers rely on native click.
  }
}

export default function AdminSendCustomerNotificationPage() {
  const navigate = useNavigate()
  const useReal = useRealMarketing()
  const goBack = () => navigate('/admin/marketing')

  const [audience, setAudience] = useState('By segment')
  const [segmentIds, setSegmentIds] = useState([])
  const [segmentInput, setSegmentInput] = useState('')
  const [selectedCustomers, setSelectedCustomers] = useState([])
  const [messageType, setMessageType] = useState('Promo')
  const [titleEn, setTitleEn] = useState('')
  const [titleAr, setTitleAr] = useState('')
  const [bodyEn, setBodyEn] = useState('')
  const [bodyAr, setBodyAr] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [deepLinkKind, setDeepLinkKind] = useState('none')
  const [deepLinkTarget, setDeepLinkTarget] = useState('')
  const [phone, setPhone] = useState('')
  const [recurrenceDays, setRecurrenceDays] = useState('')
  const [push, setPush] = useState(true)
  const [email, setEmail] = useState(true)
  const [sms, setSms] = useState(false)
  const [schedule, setSchedule] = useState('Send now')
  const [scheduleDate, setScheduleDate] = useState(() => defaultScheduleFields().date)
  const [scheduleTime, setScheduleTime] = useState(() => defaultScheduleFields().time)
  const [submitting, setSubmitting] = useState(false)
  const [actionError, setActionError] = useState('')
  const [actionSuccess, setActionSuccess] = useState('')

  const searchCustomers = useCallback(async (query, options = {}) => {
    const result = await adminService.listAdminCustomers({
      search: query,
      statusTab: 'All',
      limit: 10,
      page: 1,
      signal: options.signal,
    })
    const rows = result?.data?.rows || []
    return rows.map((row) => ({
      id: String(row.id),
      label: String(row.name || row.id),
      meta: [row.contact, row.email].filter((value) => value && value !== '—').join(' · '),
    }))
  }, [])

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

  async function handleSend(sendTest = false) {
    setActionError('')
    setActionSuccess('')
    setSubmitting(true)
    try {
      const response = await adminService.sendAdminCustomerNotification({
        audience,
        segmentIds: audience === 'By segment' ? segmentIds : [],
        phone: audience === 'One phone' ? phone : '',
        customerIds: audience === 'Selected' ? selectedCustomers.map((item) => item.id) : [],
        type: messageType,
        titleEn,
        titleAr,
        bodyEn,
        bodyAr,
        imageUrl,
        deepLinkKind,
        deepLinkTarget,
        recurrenceDays,
        sendTest,
        push,
        email,
        sms,
        schedule,
        scheduleDate: schedule === 'Schedule later' ? scheduleDate : '',
        scheduleTime: schedule === 'Schedule later' ? scheduleTime : '',
      })
      const createdTitle = response?.data?.title || titleEn
      const isScheduled = String(response?.data?.statusKey || '').toLowerCase() === 'scheduled'
      setActionSuccess(
        sendTest
          ? `Test sent only to your account. “${createdTitle}” is not in the launch report.`
          : formatMarketingNotifySendSuccess(createdTitle, {
              scheduled: isScheduled,
              scheduledAt: response?.data?.scheduledAt,
              sentTo: response?.data?.sentTo,
              target: 'customer',
              push,
              email,
              emailDelivery: response?.data?.emailDelivery,
              sms,
              smsDelivery: response?.data?.smsDelivery,
            }),
      )
      await refetchHistory()
    } catch (err) {
      setActionError(formatApiErrorMessage(err, 'Failed to send notification.'))
    } finally {
      setSubmitting(false)
    }
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
          Push
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
              className="flex-wrap"
            />
            <p className="mt-2 text-[11.5px] text-[#8a948e]">
              All customers is an explicit send. A missing or empty segment does not send to everyone.
            </p>

            {audience === 'Selected' ? (
              <AdminEntitySearchPicker
                label="Customers"
                placeholder="Type customer name or phone…"
                helperText="Suggestions from GET /admin/customers?search=. Send uses real customer ids."
                selected={selectedCustomers}
                onChange={setSelectedCustomers}
                searchFn={searchCustomers}
                disabled={submitting}
              />
            ) : null}

            {audience === 'One phone' ? (
              <label className="mt-4 block">
                <span className={labelClass}>Customer phone</span>
                <input
                  className={inputClass}
                  value={phone}
                  disabled={submitting}
                  placeholder="e.g. 33123456 or +97333123456"
                  onChange={(event) => setPhone(event.target.value)}
                />
              </label>
            ) : null}

            {audience === 'By segment' ? (
              <div className="mt-4 space-y-2">
                <p className={labelClass}>Segment ids</p>
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
                    placeholder="Paste segment id then Add"
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
                  Paste a saved segment id. If that segment does not exist, nothing is sent.
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

            <div className="mt-4 grid grid-cols-2 gap-3 max-[520px]:grid-cols-1">
              <label className="block">
                <span className={labelClass}>Title (English)</span>
                <input
                  className={inputClass}
                  value={titleEn}
                  disabled={submitting}
                  placeholder="Ramadan cashback"
                  onChange={(event) => setTitleEn(event.target.value)}
                />
              </label>
              <label className="block">
                <span className={labelClass}>Title (Arabic)</span>
                <input
                  className={inputClass}
                  dir="rtl"
                  value={titleAr}
                  disabled={submitting}
                  placeholder="استرداد نقدي"
                  onChange={(event) => setTitleAr(event.target.value)}
                />
              </label>
            </div>

            <label className="mt-3 block">
              <span className={labelClass}>Body (English)</span>
              <textarea
                className="box-border min-h-[80px] w-full resize-y rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white px-3 py-2.5 text-[13px] text-[#17231c] outline-none transition placeholder:text-[#9aa49d] focus:border-[#1aa054]"
                value={bodyEn}
                disabled={submitting}
                onChange={(event) => setBodyEn(event.target.value)}
              />
            </label>
            <label className="mt-3 block">
              <span className={labelClass}>Body (Arabic)</span>
              <textarea
                dir="rtl"
                className="box-border min-h-[80px] w-full resize-y rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white px-3 py-2.5 text-[13px] text-[#17231c] outline-none transition placeholder:text-[#9aa49d] focus:border-[#1aa054]"
                value={bodyAr}
                disabled={submitting}
                onChange={(event) => setBodyAr(event.target.value)}
              />
            </label>

            <label className="mt-3 block">
              <span className={labelClass}>Image URL (optional)</span>
              <input
                className={inputClass}
                value={imageUrl}
                disabled={submitting}
                placeholder="https://"
                onChange={(event) => setImageUrl(event.target.value)}
              />
            </label>

            <label className="mt-3 block">
              <span className={labelClass}>Deep link</span>
              <select
                className={inputClass}
                value={deepLinkKind}
                disabled={submitting}
                onChange={(event) => setDeepLinkKind(event.target.value)}
              >
                {DEEP_LINK_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            {deepLinkKind !== 'none' && deepLinkKind !== 'rewards' ? (
              <label className="mt-3 block">
                <span className={labelClass}>
                  {deepLinkKind === 'url' ? 'External URL' : 'Target id'}
                </span>
                <input
                  className={inputClass}
                  value={deepLinkTarget}
                  disabled={submitting}
                  placeholder={deepLinkKind === 'url' ? 'https://' : 'Id'}
                  onChange={(event) => setDeepLinkTarget(event.target.value)}
                />
              </label>
            ) : null}

            <label className="mt-3 block">
              <span className={labelClass}>Repeat every N days (optional)</span>
              <input
                type="number"
                min="1"
                max="365"
                className={inputClass}
                value={recurrenceDays}
                disabled={submitting}
                placeholder="Leave empty to send once"
                onChange={(event) => setRecurrenceDays(event.target.value)}
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
              <p className="mt-2 text-[11.5px] text-[#8a948e]">
                Schedule later uses Asia/Bahrain (GMT+3), not this browser’s clock.
              </p>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3 max-[520px]:grid-cols-1">
              {schedule === 'Schedule later' ? (
                <>
                  <div className="min-w-0">
                    <span className={labelClass}>Date (Bahrain)</span>
                    <AdminDatePicker
                      className="mt-1.5"
                      value={scheduleDate}
                      onChange={setScheduleDate}
                      placeholder="DD/MM/YYYY"
                      disabled={submitting}
                    />
                  </div>
                  <label className="block min-w-0">
                    <span className={labelClass}>Time (Bahrain)</span>
                    <input
                      type="time"
                      className={cn(inputClass, 'mt-1.5 cursor-pointer')}
                      value={scheduleTime}
                      disabled={submitting}
                      onClick={openTimePicker}
                      onFocus={openTimePicker}
                      onChange={(event) => setScheduleTime(event.target.value)}
                    />
                  </label>
                </>
              ) : null}
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
            <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.04em] text-[#8a948e]">
              English
            </p>
            <p className="mt-0.5 text-[13px] font-bold leading-snug text-[#17231c]">
              {titleEn || 'English title'}
            </p>
            <p className="mt-1 text-[12px] leading-snug text-[#455249]">
              {bodyEn || 'English body'}
            </p>
            <p className="mt-3 text-[11px] font-medium uppercase tracking-[0.04em] text-[#8a948e]">
              Arabic
            </p>
            <p className="mt-0.5 text-[13px] font-bold leading-snug text-[#17231c]" dir="rtl">
              {titleAr || 'العنوان'}
            </p>
            <p className="mt-1 text-[12px] leading-snug text-[#455249]" dir="rtl">
              {bodyAr || 'النص'}
            </p>
            {imageUrl ? (
              <p className="mt-2 truncate text-[11px] text-[#8a948e]">{imageUrl}</p>
            ) : null}
          </div>

          <button
            type="button"
            disabled={submitting}
            onClick={() => handleSend(true)}
            className="mt-4 inline-flex h-[40px] w-full items-center justify-center rounded-full border border-[#1aa054] bg-white px-4 text-[13px] font-bold text-[#1aa054] hover:bg-[#e8f7ed] disabled:opacity-60"
          >
            {submitting ? 'Please wait…' : 'Send test to me'}
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleSend(false)}
            className="mt-4 inline-flex h-[40px] w-full items-center justify-center rounded-full bg-[#1aa054] px-4 text-[13px] font-bold text-white hover:bg-[#158a47] disabled:opacity-60"
          >
            {submitting
              ? schedule === 'Schedule later'
                ? 'Scheduling…'
                : 'Sending…'
              : schedule === 'Schedule later'
                ? 'Schedule notification'
                : 'Send notification'}
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
