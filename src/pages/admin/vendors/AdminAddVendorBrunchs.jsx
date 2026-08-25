import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { ChevronDown, Copy, MapPin, Pause, Pencil, Play, Trash2 } from 'lucide-react'
import AdminForceCloseModal from '../../../components/admin/AdminForceCloseModal'
import AdminDeleteBranchModal from '../../../components/admin/AdminDeleteBranchModal'
import AdminBranchLocationPicker from '../../../components/admin/AdminBranchLocationPicker'
import AdminDeliveryCoverageMap from '../../../components/admin/AdminDeliveryCoverageMap'
import { isAdminRealApiFeature } from '../../../api/config'
import { adminService } from '../../../services/adminService'
import { isPlottableLatLng } from '../../../lib/googleMaps'
import {
  map24hToUiTime,
  mapOpeningHoursToWizardHours,
  mapUiTimeTo24h,
} from '../../../mappers/admin/mapAdminVendorBranches'
import { buildAllowedModesFromStoreType } from '../../../components/admin/AdminVendorSlaConfigs'

const cn = (...parts) => parts.filter(Boolean).join(' ')

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

function defaultHours() {
  return {
    Monday: { open: true, mode: 'single', shifts: [{ from: '9:00 AM', to: '11:00 PM' }] },
    Tuesday: { open: true, mode: 'single', shifts: [{ from: '9:00 AM', to: '11:00 PM' }] },
    Wednesday: {
      open: true,
      mode: 'split',
      shifts: [
        { from: '8:00 AM', to: '12:00 PM' },
        { from: '4:00 PM', to: '10:00 PM' },
      ],
    },
    Thursday: { open: true, mode: 'single', shifts: [{ from: '9:00 AM', to: '11:00 PM' }] },
    Friday: { open: false, mode: 'single', shifts: [] },
    Saturday: { open: true, mode: 'single', shifts: [{ from: '10:00 AM', to: '12:00 AM' }] },
    Sunday: { open: true, mode: 'single', shifts: [{ from: '9:00 AM', to: '11:00 PM' }] },
  }
}

const labelClass = 'mb-1.5 block text-[12px] font-medium text-[#7c8780]'
const inputClass =
  'box-border h-[40px] w-full rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white px-3 text-[13px] text-[#17231c] outline-none transition placeholder:text-[#9aa49d] focus:border-[#1aa054]'

function Field({ label, children, className = '' }) {
  return (
    <label className={cn('block', className)}>
      <span className={labelClass}>{label}</span>
      {children}
    </label>
  )
}

function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`box-border flex h-[22px] w-[38px] shrink-0 items-center rounded-[11px] px-[3px] transition-colors ${
        checked ? 'justify-end bg-[#2E9E4D]' : 'justify-start bg-[#C7CFC7]'
      }`}
    >
      <span className="size-4 shrink-0 rounded-lg bg-white" />
    </button>
  )
}

const timeInputClass =
  'box-border h-[22px] w-[7.25rem] cursor-pointer rounded-[4px] border-0 bg-transparent px-0.5 text-[12.5px] font-medium text-[#1A1A1A] outline-none [color-scheme:light] focus:bg-[#F3FAF5]'

function openNativeTimePicker(event) {
  try {
    event.currentTarget.showPicker?.()
  } catch {
    /* unsupported or already open */
  }
}

function toMinutes(value) {
  const hhmm = mapUiTimeTo24h(value)
  if (!hhmm) return null
  const [h, m] = hhmm.split(':').map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return null
  return h * 60 + m
}

function closeMinutes(value) {
  const mins = toMinutes(value)
  if (mins === 0) return 24 * 60
  return mins
}

function isValidShiftRange(from, to) {
  const open = toMinutes(from)
  const close = closeMinutes(to)
  return open != null && close != null && open < close
}

function dayHoursError(config) {
  if (!config?.open) return null
  const shifts = Array.isArray(config.shifts) ? config.shifts : []
  if (!shifts.length) return 'Set opening hours or mark the day closed.'
  for (let i = 0; i < shifts.length; i += 1) {
    if (!isValidShiftRange(shifts[i].from, shifts[i].to)) {
      return 'Close time must be after open time (midnight close is allowed).'
    }
  }
  if (config.mode === 'split' && shifts.length > 1) {
    const morningEnd = toMinutes(shifts[0].to)
    const afternoonStart = toMinutes(shifts[1].from)
    if (morningEnd == null || afternoonStart == null || afternoonStart < morningEnd) {
      return 'Second shift must start at or after the first shift ends.'
    }
  }
  return null
}

function splitSingleShift(shift) {
  const from = shift?.from || '8:00 AM'
  const to = shift?.to || '11:00 PM'
  const close = closeMinutes(to) ?? 23 * 60
  if (close <= 12 * 60) {
    return [
      { from, to },
      { from: '4:00 PM', to: '10:00 PM' },
    ]
  }
  return [
    { from, to: '12:00 PM' },
    { from: '4:00 PM', to },
  ]
}

function ShiftTimeRange({ from, to, onChange, openLabel, closeLabel, inputRef }) {
  return (
    <div className="box-border inline-flex h-[32px] shrink-0 items-center gap-1 rounded-sm border-[1.1px] border-[#E0E6E0] bg-white px-2">
      <span className="text-[12.5px] leading-[15px] font-medium text-[#6B756E]" aria-hidden>
        🕒
      </span>
      <input
        ref={inputRef}
        type="time"
        step={300}
        className={timeInputClass}
        value={mapUiTimeTo24h(from) || '09:00'}
        onClick={openNativeTimePicker}
        onChange={(e) => onChange({ from: map24hToUiTime(e.target.value), to })}
        aria-label={openLabel}
      />
      <span className="text-[12px] text-[#6B756E]">–</span>
      <input
        type="time"
        step={300}
        className={timeInputClass}
        value={mapUiTimeTo24h(to) || '23:00'}
        onClick={openNativeTimePicker}
        onChange={(e) => onChange({ from, to: map24hToUiTime(e.target.value) })}
        aria-label={closeLabel}
      />
    </div>
  )
}

