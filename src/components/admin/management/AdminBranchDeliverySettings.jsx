/**
 * Branch › Status & controls › Delivery Settings
 * (OG §02 / D02 Batch 4 + D06 Batch 3 + D07 Batch 3).
 *
 * Mode accordion toggles + hot-food / scheduled fee panels + driver rates.
 * Pickup / Dine-in / Services have no fee panel.
 */
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useState } from 'react'
import { formatApiErrorMessage } from '../../../api/errors'
import { adminService } from '../../../services/adminService'
import { listServiceSubTypes, findServicesStoreType } from '../../../mappers/admin/taxonomyHelpers'
import { cn } from '../cn'
import AdminStoreTypeHotFoodDefaults, {
  EMPTY_HOT_FOOD_DEFAULTS,
  buildHotFoodDefaultsPayload,
  extractHotFoodFieldMeta,
  hotFoodSeedMissingMessage,
  isHotFoodDefaultsMissingError,
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
import AdminAllowedVehiclesPanel, {
  buildAllowedVehiclesPayload,
  extractAllowedVehiclesFieldMeta,
  normalizeAllowedVehiclesForm,
  VEHICLE_NONE_UI_MESSAGE,
} from './AdminAllowedVehiclesPanel'
import {
  branchDriverRatesCaption,
  shouldShowBranchDeliveryFleet,
  shouldShowOnDemandDriverRates,
} from './branchDeliveryFleet'

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
const SERVICE_ATTACHMENT_NOTE =
  'Services lets vendors of this type also appear under a Services sub-type.'
const SERVICES_STORE_TYPE_MISSING_MESSAGE =
  'Create a Services store type before turning Services on.'
const SERVICE_SUB_TYPE_REQUIRED_MESSAGE =
  'Choose a Services sub-type before turning Services on.'

const ORDER_MODE_CODE_TO_KEY = {
  delivery: 'HOT_FOOD_ON_DEMAND',
  pickup: 'PICKUP',
  dine_in: 'DINE_IN',
  scheduled: 'SCHEDULED',
  services: 'SERVICES',
}

/** Branch delivery UI: store type supportedOrderModes (supportedOrderModes prop). */
export function isBranchOrderModeVisible(modeKey, supportedOrderModes = []) {
  const codes = new Set(
    (Array.isArray(supportedOrderModes) ? supportedOrderModes : []).map((code) =>
      String(code).trim().toLowerCase().replace(/-/g, '_'),
    ),
  )
  for (const [code, key] of Object.entries(ORDER_MODE_CODE_TO_KEY)) {
    if (key === modeKey) return codes.has(code)
  }
  return false
}

/** Scheduled driver-rate grids only when Scheduled is on and allowed for this vendor/store-type. */
export function shouldShowScheduledDriverRates(modes, supportedOrderModes = []) {
  if (!isBranchOrderModeVisible('SCHEDULED', supportedOrderModes)) return false
  const scheduled = modes?.SCHEDULED
  if (!scheduled || scheduled.supportedByStoreType === false) return false
  return Boolean(scheduled.enabled)
}

/**
 * Local order-mode rows for a branch that has not been saved yet.
 * Supported store-type modes start on. Locked keys (vendor SLA ceiling) stay off.
 */
export function previewBranchDeliveryModes(codes = [], locks = {}) {
  const normalized = new Set(
    (Array.isArray(codes) ? codes : []).map((code) =>
      String(code).trim().toLowerCase().replace(/-/g, '_'),
    ),
  )
  const supportedKeys = new Set()
  for (const [code, key] of Object.entries(ORDER_MODE_CODE_TO_KEY)) {
    if (normalized.has(code)) supportedKeys.add(key)
  }

  const base = emptyModesLocal()
  for (const key of BRANCH_DELIVERY_MODE_ORDER) {
    const supported = supportedKeys.has(key)
    const locked = Boolean(locks[key])
    base[key] = {
      ...base[key],
      supportedByStoreType: supported,
      locked,
      enabled: supported && !locked,
    }
  }

  if (countEnabled(base) === 0) {
    const fallback = BRANCH_DELIVERY_MODE_ORDER.find(
      (key) => base[key].supportedByStoreType && !base[key].locked,
    )
    if (fallback) base[fallback] = { ...base[fallback], enabled: true }
  }

  return base
}

/** Store-type-supported modes → PUT `modes` patch (explicit on/off; locked modes omitted). */
export function buildBranchDeliveryModesPayload(modes) {
  const payload = {}
  if (!modes) return payload
  for (const key of BRANCH_DELIVERY_MODE_ORDER) {
    const mode = modes[key]
    if (!mode?.supportedByStoreType || mode.locked) continue
    payload[key] = { enabled: Boolean(mode.enabled) }
  }
  return payload
}

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
  setAllowedVehiclesForm,
  setAllowedVehiclesFieldMeta,
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
  setAllowedVehiclesForm(normalizeAllowedVehiclesForm(data?.allowedVehicles))
  setAllowedVehiclesFieldMeta(extractAllowedVehiclesFieldMeta(data?.allowedVehicles))
}

