import { ChevronDown } from 'lucide-react'
import { cn } from '../cn'

const OPERATORS = ['≤', '≥', '=', '<', '>']

const inputClass =
  'box-border h-[36px] w-[52px] shrink-0 rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white text-center text-[13px] text-[#17231c] outline-none transition focus:border-[#1aa054]'

const selectClass =
  'box-border h-[36px] appearance-none rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white py-0 pl-2.5 pr-7 text-[13px] outline-none transition focus:border-[#1aa054]'

function pad2(n) {
  return String(Math.max(0, n)).padStart(2, '0')
}

function clampUnit(raw, max) {
  const digits = String(raw).replace(/\D/g, '').slice(0, 2)
  if (!digits) return ''
  return String(Math.min(max, Number.parseInt(digits, 10)))
}

function toClockString(parts) {
  const safe = parts || { h: '00', m: '00', s: '00' }
  return `${pad2(Number.parseInt(safe.h, 10) || 0)}:${pad2(Number.parseInt(safe.m, 10) || 0)}:${pad2(Number.parseInt(safe.s, 10) || 0)}`
}

function fromClockString(raw) {
  const digits = String(raw || '').replace(/\D/g, '').slice(0, 6).padEnd(6, '0')
  return {
    h: pad2(Math.min(23, Number.parseInt(digits.slice(0, 2), 10) || 0)),
    m: pad2(Math.min(59, Number.parseInt(digits.slice(2, 4), 10) || 0)),
    s: pad2(Math.min(59, Number.parseInt(digits.slice(4, 6), 10) || 0)),
  }
}

function TimeBox({ value, onChange, max = 59, label }) {
  return (
    <input
      className={inputClass}
      aria-label={label}
      inputMode="numeric"
      value={value}
      onChange={(event) => onChange(clampUnit(event.target.value, max))}
      onBlur={() => onChange(pad2(Number.parseInt(value, 10) || 0))}
    />
  )
}

function OperatorSelect({ value, onChange }) {
  return (
    <div className="relative h-[36px] w-[36px] shrink-0">
      <select
        aria-label="Operator"
        className="box-border h-full w-full cursor-pointer appearance-none rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white text-center text-[15px] font-semibold text-[#1aa054] outline-none transition focus:border-[#1aa054]"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {OPERATORS.map((op) => (
          <option key={op} value={op}>
            {op}
          </option>
        ))}
      </select>
    </div>
  )
}

function DurationInput({ value, onChange, showOperator = true, showUnits = false }) {
  const safe = value || { operator: '≤', h: '00', m: '00', s: '00' }
  return (
    <div className="flex flex-nowrap items-center gap-1.5">
      {showOperator ? (
        <OperatorSelect
          value={safe.operator || '≤'}
          onChange={(operator) => onChange({ ...safe, operator })}
        />
      ) : null}
      <TimeBox value={safe.h} max={23} label="Hours" onChange={(h) => onChange({ ...safe, h })} />
      {showUnits ? <span className="text-[12px] text-[#7c8780]">h</span> : null}
      <TimeBox value={safe.m} label="Minutes" onChange={(m) => onChange({ ...safe, m })} />
      {showUnits ? <span className="text-[12px] text-[#7c8780]">m</span> : null}
      <TimeBox value={safe.s} label="Seconds" onChange={(s) => onChange({ ...safe, s })} />
      {showUnits ? <span className="text-[12px] text-[#7c8780]">s</span> : null}
    </div>
  )
}

function WindowInput({ value, onChange }) {
  const safe = value || {
    from: { h: '00', m: '00', s: '00' },
    to: { h: '00', m: '00', s: '00' },
  }
  return (
    <div className="flex flex-nowrap items-center gap-2">
      <ClockField value={safe.from} onChange={(from) => onChange({ ...safe, from })} />
      <ClockField value={safe.to} onChange={(to) => onChange({ ...safe, to })} />
    </div>
  )
}