function DayCard({
  day,
  config,
  onToggle,
  onAddBreak,
  onRemoveBreak,
  onModeChange,
  onShiftChange,
  onBreakChange,
}) {
  const isOpen = config.open
  const isSplit = config.mode === 'split' && config.shifts.length > 1
  const [editingBreak, setEditingBreak] = useState(false)
  const breakInputRef = useRef(null)
  const error = dayHoursError(config)

  useEffect(() => {
    if (!isSplit) setEditingBreak(false)
  }, [isSplit])

  useEffect(() => {
    if (editingBreak) breakInputRef.current?.focus()
  }, [editingBreak])

  function startEditBreak() {
    if (!isSplit) onAddBreak?.()
    setEditingBreak(true)
  }

  return (
    <div
      className={`box-border flex w-full flex-col items-start gap-2 rounded-xl border px-3.5 py-3 ${
        isOpen ? 'border-[#E0E6E0] bg-white' : 'border-[#E0E6E0] bg-[#F2F4F2]'
      }`}
    >
      <div className="flex min-h-6 w-full flex-row items-center gap-2.5 self-stretch">
        <p
          className={`shrink-0 text-[14px] leading-[17px] font-bold ${
            isOpen ? 'text-[#1A1A1A]' : 'text-[#69706E]'
          }`}
        >
          {day}
        </p>

        <div className="min-h-0 min-w-0 flex-1" />

        {isOpen ? (
          <div className="relative shrink-0">
            <select
              className="box-border h-[25px] appearance-none rounded-sm border border-[#E0E6E0] bg-[#E3F2EB] py-[5px] pr-6 pl-2.5 text-[12.5px] leading-[15px] font-medium text-[#127036] outline-none"
              value={isSplit ? 'split' : 'single'}
              onChange={(e) => {
                const mode = e.target.value
                onModeChange?.(mode)
                setEditingBreak(mode === 'split')
              }}
              aria-label={`${day} shift type`}
            >
              <option value="single">Single shift</option>
              <option value="split">Split shift</option>
            </select>
            <span className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-[10px] leading-none text-[#127036]">
              ▾
            </span>
          </div>
        ) : null}

        <span
          className={`shrink-0 text-[12.5px] leading-[15px] font-medium ${
            isOpen ? 'text-[#2E9E4D]' : 'text-[#949C94]'
          }`}
        >
          {isOpen ? 'Open' : 'Day off'}
        </span>
        <Toggle checked={isOpen} onChange={onToggle} label={`${day} open`} />
      </div>

      {!isOpen ? (
        <p className="text-[12.5px] leading-[15px] font-medium text-[#949C94]">Closed all day</p>
      ) : isSplit ? (
        <div className="flex w-full flex-row flex-wrap items-center gap-2 self-stretch">
          <ShiftTimeRange
            from={config.shifts[0].from}
            to={config.shifts[0].to}
            onChange={(next) => onShiftChange?.(0, next)}
            openLabel={`${day} morning open`}
            closeLabel={`${day} morning close`}
          />
          <span className="shrink-0 text-[12px] leading-[15px] font-normal text-[#6B756E]">· break ·</span>
          <ShiftTimeRange
            from={config.shifts[1].from}
            to={config.shifts[1].to}
            onChange={(next) => onShiftChange?.(1, next)}
            openLabel={`${day} afternoon open`}
            closeLabel={`${day} afternoon close`}
          />
        </div>
      ) : (
        <div className="flex w-full flex-row flex-wrap items-center gap-2 self-stretch">
          <ShiftTimeRange
            from={config.shifts[0]?.from || '9:00 AM'}
            to={config.shifts[0]?.to || '11:00 PM'}
            onChange={(next) => onShiftChange?.(0, next)}
            openLabel={`${day} open`}
            closeLabel={`${day} close`}
          />
          <span className="text-[12px] leading-[15px] font-normal text-[#6B756E]">single shift</span>
        </div>
      )}

      {isOpen && isSplit && editingBreak ? (
        <div className="flex w-full flex-col gap-1.5 rounded-lg border border-[#D8EDE0] bg-[#F3FAF5] px-3 py-2.5">
          <p className="text-[12px] font-bold text-[#127036]">Break window</p>
          <ShiftTimeRange
            from={config.shifts[0].to}
            to={config.shifts[1].from}
            onChange={(next) => onBreakChange?.(next)}
            openLabel={`${day} break starts`}
            closeLabel={`${day} break ends`}
            inputRef={breakInputRef}
          />
          <p className="text-[11px] leading-[14px] text-[#6B756E]">
            Orders pause between these times. Morning close and afternoon open stay in sync.
          </p>
          <button
            type="button"
            onClick={() => setEditingBreak(false)}
            className="self-start text-[12px] font-medium text-[#127036] hover:underline"
          >
            Done
          </button>
        </div>
      ) : null}

      {error ? <p className="text-[11.5px] font-medium text-[#C91A24]">{error}</p> : null}

      <div className="flex min-h-[18px] w-full flex-row flex-wrap items-center gap-3.5 self-stretch">
        {!isOpen ? (
          <button
            type="button"
            onClick={onToggle}
            className="text-[12.5px] leading-[15px] font-medium text-[#2E9E4D] hover:underline"
          >
            + Set opening hours
          </button>
        ) : isSplit ? (
          <>
            <button
              type="button"
              onClick={startEditBreak}
              className="inline-flex items-center gap-1 text-[12.5px] leading-[15px] font-medium text-[#2E9E4D] hover:underline"
            >
              <Pencil size={12} strokeWidth={2.2} />
              Edit break
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingBreak(false)
                onRemoveBreak?.()
              }}
              className="text-[12.5px] leading-[15px] font-medium text-[#C91A24] hover:underline"
            >
              × Remove break
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => {
              onAddBreak?.()
              setEditingBreak(true)
            }}
            className="text-[12.5px] leading-[15px] font-medium text-[#2E9E4D] hover:underline"
          >
            + Add break (make split shift)
          </button>
        )}
      </div>
    </div>
  )
}

function parseBranchDetail(detail) {
  const radiusKm = detail?.match(/radius\s+([\d.]+)\s*km/i)?.[1] ?? ''
  const etaMin = detail?.match(/ETA\s+([\d.]+)\s*min/i)?.[1] ?? ''
  const minOrderValue = detail?.match(/min\s+BHD\s+([\d.]+)/i)?.[1] ?? ''
  const block = detail?.match(/Block\s+([^·]+)/i)?.[1]?.trim() ?? ''

  return {
    radiusKm,
    etaMin,
    minOrderValue,
    block,
  }
}

function normalizeBranch(branch) {
  if (!branch) return null
  if (branch.detail) return branch

  const radiusKmRaw =
    branch.radiusKm != null ? String(branch.radiusKm) : String(branch.radius || '').replace(/[^\d.]/g, '')
  const etaMinRaw =
    branch.etaMin != null ? String(branch.etaMin) : String(branch.eta || '').replace(/[^\d.]/g, '')
  const minOrderRaw =
    branch.minOrderAmount != null
      ? String(branch.minOrderAmount)
      : String(branch.minOrder || '').replace(/[^\d.]/g, '')

  return {
    ...branch,
    radiusKm: branch.radiusKm ?? (radiusKmRaw ? Number(radiusKmRaw) : null),
    etaMin: branch.etaMin ?? (etaMinRaw ? Number(etaMinRaw) : null),
    minOrderAmount: branch.minOrderAmount ?? (minOrderRaw ? Number(minOrderRaw) : null),
    detail: `Block ${branch.block || '—'} · radius ${radiusKmRaw || '—'} km · ETA ${etaMinRaw || '—'} min · min BHD ${minOrderRaw || '—'}`,
    areaCity: branch.areaCity || branch.area || 'Manama',
  }
}

