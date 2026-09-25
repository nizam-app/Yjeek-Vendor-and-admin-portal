/**
 * Scheduled delivery fee grids (OG §05 / D06 Batch 3).
 *
 * Flat rates per speed tier × item class. No radius / per-km / max distance.
 * Used on Branch › Delivery Settings (and Vendor template). Store-type seed
 * values stay API-backed (OG §01 — no fee grids on Store Management).
 *
 * Empty cells stay empty (placeholder "—"); never invent zeros.
 */
import { useState } from 'react'
import { cn } from '../cn'
import {
  EMPTY_SCHEDULED_FEES,
  SCHEDULED_SPEED_TIER_LABELS,
  SCHEDULED_SPEED_TIERS,
} from './scheduledFeesForm'

export {
  EMPTY_SCHEDULED_FEES,
  SCHEDULED_SPEED_TIER_LABELS,
  SCHEDULED_SPEED_TIERS,
  SCHEDULED_TIER_RATE_KEYS,
  buildScheduledFeesPayload,
  emptyScheduledFeesForm,
  extractScheduledFieldMeta,
  normalizeScheduledFees,
} from './scheduledFeesForm'

const inputClass =
  'box-border h-[40px] w-full rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white px-3 text-[13px] text-[#17231c] outline-none transition placeholder:text-[#9aa49d] focus:border-[#1aa054]'

const labelClass = 'mb-1.5 block text-[12px] font-medium text-[#7c8780]'
const hintClass = 'mt-1 text-[11px] leading-[14px] text-[#9aa49d]'

function emptyTierForm() {
  return {
    vendorNormal: '',
    vendorSpecial: '',
    customerNormal: '',
    customerSpecial: '',
    minOrderAmount: '',
    freeDeliveryEnabled: false,
    freeDeliveryOver: '',
  }
}

function formatDefaultHint(defaultValue) {
  if (defaultValue === null || defaultValue === undefined || defaultValue === '') return null
  if (typeof defaultValue === 'boolean') return defaultValue ? 'true' : 'false'
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

function Field({ label, stateBadge, aside, hint, children }) {
  return (
    <div className="min-w-0">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <label className={cn(labelClass, 'mb-0')}>
          {label}
          {stateBadge}
        </label>
        {aside}
      </div>
      {children}
      {hint ? <p className={hintClass}>{hint}</p> : null}
    </div>
  )
}

function MoneyInput({ className, ...props }) {
  return <input className={cn(inputClass, className)} {...props} />
}

function FreeDeliveryToggle({ checked, onChange, disabled = false }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-[24px] w-[42px] shrink-0 rounded-full transition disabled:opacity-60',
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
 *   value: object,
 *   onChange: (next: object) => void,
 *   disabled?: boolean,
 *   fieldMeta?: { tiers?: Record<string, Record<string, { state?: string, defaultValue?: unknown }>> } | null,
 *   onResetField?: (path: string) => void,
 *   resettingPath?: string | null,
 *   initialTier?: string,
 * }} props
 */
