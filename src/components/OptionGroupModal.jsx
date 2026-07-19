import { useEffect, useState } from 'react'
import productDrink from '../assets/product-drink.png'
import productSalad from '../assets/product-salad.png'

const labelClass = 'text-[13px] font-medium leading-[13px] text-[#69706E]'
const inputBox =
  'box-border flex h-[42px] w-full items-center rounded-[9px] border border-[#D6DBD6] bg-white px-3 text-[12.5px] font-medium leading-[15px] text-[#1A1A1A] outline-none focus:border-[#1AA34D]'

const DRINK_CHOICES = [
  { name: 'Pepsi', price: '+0.000', image: productDrink, isDefault: true },
  { name: '7Up', price: '+0.000', image: productDrink, isDefault: false },
  { name: 'Mirinda', price: '+0.000', image: productDrink, isDefault: false },
  { name: 'Large Pepsi', price: '+0.300', image: productDrink, isDefault: false },
  { name: 'Fresh orange juice', price: '+0.500', image: productDrink, isDefault: false },
  { name: 'Water', price: '+0.000', image: productDrink, isDefault: false },
]

const SAUCE_CHOICES = [
  { name: 'Garlic', price: '+0.000', image: productSalad, isDefault: true },
  { name: 'Ranch', price: '+0.000', image: productSalad, isDefault: false },
  { name: 'BBQ', price: '+0.000', image: productSalad, isDefault: false },
  { name: 'Sweet chili', price: '+0.000', image: productSalad, isDefault: false },
]

function emptyChoice() {
  return { name: '', price: '+0.000', image: productDrink, isDefault: false }
}

function buildChoicesFromGroup(group) {
  if (group?.choices?.length) {
    return group.choices.map((c) => ({ ...c }))
  }

  const title = String(group?.title || '').toLowerCase()
  if (title.includes('sauce')) return SAUCE_CHOICES.map((c) => ({ ...c }))
  if (title.includes('drink') || !group) return DRINK_CHOICES.map((c) => ({ ...c }))

  // Fallback: parse detail string "A · B · C"
  const parts = String(group?.detail || '')
    .split(/[·|,]/)
    .map((p) => p.trim())
    .filter(Boolean)

  if (!parts.length) return [emptyChoice(), emptyChoice(), emptyChoice()]

  return parts.map((name, i) => ({
    name,
    price: '+0.000',
    image: productDrink,
    isDefault: i === 0,
  }))
}

function buildForm(group) {
  const selection =
    group?.selection ||
    (String(group?.tag || '').toLowerCase().includes('multi') ? 'multiple' : 'single')

  return {
    title: group?.title ?? '',
    selection,
    min: group?.min ?? (selection === 'single' ? '1' : '0'),
    max: group?.max ?? (selection === 'single' ? '1' : '2'),
    choices: buildChoicesFromGroup(group),
  }
}

function buildTag({ selection, min, max }) {
  if (selection === 'single') {
    return { tag: 'Required · pick 1', tagTone: 'required' }
  }
  const minN = Number(min) || 0
  if (minN > 0) return { tag: `Required · pick ${min}–${max}`, tagTone: 'required' }
  return { tag: 'Optional · multi', tagTone: 'optional' }
}

/**
 * Option group editor modal — opens from "+ Add option group" or option row click.
 */
