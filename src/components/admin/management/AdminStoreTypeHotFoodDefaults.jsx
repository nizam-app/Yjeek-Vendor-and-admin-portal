/**
 * Hot-food on-demand vendor + customer field grids (OG §02).
 *
 * Surface: Branch › Delivery Settings (D02) — NOT Store Management › store type.
 * Store type only mocks Allowed vehicles (OG §01); this component is the reusable
 * fee panel for branch and vendor template after mode toggle enable.
 *
 * Optional inheritance: pass `fieldMeta` + `onResetField` for INHERITED / OVERRIDDEN
 * badges and per-field "Reset to default" (branch live settings / vendor template).
 */
import { calcMaxContribution, maxDistanceBelowRadiusError } from '../../../utils/calcMaxContribution'
import { cn } from '../cn'

const inputClass =
  'box-border h-[40px] w-full rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white px-3 text-[13px] text-[#17231c] outline-none transition placeholder:text-[#9aa49d] focus:border-[#1aa054]'

const labelClass = 'mb-1.5 block text-[12px] font-medium text-[#7c8780]'
const hintClass = 'mt-1 text-[11px] leading-[14px] text-[#9aa49d]'

export const EMPTY_HOT_FOOD_DEFAULTS = {
  vendor: {
    radiusKm: '',
    etaMin: '',
    minOrderAmount: '',
    contribution: '',
    freeDeliveryEnabled: false,
    freeDeliveryOver: '',
    maxDistanceKm: '',
    extraPerKm: '',
    serviceFeeContribution: '',
  },
  customer: {
    radiusKm: '',
    contribution: '',
    extraPerKm: '',
    serviceFeeContribution: '',
  },
}

function asInputValue(value) {
  if (value === null || value === undefined) return ''
  return String(value)
}

/**
 * Normalize API hotFoodOnDemand (or null) into controlled form strings / booleans.
 * Accepts either flat store-type shape or branch `{ value, state, defaultValue }` fields.
 */
export function normalizeHotFoodDefaults(raw) {
  const vendor = raw?.vendor && typeof raw.vendor === 'object' ? raw.vendor : {}
  const customer = raw?.customer && typeof raw.customer === 'object' ? raw.customer : {}
  const pick = (obj, key) => {
    const cell = obj[key]
    if (cell && typeof cell === 'object' && 'value' in cell) return cell.value
    return obj[key]
  }
  return {
    vendor: {
      radiusKm: asInputValue(pick(vendor, 'radiusKm')),
      etaMin: asInputValue(pick(vendor, 'etaMin')),
      minOrderAmount: asInputValue(pick(vendor, 'minOrderAmount')),
      contribution: asInputValue(pick(vendor, 'contribution')),
      freeDeliveryEnabled: Boolean(pick(vendor, 'freeDeliveryEnabled')),
      freeDeliveryOver: asInputValue(pick(vendor, 'freeDeliveryOver')),
      maxDistanceKm: asInputValue(pick(vendor, 'maxDistanceKm')),
      extraPerKm: asInputValue(pick(vendor, 'extraPerKm')),
      serviceFeeContribution: asInputValue(pick(vendor, 'serviceFeeContribution')),
    },
    customer: {
      radiusKm: asInputValue(pick(customer, 'radiusKm')),
      contribution: asInputValue(pick(customer, 'contribution')),
      extraPerKm: asInputValue(pick(customer, 'extraPerKm')),
      serviceFeeContribution: asInputValue(pick(customer, 'serviceFeeContribution')),
    },
  }
}

/**
 * Extract per-field inheritance meta from branch GET `hotFoodOnDemand`.
 * @returns {{ vendor: Record<string, { state: string, defaultValue: unknown }>, customer: Record<string, { state: string, defaultValue: unknown }> } | null}
 */
export function extractHotFoodFieldMeta(raw) {
  if (!raw?.vendor || !raw?.customer) return null
  const side = (obj) => {
    const out = {}
    for (const [key, cell] of Object.entries(obj)) {
      if (cell && typeof cell === 'object' && 'state' in cell) {
        out[key] = {
          state: String(cell.state || 'inherited').toLowerCase(),
          defaultValue: cell.defaultValue,
        }
      }
    }
    return out
  }
  return {
    vendor: side(raw.vendor),
    customer: side(raw.customer),
  }
}

function emptyToNull(value) {
  const trimmed = String(value ?? '').trim()
  return trimmed === '' ? null : trimmed
}

/**
 * Build PUT body for hotFoodOnDemand. Omits maxContribution / customer.maxDistanceKm.
 * Empty service fee → null. freeDelivery off → freeDeliveryOver null.
 */
