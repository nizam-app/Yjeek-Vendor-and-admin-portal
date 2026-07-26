import { useEffect, useState } from 'react'
import { ChevronDown, Upload, X } from 'lucide-react'
import { cn } from './cn'

const BANNER_TYPES = [
  { id: 'static', label: 'Static banner' },
  { id: 'scroll', label: 'Scroll / carousel' },
  { id: 'popup', label: 'Pop-up ad' },
]

const TAP_ACTIONS = ['Open store', 'Open category', 'Open URL', 'No action']
const TARGETS = ['Green Kitchen', 'All stores', 'Pharmacy near you', 'Custom']
export const BANNER_PLACEMENTS = [
  'Home top · scroll banner',
  'Between sections',
  'Below a section',
  'Pop-up ad (on open)',
  'Store page top',
  'Category top · scroll',
]
const AUDIENCES = ['All customers', 'New customers', 'Returning customers', 'VIP']

const labelClass = 'block text-[12px] font-semibold leading-[15px] text-[#6B736E]'
const inputClass =
  'box-border h-[38px] w-full rounded-[10px] border-[1.2px] border-[#E3E6E3] bg-white px-[14px] text-[13px] font-medium leading-4 text-[#1C211F] outline-none transition focus:border-[#2E9E4D]'

function FieldLabel({ children }) {
  return <span className={labelClass}>{children}</span>
}

function TextInput({ value, onChange }) {
  return (
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={inputClass}
    />
  )
}

function SelectField({ value, onChange, options }) {
  return (
    <div className="relative w-full">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cn(inputClass, 'appearance-none pr-9')}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <ChevronDown
        size={14}
        className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6B736E]"
      />
    </div>
  )
}

function DateField({ value, onChange }) {
  return (
    <div className="relative w-full">
      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[13px] leading-none">
        📅
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cn(inputClass, 'pl-9')}
      />
    </div>
  )
}

function normalizePlacement(value, placements = BANNER_PLACEMENTS) {
  if (!value) return placements[0]
  const cleaned = String(value).replace(/—/g, '·').replace(/\s+/g, ' ').trim()
  const match = placements.find((item) => item.toLowerCase() === cleaned.toLowerCase())
  return match || cleaned
}

function buildBannerForm(placement = '', placements = BANNER_PLACEMENTS) {
  return {
    type: 'static',
    title: 'Ramadan offers',
    subtitle: 'Up to 30% off',
    tapAction: TAP_ACTIONS[0],
    target: TARGETS[0],
    placement: normalizePlacement(placement, placements),
    start: '22 Mar 2026',
    end: '30 Mar 2026',
    audience: AUDIENCES[0],
    active: true,
  }
}

/**
 * Reusable create/edit modal for banners & ads.
 */