const INITIAL_BRANCHES = [
  { id: 'b1', name: 'Manama — Al Seef', detail: 'Block 436 · radius 5 km · ETA 35 min · min BHD 3.000' },
  { id: 'b2', name: 'Juffair — Road 2401', detail: 'Block 240 · radius 4 km · ETA 30 min · min BHD 2.500' },
  { id: 'b3', name: 'Riffa — East', detail: 'Block 911 · radius 6 km · ETA 40 min · min BHD 3.500' },
]

export default function AdminAddVendorBrunchs() {
  const { vendorId, branchId } = useParams()
  const navigate = useNavigate()
  const { state } = useLocation()

  const isVendorDetailFlow = Boolean(vendorId) && vendorId !== 'new'
  // Route `/vendors/:vendorId/branches/new` has no :branchId param.
  // Route `/vendors/.../branches/:branchId` uses branchId === 'new' for create.
  const isNewBranch = branchId === 'new' || (isVendorDetailFlow && !branchId)
  const returnToWizard = state?.returnTo === 'wizard'
  const returnPath = returnToWizard
    ? '/admin/vendors/new'
    : isVendorDetailFlow
      ? `/admin/vendors/${encodeURIComponent(vendorId)}`
      : '/admin/vendors/new'
  const baseReturnState = returnToWizard
    ? {
        mode: state?.mode || (state?.vendorId && state.vendorId !== 'new' ? 'edit' : 'create'),
        vendorId: state?.vendorId || (isVendorDetailFlow ? vendorId : undefined),
        storeName: state?.storeName,
        step: state?.step || 2,
        wizardDraft: state?.wizardDraft || null,
      }
    : isVendorDetailFlow
      ? { tab: 'Branches' }
      : { step: 2 }
  const returnState = baseReturnState

  const storeName = state?.storeName || 'Green Kitchen'
  const useRealBranchApi = isVendorDetailFlow && isAdminRealApiFeature('vendors')
  const isLocalWizardCreate = returnToWizard && !useRealBranchApi

  const [loadedBranch, setLoadedBranch] = useState(null)
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState(null)
  const [form, setForm] = useState(() => ({
    name: '',
    areaCity: 'Seef',
    address: '',
    phone: '',
    pinnedLocation: '',
    latitude: '',
    longitude: '',
    radiusKm: '',
    etaMin: '',
    minOrderValue: '',
    deliveryContribution: '0.300',
    freeDeliveryOver: '8.000',
    maxDistanceKm: '8',
    extraContributionPerKm: '0.100',
    maxContribution: '0.800',
    // Vendor-level customer delivery radius (delivery-zones.deliveryRadiusKm)
    customerRadiusKm: '5',
    hours: defaultHours(),
  }))
  const [branchOnline, setBranchOnline] = useState(true)
  const [allowPickup, setAllowPickup] = useState(false)
  const [allowDineIn, setAllowDineIn] = useState(false)
  /** Gate F&B toggles: store-type caps ∩ vendor SLA (hidden until resolved). */
  const [modeGate, setModeGate] = useState({
    showPickup: false,
    showDineIn: false,
    ready: false,
  })
  const [freeDeliveryEnabled, setFreeDeliveryEnabled] = useState(true)
  const [applyVendorDeliveryToAll, setApplyVendorDeliveryToAll] = useState(false)
  const [applyCustomerDeliveryToAll, setApplyCustomerDeliveryToAll] = useState(false)
  const [forceCloseOpen, setForceCloseOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [copyMondayPrompt, setCopyMondayPrompt] = useState(null)
  const [allBranches, setAllBranches] = useState([])
  const [reopening, setReopening] = useState(false)
  const [actionError, setActionError] = useState(null)

  const branch = useMemo(() => {
    if (isNewBranch) {
      return { id: 'new', name: '', block: '', area: 'Manama', areaCity: 'Manama' }
    }
    if (loadedBranch) return normalizeBranch(loadedBranch)
    if (state?.branch) return normalizeBranch(state.branch)
    if (useRealBranchApi) return null
    return normalizeBranch(
      INITIAL_BRANCHES.find((b) => String(b.id) === String(branchId)) ?? INITIAL_BRANCHES[0],
    )
  }, [branchId, isNewBranch, loadedBranch, state?.branch, useRealBranchApi])

  useEffect(() => {
    if (!useRealBranchApi) {
      setLoadedBranch(null)
      setLoading(false)
      setLoadError(null)
      return undefined
    }

    let cancelled = false
    setLoading(true)
    setLoadError(null)

    const tasks = [
      adminService.getVendorDeliveryZones(vendorId),
      adminService.getVendorDetail(vendorId),
      adminService.listStoreTypes(),
      adminService.getVendorSla(vendorId).catch(() => ({ data: null })),
    ]
    if (!isNewBranch) tasks.unshift(adminService.listVendorBranches(vendorId))

    Promise.all(tasks)
      .then((results) => {
        if (cancelled) return

        let offset = 0
        if (!isNewBranch) {
          const list = results[0]?.data?.branches || []
          setAllBranches(list)
          const found = list.find((item) => String(item.id) === String(branchId))
          if (!found) {
            setLoadError('Branch not found.')
            setLoadedBranch(null)
          } else {
            setLoadedBranch(found)
          }
          offset = 1
        } else {
          setAllBranches([])
        }

        const zones = results[offset]?.data?.defaults || null
        if (zones) {
          setFreeDeliveryEnabled(Boolean(zones.freeDeliveryEnabled))
          setForm((prev) => ({
            ...prev,
            deliveryContribution: zones.deliveryContribution || prev.deliveryContribution,
            freeDeliveryOver: zones.freeDeliveryOver || prev.freeDeliveryOver,
            maxDistanceKm: zones.maxDistanceKm || prev.maxDistanceKm,
            extraContributionPerKm: zones.extraContributionPerKm || prev.extraContributionPerKm,
            maxContribution: zones.maxContribution || prev.maxContribution,
            customerRadiusKm: zones.radiusKm || prev.customerRadiusKm,
          }))
        }

        const detail = results[offset + 1]?.data || null
        const storeTypesPayload = results[offset + 2]?.data || null
        const storeTypes = Array.isArray(storeTypesPayload?.storeTypes)
          ? storeTypesPayload.storeTypes
          : Array.isArray(storeTypesPayload?.items)
            ? storeTypesPayload.items
            : []
        const sla = results[offset + 3]?.data || null
        const storeTypeId = detail?.storeTypeId ? String(detail.storeTypeId) : ''
        const storeType =
          storeTypes.find((row) => String(row.id) === storeTypeId) || null
        const allowedLabels = buildAllowedModesFromStoreType(storeType)
        const modes = sla?.serviceModes && typeof sla.serviceModes === 'object' ? sla.serviceModes : {}
        setModeGate({
          showPickup: allowedLabels.includes('Pickup') && Boolean(modes.pickup),
          showDineIn: allowedLabels.includes('Dine-in') && Boolean(modes.dineIn),
          ready: true,
        })
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err?.message || 'Failed to load branch.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [useRealBranchApi, vendorId, branchId, isNewBranch])

  // Wizard / mock: gate from draft SLA labels (no flash of Food-only toggles).
  useEffect(() => {
    if (useRealBranchApi) return
    const draft = state?.wizardDraft
    const selectedModes = Array.isArray(draft?.serviceModes) ? draft.serviceModes : []
    const showPickup = selectedModes.includes('Pickup')
    const showDineIn = selectedModes.includes('Dine-in')
    setModeGate({ showPickup, showDineIn, ready: true })
    if (isNewBranch) {
      setAllowPickup(showPickup)
      setAllowDineIn(showDineIn)
    }
  }, [useRealBranchApi, state?.wizardDraft, isNewBranch])

  useEffect(() => {
    if (isNewBranch || !branch) return
    const hydratedHours = mapOpeningHoursToWizardHours(branch.openingHours, defaultHours())
    setForm((prev) => ({
      ...prev,
      name: branch.name || '',
      areaCity: branch.areaCity || branch.area || prev.areaCity,
      address: branch.address ?? prev.address,
      phone: branch.phone ?? prev.phone,
      latitude: isPlottableLatLng(branch.latitude, branch.longitude)
        ? String(branch.latitude)
        : prev.latitude,
      longitude: isPlottableLatLng(branch.latitude, branch.longitude)
        ? String(branch.longitude)
        : prev.longitude,
      radiusKm: branch.radiusKm != null ? String(branch.radiusKm) : prev.radiusKm,
      etaMin: branch.etaMin != null ? String(branch.etaMin) : prev.etaMin,
      minOrderValue:
        branch.minOrderAmount != null ? String(branch.minOrderAmount) : prev.minOrderValue,
      pinnedLocation: isPlottableLatLng(branch.latitude, branch.longitude)
        ? `${branch.latitude}° N, ${branch.longitude}° E`
        : prev.pinnedLocation,
      hours: hydratedHours || prev.hours,
    }))
    if (branch.operationalStatus) {
      setBranchOnline(String(branch.operationalStatus).toUpperCase() !== 'CLOSED')
    } else if (branch.status) {
      setBranchOnline(!/closed|suspended/i.test(String(branch.status)))
    }
    if (typeof branch.allowsPickup === 'boolean') setAllowPickup(branch.allowsPickup)
    if (typeof branch.allowsDineIn === 'boolean') setAllowDineIn(branch.allowsDineIn)
  }, [branch, isNewBranch])

  // New branch defaults: ON only for modes the vendor currently offers.
  useEffect(() => {
    if (!isNewBranch || !modeGate.ready) return
    setAllowPickup(modeGate.showPickup)
    setAllowDineIn(modeGate.showDineIn)
  }, [isNewBranch, modeGate.ready, modeGate.showPickup, modeGate.showDineIn])

  // If vendor SLA / store type drops a mode, force branch flags off in UI state.
  useEffect(() => {
    if (!modeGate.ready) return
    if (!modeGate.showPickup) setAllowPickup(false)
    if (!modeGate.showDineIn) setAllowDineIn(false)
  }, [modeGate.ready, modeGate.showPickup, modeGate.showDineIn])

  const isBranchForceClosed = useMemo(() => {
    if (!branch || isNewBranch) return false
    const until = branch.forceClosedUntil ? new Date(branch.forceClosedUntil) : null
    if (until && !Number.isNaN(until.getTime()) && until > new Date()) return true
    return /force-?closed/i.test(String(branch.status || ''))
  }, [branch, isNewBranch])

  /** Live preview: pin + Vendor delivery details radius (km). */
  const coveragePreview = useMemo(() => {
    const lat = Number(form.latitude)
    const lng = Number(form.longitude)
    if (!isPlottableLatLng(lat, lng)) {
      return { center: null, circles: [] }
    }
    const radiusRaw = Number(form.radiusKm)
    const radiusKm = !Number.isNaN(radiusRaw) && radiusRaw > 0 ? radiusRaw : 5
    const name = String(form.name || '').trim() || 'This branch'
    return {
      center: { latitude: lat, longitude: lng },
      circles: [
        {
          name,
          latitude: lat,
          longitude: lng,
          radiusKm,
        },
      ],
    }
  }, [form.latitude, form.longitude, form.radiusKm, form.name])

  async function refreshBranchList() {
    if (!useRealBranchApi || isNewBranch) return null
    const response = await adminService.listVendorBranches(vendorId)
    const list = response?.data?.branches || []
    setAllBranches(list)
    const found = list.find((item) => String(item.id) === String(branchId))
    if (found) setLoadedBranch(found)
    return found
  }

  async function handleForceClose(form) {
    setActionError(null)
    if (!isVendorDetailFlow || isNewBranch) {
      setBranchOnline(false)
      return
    }
    const response = await adminService.forceCloseVendor(vendorId, {
      ...form,
      scope: form.scope || 'Single branch',
      branchId: form.branchId || branchId,
    })
    if (useRealBranchApi) {
      await refreshBranchList()
    } else {
      setBranchOnline(false)
      setLoadedBranch((prev) =>
        prev
          ? {
              ...prev,
              status: 'Force-closed',
              operationalStatus: 'CLOSED',
              forceClosedUntil: response?.data?.forceClosedUntil || form.to,
            }
          : prev,
      )
    }
  }

  async function handleReopenBranch() {
    if (reopening || isNewBranch || !isVendorDetailFlow) return
    setActionError(null)
    setReopening(true)
    try {
      await adminService.reopenVendor(vendorId, {
        scope: 'single_branch',
        branchId,
      })
      if (useRealBranchApi) {
        await refreshBranchList()
      } else {
        setBranchOnline(true)
        setLoadedBranch((prev) =>
          prev
            ? {
                ...prev,
                status: 'Open',
                operationalStatus: 'OPEN',
                forceClosedUntil: null,
              }
            : prev,
        )
      }
    } catch (err) {
      setActionError(err?.message || 'Failed to reopen branch.')
    } finally {
      setReopening(false)
    }
  }

  function updateField(field, value) {
    setForm((c) => ({ ...c, [field]: value }))
  }

  function handlePinChange({ latitude, longitude, address, area, city }) {
    setForm((prev) => {
      const next = {
        ...prev,
        latitude: latitude != null ? String(latitude) : prev.latitude,
        longitude: longitude != null ? String(longitude) : prev.longitude,
      }

      if (isPlottableLatLng(next.latitude, next.longitude)) {
        next.pinnedLocation = `${next.latitude}° N, ${next.longitude}° E`
      }

      // Always apply address from map pin / current location.
      if (address != null && address !== '') {
        next.address = String(address)
      }

      // Only fill area/city from map when empty (don't overwrite Seef etc.).
      if (area && !String(prev.areaCity || '').trim()) {
        next.areaCity = city && area !== city ? `${area}, ${city}` : area
      } else if (city && !String(prev.areaCity || '').trim()) {
        next.areaCity = city
      }

      return next
    })
  }

  function toggleDay(day) {
    setForm((c) => {
      const current = c.hours[day]
      const nextOpen = !current.open
      return {
        ...c,
        hours: {
          ...c.hours,
          [day]: nextOpen
            ? {
                open: true,
                mode: 'single',
                shifts:
                  current.shifts.length > 0
                    ? current.shifts
                    : [{ from: '9:00 AM', to: '11:00 PM' }],
              }
            : { open: false, mode: 'single', shifts: [] },
        },
      }
    })
  }

  function addBreak(day) {
    setForm((c) => {
      const current = c.hours[day]
      const first = current.shifts[0] || { from: '8:00 AM', to: '12:00 PM' }
      return {
        ...c,
        hours: {
          ...c.hours,
          [day]: {
            open: true,
            mode: 'split',
            shifts: current.shifts.length > 1 ? current.shifts : splitSingleShift(first),
          },
        },
      }
    })
  }

  function setDayMode(day, mode) {
    if (mode === 'split') {
      addBreak(day)
      return
    }
    removeBreak(day)
  }

  function removeBreak(day) {
    setForm((c) => {
      const current = c.hours[day]
      const first = current.shifts[0]
      const last = current.shifts[current.shifts.length - 1] || first
      return {
        ...c,
        hours: {
          ...c.hours,
          [day]: {
            open: true,
            mode: 'single',
            shifts: [
              {
                from: first?.from || '9:00 AM',
                to: last?.to || '11:00 PM',
              },
            ],
          },
        },
      }
    })
  }

  function updateShift(day, index, next) {
    setForm((c) => {
      const current = c.hours[day]
      const shifts = current.shifts.map((shift, i) => (i === index ? { ...shift, ...next } : shift))
      return {
        ...c,
        hours: {
          ...c.hours,
          [day]: { ...current, shifts },
        },
      }
    })
  }

  function updateBreak(day, { from, to }) {
    setForm((c) => {
      const current = c.hours[day]
      const shifts = current.shifts.map((shift, i) => {
        if (i === 0) return { ...shift, to: from }
        if (i === 1) return { ...shift, from: to }
        return shift
      })
      return {
        ...c,
        hours: {
          ...c.hours,
          [day]: { ...current, mode: 'split', shifts },
        },
      }
    })
  }

  function requestCopyMonday() {
    const monday = form.hours.Monday
    if (!monday?.open) {
      setCopyMondayPrompt(null)
      setSaveError('Set Monday hours first — Monday is marked Day off.')
      return
    }
    const targets = DAYS.filter((day) => day !== 'Monday' && form.hours[day]?.open)
    const skipped = DAYS.filter((day) => day !== 'Monday' && !form.hours[day]?.open)
    if (!targets.length) {
      setCopyMondayPrompt(null)
      setSaveError('No other open days to update. Day off days were left unchanged.')
      return
    }
    setSaveError(null)
    setCopyMondayPrompt({ targets, skipped })
  }

  function cancelCopyMonday() {
    setCopyMondayPrompt(null)
  }

  function confirmCopyMonday() {
    if (!copyMondayPrompt?.targets?.length) {
      setCopyMondayPrompt(null)
      return
    }
    setForm((c) => {
      const monday = c.hours.Monday
      if (!monday?.open) return c
      const hours = { ...c.hours }
      copyMondayPrompt.targets.forEach((day) => {
        if (!hours[day]?.open) return
        hours[day] = {
          open: true,
          mode: monday.mode,
          shifts: monday.shifts.map((s) => ({ ...s })),
        }
      })
      return { ...c, hours }
    })
    setCopyMondayPrompt(null)
  }

  function handleCancel() {
    navigate(returnPath, { state: returnState })
  }

  async function handleSaveBranch() {
    const hoursIssue = DAYS.map((day) => {
      const message = dayHoursError(form.hours[day])
      return message ? `${day}: ${message}` : null
    }).find(Boolean)
    if (hoursIssue) {
      setSaveError(`Working hours — ${hoursIssue}`)
      return
    }
    setSaveError(null)

    if (!useRealBranchApi) {
      if (isLocalWizardCreate || returnToWizard) {
        const radiusKm = form.radiusKm || '5'
        const etaMin = form.etaMin || '30'
        const minOrder = form.minOrderValue || '3'
        const area = form.areaCity || 'Manama'
        const savedBranch = {
          id: state?.branch?.id || `local-${Date.now()}`,
          name: form.name.trim() || 'New branch',
          area,
          city: area,
          address: form.address || '',
          phone: form.phone || state?.wizardDraft?.form?.ownerPhone || '+973 1700 0000',
          latitude: form.latitude || '26.2285',
          longitude: form.longitude || '50.535',
          deliveryRadiusKm: radiusKm,
          radiusKm,
          minOrderAmount: minOrder,
          etaMin,
          hours: form.hours,
          branchOnline,
          operationalStatus: branchOnline ? 'OPEN' : 'CLOSED',
          allowsPickup: modeGate.showPickup ? allowPickup : false,
          allowsDineIn: modeGate.showDineIn ? allowDineIn : false,
          customerRadiusKm: form.customerRadiusKm,
          deliveryContribution: form.deliveryContribution,
          maxDistanceKm: form.maxDistanceKm,
          extraContributionPerKm: form.extraContributionPerKm,
          maxContribution: form.maxContribution,
          isPrimary: Boolean(state?.branch?.isPrimary) || !(state?.wizardDraft?.branches || []).length,
          detail: `radius ${radiusKm} km · ETA ${etaMin} min · min BHD ${minOrder}`,
        }
        navigate(returnPath, {
          state: {
            ...baseReturnState,
            savedBranch,
          },
        })
        return
      }
      navigate(returnPath, { state: returnState })
      return
    }

    setSaveError(null)
    setSaving(true)
    try {
      const payload = {
        ...form,
        branchOnline,
        operationalStatus: branchOnline ? 'OPEN' : 'CLOSED',
        allowsPickup: modeGate.showPickup ? allowPickup : false,
        allowsDineIn: modeGate.showDineIn ? allowDineIn : false,
      }
      if (isNewBranch) {
        await adminService.createVendorBranch(vendorId, payload)
      } else {
        await adminService.updateVendorBranch(vendorId, branchId, payload)
      }

      // Always persist vendor-level delivery / customer fee settings.
      await adminService.updateVendorDeliveryZones(vendorId, {
        radiusKm: form.customerRadiusKm || form.radiusKm,
        etaMin: form.etaMin,
        minOrder: form.minOrderValue,
        deliveryContribution: form.deliveryContribution,
        freeDeliveryOver: form.freeDeliveryOver,
        freeDeliveryEnabled,
        maxDistanceKm: form.maxDistanceKm,
        extraContributionPerKm: form.extraContributionPerKm,
        maxContribution: form.maxContribution,
      })

      if (applyVendorDeliveryToAll || applyCustomerDeliveryToAll) {
        await adminService.applyVendorDeliveryZonesToAll(vendorId)
      }

      navigate(returnPath, { state: returnState })
    } catch (err) {
      setSaveError(err?.message || (isNewBranch ? 'Failed to create branch.' : 'Failed to update branch.'))
    } finally {
      setSaving(false)
    }
  }

  function handleDelete() {
    if (isNewBranch || loading) return
    setDeleteOpen(true)
  }

  async function handleConfirmDelete() {
    if (isNewBranch) {
      throw new Error('Cannot delete a branch that has not been created yet.')
    }
    if (!useRealBranchApi) {
      throw new Error('Real vendors API is required to delete a branch.')
    }

    await adminService.deleteVendorBranch(vendorId, branchId)
    setDeleteOpen(false)
    navigate(returnPath, { state: returnState })
  }

  function handleBack() {
    navigate(returnPath, { state: returnState })
  }

  return (
    <div className="px-5 pb-10 pt-4 max-[700px]:px-3">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 flex-wrap items-start gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex h-[32px] shrink-0 items-center gap-1 rounded-full border border-[#dfe4e0] bg-white px-3 text-[12px] font-medium text-[#455249] hover:bg-[#f6f8f6]"
          >
            ‹ Back
          </button>
          <div className="min-w-0">
            <h2 className="text-[18px] font-bold tracking-[-0.02em] text-[#17231c]">Branch setup</h2>
            <p className="mt-0.5 text-[12px] text-[#7c8780]">
              {storeName} · {isNewBranch ? 'add name, address, delivery, hours, status' : 'edit name, address, delivery, hours, status'}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {!isNewBranch ? (
            isBranchForceClosed ? (
              <button
                type="button"
                onClick={handleReopenBranch}
                disabled={reopening}
                className="inline-flex h-[36px] items-center gap-2 rounded-full bg-[#e8f7ed] px-4 text-[13px] font-bold text-[#147940] hover:bg-[#d8f0e2] disabled:opacity-60"
              >
                <Play size={14} className="text-[#1aa054]" fill="#1aa054" strokeWidth={0} />
                {reopening ? 'Reopening…' : 'Reopen branch'}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setForceCloseOpen(true)}
                className="inline-flex h-[36px] items-center gap-2 rounded-full bg-[#fff3d6] px-4 text-[13px] font-bold text-[#9E6B0D] hover:bg-[#ffecc0]"
              >
                <Pause size={14} className="text-[#3b82f6]" fill="#3b82f6" strokeWidth={0} />
                Force close
              </button>
            )
          ) : null}
          <button
            type="button"
            onClick={handleSaveBranch}
            disabled={saving}
            className="inline-flex h-[36px] items-center rounded-full bg-[#1aa054] px-4 text-[13px] font-medium text-white hover:bg-[#158a47] disabled:opacity-60"
          >
            {saving ? 'Saving…' : isNewBranch ? 'Save branch' : 'Save changes'}
          </button>
        </div>
      </div>

      {actionError ? (
        <p className="mb-3 text-[12px] font-medium text-[#d64044]">{actionError}</p>
      ) : null}

      {loadError ? (
        <p className="mb-3 text-[12px] font-medium text-[#d64044]">{loadError}</p>
      ) : null}
      {loading ? (
        <p className="mb-3 text-[13px] text-[#7c8780]">Loading branch…</p>
      ) : null}
      {saveError ? (
        <p className="mb-3 text-[12px] font-medium text-[#d64044]">{saveError}</p>
      ) : null}

      <div className="space-y-4">
        <section className="rounded-[14px] border border-[#eceeec] bg-white px-5 py-5 shadow-[0_1px_2px_rgba(20,40,28,.03)]">
          <h3 className="mb-4 text-[15px] font-bold text-[#17231c]">Branch details</h3>

          <div className="grid grid-cols-2 gap-x-4 gap-y-4 max-[700px]:grid-cols-1">
            <Field label="Branch name">
              <input
                className={inputClass}
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
              />
            </Field>

            <Field label="Area / city">
              <div className="relative">
                <select
                  className={cn(inputClass, 'appearance-none pr-9')}
                  value={form.areaCity}
                  onChange={(e) => updateField('areaCity', e.target.value)}
                >
                  {[
                    'Manama',
                    'Muharraq',
                    'Riffa',
                    'Juffair',
                    'Seef',
                    form.areaCity,
                  ]
                    .filter(Boolean)
                    .filter((item, index, all) => all.indexOf(item) === index)
                    .map((area) => (
                      <option key={area} value={area}>
                        {area}
                      </option>
                    ))}
                </select>
                <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[10px] leading-none text-[#69756d]">
                  ▾
                </span>
              </div>
            </Field>

            <Field label="Address" className="col-span-2 max-[700px]:col-span-1">
              <input
                className={inputClass}
                value={form.address}
                onChange={(e) => updateField('address', e.target.value)}
              />
            </Field>

            <Field label="Phone">
              <input
                className={inputClass}
                value={form.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                placeholder="+973 1770 0001"
              />
            </Field>

            <div className="col-span-2 max-[700px]:col-span-1">
              <AdminBranchLocationPicker
                latitude={form.latitude}
                longitude={form.longitude}
                onChange={handlePinChange}
              />
            </div>

            <Field label="Pinned location" className="col-span-2 max-[700px]:col-span-1">
              <div className="relative">
                <MapPin
                  size={14}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#e14b42]"
                  fill="#e14b42"
                  strokeWidth={1.5}
                />
                <input
                  className={cn(inputClass, 'pl-9')}
                  value={form.pinnedLocation}
                  readOnly
                  placeholder="Click the map to pin a location"
                />
              </div>
            </Field>

            <Field label="Latitude">
              <input
                className={inputClass}
                value={form.latitude}
                onChange={(e) => {
                  const latitude = e.target.value
                  setForm((prev) => ({
                    ...prev,
                    latitude,
                    pinnedLocation: isPlottableLatLng(latitude, prev.longitude)
                      ? `${latitude}° N, ${prev.longitude}° E`
                      : prev.pinnedLocation,
                  }))
                }}
              />
            </Field>

            <Field label="Longitude">
              <input
                className={inputClass}
                value={form.longitude}
                onChange={(e) => {
                  const longitude = e.target.value
                  setForm((prev) => ({
                    ...prev,
                    longitude,
                    pinnedLocation: isPlottableLatLng(prev.latitude, longitude)
                      ? `${prev.latitude}° N, ${longitude}° E`
                      : prev.pinnedLocation,
                  }))
                }}
              />
            </Field>
          </div>
        </section>

        {/* Delivery settings */}
        <section className="space-y-3">
          <div className="rounded-[14px] border border-[#eceeec] bg-white px-5 py-5 shadow-[0_1px_2px_rgba(20,40,28,.03)]">
            <h3 className="mb-4 text-[15px] font-bold text-[#17231c]">Vendor delivery details</h3>

            <div className="grid grid-cols-3 gap-x-4 gap-y-4 max-[900px]:grid-cols-2 max-[560px]:grid-cols-1">
              <Field label="Delivery radius (km)">
                <input
                  className={inputClass}
                  value={form.radiusKm}
                  onChange={(e) => updateField('radiusKm', e.target.value)}
                />
                <p className="mt-1 text-[11px] leading-[14px] text-[#9aa49d]">
                  Drives the green circle on Branch delivery radius &amp; coverage below.
                </p>
              </Field>
              <Field label="Delivery ETA (min)">
                <input
                  className={inputClass}
                  value={form.etaMin}
                  onChange={(e) => updateField('etaMin', e.target.value)}
                />
              </Field>
              <Field label="Min order for delivery (BHD)">
                <input
                  className={inputClass}
                  value={form.minOrderValue}
                  onChange={(e) => updateField('minOrderValue', e.target.value)}
                />
              </Field>

              <Field label="Delivery contribution (BHD) / per order">
                <input
                  className={inputClass}
                  value={form.deliveryContribution}
                  onChange={(e) => updateField('deliveryContribution', e.target.value)}
                />
              </Field>

              <Field
                label="Free delivery over (BHD)"
                className="max-[560px]:col-span-1"
              >
                <div className="mb-1.5 flex items-center gap-2">
                  <span className="text-[12px] font-bold text-[#1aa054]">
                    {freeDeliveryEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                  <Toggle
                    checked={freeDeliveryEnabled}
                    onChange={() => setFreeDeliveryEnabled((prev) => !prev)}
                    label="Free delivery enabled"
                  />
                </div>
                <input
                  className={inputClass}
                  value={form.freeDeliveryOver}
                  onChange={(e) => updateField('freeDeliveryOver', e.target.value)}
                />
              </Field>

              <Field label="Max distance (km)">
                <input
                  className={inputClass}
                  value={form.maxDistanceKm}
                  onChange={(e) => updateField('maxDistanceKm', e.target.value)}
                />
              </Field>

              <Field label="Extra contribution per km (BHD)">
                <input
                  className={inputClass}
                  value={form.extraContributionPerKm}
                  onChange={(e) => updateField('extraContributionPerKm', e.target.value)}
                />
              </Field>

              <Field label="Max contribution (BHD)">
                <input
                  className={inputClass}
                  value={form.maxContribution}
                  onChange={(e) => updateField('maxContribution', e.target.value)}
                />
              </Field>
            </div>

            <div className="mt-4 flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-bold text-[#17231c]">Apply these delivery settings to all branches</p>
                <p className="mt-0.5 text-[12px] leading-[16px] text-[#7c8780]">
                  Overwrites radius, ETA &amp; min order on every branch
                </p>
              </div>
              <Toggle
                checked={applyVendorDeliveryToAll}
                onChange={() => setApplyVendorDeliveryToAll((prev) => !prev)}
                label="Apply vendor delivery settings to all branches"
              />
            </div>
          </div>

          <div className="rounded-[14px] border border-[#eceeec] bg-white px-5 py-5 shadow-[0_1px_2px_rgba(20,40,28,.03)]">
            <h3 className="mb-4 text-[15px] font-bold text-[#17231c]">customer delivery details</h3>

            <div className="grid grid-cols-2 gap-x-4 gap-y-4 max-[900px]:grid-cols-1">
              <Field label="Delivery radius (km)">
                <input
                  className={inputClass}
                  value={form.customerRadiusKm}
                  onChange={(e) => updateField('customerRadiusKm', e.target.value)}
                />
              </Field>
              <Field label="Max distance (km)">
                <input
                  className={inputClass}
                  value={form.maxDistanceKm}
                  onChange={(e) => updateField('maxDistanceKm', e.target.value)}
                />
              </Field>

              <Field label="Customer contribution (BHD) / per order" className="col-span-2 max-[900px]:col-span-1">
                <input
                  className={inputClass}
                  value={form.deliveryContribution}
                  onChange={(e) => updateField('deliveryContribution', e.target.value)}
                />
              </Field>

              <Field label="Extra contribution per km (BHD)">
                <input
                  className={inputClass}
                  value={form.extraContributionPerKm}
                  onChange={(e) => updateField('extraContributionPerKm', e.target.value)}
                />
              </Field>
              <Field label="Max contribution (BHD)">
                <input
                  className={inputClass}
                  value={form.maxContribution}
                  onChange={(e) => updateField('maxContribution', e.target.value)}
                />
              </Field>
            </div>

            <div className="mt-4 flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-bold text-[#17231c]">Apply these delivery settings to all branches</p>
                <p className="mt-0.5 text-[12px] leading-[16px] text-[#7c8780]">
                  Overwrites radius, ETA &amp; min order on every branch
                </p>
              </div>
              <Toggle
                checked={applyCustomerDeliveryToAll}
                onChange={() => setApplyCustomerDeliveryToAll((prev) => !prev)}
                label="Apply customer delivery settings to all branches"
              />
            </div>
          </div>
        </section>

        {/* Working hours */}
        <section className="rounded-[14px] border border-[#eceeec] bg-white px-5 py-5 shadow-[0_1px_2px_rgba(20,40,28,.03)]">

          
            <div className="mb-4">
              <h2 className="mb-2 text-[16px] font-bold text-[#17231c]">Working hours</h2>
              <button
                type="button"
                onClick={requestCopyMonday}
                className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#127338] hover:underline"
              >
                <Copy size={13} strokeWidth={2.2} />
                Copy Monday’s hours to all days
              </button>
              {copyMondayPrompt ? (
                <div className="mt-3 rounded-[10px] border border-[#D8EDE0] bg-[#F3FAF5] px-3.5 py-3">
                  <p className="text-[12.5px] font-medium text-[#17231c]">
                    Apply Monday’s shifts
                    {form.hours.Monday?.mode === 'split' ? ' + break' : ''} to{' '}
                    <span className="font-bold">{copyMondayPrompt.targets.join(', ')}</span>?
                  </p>
                  {copyMondayPrompt.skipped.length ? (
                    <p className="mt-1 text-[11.5px] text-[#6B756E]">
                      Day off skipped: {copyMondayPrompt.skipped.join(', ')}
                    </p>
                  ) : null}
                  <div className="mt-2.5 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={confirmCopyMonday}
                      className="inline-flex h-[30px] items-center rounded-full bg-[#1aa054] px-3.5 text-[12px] font-bold text-white hover:bg-[#158a47]"
                    >
                      Apply
                    </button>
                    <button
                      type="button"
                      onClick={cancelCopyMonday}
                      className="inline-flex h-[30px] items-center rounded-full border border-[#d5dbd6] bg-white px-3.5 text-[12px] font-medium text-[#455249] hover:bg-[#f7f9f7]"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
     

          <div className="grid grid-cols-2 gap-4 max-[900px]:grid-cols-1">
            <div className="flex flex-col gap-2.5">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday'].map((day) => (
                <DayCard
                  key={day}
                  day={day}
                  config={form.hours[day]}
                  onToggle={() => toggleDay(day)}
                  onAddBreak={() => addBreak(day)}
                  onRemoveBreak={() => removeBreak(day)}
                  onModeChange={(mode) => setDayMode(day, mode)}
                  onShiftChange={(index, next) => updateShift(day, index, next)}
                  onBreakChange={(next) => updateBreak(day, next)}
                />
              ))}
            </div>

            <div className="flex flex-col gap-2.5">
              {['Friday', 'Saturday', 'Sunday'].map((day) => (
                <DayCard
                  key={day}
                  day={day}
                  config={form.hours[day]}
                  onToggle={() => toggleDay(day)}
                  onAddBreak={() => addBreak(day)}
                  onRemoveBreak={() => removeBreak(day)}
                  onModeChange={(mode) => setDayMode(day, mode)}
                  onShiftChange={(index, next) => updateShift(day, index, next)}
                  onBreakChange={(next) => updateBreak(day, next)}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Status & controls */}
        <section className="rounded-[14px] border border-[#eceeec] bg-white px-5 py-5 shadow-[0_1px_2px_rgba(20,40,28,.03)]">
          <h2 className="mb-3 text-[16px] font-bold text-[#17231c]">Status &amp; controls</h2>

          <div className="space-y-3">
            <div className="flex items-start gap-6">
              <div className="min-w-0">
                <p className="text-[13px] font-bold text-[#17231c]">Branch online</p>
                <p className="mt-0.5 text-[12px] leading-[16px] text-[#7c8780]">Visible &amp; accepting orders</p>
              </div>
              <Toggle
                checked={branchOnline}
                onChange={() => setBranchOnline((prev) => !prev)}
                label="Branch online"
              />
            </div>

            {modeGate.showPickup ? (
              <div className="flex items-center gap-6">
                <p className="text-[13px] font-bold text-[#17231c]">Allow pickup</p>
                <Toggle
                  checked={allowPickup}
                  onChange={() => setAllowPickup((prev) => !prev)}
                  label="Allow pickup"
                />
              </div>
            ) : null}

            {modeGate.showDineIn ? (
              <div className="flex items-center gap-6">
                <p className="text-[13px] font-bold text-[#17231c]">Allow Dine-in</p>
                <Toggle
                  checked={allowDineIn}
                  onChange={() => setAllowDineIn((prev) => !prev)}
                  label="Allow Dine-in"
                />
              </div>
            ) : null}
          </div>

          <div className="mt-3 flex items-center justify-between gap-4 rounded-[10px] bg-[#fff7d8] px-3.5 py-3">
            <div className="min-w-0">
              <p className="text-[13px] font-bold text-[#c4841a]">
                {isBranchForceClosed ? 'Branch is force-closed' : 'Force close this branch'}
              </p>
              <p className="mt-0.5 text-[12px] leading-[16px] text-[#c4841a]">
                {isBranchForceClosed
                  ? 'Customers see this branch as closed. Reopen when ready to accept orders again.'
                  : 'Temporarily stop orders (e.g. emergency, out of stock). Customers see it as closed.'}
              </p>
            </div>

            {isBranchForceClosed ? (
              <button
                type="button"
                onClick={handleReopenBranch}
                disabled={reopening || isNewBranch}
                className="inline-flex h-[32px] shrink-0 items-center justify-center rounded-full border border-[#1aa054] bg-white px-4 text-[12px] font-bold text-[#147940] hover:bg-[#e8f7ed] disabled:opacity-60"
              >
                {reopening ? 'Reopening…' : 'Reopen'}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setForceCloseOpen(true)}
                disabled={isNewBranch}
                className="inline-flex h-[32px] shrink-0 items-center justify-center rounded-full border border-[#c4841a] bg-white px-4 text-[12px] font-bold text-[#c4841a] hover:bg-[#fff3d6] disabled:opacity-60"
              >
                Force close
              </button>
            )}
          </div>
        </section>

        {/* Branch delivery radius & coverage — pin + Vendor delivery radius, live */}
        <section className="rounded-[14px] border border-[#eceeec] bg-white px-5 py-5 shadow-[0_1px_2px_rgba(20,40,28,.03)]">
          <h2 className="mb-1 text-[16px] font-bold text-[#17231c]">
            Branch delivery radius &amp; coverage
          </h2>
          <p className="mb-3 text-[12px] leading-[16px] text-[#7c8780]">
            Pin from pinned location · green circle from Delivery radius · updates live as you edit.
          </p>
          <AdminDeliveryCoverageMap
            coverage={coveragePreview}
            emptyLabel="Branch delivery radius & coverage"
          />
        </section>

        {/* Bottom actions */}
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          {!isNewBranch ? (
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading || saving}
              className="inline-flex h-[36px] items-center gap-2 rounded-full border border-[#d64044] bg-white px-4 text-[13px] font-medium text-[#d64044] hover:bg-[#fdebec] disabled:opacity-60"
            >
              <Trash2 size={15} />
              Delete branch
            </button>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCancel}
              className="inline-flex h-[36px] items-center justify-center rounded-full border border-[#e4e8e4] bg-white px-4 text-[13px] font-medium text-[#1aa054] hover:bg-[#f3faf5]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveBranch}
              disabled={saving}
              className="inline-flex h-[36px] items-center justify-center rounded-full bg-[#1aa054] px-4 text-[13px] font-medium text-white hover:bg-[#158a47] disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save branch'}
            </button>
          </div>
        </div>
      </div>

      <AdminDeleteBranchModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        branchName={form.name || branch?.name || ''}
        onConfirm={handleConfirmDelete}
      />

      <AdminForceCloseModal
        open={forceCloseOpen}
        onClose={() => setForceCloseOpen(false)}
        storeName={storeName}
        branchName={form.name || branch?.name || ''}
        branchId={branchId}
        branches={
          allBranches.length
            ? allBranches.map((item) => ({ id: item.id, name: item.name }))
            : branch
              ? [{ id: branch.id || branchId, name: form.name || branch.name }]
              : []
        }
        defaultScope="branch"
        onConfirm={handleForceClose}
      />
    </div>
  )
}

