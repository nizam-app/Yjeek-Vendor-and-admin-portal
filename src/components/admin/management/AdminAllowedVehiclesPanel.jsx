/**
 * Allowed vehicles (Bike / Car) — vendor template + branch delivery settings.
 * Narrows within store-type caps; never widens. At least one must stay on.
 */
import { cn } from '../cn'

export const VEHICLE_NONE_UI_MESSAGE = 'At least one allowed vehicle (Bike or Car) must stay on'

const DEFAULT_FORM = { bike: true, car: true }

function readBoolField(raw) {
  if (raw == null) return true
  if (typeof raw === 'boolean') return raw
  if (typeof raw === 'object' && 'value' in raw) return raw.value !== false
  return Boolean(raw)
}

/**
 * @param {unknown} raw API `allowedVehicles` ({ bike: {value,state,defaultValue}, car: ... } | null)
 */
export function normalizeAllowedVehiclesForm(raw) {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_FORM }
  return {
    bike: readBoolField(raw.bike),
    car: readBoolField(raw.car),
  }
}

/**
 * @param {unknown} raw
 * @returns {{ bike?: { state?: string, defaultValue?: boolean|null }, car?: { state?: string, defaultValue?: boolean|null } } | null}
 */
export function extractAllowedVehiclesFieldMeta(raw) {
  if (!raw || typeof raw !== 'object') return null
  const out = {}
  for (const key of ['bike', 'car']) {
    const field = raw[key]
    if (field && typeof field === 'object' && (field.state || field.defaultValue !== undefined)) {
      out[key] = {
        state: field.state || null,
        defaultValue: field.defaultValue !== undefined ? field.defaultValue : null,
      }
    }
  }
  return Object.keys(out).length ? out : null
}

export function buildAllowedVehiclesPayload(form) {
  return {
    bike: Boolean(form?.bike),
    car: Boolean(form?.car),
  }
}

/** Store-type cap for this vehicle — defaultValue false means cannot enable (widen). */
function storeTypeAllows(meta, key) {
  const def = meta?.[key]?.defaultValue
  if (def === false) return false
  return true
}

function StateBadge({ state }) {
  if (!state) return null
  const overridden = state === 'overridden'
  return (
    <span
      className={cn(
        'ml-2 inline-flex items-center rounded-[4px] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.04em]',
        overridden ? 'bg-[#fff5d9] text-[#9a6510]' : 'bg-[#e8f7ed] text-[#147940]',
      )}
    >
      {overridden ? 'Overridden' : 'Inherited'}
    </span>
  )
}

function VehicleToggle({ checked, onChange, disabled, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-[24px] w-[42px] shrink-0 rounded-full transition disabled:cursor-not-allowed disabled:opacity-50',
        checked ? 'bg-[#2E9E4D]' : 'bg-[#d5dbd7]',
      )}
    >
      <span
        className={cn(
          'absolute top-[2px] h-[20px] w-[20px] rounded-full bg-white shadow transition',
          checked ? 'left-[20px]' : 'left-[2px]',
        )}
      />
    </button>
  )
}

/**
 * @param {{
 *   value: { bike: boolean, car: boolean },
 *   onChange: (next: { bike: boolean, car: boolean }) => void,
 *   disabled?: boolean,
 *   fieldMeta?: ReturnType<typeof extractAllowedVehiclesFieldMeta>,
 *   onResetField?: (path: string) => void,
 *   resettingPath?: string | null,
 *   error?: string | null,
 * }} props
 */
export default function AdminAllowedVehiclesPanel({
  value,
  onChange,
  disabled = false,
  fieldMeta = null,
  onResetField,
  resettingPath = null,
  error = null,
}) {
  const form = value || DEFAULT_FORM

  const toggle = (key) => {
    if (disabled) return
    const currentlyOn = Boolean(form[key])
    if (currentlyOn) {
      const other = key === 'bike' ? 'car' : 'bike'
      if (!form[other]) return
      onChange({ ...form, [key]: false })
      return
    }
    if (!storeTypeAllows(fieldMeta, key)) return
    onChange({ ...form, [key]: true })
  }

  const rows = [
    { key: 'bike', label: 'Bike' },
    { key: 'car', label: 'Car' },
  ]

  return (
    <div>
      <div className="mb-3">
        <h4 className="text-[14px] font-bold text-[#17231c]">Allowed vehicles</h4>
        <p className="mt-0.5 text-[12px] leading-[16px] text-[#7c8780]">
          Narrow which vehicles may carry orders. You may turn a vehicle off when the store type
          allows both — you cannot enable one the store type disallows.
        </p>
      </div>

      {error ? (
        <div className="mb-3 rounded-[8px] border border-[#f5c2c0] bg-[#fdecea] px-3 py-2 text-[12px] leading-[16px] text-[#b42318]">
          {error}
        </div>
      ) : null}

      <div className="flex w-fit flex-col gap-2.5">
        {rows.map(({ key, label }) => {
          const meta = fieldMeta?.[key]
          const checked = Boolean(form[key])
          const capAllows = storeTypeAllows(fieldMeta, key)
          const otherOn = key === 'bike' ? form.car : form.bike
          const lastOn = checked && !otherOn
          const cannotWiden = !checked && !capAllows
          const toggleDisabled = disabled || lastOn || cannotWiden
          const resetPath = `allowedVehicles.${key}`
          const isOverridden = meta?.state === 'overridden'
          const resetBusy = resettingPath === resetPath

          return (
            <div
              key={key}
              className="flex min-w-[280px] items-center justify-between gap-3 rounded-[12px] bg-[#f3f5f3] px-4 py-3"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center">
                  <span className="text-[13px] font-medium text-[#17231c]">{label}</span>
                  <StateBadge state={meta?.state} />
                  {!capAllows ? (
                    <span className="ml-2 inline-flex items-center rounded-[4px] bg-[#eef0ee] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.04em] text-[#5c665f]">
                      Off for store type
                    </span>
                  ) : null}
                </div>
                {isOverridden && typeof onResetField === 'function' ? (
                  <button
                    type="button"
                    disabled={disabled || resetBusy}
                    onClick={() => onResetField(resetPath)}
                    className="mt-1 text-[11px] font-semibold text-[#2b66a5] hover:underline disabled:opacity-60"
                  >
                    {resetBusy ? 'Resetting…' : 'Reset to default'}
                  </button>
                ) : null}
              </div>
              <VehicleToggle
                checked={checked}
                disabled={toggleDisabled}
                label={label}
                onChange={() => toggle(key)}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
