import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Copy } from 'lucide-react'
import { useApiMutation } from '../../hooks/useApiMutation'
import { useVendorBranch } from '../../hooks/vendor/useVendorBranch'
import { branchService } from '../../services/vendor/branchService'
import { ApiError, getFirstFieldErrorMessage } from '../../api/errors'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const labelClass = 'mb-1.5 block text-[13px] font-medium uppercase leading-[13px] text-[#69706E]'
const inputClass =
  'box-border h-[42px] w-full rounded-[9px] border border-[#D6DBD6] bg-white px-3 text-[13px] font-medium text-[#1A1A1A] outline-none focus:border-[#1AA34D]'

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

function buildForm(branch) {
  const radiusFromLabel = String(branch.radius || '').replace(/[^\d.]/g, '')
  const etaFromLabel = String(branch.eta || '').replace(/[^\d.]/g, '')
  const minFromLabel = String(branch.minOrder || '').replace(/[^\d.]/g, '')

  return {
    name: branch.name ?? '',
    address: branch.address ?? '',
    phone: branch.phone ?? '',
    radiusKm: String(branch.radiusKm ?? (radiusFromLabel || '5')),
    etaMin: String(branch.etaMin ?? (etaFromLabel || '30')),
    minOrderValue: String(
      branch.minOrderValue ??
        branch.minOrderAmount ??
        (minFromLabel || '2.000'),
    ),
    // openingHours format is unconfirmed (null in API samples) — keep local defaults
    hours: defaultHours(),
  }
}