function ClockField({ value, onChange }) {
  const display = toClockString(value)

  return (
    <input
      className="box-border h-[36px] w-[108px] shrink-0 rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white px-2 text-center text-[13px] tracking-[0.04em] text-[#17231c] outline-none transition focus:border-[#1aa054]"
      aria-label="Time"
      inputMode="numeric"
      value={display}
      onChange={(event) => onChange(fromClockString(event.target.value))}
      onBlur={() => onChange(fromClockString(display))}
    />
  )
}

function PercentInput({ value, onChange }) {
  const safe = value || { operator: '≥', amount: '0' }
  return (
    <div className="flex flex-nowrap items-center gap-1.5">
      <OperatorSelect
        value={safe.operator || '≥'}
        onChange={(operator) => onChange({ ...safe, operator })}
      />
      <div className="inline-flex h-[36px] w-[72px] shrink-0 items-center justify-center gap-1 rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white px-2">
        <input
          className="w-[34px] appearance-none border-none bg-transparent p-0 text-center text-[13px] text-[#17231c] shadow-none outline-none ring-0 [border:none] focus:border-none focus:outline-none focus:ring-0"
          aria-label="Percentage"
          inputMode="decimal"
          value={safe.amount}
          onChange={(event) => onChange({ ...safe, amount: event.target.value.replace(/[^\d.]/g, '').slice(0, 5) })}
        />
        <span className="text-[12px] text-[#7c8780]">%</span>
      </div>
    </div>
  )
}

function GeoFenceInput({ value, onChange }) {
  const safe = value || { operator: '=', amount: '50' }
  return (
    <div className="flex flex-nowrap items-center gap-1.5">
      <OperatorSelect
        value={safe.operator || '='}
        onChange={(operator) => onChange({ ...safe, operator })}
      />
      <div className="inline-flex h-[36px] shrink-0 items-center gap-1 rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white px-2.5">
        <span className="text-[13px] text-[#7c8780]">±</span>
        <input
          className="w-[36px] appearance-none border-none bg-transparent p-0 text-center text-[13px] text-[#17231c] shadow-none outline-none ring-0 [border:none] focus:border-none focus:outline-none focus:ring-0"
          aria-label="Geo-fence meters"
          inputMode="numeric"
          value={safe.amount}
          onChange={(event) => onChange({ ...safe, amount: event.target.value.replace(/[^\d.]/g, '').slice(0, 5) })}
        />
        <span className="text-[12px] text-[#7c8780]">m</span>
      </div>
    </div>
  )
}

function NumberInput({ value, onChange, unit }) {
  const safe = value || { operator: '=', amount: '0' }
  return (
    <div className="flex flex-nowrap items-center gap-1.5">
      {safe.operator ? (
        <OperatorSelect
          value={safe.operator}
          onChange={(operator) => onChange({ ...safe, operator })}
        />
      ) : null}
      <input
        className={cn(inputClass, 'w-[56px]')}
        aria-label={unit || 'Value'}
        inputMode="decimal"
        value={safe.amount}
        onChange={(event) => onChange({ ...safe, amount: event.target.value.replace(/[^\d.]/g, '').slice(0, 5) })}
      />
      {unit ? <span className="text-[12px] text-[#7c8780]">{unit}</span> : null}
    </div>
  )
}

function SelectInput({ value, onChange, options, operator, onOperatorChange }) {
  return (
    <div className="flex flex-nowrap items-center gap-1.5">
      {operator != null ? (
        <OperatorSelect value={operator} onChange={onOperatorChange} />
      ) : null}
      <div className="relative min-w-[170px]">
        <select
          className={cn(selectClass, 'w-full min-w-[170px] text-[#17231c]')}
          value={typeof value === 'object' ? value.option : value}
          onChange={(event) => {
            if (typeof value === 'object') onChange({ ...value, option: event.target.value })
            else onChange(event.target.value)
          }}
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <ChevronDown
          size={12}
          className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#7c8780]"
          aria-hidden
        />
      </div>
    </div>
  )
}

