import { useEffect, useState } from 'react'
import { ChevronDown } from 'lucide-react'

const cn = (...parts) => parts.filter(Boolean).join(' ')

const inputClass =
  'box-border h-[36px] w-[52px] rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white px-2 text-center text-[13px] outline-none transition focus:border-[#1aa054] disabled:bg-[#f3f5f3] disabled:text-[#9aa49d]'

const selectClass =
  'box-border h-[36px] appearance-none rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white py-0 pl-2.5 pr-7 text-[13px] outline-none transition focus:border-[#1aa054] disabled:bg-[#f3f5f3] disabled:text-[#9aa49d]'

const OPERATORS = ['≤', '≥', '=', '<', '>']
const ACTIVE_TEXT = 'text-[#1C211F]'
const MUTED_TEXT = 'text-[#7c8780]'

const MODE_META = {
  'Hot food · on demand': {
    title: 'Hot food — on demand',
    defaultCustomized: true,
    rows: [
      { key: 'acceptance', label: 'Acceptance time', operator: '≤', h: '00', m: '02', s: '00' },
      { key: 'champCollection', label: 'Champ (champ) collection time', operator: '≤', h: '00', m: '10', s: '00' },
      { key: 'dailyOnline', label: 'Daily online hours', operator: '≥', h: '08', m: '00', s: '00' },
    ],
    window: { label: 'Full delivery window', from: '11:00', fromPeriod: 'AM', to: '11:00', toPeriod: 'PM' },
  },
  'Dine-in': {
    title: 'Dine-in',
    defaultCustomized: false,
    rows: [
      { key: 'acceptance', label: 'Acceptance time', operator: '≤', h: '00', m: '02', s: '00' },
      { key: 'tableReady', label: 'Table ready time', operator: '≤', h: '00', m: '15', s: '00' },
      { key: 'dailyOnline', label: 'Daily online hours', operator: '≥', h: '08', m: '00', s: '00' },
    ],
  },
  Pickup: {
    title: 'Pickup',
    defaultCustomized: false,
    rows: [
      { key: 'acceptance', label: 'Acceptance time', operator: '≤', h: '00', m: '02', s: '00' },
      { key: 'customerWait', label: 'Customer wait time', operator: '≤', h: '00', m: '10', s: '00' },
      { key: 'dailyOnline', label: 'Daily online hours', operator: '≥', h: '08', m: '00', s: '00' },
    ],
  },
  'Scheduled delivery': {
    title: 'Scheduled delivery',
    defaultCustomized: false,
    tiers: ['Same day', 'Next day', 'Standard', 'Economy'],
    tierRows: [
      { key: 'acceptance', label: 'Acceptance time', operator: '≤', h: '00', m: '05', s: '00' },
      { key: 'champCollection', label: 'Champ collection time', operator: '≤', h: '00', m: '20', s: '00' },
      { key: 'dailyOnline', label: 'Daily online hours', operator: '≥', h: '08', m: '00', s: '00' },
      { key: 'cutoff', label: 'Cutoff time', kind: 'clock', operator: '=', time: '12:00', period: 'PM' },
      { key: 'prepareMax', label: 'Prepare time (max)', kind: 'clock', operator: '≤', time: '08:00', period: 'PM' },
      { key: 'markReady', label: 'Mark ready within delivery window', operator: '≤', h: '00', m: '30', s: '00' },
    ],
  },
  Services: {
    title: 'Services',
    defaultCustomized: false,
    rows: [
      { key: 'acceptance', label: 'Acceptance time', operator: '≤', h: '00', m: '05', s: '00' },
      { key: 'serviceStart', label: 'Service start time', operator: '≤', h: '00', m: '30', s: '00' },
      { key: 'dailyOnline', label: 'Daily online hours', operator: '≥', h: '08', m: '00', s: '00' },
    ],
  },
}

