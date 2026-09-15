import { useEffect, useState } from 'react'
import { GripVertical, Plus, Trash2, X } from 'lucide-react'

const labelClass = 'text-[12px] font-medium text-[#7c8780]'
const inputClass =
  'box-border h-[40px] w-full rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white px-3 text-[13px] text-[#17231c] outline-none focus:border-[#1aa054]'
const outlineBtn =
  'inline-flex h-[34px] items-center justify-center gap-1.5 rounded-full border border-[#dfe4e0] bg-white px-3 text-[12px] font-medium text-[#127338] hover:bg-[#f6f8f6] disabled:opacity-50'
const primaryBtn =
  'inline-flex h-[34px] items-center justify-center gap-1.5 rounded-full bg-[#1aa054] px-4 text-[12px] font-bold text-white hover:bg-[#158a47] disabled:opacity-50'
const ghostBtn =
  'inline-flex size-8 items-center justify-center rounded-full text-[#637068] hover:bg-[#f3f5f3] disabled:opacity-50'

function emptyChoice() {
  return { name: '', nameAr: '', price: '+0.000', isDefault: false }
}

function buildForm(group) {
  const selection =
    group?.selection ||
    (Number(group?.maxSelect ?? group?.max ?? 1) > 1 ? 'multiple' : 'single')
  const choices = Array.isArray(group?.choices)
    ? group.choices.map((c) => ({
        name: c.name || '',
        nameAr: c.nameAr || '',
        price:
          c.price != null
            ? String(c.price).startsWith('+')
              ? c.price
              : `+${Number(c.price).toFixed(3)}`
            : c.priceDelta != null
              ? `+${Number(c.priceDelta).toFixed(3)}`
              : '+0.000',
        isDefault: Boolean(c.isDefault),
      }))
    : Array.isArray(group?.options)
      ? group.options.map((o) => ({
          name: o.name || '',
          nameAr: o.nameAr || '',
          price:
            o.price != null
              ? `+${Number(o.price).toFixed(3)}`
              : o.priceDelta != null
                ? `+${Number(o.priceDelta).toFixed(3)}`
                : '+0.000',
          isDefault: Boolean(o.isDefault),
        }))
      : [emptyChoice(), emptyChoice()]

  return {
    title: group?.title || group?.name || '',
    titleAr: group?.nameAr || group?.titleAr || '',
    selection,
    min: String(group?.min ?? group?.minSelect ?? (selection === 'single' ? 1 : 0)),
    max: String(group?.max ?? group?.maxSelect ?? (selection === 'single' ? 1 : 2)),
    choices: choices.length ? choices : [emptyChoice()],
  }
}

function parsePriceDelta(raw) {
  const cleaned = String(raw || '')
    .replace(/[+,\s]/g, '')
    .trim()
  const n = Number(cleaned)
  return Number.isFinite(n) ? Math.max(0, n) : 0
}

/**
 * Nested modal to add/edit an option group for staged import items.
 */
