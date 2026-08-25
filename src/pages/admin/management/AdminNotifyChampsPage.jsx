import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { Badge } from '../../../components/admin/Badge'
import { AdminDatePicker } from '../../../components/admin/AdminDatePicker'
import { AdminFormMultiSelect } from '../../../components/admin/AdminFormMultiSelect'
import { cn } from '../../../components/admin/cn'
import { apiConfig, isAdminRealApiFeature } from '../../../api/config'
import { formatApiErrorMessage } from '../../../api/errors'
import { adminService } from '../../../services/adminService'

const AUDIENCE_OPTIONS = ['All champs', 'Online', 'By category', 'By zone', 'Selected']
const MESSAGE_TYPES = ['Info', 'Incentive', 'Alert', 'Policy']
const SCHEDULE_OPTIONS = ['Send now', 'Schedule later']

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

function statusTone(statusKey) {
  const key = String(statusKey || '').toUpperCase()
  if (key === 'FAILED') return 'red'
  if (key === 'SCHEDULED' || key === 'PROCESSING' || key === 'PARTIAL') return 'yellow'
  return 'green'
}

function defaultScheduleFields() {
  const d = new Date(Date.now() + 60 * 60 * 1000)
  const pad = (n) => String(n).padStart(2, '0')
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  }
}

function buildScheduledAt(dateValue, timeValue) {
  const dateRaw = String(dateValue || '').trim()
  const timeRaw = String(timeValue || '').trim()
  if (!dateRaw || !timeRaw) return ''

  if (/^\d{4}-\d{2}-\d{2}$/.test(dateRaw)) {
    const iso = new Date(`${dateRaw}T${timeRaw}:00`)
    if (!Number.isNaN(iso.getTime())) return iso.toISOString()
  }

  const parsed = new Date(`${dateRaw} ${timeRaw}`)
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString()
  return ''
}

function openTimePicker(event) {
  try {
    event.currentTarget.showPicker?.()
  } catch {
    // Older browsers rely on native click.
  }
}

