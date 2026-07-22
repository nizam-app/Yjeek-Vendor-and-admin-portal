import { useEffect, useState } from 'react'

const cn = (...parts) => parts.filter(Boolean).join(' ')

const labelClass = 'mb-1.5 block text-[12px] font-medium text-[#7c8780]'
const inputClass =
  'box-border h-[40px] w-full rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white px-3 text-[13px] text-[#17231c] outline-none transition placeholder:text-[#9aa49d] focus:border-[#1aa054]'

const MODELS = ['% of order', 'Flat per order', 'Tiered']

const DEFAULT_GATEWAY = {
  fixedPct: '1.000',
  debitPct: '0.500',
  creditPct: '2.000',
  applePayPct: '1.500',
  googleWalletPct: '1.500',
  otherChargesPct: '0.500',
  fixedCharge: '0.050',
}

function stripPercent(value) {
  if (value == null || value === '') return ''
  return String(value).replace(/%/g, '').trim()
}

function stripCurrency(value) {
  if (!value || value === '—') return ''
  return String(value).replace(/^BHD\s*/i, '').trim()
}

function buildFormState(commission) {
  const gateway = commission?.gatewayFees || {}
  return {
    model: MODELS.includes(commission?.model) ? commission.model : MODELS[0],
    rate: stripPercent(commission?.rate ?? '15'),
    platformServiceFee: stripCurrency(commission?.platformServiceFee ?? '0.300'),
    vatOnCommission: commission?.vatOnCommission || '10% (auto)',
    currency: commission?.currency || 'BHD (fixed)',
    fixedPct: gateway.fixedPct ?? DEFAULT_GATEWAY.fixedPct,
    debitPct: gateway.debitPct ?? DEFAULT_GATEWAY.debitPct,
    creditPct: gateway.creditPct ?? DEFAULT_GATEWAY.creditPct,
    applePayPct: gateway.applePayPct ?? DEFAULT_GATEWAY.applePayPct,
    googleWalletPct: gateway.googleWalletPct ?? DEFAULT_GATEWAY.googleWalletPct,
    otherChargesPct: gateway.otherChargesPct ?? DEFAULT_GATEWAY.otherChargesPct,
    fixedCharge: gateway.fixedCharge ?? DEFAULT_GATEWAY.fixedCharge,
  }
}

export default function AdminCommissionEditModal({
  open,
  commission,
  onClose,
  onSave,
}) {
  const [form, setForm] = useState(() => buildFormState(commission))

  useEffect(() => {
    if (open) setForm(buildFormState(commission))
  }, [open, commission])

  if (!open) return null

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = () => {
    onSave?.({
      ...commission,
      model: form.model,
      rate: form.rate ? `${stripPercent(form.rate)}%` : commission?.rate,
      platformServiceFee: form.platformServiceFee
        ? `BHD ${form.platformServiceFee}`
        : commission?.platformServiceFee,
      vatOnCommission: form.vatOnCommission,
      currency: form.currency,
      gatewayFees: {
        fixedPct: form.fixedPct,
        debitPct: form.debitPct,
        creditPct: form.creditPct,
        applePayPct: form.applePayPct,
        googleWalletPct: form.googleWalletPct,
        otherChargesPct: form.otherChargesPct,
        fixedCharge: form.fixedCharge,
      },
    })
    onClose?.()
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close edit commission"
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="commission-edit-title"
        className="relative max-h-[min(920px,calc(100vh-2rem))] w-full max-w-[560px] overflow-y-auto rounded-[14px] bg-white shadow-[0_12px_40px_rgba(20,40,28,.18)]"
      >
        <div className="px-5 pt-5 pb-1">
          <h2
            id="commission-edit-title"
            className="text-[16px] font-bold tracking-[-0.02em] text-[#17231c]"
          >
            Edit commission &amp; fees
          </h2>
        </div>

        <div className="space-y-5 px-5 py-4">
          <div>
            <span className={labelClass}>Commission model</span>
            <div className="inline-flex w-fit flex-wrap items-center rounded-[10px] bg-[#e9ebe9] p-[3px]">
              {MODELS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setField('model', option)}
                  className={cn(
                    'h-[32px] rounded-[8px] px-3 text-[12px]',
                    form.model === option
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
              <span className={labelClass}>Commission rate (%)</span>
              <input
                className={inputClass}
                value={form.rate}
                onChange={(e) => setField('rate', e.target.value)}
              />
            </label>
            <label className="block min-w-0">
              <span className={labelClass}>Platform service fee (BHD)</span>
              <input
                className={inputClass}
                value={form.platformServiceFee}
                onChange={(e) => setField('platformServiceFee', e.target.value)}
              />
            </label>
            <label className="block min-w-0">
              <span className={labelClass}>VAT on commission</span>
              <input
                className={inputClass}
                value={form.vatOnCommission}
                onChange={(e) => setField('vatOnCommission', e.target.value)}
              />
            </label>
            <label className="block min-w-0">
              <span className={labelClass}>Currency</span>
              <input
                className={inputClass}
                value={form.currency}
                onChange={(e) => setField('currency', e.target.value)}
              />
            </label>
          </div>

          <div>
            <h3 className="text-[14px] font-bold text-[#17231c]">Online gateway fees</h3>
            <p className="mt-1 text-[12px] leading-[16px] text-[#7c8780]">
              Payment processing charges per online transaction.
            </p>

            <div className="mt-3 grid grid-cols-3 gap-3 max-[520px]:grid-cols-1">
              {[
                ['fixedPct', 'Fixed %'],
                ['debitPct', 'Debit %'],
                ['creditPct', 'Credit %'],
                ['applePayPct', 'Apple Pay %'],
                ['googleWalletPct', 'Google Wallet %'],
                ['otherChargesPct', 'Other charges %'],
              ].map(([key, label]) => (
                <label key={key} className="block min-w-0">
                  <span className={labelClass}>{label}</span>
                  <input
                    className={inputClass}
                    value={form[key]}
                    onChange={(e) => setField(key, e.target.value)}
                  />
                </label>
              ))}
              <label className="col-span-3 block min-w-0 max-[520px]:col-span-1">
                <span className={labelClass}>Fixed charge / transaction (BHD)</span>
                <input
                  className={inputClass}
                  value={form.fixedCharge}
                  onChange={(e) => setField('fixedCharge', e.target.value)}
                />
              </label>
            </div>
          </div>
        </div>

        <div className="flex items-center  gap-5  px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-[36px] items-center rounded-full border border-[#e4e8e4] bg-white px-4.5 py-2.5 text-[13px] font-medium text-[#17231c] hover:bg-[#f6f8f6]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex h-[36px] items-center rounded-full bg-[#1aa054] px-4.5 py-2.5 text-[13px] font-bold text-white hover:bg-[#158a47]"
          >
            Save commission
          </button>
        </div>
      </div>
    </div>
  )
}