export function buildHotFoodDefaultsPayload(form) {
  const vendor = form?.vendor || EMPTY_HOT_FOOD_DEFAULTS.vendor
  const customer = form?.customer || EMPTY_HOT_FOOD_DEFAULTS.customer
  const freeEnabled = Boolean(vendor.freeDeliveryEnabled)

  return {
    vendor: {
      radiusKm: emptyToNull(vendor.radiusKm),
      etaMin: emptyToNull(vendor.etaMin) == null ? null : Number(vendor.etaMin),
      minOrderAmount: emptyToNull(vendor.minOrderAmount),
      contribution: emptyToNull(vendor.contribution),
      freeDeliveryEnabled: freeEnabled,
      freeDeliveryOver: freeEnabled ? emptyToNull(vendor.freeDeliveryOver) : null,
      maxDistanceKm: emptyToNull(vendor.maxDistanceKm),
      extraPerKm: emptyToNull(vendor.extraPerKm),
      serviceFeeContribution: emptyToNull(vendor.serviceFeeContribution),
    },
    customer: {
      radiusKm: emptyToNull(customer.radiusKm),
      contribution: emptyToNull(customer.contribution),
      extraPerKm: emptyToNull(customer.extraPerKm),
      serviceFeeContribution: emptyToNull(customer.serviceFeeContribution),
    },
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
        overridden
          ? 'bg-[#fde8e8] text-[#b42318]'
          : 'bg-[#e8f7ed] text-[#147940]',
      )}
    >
      {overridden ? 'Overridden' : 'Inherited'}
    </span>
  )
}

function LockBadge({ children }) {
  return (
    <span className="ml-1.5 inline-flex items-center rounded-[4px] bg-[#eef0ee] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.04em] text-[#5c665f]">
      {children}
    </span>
  )
}

function Field({ label, badge, stateBadge, aside, hint, error, children }) {
  return (
    <div className="min-w-0">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <label className={cn(labelClass, 'mb-0')}>
          {label}
          {badge ? <LockBadge>{badge}</LockBadge> : null}
          {stateBadge}
        </label>
        {aside}
      </div>
      {children}
      {error ? <p className="mt-1 text-[11px] leading-[14px] text-[#d64044]">{error}</p> : null}
      {!error && hint ? <p className={hintClass}>{hint}</p> : null}
    </div>
  )
}