function RatingInput({ value, onChange }) {
  const safe = value || { operator: '≥', amount: '4.5' }
  return (
    <div className="flex flex-nowrap items-center gap-1.5">
      <OperatorSelect
        value={safe.operator || '≥'}
        onChange={(operator) => onChange({ ...safe, operator })}
      />
      <input
        className={cn(inputClass, 'w-[56px]')}
        value={safe.amount}
        onChange={(event) => onChange({ ...safe, amount: event.target.value.replace(/[^\d.]/g, '') })}
      />
      <span className="text-[12px] text-[#7c8780]">/ 5</span>
    </div>
  )
}

function ClockInput({ value, onChange }) {
  const safe = value || { operator: '=', time: '12:00', period: 'PM' }
  return (
    <div className="flex flex-nowrap items-center gap-1.5">
      <OperatorSelect
        value={safe.operator || '='}
        onChange={(operator) => onChange({ ...safe, operator })}
      />
      <input
        className={cn(inputClass, 'w-[64px]')}
        value={safe.time}
        onChange={(event) => onChange({ ...safe, time: event.target.value })}
      />
      <div className="relative">
        <select
          className={cn(selectClass, 'text-[#17231c]')}
          value={safe.period}
          onChange={(event) => onChange({ ...safe, period: event.target.value })}
        >
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
        <ChevronDown
          size={12}
          className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#7c8780]"
          aria-hidden
        />
      </div>
    </div>
  )
}

function RangeInput({ value, onChange }) {
  const safe = value || { min: '0', max: '100' }
  return (
    <div className="flex flex-nowrap items-center gap-1.5">
      <input
        className={inputClass}
        aria-label="Range min"
        inputMode="numeric"
        value={safe.min}
        onChange={(event) => onChange({ ...safe, min: event.target.value.replace(/\D/g, '').slice(0, 3) })}
      />
      <span className="text-[12px] text-[#7c8780]">–</span>
      <input
        className={inputClass}
        aria-label="Range max"
        inputMode="numeric"
        value={safe.max}
        onChange={(event) => onChange({ ...safe, max: event.target.value.replace(/\D/g, '').slice(0, 3) })}
      />
    </div>
  )
}

function PeakHoursInput({ value, onChange, showUnits = false }) {
  const safe = value || {
    duration: { operator: '≤', h: '00', m: '02', s: '00' },
    percent: { operator: '≥', amount: '90' },
  }
  return (
    <div className="flex flex-nowrap items-center gap-2">
      <DurationInput
        value={safe.duration}
        showUnits={showUnits}
        onChange={(duration) => onChange({ ...safe, duration })}
      />
      <PercentInput
        value={safe.percent}
        onChange={(percent) => onChange({ ...safe, percent })}
      />
    </div>
  )
}

function FieldControl({ field, value, onChange }) {
  const showUnits = Boolean(field.showUnits)
  if (field.type === 'duration') {
    return <DurationInput value={value} onChange={onChange} showUnits={showUnits} />
  }
  if (field.type === 'window') return <WindowInput value={value} onChange={onChange} />
  if (field.type === 'percent') return <PercentInput value={value} onChange={onChange} />
  if (field.type === 'geofence') return <GeoFenceInput value={value} onChange={onChange} />
  if (field.type === 'number') return <NumberInput value={value} onChange={onChange} unit={field.unit} />
  if (field.type === 'select') {
    if (field.withOperator) {
      const safe = value || { operator: '=', option: field.options?.[0] }
      return (
        <SelectInput
          value={safe}
          options={field.options}
          operator={safe.operator || '='}
          onOperatorChange={(operator) => onChange({ ...safe, operator })}
          onChange={onChange}
        />
      )
    }
    return <SelectInput value={value} onChange={onChange} options={field.options} />
  }
  if (field.type === 'rating') return <RatingInput value={value} onChange={onChange} />
  if (field.type === 'clock') return <ClockInput value={value} onChange={onChange} />
  if (field.type === 'range') return <RangeInput value={value} onChange={onChange} />
  if (field.type === 'peakHours') {
    return <PeakHoursInput value={value} onChange={onChange} showUnits={showUnits} />
  }
  return null
}

