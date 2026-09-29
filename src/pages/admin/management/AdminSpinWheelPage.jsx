import { useCallback, useEffect, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { formatApiErrorMessage } from '../../../api/errors'
import { useAuth } from '../../../context/AuthContext'
import { adminService } from '../../../services/adminService'
import {
  adminUploadService,
  validateAdminImageFile,
} from '../../../services/admin/uploadService'
import { MarketingViewTabs } from '../../../components/admin/MarketingViewTabs'
import { cn } from '../../../components/admin/cn'

const labelClass = 'mb-1.5 block text-[12px] font-medium leading-none text-[#7c8780]'
const inputClass =
  'box-border h-[40px] w-full rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white px-3 text-[13px] text-[#17231c] outline-none transition placeholder:text-[#9aa49d] focus:border-[#1aa054] disabled:bg-[#f5f6f5] disabled:text-[#9aa49d]'

const HEX = /^#(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/

function emptyForm() {
  return {
    entryTileImageAr: '',
    entryTileImageEn: '',
    sortOrder: '0',
    active: false,
    startsAt: '',
    endsAt: '',
    headerTextAr: '',
    headerTextEn: '',
    subHeaderAr: '',
    subHeaderEn: '',
    wheelBgType: '',
    wheelBgValue: '',
    screenBgType: '',
    screenBgValue: '',
    spinButtonText: '',
    spinButtonColor: '',
  }
}

function hasMarketingAction(user, action) {
  if (user?.backendRole === 'Super Admin' || user?.roleBadge === 'Super Admin') return true
  const actions = user?.permissions?.MARKETING
  return Array.isArray(actions) && actions.includes(action)
}

function toLocalInput(iso) {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function toIso(local) {
  const raw = String(local || '').trim()
  if (!raw) return null
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}

function pickerHex(value) {
  const raw = String(value || '').trim()
  if (/^#[0-9A-Fa-f]{6}$/.test(raw)) return raw
  if (/^#[0-9A-Fa-f]{3}$/.test(raw)) {
    const [, r, g, b] = raw
    return `#${r}${r}${g}${g}${b}${b}`
  }
  return '#1aa054'
}

const PRIZE_TYPES = [
  { value: 'CASHBACK', label: 'Cashback amount' },
  { value: 'VOUCHER', label: 'Voucher template' },
  { value: 'FREE_DELIVERY', label: 'Free delivery' },
  { value: 'NONE', label: 'Try again / no prize' },
]

function emptySegment(partial = {}) {
  return {
    id: '',
    labelAr: '',
    labelEn: '',
    image: '',
    segmentColor: '#1aa054',
    textColor: '#17231c',
    prizeType: 'NONE',
    prizeValue: '',
    voucherTemplateId: '',
    probabilityPct: '0.00',
    ...partial,
  }
}

function starterSegments() {
  return [0, 1, 2, 3].map(() => emptySegment({ probabilityPct: '25.00', labelEn: 'Try again' }))
}

function probabilityHundredths(value) {
  const raw = String(value ?? '').trim()
  const match = /^(\d{1,3})(?:\.(\d{1,2}))?$/.exec(raw)
  if (!match) return null
  const hundredths = Number(match[1]) * 100 + Number((match[2] || '').padEnd(2, '0'))
  if (hundredths > 10000) return null
  return hundredths
}

function cashbackAmountOk(value) {
  const raw = String(value ?? '').trim()
  const match = /^(\d{1,7})(?:\.(\d{1,3}))?$/.exec(raw)
  if (!match) return false
  return Number(`${Number(match[1])}.${(match[2] || '').padEnd(3, '0')}`) > 0
}

function segmentsFromWheel(row) {
  const list = Array.isArray(row?.segments) ? row.segments : []
  return list
    .slice()
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map((segment) =>
      emptySegment({
        id: segment.id || '',
        labelAr: segment.labelAr ?? '',
        labelEn: segment.labelEn ?? '',
        image: segment.image ?? '',
        segmentColor: segment.segmentColor || '#1aa054',
        textColor: segment.textColor || '#17231c',
        prizeType: segment.prizeType || 'NONE',
        prizeValue: segment.prizeValue ?? '',
        voucherTemplateId: segment.voucherTemplateId ?? '',
        probabilityPct: segment.probabilityPct ?? '0.00',
      }),
    )
}

function segmentSaveError(segments) {
  if (segments.length < 4 || segments.length > 10) return 'A wheel needs 4 to 10 segments.'
  let total = 0
  for (const row of segments) {
    const hundredths = probabilityHundredths(row.probabilityPct)
    if (hundredths == null) return 'Each probability needs at most 2 decimal places.'
    total += hundredths
    if (row.prizeType === 'CASHBACK' && !cashbackAmountOk(row.prizeValue)) {
      return 'Enter a cashback amount in BHD for each cashback segment.'
    }
    if ((row.prizeType === 'VOUCHER' || row.prizeType === 'FREE_DELIVERY') && !row.voucherTemplateId) {
      return 'Choose a voucher template for each voucher or free-delivery segment.'
    }
  }
  if (total !== 10000) return 'Segment probabilities must add up to 100%.'
  return ''
}

function probabilityTotal(segments) {
  let total = 0
  let valid = true
  for (const row of segments) {
    const hundredths = probabilityHundredths(row.probabilityPct)
    if (hundredths == null) valid = false
    else total += hundredths
  }
  return { total, valid }
}

function buildSegmentsPayload(segments) {
  return {
    segments: segments.map((row) => ({
      ...(row.id ? { id: row.id } : {}),
      labelAr: row.labelAr || null,
      labelEn: row.labelEn || null,
      image: row.image || null,
      segmentColor: row.segmentColor || null,
      textColor: row.textColor || null,
      prizeType: row.prizeType,
      prizeValue: row.prizeType === 'CASHBACK' ? row.prizeValue : null,
      voucherTemplateId:
        row.prizeType === 'VOUCHER' || row.prizeType === 'FREE_DELIVERY' ? row.voucherTemplateId || null : null,
      probabilityPct: row.probabilityPct,
    })),
  }
}

function templateChoices(templates, prizeType, selectedId) {
  const allowed =
    prizeType === 'FREE_DELIVERY'
      ? templates.filter((template) => template.type === 'FREE_DELIVERY')
      : templates.filter((template) => template.type === 'PERCENT' || template.type === 'FIXED_AMOUNT')
  if (selectedId && !allowed.some((template) => template.id === selectedId)) {
    const current = templates.find((template) => template.id === selectedId)
    if (current) return [current, ...allowed]
  }
  return allowed
}

function emptyAllowance() {
  return { mode: 'FIXED', spinCount: '', dailyPrizeBudget: '' }
}

function allowanceFromWheel(row) {
  const spinCount = row?.spinCount != null ? String(row.spinCount) : ''
  const dailyPrizeBudget = row?.dailyPrizeBudget != null ? String(row.dailyPrizeBudget) : ''
  if (row?.spinMode === 'DAILY') return { mode: 'DAILY', spinCount, dailyPrizeBudget }
  if (row?.spinMode === 'PER_ORDER') return { mode: 'PER_ORDER', spinCount: '', dailyPrizeBudget }
  if (row?.alsoPerOrder) return { mode: 'FIXED_PER_ORDER', spinCount, dailyPrizeBudget }
  return { mode: 'FIXED', spinCount, dailyPrizeBudget }
}

function allowancePayload(allowance) {
  const budgetRaw = String(allowance.dailyPrizeBudget ?? '').trim()
  const dailyPrizeBudget = budgetRaw === '' ? null : budgetRaw
  if (allowance.mode === 'PER_ORDER') {
    return { spinMode: 'PER_ORDER', alsoPerOrder: false, spinCount: null, dailyPrizeBudget }
  }
  const raw = String(allowance.spinCount ?? '').trim()
  const spinCount = raw === '' ? null : Number(raw)
  if (allowance.mode === 'DAILY') {
    return { spinMode: 'DAILY', alsoPerOrder: false, spinCount, dailyPrizeBudget }
  }
  if (allowance.mode === 'FIXED_PER_ORDER') {
    return { spinMode: 'FIXED', alsoPerOrder: true, spinCount, dailyPrizeBudget }
  }
  return { spinMode: 'FIXED', alsoPerOrder: false, spinCount, dailyPrizeBudget }
}

function allowanceError(allowance) {
  const budgetRaw = String(allowance.dailyPrizeBudget ?? '').trim()
  if (budgetRaw && !/^\d{1,7}(?:\.\d{1,3})?$/.test(budgetRaw)) {
    return 'Enter a daily prize budget in BHD, or leave it empty.'
  }
  if (allowance.mode === 'PER_ORDER') return ''
  const raw = String(allowance.spinCount ?? '').trim()
  if (!/^\d+$/.test(raw)) return 'Enter how many spins.'
  return ''
}

function formFromWheel(row) {
  return {
    entryTileImageAr: row.entryTileImageAr ?? '',
    entryTileImageEn: row.entryTileImageEn ?? '',
    sortOrder: row.sortOrder != null ? String(row.sortOrder) : '0',
    active: Boolean(row.active),
    startsAt: toLocalInput(row.startsAt),
    endsAt: toLocalInput(row.endsAt),
    headerTextAr: row.headerTextAr ?? '',
    headerTextEn: row.headerTextEn ?? '',
    subHeaderAr: row.subHeaderAr ?? '',
    subHeaderEn: row.subHeaderEn ?? '',
    wheelBgType: row.wheelBgType ?? '',
    wheelBgValue: row.wheelBgValue ?? '',
    screenBgType: row.screenBgType ?? '',
    screenBgValue: row.screenBgValue ?? '',
    spinButtonText: row.spinButtonText ?? '',
    spinButtonColor: row.spinButtonColor ?? '',
  }
}

function buildPayload(form) {
  const rawOrder = String(form.sortOrder ?? '').trim()
  const sortOrder = rawOrder === '' ? 0 : Number(rawOrder)
  return {
    entryTileImageAr: form.entryTileImageAr || null,
    entryTileImageEn: form.entryTileImageEn || null,
    sortOrder,
    active: Boolean(form.active),
    startsAt: toIso(form.startsAt),
    endsAt: toIso(form.endsAt),
    headerTextAr: form.headerTextAr || null,
    headerTextEn: form.headerTextEn || null,
    subHeaderAr: form.subHeaderAr || null,
    subHeaderEn: form.subHeaderEn || null,
    wheelBgType: form.wheelBgType || null,
    wheelBgValue: form.wheelBgType ? form.wheelBgValue || null : null,
    screenBgType: form.screenBgType || null,
    screenBgValue: form.screenBgType ? form.screenBgValue || null : null,
    spinButtonText: form.spinButtonText || null,
    spinButtonColor: form.spinButtonColor || null,
  }
}

function wheelTitle(row) {
  return row.headerTextEn || row.headerTextAr || 'Untitled wheel'
}

function Field({ label, children, className, hint }) {
  return (
    <label className={cn('block min-w-0', className)}>
      <span className={labelClass}>{label}</span>
      {children}
      {hint ? <p className="mt-1 text-[11.5px] text-[#9aa49d]">{hint}</p> : null}
    </label>
  )
}

function Select({ children, className, ...props }) {
  return (
    <div className={cn('relative', className)}>
      <select
        className={cn(
          inputClass,
          'appearance-none pr-9 [-webkit-appearance:none] [-moz-appearance:none] [&::-ms-expand]:hidden',
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        size={15}
        strokeWidth={2}
        className="pointer-events-none absolute right-3 top-1/2 z-[1] -translate-y-1/2 text-[#7c8780]"
        aria-hidden
      />
    </div>
  )
}

function ImagePicker({ label, value, disabled, busy, onUpload, onClear }) {
  return (
    <Field label={label}>
      <div className="flex flex-wrap items-center gap-3">
        {value ? (
          <img
            src={value}
            alt=""
            className="h-16 w-24 rounded-[8px] object-cover ring-1 ring-[#e4e8e4]"
          />
        ) : (
          <div className="flex h-16 w-24 items-center justify-center rounded-[8px] bg-[#f5f6f5] text-[11px] text-[#9aa49d]">
            No image
          </div>
        )}
        <div className="flex min-w-0 flex-col gap-1">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={disabled || busy}
            onChange={(event) => {
              const file = event.target.files?.[0]
              event.target.value = ''
              if (file) onUpload(file)
            }}
            className="max-w-full text-[12px] text-[#455249] file:mr-2 file:rounded-full file:border-0 file:bg-[#e8f7ed] file:px-3 file:py-1.5 file:text-[12px] file:font-bold file:text-[#1aa054]"
          />
          {value ? (
            <button
              type="button"
              disabled={disabled}
              onClick={onClear}
              className="text-left text-[12px] font-bold text-[#9b2c2c] disabled:opacity-50"
            >
              Remove
            </button>
          ) : null}
          {busy ? <span className="text-[11.5px] text-[#7c8780]">Uploading…</span> : null}
        </div>
      </div>
    </Field>
  )
}

function BackgroundFields({
  title,
  type,
  value,
  disabled,
  busy,
  onType,
  onValue,
  onUpload,
}) {
  return (
    <div className="rounded-[12px] border border-[#eceeec] p-3">
      <p className="mb-3 text-[13px] font-bold text-[#17231c]">{title}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Type">
          <Select value={type} disabled={disabled} onChange={(event) => onType(event.target.value)}>
            <option value="">None</option>
            <option value="COLOR">Color</option>
            <option value="IMAGE">Image</option>
          </Select>
        </Field>
        {type === 'COLOR' ? (
          <Field label="Color">
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={pickerHex(value)}
                disabled={disabled}
                onChange={(event) => onValue(event.target.value)}
                className="h-[40px] w-12 cursor-pointer rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white p-1 disabled:opacity-50"
              />
              <input
                className={inputClass}
                value={value}
                disabled={disabled}
                onChange={(event) => onValue(event.target.value)}
                placeholder="#1AA054"
              />
            </div>
          </Field>
        ) : null}
      </div>
      {type === 'IMAGE' ? (
        <div className="mt-3">
          <ImagePicker
            label="Image"
            value={value}
            disabled={disabled}
            busy={busy}
            onUpload={onUpload}
            onClear={() => onValue('')}
          />
        </div>
      ) : null}
    </div>
  )
}

function AllowanceEditor({ allowance, disabled, canSave, saving, needsWheel, onChange, onSave }) {
  const needsCount = allowance.mode !== 'PER_ORDER'
  const problem = allowanceError(allowance)
  return (
    <div className="rounded-[12px] border border-[#eceeec] p-3">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[13px] font-bold text-[#17231c]">Chances to spin</p>
          <p className="mt-1 max-w-[640px] text-[12px] text-[#7c8780]">
            Fixed is a lifetime total. Daily refreshes each UTC day. Per order adds one spin when an order is
            completed while the wheel is on. Fixed can be combined with per order. Daily cannot.
          </p>
        </div>
        <button
          type="button"
          onClick={onSave}
          disabled={!canSave || saving || Boolean(problem)}
          className="h-[34px] rounded-full bg-[#17231c] px-4 text-[12.5px] font-bold text-white disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save allowance'}
        </button>
      </div>
      {needsWheel ? (
        <p className="mb-3 text-[12.5px] text-[#7c8780]">Save the wheel first, then set how many spins.</p>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Mode">
          <Select
            value={allowance.mode}
            disabled={disabled}
            onChange={(event) => onChange({ ...allowance, mode: event.target.value })}
          >
            <option value="FIXED">Fixed allowance</option>
            <option value="FIXED_PER_ORDER">Fixed + per order</option>
            <option value="PER_ORDER">Per order</option>
            <option value="DAILY">Daily reset</option>
          </Select>
        </Field>
        {needsCount ? (
          <Field
            label={allowance.mode === 'DAILY' ? 'Spins per day' : 'Spins'}
            hint={
              allowance.mode === 'FIXED_PER_ORDER'
                ? 'Plus one more spin for each completed order.'
                : allowance.mode === 'DAILY'
                  ? 'Unused spins do not carry into the next UTC day.'
                  : 'Total spins for the life of this wheel.'
            }
          >
            <input
              className={inputClass}
              value={allowance.spinCount}
              disabled={disabled}
              inputMode="numeric"
              onChange={(event) => onChange({ ...allowance, spinCount: event.target.value })}
            />
          </Field>
        ) : (
          <p className="self-end text-[12.5px] text-[#7c8780]">Each completed order adds one spin. There is no flat total.</p>
        )}
        <Field
          label="Daily prize budget (BHD)"
          hint="Once today's prizes reach this, only try again can win. Empty means no cap. Free delivery is not priced."
        >
          <input
            className={inputClass}
            value={allowance.dailyPrizeBudget}
            disabled={disabled}
            inputMode="decimal"
            placeholder="No cap"
            onChange={(event) => onChange({ ...allowance, dailyPrizeBudget: event.target.value })}
          />
        </Field>
      </div>
      {problem && !needsWheel ? <p className="mt-2 text-[12.5px] text-[#9b2c2c]">{problem}</p> : null}
    </div>
  )
}

function SegmentBuilder({
  segments,
  templates,
  disabled,
  canSave,
  saving,
  uploading,
  needsWheel,
  onChange,
  onPatch,
  onUpload,
  onSave,
}) {
  const { total, valid } = probabilityTotal(segments)
  const totalLabel = valid ? (total / 100).toFixed(2) : '—'
  const totalOk = valid && total === 10000 && segments.length >= 4 && segments.length <= 10
  const hasTryAgain = segments.some((row) => row.prizeType === 'NONE')
  const problem = segments.length ? segmentSaveError(segments) : ''

  function addSegments() {
    if (segments.length === 0) {
      onChange(starterSegments())
      return
    }
    if (segments.length >= 10) return
    onChange([...segments, emptySegment()])
  }

  function removeSegment(index) {
    onChange(segments.filter((_, i) => i !== index))
  }

  return (
    <div className="rounded-[12px] border border-[#eceeec] p-3">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[13px] font-bold text-[#17231c]">Segments</p>
          <p className="mt-1 max-w-[640px] text-[12px] text-[#7c8780]">
            Probabilities must add up to 100%. Use 4 to 10 segments. When a daily prize budget is used, keep at
            least one try-again segment. That recommendation does not block this save.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'rounded-full px-2.5 py-1 text-[12px] font-bold',
              totalOk ? 'bg-[#e8f7ed] text-[#1a6b3c]' : 'bg-[#fff6f6] text-[#9b2c2c]',
            )}
          >
            Total {totalLabel}%
          </span>
          <button
            type="button"
            onClick={onSave}
            disabled={!canSave || saving || Boolean(uploading)}
            className="h-[34px] rounded-full bg-[#17231c] px-4 text-[12.5px] font-bold text-white disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save segments'}
          </button>
        </div>
      </div>

      {needsWheel ? (
        <p className="mb-3 text-[12.5px] text-[#7c8780]">Save the wheel first, then add its segments.</p>
      ) : null}

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={addSegments}
          disabled={disabled || segments.length >= 10}
          className="h-[32px] rounded-full px-3 text-[12px] font-bold text-[#1aa054] ring-1 ring-[#cfe8d7] disabled:opacity-50"
        >
          {segments.length === 0 ? 'Add 4 segments' : 'Add segment'}
        </button>
        <span className="text-[12px] text-[#7c8780]">{segments.length} of 4–10</span>
        {segments.length > 0 && !hasTryAgain ? (
          <span className="text-[12px] text-[#7a5b12]">No try-again segment yet.</span>
        ) : null}
      </div>
      {problem ? <p className="mb-3 text-[12.5px] text-[#9b2c2c]">{problem}</p> : null}

      <div className="flex flex-col gap-3">
        {segments.map((row, index) => {
          const choices = templateChoices(templates, row.prizeType, row.voucherTemplateId)
          return (
            <div key={row.id || `new-${index}`} className="rounded-[10px] border border-[#eceeec] p-3">
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-[12.5px] font-bold text-[#17231c]">Segment {index + 1}</p>
                <button
                  type="button"
                  onClick={() => removeSegment(index)}
                  disabled={disabled}
                  className="text-[12px] font-bold text-[#9b2c2c] disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Label (Arabic)">
                  <input
                    className={inputClass}
                    value={row.labelAr}
                    disabled={disabled}
                    onChange={(event) => onPatch(index, { labelAr: event.target.value })}
                  />
                </Field>
                <Field label="Label (English)">
                  <input
                    className={inputClass}
                    value={row.labelEn}
                    disabled={disabled}
                    onChange={(event) => onPatch(index, { labelEn: event.target.value })}
                  />
                </Field>
                <Field label="Segment color">
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={pickerHex(row.segmentColor)}
                      disabled={disabled}
                      onChange={(event) => onPatch(index, { segmentColor: event.target.value })}
                      className="h-[40px] w-12 cursor-pointer rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white p-1 disabled:opacity-50"
                    />
                    <input
                      className={inputClass}
                      value={row.segmentColor}
                      disabled={disabled}
                      onChange={(event) => onPatch(index, { segmentColor: event.target.value })}
                    />
                  </div>
                </Field>
                <Field label="Text color">
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={pickerHex(row.textColor)}
                      disabled={disabled}
                      onChange={(event) => onPatch(index, { textColor: event.target.value })}
                      className="h-[40px] w-12 cursor-pointer rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white p-1 disabled:opacity-50"
                    />
                    <input
                      className={inputClass}
                      value={row.textColor}
                      disabled={disabled}
                      onChange={(event) => onPatch(index, { textColor: event.target.value })}
                    />
                  </div>
                </Field>
                <Field label="Prize type">
                  <Select
                    value={row.prizeType}
                    disabled={disabled}
                    onChange={(event) =>
                      onPatch(index, { prizeType: event.target.value, prizeValue: '', voucherTemplateId: '' })
                    }
                  >
                    {PRIZE_TYPES.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Probability (%)">
                  <input
                    className={inputClass}
                    value={row.probabilityPct}
                    disabled={disabled}
                    inputMode="decimal"
                    onChange={(event) => onPatch(index, { probabilityPct: event.target.value })}
                  />
                </Field>
                {row.prizeType === 'CASHBACK' ? (
                  <Field label="Cashback amount (BHD)" hint="Up to 3 decimal places.">
                    <input
                      className={inputClass}
                      value={row.prizeValue}
                      disabled={disabled}
                      inputMode="decimal"
                      placeholder="0.300"
                      onChange={(event) => onPatch(index, { prizeValue: event.target.value })}
                    />
                  </Field>
                ) : null}
                {row.prizeType === 'VOUCHER' || row.prizeType === 'FREE_DELIVERY' ? (
                  <Field
                    label="Voucher template"
                    hint={
                      row.prizeType === 'FREE_DELIVERY'
                        ? 'Free-delivery templates only.'
                        : 'Percent or fixed-amount templates.'
                    }
                  >
                    <Select
                      value={row.voucherTemplateId}
                      disabled={disabled}
                      onChange={(event) => onPatch(index, { voucherTemplateId: event.target.value })}
                    >
                      <option value="">Choose a template</option>
                      {choices.map((template) => (
                        <option key={template.id} value={template.id}>
                          {template.name}
                        </option>
                      ))}
                    </Select>
                  </Field>
                ) : null}
              </div>
              <div className="mt-3">
                <ImagePicker
                  label="Image / icon"
                  value={row.image}
                  disabled={disabled}
                  busy={uploading === `segment:${index}`}
                  onUpload={(file) => onUpload(index, file)}
                  onClear={() => onPatch(index, { image: '' })}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/**
 * OG Admin › Marketing › Spin Wheel — entry tile, screen chrome, and segments.
 * Spin allowance is a later batch. The shell save does not write segments.
 */
export default function AdminSpinWheelPage() {
  const { user } = useAuth()
  const canCreate = hasMarketingAction(user, 'CREATE')
  const canEdit = hasMarketingAction(user, 'EDIT')
  const canDelete = hasMarketingAction(user, 'DELETE')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [segmentSaving, setSegmentSaving] = useState(false)
  const [uploading, setUploading] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [warning, setWarning] = useState('')
  const [wheels, setWheels] = useState([])
  const [templates, setTemplates] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [segments, setSegments] = useState([])
  const [allowance, setAllowance] = useState(emptyAllowance)
  const [allowanceSaving, setAllowanceSaving] = useState(false)

  const canSave = editingId ? canEdit : canCreate

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await adminService.listAdminSpinWheels()
      setWheels(Array.isArray(res?.data?.wheels) ? res.data.wheels : [])
    } catch (err) {
      setError(formatApiErrorMessage(err) || 'Could not load spin wheels.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    let cancelled = false
    adminService
      .listAdminVoucherTemplates({ limit: 100, active: 'true' })
      .then((res) => {
        if (cancelled) return
        setTemplates(Array.isArray(res?.data?.templates) ? res.data.templates : [])
      })
      .catch(() => {
        if (!cancelled) setTemplates([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  function patch(partial) {
    setForm((prev) => ({ ...prev, ...partial }))
  }

  function patchSegment(index, partial) {
    setSegments((prev) => prev.map((row, i) => (i === index ? { ...row, ...partial } : row)))
  }

  function startNew() {
    setEditingId(null)
    setForm(emptyForm())
    setSegments([])
    setAllowance(emptyAllowance())
    setError('')
    setNotice('')
    setWarning('')
  }

  function startEdit(row) {
    setEditingId(row.id)
    setForm(formFromWheel(row))
    setSegments(segmentsFromWheel(row))
    setAllowance(allowanceFromWheel(row))
    setError('')
    setNotice('')
    setWarning('')
  }

  function setBgType(which, nextType) {
    const typeKey = which === 'wheel' ? 'wheelBgType' : 'screenBgType'
    const valueKey = which === 'wheel' ? 'wheelBgValue' : 'screenBgValue'
    setForm((prev) => {
      let nextValue = ''
      if (nextType === 'COLOR') {
        nextValue = HEX.test(prev[valueKey]) ? prev[valueKey] : '#1aa054'
      } else if (nextType === 'IMAGE' && prev[typeKey] === 'IMAGE') {
        nextValue = prev[valueKey]
      }
      return { ...prev, [typeKey]: nextType, [valueKey]: nextValue }
    })
  }

  async function uploadTo(key, file, segmentIndex) {
    setError('')
    try {
      validateAdminImageFile(file)
    } catch (err) {
      setError(formatApiErrorMessage(err) || 'That image cannot be uploaded.')
      return
    }
    setUploading(key)
    try {
      const result = await adminUploadService.uploadImage(file, { feature: 'marketing' })
      const url = result?.data?.url
      if (!url) throw new Error('Upload succeeded but no image URL was returned.')
      if (segmentIndex == null) patch({ [key]: url })
      else patchSegment(segmentIndex, { image: url })
    } catch (err) {
      setError(formatApiErrorMessage(err) || 'Could not upload the image.')
    } finally {
      setUploading('')
    }
  }

  async function onSave() {
    if (!canSave) return
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const body = buildPayload(form)
      const res = editingId
        ? await adminService.updateAdminSpinWheel(editingId, body)
        : await adminService.createAdminSpinWheel(body)
      const saved = res?.data
      if (saved?.id) {
        setEditingId(saved.id)
        setForm(formFromWheel(saved))
      }
      setNotice(editingId ? 'Spin wheel updated.' : 'Spin wheel saved.')
      setWarning('')
      await load()
    } catch (err) {
      setError(formatApiErrorMessage(err) || 'Could not save the spin wheel.')
    } finally {
      setSaving(false)
    }
  }

  async function onSaveAllowance() {
    if (!canEdit || !editingId) return
    const problem = allowanceError(allowance)
    if (problem) {
      setError(problem)
      setNotice('')
      return
    }
    setAllowanceSaving(true)
    setError('')
    setNotice('')
    try {
      const res = await adminService.updateAdminSpinWheelAllowance(editingId, allowancePayload(allowance))
      const saved = res?.data
      if (saved?.id) setAllowance(allowanceFromWheel(saved))
      setNotice('Spin allowance saved.')
      await load()
    } catch (err) {
      setError(formatApiErrorMessage(err) || 'Could not save the spin allowance.')
    } finally {
      setAllowanceSaving(false)
    }
  }

  async function onSaveSegments() {
    if (!canEdit || !editingId) return
    const problem = segmentSaveError(segments)
    if (problem) {
      setError(problem)
      setNotice('')
      return
    }
    setSegmentSaving(true)
    setError('')
    setNotice('')
    setWarning('')
    try {
      const res = await adminService.replaceAdminSpinWheelSegments(editingId, buildSegmentsPayload(segments))
      const saved = res?.data
      if (saved?.id) setSegments(segmentsFromWheel(saved))
      const notes = Array.isArray(saved?.warnings) ? saved.warnings.filter(Boolean) : []
      setWarning(notes.join(' '))
      setNotice('Segments saved.')
      await load()
    } catch (err) {
      setError(formatApiErrorMessage(err) || 'Could not save the segments.')
    } finally {
      setSegmentSaving(false)
    }
  }

  async function onDelete(id) {
    if (!canDelete) return
    setError('')
    setNotice('')
    try {
      await adminService.deleteAdminSpinWheel(id)
      if (editingId === id) startNew()
      setNotice('Spin wheel deleted.')
      await load()
    } catch (err) {
      setError(formatApiErrorMessage(err) || 'Could not delete the spin wheel.')
    }
  }

  return (
    <div className="mx-auto max-w-[1180px] px-4 py-5">
      <div className="mb-3.5">
        <h2 className="text-[20px] font-bold tracking-[-0.02em] text-[#17231c]">Spin Wheel</h2>
        <p className="mt-0.5 text-[12.5px] text-[#7c8780]">
          Entry tile, wheel screen, chances to spin, and 4–10 segments. The tile opens the wheel. Probabilities must add up to 100%.
        </p>
      </div>

      <MarketingViewTabs active="spin-wheel" />

      {error ? (
        <div className="mb-3 rounded-[10px] border border-[#f3d0d0] bg-[#fff6f6] px-3 py-2 text-[12.5px] text-[#9b2c2c]">
          {error}
        </div>
      ) : null}
      {notice ? (
        <div className="mb-3 rounded-[10px] border border-[#cfe8d7] bg-[#f3fbf6] px-3 py-2 text-[12.5px] text-[#1a6b3c]">
          {notice}
        </div>
      ) : null}
      {warning ? (
        <div className="mb-3 rounded-[10px] border border-[#f3e2b8] bg-[#fffaf0] px-3 py-2 text-[12.5px] text-[#7a5b12]">
          {warning}
        </div>
      ) : null}

      <div className="grid items-start gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <section className="rounded-[14px] border border-[#eceeec] bg-white p-4 shadow-[0_1px_2px_rgba(20,40,28,.03)]">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-[15px] font-bold text-[#17231c]">Wheels</h2>
            <button
              type="button"
              onClick={startNew}
              disabled={!canCreate}
              className="h-[32px] rounded-full bg-[#1aa054] px-3 text-[12px] font-bold text-white disabled:opacity-50"
            >
              New
            </button>
          </div>
          {loading ? <p className="text-[13px] text-[#7c8780]">Loading…</p> : null}
          {!loading && wheels.length === 0 ? (
            <p className="text-[13px] text-[#7c8780]">No spin wheels yet.</p>
          ) : null}
          <ul className="space-y-2">
            {wheels.map((row) => (
              <li key={row.id}>
                <button
                  type="button"
                  onClick={() => startEdit(row)}
                  className={cn(
                    'w-full rounded-[10px] border px-3 py-2 text-left',
                    editingId === row.id
                      ? 'border-[#1aa054] bg-[#f3fbf6]'
                      : 'border-[#eceeec] bg-white hover:border-[#cfe8d7]',
                  )}
                >
                  <span className="block text-[13px] font-bold text-[#17231c]">{wheelTitle(row)}</span>
                  <span className="mt-0.5 block text-[11.5px] text-[#7c8780]">
                    {row.active ? 'On' : 'Off'} · order {row.sortOrder ?? 0}
                    {row.segmentCount ? ` · ${row.segmentCount} segments` : ''}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-[14px] border border-[#eceeec] bg-white p-5 shadow-[0_1px_2px_rgba(20,40,28,.03)] max-[700px]:p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-[15px] font-bold text-[#17231c]">
                {editingId ? 'Edit wheel' : 'New wheel'}
              </h3>
              <p className="mt-1 text-[12.5px] text-[#7c8780]">
                Create needs Marketing create. Edit needs Marketing edit.
              </p>
            </div>
            <div className="flex gap-2">
              {editingId && canDelete ? (
                <button
                  type="button"
                  onClick={() => onDelete(editingId)}
                  className="h-[34px] rounded-full px-3 text-[12.5px] font-bold text-[#9b2c2c] ring-1 ring-[#f3d0d0]"
                >
                  Delete
                </button>
              ) : null}
              <button
                type="button"
                onClick={onSave}
                disabled={!canSave || saving || Boolean(uploading)}
                className="h-[34px] rounded-full bg-[#1aa054] px-4 text-[12.5px] font-bold text-white disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-4">
            <div className="rounded-[12px] border border-[#eceeec] p-3">
              <p className="mb-3 text-[13px] font-bold text-[#17231c]">Entry tile</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <ImagePicker
                  label="Image (Arabic)"
                  value={form.entryTileImageAr}
                  disabled={!canSave}
                  busy={uploading === 'entryTileImageAr'}
                  onUpload={(file) => uploadTo('entryTileImageAr', file)}
                  onClear={() => patch({ entryTileImageAr: '' })}
                />
                <ImagePicker
                  label="Image (English)"
                  value={form.entryTileImageEn}
                  disabled={!canSave}
                  busy={uploading === 'entryTileImageEn'}
                  onUpload={(file) => uploadTo('entryTileImageEn', file)}
                  onClear={() => patch({ entryTileImageEn: '' })}
                />
                <Field label="Order" hint="Lower numbers sit earlier among tiles.">
                  <input
                    className={inputClass}
                    type="number"
                    min="0"
                    value={form.sortOrder}
                    disabled={!canSave}
                    onChange={(event) => patch({ sortOrder: event.target.value })}
                  />
                </Field>
                <Field label="On / off">
                  <span className="flex h-[40px] items-center gap-2 text-[13px] text-[#17231c]">
                    <input
                      type="checkbox"
                      checked={form.active}
                      disabled={!canSave}
                      onChange={(event) => patch({ active: event.target.checked })}
                    />
                    {form.active ? 'On' : 'Off'}
                  </span>
                </Field>
                <Field label="Start">
                  <input
                    className={inputClass}
                    type="datetime-local"
                    value={form.startsAt}
                    disabled={!canSave}
                    onChange={(event) => patch({ startsAt: event.target.value })}
                  />
                </Field>
                <Field label="End">
                  <input
                    className={inputClass}
                    type="datetime-local"
                    value={form.endsAt}
                    disabled={!canSave}
                    onChange={(event) => patch({ endsAt: event.target.value })}
                  />
                </Field>
              </div>
            </div>

            <div className="rounded-[12px] border border-[#eceeec] p-3">
              <p className="mb-3 text-[13px] font-bold text-[#17231c]">Wheel screen</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Header (Arabic)">
                  <input
                    className={inputClass}
                    value={form.headerTextAr}
                    disabled={!canSave}
                    onChange={(event) => patch({ headerTextAr: event.target.value })}
                  />
                </Field>
                <Field label="Header (English)">
                  <input
                    className={inputClass}
                    value={form.headerTextEn}
                    disabled={!canSave}
                    onChange={(event) => patch({ headerTextEn: event.target.value })}
                  />
                </Field>
                <Field label="Sub-header (Arabic)">
                  <input
                    className={inputClass}
                    value={form.subHeaderAr}
                    disabled={!canSave}
                    onChange={(event) => patch({ subHeaderAr: event.target.value })}
                  />
                </Field>
                <Field label="Sub-header (English)">
                  <input
                    className={inputClass}
                    value={form.subHeaderEn}
                    disabled={!canSave}
                    onChange={(event) => patch({ subHeaderEn: event.target.value })}
                  />
                </Field>
              </div>
              <div className="mt-3 grid gap-3">
                <BackgroundFields
                  title="Wheel background"
                  type={form.wheelBgType}
                  value={form.wheelBgValue}
                  disabled={!canSave}
                  busy={uploading === 'wheelBgValue'}
                  onType={(next) => setBgType('wheel', next)}
                  onValue={(next) => patch({ wheelBgValue: next })}
                  onUpload={(file) => uploadTo('wheelBgValue', file)}
                />
                <BackgroundFields
                  title="Screen background"
                  type={form.screenBgType}
                  value={form.screenBgValue}
                  disabled={!canSave}
                  busy={uploading === 'screenBgValue'}
                  onType={(next) => setBgType('screen', next)}
                  onValue={(next) => patch({ screenBgValue: next })}
                  onUpload={(file) => uploadTo('screenBgValue', file)}
                />
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Field label="Spin button text">
                  <input
                    className={inputClass}
                    value={form.spinButtonText}
                    disabled={!canSave}
                    onChange={(event) => patch({ spinButtonText: event.target.value })}
                  />
                </Field>
                <Field label="Spin button color">
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={pickerHex(form.spinButtonColor || '#1aa054')}
                      disabled={!canSave}
                      onChange={(event) => patch({ spinButtonColor: event.target.value })}
                      className="h-[40px] w-12 cursor-pointer rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white p-1 disabled:opacity-50"
                    />
                    <input
                      className={inputClass}
                      value={form.spinButtonColor}
                      disabled={!canSave}
                      placeholder="#1AA054"
                      onChange={(event) => patch({ spinButtonColor: event.target.value })}
                    />
                  </div>
                </Field>
              </div>
            </div>

            <AllowanceEditor
              allowance={allowance}
              disabled={!canEdit || !editingId || allowanceSaving}
              canSave={Boolean(editingId) && canEdit}
              saving={allowanceSaving}
              needsWheel={!editingId}
              onChange={setAllowance}
              onSave={onSaveAllowance}
            />

            <SegmentBuilder
              segments={segments}
              templates={templates}
              disabled={!canEdit || !editingId || segmentSaving}
              canSave={Boolean(editingId) && canEdit && !segmentSaveError(segments)}
              saving={segmentSaving}
              uploading={uploading}
              needsWheel={!editingId}
              onChange={setSegments}
              onPatch={patchSegment}
              onUpload={(index, file) => uploadTo(`segment:${index}`, file, index)}
              onSave={onSaveSegments}
            />

            <p className="text-[12px] text-[#9aa49d]">
              The tile and screen save does not change segments or how many spins a customer gets.
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