function MoneyOrKmInput({ readOnly = false, className, ...props }) {
  return (
    <input
      readOnly={readOnly}
      className={cn(
        inputClass,
        readOnly && 'cursor-default bg-[#f7f8f7] text-[#5c665f] focus:border-[rgba(0,0,0,0.1)]',
        className,
      )}
      {...props}
    />
  )
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
 * Hot-food on-demand vendor + customer panels (OG §02).
 * Max contribution + customer max distance are live read-only. No scheduled fields.
 *
 * @param {{
 *   value: object,
 *   onChange: (next: object) => void,
 *   disabled?: boolean,
 *   fieldMeta?: { vendor?: Record<string, { state?: string, defaultValue?: unknown }>, customer?: Record<string, { state?: string, defaultValue?: unknown }> } | null,
 *   onResetField?: (path: string) => void,
 *   resettingPath?: string | null,
 * }} props
 */
export default function AdminStoreTypeHotFoodDefaults({
  value,
  onChange,
  disabled = false,
  fieldMeta = null,
  onResetField = null,
  resettingPath = null,
}) {
  const form = value || EMPTY_HOT_FOOD_DEFAULTS
  const vendor = form.vendor
  const customer = form.customer
  const showInheritance = Boolean(fieldMeta)

  const vendorMaxContribution = calcMaxContribution({
    deliveryContribution: vendor.contribution,
    extraContributionPerKm: vendor.extraPerKm,
    maxDistanceKm: vendor.maxDistanceKm,
    deliveryRadiusKm: vendor.radiusKm,
  })

  const customerMaxContribution = calcMaxContribution({
    deliveryContribution: customer.contribution,
    extraContributionPerKm: customer.extraPerKm,
    maxDistanceKm: vendor.maxDistanceKm,
    deliveryRadiusKm: customer.radiusKm,
  })

  const maxDistanceError = maxDistanceBelowRadiusError({
    maxDistanceKm: vendor.maxDistanceKm,
    deliveryRadiusKm: vendor.radiusKm,
    scopeLabel: 'Max distance',
  })

  const patchVendor = (key, next) => {
    onChange({
      ...form,
      vendor: { ...vendor, [key]: next },
    })
  }

  const patchCustomer = (key, next) => {
    onChange({
      ...form,
      customer: { ...customer, [key]: next },
    })
  }

  const onVendorInput = (key) => (event) => patchVendor(key, event.target.value)
  const onCustomerInput = (key) => (event) => patchCustomer(key, event.target.value)

  const inheritanceHint = (side, key, baseHint) => {
    if (!showInheritance) return baseHint
    const meta = fieldMeta?.[side]?.[key]
    if (!meta) return baseHint
    const def = formatDefaultHint(meta.defaultValue)
    const isOverridden = meta.state === 'overridden'
    const path = `hotFoodOnDemand.${side}.${key}`
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

  const stateBadgeFor = (side, key) => {
    if (!showInheritance) return null
    const state = fieldMeta?.[side]?.[key]?.state
    return state ? <StateBadge state={state} /> : null
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[12px] border border-[#eceeec] bg-[#fafbfa] p-4">
        <div className="mb-3">
          <h4 className="text-[13.5px] font-bold text-[#17231c]">Vendor side</h4>
          <p className="mt-0.5 text-[12px] leading-[16px] text-[#7c8780]">
            What the vendor contributes toward the delivery cost.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-3.5 max-[700px]:grid-cols-1">
          <Field
            label="Delivery radius (km)"
            stateBadge={stateBadgeFor('vendor', 'radiusKm')}
            hint={inheritanceHint(
              'vendor',
              'radiusKm',
              "The vendor's free zone. Inside it the vendor pays only the flat contribution below.",
            )}
          >
            <MoneyOrKmInput
              value={vendor.radiusKm}
              onChange={onVendorInput('radiusKm')}
              disabled={disabled}
              inputMode="decimal"
            />
          </Field>
          <Field
            label="Delivery ETA (min)"
            stateBadge={stateBadgeFor('vendor', 'etaMin')}
            hint={inheritanceHint(
              'vendor',
              'etaMin',
              'Time from pickup to drop-off. Does not include kitchen prep time.',
            )}
          >
            <MoneyOrKmInput
              value={vendor.etaMin}
              onChange={onVendorInput('etaMin')}
              disabled={disabled}
              inputMode="numeric"
            />
          </Field>
          <Field
            label="Min order for delivery (BHD)"
            stateBadge={stateBadgeFor('vendor', 'minOrderAmount')}
            hint={inheritanceHint(
              'vendor',
              'minOrderAmount',
              'Below this the order cannot be placed. Customer sees the exact shortfall needed.',
            )}
          >
            <MoneyOrKmInput
              value={vendor.minOrderAmount}
              onChange={onVendorInput('minOrderAmount')}
              disabled={disabled}
              inputMode="decimal"
            />
          </Field>
          <Field
            label="Delivery contribution (BHD) / order"
            stateBadge={stateBadgeFor('vendor', 'contribution')}
            hint={inheritanceHint(
              'vendor',
              'contribution',
              'Flat amount the vendor pays on every order inside the radius.',
            )}
          >
            <MoneyOrKmInput
              value={vendor.contribution}
              onChange={onVendorInput('contribution')}
              disabled={disabled}
              inputMode="decimal"
            />
          </Field>
          <Field
            label="Free delivery over (BHD)"
            stateBadge={stateBadgeFor('vendor', 'freeDeliveryOver')}
            aside={(
              <FreeDeliveryToggle
                checked={Boolean(vendor.freeDeliveryEnabled)}
                onChange={(next) => patchVendor('freeDeliveryEnabled', next)}
                disabled={disabled}
              />
            )}
            hint={inheritanceHint(
              'vendor',
              'freeDeliveryOver',
              'Above this cart value the customer pays no delivery fee. Toggle off to disable entirely.',
            )}
          >
            <MoneyOrKmInput
              value={vendor.freeDeliveryOver}
              onChange={onVendorInput('freeDeliveryOver')}
              disabled={disabled || !vendor.freeDeliveryEnabled}
              inputMode="decimal"
            />
          </Field>
          <Field
            label="Max distance (km)"
            stateBadge={stateBadgeFor('vendor', 'maxDistanceKm')}
            hint={inheritanceHint(
              'vendor',
              'maxDistanceKm',
              'Hard ceiling. Beyond this the vendor is not orderable at all.',
            )}
            error={maxDistanceError}
          >
            <MoneyOrKmInput
              value={vendor.maxDistanceKm}
              onChange={onVendorInput('maxDistanceKm')}
              disabled={disabled}
              inputMode="decimal"
              aria-invalid={Boolean(maxDistanceError)}
              className={maxDistanceError ? 'border-[#d64044] focus:border-[#d64044]' : undefined}
            />
          </Field>
          <Field
            label="Extra contribution per km (BHD)"
            stateBadge={stateBadgeFor('vendor', 'extraPerKm')}
            hint={inheritanceHint(
              'vendor',
              'extraPerKm',
              'Charged to the vendor for each km between the radius and the max distance.',
            )}
          >
            <MoneyOrKmInput
              value={vendor.extraPerKm}
              onChange={onVendorInput('extraPerKm')}
              disabled={disabled}
              inputMode="decimal"
            />
          </Field>
          <Field
            label="Max contribution (BHD)"
            badge="AUTO"
            hint="Read-only ceiling: contribution + (max distance − radius) × extra per km. Recalculates live."
          >
            <MoneyOrKmInput
              value={vendorMaxContribution ?? '—'}
              readOnly
              aria-readonly="true"
            />
          </Field>
          <Field
            label="Service fee contribution"
            stateBadge={stateBadgeFor('vendor', 'serviceFeeContribution')}
            hint={inheritanceHint(
              'vendor',
              'serviceFeeContribution',
              'Build the field now. Calculation method to be sent by Yjeek later. Leave empty for null.',
            )}
          >
            <MoneyOrKmInput
              value={vendor.serviceFeeContribution}
              onChange={onVendorInput('serviceFeeContribution')}
              disabled={disabled}
              inputMode="decimal"
              placeholder="—"
            />
          </Field>
        </div>
      </div>

      <div className="rounded-[12px] border border-[#eceeec] bg-[#fafbfa] p-4">
        <div className="mb-3">
          <h4 className="text-[13.5px] font-bold text-[#17231c]">Customer side</h4>
          <p className="mt-0.5 text-[12px] leading-[16px] text-[#7c8780]">
            What the customer pays for delivery. Independent of the vendor radius on purpose.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-3.5 max-[700px]:grid-cols-1">
          <Field
            label="Delivery radius (km)"
            stateBadge={stateBadgeFor('customer', 'radiusKm')}
            hint={inheritanceHint(
              'customer',
              'radiusKm',
              "The customer's free zone. May differ from the vendor radius.",
            )}
          >
            <MoneyOrKmInput
              value={customer.radiusKm}
              onChange={onCustomerInput('radiusKm')}
              disabled={disabled}
              inputMode="decimal"
            />
          </Field>
          <Field
            label="Max distance (km)"
            badge="FROM VENDOR"
            hint="Read-only. Mirrors the vendor value — one ceiling governs both sides."
          >
            <MoneyOrKmInput
              value={vendor.maxDistanceKm === '' ? '—' : vendor.maxDistanceKm}
              readOnly
              aria-readonly="true"
            />
          </Field>
          <Field
            label="Customer contribution (BHD) / order"
            stateBadge={stateBadgeFor('customer', 'contribution')}
            hint={inheritanceHint(
              'customer',
              'contribution',
              'Flat delivery fee on every order inside the customer radius.',
            )}
          >
            <MoneyOrKmInput
              value={customer.contribution}
              onChange={onCustomerInput('contribution')}
              disabled={disabled}
              inputMode="decimal"
            />
          </Field>
          <Field
            label="Extra contribution per km (BHD)"
            stateBadge={stateBadgeFor('customer', 'extraPerKm')}
            hint={inheritanceHint(
              'customer',
              'extraPerKm',
              'Charged to the customer for each km between the customer radius and the max distance.',
            )}
          >
            <MoneyOrKmInput
              value={customer.extraPerKm}
              onChange={onCustomerInput('extraPerKm')}
              disabled={disabled}
              inputMode="decimal"
            />
          </Field>
          <Field
            label="Max contribution (BHD)"
            badge="AUTO"
            hint="Read-only ceiling: contribution + (vendor max distance − customer radius) × extra per km. Recalculates live."
          >
            <MoneyOrKmInput
              value={customerMaxContribution ?? '—'}
              readOnly
              aria-readonly="true"
            />
          </Field>
          <Field
            label="Service fee contribution"
            stateBadge={stateBadgeFor('customer', 'serviceFeeContribution')}
            hint={inheritanceHint(
              'customer',
              'serviceFeeContribution',
              'Build the field now. Calculation method to be sent by Yjeek later. Leave empty for null.',
            )}
          >
            <MoneyOrKmInput
              value={customer.serviceFeeContribution}
              onChange={onCustomerInput('serviceFeeContribution')}
              disabled={disabled}
              inputMode="decimal"
              placeholder="—"
            />
          </Field>
        </div>
      </div>
    </div>
  )
}
