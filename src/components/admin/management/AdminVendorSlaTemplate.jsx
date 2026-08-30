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
    <div className="relative h-[36px] w-[42px] shrink-0">
      <select
        aria-label="Operator"
        className="box-border h-full w-full cursor-pointer appearance-none rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white py-0 pl-1.5 pr-4 text-center text-[15px] font-semibold text-[#1aa054] outline-none transition focus:border-[#1aa054]"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {OPERATORS.map((op) => (
          <option key={op} value={op}>
            {op}
          </option>
        ))}
      </select>
      <ChevronDown
        size={11}
        className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-[#7c8780]"
        aria-hidden
      />
    </div>
  )
}

function DurationInput({ value, onChange, showOperator = true, showUnits = false, hourMax = 23, tone = 'default' }) {
  const safe = value || { operator: '≤', h: '00', m: '00', s: '00' }
  const toneClass =
    tone === 'risk'
      ? '[&_input]:border-[#E3B341] [&_input]:bg-[#FFF4DE] [&_input]:text-[#9A6B00]'
      : tone === 'critical'
        ? '[&_input]:border-[#E3A1A1] [&_input]:bg-[#FDECEC] [&_input]:text-[#B3261E]'
        : tone === 'target'
          ? '[&_input]:border-[rgba(0,0,0,0.08)] [&_input]:bg-[#f8faf8] [&_input]:text-[#455249]'
          : ''
  return (
    <div className={cn('flex flex-nowrap items-center gap-1.5', toneClass)}>
      {showOperator ? (
        <OperatorSelect
          value={safe.operator || '≤'}
          onChange={(operator) => onChange({ ...safe, operator })}
        />
      ) : null}
      <TimeBox value={safe.h} max={hourMax} label="Hours" onChange={(h) => onChange({ ...safe, h })} />
      {showUnits ? <span className="text-[12px] text-[#7c8780]">h</span> : null}
      <TimeBox value={safe.m} label="Minutes" onChange={(m) => onChange({ ...safe, m })} />
      {showUnits ? <span className="text-[12px] text-[#7c8780]">m</span> : null}
      <TimeBox value={safe.s} label="Seconds" onChange={(s) => onChange({ ...safe, s })} />
      {showUnits ? <span className="text-[12px] text-[#7c8780]">s</span> : null}
    </div>
  )
}

function DurationTierInput({ value, onChange, showUnits = true }) {
  const safe = value || {
    target: { operator: '≤', h: '00', m: '00', s: '00' },
    atRisk: { operator: '≤', h: '00', m: '00', s: '00' },
    critical: { operator: '≤', h: '00', m: '00', s: '00' },
  }
  return (
    <div className="grid grid-cols-1 gap-2 min-[900px]:grid-cols-3">
      <DurationInput
        value={safe.target}
        showUnits={showUnits}
        tone="target"
        onChange={(target) => onChange({ ...safe, target })}
      />
      <DurationInput
        value={safe.atRisk}
        showUnits={showUnits}
        tone="risk"
        onChange={(atRisk) => onChange({ ...safe, atRisk })}
      />
      <DurationInput
        value={safe.critical}
        showUnits={showUnits}
        tone="critical"
        onChange={(critical) => onChange({ ...safe, critical })}
      />
    </div>
  )
}

function StatusFlags() {
  return (
    <div className="flex items-center justify-center gap-1">
      <span className="h-[7px] w-[7px] rounded-full bg-[#3E9B4F]" title="Within target" />
      <span className="h-[7px] w-[7px] rounded-full bg-[#E3B341]" title="At risk" />
      <span className="h-[7px] w-[7px] rounded-full bg-[#D64545]" title="Critical" />
    </div>
  )
}

function TierGrid({ fields, values, onChange, metricLabel = 'Metric' }) {
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[720px]">
        <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_0.6fr] gap-2.5 border-b border-[#eceeec] px-1 pb-2 text-[10.5px] font-semibold uppercase tracking-[0.04em] text-[#7c8780]">
          <span>{metricLabel}</span>
          <span>Target</span>
          <span className="text-[#9A6B00]">At-risk threshold</span>
          <span className="text-[#B3261E]">Critical threshold</span>
          <span className="text-center">Flags</span>
        </div>
        {fields.map((field) => (
          <div
            key={field.key}
            className="grid grid-cols-[1.5fr_1fr_1fr_1fr_0.6fr] items-center gap-2.5 border-b border-[#eceeec] px-1 py-3 last:border-b-0"
          >
            <div className="min-w-0">
              <div className="text-[13.5px] font-medium text-[#17231c]">{field.label}</div>
              {field.hint ? (
                <div className="mt-0.5 text-[11px] leading-snug text-[#7c8780]">{field.hint}</div>
              ) : null}
            </div>
            <DurationInput
              value={values?.[field.key]?.target}
              showUnits={field.showUnits !== false}
              tone="target"
              onChange={(target) =>
                onChange({
                  ...values,
                  [field.key]: { ...values?.[field.key], target },
                })
              }
            />
            <DurationInput
              value={values?.[field.key]?.atRisk}
              showUnits={field.showUnits !== false}
              tone="risk"
              onChange={(atRisk) =>
                onChange({
                  ...values,
                  [field.key]: { ...values?.[field.key], atRisk },
                })
              }
            />
            <DurationInput
              value={values?.[field.key]?.critical}
              showUnits={field.showUnits !== false}
              tone="critical"
              onChange={(critical) =>
                onChange({
                  ...values,
                  [field.key]: { ...values?.[field.key], critical },
                })
              }
            />
            <StatusFlags />
          </div>
        ))}
      </div>
    </div>
  )
}

