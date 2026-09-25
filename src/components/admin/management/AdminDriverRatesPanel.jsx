/**
 * Driver rates panels (OG §06 / D07 Batch 3).
 *
 * On-demand: base by vehicle + free radius + extra/km (distance-based).
 * Scheduled: two separate flat grids — Bike and Car × tier × Normal/Special.
 * Never a shared scheduled set. Empty cells use placeholder "—"; never invent zeros.
 *
 * Used on Branch › Delivery Settings and Vendor template.
 * Store-type seed stays API-backed (same pattern as scheduled fees / D06).
 */
import { cn } from '../cn'
import {
  EMPTY_DRIVER_RATES,
  SCHEDULED_SPEED_TIER_LABELS,
  SCHEDULED_SPEED_TIERS,
} from './driverRatesForm'

export {
  EMPTY_DRIVER_RATES,
  DRIVER_ON_DEMAND_KEYS,
  DRIVER_SCHEDULED_GRID_KEYS,
  DRIVER_SCHEDULED_TIER_KEYS,
  SCHEDULED_SPEED_TIER_LABELS,
  SCHEDULED_SPEED_TIERS,
  buildDriverRatesPayload,
  emptyDriverRatesForm,
  extractDriverRatesFieldMeta,
  hasSeparateScheduledDriverGrids,
  normalizeDriverRates,
} from './driverRatesForm'

const inputClass =
  'box-border h-[40px] w-full rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white px-3 text-[13px] text-[#17231c] outline-none transition placeholder:text-[#9aa49d] focus:border-[#1aa054]'

const labelClass = 'mb-1.5 block text-[12px] font-medium text-[#7c8780]'
const hintClass = 'mt-1 text-[11px] leading-[14px] text-[#9aa49d]'

function formatDefaultHint(defaultValue) {
  if (defaultValue === null || defaultValue === undefined || defaultValue === '') return null
  return String(defaultValue)
}

function StateBadge({ state }) {
  if (!state) return null
  const overridden = state === 'overridden'
  return (
    <span
      className={cn(
        'ml-1.5 inline-flex items-center rounded-[4px] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.04em]',
        overridden ? 'bg-[#fde8e8] text-[#b42318]' : 'bg-[#e8f7ed] text-[#147940]',
      )}
    >
      {overridden ? 'Overridden' : 'Inherited'}
    </span>
  )
}

function Field({ label, stateBadge, hint, children }) {
  return (
    <div className="min-w-0">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <label className={cn(labelClass, 'mb-0')}>
          {label}
          {stateBadge}
        </label>
      </div>
      {children}
      {hint ? <p className={hintClass}>{hint}</p> : null}
    </div>
  )
}

function MoneyInput({ className, ...props }) {
  return <input className={cn(inputClass, className)} {...props} />
}

const ON_DEMAND_FIELDS = [
  {
    key: 'bikeBase',
    label: 'Bike — base (BHD)',
    hint: 'Paid to the driver for a bike delivery inside the free radius.',
  },
  {
    key: 'carBase',
    label: 'Car — base (BHD)',
    hint: 'Same, when the order is assigned to a car.',
  },
  {
    key: 'freeRadiusKm',
    label: 'Free radius (km)',
    hint: 'Wider than the vendor radius on purpose',
  },
  {
    key: 'extraPerKm',
    label: 'Extra per km (BHD)',
    hint: 'Added to the driver pay for each km beyond the free radius.',
  },
]

const DRIVER_SCHEDULED_FIELDS = [
  { key: 'normal', classLabel: 'Normal' },
  { key: 'special', classLabel: 'Special' },
]

/**
 * @param {{
 *   value: object,
 *   onChange: (next: object) => void,
 *   disabled?: boolean,
 *   fieldMeta?: {
 *     onDemand?: Record<string, { state?: string, defaultValue?: unknown }> | null,
 *     scheduledBike?: { tiers?: Record<string, Record<string, { state?: string, defaultValue?: unknown }>> } | null,
 *     scheduledCar?: { tiers?: Record<string, Record<string, { state?: string, defaultValue?: unknown }>> } | null,
 *   } | null,
 *   onResetField?: (path: string) => void,
 *   resettingPath?: string | null,
 * }} props
 */