export default function AdminNewBannerModal({
  open,
  onClose,
  onCreate,
  placement = '',
  placements = BANNER_PLACEMENTS,
  title = 'New banner / ad',
  description = 'Create a banner, scroll banner, ad or pop-up',
  submitLabel = 'Create banner',
}) {
  const [form, setForm] = useState(() => buildBannerForm(placement, placements))

  useEffect(() => {
    if (open) setForm(buildBannerForm(placement, placements))
  }, [open, placement, placements])

  useEffect(() => {
    if (!open) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const placementOptions = placements.includes(form.placement)
    ? placements
    : [form.placement, ...placements]

  const handleCreate = () => {
    onCreate?.(form)
    onClose?.()
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <button type="button" aria-label="Close modal backdrop" onClick={onClose} className="absolute inset-0 bg-black/40" />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-new-banner-title"
        className="relative flex h-[699px] w-[560px] max-w-[calc(100vw-2rem)] flex-col items-start gap-4 overflow-hidden rounded-[16px] bg-white p-[22px] shadow-[0px_18px_44px_rgba(0,0,0,0.3)]"
      >
        {/* Header */}
        <div className="flex w-full items-center gap-3">
          <div className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-[10px] bg-[#E3F2EB] text-[16px] leading-none text-[#127338]">
            🖼
          </div>
          <div className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
            <h2 id="admin-new-banner-title" className="text-[16.5px] font-bold leading-5 text-[#1C211F]">
              {title}
            </h2>
            <p className="truncate text-[12px] font-normal leading-[15px] text-[#6B736E]">{description}</p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="shrink-0 text-[16px] leading-[19px] text-[#6B736E] hover:text-[#1C211F]"
          >
            ✕
          </button>
        </div>

        {/* Type */}
        <div className="flex w-full flex-col items-start gap-1.5">
          <FieldLabel>Type</FieldLabel>
          <div className="flex w-full items-start rounded-[10px] bg-[#EDF0ED] p-[3px]">
            {BANNER_TYPES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setField('type', item.id)}
                className={cn(
                  'flex h-[31px] flex-1 items-start justify-center rounded-[8px] px-3 py-2 text-[12px] leading-[15px] transition',
                  form.type === item.id
                    ? 'bg-white font-semibold text-[#1C211F]'
                    : 'font-medium text-[#737A75]',
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Image */}
        <div className="flex w-full flex-col items-start gap-1.5">
          <FieldLabel>Image</FieldLabel>
          <button
            type="button"
            className="flex h-[77px] w-full flex-col items-center justify-center gap-1 rounded-[10px] border-[1.2px] border-dashed border-[#E3E6E3] bg-[#F7FAF7] hover:bg-[#f0f4f0]"
          >
            <Upload size={18} strokeWidth={2} className="text-[#6B736E]" />
            <span className="text-[12px] font-medium leading-[15px] text-[#6B736E]">
              Upload image (1200×400 recommended)
            </span>
          </button>
        </div>

        {/* Title / Subtitle */}
        <div className="flex w-full items-start gap-4">
          <label className="flex min-w-0 flex-1 flex-col items-start gap-1.5">
            <FieldLabel>Title</FieldLabel>
            <TextInput value={form.title} onChange={(value) => setField('title', value)} />
          </label>
          <label className="flex min-w-0 flex-1 flex-col items-start gap-1.5">
            <FieldLabel>Subtitle / CTA</FieldLabel>
            <TextInput value={form.subtitle} onChange={(value) => setField('subtitle', value)} />
          </label>
        </div>

        {/* Tap action / Target */}
        <div className="flex w-full items-start gap-4">
          <label className="flex min-w-0 flex-1 flex-col items-start gap-1.5">
            <FieldLabel>Tap action</FieldLabel>
            <SelectField
              value={form.tapAction}
              onChange={(value) => setField('tapAction', value)}
              options={TAP_ACTIONS}
            />
          </label>
          <label className="flex min-w-0 flex-1 flex-col items-start gap-1.5">
            <FieldLabel>Target</FieldLabel>
            <SelectField value={form.target} onChange={(value) => setField('target', value)} options={TARGETS} />
          </label>
        </div>

        {/* Placement */}
        <label className="flex w-[188px] max-w-full flex-col items-start gap-1.5">
          <FieldLabel>Placement</FieldLabel>
          <SelectField
            value={form.placement}
            onChange={(value) => setField('placement', value)}
            options={placementOptions}
          />
        </label>

        {/* Start / End */}
        <div className="flex w-full items-start gap-4">
          <label className="flex min-w-0 flex-1 flex-col items-start gap-1.5">
            <FieldLabel>Start</FieldLabel>
            <DateField value={form.start} onChange={(value) => setField('start', value)} />
          </label>
          <label className="flex min-w-0 flex-1 flex-col items-start gap-1.5">
            <FieldLabel>End</FieldLabel>
            <DateField value={form.end} onChange={(value) => setField('end', value)} />
          </label>
        </div>

        {/* Audience / Active */}
        <div className="flex w-full items-start gap-4">
          <label className="flex min-w-0 flex-1 flex-col items-start gap-1.5">
            <FieldLabel>Audience</FieldLabel>
            <SelectField
              value={form.audience}
              onChange={(value) => setField('audience', value)}
              options={AUDIENCES}
            />
          </label>
          <div className="flex min-w-0 flex-1 flex-col items-start gap-1.5">
            <FieldLabel>Active</FieldLabel>
            <div className="flex h-[38px] w-full items-center gap-2.5 rounded-[10px] bg-[#F7FAF7] px-3 py-[9px]">
              <span className="text-[13px] font-semibold leading-4 text-[#1C211F]">Publish immediately</span>
              <div className="flex-1" />
              <button
                type="button"
                role="switch"
                aria-checked={form.active}
                onClick={() => setField('active', !form.active)}
                className={cn(
                  'relative flex h-[26px] w-[44px] shrink-0 items-center rounded-xl px-1 transition',
                  form.active ? 'justify-end bg-[#2E9E4D]' : 'justify-start bg-[#cfd6d1]',
                )}
              >
                <span className="h-[18px] w-[18px] rounded-full bg-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto flex w-full items-center gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-[38px] items-center justify-center rounded-[20px] border-[1.2px] border-[#E3E6E3] bg-white px-[18px] text-[13px] font-semibold leading-4 text-[#1C211F] hover:bg-[#F7FAF7]"
          >
            Cancel
          </button>
          <div className="flex-1" />
          <button
            type="button"
            onClick={handleCreate}
            className="inline-flex h-[38px] items-center justify-center rounded-[20px] bg-[#2E9E4D] px-[18px] text-[13px] font-semibold leading-4 text-white hover:bg-[#278a43]"
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