function DurationFields({ value, disabled, active, onChange }) {
  const unitClass = active ? ACTIVE_TEXT : MUTED_TEXT
  const fieldClass = cn(inputClass, active ? ACTIVE_TEXT : MUTED_TEXT)
  const opClass = cn(selectClass, active ? ACTIVE_TEXT : MUTED_TEXT)

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <div className="relative">
        <select
          className={opClass}
          value={value.operator}
          disabled={disabled}
          onChange={(e) => onChange({ ...value, operator: e.target.value })}
        >
          {OPERATORS.map((op) => (
            <option key={op} value={op}>{op}</option>
          ))}
        </select>
        <ChevronDown
          size={12}
          className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#7c8780]"
        />
      </div>
      <input
        className={fieldClass}
        value={value.h}
        disabled={disabled}
        onChange={(e) => onChange({ ...value, h: e.target.value })}
      />
      <span className={cn('text-[12px]', unitClass)}>h</span>
      <input
        className={fieldClass}
        value={value.m}
        disabled={disabled}
        onChange={(e) => onChange({ ...value, m: e.target.value })}
      />
      <span className={cn('text-[12px]', unitClass)}>m</span>
      <input
        className={fieldClass}
        value={value.s}
        disabled={disabled}
        onChange={(e) => onChange({ ...value, s: e.target.value })}
      />
      <span className={cn('text-[12px]', unitClass)}>s</span>
    </div>
  )
}

function ClockFields({ value, disabled, active, onChange }) {
  const fieldClass = cn(inputClass, 'w-[64px]', active ? ACTIVE_TEXT : MUTED_TEXT)
  const opClass = cn(selectClass, active ? ACTIVE_TEXT : MUTED_TEXT)

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <div className="relative">
        <select
          className={opClass}
          value={value.operator}
          disabled={disabled}
          onChange={(e) => onChange({ ...value, operator: e.target.value })}
        >
          {OPERATORS.map((op) => (
            <option key={op} value={op}>{op}</option>
          ))}
        </select>
        <ChevronDown
          size={12}
          className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#7c8780]"
        />
      </div>
      <input
        className={fieldClass}
        value={value.time}
        disabled={disabled}
        onChange={(e) => onChange({ ...value, time: e.target.value })}
      />
      <div className="relative">
        <select
          className={opClass}
          value={value.period}
          disabled={disabled}
          onChange={(e) => onChange({ ...value, period: e.target.value })}
        >
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
        <ChevronDown
          size={12}
          className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#7c8780]"
        />
      </div>
    </div>
  )
}

function WindowFields({ value, disabled, active, onChange }) {
  const fieldClass = cn(inputClass, 'w-[64px]', active ? ACTIVE_TEXT : MUTED_TEXT)
  const opClass = cn(selectClass, active ? ACTIVE_TEXT : MUTED_TEXT)
  const unitClass = active ? ACTIVE_TEXT : MUTED_TEXT

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <input
        className={fieldClass}
        value={value.from}
        disabled={disabled}
        onChange={(e) => onChange({ ...value, from: e.target.value })}
      />
      <div className="relative">
        <select
          className={opClass}
          value={value.fromPeriod}
          disabled={disabled}
          onChange={(e) => onChange({ ...value, fromPeriod: e.target.value })}
        >
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
        <ChevronDown
          size={12}
          className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#7c8780]"
        />
      </div>
      <span className={cn('px-1 text-[12px]', unitClass)}>–</span>
      <input
        className={fieldClass}
        value={value.to}
        disabled={disabled}
        onChange={(e) => onChange({ ...value, to: e.target.value })}
      />
      <div className="relative">
        <select
          className={opClass}
          value={value.toPeriod}
          disabled={disabled}
          onChange={(e) => onChange({ ...value, toPeriod: e.target.value })}
        >
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
        <ChevronDown
          size={12}
          className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#7c8780]"
        />
      </div>
    </div>
  )
}

function buildInitialState(mode) {
  const meta = MODE_META[mode]
  if (!meta) return null

  if (meta.tiers) {
    const tiers = {}
    meta.tiers.forEach((tier) => {
      const fields = {}
      meta.tierRows.forEach((row) => {
        if (row.kind === 'clock') {
          fields[row.key] = { operator: row.operator, time: row.time, period: row.period }
        } else {
          fields[row.key] = { operator: row.operator, h: row.h, m: row.m, s: row.s }
        }
      })
      tiers[tier] = fields
    })
    return { customized: meta.defaultCustomized, tiers }
  }

  const fields = {}
  meta.rows.forEach((row) => {
    fields[row.key] = { operator: row.operator, h: row.h, m: row.m, s: row.s }
  })
  return {
    customized: meta.defaultCustomized,
    fields,
    window: meta.window ? { ...meta.window } : null,
  }
}