export default function AdminDriverRatesPanel({
  value,
  onChange,
  disabled = false,
  fieldMeta = null,
  onResetField = null,
  resettingPath = null,
}) {
  const form = value || EMPTY_DRIVER_RATES
  const onDemand = form.onDemand || EMPTY_DRIVER_RATES.onDemand

  const patchOnDemand = (key, next) => {
    onChange({
      ...form,
      onDemand: {
        ...onDemand,
        [key]: next,
      },
    })
  }

  const patchScheduled = (gridKey, tier, rateKey, next) => {
    const grid = form[gridKey] || EMPTY_DRIVER_RATES[gridKey]
    const cell = grid.tiers?.[tier] || { normal: '', special: '' }
    onChange({
      ...form,
      [gridKey]: {
        ...grid,
        tiers: {
          ...grid.tiers,
          [tier]: {
            ...cell,
            [rateKey]: next,
          },
        },
      },
    })
  }

  const inheritanceHint = (path, meta, baseHint) => {
    if (!meta) return baseHint
    const def = formatDefaultHint(meta.defaultValue)
    const isOverridden = meta.state === 'overridden'
    const resetBusy = resettingPath === path
    return (
      <>
        {baseHint}
        {isOverridden && def != null ? (
          <>
            {' '}
            Default: {def}
            {typeof onResetField === 'function' ? (
              <>
                {' · '}
                <button
                  type="button"
                  disabled={disabled || resetBusy}
                  onClick={() => onResetField(path)}
                  className="font-semibold text-[#147940] hover:underline disabled:opacity-60"
                >
                  {resetBusy ? 'Resetting…' : 'Reset to default'}
                </button>
              </>
            ) : null}
          </>
        ) : null}
      </>
    )
  }

  const stateBadgeFor = (meta) => {
    if (!meta?.state) return null
    return <StateBadge state={meta.state} />
  }

  const renderScheduledGrid = (gridKey, title, note) => {
    const grid = form[gridKey] || EMPTY_DRIVER_RATES[gridKey]
    const gridMeta = fieldMeta?.[gridKey]

    return (
      <div className="rounded-[12px] border border-[#eceeec] bg-[#fafbfa] p-4">
        <div className="mb-3">
          <h4 className="text-[13.5px] font-bold text-[#17231c]">{title}</h4>
          <p className="mt-0.5 text-[12px] leading-[16px] text-[#7c8780]">
            Flat rate per speed tier and item class. No distance component.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-3.5 max-[700px]:grid-cols-1">
          {SCHEDULED_SPEED_TIERS.map((tier) => {
            const tierLabel = SCHEDULED_SPEED_TIER_LABELS[tier] || tier
            const cell = grid.tiers?.[tier] || { normal: '', special: '' }
            return (
              <div key={`${gridKey}-${tier}`} className="contents">
                {DRIVER_SCHEDULED_FIELDS.map(({ key, classLabel }) => {
                  const path = `driverRates.${gridKey}.tiers.${tier}.${key}`
                  const meta = gridMeta?.tiers?.[tier]?.[key]
                  return (
                    <Field
                      key={`${gridKey}-${tier}-${key}`}
                      label={`${tierLabel} — ${classLabel} (BHD)`}
                      stateBadge={stateBadgeFor(meta)}
                      hint={inheritanceHint(path, meta, null)}
                    >
                      <MoneyInput
                        value={cell[key]}
                        onChange={(event) =>
                          patchScheduled(gridKey, tier, key, event.target.value)
                        }
                        disabled={disabled}
                        inputMode="decimal"
                        placeholder="—"
                        aria-label={`${title} ${tierLabel} ${classLabel}`}
                      />
                    </Field>
                  )
                })}
              </div>
            )
          })}
        </div>
        {note ? (
          <p className="mt-3 text-[11px] leading-[15px] text-[#7c8780]">{note}</p>
        ) : null}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="rounded-[12px] border border-[#eceeec] bg-[#fafbfa] p-4">
        <div className="mb-3">
          <h4 className="text-[13.5px] font-bold text-[#17231c]">
            On-demand — base rate by vehicle
          </h4>
          <p className="mt-0.5 text-[12px] leading-[16px] text-[#7c8780]">
            Distance beyond the free radius is added per km.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-3.5 max-[700px]:grid-cols-1">
          {ON_DEMAND_FIELDS.map(({ key, label, hint }) => {
            const path = `driverRates.onDemand.${key}`
            const meta = fieldMeta?.onDemand?.[key]
            return (
              <Field
                key={key}
                label={label}
                stateBadge={stateBadgeFor(meta)}
                hint={inheritanceHint(path, meta, hint)}
              >
                <MoneyInput
                  value={onDemand[key]}
                  onChange={(event) => patchOnDemand(key, event.target.value)}
                  disabled={disabled}
                  inputMode="decimal"
                  placeholder="—"
                  aria-label={label}
                />
              </Field>
            )
          })}
        </div>
      </div>

      {renderScheduledGrid(
        'scheduledBike',
        'Scheduled — Bike',
        null,
      )}

      {renderScheduledGrid(
        'scheduledCar',
        'Scheduled — Car',
        'Scheduled driver pay is vehicle-specific. Bike and car are never priced together. Values are placeholders until rates are set — empty is not zero.',
      )}
    </div>
  )
}
