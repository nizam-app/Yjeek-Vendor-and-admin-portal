import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { ChevronDown, Copy, Map, MapPin, Pause, Pencil, Trash2 } from 'lucide-react'
import AdminForceCloseModal from './AdminForceCloseModal'

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

function ShiftPill({ from, to }) {
  return (
    <div className="box-border inline-flex h-[25px] shrink-0 items-center gap-1.5 rounded-sm border-[1.1px] border-[#E0E6E0] bg-white px-3 py-[8px]">
      <span className="text-[12.5px] leading-[15px] font-medium text-[#6B756E]">🕒</span>
      <span className="whitespace-nowrap text-[12.5px] leading-[15px] font-medium text-[#1A1A1A]">
        {from} – {to}
      </span>
    </div>
  )
}

function DayCard({ day, config, onToggle, onAddBreak, onRemoveBreak, onModeChange }) {
  const isOpen = config.open
  const isSplit = config.mode === 'split' && config.shifts.length > 1

  return (
    <div
      className={`box-border flex w-full flex-col items-start gap-2 rounded-xl border px-3.5 py-3 ${
        isOpen ? 'border-[#E0E6E0] bg-white' : 'border-[#E0E6E0] bg-[#F2F4F2]'
      }`}
    >
      <div className="flex h-6 w-full flex-row items-center gap-2.5 self-stretch">
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
              onChange={(e) => onModeChange?.(e.target.value)}
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
        <div className="flex h-7 w-full flex-row flex-wrap items-center gap-2 self-stretch">
          <ShiftPill from={config.shifts[0].from} to={config.shifts[0].to} />
          <span className="shrink-0 text-[12px] leading-[15px] font-normal text-[#6B756E]">· break ·</span>
          <ShiftPill from={config.shifts[1].from} to={config.shifts[1].to} />
        </div>
      ) : (
        <div className="flex h-7 w-full flex-row flex-wrap items-center gap-2 self-stretch">
          <ShiftPill
            from={config.shifts[0]?.from || '9:00 AM'}
            to={config.shifts[0]?.to || '11:00 PM'}
          />
          <span className="text-[12px] leading-[15px] font-normal text-[#6B756E]">single shift</span>
        </div>
      )}

      <div className="flex h-[18px] w-full flex-row items-center gap-3.5 self-stretch">
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
              className="inline-flex items-center gap-1 text-[12.5px] leading-[15px] font-medium text-[#2E9E4D] hover:underline"
            >
              ✎ Edit break
            </button>
            <button
              type="button"
              onClick={onRemoveBreak}
              className="text-[12.5px] leading-[15px] font-medium text-[#C91A24] hover:underline"
            >
              × Remove break
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={onAddBreak}
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

  const radiusKm = String(branch.radius || '').replace(/[^\d.]/g, '')
  const etaMin = String(branch.eta || '').replace(/[^\d.]/g, '')
  const minOrderValue = String(branch.minOrder || '').replace(/[^\d.]/g, '')

  return {
    ...branch,
    detail: `Block ${branch.block || '—'} · radius ${radiusKm || '5'} km · ETA ${etaMin || '35'} min · min BHD ${minOrderValue || '3.000'}`,
    areaCity: branch.area || 'Manama',
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

  const isVendorDetailFlow = Boolean(vendorId)
  const isNewBranch = branchId === 'new'
  const returnPath = isVendorDetailFlow
    ? `/admin/vendors/${encodeURIComponent(vendorId)}`
    : '/admin/vendors/new'
  const returnState = isVendorDetailFlow ? { tab: 'Branches' } : { step: 2 }

  const branch = useMemo(() => {
    if (isNewBranch) {
      return { id: 'new', name: '', block: '', area: 'Manama', areaCity: 'Manama' }
    }
    if (state?.branch) return normalizeBranch(state.branch)
    return normalizeBranch(
      INITIAL_BRANCHES.find((b) => String(b.id) === String(branchId)) ?? INITIAL_BRANCHES[0],
    )
  }, [branchId, isNewBranch, state?.branch])

  const parsed = useMemo(() => parseBranchDetail(branch?.detail || ''), [branch?.detail])

  const storeName = state?.storeName || 'Green Kitchen'

  const [form, setForm] = useState({
    name: branch?.name || '',
    areaCity: branch?.areaCity || 'Manama',
    address: parsed.block
      ? `Building 2732, Road 3649, Block ${parsed.block}, Al Seef`
      : '',
    pinnedLocation: '26.2361° N, 50.5860° E · Al Seef, Manama',
    latitude: '26.236100',
    longitude: '50.586000',
    radiusKm: parsed.radiusKm || '5',
    etaMin: parsed.etaMin || '35',
    minOrderValue: parsed.minOrderValue || '3.000',
    hours: defaultHours(),
  })

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      name: branch?.name || '',
      areaCity: branch?.areaCity || prev.areaCity,
      address: parsed.block
        ? `Building 2732, Road 3649, Block ${parsed.block}, Al Seef`
        : prev.address,
      radiusKm: parsed.radiusKm || prev.radiusKm,
      etaMin: parsed.etaMin || prev.etaMin,
      minOrderValue: parsed.minOrderValue || prev.minOrderValue,
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branch?.name, branch?.areaCity, branch?.detail, parsed.block, parsed.radiusKm, parsed.etaMin, parsed.minOrderValue])

  const [branchOnline, setBranchOnline] = useState(true)
  const [allowPickup, setAllowPickup] = useState(true)
  const [allowDineIn, setAllowDineIn] = useState(true)
  const [freeDeliveryEnabled, setFreeDeliveryEnabled] = useState(true)
  const [applyVendorDeliveryToAll, setApplyVendorDeliveryToAll] = useState(false)
  const [applyCustomerDeliveryToAll, setApplyCustomerDeliveryToAll] = useState(false)
  const [forceCloseOpen, setForceCloseOpen] = useState(false)

  function updateField(field, value) {
    setForm((c) => ({ ...c, [field]: value }))
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
    setForm((c) => ({
      ...c,
      hours: {
        ...c.hours,
        [day]: {
          open: true,
          mode: 'split',
          shifts: [
            { from: '8:00 AM', to: '12:00 PM' },
            { from: '4:00 PM', to: '10:00 PM' },
          ],
        },
      },
    }))
  }

  function setDayMode(day, mode) {
    if (mode === 'split') {
      addBreak(day)
      return
    }
    removeBreak(day)
  }

  function removeBreak(day) {
    setForm((c) => ({
      ...c,
      hours: {
        ...c.hours,
        [day]: {
          open: true,
          mode: 'single',
          shifts: [{ from: '9:00 AM', to: '11:00 PM' }],
        },
      },
    }))
  }

  function copyMondayToAll() {
    setForm((c) => {
      const monday = c.hours.Monday
      const hours = { ...c.hours }
      DAYS.forEach((day) => {
        hours[day] = {
          open: monday.open,
          mode: monday.mode,
          shifts: monday.shifts.map((s) => ({ ...s })),
        }
      })
      return { ...c, hours }
    })
  }

  function handleCancel() {
    navigate(returnPath, { state: returnState })
  }

  function handleSaveBranch() {
    navigate(returnPath, { state: returnState })
  }

  function handleDelete() {
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
              {storeName} · edit name, address, delivery, hours, status
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setForceCloseOpen(true)}
            className="inline-flex h-[36px] items-center gap-2 rounded-full bg-[#fff3d6] px-4 text-[13px] font-bold text-[#9E6B0D] hover:bg-[#ffecc0]"
          >
            <Pause size={14} className="text-[#3b82f6]" fill="#3b82f6" strokeWidth={0} />
            Force close
          </button>
          <button
            type="button"
            onClick={handleSaveBranch}
            className="inline-flex h-[36px] items-center rounded-full bg-[#1aa054] px-4 text-[13px] font-medium text-white hover:bg-[#158a47]"
          >
            Save changes
          </button>
        </div>
      </div>

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
                  <option>Manama</option>
                  <option>Muharraq</option>
                  <option>Riffa</option>
                  <option>Juffair</option>
                  <option>Seef</option>
                </select>
                <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#7c8780]" />
              </div>
            </Field>

            <Field label="Address" className="col-span-2 max-[700px]:col-span-1">
              <input
                className={inputClass}
                value={form.address}
                onChange={(e) => updateField('address', e.target.value)}
              />
            </Field>

            <div className="col-span-2 max-[700px]:col-span-1">
              <button
                type="button"
                className="flex h-[160px] w-full flex-col items-center justify-center gap-2 rounded-[10px] border border-[#e4e8e4] bg-[#f3f5f3] text-[#7c8780] transition hover:border-[#1aa054] hover:bg-[#eef7f1]"
              >
                <MapPin size={18} className="text-[#e14b42]" fill="#e14b42" strokeWidth={1.5} />
                <span className="text-[12px] font-medium">Pin location on map</span>
              </button>
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
                  onChange={(e) => updateField('pinnedLocation', e.target.value)}
                />
              </div>
            </Field>

            <Field label="Latitude">
              <input
                className={inputClass}
                value={form.latitude}
                onChange={(e) => updateField('latitude', e.target.value)}
              />
            </Field>

            <Field label="Longitude">
              <input
                className={inputClass}
                value={form.longitude}
                onChange={(e) => updateField('longitude', e.target.value)}
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
                <input className={inputClass} value="5" readOnly />
              </Field>
              <Field label="Delivery ETA (min)">
                <input className={inputClass} value="35" readOnly />
              </Field>
              <Field label="Min order for delivery (BHD)">
                <input className={inputClass} value="2.000" readOnly />
              </Field>

              <Field label="Delivery contribution (BHD) / per order">
                <input className={inputClass} value="0.300" readOnly />
              </Field>

              <Field
                label="Free delivery over (BHD)"
                className="max-[560px]:col-span-1"
              >
                <div className="mb-1.5 flex items-center gap-2">
                  <span className="text-[12px] font-bold text-[#1aa054]">Enabled</span>
                  <Toggle
                    checked={freeDeliveryEnabled}
                    onChange={() => setFreeDeliveryEnabled((prev) => !prev)}
                    label="Free delivery enabled"
                  />
                </div>
                <input className={inputClass} value="8.000" readOnly />
              </Field>

              <Field label="Max distance (km)">
                <input className={inputClass} value="8" readOnly />
              </Field>

              <Field label="Extra contribution per km (BHD)">
                <input className={inputClass} value="0.100" readOnly />
              </Field>

              <Field label="Max contribution (BHD)">
                <input className={inputClass} value="0.800" readOnly />
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
                <input className={inputClass} value="5" readOnly />
              </Field>
              <Field label="Max distance (km)">
                <input className={inputClass} value="4" readOnly />
              </Field>

              <Field label="Customer contribution (BHD) / per order" className="col-span-2 max-[900px]:col-span-1">
                <input className={inputClass} value="0.300" readOnly />
              </Field>

              <Field label="Extra contribution per km (BHD)">
                <input className={inputClass} value="0.100" readOnly />
              </Field>
              <Field label="Max contribution (BHD)">
                <input className={inputClass} value="0.800" readOnly />
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

          
            <div className='mb-4'>
            <h2 className="mb-2 text-[16px] font-bold text-[#17231c]">Working hours</h2>
            <p className="text-[12px] text-[#127338] font-medium"><Copy size={13} strokeWidth={2.2} /> Copy Monday’s hours to all days</p>

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

            <div className="flex items-center gap-6">
              <p className="text-[13px] font-bold text-[#17231c]">Allow pickup</p>
              <Toggle
                checked={allowPickup}
                onChange={() => setAllowPickup((prev) => !prev)}
                label="Allow pickup"
              />
            </div>

            <div className="flex items-center gap-6">
              <p className="text-[13px] font-bold text-[#17231c]">Allow Dine-in</p>
              <Toggle
                checked={allowDineIn}
                onChange={() => setAllowDineIn((prev) => !prev)}
                label="Allow Dine-in"
              />
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between gap-4 rounded-[10px] bg-[#fff7d8] px-3.5 py-3">
            <div className="min-w-0">
              <p className="text-[13px] font-bold text-[#c4841a]">Force close this branch</p>
              <p className="mt-0.5 text-[12px] leading-[16px] text-[#c4841a]">
                Temporarily stop orders (e.g. emergency, out of stock). Customers see it as closed.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setForceCloseOpen(true)}
              className="inline-flex h-[32px] shrink-0 items-center justify-center rounded-full border border-[#c4841a] bg-white px-4 text-[12px] font-bold text-[#c4841a] hover:bg-[#fff3d6]"
            >
              Force close
            </button>
          </div>
        </section>

        {/* Coverage map */}
        <section className="rounded-[14px] border border-[#eceeec] bg-white px-5 py-5 shadow-[0_1px_2px_rgba(20,40,28,.03)]">
          <h2 className="mb-3 text-[16px] font-bold text-[#17231c]">Coverage map</h2>
          <div className="flex min-h-[180px] flex-col items-center justify-center rounded-[12px] border border-dashed border-[#dfe4e0] bg-[#fafbfa] px-6 py-10 text-center">
            <Map size={28} className="mb-2 text-[#b0b8b2]" strokeWidth={1.6} />
            <p className="text-[13px] font-medium text-[#7c8780]">Delivery radius &amp; zones map</p>
          </div>
        </section>

        {/* Bottom actions */}
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleDelete}
            className="inline-flex h-[36px] items-center gap-2 rounded-full border border-[#d64044] bg-white px-4 text-[13px] font-medium text-[#d64044] hover:bg-[#fdebec]"
          >
            <Trash2 size={15} />
            Delete branch
          </button>

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
              className="inline-flex h-[36px] items-center justify-center rounded-full bg-[#1aa054] px-4 text-[13px] font-medium text-white hover:bg-[#158a47]"
            >
              Save branch
            </button>
          </div>
        </div>
      </div>

      <AdminForceCloseModal
        open={forceCloseOpen}
        onClose={() => setForceCloseOpen(false)}
        storeName={storeName}
        branchName={form.name || 'Manama — Al Seef'}
        branches={[form.name, 'Juffair — Road 2401', 'Riffa — East'].filter(Boolean)}
        defaultScope="branch"
        onConfirm={() => setBranchOnline(false)}
      />
    </div>
  )
}

