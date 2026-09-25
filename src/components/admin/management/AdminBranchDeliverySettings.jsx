/**
 * Branch › Status & controls › Delivery Settings
 * (OG §02 / D02 Batch 4 + D06 Batch 3 + D07 Batch 3).
 *
 * Mode accordion toggles + hot-food / scheduled fee panels + driver rates.
 * Pickup / Dine-in / Services have no fee panel.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { formatApiErrorMessage } from '../../../api/errors'
import { adminService } from '../../../services/adminService'
import { cn } from '../cn'
import AdminStoreTypeHotFoodDefaults, {
  EMPTY_HOT_FOOD_DEFAULTS,
  buildHotFoodDefaultsPayload,
  extractHotFoodFieldMeta,
  normalizeHotFoodDefaults,
} from './AdminStoreTypeHotFoodDefaults'
import AdminScheduledFeesPanel, {
  EMPTY_SCHEDULED_FEES,
  buildScheduledFeesPayload,
  extractScheduledFieldMeta,
  normalizeScheduledFees,
} from './AdminScheduledFeesPanel'
import AdminDriverRatesPanel, {
  EMPTY_DRIVER_RATES,
  buildDriverRatesPayload,
  extractDriverRatesFieldMeta,
  normalizeDriverRates,
} from './AdminDriverRatesPanel'

export const BRANCH_DELIVERY_MODE_ORDER = [
  'HOT_FOOD_ON_DEMAND',
  'SCHEDULED',
  'PICKUP',
  'DINE_IN',
  'SERVICES',
]

export const BRANCH_DELIVERY_MODE_LABELS = {
  HOT_FOOD_ON_DEMAND: 'Hot food — on demand',
  SCHEDULED: 'Scheduled',
  PICKUP: 'Pickup',
  DINE_IN: 'Dine-in',
  SERVICES: 'Services',
}

/** Modes that open a settings panel when enabled (OG §02 rule 4: others absent). */
const MODES_WITH_PANEL = new Set(['HOT_FOOD_ON_DEMAND', 'SCHEDULED'])

const LAST_MODE_OFF_MESSAGE = 'At least one order mode must stay on'
const UNSUPPORTED_MODE_MESSAGE = 'Mode not available for this store type'

function emptyModesLocal() {
  return {
    HOT_FOOD_ON_DEMAND: { enabled: false, seeded: false, supportedByStoreType: true },
    SCHEDULED: { enabled: false, seeded: false, supportedByStoreType: true },
    PICKUP: { enabled: false, supportedByStoreType: true },
    DINE_IN: { enabled: false, supportedByStoreType: true },
    SERVICES: { enabled: false, supportedByStoreType: true },
  }
}

function normalizeModesFromApi(rawModes) {
  const base = emptyModesLocal()
  if (!rawModes || typeof rawModes !== 'object') return base
  for (const key of BRANCH_DELIVERY_MODE_ORDER) {
    const m = rawModes[key]
    if (!m || typeof m !== 'object') continue
    base[key] = {
      enabled: Boolean(m.enabled),
      supportedByStoreType: m.supportedByStoreType !== false,
      ...(key === 'HOT_FOOD_ON_DEMAND' || key === 'SCHEDULED'
        ? { seeded: Boolean(m.seeded) }
        : {}),
    }
  }
  return base
}

function countEnabled(modes) {
  return BRANCH_DELIVERY_MODE_ORDER.filter((key) => modes[key]?.enabled).length
}

function hasAnyHotFoodOverride(fieldMeta) {
  if (!fieldMeta) return false
  for (const side of ['vendor', 'customer']) {
    const bag = fieldMeta[side] || {}
    for (const meta of Object.values(bag)) {
      if (meta?.state === 'overridden') return true
    }
  }
  return false
}

function hasAnyScheduledOverride(fieldMeta) {
  if (!fieldMeta?.tiers) return false
  for (const tierBag of Object.values(fieldMeta.tiers)) {
    for (const meta of Object.values(tierBag || {})) {
      if (meta?.state === 'overridden') return true
    }
  }
  return false
}