export default function AdminScheduledFeesPanel({
  value,
  onChange,
  disabled = false,
  fieldMeta = null,
  onResetField = null,
  resettingPath = null,
  initialTier = 'SAME_DAY',
}) {
  const form = value || EMPTY_SCHEDULED_FEES
  const [activeTier, setActiveTier] = useState(
    SCHEDULED_SPEED_TIERS.includes(initialTier) ? initialTier : 'SAME_DAY',
  )
  const showInheritance = Boolean(fieldMeta?.tiers)
  const tier = form.tiers?.[activeTier] || emptyTierForm()
  const tierLabel = SCHEDULED_SPEED_TIER_LABELS[activeTier] || activeTier

  const patchTier = (key, next) => {
    onChange({
      ...form,
      tiers: {
        ...form.tiers,
        [activeTier]: {
          ...tier,
          [key]: next,
          ...(key === 'freeDeliveryEnabled' && !next ? { freeDeliveryOver: '' } : {}),
        },
      },
    })
  }

  const onInput = (key) => (event) => patchTier(key, event.target.value)

  const inheritanceHint = (key, baseHint) => {
    if (!showInheritance) return baseHint
    const meta = fieldMeta?.tiers?.[activeTier]?.[key]
    if (!meta) return baseHint
    const def = formatDefaultHint(meta.defaultValue)
    const isOverridden = meta.state === 'overridden'
    const path = `scheduled.tiers.${activeTier}.${key}`
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

  const stateBadgeFor = (key) => {
    if (!showInheritance) return null
    const state = fieldMeta?.tiers?.[activeTier]?.[key]?.state
    return state ? <StateBadge state={state} /> : null
  }

  return (
    <div className="space-y-3">
      <div className="rounded-[12px] border border-[#eceeec] bg-[#fafbfa] p-4">
        <div className="mb-2">
          <h4 className="text-[13.5px] font-bold text-[#17231c]">Speed tier</h4>
          <p className="mt-0.5 text-[12px] leading-[16px] text-[#7c8780]">
            Switching the tier loads that tier&apos;s own values. Nothing is shared between tiers.
          </p>
        </div>
        <div className="mt-2 flex flex-wrap gap-2" role="tablist" aria-label="Scheduled speed tiers">
          {SCHEDULED_SPEED_TIERS.map((tierKey) => {
            const selected = tierKey === activeTier
            return (
              <button
                key={tierKey}
                type="button"
                role="tab"
                aria-selected={selected}
                disabled={disabled}
                onClick={() => setActiveTier(tierKey)}
                className={cn(
                  'inline-flex h-[28px] items-center rounded-full px-3 text-[11px] font-semibold transition disabled:opacity-60',
                  selected ? 'bg-[#2E9E4D] text-white' : 'bg-[#eef0ee] text-[#7c8780] hover:bg-[#e4e8e5]',
                )}
              >
                {SCHEDULED_SPEED_TIER_LABELS[tierKey]}
              </button>
            )
          })}
        </div>
      </div>

      <div className="rounded-[12px] border border-[#eceeec] bg-[#fafbfa] p-4">
        <div className="mb-3">
          <h4 className="text-[13.5px] font-bold text-[#17231c]">
            {tierLabel} — contributions by item class
          </h4>
          <p className="mt-0.5 text-[12px] leading-[16px] text-[#7c8780]">
            Flat rates. Leave empty until rates are set — empty is not zero.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-3.5 max-[700px]:grid-cols-1">
          <Field
            label="Normal item — vendor (BHD)"
            stateBadge={stateBadgeFor('vendorNormal')}
            hint={inheritanceHint(
              'vendorNormal',
              'Vendor pays this on a Normal-class scheduled order at this tier.',
            )}
          >
            <MoneyInput
              value={tier.vendorNormal}
              onChange={onInput('vendorNormal')}
              disabled={disabled}
              inputMode="decimal"
              placeholder="—"
            />
          </Field>
          <Field
            label="Normal item — customer (BHD)"
            stateBadge={stateBadgeFor('customerNormal')}
            hint={inheritanceHint(
              'customerNormal',
              'Customer pays this. Flat — distance is never read on scheduled.',
            )}
          >
            <MoneyInput
              value={tier.customerNormal}
              onChange={onInput('customerNormal')}
              disabled={disabled}
              inputMode="decimal"
              placeholder="—"
            />
          </Field>
          <Field
            label="Special item — vendor (BHD)"
            stateBadge={stateBadgeFor('vendorSpecial')}
            hint={inheritanceHint(
              'vendorSpecial',
              'Applies if any item in the cart is Special, or the vendor is marked Special.',
            )}
          >
            <MoneyInput
              value={tier.vendorSpecial}
              onChange={onInput('vendorSpecial')}
              disabled={disabled}
              inputMode="decimal"
              placeholder="—"
            />
          </Field>
          <Field
            label="Special item — customer (BHD)"
            stateBadge={stateBadgeFor('customerSpecial')}
            hint={inheritanceHint(
              'customerSpecial',
              'One class applies to the whole order — fees are never split per line.',
            )}
          >
            <MoneyInput
              value={tier.customerSpecial}
              onChange={onInput('customerSpecial')}
              disabled={disabled}
              inputMode="decimal"
              placeholder="—"
            />
          </Field>
        </div>
      </div>

      <div className="rounded-[12px] border border-[#eceeec] bg-[#fafbfa] p-4">
        <div className="mb-3">
          <h4 className="text-[13.5px] font-bold text-[#17231c]">{tierLabel} — limits</h4>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-3.5 max-[700px]:grid-cols-1">
          <Field
            label="Min order for delivery (BHD)"
            stateBadge={stateBadgeFor('minOrderAmount')}
            hint={inheritanceHint(
              'minOrderAmount',
              'Below this the scheduled order cannot be placed.',
            )}
          >
            <MoneyInput
              value={tier.minOrderAmount}
              onChange={onInput('minOrderAmount')}
              disabled={disabled}
              inputMode="decimal"
              placeholder="—"
            />
          </Field>
          <Field
            label="Free delivery over (BHD)"
            stateBadge={stateBadgeFor('freeDeliveryOver')}
            aside={(
              <FreeDeliveryToggle
                checked={Boolean(tier.freeDeliveryEnabled)}
                onChange={(next) => patchTier('freeDeliveryEnabled', next)}
                disabled={disabled}
              />
            )}
            hint={inheritanceHint(
              'freeDeliveryOver',
              tier.freeDeliveryEnabled
                ? 'Above this cart value the customer fee is waived for this tier.'
                : 'Off for this tier. Toggle on to waive the customer fee above a cart value.',
            )}
          >
            <MoneyInput
              value={tier.freeDeliveryEnabled ? tier.freeDeliveryOver : ''}
              onChange={onInput('freeDeliveryOver')}
              disabled={disabled || !tier.freeDeliveryEnabled}
              inputMode="decimal"
              placeholder="—"
              readOnly={!tier.freeDeliveryEnabled}
              className={!tier.freeDeliveryEnabled ? 'cursor-default bg-[#f7f8f7] text-[#5c665f]' : undefined}
            />
          </Field>
        </div>
        <p className="mt-3 text-[11px] leading-[15px] text-[#7c8780]">
          Scheduled orders have no distance component. There is no radius, per-km rate, or max
          distance on this panel.
        </p>
      </div>
    </div>
  )
}