function SlaModeCard({ mode, state, onChange }) {
  const meta = MODE_META[mode]
  if (!meta || !state) return null

  const customized = state.customized
  const useDefault = !customized
  const disabled = useDefault
  const setCustomized = (next) => onChange({ ...state, customized: next })
  const labelClass = customized ? ACTIVE_TEXT : MUTED_TEXT

  return (
    <section className="rounded-[14px] border border-[#eceeec] bg-white p-5 shadow-[0_1px_3px_rgba(20,40,28,.04)] max-[700px]:p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <h3 className="text-[15px] font-bold text-[#17231c]">{meta.title}</h3>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'text-[12px] font-semibold',
              customized ? 'text-[#1aa054]' : 'text-[#7c8780]',
            )}
          >
            {customized ? 'Customize' : 'Use default'}
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={customized}
            aria-label={customized ? 'Customize' : 'Use default'}
            onClick={() => setCustomized(!customized)}
            className={cn(
              'relative h-[28px] w-[48px] shrink-0 rounded-full transition',
              customized ? 'bg-[#1aa054]' : 'bg-[#d5dbd7]',
            )}
          >
            <span
              className={cn(
                'absolute top-[3px] h-[22px] w-[22px] rounded-full bg-white shadow transition',
                customized ? 'left-[23px]' : 'left-[3px]',
              )}
            />
          </button>
        </div>
      </div>

      {meta.tiers ? (
        <div className="space-y-5">
          {meta.tiers.map((tier) => (
            <div key={tier}>
              <span className="mb-3 inline-flex rounded-full bg-[#e8f7ed] px-2.5 py-1 text-[11px] font-bold text-[#147940]">
                {tier}
              </span>
              <div className={cn(disabled && 'opacity-55')}>
                {meta.tierRows.map((row) => (
                  <div
                    key={`${tier}-${row.key}`}
                    className="flex flex-wrap items-center justify-between gap-3 py-3 last:border-0"
                  >
                    <span className={cn('min-w-[160px] flex-1 text-[12.5px]', labelClass)}>{row.label}</span>
                    {row.kind === 'clock' ? (
                      <ClockFields
                        value={state.tiers[tier][row.key]}
                        disabled={disabled}
                        active={customized}
                        onChange={(next) => onChange({
                          ...state,
                          tiers: {
                            ...state.tiers,
                            [tier]: { ...state.tiers[tier], [row.key]: next },
                          },
                        })}
                      />
                    ) : (
                      <DurationFields
                        value={state.tiers[tier][row.key]}
                        disabled={disabled}
                        active={customized}
                        onChange={(next) => onChange({
                          ...state,
                          tiers: {
                            ...state.tiers,
                            [tier]: { ...state.tiers[tier], [row.key]: next },
                          },
                        })}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={cn(disabled && 'opacity-55')}>
          {meta.rows.map((row) => (
            <div
              key={row.key}
              className="flex flex-wrap items-center justify-between gap-3 py-3"
            >
              <span className={cn('min-w-[160px] flex-1 text-[12.5px]', labelClass)}>{row.label}</span>
              <DurationFields
                value={state.fields[row.key]}
                disabled={disabled}
                active={customized}
                onChange={(next) => onChange({
                  ...state,
                  fields: { ...state.fields, [row.key]: next },
                })}
              />
            </div>
          ))}
          {state.window ? (
            <div className="flex flex-wrap items-center justify-between gap-3 py-3">
              <span className={cn('min-w-[160px] flex-1 text-[12.5px]', labelClass)}>{state.window.label}</span>
              <WindowFields
                value={state.window}
                disabled={disabled}
                active={customized}
                onChange={(next) => onChange({ ...state, window: next })}
              />
            </div>
          ) : null}
        </div>
      )}
    </section>
  )
}

export function AdminVendorSlaConfigs({ selectedModes = [] }) {
  const [configs, setConfigs] = useState({})

  useEffect(() => {
    setConfigs((prev) => {
      const next = { ...prev }
      selectedModes.forEach((mode) => {
        if (!next[mode]) next[mode] = buildInitialState(mode)
      })
      Object.keys(next).forEach((mode) => {
        if (!selectedModes.includes(mode)) delete next[mode]
      })
      return next
    })
  }, [selectedModes])

  if (!selectedModes.length) return null

  return (
    <div className="mt-4 space-y-4">
      {selectedModes.map((mode) => (
        <SlaModeCard
          key={mode}
          mode={mode}
          state={configs[mode]}
          onChange={(next) => setConfigs((prev) => ({ ...prev, [mode]: next }))}
        />
      ))}
    </div>
  )
}

export const SERVICE_MODE_OPTIONS = Object.keys(MODE_META)