export default function OptionGroupModal({ open, group, onClose, onSave }) {
  const [form, setForm] = useState(null)

  useEffect(() => {
    if (!open) return
    setForm(buildForm(group))
  }, [open, group])

  useEffect(() => {
    if (!open) return undefined
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function onKeyDown(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose])

  if (!open || !form) return null

  function updateField(field, value) {
    setForm((c) => ({ ...c, [field]: value }))
  }

  function setSelection(selection) {
    setForm((c) => ({
      ...c,
      selection,
      min: selection === 'single' ? '1' : c.min,
      max: selection === 'single' ? '1' : c.max === '1' ? '2' : c.max,
    }))
  }

  function updateChoice(index, field, value) {
    setForm((c) => ({
      ...c,
      choices: c.choices.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    }))
  }

  function setDefaultChoice(index) {
    setForm((c) => ({
      ...c,
      choices: c.choices.map((item, i) => ({ ...item, isDefault: i === index })),
    }))
  }

  function removeChoice(index) {
    setForm((c) => ({
      ...c,
      choices: c.choices.filter((_, i) => i !== index),
    }))
  }

  function addChoice() {
    setForm((c) => ({ ...c, choices: [...c.choices, emptyChoice()] }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    const filled = form.choices.filter((c) => c.name.trim())
    const detail = filled.map((c) => c.name.trim()).join(' · ')
    const { tag, tagTone } = buildTag(form)

    onSave({
      ...group,
      title: form.title.trim() || 'Untitled group',
      detail,
      tag,
      tagTone,
      selection: form.selection,
      min: form.min,
      max: form.max,
      choices: filled,
    })
  }

  return (
    <div
      className="fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto bg-[rgba(0,0,0,0.32)] py-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="option-group-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="flex w-[560px] max-w-[calc(100vw-24px)] flex-col rounded-[16px] bg-white shadow-[0_20px_60px_rgba(26,28,26,0.24)]">
        {/* Header */}
        <div className="flex h-[54px] w-full shrink-0 items-center  border-b border-[#B8C8E0] px-5">
          <h2 id="option-group-title" className="min-w-0 flex-1 text-[16px] font-bold leading-5 text-[#1A1A1A]">
            Option group
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="text-[16px] leading-none text-[#69706E] hover:text-[#1A1A1A]"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex w-full flex-col">
          <div className="flex w-full flex-col gap-4 px-5 pt-4 pb-5">
            {/* Group name */}
            <div className="flex w-full flex-col gap-1.5">
              <label className={labelClass}>GROUP NAME</label>
              <input
                className="box-border flex h-[42px] w-[108px] items-center rounded-sm border border-[#D6DBD6] bg-white px-2.5 text-[12px] font-medium leading-[15px] text-[#1A1A1A] outline-none focus:border-[#1AA34D]"
                value={form.title}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder="Choose a drink"
              />
            </div>

            {/* Selection · Min · Max */}
            <div className="flex w-full flex-row flex-wrap items-end justify-between gap-3">
              <div className="flex min-w-0   flex-col gap-1.5">
                <span className={labelClass}>SELECTION</span>
                <div className="inline-flex h-[38px] overflow-hidden rounded-[9px] border border-[#D6DBD6] bg-[#F5F7F5]">
                  <button
                    type="button"
                    onClick={() => setSelection('single')}
                    className={`px-3.5 text-[12px] font-medium transition ${
                      form.selection === 'single'
                        ? 'bg-[#1A1A1A] text-white'
                        : 'bg-transparent text-[#69706E] hover:text-[#1A1A1A]'
                    }`}
                  >
                    Single choice
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelection('multiple')}
                    className={`px-3.5 text-[12px] font-medium transition ${
                      form.selection === 'multiple'
                        ? 'bg-[#1A1A1A] text-white'
                        : 'bg-transparent text-[#69706E] hover:text-[#1A1A1A]'
                    }`}
                  >
                    Multiple
                  </button>
                </div>
              </div>
              

              <div className="flex flex-1 flex-col gap-1.5">
                <label className={labelClass}>MIN</label>
                <input
                  className={inputBox}
                  value={form.min}
                  onChange={(e) => updateField('min', e.target.value)}
                />
              </div>

              <div className="flex flex-1 flex-col gap-1.5">
                <label className={labelClass}>MAX</label>
                <input
                  className={inputBox}
                  value={form.max}
                  onChange={(e) => updateField('max', e.target.value)}
                />
              </div>
            </div>

            {/* Choices header */}
            <div className="flex w-full items-center">
              <p className="text-[13px] font-bold leading-4 text-[#1A1A1A]">Choices</p>
              <span className="min-w-0 flex-1" />
              <button
                type="button"
                onClick={addChoice}
                className="text-[12px] font-medium leading-[14px] text-[#127036] hover:underline"
              >
                + Add choice
              </button>
            </div>

            {/* Choice rows */}
            <div className="-mt-1 flex w-full flex-col gap-2">
              {form.choices.map((choice, idx) => (
                <div
                  key={idx}
                  className="flex h-[58px] w-full flex-row items-center gap-2 rounded-[10px] bg-[#F2F7F2] px-2.5 py-2"
                >
                  <span
                    className="shrink-0 text-[14px] leading-[17px] text-[#949C94]"
                    aria-hidden="true"
                  >
                    ⠿
                  </span>

                  <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#E3F2EB]">
                    <img
                      src={choice.image || productDrink}
                      alt=""
                      className="size-6 object-contain"
                    />
                  </span>

                  {/* Name — bordered white box (indicated) */}
                  <input
                    className="box-border h-9 min-w-0 flex-1 rounded-[8px] border border-[#D6DBD6] bg-white px-2.5 text-[12px] font-medium leading-[15px] text-[#1A1A1A] outline-none placeholder:text-[#9EA69E] focus:border-[#1AA34D]"
                    placeholder="Choice name"
                    value={choice.name}
                    onChange={(e) => updateChoice(idx, 'name', e.target.value)}
                  />

                  <div className="flex w-[90px] shrink-0 flex-col items-start gap-0.5">
                    <span className="text-[9px] font-bold leading-[10px] text-[#949C94]">
                      PRICE +/−
                    </span>
                    <input
                      className="box-border flex h-[30px] w-full items-center rounded-[8px] border border-[#D6DBD6] bg-white px-2.5 text-[12px] font-medium leading-[15px] text-[#1A1A1A] outline-none focus:border-[#1AA34D]"
                      value={choice.price}
                      onChange={(e) => updateChoice(idx, 'price', e.target.value)}
                    />
                  </div>

                  {/* Default / Set default pills (indicated) */}
                  {choice.isDefault ? (
                    <span className="inline-block h-[21px] shrink-0 items-center rounded-[20px] bg-[#E3F2EB] px-2.5 py-1 text-[11px] font-medium leading-[13px] text-[#127036]">
                      Default
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setDefaultChoice(idx)}
                      className="inline-flex h-[21px]  shrink-0 items-center justify-center rounded-[20px] bg-[#EBEDEB] px-2.5 py-1 text-[11px] font-medium leading-[13px] text-[#949C94] hover:bg-[#E3E5E3]"
                    >
                      Set default
                    </button>
                  )}

                  <button
                    type="button"
                    aria-label="Remove choice"
                    onClick={() => removeChoice(idx)}
                    className="shrink-0 text-[13px] leading-4 text-[#949C94] hover:text-[#DB2626]"
                  >
                    🗑
                  </button>
                </div>
              ))}
            </div>
          </div>

         

          {/* Footer */}
          <div className="flex h-[64px] w-full items-center gap-2.5 px-5 border-t border-[#B8C8E0]">
            <span className="min-w-0 flex-1" />
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-[38px] min-w-[80px] items-center justify-center rounded-[10px] border border-[#D6DBD6] bg-white px-4 text-[13px] font-medium text-[#1A1A1A]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex h-[38px] min-w-[110px] items-center justify-center rounded-[10px] bg-[#1AA34D] px-4 text-[13px] font-medium text-white hover:brightness-[0.96]"
            >
              Save group
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