function hasAnyDriverRatesOverride(fieldMeta) {
  if (!fieldMeta) return false
  if (fieldMeta.onDemand) {
    for (const meta of Object.values(fieldMeta.onDemand)) {
      if (meta?.state === 'overridden') return true
    }
  }
  for (const gridKey of ['scheduledBike', 'scheduledCar']) {
    const tiers = fieldMeta[gridKey]?.tiers
    if (!tiers) continue
    for (const tierBag of Object.values(tiers)) {
      for (const meta of Object.values(tierBag || {})) {
        if (meta?.state === 'overridden') return true
      }
    }
  }
  return false
}

function ModeToggle({ checked, onChange, disabled = false, label }) {
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

function applyServerPayload(
  data,
  setPricingModel,
  setModes,
  setHotFoodForm,
  setHotFoodFieldMeta,
  setScheduledForm,
  setScheduledFieldMeta,
  setDriverRatesForm,
  setDriverRatesFieldMeta,
) {
  setPricingModel(data?.pricingModel || 'legacy_flat')
  setModes(normalizeModesFromApi(data?.modes))
  if (data?.hotFoodOnDemand) {
    setHotFoodForm(normalizeHotFoodDefaults(data.hotFoodOnDemand))
    setHotFoodFieldMeta(extractHotFoodFieldMeta(data.hotFoodOnDemand))
  } else {
    setHotFoodForm(EMPTY_HOT_FOOD_DEFAULTS)
    setHotFoodFieldMeta(null)
  }
  if (data?.scheduled) {
    setScheduledForm(normalizeScheduledFees(data.scheduled))
    setScheduledFieldMeta(extractScheduledFieldMeta(data.scheduled))
  } else {
    setScheduledForm(EMPTY_SCHEDULED_FEES)
    setScheduledFieldMeta(null)
  }
  if (data?.driverRates) {
    setDriverRatesForm(normalizeDriverRates(data.driverRates))
    setDriverRatesFieldMeta(extractDriverRatesFieldMeta(data.driverRates))
  } else {
    setDriverRatesForm(EMPTY_DRIVER_RATES)
    setDriverRatesFieldMeta(null)
  }
}

/**
 * @param {{
 *   vendorId: string,
 *   locationId: string | null,
 *   storeTypeName?: string,
 *   disabled?: boolean,
 * }} props
 */
export default function AdminBranchDeliverySettings({
  vendorId,
  locationId,
  storeTypeName = '',
  disabled = false,
}) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [togglingMode, setTogglingMode] = useState(null)
  const [resettingPath, setResettingPath] = useState(null)
  const [error, setError] = useState(null)
  const [saveOk, setSaveOk] = useState(false)

  const [pricingModel, setPricingModel] = useState('legacy_flat')
  const [modes, setModes] = useState(emptyModesLocal)
  const [hotFoodForm, setHotFoodForm] = useState(EMPTY_HOT_FOOD_DEFAULTS)
  const [hotFoodFieldMeta, setHotFoodFieldMeta] = useState(null)
  const [scheduledForm, setScheduledForm] = useState(EMPTY_SCHEDULED_FEES)
  const [scheduledFieldMeta, setScheduledFieldMeta] = useState(null)
  const [driverRatesForm, setDriverRatesForm] = useState(EMPTY_DRIVER_RATES)
  const [driverRatesFieldMeta, setDriverRatesFieldMeta] = useState(null)
  const [dirtyHotFood, setDirtyHotFood] = useState(false)
  const [dirtyScheduled, setDirtyScheduled] = useState(false)
  const [dirtyDriverRates, setDirtyDriverRates] = useState(false)

  const canEdit = Boolean(vendorId && locationId) && !disabled
  const dirtyFields = dirtyHotFood || dirtyScheduled || dirtyDriverRates

  const applyPayload = useCallback((data) => {
    applyServerPayload(
      data,
      setPricingModel,
      setModes,
      setHotFoodForm,
      setHotFoodFieldMeta,
      setScheduledForm,
      setScheduledFieldMeta,
      setDriverRatesForm,
      setDriverRatesFieldMeta,
    )
  }, [])

  const load = useCallback(async () => {
    if (!vendorId || !locationId) return
    setLoading(true)
    setError(null)
    setSaveOk(false)
    try {
      const res = await adminService.getBranchDeliverySettings(vendorId, locationId)
      applyPayload(res?.data)
      setDirtyHotFood(false)
      setDirtyScheduled(false)
      setDirtyDriverRates(false)
    } catch (err) {
      setError(formatApiErrorMessage(err, 'Failed to load delivery settings.'))
    } finally {
      setLoading(false)
    }
  }, [vendorId, locationId, applyPayload])

  useEffect(() => {
    load()
  }, [load])

  const hotFoodEnabled = Boolean(modes.HOT_FOOD_ON_DEMAND?.enabled)
  const scheduledEnabled = Boolean(modes.SCHEDULED?.enabled)
  const hotFoodSeeded = Boolean(modes.HOT_FOOD_ON_DEMAND?.seeded)
  const scheduledSeeded = Boolean(modes.SCHEDULED?.seeded)

  const showHotFoodSeedBanner = useMemo(() => {
    if (!hotFoodEnabled || !hotFoodSeeded || !hotFoodFieldMeta) return false
    if (dirtyHotFood) return false
    return !hasAnyHotFoodOverride(hotFoodFieldMeta)
  }, [hotFoodEnabled, hotFoodSeeded, hotFoodFieldMeta, dirtyHotFood])

  const showScheduledSeedBanner = useMemo(() => {
    if (!scheduledEnabled || !scheduledSeeded || !scheduledFieldMeta) return false
    if (dirtyScheduled) return false
    return !hasAnyScheduledOverride(scheduledFieldMeta)
  }, [scheduledEnabled, scheduledSeeded, scheduledFieldMeta, dirtyScheduled])

  const showDriverRatesSeedBanner = useMemo(() => {
    if (!driverRatesFieldMeta) return false
    if (dirtyDriverRates) return false
    return !hasAnyDriverRatesOverride(driverRatesFieldMeta)
  }, [driverRatesFieldMeta, dirtyDriverRates])

  const hotFoodSeedBannerLabel = storeTypeName
    ? `Loaded from ${storeTypeName} › Hot food delivery settings`
    : 'Loaded from store type › Hot food delivery settings'

  const scheduledSeedBannerLabel = storeTypeName
    ? `Loaded from ${storeTypeName} › Scheduled delivery settings`
    : 'Loaded from store type › Scheduled delivery settings'

  const driverRatesSeedBannerLabel = storeTypeName
    ? `Loaded from ${storeTypeName} › Driver rates`
    : 'Loaded from store type › Driver rates'

  const onHotFoodChange = (next) => {
    setHotFoodForm(next)
    setDirtyHotFood(true)
    setSaveOk(false)
  }

  const onScheduledChange = (next) => {
    setScheduledForm(next)
    setDirtyScheduled(true)
    setSaveOk(false)
  }

  const onDriverRatesChange = (next) => {
    setDriverRatesForm(next)
    setDirtyDriverRates(true)
    setSaveOk(false)
  }

  const handleModeToggle = async (modeKey, nextEnabled) => {
    if (!canEdit || togglingMode) return
    const current = modes[modeKey]
    if (!current) return

    if (nextEnabled && current.supportedByStoreType === false) {
      setError(UNSUPPORTED_MODE_MESSAGE)
      return
    }

    if (!nextEnabled && current.enabled && countEnabled(modes) <= 1) {
      setError(LAST_MODE_OFF_MESSAGE)
      return
    }

    setTogglingMode(modeKey)
    setError(null)
    setSaveOk(false)

    try {
      const res = await adminService.updateBranchDeliverySettings(vendorId, locationId, {
        modes: { [modeKey]: { enabled: nextEnabled } },
      })
      applyPayload(res?.data)
      setDirtyHotFood(false)
      setDirtyScheduled(false)
      setDirtyDriverRates(false)
    } catch (err) {
      setError(formatApiErrorMessage(err, 'Failed to update order mode.'))
    } finally {
      setTogglingMode(null)
    }
  }

  const buildSaveBody = () => {
    const body = {}
    if (dirtyHotFood && hotFoodEnabled) {
      body.hotFoodOnDemand = buildHotFoodDefaultsPayload(hotFoodForm)
    }
    if (dirtyScheduled && scheduledEnabled) {
      body.scheduled = buildScheduledFeesPayload(scheduledForm)
    }
    if (dirtyDriverRates) {
      body.driverRates = buildDriverRatesPayload(driverRatesForm)
    }
    return body
  }

  const handleSave = async () => {
    if (!canEdit || saving) return
    if (!dirtyFields) return

    const body = buildSaveBody()
    if (!body.hotFoodOnDemand && !body.scheduled && !body.driverRates) {
      setError('Enable Hot food or Scheduled before saving fee fields, or edit driver rates.')
      return
    }

    setSaving(true)
    setError(null)
    setSaveOk(false)
    try {
      const res = await adminService.updateBranchDeliverySettings(vendorId, locationId, body)
      applyPayload(res?.data)
      setDirtyHotFood(false)
      setDirtyScheduled(false)
      setDirtyDriverRates(false)
      setSaveOk(true)
    } catch (err) {
      setError(formatApiErrorMessage(err, 'Failed to save delivery settings.'))
    } finally {
      setSaving(false)
    }
  }

  const handleResetBlock = async () => {
    if (!canEdit || loading) return
    await load()
  }

  const handleResetField = async (path) => {
    if (!canEdit || resettingPath) return
    setResettingPath(path)
    setError(null)
    setSaveOk(false)
    try {
      // Persist pending sibling edits first so reset-field does not drop them
      const pending = buildSaveBody()
      if (pending.hotFoodOnDemand || pending.scheduled || pending.driverRates) {
        await adminService.updateBranchDeliverySettings(vendorId, locationId, pending)
      }
      const res = await adminService.resetBranchDeliverySettingsField(vendorId, locationId, {
        path,
      })
      applyPayload(res?.data)
      setDirtyHotFood(false)
      setDirtyScheduled(false)
      setDirtyDriverRates(false)
    } catch (err) {
      setError(formatApiErrorMessage(err, 'Failed to reset field.'))
    } finally {
      setResettingPath(null)
    }
  }

  if (!locationId) {
    return (
      <div className="rounded-[12px] border border-[#eceeec] bg-[#fafbfa] px-4 py-4">
        <h3 className="text-[15px] font-bold text-[#17231c]">Delivery Settings</h3>
        <p className="mt-1 text-[12px] leading-[16px] text-[#7c8780]">
          Save the branch first to configure order modes and delivery fees.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-[12px] border border-[#eceeec] bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eceeec] px-4 py-3">
        <div className="min-w-0">
          <h3 className="text-[15px] font-bold text-[#17231c]">Delivery Settings</h3>
          <p className="mt-0.5 text-[11px] leading-[14px] text-[#9aa49d]">
            Branch-owned modes · {pricingModel === 'delivery_fees_v1' ? 'v1 pricing' : 'legacy until first save'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetBlock}
            disabled={!canEdit || loading || saving || Boolean(togglingMode)}
            className="inline-flex h-[32px] items-center justify-center rounded-full border border-[rgba(0,0,0,0.1)] bg-white px-4 text-[12px] font-bold text-[#5c665f] hover:bg-[#f7f8f7] disabled:opacity-60"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canEdit || loading || saving || !dirtyFields}
            className="inline-flex h-[32px] items-center justify-center rounded-full bg-[#2E9E4D] px-4 text-[12px] font-bold text-white hover:bg-[#158a47] disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      <div className="space-y-2 px-4 py-4">
        {loading ? (
          <p className="text-[12px] text-[#7c8780]">Loading delivery settings…</p>
        ) : null}

        {error ? (
          <div className="rounded-[8px] border border-[#f5c2c0] bg-[#fdecea] px-3 py-2 text-[12px] leading-[16px] text-[#b42318]">
            {error}
          </div>
        ) : null}

        {saveOk ? (
          <div className="rounded-[8px] border border-[#b7e4c7] bg-[#e8f7ed] px-3 py-2 text-[12px] leading-[16px] text-[#147940]">
            Delivery settings saved.
          </div>
        ) : null}

        {BRANCH_DELIVERY_MODE_ORDER.map((modeKey) => {
          const mode = modes[modeKey] || {}
          const supported = mode.supportedByStoreType !== false
          const enabled = Boolean(mode.enabled)
          const label = BRANCH_DELIVERY_MODE_LABELS[modeKey]
          const open = enabled && MODES_WITH_PANEL.has(modeKey)
          const busy = togglingMode === modeKey

          return (
            <div
              key={modeKey}
              className={cn(
                'overflow-hidden rounded-[10px] border border-[#eceeec]',
                !supported && 'opacity-60',
              )}
            >
              <div
                className={cn(
                  'flex items-center justify-between gap-3 px-3.5 py-3',
                  open ? 'bg-[#f7f8f7]' : 'bg-white',
                )}
              >
                <div className="min-w-0">
                  <p className="text-[13px] font-bold text-[#17231c]">
                    {label}
                    {!supported ? (
                      <span className="ml-2 inline-flex items-center rounded-[4px] bg-[#eef0ee] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.04em] text-[#5c665f]">
                        Off for this store type
                      </span>
                    ) : null}
                  </p>
                </div>
                <ModeToggle
                  checked={enabled}
                  disabled={!canEdit || loading || saving || busy || (!supported && !enabled)}
                  label={label}
                  onChange={(next) => handleModeToggle(modeKey, next)}
                />
              </div>

              {open && modeKey === 'HOT_FOOD_ON_DEMAND' ? (
                <div className="space-y-3 border-t border-[#eceeec] px-3.5 py-3.5">
                  {showHotFoodSeedBanner ? (
                    <div className="rounded-[8px] border border-[#b7e4c7] bg-[#e8f7ed] px-3 py-2 text-[12px] leading-[16px] text-[#147940]">
                      ✓ {hotFoodSeedBannerLabel}
                    </div>
                  ) : null}
                  <AdminStoreTypeHotFoodDefaults
                    value={hotFoodForm}
                    onChange={onHotFoodChange}
                    disabled={!canEdit || saving || Boolean(togglingMode)}
                    fieldMeta={hotFoodFieldMeta}
                    onResetField={handleResetField}
                    resettingPath={resettingPath}
                  />
                </div>
              ) : null}

              {open && modeKey === 'SCHEDULED' ? (
                <div className="space-y-3 border-t border-[#eceeec] px-3.5 py-3.5">
                  {showScheduledSeedBanner ? (
                    <div className="rounded-[8px] border border-[#b7e4c7] bg-[#e8f7ed] px-3 py-2 text-[12px] leading-[16px] text-[#147940]">
                      ✓ {scheduledSeedBannerLabel}
                    </div>
                  ) : null}
                  <AdminScheduledFeesPanel
                    value={scheduledForm}
                    onChange={onScheduledChange}
                    disabled={!canEdit || saving || Boolean(togglingMode)}
                    fieldMeta={scheduledFieldMeta}
                    onResetField={handleResetField}
                    resettingPath={resettingPath}
                  />
                </div>
              ) : null}
            </div>
          )
        })}

        <div className="overflow-hidden rounded-[10px] border border-[#eceeec]">
          <div className="border-b border-[#eceeec] bg-[#f7f8f7] px-3.5 py-3">
            <p className="text-[13px] font-bold text-[#17231c]">Driver rates</p>
            <p className="mt-0.5 text-[11px] leading-[14px] text-[#9aa49d]">
              What Yjeek pays for the delivery leg · on-demand distance + scheduled flat by vehicle
            </p>
          </div>
          <div className="space-y-3 px-3.5 py-3.5">
            {showDriverRatesSeedBanner ? (
              <div className="rounded-[8px] border border-[#b7e4c7] bg-[#e8f7ed] px-3 py-2 text-[12px] leading-[16px] text-[#147940]">
                ✓ {driverRatesSeedBannerLabel}
              </div>
            ) : null}
            <AdminDriverRatesPanel
              value={driverRatesForm}
              onChange={onDriverRatesChange}
              disabled={!canEdit || loading || saving || Boolean(togglingMode)}
              fieldMeta={driverRatesFieldMeta}
              onResetField={handleResetField}
              resettingPath={resettingPath}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