/**
 * @param {{
 *   vendorId: string,
 *   locationId: string | null,
 *   storeTypeName?: string,
 *   disabled?: boolean,
 *   supportedOrderModes?: string[],
 *   previewReady?: boolean,
 *   draftModes?: object | null,
 *   onDraftModesChange?: (modes: object) => void,
 *   draftHotFood?: object | null,
 *   onDraftHotFoodChange?: (form: object) => void,
 *   draftScheduled?: object | null,
 *   onDraftScheduledChange?: (form: object) => void,
 *   draftDriverRates?: object | null,
 *   onDraftDriverRatesChange?: (form: object) => void,
 *   draftAllowedVehicles?: object | null,
 *   onDraftAllowedVehiclesChange?: (form: object) => void,
 *   draftAllowedVehiclesFieldMeta?: object | null,
 * }} props
 */
function AdminBranchDeliverySettings(
  {
  vendorId,
  locationId,
  storeTypeName = '',
  storeTypeSlug = '',
  serviceSubTypeId = '',
  onServiceSubTypeIdChange,
  disabled = false,
  supportedOrderModes = [],
  previewReady = false,
  draftModes = null,
  onDraftModesChange,
  draftHotFood = null,
  onDraftHotFoodChange,
  draftScheduled = null,
  onDraftScheduledChange,
  draftDriverRates = null,
  onDraftDriverRatesChange,
  draftAllowedVehicles = null,
  onDraftAllowedVehiclesChange,
  draftAllowedVehiclesFieldMeta = null,
},
  ref,
) {
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
  const [allowedVehiclesForm, setAllowedVehiclesForm] = useState(() =>
    normalizeAllowedVehiclesForm(null),
  )
  const [allowedVehiclesFieldMeta, setAllowedVehiclesFieldMeta] = useState(null)
  const [vehiclesError, setVehiclesError] = useState(null)
  const [dirtyHotFood, setDirtyHotFood] = useState(false)
  const [dirtyScheduled, setDirtyScheduled] = useState(false)
  const [dirtyDriverRates, setDirtyDriverRates] = useState(false)
  const [dirtyAllowedVehicles, setDirtyAllowedVehicles] = useState(false)
  const [hotFoodEnableDraft, setHotFoodEnableDraft] = useState(false)
  const [serviceSubTypes, setServiceSubTypes] = useState([])
  const [servicesStoreTypeExists, setServicesStoreTypeExists] = useState(false)
  const [selectedServiceSubTypeId, setSelectedServiceSubTypeId] = useState(
    () => String(serviceSubTypeId || ''),
  )
  const [serviceArm, setServiceArm] = useState(false)
  const [savedServiceSubTypeId, setSavedServiceSubTypeId] = useState(
    () => String(serviceSubTypeId || ''),
  )

  const isServicesPrimary = String(storeTypeSlug || '').trim().toLowerCase() === 'services'

  useEffect(() => {
    setSelectedServiceSubTypeId(String(serviceSubTypeId || ''))
  }, [serviceSubTypeId])

  useEffect(() => {
    let cancelled = false
    adminService
      .listStoreTypes()
      .then((result) => {
        if (cancelled) return
        const rows = Array.isArray(result?.data?.storeTypes) ? result.data.storeTypes : []
        setServicesStoreTypeExists(Boolean(findServicesStoreType(rows)))
        setServiceSubTypes(listServiceSubTypes(rows))
      })
      .catch(() => {
        if (cancelled) return
        setServicesStoreTypeExists(false)
        setServiceSubTypes([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  const canEdit = Boolean(vendorId && locationId) && !disabled
  const dirtyFields =
    dirtyHotFood || dirtyScheduled || dirtyDriverRates || dirtyAllowedVehicles

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
      setAllowedVehiclesForm,
      setAllowedVehiclesFieldMeta,
    )
    if (data && Object.prototype.hasOwnProperty.call(data, 'serviceSubTypeId')) {
      const id = String(data.serviceSubTypeId || '')
      setSelectedServiceSubTypeId(id)
      setSavedServiceSubTypeId(id)
      onServiceSubTypeIdChange?.(id)
    }
  }, [onServiceSubTypeIdChange])

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
      setDirtyAllowedVehicles(false)
      setVehiclesError(null)
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
  const showScheduledDriverRates = shouldShowScheduledDriverRates(modes, supportedOrderModes)
  const showOnDemandDriverRates = shouldShowOnDemandDriverRates(modes)
  const showDeliveryFleet = shouldShowBranchDeliveryFleet(modes)
  const showDriverRatesCard = showOnDemandDriverRates || showScheduledDriverRates
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

  const hotFoodSeedBannerLabel =
    'Seeded from this vendor’s Delivery zones template (or store type / SLA defaults). Edit to override for this branch.'

  const scheduledSeedBannerLabel =
    'Seeded from vendor Delivery zones or store type defaults. Edit to override for this branch.'

  const driverRatesSeedBannerLabel =
    'Seeded from vendor Delivery zones or store type defaults. Edit to override for this branch.'

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

  const persistAllowedVehicles = async (next) => {
    if (!canEdit || saving || togglingMode) return false
    setSaving(true)
    setError(null)
    setSaveOk(false)
    try {
      const res = await adminService.updateBranchDeliverySettings(vendorId, locationId, {
        allowedVehicles: buildAllowedVehiclesPayload(next),
      })
      applyPayload(res?.data)
      setDirtyAllowedVehicles(false)
      setVehiclesError(null)
      setSaveOk(true)
      return true
    } catch (err) {
      setError(formatApiErrorMessage(err, 'Failed to save allowed vehicles.'))
      return false
    } finally {
      setSaving(false)
    }
  }

  const onAllowedVehiclesChange = async (next) => {
    if (!next.bike && !next.car) {
      setVehiclesError(VEHICLE_NONE_UI_MESSAGE)
      return
    }
    setVehiclesError(null)
    setAllowedVehiclesForm(next)
    setSaveOk(false)

    if (canEdit) {
      const ok = await persistAllowedVehicles(next)
      if (!ok) {
        setDirtyAllowedVehicles(true)
      }
      return
    }

    setDirtyAllowedVehicles(true)
  }

  const enableHotFoodWithFees = async () => {
    const feeError = hotFoodSeedMissingMessage(hotFoodForm)
    if (feeError) {
      setError(feeError)
      return false
    }
    setTogglingMode('HOT_FOOD_ON_DEMAND')
    setError(null)
    setSaveOk(false)
    try {
      const res = await adminService.updateBranchDeliverySettings(vendorId, locationId, {
        modes: { HOT_FOOD_ON_DEMAND: { enabled: true } },
        hotFoodOnDemand: buildHotFoodDefaultsPayload(hotFoodForm),
      })
      applyPayload(res?.data)
      setHotFoodEnableDraft(false)
      setDirtyHotFood(false)
      setDirtyScheduled(false)
      setDirtyDriverRates(false)
      setDirtyAllowedVehicles(false)
      setSaveOk(true)
      return true
    } catch (err) {
      setError(formatApiErrorMessage(err, 'Failed to enable hot food.'))
      return false
    } finally {
      setTogglingMode(null)
    }
  }

  const serviceEnableBlock = (nextEnabled) => {
    if (!nextEnabled) return null
    if (!servicesStoreTypeExists) return SERVICES_STORE_TYPE_MISSING_MESSAGE
    return null
  }

  const chooseServiceSubType = async (id) => {
    setSelectedServiceSubTypeId(id)
    onServiceSubTypeIdChange?.(id)
    if (!id) return
    setError(null)

    if (!locationId) {
      if (!serviceArm) return
      const currentModes = draftModes || previewBranchDeliveryModes(supportedOrderModes)
      const current = currentModes.SERVICES
      if (current) {
        onDraftModesChange?.({
          ...currentModes,
          SERVICES: { ...current, enabled: true },
        })
      }
      setServiceArm(false)
      return
    }

    if (!serviceArm && !modes.SERVICES?.enabled) return
    setTogglingMode('SERVICES')
    setSaveOk(false)
    try {
      const res = await adminService.updateBranchDeliverySettings(vendorId, locationId, {
        modes: { SERVICES: { enabled: true } },
        serviceSubTypeId: id,
      })
      applyPayload(res?.data)
      setServiceArm(false)
      setSaveOk(true)
    } catch (err) {
      setError(formatApiErrorMessage(err, 'Failed to save the service sub-type.'))
    } finally {
      setTogglingMode(null)
    }
  }

  const handleModeToggle = async (modeKey, nextEnabled) => {
    if (!canEdit || togglingMode) return
    const current = modes[modeKey]
    if (!current) return

    if (nextEnabled && current.supportedByStoreType === false) {
      setError(UNSUPPORTED_MODE_MESSAGE)
      return
    }

    if (modeKey === 'SERVICES') {
      const blocked = serviceEnableBlock(nextEnabled)
      if (blocked) {
        setError(blocked)
        return
      }
      if (!nextEnabled) setServiceArm(false)
      if (nextEnabled && !isServicesPrimary && !String(selectedServiceSubTypeId || '').trim()) {
        setServiceArm(true)
        setError(SERVICE_SUB_TYPE_REQUIRED_MESSAGE)
        return
      }
    }

    if (!nextEnabled && current.enabled && countEnabled(modes) <= 1) {
      setError(LAST_MODE_OFF_MESSAGE)
      return
    }

    if (modeKey === 'HOT_FOOD_ON_DEMAND' && !nextEnabled && hotFoodEnableDraft && !current.enabled) {
      setHotFoodEnableDraft(false)
      setError(null)
      return
    }

    if (modeKey === 'HOT_FOOD_ON_DEMAND' && nextEnabled && hotFoodEnableDraft) {
      await enableHotFoodWithFees()
      return
    }

    setTogglingMode(modeKey)
    setError(null)
    setSaveOk(false)

    try {
      const body = { modes: { [modeKey]: { enabled: nextEnabled } } }
      if (modeKey === 'SERVICES' && nextEnabled && !isServicesPrimary && selectedServiceSubTypeId) {
        body.serviceSubTypeId = selectedServiceSubTypeId
      }
      const res = await adminService.updateBranchDeliverySettings(vendorId, locationId, body)
      applyPayload(res?.data)
      setHotFoodEnableDraft(false)
      setDirtyHotFood(false)
      setDirtyScheduled(false)
      setDirtyDriverRates(false)
      setDirtyAllowedVehicles(false)
    } catch (err) {
      const message = formatApiErrorMessage(err, 'Failed to update order mode.')
      if (modeKey === 'HOT_FOOD_ON_DEMAND' && nextEnabled && isHotFoodDefaultsMissingError(message)) {
        setHotFoodEnableDraft(true)
        setError('This store type has no hot-food fees yet. Fill the fees below, then enable.')
      } else {
        setError(message)
      }
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
    if (dirtyAllowedVehicles) {
      body.allowedVehicles = buildAllowedVehiclesPayload(allowedVehiclesForm)
    }
    return body
  }

  const handleSave = useCallback(async () => {
    if (!canEdit || saving) return false
    if (!dirtyFields) return true

    if (dirtyAllowedVehicles && !allowedVehiclesForm.bike && !allowedVehiclesForm.car) {
      setVehiclesError(VEHICLE_NONE_UI_MESSAGE)
      return false
    }

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
    if (dirtyAllowedVehicles) {
      body.allowedVehicles = buildAllowedVehiclesPayload(allowedVehiclesForm)
    }
    if (
      !body.hotFoodOnDemand &&
      !body.scheduled &&
      !body.driverRates &&
      !body.allowedVehicles
    ) {
      setError(
        'Enable Hot food or Scheduled before saving fee fields, or edit driver rates / vehicles.',
      )
      return false
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
      setDirtyAllowedVehicles(false)
      setVehiclesError(null)
      setSaveOk(true)
      return true
    } catch (err) {
      setError(formatApiErrorMessage(err, 'Failed to save delivery settings.'))
      return false
    } finally {
      setSaving(false)
    }
  }, [
    allowedVehiclesForm,
    applyPayload,
    canEdit,
    dirtyAllowedVehicles,
    dirtyDriverRates,
    dirtyFields,
    dirtyHotFood,
    dirtyScheduled,
    driverRatesForm,
    hotFoodEnabled,
    hotFoodForm,
    locationId,
    scheduledEnabled,
    scheduledForm,
    saving,
    vendorId,
  ])

  const persistServiceSelection = useCallback(
    async (subtypeId) => {
      const id = String(subtypeId || '').trim()
      if (!id) {
        setError(SERVICE_SUB_TYPE_REQUIRED_MESSAGE)
        return false
      }
      setError(null)
      setSaveOk(false)
      try {
        const res = await adminService.updateBranchDeliverySettings(vendorId, locationId, {
          modes: { SERVICES: { enabled: true } },
          serviceSubTypeId: id,
        })
        applyPayload(res?.data)
        setServiceArm(false)
        setSaveOk(true)
        return true
      } catch (err) {
        setError(formatApiErrorMessage(err, 'Failed to save the service sub-type.'))
        return false
      }
    },
    [applyPayload, locationId, vendorId],
  )

  useImperativeHandle(
    ref,
    () => ({
      savePending: async () => {
        const subtypeId = String(selectedServiceSubTypeId || '').trim()
        const servicesOn = Boolean(modes.SERVICES?.enabled) || serviceArm
        const feesOk = await handleSave()
        if (feesOk === false) return false
        if (isServicesPrimary || !servicesOn) return true
        if (Boolean(modes.SERVICES?.enabled) && subtypeId && subtypeId === savedServiceSubTypeId) {
          return true
        }
        return persistServiceSelection(subtypeId)
      },
    }),
    [
      handleSave,
      isServicesPrimary,
      modes.SERVICES?.enabled,
      persistServiceSelection,
      savedServiceSubTypeId,
      selectedServiceSubTypeId,
      serviceArm,
    ],
  )

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
      if (
        pending.hotFoodOnDemand ||
        pending.scheduled ||
        pending.driverRates ||
        pending.allowedVehicles
      ) {
        await adminService.updateBranchDeliverySettings(vendorId, locationId, pending)
      }
      const res = await adminService.resetBranchDeliverySettingsField(vendorId, locationId, {
        path,
      })
      applyPayload(res?.data)
      setDirtyHotFood(false)
      setDirtyScheduled(false)
      setDirtyDriverRates(false)
      setDirtyAllowedVehicles(false)
      setVehiclesError(null)
    } catch (err) {
      setError(formatApiErrorMessage(err, 'Failed to reset field.'))
    } finally {
      setResettingPath(null)
    }
  }

  const handlePreviewModeToggle = (modeKey, nextEnabled) => {
    const currentModes = draftModes || previewBranchDeliveryModes(supportedOrderModes)
    const current = currentModes[modeKey]
    if (!current || disabled) return

    if (nextEnabled && (current.supportedByStoreType === false || current.locked)) {
      setError(current.locked ? 'Turn this mode on for the vendor before enabling it here.' : UNSUPPORTED_MODE_MESSAGE)
      return
    }

    if (modeKey === 'SERVICES') {
      const blocked = serviceEnableBlock(nextEnabled)
      if (blocked) {
        setError(blocked)
        return
      }
      if (!nextEnabled) setServiceArm(false)
      if (nextEnabled && !isServicesPrimary && !String(selectedServiceSubTypeId || '').trim()) {
        setServiceArm(true)
        setError(SERVICE_SUB_TYPE_REQUIRED_MESSAGE)
        return
      }
    }

    if (!nextEnabled && current.enabled && countEnabled(currentModes) <= 1) {
      setError(LAST_MODE_OFF_MESSAGE)
      return
    }

    setError(null)
    const next = {
      ...currentModes,
      [modeKey]: { ...current, enabled: nextEnabled },
    }
    onDraftModesChange?.(next)
  }

  const serviceAttachmentPanel = (showSelect) => {
    if (servicesStoreTypeExists && !showSelect) return null
    return (
    <div className="space-y-2 border-t border-[#eceeec] px-3.5 py-3">
      {!servicesStoreTypeExists ? (
        <p className="text-[12px] leading-[16px] text-[#b42318]">{SERVICES_STORE_TYPE_MISSING_MESSAGE}</p>
      ) : null}
      {showSelect ? (
        <label className="block text-[12px] text-[#17231c]">
          <span className="mb-1 block font-medium">Service sub-type</span>
          <select
            className="h-[36px] w-full rounded-[8px] border border-[#e1e5e2] bg-white px-2 text-[13px]"
            value={selectedServiceSubTypeId}
            disabled={disabled || Boolean(togglingMode)}
            onChange={(event) => {
              void chooseServiceSubType(event.target.value)
            }}
          >
            <option value="">Select a sub-type</option>
            {serviceSubTypes.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}
    </div>
    )
  }

  if (!locationId) {
    const previewModes = draftModes || previewBranchDeliveryModes(supportedOrderModes)
    const anySupported = BRANCH_DELIVERY_MODE_ORDER.some(
      (key) => isBranchOrderModeVisible(key, supportedOrderModes) && previewModes[key]?.supportedByStoreType,
    )

    return (
      <div className="rounded-[12px] border border-[#eceeec] bg-white">
        <div className="border-b border-[#eceeec] px-4 py-3">
          <h3 className="text-[15px] font-bold text-[#17231c]">Order modes</h3>
          <p className="mt-0.5 text-[11px] leading-[14px] text-[#9aa49d]">
            {shouldShowBranchDeliveryFleet(previewModes)
              ? 'Order modes, vehicles, and driver rates are saved when you save this branch.'
              : 'Order modes are saved when you save this branch.'}
          </p>
        </div>
        <div className="space-y-2 px-4 py-4">
          {!previewReady ? (
            <p className="text-[12px] text-[#7c8780]">Loading order modes…</p>
          ) : null}

          {previewReady && !anySupported ? (
            <p className="text-[12px] leading-[16px] text-[#7c8780]">
              {storeTypeName
                ? 'No order modes apply for this vendor (check Vendor SLA service modes and store type in Store Management).'
                : 'Select a store type to see available order modes.'}
            </p>
          ) : null}

          {error ? (
            <div className="rounded-[8px] border border-[#f5c2c0] bg-[#fdecea] px-3 py-2 text-[12px] leading-[16px] text-[#b42318]">
              {error}
            </div>
          ) : null}

          {previewReady && anySupported
            ? BRANCH_DELIVERY_MODE_ORDER.filter((modeKey) =>
                isBranchOrderModeVisible(modeKey, supportedOrderModes),
              ).map((modeKey) => {
                const mode = previewModes[modeKey] || {}
                const supported = mode.supportedByStoreType !== false
                const enabled = Boolean(mode.enabled)
                const label = BRANCH_DELIVERY_MODE_LABELS[modeKey]

                const showPreviewHotFood = modeKey === 'HOT_FOOD_ON_DEMAND' && enabled && supported
                const showPreviewScheduled = modeKey === 'SCHEDULED' && enabled && supported

                return (
                  <div
                    key={modeKey}
                    className={cn(
                      'overflow-hidden rounded-[10px] border border-[#eceeec]',
                      (!supported || mode.locked) && 'opacity-60',
                    )}
                  >
                    {modeKey === 'SERVICES' ? (
                      <p className="border-b border-[#eceeec] px-3.5 py-2.5 text-[12px] leading-[16px] text-[#5c665f]">
                        {SERVICE_ATTACHMENT_NOTE}
                      </p>
                    ) : null}
                    <div className="flex items-center justify-between gap-3 px-3.5 py-3">
                      <div className="min-w-0">
                        <p className="text-[13px] font-bold text-[#17231c]">
                          {label}
                          {!supported ? (
                            <span className="ml-2 inline-flex items-center rounded-[4px] bg-[#eef0ee] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.04em] text-[#5c665f]">
                              Off for this store type
                            </span>
                          ) : null}
                          {supported && mode.locked ? (
                            <span className="ml-2 inline-flex items-center rounded-[4px] bg-[#eef0ee] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.04em] text-[#5c665f]">
                              Off for this vendor
                            </span>
                          ) : null}
                        </p>
                      </div>
                      <ModeToggle
                        checked={enabled || (modeKey === 'SERVICES' && serviceArm)}
                        disabled={disabled || mode.locked || (!supported && !enabled)}
                        label={label}
                        onChange={(next) => handlePreviewModeToggle(modeKey, next)}
                      />
                    </div>
                    {modeKey === 'SERVICES'
                      ? serviceAttachmentPanel(
                          !isServicesPrimary &&
                            servicesStoreTypeExists &&
                            (enabled || serviceArm),
                        )
                      : null}
                    {showPreviewHotFood ? (
                      <div className="space-y-3 border-t border-[#eceeec] px-3.5 py-3.5">
                        <p className="text-[12px] leading-[16px] text-[#7c8780]">
                          Pre-filled from vendor Delivery zones (or{' '}
                          {storeTypeName ? (
                            <strong>{storeTypeName}</strong>
                          ) : (
                            'store type'
                          )}{' '}
                          / SLA defaults). Edit any field for this branch before saving.
                        </p>
                        {draftHotFood &&
                        (draftHotFood.vendor?.radiusKm ||
                          draftHotFood.vendor?.contribution) ? (
                          <div className="rounded-[8px] border border-[#b7e4c7] bg-[#e8f7ed] px-3 py-2 text-[12px] leading-[16px] text-[#147940]">
                            ✓ Defaults loaded — saved when you save this branch.
                          </div>
                        ) : null}
                        <AdminStoreTypeHotFoodDefaults
                          value={draftHotFood || EMPTY_HOT_FOOD_DEFAULTS}
                          onChange={(next) => onDraftHotFoodChange?.(next)}
                          disabled={disabled}
                        />
                      </div>
                    ) : null}
                    {showPreviewScheduled ? (
                      <div className="space-y-3 border-t border-[#eceeec] px-3.5 py-3.5">
                        <p className="text-[12px] leading-[16px] text-[#7c8780]">
                          Pre-filled from vendor Delivery zones (or{' '}
                          {storeTypeName ? (
                            <strong>{storeTypeName}</strong>
                          ) : (
                            'store type'
                          )}{' '}
                          defaults). Edit any field for this branch before saving.
                        </p>
                        <AdminScheduledFeesPanel
                          value={draftScheduled || EMPTY_SCHEDULED_FEES}
                          onChange={(next) => onDraftScheduledChange?.(next)}
                          disabled={disabled}
                        />
                      </div>
                    ) : null}
                  </div>
                )
              })
            : null}

          {previewReady && anySupported && shouldShowBranchDeliveryFleet(previewModes) ? (
            <div className="space-y-3 border-t border-[#eceeec] pt-4">
              <AdminAllowedVehiclesPanel
                value={
                  draftAllowedVehicles ??
                  normalizeAllowedVehiclesForm(
                    draftAllowedVehiclesFieldMeta
                      ? {
                          bike: { value: draftAllowedVehiclesFieldMeta.bike?.defaultValue },
                          car: { value: draftAllowedVehiclesFieldMeta.car?.defaultValue },
                        }
                      : null,
                  )
                }
                onChange={(next) => onDraftAllowedVehiclesChange?.(next)}
                disabled={disabled}
                fieldMeta={draftAllowedVehiclesFieldMeta}
              />
              {shouldShowOnDemandDriverRates(previewModes) ||
              shouldShowScheduledDriverRates(previewModes, supportedOrderModes) ? (
              <div className="overflow-hidden rounded-[10px] border border-[#eceeec]">
                <div className="border-b border-[#eceeec] bg-[#f7f8f7] px-3.5 py-3">
                  <p className="text-[13px] font-bold text-[#17231c]">Driver rates</p>
                  <p className="mt-0.5 text-[11px] leading-[14px] text-[#9aa49d]">
                    {branchDriverRatesCaption(
                      shouldShowOnDemandDriverRates(previewModes),
                      shouldShowScheduledDriverRates(previewModes, supportedOrderModes),
                    )}
                  </p>
                </div>
                <div className="space-y-3 px-3.5 py-3.5">
                  <p className="text-[12px] leading-[16px] text-[#7c8780]">
                    Pre-filled from store type / SLA defaults (or vendor template). Edit for this
                    branch before saving — overrides are kept on the branch.
                  </p>
                  <AdminDriverRatesPanel
                    value={draftDriverRates || EMPTY_DRIVER_RATES}
                    onChange={(next) => onDraftDriverRatesChange?.(next)}
                    disabled={disabled}
                    includeOnDemand={shouldShowOnDemandDriverRates(previewModes)}
                    includeScheduled={shouldShowScheduledDriverRates(
                      previewModes,
                      supportedOrderModes,
                    )}
                    allowedVehicles={draftAllowedVehicles}
                  />
                </div>
              </div>
              ) : null}
            </div>
          ) : null}
        </div>
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
          <p className="mt-1 text-[11px] leading-[14px] text-[#7c8780]">
            {showDeliveryFleet
              ? 'Order modes and allowed vehicles save when you toggle them. Use Save below for hot food / scheduled fees and driver rates.'
              : 'Order modes save when you toggle them. Vehicles and driver rates appear when Hot food or Scheduled is on.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetBlock}
            disabled={!canEdit || loading || saving || Boolean(togglingMode)}
            className="inline-flex h-[32px] items-center justify-center rounded-full border border-[rgba(0,0,0,0.1)] bg-white px-4 text-[12px] font-bold text-[#5c665f] hover:bg-[#f7f8f7] disabled:cursor-not-allowed disabled:border-[#e8ebe9] disabled:text-[#b8c0ba]"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canEdit || loading || saving || !dirtyFields}
            className={cn(
              'inline-flex h-[32px] items-center justify-center rounded-full px-4 text-[12px] font-bold transition',
              dirtyFields && canEdit && !loading && !saving
                ? 'bg-[#2E9E4D] text-white hover:bg-[#158a47]'
                : 'cursor-not-allowed border border-[#d5dbd7] bg-[#f3f5f4] text-[#6b756e]',
            )}
          >
            {saving ? 'Saving…' : 'Save fees & rates'}
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

        {BRANCH_DELIVERY_MODE_ORDER.filter((modeKey) =>
          isBranchOrderModeVisible(modeKey, supportedOrderModes),
        ).map((modeKey) => {
          const mode = modes[modeKey] || {}
          const supported = mode.supportedByStoreType !== false
          const enabled = Boolean(mode.enabled)
          const label = BRANCH_DELIVERY_MODE_LABELS[modeKey]
          const open = enabled && MODES_WITH_PANEL.has(modeKey)
          const showHotFoodDraft = modeKey === 'HOT_FOOD_ON_DEMAND' && hotFoodEnableDraft && !enabled
          const busy = togglingMode === modeKey

          return (
            <div
              key={modeKey}
              className="overflow-hidden rounded-[10px] border border-[#eceeec]"
            >
              {modeKey === 'SERVICES' ? (
                <p className="border-b border-[#eceeec] px-3.5 py-2.5 text-[12px] leading-[16px] text-[#5c665f]">
                  {SERVICE_ATTACHMENT_NOTE}
                </p>
              ) : null}
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
                  checked={enabled || showHotFoodDraft || (modeKey === 'SERVICES' && serviceArm)}
                  disabled={!canEdit || loading || saving || busy || (!supported && !enabled && !showHotFoodDraft)}
                  label={label}
                  onChange={(next) => handleModeToggle(modeKey, next)}
                />
              </div>
              {modeKey === 'SERVICES'
                ? serviceAttachmentPanel(
                    !isServicesPrimary &&
                      servicesStoreTypeExists &&
                      (enabled || serviceArm),
                  )
                : null}

              {showHotFoodDraft ? (
                <div className="space-y-3 border-t border-[#eceeec] px-3.5 py-3.5">
                  <p className="text-[12px] leading-[16px] text-[#7c8780]">
                    This store type has no hot-food defaults yet. Enter the fees here to turn this mode on for this branch.
                  </p>
                  <AdminStoreTypeHotFoodDefaults
                    value={hotFoodForm}
                    onChange={onHotFoodChange}
                    disabled={!canEdit || saving || Boolean(togglingMode)}
                  />
                  <button
                    type="button"
                    onClick={enableHotFoodWithFees}
                    disabled={!canEdit || saving || Boolean(togglingMode)}
                    className="inline-flex h-[32px] items-center justify-center rounded-full bg-[#2E9E4D] px-4 text-[12px] font-bold text-white hover:bg-[#158a47] disabled:opacity-60"
                  >
                    {togglingMode === 'HOT_FOOD_ON_DEMAND' ? 'Enabling…' : 'Enable hot food'}
                  </button>
                </div>
              ) : null}

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

        {showDeliveryFleet ? (
        <div className="overflow-hidden rounded-[10px] border border-[#eceeec]">
          <div className="space-y-3 px-3.5 py-3.5">
            <AdminAllowedVehiclesPanel
              value={allowedVehiclesForm}
              onChange={onAllowedVehiclesChange}
              disabled={!canEdit || loading || saving || Boolean(togglingMode)}
              fieldMeta={allowedVehiclesFieldMeta}
              onResetField={handleResetField}
              resettingPath={resettingPath}
              error={vehiclesError}
            />
          </div>
        </div>
        ) : null}

        {showDriverRatesCard ? (
        <div className="overflow-hidden rounded-[10px] border border-[#eceeec]">
          <div className="border-b border-[#eceeec] bg-[#f7f8f7] px-3.5 py-3">
            <p className="text-[13px] font-bold text-[#17231c]">Driver rates</p>
            <p className="mt-0.5 text-[11px] leading-[14px] text-[#9aa49d]">
              {branchDriverRatesCaption(showOnDemandDriverRates, showScheduledDriverRates)}
            </p>
          </div>
          <div className="space-y-3 px-3.5 py-3.5">
            {showDriverRatesSeedBanner ? (
              <div className="rounded-[8px] border border-[#b7e4c7] bg-[#e8f7ed] px-3 py-2 text-[12px] leading-[16px] text-[#147940]">
                ✓ {driverRatesSeedBannerLabel}
              </div>
            ) : null}
            {showScheduledDriverRates ? (
              <p className="text-[12px] leading-[16px] text-[#7c8780]">
                Customer and vendor scheduled fees are in the <strong className="font-semibold text-[#17231c]">Scheduled</strong>{' '}
                section above. Driver rates here are what Yjeek pays the champ (flat, by vehicle).
              </p>
            ) : null}
            <AdminDriverRatesPanel
              value={driverRatesForm}
              onChange={onDriverRatesChange}
              disabled={!canEdit || loading || saving || Boolean(togglingMode)}
              fieldMeta={driverRatesFieldMeta}
              onResetField={handleResetField}
              resettingPath={resettingPath}
              includeOnDemand={showOnDemandDriverRates}
              includeScheduled={showScheduledDriverRates}
              allowedVehicles={allowedVehiclesForm}
            />
          </div>
        </div>
        ) : null}
      </div>
    </div>
  )
}

export default forwardRef(AdminBranchDeliverySettings)