function FieldRow({ field, value, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <span className="min-w-0 flex-1 text-[13px] text-[#455249]">{field.label}</span>
      <div className="shrink-0">
        <FieldControl field={field} value={value} onChange={onChange} />
      </div>
    </div>
  )
}

export function AdminVendorSlaTemplate({ sections, values, onChange }) {
  return (
    <div className="space-y-4">
      {sections.map((section) => (
        <section
          key={section.id}
          className="rounded-[14px] border border-[#eceeec] bg-white px-5 py-5 shadow-[0_1px_2px_rgba(20,40,28,.03)] max-[700px]:p-4"
        >
          <h3 className="mb-3 text-[15px] font-bold text-[#17231c]">{section.title}</h3>

          {section.tiers ? (
            <div className="space-y-5">
              {section.tiers.map((tier) => (
                <div key={tier.id}>
                  <span className="mb-2 inline-flex rounded-full bg-[#e8f7ed] px-2.5 py-1 text-[11px] font-bold text-[#147940]">
                    {tier.label}
                  </span>
                  <div>
                    {tier.fields.map((field) => (
                      <FieldRow
                        key={`${tier.id}-${field.key}`}
                        field={field}
                        value={values[section.id]?.[tier.id]?.[field.key]}
                        onChange={(next) =>
                          onChange({
                            ...values,
                            [section.id]: {
                              ...values[section.id],
                              [tier.id]: {
                                ...values[section.id][tier.id],
                                [field.key]: next,
                              },
                            },
                          })
                        }
                      />
                    ))}
                  </div>
                </div>
              ))}
              {section.allTiers?.length ? (
                <div>
                  <span className="mb-2 inline-flex rounded-full bg-[#e8f7ed] px-2.5 py-1 text-[11px] font-bold text-[#147940]">
                    {section.allTiersLabel || 'Others'}
                  </span>
                  <div>
                    {section.allTiers.map((field) => (
                      <FieldRow
                        key={`all-${field.key}`}
                        field={field}
                        value={values[section.id]?.all?.[field.key]}
                        onChange={(next) =>
                          onChange({
                            ...values,
                            [section.id]: {
                              ...values[section.id],
                              all: {
                                ...values[section.id].all,
                                [field.key]: next,
                              },
                            },
                          })
                        }
                      />
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div>
              {section.fields.map((field) => (
                <FieldRow
                  key={field.key}
                  field={field}
                  value={values[section.id]?.[field.key]}
                  onChange={(next) =>
                    onChange({
                      ...values,
                      [section.id]: {
                        ...values[section.id],
                        [field.key]: next,
                      },
                    })
                  }
                />
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  )
}

export function buildSlaDefaults(sections) {
  const defaults = {}
  sections.forEach((section) => {
    if (section.tiers) {
      defaults[section.id] = { all: {} }
      section.tiers.forEach((tier) => {
        defaults[section.id][tier.id] = {}
        tier.fields.forEach((field) => {
          defaults[section.id][tier.id][field.key] = structuredClone(field.default)
        })
      })
      section.allTiers?.forEach((field) => {
        defaults[section.id].all[field.key] = structuredClone(field.default)
      })
      return
    }
    defaults[section.id] = {}
    section.fields.forEach((field) => {
      defaults[section.id][field.key] = structuredClone(field.default)
    })
  })
  return defaults
}

const duration = (h, m, s, operator = '≤') => ({ operator, h, m, s })
const percent = (amount, operator = '≥') => ({ operator, amount })
const number = (amount, operator = '≤') => ({ operator, amount })
const clock = (time, period, operator = '=') => ({ operator, time, period })
const makeWindow = (from, to) => ({ from, to })
const range = (min, max) => ({ min, max })
const peakHours = (h, m, s, amount = '90') => ({
  duration: duration(h, m, s),
  percent: percent(amount),
})

const withUnits = (field) => ({ ...field, showUnits: true })

const scheduledTierFields = [
  { key: 'acceptance', label: 'Acceptance time', type: 'duration', default: duration('00', '05', '00') },
  { key: 'champCollection', label: 'Champ collection time', type: 'duration', default: duration('00', '20', '00') },
  { key: 'dailyOnline', label: 'Daily online hours', type: 'duration', default: duration('08', '00', '00', '≥') },
  { key: 'cutoff', label: 'Cutoff time', type: 'clock', default: clock('12:00', 'PM') },
  { key: 'prepMax', label: 'Prep time (max)', type: 'duration', default: duration('00', '45', '00') },
  { key: 'markReady', label: 'Mark ready within delivery window', type: 'duration', default: duration('00', '30', '00') },
]

export const VENDOR_SLA_SECTIONS = [
  {
    id: 'hot-food',
    title: '1) Hot food — on demand',
    fields: [
      { key: 'acceptance', label: 'Acceptance time', type: 'duration', default: duration('00', '02', '00') },
      { key: 'champCollection', label: 'Champ collection time', type: 'duration', default: duration('00', '10', '00') },
      { key: 'dailyOnline', label: 'Daily online hours', type: 'duration', default: duration('08', '00', '00', '≥') },
      {
        key: 'fullWindow',
        label: 'Full delivery window',
        type: 'window',
        default: makeWindow(duration('00', '00', '00'), duration('00', '00', '00')),
      },
      { key: 'prepMax', label: 'Prep time (max)', type: 'duration', default: duration('00', '18', '00') },
      { key: 'maxChampWait', label: 'Max champ wait at vendor', type: 'duration', default: duration('00', '04', '00') },
      { key: 'vendorIssue', label: 'Vendor issue response', type: 'duration', default: duration('02', '00', '00') },
      { key: 'orderAccuracy', label: 'Order accuracy', type: 'percent', default: percent('100') },
      { key: 'onTimeReady', label: 'On-time ready', type: 'percent', default: percent('90') },
      { key: 'vpiAccuracy', label: 'VPI · Accuracy weight', type: 'percent', default: percent('20', '=') },
      { key: 'vpiPacking', label: 'VPI · Packing weight', type: 'percent', default: percent('5', '=') },
      { key: 'vpiPrep', label: 'VPI · Prep time weight', type: 'percent', default: percent('25', '=') },
      { key: 'vpiReliability', label: 'VPI · Reliability weight', type: 'percent', default: percent('50', '=') },
      { key: 'nonDelivery', label: 'Non-delivery investigation', type: 'duration', default: duration('00', '15', '00') },
      { key: 'geoFence', label: 'GPS geo-fence check', type: 'geofence', default: number('50', '=') },
      { key: 'notifyDelay', label: 'Notify customer of delay', type: 'duration', default: duration('00', '10', '00') },
    ],
  },
  {
    id: 'dine-in',
    title: '2) Dine-in',
    fields: [
      { key: 'acceptance', label: 'Acceptance time', type: 'duration', default: duration('00', '02', '00') },
      { key: 'customerWait', label: 'Customer wait time', type: 'duration', default: duration('00', '15', '00') },
      { key: 'dailyOnline', label: 'Daily online hours', type: 'duration', default: duration('08', '00', '00', '≥') },
      {
        key: 'appPrice',
        label: 'App price vs in-store',
        type: 'select',
        options: ['Best low price', 'Same as price', 'Allow variance'],
        default: 'Best low price',
      },
      { key: 'reservationHonored', label: 'Reservation honored', type: 'percent', default: percent('100') },
      { key: 'billDispute', label: 'Bill dispute report window', type: 'duration', default: duration('24', '00', '00') },
      { key: 'reservationNotice', label: 'Reservation notice (advance)', type: 'duration', default: duration('02', '00', '00') },
      { key: 'billQuality', label: 'Bill quality review', type: 'duration', default: duration('48', '00', '00') },
    ],
  },
  {
    id: 'pickup',
    title: '3) Pickup',
    fields: [
      { key: 'acceptance', label: 'Acceptance time', type: 'duration', default: duration('00', '02', '00') },
      { key: 'customerWait', label: 'Customer wait time', type: 'duration', default: duration('00', '10', '00') },
      { key: 'dailyOnline', label: 'Daily online hours', type: 'duration', default: duration('08', '00', '00', '≥') },
      {
        key: 'earlyPickup',
        label: 'Early pick-up filter',
        type: 'select',
        options: ['Confirmed time', 'Estimated window', 'Flexible'],
        default: 'Confirmed time',
      },
      { key: 'maxCustomerWait', label: 'Max customer wait', type: 'duration', default: duration('00', '15', '00') },
      { key: 'orderHold', label: 'Order hold (overdue)', type: 'duration', default: duration('00', '20', '00') },
      { key: 'onTimePrep', label: 'On-time prep', type: 'percent', default: percent('80') },
      { key: 'notifyDelay', label: 'Notify customer of delay', type: 'duration', default: duration('00', '10', '00') },
    ],
  },
  {
    id: 'scheduled',
    title: '4) Scheduled delivery',
    allTiersLabel: 'Others',
    tiers: [
      { id: 'same-day', label: 'Same day', fields: scheduledTierFields },
      { id: 'next-day', label: 'Next day', fields: scheduledTierFields },
      { id: 'standard', label: 'Standard', fields: scheduledTierFields },
      { id: 'economy', label: 'Economy', fields: scheduledTierFields },
    ],
    allTiers: [
      { key: 'reliability', label: 'Scheduled reliability', type: 'percent', default: percent('95') },
      { key: 'advanceCancel', label: 'Advance cancel notice', type: 'duration', default: duration('02', '00', '00') },
      {
        key: 'prepAck',
        label: 'Preparation acknowledged',
        type: 'select',
        options: ['All types', 'Prepaid only', 'Cash only'],
        default: 'All types',
      },
    ],
  },
  {
    id: 'services',
    title: '5) Services',
    fields: [
      { key: 'acceptance', label: 'Acceptance time', type: 'duration', default: duration('00', '05', '00') },
      { key: 'attendance', label: 'Provider attendance', type: 'percent', default: percent('95') },
      { key: 'quality', label: 'Quality rating', type: 'rating', default: { operator: '≥', amount: '4.5' } },
      { key: 'lastMinuteCancel', label: 'Last minute cancellation', type: 'percent', default: percent('5', '≤') },
      {
        key: 'noShowHandling',
        label: 'No show handling',
        type: 'select',
        options: ['Full refund + APM', 'Partial refund', 'Reschedule only'],
        default: 'Full refund + APM',
      },
      { key: 'providerNoShowWait', label: 'Provider no-show wait', type: 'duration', default: duration('00', '15', '00') },
      { key: 'contactAttempts', label: 'Contact attempts (no-show)', type: 'number', unit: 'attempts', default: number('3', '=') },
      { key: 'qualityReport', label: 'Quality report window', type: 'duration', default: duration('48', '00', '00') },
      { key: 'damageReport', label: 'Property damage report window', type: 'duration', default: duration('72', '00', '00') },
    ],
  },
]

export const CHAMP_SLA_SECTIONS = [
  {
    id: 'acceptance',
    title: 'Acceptance time (per mode)',
    fields: [
      withUnits({ key: 'hotFood', label: 'Hot food', type: 'duration', default: duration('00', '01', '30') }),
      withUnits({ key: 'sameDay', label: 'Same day', type: 'duration', default: duration('00', '05', '00') }),
      withUnits({ key: 'nextDay', label: 'Next day', type: 'duration', default: duration('00', '10', '00') }),
      withUnits({ key: 'standard', label: 'Standard', type: 'duration', default: duration('00', '15', '00') }),
      withUnits({ key: 'economy', label: 'Economy', type: 'duration', default: duration('00', '20', '00') }),
      withUnits({ key: 'acceptFood', label: 'Acceptance — Food', type: 'duration', default: duration('00', '01', '30') }),
      withUnits({ key: 'acceptGrocery', label: 'Acceptance — Grocery/Pharmacy', type: 'duration', default: duration('00', '03', '00') }),
      withUnits({ key: 'acceptFlowers', label: 'Acceptance — Flowers', type: 'duration', default: duration('00', '03', '00') }),
      withUnits({ key: 'acceptElectronics', label: 'Acceptance — Electronics', type: 'duration', default: duration('00', '05', '00') }),
    ],
  },
  {
    id: 'performance',
    title: 'Performance thresholds',
    fields: [
      withUnits({ key: 'doubleConfirm', label: 'Double confirmation', type: 'duration', default: duration('00', '00', '30') }),
      { key: 'onTimeDelivery', label: 'On-time delivery', type: 'percent', default: percent('90') },
      withUnits({ key: 'workingHours', label: 'Working hours (daily)', type: 'duration', default: duration('08', '00', '00', '≥') }),
      withUnits({
        key: 'peakHours',
        label: 'Peak hours',
        type: 'peakHours',
        default: peakHours('00', '02', '00', '90'),
      }),
      { key: 'customerRating', label: 'Customer rating', type: 'rating', default: { operator: '≥', amount: '4.5' } },
      { key: 'arrivalCompliance', label: 'Arrival / Pickup Window Compliance', type: 'percent', default: percent('90') },
      { key: 'orderCompletion', label: 'Order Completion Rate', type: 'percent', default: percent('95') },
      { key: 'conductCompliance', label: 'Conduct Compliance', type: 'percent', default: percent('100') },
      withUnits({ key: 'pickupArrival', label: 'Pickup arrival — city/suburb', type: 'duration', default: duration('00', '12', '00') }),
      withUnits({ key: 'vendorWaitFood', label: 'Vendor wait — Food', type: 'duration', default: duration('00', '04', '00') }),
      withUnits({ key: 'vendorWaitGrocery', label: 'Vendor wait — Grocery', type: 'duration', default: duration('00', '06', '00') }),
      withUnits({ key: 'vendorWaitFlowers', label: 'Vendor wait — Flowers', type: 'duration', default: duration('00', '05', '00') }),
      withUnits({ key: 'vendorWaitElectronics', label: 'Vendor wait — Electronics', type: 'duration', default: duration('00', '08', '00') }),
      withUnits({ key: 'unreachableWait', label: 'Customer unreachable wait', type: 'duration', default: duration('00', '05', '00') }),
      { key: 'contactAttempts', label: 'Contact attempts (unreachable)', type: 'number', unit: 'attempts', default: number('3', '=') },
      {
        key: 'wrongOrderReport',
        label: 'Wrong-order report',
        type: 'select',
        withOperator: true,
        options: ['Before departure', 'At vendor', 'After delivery'],
        default: { operator: '=', option: 'Before departure' },
      },
      withUnits({ key: 'emergencyOnDemand', label: 'Emergency reassign — on-demand', type: 'duration', default: duration('00', '03', '00') }),
      withUnits({ key: 'emergencyScheduled', label: 'Emergency reassign — scheduled', type: 'duration', default: duration('00', '10', '00') }),
      {
        key: 'appGpsFailure',
        label: 'App / GPS failure report',
        type: 'select',
        withOperator: true,
        options: ['Immediate', 'Within 5 min', 'End of shift'],
        default: { operator: '=', option: 'Immediate' },
      },
      withUnits({ key: 'tempWorkaround', label: 'Temp workaround', type: 'duration', default: duration('00', '15', '00') }),
      withUnits({ key: 'champAssignment', label: 'Champ assignment', type: 'duration', default: duration('00', '02', '00') }),
    ],
  },
  {
    id: 'tier',
    title: 'Tier',
    fields: [
      { key: 'elite', label: 'Elite', type: 'range', default: range('90', '100') },
      { key: 'gold', label: 'Gold', type: 'range', default: range('80', '89') },
      { key: 'silver', label: 'Silver', type: 'range', default: range('70', '79') },
      { key: 'bronze', label: 'Bronze', type: 'range', default: range('60', '69') },
      { key: 'base', label: 'Base', type: 'range', default: range('0', '59') },
    ],
  },
]