export default function AdminNotifyChampsPage() {
  const navigate = useNavigate()
  const useRealFleet = isAdminRealApiFeature('fleet') || !apiConfig.adminUseMockApi
  const goBack = () => navigate('/admin/fleet')

  const [audience, setAudience] = useState('Online')
  const [categories, setCategories] = useState([])
  const [zones, setZones] = useState([])
  const [champIdsText, setChampIdsText] = useState('')
  const [messageType, setMessageType] = useState('Incentive')
  const [title, setTitle] = useState('Peak hour bonus active!')
  const [body, setBody] = useState('Go online now — earn +BHD 0.500 extra per trip from 7–9 PM.')
  const [push, setPush] = useState(true)
  const [sms, setSms] = useState(false)
  const [schedule, setSchedule] = useState('Send now')
  const [scheduleDate, setScheduleDate] = useState(() => defaultScheduleFields().date)
  const [scheduleTime, setScheduleTime] = useState(() => defaultScheduleFields().time)

  const [estimated, setEstimated] = useState(null)
  const [estimateLoading, setEstimateLoading] = useState(false)
  const [estimateError, setEstimateError] = useState('')

  const [historyRows, setHistoryRows] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState('')

  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState('')
  const [sendSuccess, setSendSuccess] = useState('')

  const [storeTypeOptions, setStoreTypeOptions] = useState([])
  const [storeTypesLoading, setStoreTypesLoading] = useState(false)
  const [storeTypesError, setStoreTypesError] = useState('')
  const [zoneOptions, setZoneOptions] = useState([])
  const [zonesLoading, setZonesLoading] = useState(false)
  const [zonesError, setZonesError] = useState('')

  const estimatePayload = useMemo(
    () => ({
      audience,
      categories,
      zones,
      champIdsText,
    }),
    [audience, categories, zones, champIdsText],
  )

  const scheduledAt = useMemo(
    () => (schedule === 'Schedule later' ? buildScheduledAt(scheduleDate, scheduleTime) : ''),
    [schedule, scheduleDate, scheduleTime],
  )

  const formPayload = useMemo(
    () => ({
      ...estimatePayload,
      type: messageType,
      messageType,
      title,
      body,
      push,
      sms,
      schedule,
      scheduledAt,
    }),
    [estimatePayload, messageType, title, body, push, sms, schedule, scheduledAt],
  )

  const loadHistory = async () => {
    if (!useRealFleet) {
      setHistoryRows([])
      return
    }
    setHistoryLoading(true)
    setHistoryError('')
    try {
      const result = await adminService.listAdminFleetNotifyHistory()
      setHistoryRows(result?.data?.rows || [])
    } catch (err) {
      setHistoryError(formatApiErrorMessage(err, 'Failed to load notification history.'))
      setHistoryRows([])
    } finally {
      setHistoryLoading(false)
    }
  }

  useEffect(() => {
    loadHistory()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useRealFleet])

  useEffect(() => {
    if (!useRealFleet) {
      setStoreTypeOptions([])
      setZoneOptions([])
      return undefined
    }

    let cancelled = false

    async function loadAudienceOptions() {
      setStoreTypesLoading(true)
      setZonesLoading(true)
      setStoreTypesError('')
      setZonesError('')

      try {
        const [storeTypesResult, usersMetaResult] = await Promise.all([
          adminService.listAdminStoreTypesForChampForm(),
          adminService.getAdminUsersMeta(),
        ])
        if (cancelled) return

        const storeTypes = (storeTypesResult?.data?.storeTypes || []).map((item) => ({
          id: String(item.slug || item.id),
          label: String(item.name || item.slug || item.id),
        }))
        setStoreTypeOptions(storeTypes)

        const coverageZones = (usersMetaResult?.data?.zones || []).map((item) => ({
          id: String(item.id || item.name || item),
          label: String(item.name || item.id || item),
        }))
        setZoneOptions(coverageZones)
      } catch (err) {
        if (cancelled) return
        const message = formatApiErrorMessage(err, 'Failed to load audience options.')
        setStoreTypesError(message)
        setZonesError(message)
        setStoreTypeOptions([])
        setZoneOptions([])
      } finally {
        if (!cancelled) {
          setStoreTypesLoading(false)
          setZonesLoading(false)
        }
      }
    }

    loadAudienceOptions()

    return () => {
      cancelled = true
    }
  }, [useRealFleet])

  useEffect(() => {
    if (!useRealFleet) {
      setEstimated(null)
      setEstimateError('')
      return undefined
    }

    const needsCategories = audience === 'By category' && categories.length === 0
    const needsZones = audience === 'By zone' && zones.length === 0
    const needsChampIds = audience === 'Selected' && !champIdsText.trim()

    if (needsCategories || needsZones || needsChampIds) {
      setEstimated(null)
      setEstimateError('')
      setEstimateLoading(false)
      return undefined
    }

    let cancelled = false
    const timer = setTimeout(async () => {
      setEstimateLoading(true)
      setEstimateError('')
      try {
        const result = await adminService.estimateAdminFleetNotify(estimatePayload)
        if (cancelled) return
        setEstimated(result?.data?.estimatedRecipients ?? 0)
      } catch (err) {
        if (cancelled) return
        setEstimated(null)
        setEstimateError(formatApiErrorMessage(err, 'Could not estimate recipients.'))
      } finally {
        if (!cancelled) setEstimateLoading(false)
      }
    }, 350)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [useRealFleet, estimatePayload, audience, categories, zones, champIdsText])

  const handleSend = async () => {
    setSendError('')
    setSendSuccess('')

    if (!useRealFleet) {
      goBack()
      return
    }

    setSending(true)
    try {
      const result = await adminService.sendAdminFleetNotify(formPayload)
      const data = result?.data
      if (data?.scheduled) {
        setSendSuccess(
          `Scheduled for ${data.sentTo ?? 0} champ${data.sentTo === 1 ? '' : 's'}.`,
        )
      } else {
        setSendSuccess(
          `Sent to ${data?.sentTo ?? 0} champ${data?.sentTo === 1 ? '' : 's'}` +
            (data?.deliveredCount != null ? ` · delivered ${data.deliveredCount}` : '') +
            (data?.failedCount ? ` · failed ${data.failedCount}` : '') +
            '.',
        )
      }
      await loadHistory()
    } catch (err) {
      setSendError(formatApiErrorMessage(err, 'Failed to send notification.'))
    } finally {
      setSending(false)
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
          Champs
        </button>
        <div className="min-w-0">
          <h2 className="text-[20px] font-bold tracking-[-0.02em] text-[#17231c]">Notify champs</h2>
          <p className="mt-0.5 text-[12.5px] text-[#7c8780]">
            Push a message to all champs or a target group.
          </p>
        </div>
      </div>

      {sendError ? (
        <div className="mb-4 rounded-[12px] border border-[#f0c9c6] bg-[#fff5f4] px-4 py-3 text-[13px] text-[#b42318]">
          {sendError}
        </div>
      ) : null}
      {sendSuccess ? (
        <div className="mb-4 rounded-[12px] border border-[#b7e4c7] bg-[#f0faf4] px-4 py-3 text-[13px] text-[#147940]">
          {sendSuccess}
        </div>
      ) : null}

      <div className="mb-4 grid grid-cols-[minmax(0,1.7fr)_minmax(260px,1fr)] items-start gap-4 max-[900px]:grid-cols-1">
        <div className="space-y-4">
          <Card title="Audience">
            <p className={labelClass}>Send to</p>
            <Segmented options={AUDIENCE_OPTIONS} value={audience} onChange={setAudience} />

            {audience === 'By category' ? (
              <div className="mt-4">
                <span className={labelClass}>Category</span>
                <AdminFormMultiSelect
                  className="mt-1.5"
                  options={storeTypeOptions}
                  selectedIds={categories}
                  onChange={setCategories}
                  placeholder="Select store types"
                  searchPlaceholder="Search store types…"
                  loading={storeTypesLoading}
                  disabled={!useRealFleet}
                  emptyLabel="No store types from Store Management."
                />
                {storeTypesError ? (
                  <p className="mt-1 text-[12px] text-[#b42318]">{storeTypesError}</p>
                ) : null}
              </div>
            ) : null}

            {audience === 'By zone' ? (
              <div className="mt-4">
                <span className={labelClass}>Zone</span>
                <AdminFormMultiSelect
                  className="mt-1.5"
                  options={zoneOptions}
                  selectedIds={zones}
                  onChange={setZones}
                  placeholder="Select zones"
                  searchPlaceholder="Search zones…"
                  loading={zonesLoading}
                  disabled={!useRealFleet}
                  emptyLabel="No zones in country coverage."
                />
                {zonesError ? (
                  <p className="mt-1 text-[12px] text-[#b42318]">{zonesError}</p>
                ) : null}
              </div>
            ) : null}

            {audience === 'Selected' ? (
              <label className="mt-4 block">
                <span className={labelClass}>Champ IDs</span>
                <textarea
                  className="box-border min-h-[72px] w-full resize-y rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white px-3 py-2.5 text-[13px] text-[#17231c] outline-none transition placeholder:text-[#9aa49d] focus:border-[#1aa054]"
                  value={champIdsText}
                  onChange={(e) => setChampIdsText(e.target.value)}
                  placeholder="Paste champ ids or display codes, comma or newline separated"
                />
              </label>
            ) : null}

            <p className="mt-4 text-[12.5px] text-[#7c8780]">Estimated recipients</p>
            <p className="mt-1 text-[18px] font-bold text-[#17231c]">
              {estimateLoading
                ? '…'
                : estimated == null
                  ? '—'
                  : estimated.toLocaleString()}
            </p>
            {estimateError ? (
              <p className="mt-1 text-[12px] text-[#b42318]">{estimateError}</p>
            ) : null}
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

            {schedule === 'Schedule later' ? (
              <div className="mt-3 grid grid-cols-2 gap-3 max-[520px]:grid-cols-1">
                <div className="min-w-0">
                  <span className={labelClass}>Date</span>
                  <AdminDatePicker
                    className="mt-1.5"
                    value={scheduleDate}
                    onChange={setScheduleDate}
                    placeholder="DD/MM/YYYY"
                  />
                </div>
                <label className="block min-w-0">
                  <span className={labelClass}>Time</span>
                  <input
                    type="time"
                    className={cn(inputClass, 'mt-1.5 cursor-pointer')}
                    value={scheduleTime}
                    onClick={openTimePicker}
                    onFocus={openTimePicker}
                    onChange={(event) => setScheduleTime(event.target.value)}
                  />
                </label>
              </div>
            ) : null}
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
            disabled={sending || !useRealFleet}
            onClick={handleSend}
            className="mt-4 inline-flex h-[40px] w-full items-center justify-center rounded-full bg-[#1aa054] px-4 text-[13px] font-bold text-white hover:bg-[#158a47] disabled:opacity-60"
          >
            {sending
              ? schedule === 'Schedule later'
                ? 'Scheduling…'
                : 'Sending…'
              : schedule === 'Schedule later'
                ? 'Schedule notification'
                : 'Send notification'}
          </button>
          {!useRealFleet ? (
            <p className="mt-2 text-[12px] text-[#8a948e]">Enable real fleet API to send.</p>
          ) : null}
        </Card>
      </div>

      <Card title="Notification history">
        {historyError ? (
          <div className="mb-3 rounded-[10px] border border-[#f0c9c6] bg-[#fff5f4] px-3 py-2 text-[12.5px] text-[#b42318]">
            {historyError}
          </div>
        ) : null}
        {historyLoading ? (
          <p className="mb-3 text-[13px] text-[#7c8780]">Loading history…</p>
        ) : null}
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
                {historyRows.length === 0 && !historyLoading ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-6 text-center text-[13px] text-[#7c8780]"
                    >
                      No notifications yet.
                    </td>
                  </tr>
                ) : null}
                {historyRows.map((row) => (
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
                      <Badge tone={statusTone(row.statusKey)}>{row.status}</Badge>
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