function getSaveErrorMessage(error) {
  if (!error) return 'Unable to save branch. Please try again.'
  if (error instanceof ApiError) {
    const fieldMessage = getFirstFieldErrorMessage(error.fieldErrors)
    if (fieldMessage) return fieldMessage
    if (error.message) return error.message
  }
  if (typeof error?.message === 'string' && error.message) return error.message
  return 'Unable to save branch. Please try again.'
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
    <div className="box-border inline-flex h-[25px] shrink-0 items-center gap-1.5 rounded-lg border-[1.1px] border-[#E0E6E0] bg-white px-2.5 py-[5px]">
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
          <span className="shrink-0 text-[12px] leading-[15px] font-normal text-[#6B756E]">
            · break ·
          </span>
          <ShiftPill from={config.shifts[1].from} to={config.shifts[1].to} />
        </div>
      ) : (
        <div className="flex h-7 w-full flex-row flex-wrap items-center gap-2 self-stretch">
          <ShiftPill
            from={config.shifts[0]?.from || '9:00 AM'}
            to={config.shifts[0]?.to || '11:00 PM'}
          />
          <span className="text-[12px] leading-[15px] font-normal text-[#6B756E]">
            single shift
          </span>
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

export default function EditBranch() {
  const { branchId } = useParams()
  const navigate = useNavigate()
  const decodedId = branchId ? decodeURIComponent(branchId) : ''
  const { data: branch, error, isLoading, refetch } = useVendorBranch(decodedId)
  const { mutate: saveBranch, isLoading: isSaving } = useApiMutation((payload) =>
    branchService.updateBranch(decodedId, payload),
  )
  const [form, setForm] = useState(null)
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    if (!branch) return
    setForm(buildForm(branch))
    setSaveError('')
  }, [branch])

  if (isLoading) {
    return <div className="px-[28px] pt-[26px] pb-10 text-[13px] text-ink-muted">Loading branch…</div>
  }

  if (error || !branch) {
    return (
      <div className="px-[28px] pt-[26px] pb-10">
        <Link
          to="/branches"
          className="mb-4 inline-flex items-center gap-1 rounded-[18px] border border-[#E0E5E0] bg-white py-1.5 pr-3.5 pl-2.5 text-[12px] font-medium text-ink-muted hover:bg-[#fafbfa]"
        >
          ‹ Branches
        </Link>
        <p className="text-[14px] text-ink-muted">
          {error?.status === 404 || !branch ? 'Branch not found.' : 'Unable to load branch.'}{' '}
          {error ? (
            <button type="button" onClick={refetch} className="underline">
              Try again
            </button>
          ) : null}
        </p>
      </div>
    )
  }

  if (!form) return null

  function updateField(field, value) {
    setForm((c) => ({ ...c, [field]: value }))
    setSaveError('')
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
                shifts: current.shifts.length
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

  function setDayMode(day, mode) {
    if (mode === 'split') {
      addBreak(day)
      return
    }
    removeBreak(day)
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

  async function handleSave() {
    if (isSaving) return
    setSaveError('')
    try {
      await saveBranch({
        name: form.name,
        address: form.address,
        phone: form.phone,
        radiusKm: form.radiusKm,
        etaMin: form.etaMin,
        minOrderValue: form.minOrderValue,
      })
      navigate('/branches')
    } catch (err) {
      setSaveError(getSaveErrorMessage(err))
    }
  }

  return (
    <div className="px-[28px] pt-[18px] pb-10">
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Link
          to="/branches"
          className="inline-flex items-center gap-1 rounded-[18px] border border-[#E0E5E0] bg-white py-1.5 pr-3.5 pl-2.5 text-[12px] font-medium text-ink-muted hover:bg-[#fafbfa]"
        >
          ‹ Branches
        </Link>

        <h1 className="min-w-0 flex-1 text-[20px] font-bold tracking-[-0.02em] text-ink sm:text-[20px]">
          Edit branch · {branch.name}
        </h1>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex h-[40px] items-center justify-center rounded-full bg-[#1AA34D] px-4 text-[13px] font-medium text-white hover:brightness-[0.96] disabled:opacity-60 disabled:pointer-events-none"
        >
          {isSaving ? 'Saving…' : 'Save changes'}
        </button>
      </div>

      {saveError ? (
        <div className="mb-4 flex items-center gap-2.5 rounded-md bg-danger-soft px-[14px] py-3 text-[13px] text-danger">
          <span>⚠️</span>
          <span>{saveError}</span>
        </div>
      ) : null}

      <div className="mb-4 grid grid-cols-1 gap-4 xl:grid-cols-[1fr_360px]">
        <section className="rounded-[14px] border border-border bg-white p-5">
          <h2 className="mb-4 text-[16px] font-bold text-ink">Branch details</h2>

          <div className="flex flex-col gap-3.5">
            <div>
              <label className={labelClass}>Branch name</label>
              <input
                className={inputClass}
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                disabled={isSaving}
              />
            </div>

            <div>
              <label className={labelClass}>Address</label>
              <input
                className={inputClass}
                value={form.address}
                onChange={(e) => updateField('address', e.target.value)}
                disabled={isSaving}
              />
            </div>

            <div>
              <label className={labelClass}>Phone</label>
              <input
                className={inputClass}
                value={form.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                disabled={isSaving}
              />
            </div>

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Delivery radius (km)</label>
                <input
                  className={inputClass}
                  value={form.radiusKm}
                  onChange={(e) => updateField('radiusKm', e.target.value)}
                  disabled={isSaving}
                />
              </div>
              <div>
                <label className={labelClass}>Eta (min)</label>
                <input
                  className={inputClass}
                  value={form.etaMin}
                  onChange={(e) => updateField('etaMin', e.target.value)}
                  disabled={isSaving}
                />
              </div>
            </div>

            <div className="max-w-[220px]">
              <label className={labelClass}>Min order (BHD)</label>
              <input
                className={inputClass}
                value={form.minOrderValue}
                onChange={(e) => updateField('minOrderValue', e.target.value)}
                disabled={isSaving}
              />
            </div>
          </div>
        </section>

        <div className="flex flex-col gap-3">
          <section className="rounded-[14px] border border-border bg-white  px-5 py-4.5">
            <h2 className="mb-3 text-[16px] font-bold text-ink">Delivery coverage</h2>
            <div className="flex items-center justify-between gap-3">
              <span className="text-[13px] text-ink-muted">Radius</span>
              <span className="text-[13px] font-bold text-ink">{form.radiusKm || '0'} km</span>
            </div>
          </section>

          <section className="rounded-[14px] border border-border bg-white px-5 py-4.5">
            <div className="flex items-end justify-between gap-3">
              <div className="min-w-0">
                <h2 className="mb-1 text-[16px] font-bold text-ink">Branch menu</h2>
                <p className="text-[12.5px] leading-relaxed text-ink-muted">
                  Tap to customize items &amp; prices for this branch
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  navigate(`/branches/${encodeURIComponent(branch.id || decodedId)}/menu`)
                }
                className="shrink-0 text-[13px] font-medium text-[#127036] hover:underline"
              >
                Manage ›
              </button>
            </div>
          </section>

          <section className="rounded-[14px] border border-[#F0C4C4] bg-[#FDECEC]  px-5 py-4.5">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h2 className="mb-0.5 text-[14px] font-bold text-[#DB2626]">Delete this branch</h2>
                <p className="text-[12px] leading-relaxed text-[#DB2626]">
                  Removes the branch and its menu. This can&apos;t be undone.
                </p>
              </div>
              <button
                type="button"
                className="inline-flex shrink-0 items-center gap-1.5 rounded-[9px] bg-[#DB2626] px-3.5 py-2 text-[12.5px] font-medium text-white hover:brightness-[0.96]"
              >
                🗑
                Delete
              </button>
            </div>
          </section>
        </div>
      </div>

      <section className="rounded-[14px] border border-border bg-white p-5">
        <h2 className="mb-2 text-[16px] font-bold text-ink">Working hours</h2>

        <button
          type="button"
          onClick={copyMondayToAll}
          className="mb-4 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-[#127036] hover:underline"
        >
          <Copy size={13} strokeWidth={2.2} />
          Copy Monday&apos;s hours to all days
        </button>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
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
    </div>
  )
}
