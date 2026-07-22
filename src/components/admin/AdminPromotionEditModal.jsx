import { useEffect, useState } from 'react'
import { ChevronDown } from 'lucide-react'

const cn = (...parts) => parts.filter(Boolean).join(' ')

const labelClass = 'mb-1.5 block text-[12px] font-medium text-[#7c8780]'
const inputClass =
  'box-border h-[40px] w-full rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white px-3 text-[13px] text-[#17231c] outline-none transition placeholder:text-[#9aa49d] focus:border-[#1aa054]'

const TYPE_OPTIONS = ['% off', 'Free delivery', 'BOGO', 'Item deal', 'Fixed amount']

function stripCurrency(value) {
  if (!value || value === '—') return ''
  return String(value).replace(/^BHD\s*/i, '').trim()
}

function extractValue(promo) {
  if (promo?.value != null && promo.value !== '') return String(promo.value)
  const match = String(promo?.detailType || '').match(/\((\d+(?:\.\d+)?)%?\)/)
  if (match) return match[1]
  if (promo?.type === '% off') return '20'
  return ''
}

function parsePeriodDates(period) {
  const text = String(period || '').trim()
  const range = text.match(/^(\d{1,2})\s*[–-]\s*(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/)
  if (range) {
    return {
      from: `${range[1]} ${range[3]} ${range[4]}`,
      to: `${range[2]} ${range[3]} ${range[4]}`,
    }
  }
  const full = text.match(/^(\d{1,2}\s+[A-Za-z]+\s+\d{4})\s*[–-]\s*(\d{1,2}\s+[A-Za-z]+\s+\d{4})$/)
  if (full) return { from: full[1], to: full[2] }
  return { from: text || '', to: '' }
}

function buildFormState(promo) {
  const dates = parsePeriodDates(promo?.detailPeriod || promo?.period)
  const isAllBranches = !promo?.scope || /^all branches$/i.test(promo.scope)

  return {
    name: promo?.name || '',
    type: TYPE_OPTIONS.includes(promo?.type) ? promo.type : TYPE_OPTIONS[0],
    value: extractValue(promo),
    cap: stripCurrency(promo?.discountCap),
    minOrder: stripCurrency(promo?.minOrder),
    scope: isAllBranches ? 'All branches' : 'Selected branches',
    from: dates.from,
    to: dates.to,
    active: promo?.status === 'Active',
  }
}

export default function AdminPromotionEditModal({
  open,
  promotion,
  onClose,
  onSave,
}) {
  const [form, setForm] = useState(() => buildFormState(promotion))

  useEffect(() => {
    if (open) setForm(buildFormState(promotion))
  }, [open, promotion])

  if (!open || !promotion) return null

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = () => {
    onSave?.({
      ...promotion,
      name: form.name.trim(),
      type: form.type,
      value: form.value,
      discountCap: form.cap ? `BHD ${form.cap}` : '—',
      minOrder: form.minOrder ? `BHD ${form.minOrder}` : '—',
      scope: form.scope,
      detailPeriod: form.from && form.to ? `${form.from} – ${form.to}` : form.from || form.to,
      status: form.active ? 'Active' : 'Scheduled',
    })
    onClose?.()
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close edit promotion"
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="promotion-edit-title"
        className="relative w-full max-w-[520px] overflow-hidden rounded-[14px] bg-white shadow-[0_12px_40px_rgba(20,40,28,.18)]"
      >
        <div className="px-5 pt-5 pb-1">
          <h2 id="promotion-edit-title" className="text-[16px] font-bold tracking-[-0.02em] text-[#17231c]">
            Edit promotion
          </h2>
        </div>

        <div className="space-y-4 px-5 py-4">
          <div className="grid grid-cols-[minmax(0,1.6fr)_minmax(120px,0.8fr)] gap-3 max-[520px]:grid-cols-1">
            <label className="block min-w-0">
              <span className={labelClass}>Promotion name</span>
              <input
                className={inputClass}
                value={form.name}
                onChange={(e) => setField('name', e.target.value)}
              />
            </label>
            <label className="block min-w-0">
              <span className={labelClass}>Type</span>
              <div className="relative">
                <select
                  className={cn(inputClass, 'appearance-none pr-9')}
                  value={form.type}
                  onChange={(e) => setField('type', e.target.value)}
                >
                  {TYPE_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#7c8780]"
                />
              </div>
            </label>
          </div>

          <div className="grid grid-cols-3 gap-3 max-[520px]:grid-cols-1">
            <label className="block min-w-0">
              <span className={labelClass}>Value</span>
              <input
                className={inputClass}
                value={form.value}
                onChange={(e) => setField('value', e.target.value)}
              />
            </label>
            <label className="block min-w-0">
              <span className={labelClass}>Cap (BHD)</span>
              <input
                className={inputClass}
                value={form.cap}
                onChange={(e) => setField('cap', e.target.value)}
              />
            </label>
            <label className="block min-w-0">
              <span className={labelClass}>Min order</span>
              <input
                className={inputClass}
                value={form.minOrder}
                onChange={(e) => setField('minOrder', e.target.value)}
              />
            </label>
          </div>

          <div>
            <span className={labelClass}>Scope</span>
            <div className="inline-flex w-fit items-center rounded-[10px] bg-[#e9ebe9] p-[3px]">
              {['All branches', 'Selected branches'].map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setField('scope', option)}
                  className={cn(
                    'h-[32px] rounded-[8px] px-3 text-[12px]',
                    form.scope === option
                      ? 'bg-white font-bold text-[#17231c] shadow-[0_1px_3px_rgba(20,40,28,.12)]'
                      : 'font-medium text-[#69756d]',
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 max-[520px]:grid-cols-1">
            <label className="block min-w-0">
              <span className={labelClass}>From</span>
              <input
                className={inputClass}
                value={form.from}
                onChange={(e) => setField('from', e.target.value)}
              />
            </label>
            <label className="block min-w-0">
              <span className={labelClass}>To</span>
              <input
                className={inputClass}
                value={form.to}
                onChange={(e) => setField('to', e.target.value)}
              />
            </label>
          </div>

          <div className="flex items-start  gap-3 pt-1">
            <div className="min-w-0">
              <p className="text-[13px] font-bold text-[#17231c]">Active</p>
              <p className="mt-0.5 text-[12px] leading-[16px] text-[#7c8780]">
                Visible to customers
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={form.active}
              onClick={() => setField('active', !form.active)}
              className={cn(
                'relative mt-0.5 h-[28px] w-[48px] shrink-0 rounded-full transition',
                form.active ? 'bg-[#1aa054]' : 'bg-[#d5dbd7]',
              )}
            >
              <span
                className={cn(
                  'absolute top-[3px] h-[22px] w-[22px] rounded-full bg-white shadow transition',
                  form.active ? 'left-[23px]' : 'left-[3px]',
                )}
              />
            </button>
          </div>
        </div>

        <div className="flex items-center  gap-6  px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-[36px] items-center rounded-full border border-[#e4e8e4] bg-white px-4 text-[13px] font-medium text-[#17231c] hover:bg-[#f6f8f6]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex h-[36px] items-center rounded-full bg-[#1aa054] px-4 text-[13px] font-bold text-white hover:bg-[#158a47]"
          >
            Save changes
          </button>
        </div>
      </div>
    </div>
  )
}
