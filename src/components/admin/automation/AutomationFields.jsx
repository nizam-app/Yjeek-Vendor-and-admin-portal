import { ChevronDown } from 'lucide-react'
import { cn } from '../cn'

const OPERATORS = ['≤', '≥', '=', '<', '>']

function OperatorSelect({ value, onChange, disabled, operators = OPERATORS, locked = false }) {
  if (locked) {
    return (
      <span
        className="inline-flex h-8 w-[42px] shrink-0 items-center justify-center rounded-md border border-[#d1d5db] bg-[#f9fafb] text-[12px] font-semibold text-[#111827]"
        aria-label={`Operator ${value}`}
      >
        {value}
      </span>
    )
  }

  const options = operators?.length ? operators : OPERATORS

  return (
    <div className="relative h-8 w-[42px] shrink-0">
      <select
        aria-label="Operator"
        disabled={disabled}
        className="box-border h-full w-full cursor-pointer appearance-none rounded-md border border-[#d1d5db] bg-white py-0 pl-1.5 pr-4 text-center text-[12px] font-semibold text-[#111827] outline-none transition focus:border-[#1D6A33] disabled:cursor-not-allowed disabled:opacity-60"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((op) => (
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

function pad2(n) {
  return String(Math.max(0, n)).padStart(2, '0')
}

function clampUnit(raw, max) {
  const digits = String(raw).replace(/\D/g, '').slice(0, 2)
  if (!digits) return ''
  return String(Math.min(max, Number.parseInt(digits, 10)))
}

/** Operator + numeric value + unit (km / orders). Local Automation control — does not change SLA. */
export function AutomationOperatorNumberField({
  value,
  onChange,
  unit,
  disabled = false,
  operators,
  operatorLocked = false,
}) {
  const safe = value || { operator: '≤', value: '0' }
  return (
    <div className="flex flex-nowrap items-center gap-1.5">
      <OperatorSelect
        value={safe.operator || '≤'}
        disabled={disabled}
        operators={operators}
        locked={operatorLocked}
        onChange={(operator) => onChange({ ...safe, operator })}
      />
      <input
        className="box-border h-8 w-16 rounded-md border border-[#d1d5db] bg-white text-center text-[13px] font-medium text-[#111827] outline-none transition focus:border-[#1D6A33] focus:shadow-[0_0_0_2px_rgba(29,106,51,0.1)] disabled:cursor-not-allowed disabled:opacity-60"
        inputMode="numeric"
        aria-label={unit ? `Value in ${unit}` : 'Value'}
        disabled={disabled}
        value={safe.value}
        onChange={(event) =>
          onChange({ ...safe, value: event.target.value.replace(/[^\d.]/g, '').slice(0, 6) })
        }
      />
      {unit ? <span className="text-[11.5px] text-[#6b7280]">{unit}</span> : null}
    </div>
  )
}

/** Operator + h/m/s duration. Pattern aligned with SLA DurationInput; Automation-local copy. */
export function AutomationDurationField({
  value,
  onChange,
  disabled = false,
  operators,
  operatorLocked = false,
  showOperator = true,
  showSeconds = true,
  hourMax = 23,
  hint,
}) {
  const safe = value || { operator: '≤', h: '00', m: '00', s: '00' }

  function setPart(key, raw, max) {
    onChange({ ...safe, [key]: clampUnit(raw, max) })
  }

  function blurPart(key, max) {
    onChange({ ...safe, [key]: pad2(Math.min(max, Number.parseInt(safe[key], 10) || 0)) })
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {showOperator ? (
        <OperatorSelect
          value={safe.operator || '≤'}
          disabled={disabled}
          operators={operators}
          locked={operatorLocked}
          onChange={(operator) => onChange({ ...safe, operator })}
        />
      ) : null}
      <input
        className="box-border h-8 w-11 rounded-md border border-[#d1d5db] bg-white text-center text-[13px] font-medium outline-none transition focus:border-[#1D6A33] focus:shadow-[0_0_0_2px_rgba(29,106,51,0.1)] disabled:opacity-60"
        inputMode="numeric"
        aria-label="Hours"
        disabled={disabled}
        value={safe.h}
        onChange={(event) => setPart('h', event.target.value, hourMax)}
        onBlur={() => blurPart('h', hourMax)}
      />
      <span className="text-[11px] text-[#9ca3af]">h</span>
      <input
        className="box-border h-8 w-11 rounded-md border border-[#d1d5db] bg-white text-center text-[13px] font-medium outline-none transition focus:border-[#1D6A33] focus:shadow-[0_0_0_2px_rgba(29,106,51,0.1)] disabled:opacity-60"
        inputMode="numeric"
        aria-label="Minutes"
        disabled={disabled}
        value={safe.m}
        onChange={(event) => setPart('m', event.target.value, 59)}
        onBlur={() => blurPart('m', 59)}
      />
      <span className="text-[11px] text-[#9ca3af]">m</span>
      {showSeconds ? (
        <>
          <input
            className="box-border h-8 w-11 rounded-md border border-[#d1d5db] bg-white text-center text-[13px] font-medium outline-none transition focus:border-[#1D6A33] focus:shadow-[0_0_0_2px_rgba(29,106,51,0.1)] disabled:opacity-60"
            inputMode="numeric"
            aria-label="Seconds"
            disabled={disabled}
            value={safe.s}
            onChange={(event) => setPart('s', event.target.value, 59)}
            onBlur={() => blurPart('s', 59)}
          />
          <span className="text-[11px] text-[#9ca3af]">s</span>
        </>
      ) : null}
      {hint ? <span className="ml-1 text-[11px] text-[#9ca3af]">{hint}</span> : null}
    </div>
  )
}

/** Wall-clock h/m (no operator) for batch fire times. */
export function AutomationClockTimeField({ value, onChange, disabled = false, hint }) {
  return (
    <AutomationDurationField
      value={{ operator: '≤', h: value?.h || '00', m: value?.m || '00', s: '00' }}
      onChange={(next) => onChange({ h: next.h, m: next.m })}
      disabled={disabled}
      showOperator={false}
      showSeconds={false}
      hourMax={23}
      hint={hint}
    />
  )
}

export function AutomationKpiCard({ value, label, delta, deltaTone = 'muted', accent = 'green' }) {
  const accentBar = {
    green: 'bg-[#1D6A33]',
    amber: 'bg-[#CAA34D]',
    red: 'bg-[#dc2626]',
  }
  const deltaClass = {
    up: 'text-[#15803d]',
    down: 'text-[#dc2626]',
    muted: 'text-[#6b7280]',
  }

  return (
    <div className="relative overflow-hidden rounded-[10px] border border-[#e5e7eb] bg-white px-4 pb-3.5 pt-4">
      <span className={cn('absolute inset-x-0 top-0 h-[3px]', accentBar[accent] || accentBar.green)} />
      <div className="text-[22px] font-extrabold leading-none text-[#111827]">{value}</div>
      <div className="mt-1 text-[11px] text-[#6b7280]">{label}</div>
      {delta ? (
        <div className={cn('mt-1.5 text-[10.5px] font-semibold', deltaClass[deltaTone] || deltaClass.muted)}>
          {delta}
        </div>
      ) : null}
    </div>
  )
}

/** Fixed "+" operator + percent value (POD scoring uplift). Backwards-compatible addition. */
export function AutomationPercentField({ value, onChange, disabled = false }) {
  return (
    <div className="flex flex-nowrap items-center gap-1.5">
      <span className="inline-flex h-8 w-[42px] shrink-0 items-center justify-center rounded-md border border-[#d1d5db] bg-white text-[12px] font-semibold text-[#111827]">
        +
      </span>
      <input
        className="box-border h-8 w-14 rounded-md border border-[#d1d5db] bg-white text-center text-[13px] font-medium text-[#111827] outline-none transition focus:border-[#1D6A33] focus:shadow-[0_0_0_2px_rgba(29,106,51,0.1)] disabled:cursor-not-allowed disabled:opacity-60"
        inputMode="numeric"
        aria-label="Percent bonus"
        disabled={disabled}
        value={value}
        onChange={(event) => onChange(event.target.value.replace(/\D/g, '').slice(0, 3))}
        onBlur={() => {
          const n = Math.min(100, Math.max(0, Number.parseInt(value, 10) || 0))
          onChange(String(n))
        }}
      />
      <span className="text-[12px] font-medium text-[#6b7280]">%</span>
    </div>
  )
}