export default function AdminOptionGroupModal({ open, group, onClose, onSave }) {
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
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose])

  if (!open || !form) return null

  const update = (patch) => setForm((c) => ({ ...c, ...patch }))
  const updateChoice = (index, field, value) => {
    setForm((c) => {
      const choices = c.choices.map((item, i) =>
        i === index ? { ...item, [field]: value } : item,
      )
      return { ...c, choices }
    })
  }

  const submit = () => {
    const title = form.title.trim()
    const titleAr = form.titleAr.trim()
    const choices = form.choices
      .map((c) => ({
        name: String(c.name || '').trim(),
        nameAr: String(c.nameAr || '').trim() || undefined,
        priceDelta: parsePriceDelta(c.price),
        isDefault: Boolean(c.isDefault),
        isAvailable: true,
      }))
      .filter((c) => c.name)
    if (!title || !choices.length) return

    const selection = form.selection === 'multiple' ? 'multiple' : 'single'
    const minSelect = selection === 'single' ? 1 : Math.max(0, Number(form.min) || 0)
    const maxSelect = selection === 'single' ? 1 : Math.max(minSelect || 1, Number(form.max) || 2)
    const isRequired = minSelect > 0
    const detail = choices.map((c) => c.name).join(' · ')
    const tag =
      selection === 'single'
        ? 'Required · Pick 1'
        : minSelect > 0
          ? `Required · Pick ${minSelect}–${maxSelect}`
          : `Optional · Multi`

    onSave({
      title,
      name: title,
      nameAr: titleAr || undefined,
      selection,
      min: String(minSelect),
      max: String(maxSelect),
      minSelect,
      maxSelect,
      isRequired,
      tag,
      tagTone: isRequired ? 'required' : 'optional',
      detail,
      choices: choices.map((c) => ({
        name: c.name,
        nameAr: c.nameAr,
        price: `+${c.priceDelta.toFixed(3)}`,
        isDefault: c.isDefault,
      })),
      options: choices,
    })
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-[480px] flex-col overflow-hidden rounded-[14px] bg-white shadow-[0_12px_40px_rgba(20,40,28,.18)]">
        <div className="flex items-center justify-between border-b border-[#edf0ee] px-5 py-4">
          <h3 className="text-[15px] font-bold text-[#17231c]">
            {group ? 'Edit option group' : 'Add option group'}
          </h3>
          <button type="button" className={ghostBtn} onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          <label className="block">
            <span className={`mb-1.5 block ${labelClass}`}>Group name (EN)</span>
            <input
              className={inputClass}
              value={form.title}
              onChange={(e) => update({ title: e.target.value })}
              placeholder="e.g. Choose a drink"
            />
          </label>
          <label className="block">
            <span className={`mb-1.5 block ${labelClass}`}>Group name (AR)</span>
            <input
              className={inputClass}
              dir="rtl"
              value={form.titleAr}
              onChange={(e) => update({ titleAr: e.target.value })}
              placeholder="اختر مشروب"
            />
          </label>

          <div className="flex gap-2">
            {['single', 'multiple'].map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() =>
                  update({
                    selection: mode,
                    min: mode === 'single' ? '1' : '0',
                    max: mode === 'single' ? '1' : '2',
                  })
                }
                className={`rounded-full px-3 py-1.5 text-[12px] font-medium ${
                  form.selection === mode
                    ? 'bg-[#1aa054] text-white'
                    : 'bg-[#f3f5f3] text-[#455249]'
                }`}
              >
                {mode === 'single' ? 'Single select' : 'Multi select'}
              </button>
            ))}
          </div>

          {form.selection === 'multiple' ? (
            <div className="flex gap-3">
              <label className="block flex-1">
                <span className={`mb-1.5 block ${labelClass}`}>Min</span>
                <input
                  className={inputClass}
                  value={form.min}
                  onChange={(e) => update({ min: e.target.value })}
                />
              </label>
              <label className="block flex-1">
                <span className={`mb-1.5 block ${labelClass}`}>Max</span>
                <input
                  className={inputClass}
                  value={form.max}
                  onChange={(e) => update({ max: e.target.value })}
                />
              </label>
            </div>
          ) : null}

          <div className="flex items-center justify-between pt-1">
            <p className="text-[12.5px] font-bold text-[#17231c]">Choices</p>
            <button
              type="button"
              className="text-[11px] font-medium text-[#127036] hover:underline"
              onClick={() => update({ choices: [...form.choices, emptyChoice()] })}
            >
              + Add choice
            </button>
          </div>

          <div className="space-y-2">
            {form.choices.map((choice, idx) => (
              <div
                key={idx}
                className="space-y-1.5 rounded-[10px] bg-[#F2F7F2] px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <GripVertical size={14} className="shrink-0 text-[#949C94]" />
                  <input
                    className="min-w-0 flex-1 border-none bg-transparent text-[13px] outline-none"
                    placeholder="Choice name (EN)"
                    value={choice.name}
                    onChange={(e) => updateChoice(idx, 'name', e.target.value)}
                  />
                  <input
                    className="w-[72px] shrink-0 border-none bg-transparent text-end text-[13px] text-[#127036] outline-none"
                    value={choice.price}
                    onChange={(e) => updateChoice(idx, 'price', e.target.value)}
                  />
                  <button
                    type="button"
                    className={ghostBtn}
                    aria-label="Remove choice"
                    onClick={() =>
                      update({ choices: form.choices.filter((_, i) => i !== idx) })
                    }
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <input
                  className="w-full border-none bg-transparent text-[12px] outline-none"
                  dir="rtl"
                  placeholder="اسم الاختيار (AR)"
                  value={choice.nameAr || ''}
                  onChange={(e) => updateChoice(idx, 'nameAr', e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-[#edf0ee] px-5 py-4">
          <button type="button" className={outlineBtn} onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={primaryBtn}
            disabled={!form.title.trim()}
            onClick={submit}
          >
            <Plus size={14} />
            Save group
          </button>
        </div>
      </div>
    </div>
  )
}