export function SlaLegend() {
  return (
    <div className="mt-3 flex flex-wrap gap-4 text-[12px] text-[#7c8780]">
      <span className="inline-flex items-center gap-1.5">
        <span className="h-[7px] w-[7px] rounded-full bg-[#3E9B4F]" />
        Within target — on track
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-[7px] w-[7px] rounded-full bg-[#E3B341]" />
        Past at-risk threshold
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-[7px] w-[7px] rounded-full bg-[#D64545]" />
        Past critical threshold
      </span>
    </div>
  )
}

function PriorityBox({ value, onChange, readOnly = false }) {
  if (readOnly) {
    return (
      <span className="inline-flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-[8px] border border-[rgba(0,0,0,0.08)] bg-[#f3f5f3] text-[13px] font-semibold text-[#455249]">
        {value}
      </span>
    )
  }
  return (
    <input
      className="box-border h-[36px] w-[36px] shrink-0 rounded-[8px] border border-[rgba(0,0,0,0.08)] bg-[#f3f5f3] text-center text-[13px] font-semibold text-[#455249] outline-none transition focus:border-[#1aa054]"
      aria-label="Priority"
      inputMode="numeric"
      value={value}
      onChange={(event) => onChange(event.target.value.replace(/\D/g, '').slice(0, 1))}
      onBlur={() => onChange(String(Math.min(9, Math.max(1, Number.parseInt(value, 10) || 1))))}
    />
  )
}

function PriorityDurationInput({ value, onChange, readOnly = false }) {
  const safe = value || { priority: '1', h: '00', m: '00', s: '00' }
  return (
    <div className="flex flex-nowrap items-center gap-1.5">
      <PriorityBox
        value={safe.priority || '1'}
        readOnly={readOnly}
        onChange={(priority) => onChange({ ...safe, priority })}
      />
      <span className="text-[13px] text-[#7c8780]">–</span>
      {readOnly ? (
        <span className="inline-flex h-[36px] items-center rounded-[8px] border border-[rgba(0,0,0,0.08)] bg-[#f8faf8] px-2.5 text-[13px] tracking-[0.04em] text-[#455249]">
          {pad2(Number.parseInt(safe.h, 10) || 0)}:{pad2(Number.parseInt(safe.m, 10) || 0)}:
          {pad2(Number.parseInt(safe.s, 10) || 0)}
        </span>
      ) : (
        <DurationInput
          value={safe}
          showOperator={false}
          hourMax={99}
          onChange={(next) => onChange({ ...safe, h: next.h, m: next.m, s: next.s })}
        />
      )}
    </div>
  )
}

function ReadonlyValue({ value }) {
  return (
    <span className="inline-flex h-[36px] min-w-[120px] items-center justify-end rounded-[8px] border border-[rgba(0,0,0,0.08)] bg-[#f8faf8] px-3 text-[13px] text-[#455249]">
      {value}
    </span>
  )
}

function MonitoredOperator({ value }) {
  return (
    <span className="inline-flex h-[36px] w-[42px] shrink-0 items-center justify-center gap-0.5 rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white text-[15px] font-semibold text-[#1aa054]">
      <span>{value || '='}</span>
      <ChevronDown size={11} className="shrink-0 text-[#7c8780]" aria-hidden />
    </span>
  )
}

function ReferenceBox({ children, className }) {
  return (
    <span
      className={cn(
        'inline-flex h-[36px] items-center justify-center gap-1 rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white text-[13px] text-[#17231c]',
        className,
      )}
    >
      {children}
      <ChevronDown size={11} className="shrink-0 text-[#7c8780]" aria-hidden />
    </span>
  )
}

function ReferenceDuration({ value, showUnits = true }) {
  const safe = value || { operator: '=', h: '00', m: '00', s: '00' }
  return (
    <div className="flex flex-nowrap items-center gap-1.5">
      <MonitoredOperator value={safe.operator} />
      <ReferenceBox className="w-[52px]">{pad2(Number.parseInt(safe.h, 10) || 0)}</ReferenceBox>
      {showUnits ? <span className="text-[12px] text-[#7c8780]">h</span> : null}
      <ReferenceBox className="w-[52px]">{pad2(Number.parseInt(safe.m, 10) || 0)}</ReferenceBox>
      {showUnits ? <span className="text-[12px] text-[#7c8780]">m</span> : null}
      <ReferenceBox className="w-[52px]">{pad2(Number.parseInt(safe.s, 10) || 0)}</ReferenceBox>
      {showUnits ? <span className="text-[12px] text-[#7c8780]">s</span> : null}
    </div>
  )
}

function ReferenceText({ value }) {
  const safe = value || { operator: '=', text: '' }
  return (
    <div className="flex flex-nowrap items-center gap-1.5">
      <MonitoredOperator value={safe.operator} />
      <ReferenceBox className="px-2.5">{safe.text}</ReferenceBox>
    </div>
  )
}

function ReferencePercent({ value }) {
  const safe = value || { operator: '=', amount: '0' }
  return (
    <div className="flex flex-nowrap items-center gap-1.5">
      <MonitoredOperator value={safe.operator} />
      <ReferenceBox className="px-2.5">
        {safe.amount}
        <span className="text-[12px] text-[#7c8780]">%</span>
      </ReferenceBox>
    </div>
  )
}

function ReferenceMoney({ value }) {
  const safe = value || { operator: '≥', currency: 'BHD', amount: '0' }
  return (
    <div className="flex flex-nowrap items-center gap-1.5">
      <MonitoredOperator value={safe.operator} />
      <ReferenceBox className="px-2.5">
        <span className="text-[12px] text-[#7c8780]">{safe.currency}</span>
        {safe.amount}
      </ReferenceBox>
    </div>
  )
}

function ReferenceControl({ field }) {
  const value = field.default
  if (field.valueType === 'duration') {
    return <ReferenceDuration value={value} showUnits={field.showUnits !== false} />
  }
  if (field.valueType === 'percent') return <ReferencePercent value={value} />
  if (field.valueType === 'money') return <ReferenceMoney value={value} />
  return <ReferenceText value={value} />
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

function PercentInput({ value, onChange, showOperator = true }) {
  const safe = value || { operator: '≥', amount: '0' }
  return (
    <div className="flex flex-nowrap items-center gap-1.5">
      {showOperator ? (
        <OperatorSelect
          value={safe.operator || '≥'}
          onChange={(operator) => onChange({ ...safe, operator })}
        />
      ) : null}
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
      <div className="inline-flex h-[36px] min-w-[88px] shrink-0 items-center justify-center gap-1 rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white px-2.5">
        <input
          className="w-[28px] appearance-none border-none bg-transparent p-0 text-center text-[13px] text-[#17231c] shadow-none outline-none ring-0 [border:none] focus:border-none focus:outline-none focus:ring-0"
          aria-label={unit || 'Value'}
          inputMode="decimal"
          value={safe.amount}
          onChange={(event) => onChange({ ...safe, amount: event.target.value.replace(/[^\d.]/g, '').slice(0, 5) })}
        />
        {unit ? <span className="text-[12px] text-[#7c8780]">{unit}</span> : null}
      </div>
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
      <div className="inline-flex h-[36px] min-w-[88px] shrink-0 items-center justify-center gap-1 rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white px-2.5">
        <input
          className="w-[34px] appearance-none border-none bg-transparent p-0 text-center text-[13px] text-[#17231c] shadow-none outline-none ring-0 [border:none] focus:border-none focus:outline-none focus:ring-0"
          aria-label="Rating"
          inputMode="decimal"
          value={safe.amount}
          onChange={(event) => onChange({ ...safe, amount: event.target.value.replace(/[^\d.]/g, '').slice(0, 4) })}
        />
        <span className="text-[12px] text-[#7c8780]">/ 5</span>
      </div>
    </div>
  )
}

function normalizeClockTime(raw) {
  const digits = String(raw || '')
    .replace(/\D/g, '')
    .slice(0, 6)
    .padEnd(6, '0')
  const hNum = Number.parseInt(digits.slice(0, 2), 10) || 12
  const h = pad2(Math.min(12, Math.max(1, hNum > 12 ? hNum % 12 || 12 : hNum)))
  const m = pad2(Math.min(59, Number.parseInt(digits.slice(2, 4), 10) || 0))
  const s = pad2(Math.min(59, Number.parseInt(digits.slice(4, 6), 10) || 0))
  return `${h}:${m}:${s}`
}

function ClockInput({ value, onChange }) {
  const safe = value || { operator: '=', time: '12:00:00', period: 'PM' }
  return (
    <div className="flex flex-nowrap items-center gap-1.5">
      <OperatorSelect
        value={safe.operator || '='}
        onChange={(operator) => onChange({ ...safe, operator })}
      />
      <div className="relative inline-flex h-[36px] shrink-0 items-center rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white pl-2.5 pr-1">
        <input
          className="w-[72px] appearance-none border-none bg-transparent p-0 text-center text-[13px] tracking-[0.04em] text-[#17231c] shadow-none outline-none ring-0 [border:none] focus:border-none focus:outline-none focus:ring-0"
          aria-label="Time"
          inputMode="numeric"
          value={safe.time}
          onChange={(event) => onChange({ ...safe, time: event.target.value })}
          onBlur={() => onChange({ ...safe, time: normalizeClockTime(safe.time) })}
        />
        <div className="relative">
          <select
            className="cursor-pointer appearance-none border-none bg-transparent py-0 pl-1 pr-5 text-[13px] text-[#17231c] outline-none"
            aria-label="AM/PM"
            value={safe.period}
            onChange={(event) => onChange({ ...safe, period: event.target.value })}
          >
            <option value="AM">AM</option>
            <option value="PM">PM</option>
          </select>
          <ChevronDown
            size={12}
            className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-[#7c8780]"
            aria-hidden
          />
        </div>
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
  const readOnly = Boolean(field.readOnly)
  if (field.type === 'duration') {
    return <DurationInput value={value} onChange={onChange} showUnits={showUnits} />
  }
  if (field.type === 'durationTier') {
    return <DurationTierInput value={value} onChange={onChange} showUnits={showUnits} />
  }
  if (field.type === 'priorityDuration') {
    return <PriorityDurationInput value={value} onChange={onChange} readOnly={readOnly} />
  }
  if (field.type === 'window') return <WindowInput value={value} onChange={onChange} />
  if (field.type === 'percent') {
    return (
      <PercentInput
        value={value}
        onChange={onChange}
        showOperator={field.showOperator !== false}
      />
    )
  }
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
  if (field.type === 'reference') return <ReferenceControl field={field} />
  if (field.type === 'readonly') return <ReadonlyValue value={value} />
  return null
}

function FieldRow({ field, value, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <span className="min-w-0 flex-1 text-[13px] text-[#455249]">{field.label}</span>
      <div className="flex min-w-[280px] shrink-0 justify-end">
        <FieldControl field={field} value={value} onChange={onChange} />
      </div>
    </div>
  )
}

const TIER_GRID_FIELD_TYPES = new Set(['duration', 'durationTier'])
const STANDARD_TIER_SUBTITLE =
  'Each metric carries three values: the operational target, the point it flips to At risk, and the point it flips to Critical.'

export const SLA_TIER_FOOTNOTES = {
  vendor:
    'Crossing the at-risk value flags the order At risk on Live Dashboard. Crossing critical flags it Critical. Flags are computed live from elapsed time — not editable directly.',
  champ:
    'Champ breaches at critical apply the At Risk / At Risk Champ 0.20× dispatch penalty per the CPI framework — suspension stays a dispatcher decision.',
  dispatcher:
    "An order sitting unassigned past critical should surface at the top of the dispatcher's live queue, sorted above At risk orders.",
}

function durationPartsToSec(parts) {
  const safe = parts || { h: '00', m: '00', s: '00' }
  const h = Number.parseInt(safe.h, 10) || 0
  const m = Number.parseInt(safe.m, 10) || 0
  const s = Number.parseInt(safe.s, 10) || 0
  return h * 3600 + m * 60 + s
}

function secToDurationParts(totalSec, operator = '≤') {
  const total = Math.max(0, Math.round(totalSec))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return { operator, h: pad2(h), m: pad2(m), s: pad2(s) }
}

function durationDefaultToTier(defaultValue) {
  if (defaultValue?.target) return structuredClone(defaultValue)
  const operator = defaultValue?.operator || '≤'
  const targetSec = durationPartsToSec(defaultValue)
  const atRiskSec = Math.max(targetSec, Math.round(targetSec * 1.67))
  const criticalSec = Math.max(atRiskSec, Math.round(targetSec * 2.5))
  return {
    target: secToDurationParts(targetSec, operator),
    atRisk: secToDurationParts(atRiskSec, operator),
    critical: secToDurationParts(criticalSec, operator),
  }
}

function fieldToGridField(field) {
  return {
    key: field.key,
    label: field.label,
    hint: field.hint,
    showUnits: field.showUnits !== false,
    default:
      field.type === 'durationTier'
        ? structuredClone(field.default)
        : durationDefaultToTier(field.default),
  }
}

function resolveTierGridFields(section) {
  const explicit = section.tierGridFields ?? []
  const usedKeys = new Set(explicit.map((field) => field.key))
  const auto = (section.fields ?? [])
    .filter((field) => TIER_GRID_FIELD_TYPES.has(field.type) && !usedKeys.has(field.key))
    .map(fieldToGridField)
  return [...explicit, ...auto]
}

function nonTierFields(section) {
  return (section.fields ?? []).filter((field) => !TIER_GRID_FIELD_TYPES.has(field.type))
}

function defaultValueForField(field) {
  if (field.type === 'duration') return durationDefaultToTier(field.default)
  return structuredClone(field.default)
}

function TierGridSection({ tierGridFields, values, onChange, metricLabel }) {
  if (!tierGridFields.length) return null
  return (
    <TierGrid
      fields={tierGridFields}
      values={values}
      metricLabel={metricLabel}
      onChange={onChange}
    />
  )
}

export function SlaTierPageFooter({ footnote }) {
  if (!footnote) return null
  return (
    <div className="mb-24 mt-2 space-y-3">
      <p className="rounded-[8px] border border-[#eceeec] bg-[#F8FDF8] px-3 py-2.5 text-[12px] leading-relaxed text-[#7c8780]">
        {footnote}
      </p>
      <SlaLegend />
    </div>
  )
}

export function AdminVendorSlaTemplate({ sections, values, onChange }) {
  return (
    <div className="space-y-4">
      {sections.map((section) => {
        const tierGridFields = resolveTierGridFields(section)
        const otherFields = nonTierFields(section)
        const subtitle =
          section.subtitle ?? (tierGridFields.length ? STANDARD_TIER_SUBTITLE : null)

        return (
        <section
          key={section.id}
          className="rounded-[14px] border border-[#eceeec] bg-white px-5 py-5 shadow-[0_1px_2px_rgba(20,40,28,.03)] max-[700px]:p-4"
        >
          <h3 className={cn('text-[15px] font-bold text-[#17231c]', subtitle ? 'mb-1' : 'mb-3')}>
            {section.title}
          </h3>
          {subtitle ? (
            <p className="mb-3 text-[12.5px] leading-[1.4] text-[#7c8780]">{subtitle}</p>
          ) : null}

          <TierGridSection
            tierGridFields={tierGridFields}
            values={values[section.id]}
            metricLabel={section.metricLabel || 'Metric'}
            onChange={(next) =>
              onChange({
                ...values,
                [section.id]: {
                  ...values[section.id],
                  ...next,
                },
              })
            }
          />

          {section.tiers ? (
            <div className="space-y-5">
              {section.tiers.map((tier) => {
                const tierGrid = resolveTierGridFields({ fields: tier.fields })
                const tierOther = (tier.fields ?? []).filter(
                  (field) => !TIER_GRID_FIELD_TYPES.has(field.type),
                )
                return (
                <div key={tier.id}>
                  <span className="mb-2 inline-flex rounded-full bg-[#e8f7ed] px-2.5 py-1 text-[11px] font-bold text-[#147940]">
                    {tier.label}
                  </span>
                  <TierGridSection
                    tierGridFields={tierGrid}
                    values={values[section.id]?.[tier.id]}
                    metricLabel="Metric"
                    onChange={(next) =>
                      onChange({
                        ...values,
                        [section.id]: {
                          ...values[section.id],
                          [tier.id]: {
                            ...values[section.id]?.[tier.id],
                            ...next,
                          },
                        },
                      })
                    }
                  />
                  <div>
                    {tierOther.map((field) => (
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
              )})}
              {section.allTiers?.length ? (
                <div>
                  <div
                    className={cn(
                      'mb-2 text-[11px] font-bold text-[#147940]',
                      section.allTiersBanner
                        ? 'flex w-full items-center rounded-[8px] bg-[#e8f7ed] px-3 py-2 text-[12.5px]'
                        : 'inline-flex rounded-full bg-[#e8f7ed] px-2.5 py-1',
                    )}
                  >
                    {section.allTiersLabel || 'All tiers'}
                  </div>
                  <TierGridSection
                    tierGridFields={resolveTierGridFields({ fields: section.allTiers })}
                    values={values[section.id]?.all}
                    metricLabel="Metric"
                    onChange={(next) =>
                      onChange({
                        ...values,
                        [section.id]: {
                          ...values[section.id],
                          all: {
                            ...values[section.id]?.all,
                            ...next,
                          },
                        },
                      })
                    }
                  />
                  <div>
                    {(section.allTiers ?? [])
                      .filter((field) => !TIER_GRID_FIELD_TYPES.has(field.type))
                      .map((field) => (
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
          ) : otherFields.length ? (
            <div>
              {otherFields.map((field) => (
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
          ) : null}
        </section>
      )})}
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
          defaults[section.id][tier.id][field.key] = defaultValueForField(field)
        })
      })
      section.allTiers?.forEach((field) => {
        defaults[section.id].all[field.key] = defaultValueForField(field)
      })
      return
    }
    defaults[section.id] = {}
    section.tierGridFields?.forEach((field) => {
      defaults[section.id][field.key] = structuredClone(field.default)
    })
    section.fields?.forEach((field) => {
      defaults[section.id][field.key] = defaultValueForField(field)
    })
  })
  return defaults
}

const duration = (h, m, s, operator = '≤') => ({ operator, h, m, s })
const durationTier = (
  targetH,
  targetM,
  targetS,
  atRiskH,
  atRiskM,
  atRiskS,
  criticalH,
  criticalM,
  criticalS,
  operator = '≤',
) => ({
  target: duration(targetH, targetM, targetS, operator),
  atRisk: duration(atRiskH, atRiskM, atRiskS, operator),
  critical: duration(criticalH, criticalM, criticalS, operator),
})
const priorityDuration = (priority, h, m, s) => ({ priority: String(priority), h, m, s })
const percent = (amount, operator = '≥') => ({ operator, amount })
const number = (amount, operator = '≤') => ({ operator, amount })
const clock = (time, period, operator = '=') => ({
  operator,
  time: time.includes(':') && time.split(':').length === 2 ? `${time}:00` : time,
  period,
})
const makeWindow = (from, to) => ({ from, to })
const range = (min, max) => ({ min, max })
const peakHours = (h, m, s, amount = '90') => ({
  duration: duration(h, m, s),
  percent: percent(amount),
})

const withUnits = (field) => ({ ...field, showUnits: true })
const tierField = (key, label, targetH, targetM, targetS, atRiskH, atRiskM, atRiskS, critH, critM, critS, extras = {}) =>
  withUnits({
    key,
    label,
    type: 'durationTier',
    default: durationTier(targetH, targetM, targetS, atRiskH, atRiskM, atRiskS, critH, critM, critS),
    ...extras,
  })
const gridField = (
  key,
  label,
  targetH,
  targetM,
  targetS,
  atRiskH,
  atRiskM,
  atRiskS,
  critH,
  critM,
  critS,
  extras = {},
) => {
  const operator = extras.operator || '≤'
  const { operator: _ignored, ...rest } = extras
  return {
    key,
    label,
    showUnits: true,
    default: durationTier(targetH, targetM, targetS, atRiskH, atRiskM, atRiskS, critH, critM, critS, operator),
    ...rest,
  }
}
const pd = (key, label, priority, h, m, s, extras = {}) => ({
  key,
  label,
  type: 'priorityDuration',
  default: priorityDuration(priority, h, m, s),
  ...extras,
})
const refText = (key, label, text, operator = '=', extras = {}) => ({
  key,
  label,
  type: 'reference',
  valueType: 'text',
  default: { operator, text },
  ...extras,
})
const refDuration = (key, label, h, m, s, operator = '≤') =>
  withUnits({
    key,
    label,
    type: 'reference',
    valueType: 'duration',
    default: duration(h, m, s, operator),
  })
const refPercent = (key, label, amount, operator = '=') => ({
  key,
  label,
  type: 'reference',
  valueType: 'percent',
  default: percent(amount, operator),
})
const refMoney = (key, label, amount, currency = 'BHD', operator = '≥') => ({
  key,
  label,
  type: 'reference',
  valueType: 'money',
  default: { operator, currency, amount },
})

const scheduledTierFields = [
  tierField('acceptance', 'Acceptance time', '00', '05', '00', '00', '08', '00', '00', '12', '00'),
  tierField('champCollection', 'Champ collection time', '00', '20', '00', '00', '28', '00', '00', '40', '00'),
  withUnits({ key: 'dailyOnline', label: 'Daily online hours', type: 'duration', default: duration('08', '00', '00', '≥') }),
  { key: 'cutoff', label: 'Cutoff time', type: 'clock', default: clock('12:00:00', 'PM') },
  { key: 'prepMax', label: 'Prepare time (max)', type: 'clock', default: clock('08:00:00', 'PM', '≤') },
  withUnits({
    key: 'markReady',
    label: 'Mark ready within delivery window',
    type: 'duration',
    default: duration('00', '30', '00'),
  }),
]

export const VENDOR_SLA_SECTIONS = [
  {
    id: 'hot-food',
    title: '1) Hot food — on demand',
    subtitle:
      'Each metric carries three values: the operational target, the point it flips to At risk, and the point it flips to Critical.',
    tierGridFields: [
      gridField('acceptance', 'Acceptance time', '00', '03', '00', '00', '05', '00', '00', '08', '00', {
        hint: 'Time for vendor to accept a new order',
      }),
      gridField('champCollection', 'Champ collection time', '00', '10', '00', '00', '14', '00', '00', '20', '00', {
        hint: 'Time from order-ready to champ pickup',
      }),
      gridField('prepMax', 'Prep time (max)', '00', '15', '00', '00', '20', '00', '00', '28', '00', {
        hint: 'Kitchen prep window for hot food',
      }),
      gridField('dailyOnline', 'Daily online hours', '10', '00', '00', '08', '00', '00', '06', '00', '00', {
        hint: 'Minimum hours vendor must be online',
        operator: '≥',
      }),
    ],
    fields: [
      {
        key: 'fullWindow',
        label: 'Full delivery window',
        type: 'window',
        default: makeWindow(duration('00', '00', '00'), duration('00', '00', '00')),
      },
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
      withUnits({ key: 'acceptance', label: 'Acceptance time', type: 'duration', default: duration('00', '02', '00') }),
      withUnits({ key: 'customerWait', label: 'Customer wait time', type: 'duration', default: duration('00', '15', '00') }),
      withUnits({ key: 'dailyOnline', label: 'Daily online hours', type: 'duration', default: duration('08', '00', '00', '=') }),
      {
        key: 'appPrice',
        label: 'App price vs in-store',
        type: 'select',
        withOperator: true,
        options: ['In-store price', 'Below in-store price', 'Allow variance'],
        default: { operator: '≤', option: 'In-store price' },
      },
      { key: 'reservationHonored', label: 'Reservation honored', type: 'percent', default: percent('100') },
      withUnits({ key: 'billDispute', label: 'Bill dispute report window', type: 'duration', default: duration('02', '00', '00') }),
      withUnits({ key: 'reservationNotice', label: 'Reservation notice (advance)', type: 'duration', default: duration('02', '00', '00', '≥') }),
      withUnits({ key: 'billQuality', label: 'Bill / quality review', type: 'duration', default: duration('04', '00', '00') }),
    ],
  },
  {
    id: 'pickup',
    title: '3) Pickup',
    fields: [
      withUnits({ key: 'acceptance', label: 'Acceptance time', type: 'duration', default: duration('00', '02', '00', '<') }),
      withUnits({ key: 'customerWait', label: 'Customer wait time', type: 'duration', default: duration('00', '10', '00', '>') }),
      withUnits({ key: 'dailyOnline', label: 'Daily online hours', type: 'duration', default: duration('08', '00', '00', '≥') }),
      {
        key: 'earlyPickup',
        label: 'Ready at pickup time',
        type: 'select',
        withOperator: true,
        options: ['Confirmed time', 'Estimated window', 'Flexible'],
        default: { operator: '=', option: 'Confirmed time' },
      },
      withUnits({ key: 'maxCustomerWait', label: 'Max customer wait', type: 'duration', default: duration('00', '15', '00') }),
      withUnits({ key: 'orderHold', label: 'Order hold (no-show)', type: 'duration', default: duration('00', '30', '00', '≥') }),
      { key: 'onTimePrep', label: 'On-time prep', type: 'percent', default: percent('90') },
      withUnits({ key: 'notifyDelay', label: 'Notify customer of delay', type: 'duration', default: duration('00', '10', '00') }),
    ],
  },
  {
    id: 'scheduled',
    title: '4) Scheduled delivery',
    allTiersLabel: 'All tiers',
    allTiersBanner: true,
    tiers: [
      { id: 'same-day', label: 'Same day', fields: scheduledTierFields },
      { id: 'next-day', label: 'Next day', fields: scheduledTierFields },
      { id: 'standard', label: 'Standard', fields: scheduledTierFields },
      { id: 'economy', label: 'Economy', fields: scheduledTierFields },
    ],
    allTiers: [
      { key: 'reliability', label: 'Scheduled reliability', type: 'percent', default: percent('95') },
      withUnits({
        key: 'advanceCancel',
        label: 'Advance-cancel notice',
        type: 'duration',
        default: duration('04', '00', '00', '≥'),
      }),
      {
        key: 'prepAck',
        label: 'Prep-alert acknowledged',
        type: 'select',
        withOperator: true,
        options: ['At T-prep', 'On booking confirmed', 'At cutoff'],
        default: { operator: '=', option: 'At T-prep' },
      },
    ],
  },
  {
    id: 'services',
    title: '5) Services',
    fields: [
      withUnits({ key: 'acceptance', label: 'Acceptance time', type: 'duration', default: duration('00', '05', '00') }),
      { key: 'attendance', label: 'Provider attendance', type: 'percent', default: percent('95') },
      { key: 'quality', label: 'Quality rating', type: 'rating', default: { operator: '≥', amount: '4.2' } },
      { key: 'lastMinuteCancel', label: 'Last-minute cancellation', type: 'percent', default: percent('5', '≤') },
      {
        key: 'noShowHandling',
        label: 'No-show handling',
        type: 'select',
        withOperator: true,
        options: ['Full refund + SPPA', 'Partial refund', 'Reschedule only'],
        default: { operator: '=', option: 'Full refund + SPPA' },
      },
      withUnits({
        key: 'providerNoShowWait',
        label: 'Provider no-show wait',
        type: 'duration',
        default: duration('00', '15', '00', '='),
      }),
      { key: 'contactAttempts', label: 'Contact attempts (no-show)', type: 'number', unit: 'attempts', default: number('3', '=') },
      withUnits({
        key: 'qualityReport',
        label: 'Quality report window',
        type: 'duration',
        default: duration('24', '00', '00'),
      }),
      withUnits({
        key: 'damageReport',
        label: 'Property-damage report window',
        type: 'duration',
        default: duration('48', '00', '00'),
      }),
    ],
  },
]

export const CHAMP_SLA_SECTIONS = [
  {
    id: 'acceptance',
    title: 'Acceptance time (per mode)',
    subtitle: 'Performance thresholds feeding CPI scoring for champs — now with at-risk and critical breakpoints.',
    metricLabel: 'Mode',
    tierGridFields: [
      gridField('hotFood', 'Hot food', '00', '01', '59', '00', '03', '00', '00', '05', '00'),
      gridField('sameDay', 'Same day', '00', '05', '00', '00', '08', '00', '00', '12', '00'),
      gridField('nextDay', 'Next day', '00', '05', '00', '00', '10', '00', '00', '20', '00'),
      gridField('standard', 'Standard', '00', '05', '00', '00', '08', '00', '00', '15', '00'),
      gridField('economy', 'Economy', '00', '05', '00', '00', '08', '00', '00', '15', '00'),
      gridField('acceptFood', 'Acceptance — Food', '00', '01', '59', '00', '03', '00', '00', '05', '00'),
      gridField('acceptGrocery', 'Acceptance — Grocery/Pharmacy', '00', '01', '30', '00', '03', '00', '00', '05', '00'),
      gridField('acceptFlowers', 'Acceptance — Flowers', '00', '01', '30', '00', '03', '00', '00', '05', '00'),
      gridField('acceptElectronics', 'Acceptance — Electronics', '00', '01', '30', '00', '03', '00', '00', '05', '00'),
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
      withUnits({
        key: 'vendorWaitGrocery',
        label: 'Vendor wait — Grocery/Pharmacy',
        type: 'duration',
        default: duration('00', '06', '00'),
      }),
      withUnits({
        key: 'vendorWaitFlowers',
        label: 'Vendor wait — Flowers/Fashion',
        type: 'duration',
        default: duration('00', '05', '00'),
      }),
      withUnits({
        key: 'vendorWaitElectronics',
        label: 'Vendor wait — Electronics',
        type: 'duration',
        default: duration('00', '08', '00'),
      }),
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
      withUnits({
        key: 'emergencyOnDemand',
        label: 'Emergency reassign — on-demand',
        type: 'duration',
        default: duration('00', '03', '00'),
      }),
      withUnits({
        key: 'emergencyScheduled',
        label: 'Emergency reassign — scheduled',
        type: 'duration',
        default: duration('00', '10', '00'),
      }),
      {
        key: 'appGpsFailure',
        label: 'App / GPS failure report',
        type: 'select',
        withOperator: true,
        options: ['Immediate', 'Within 5 min', 'End of shift'],
        default: { operator: '=', option: 'Immediate' },
      },
      withUnits({
        key: 'appGpsFixWindow',
        label: 'App / GPS fix window',
        type: 'duration',
        default: duration('00', '10', '00'),
      }),
      withUnits({
        key: 'tempWorkaround',
        label: 'Temp workaround (tech)',
        type: 'duration',
        default: duration('00', '05', '00'),
      }),
      withUnits({
        key: 'champAssignment',
        label: 'Champ assignment (platform)',
        type: 'duration',
        default: duration('00', '05', '00'),
      }),
    ],
  },
  {
    id: 'tier',
    title: 'Tier',
    fields: [
      { key: 'elite', label: 'Elite', type: 'range', default: range('90', '100') },
      { key: 'gold', label: 'Gold', type: 'range', default: range('80', '98') },
      { key: 'silver', label: 'Silver', type: 'range', default: range('70', '79') },
      { key: 'bronze', label: 'Bronze', type: 'range', default: range('60', '69') },
      { key: 'atRisk', label: 'At Risk', type: 'number', default: number('60', '<') },
    ],
  },
]

export const DISPATCHER_SLA_SECTIONS = [
  {
    id: 'assignment',
    title: 'Order assignment time (per mode)',
    subtitle: 'Assignment thresholds per delivery mode — target, at-risk, and critical breakpoints.',
    metricLabel: 'Mode',
    tierGridFields: [
      gridField('sameDay', 'Same day', '00', '03', '00', '00', '05', '00', '00', '08', '00'),
      gridField('nextDay', 'Next day', '00', '05', '00', '00', '08', '00', '00', '12', '00'),
      gridField('standard', 'Standard', '00', '05', '00', '00', '09', '00', '00', '15', '00'),
      gridField('economy', 'Economy', '00', '10', '00', '00', '15', '00', '00', '25', '00'),
    ],
  },
  {
    id: 'incidents',
    title: 'Incidents & response',
    fields: [
      withUnits({ key: 'firstResponse', label: 'Incident first response', type: 'duration', default: duration('00', '05', '00') }),
      withUnits({ key: 'resolutionTime', label: 'Incident resolution time', type: 'duration', default: duration('00', '30', '00') }),
      { key: 'resolutionRate', label: 'Incident resolution rate', type: 'percent', default: percent('95') },
      withUnits({ key: 'responseToChat', label: 'Response to chat', type: 'duration', default: duration('00', '02', '00') }),
      withUnits({ key: 'liveChatFirst', label: 'Live-chat first response', type: 'duration', default: duration('00', '00', '45') }),
      withUnits({
        key: 'champContactNonDelivery',
        label: 'Champ contact (non-delivery)',
        type: 'duration',
        default: duration('00', '10', '00'),
      }),
      withUnits({
        key: 'champContactTech',
        label: 'Champ contact (tech failure)',
        type: 'duration',
        default: duration('00', '00', '45'),
      }),
      {
        key: 'vendorNonResponsive',
        label: 'Vendor non-responsive protocol',
        type: 'select',
        withOperator: true,
        options: ['3 calls · 5 min', '3 calls · 3 min', '5 calls · 5 min'],
        default: { operator: '=', option: '3 calls · 5 min' },
      },
      withUnits({
        key: 'champAssignmentIntervention',
        label: 'Champ assignment intervention',
        type: 'duration',
        default: duration('00', '03', '00'),
      }),
      withUnits({ key: 'p1AllHands', label: 'P1 all-hands response', type: 'duration', default: duration('00', '05', '00') }),
      withUnits({
        key: 'scheduledEmergency',
        label: 'Scheduled emergency reschedule',
        type: 'duration',
        default: duration('00', '10', '00'),
      }),
      withUnits({
        key: 'serviceConflictResolution',
        label: 'Service conflict resolution',
        type: 'duration',
        default: duration('00', '30', '00'),
      }),
      withUnits({
        key: 'cashOutEscalation',
        label: 'Cash-out finance escalation',
        type: 'duration',
        default: duration('04', '00', '00'),
      }),
      withUnits({
        key: 'acknowledgeBreach',
        label: 'Acknowledge (standard breach)',
        type: 'duration',
        default: duration('00', '02', '00'),
      }),
      withUnits({ key: 'resolutionPlan', label: 'Resolution plan', type: 'duration', default: duration('00', '05', '00') }),
      {
        key: 'vendorCallIntervals',
        label: 'Vendor 3-call intervals',
        type: 'select',
        withOperator: true,
        options: ['2-min intervals', '3-min intervals', '5-min intervals'],
        default: { operator: '=', option: '2-min intervals' },
      },
      {
        key: 'p1UpdateCycle',
        label: 'P1 update cycle',
        type: 'select',
        withOperator: true,
        options: ['Every 15 min', 'Every 10 min', 'Every 30 min'],
        default: { operator: '=', option: 'Every 15 min' },
      },
      withUnits({
        key: 'serviceConflictContact',
        label: 'Service conflict — contact',
        type: 'duration',
        default: duration('01', '00', '00'),
      }),
      withUnits({
        key: 'serviceConflictResolve',
        label: 'Service conflict — resolution',
        type: 'duration',
        default: duration('24', '00', '00'),
      }),
    ],
  },
  {
    id: 'system',
    title: 'System · Auto-Detect · monitored (read-only)',
    subtitle:
      'These are detected automatically by the system — thresholds mirror the SLAs above and are not directly edited here.',
    fields: [
      refText('pickupBreach', 'Pickup SLA breach', 'At category limit'),
      refText('etaCompensation', 'ETA+15 auto-compensation', 'ETA + 15 min'),
      refDuration('vendorNonAcceptance', 'Vendor non-acceptance timeout', '00', '02', '00'),
      refText('champBroadcast', 'Champ assignment broadcast', '1 km / 90 s expand'),
      refText('scheduledTrigger', 'Scheduled trigger failure', 'T-0 + 5 min'),
      refText('scheduledPrepAlert', 'Scheduled prep-alert check', 'At T-prep lead'),
      refText('serviceConfirmation', 'Service confirmation to provider', 'On booking confirmed'),
      refText('gpsStationary', 'GPS stationary auto-alert', '> 3 min'),
    ],
  },
  {
    id: 'customerWallet',
    title: 'Customer & Wallet · T&C limits (reference)',
    subtitle: 'Platform-wide customer & wallet limits from the T&C — shown here for reference.',
    fields: [
      refPercent('cashbackMin', 'Cashback minimum', '3', '≥'),
      refDuration('cashbackCredit', 'Cashback credit window', '24', '00', '00'),
      refText('cashbackExpiry', 'Cashback expiry', '6 months rolling'),
      refText('expiryReminder', 'Expiry reminder', '30 days before'),
      refMoney('cashOutMin', 'Cash-out min balance', '10'),
      refPercent('cashOutReceive', 'Cash-out customer receives', '70'),
      refPercent('cashOutFee', 'Cash-out processing fee', '30'),
      refText('cashOutTime', 'Cash-out processing time', '3–7 working days'),
      refPercent('vat', 'VAT', '10'),
      refText('lateOrderVoucher', 'Late order auto make-good', 'ETA + 15 min'),
      refDuration('wrongMissingWindow', 'Wrong / missing report window', '00', '30', '00'),
      refText('nonDeliveryRefund', 'Non-delivery refund', 'Same day'),
      refText('champBehavior', 'Champ behavior policy', '3-strike (DSA)'),
    ],
  },
  {
    id: 'ops',
    title: 'Ops / Lifecycle SLA',
    fields: [
      {
        key: 'reviewCycle',
        label: 'Performance review cycle',
        type: 'select',
        withOperator: true,
        options: ['Weekly / Monthly', 'Weekly', 'Monthly', 'Quarterly'],
        default: { operator: '=', option: 'Weekly / Monthly' },
      },
      {
        key: 'silverIntervention',
        label: 'Silver tier intervention',
        type: 'select',
        withOperator: true,
        options: ['Support call', 'Written warning', 'Performance plan'],
        default: { operator: '=', option: 'Support call' },
      },
      {
        key: 'bronzePlan',
        label: 'Bronze tier plan',
        type: 'select',
        withOperator: true,
        options: ['30-day plan', '14-day plan', '60-day plan'],
        default: { operator: '=', option: '30-day plan' },
      },
      withUnits({
        key: 'champDsaEvidence',
        label: 'Champ DSA — evidence review',
        type: 'duration',
        default: duration('48', '00', '00'),
      }),
      withUnits({
        key: 'champDsaResponse',
        label: 'Champ DSA — response window',
        type: 'duration',
        default: duration('48', '00', '00'),
      }),
      withUnits({
        key: 'fraudReview',
        label: 'Fraud review (Finance + Ops)',
        type: 'duration',
        default: duration('24', '00', '00'),
      }),
      {
        key: 'cssNotification',
        label: 'CSS notification',
        type: 'select',
        withOperator: true,
        options: ['If over threshold', 'Always', 'Manual only'],
        default: { operator: '=', option: 'If over threshold' },
      },
      {
        key: 'providerSppa',
        label: 'Provider SPPA review',
        type: 'select',
        withOperator: true,
        options: ['Monthly', 'Weekly', 'Quarterly'],
        default: { operator: '=', option: 'Monthly' },
      },
      {
        key: 'cashbackAudit',
        label: 'Cashback audit',
        type: 'select',
        withOperator: true,
        options: ['Monthly', 'Weekly', 'Quarterly'],
        default: { operator: '=', option: 'Monthly' },
      },
      withUnits({ key: 'engFix', label: 'Eng fix (systematic)', type: 'duration', default: duration('48', '00', '00') }),
      withUnits({ key: 'outageReply', label: 'System outage — reply', type: 'duration', default: duration('00', '05', '00') }),
      withUnits({
        key: 'outageRootCause',
        label: 'System outage — root cause',
        type: 'duration',
        default: duration('02', '00', '00'),
      }),
    ],
  },
]
