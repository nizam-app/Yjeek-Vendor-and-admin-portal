import { useEffect, useState } from 'react'
import { getCommissionInheritanceState } from '../../mappers/admin/mapAdminVendorCommission'

const cn = (...parts) => parts.filter(Boolean).join(' ')

const labelClass = 'mb-1.5 block text-[12px] font-medium text-[#7c8780]'
const inputClass =
  'box-border h-[40px] w-full rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white px-3 text-[13px] text-[#17231c] outline-none transition placeholder:text-[#9aa49d] focus:border-[#1aa054]'
const readOnlyInputClass = `${inputClass} cursor-default bg-[#f7f8f7] text-[#5c665f] focus:border-[rgba(0,0,0,0.1)]`
const hintClass = 'mt-1 text-[11px] leading-[14px] text-[#8a948e]'

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

const GATEWAY_FIELDS = [
  ['fixedPct', 'Fixed %', 'Applied on every online order, on top of the method rate below.'],
  ['debitPct', 'Debit %', 'Used only when the customer pays by debit card.'],
  ['creditPct', 'Credit %', 'Used only when the customer pays by credit card.'],
  ['applePayPct', 'Apple Pay %', 'Used only when the customer pays with Apple Pay.'],
  ['googleWalletPct', 'Google Wallet %', 'Used only when the customer pays with Google Wallet.'],
  ['otherChargesPct', 'Other charges %', 'Any additional gateway charge not covered by the methods above.'],
]

function stripPercent(value) {
  if (value == null || value === '') return ''
  return String(value).replace(/%/g, '').replace(/\(auto\)/gi, '').trim()
}

function stripCurrency(value) {
  if (!value || value === '—') return ''
  return String(value).replace(/^BHD\s*/i, '').trim()
}

function InheritanceBadge({ state }) {
  if (!state) return null
  const overridden = state === 'overridden'
  return (
    <span
      className={cn(
        'ml-1.5 inline-flex items-center rounded-[4px] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.04em]',
        overridden ? 'bg-[#fde8e8] text-[#b42318]' : 'bg-[#e8f7ed] text-[#147940]',
      )}
    >
      {overridden ? 'Overridden' : 'Inherited'}
    </span>
  )
}

function mapCustomFeesFromCommission(commission) {
  const raw = Array.isArray(commission?.customFees) ? commission.customFees : []
  return raw
    .map((fee, index) => {
      if (!fee || typeof fee !== 'object') return null
      const name = String(fee.name || '').trim()
      if (!name) return null
      const amount = fee.amount != null ? Number(fee.amount) : NaN
      const typeRaw = String(fee.type || 'BHD').toUpperCase()
      const type = typeRaw === '%' || typeRaw === 'PERCENT' || typeRaw === 'PCT' ? '%' : 'BHD'
      return {
        id: fee.id != null ? String(fee.id) : `fee-${index}-${name}`,
        name,
        amount: Number.isFinite(amount) ? String(amount) : '0',
        type,
      }
    })
    .filter(Boolean)
}

function buildFormState(commission) {
  const gateway = commission?.gatewayFees || {}
  const isFlat = commission?.model === 'Flat per order' || commission?.modelCode === 'FLAT_PER_ORDER'
  const rateValue = isFlat
    ? stripCurrency(commission?.rate) ||
      (commission?.flatFeePerOrder != null ? String(commission.flatFeePerOrder) : '')
    : stripPercent(commission?.rate ?? commission?.commissionRate ?? '15')

  return {
    model: MODELS.includes(commission?.model) ? commission.model : MODELS[0],
    rate: rateValue || '15',
    vatOnCommission: commission?.vatOnCommission || '10% (auto)',
    currency: 'BHD',
    fixedPct: gateway.fixedPct ?? DEFAULT_GATEWAY.fixedPct,
    debitPct: gateway.debitPct ?? DEFAULT_GATEWAY.debitPct,
    creditPct: gateway.creditPct ?? DEFAULT_GATEWAY.creditPct,
    applePayPct: gateway.applePayPct ?? DEFAULT_GATEWAY.applePayPct,
    googleWalletPct: gateway.googleWalletPct ?? DEFAULT_GATEWAY.googleWalletPct,
    otherChargesPct: gateway.otherChargesPct ?? DEFAULT_GATEWAY.otherChargesPct,
    fixedCharge: gateway.fixedCharge ?? DEFAULT_GATEWAY.fixedCharge,
    customFees: mapCustomFeesFromCommission(commission),
    commissionTiers: Array.isArray(commission?.commissionTiers) ? commission.commissionTiers : [],
  }
}

export default function AdminCommissionEditModal({
  open,
  commission,
  methodLabel = '',
  storeTypeName = '',
  onClose,
  onSave,
  saving = false,
  error = null,
}) {
  const [form, setForm] = useState(() => buildFormState(commission))
  const [feeDraft, setFeeDraft] = useState({ name: '', amount: '0.000', type: 'BHD' })
  const [localError, setLocalError] = useState(null)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(buildFormState(commission))
      setFeeDraft({ name: '', amount: '0.000', type: 'BHD' })
      setLocalError(null)
    }
  }, [open, commission])

  if (!open) return null

  const inheritance = commission?.inheritance || null
  const seeded = Boolean(commission?.seededFromStoreType)
  const rateInheritancePath =
    form.model === 'Flat per order' ? 'flatFeePerOrder' : 'commissionRate'

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const busy = saving || pending
  const displayError = localError || error

  const addCustomFee = () => {
    const name = String(feeDraft.name || '').trim()
    if (!name) return
    const amount = String(feeDraft.amount || '0').trim() || '0'
    setForm((prev) => ({
      ...prev,
      customFees: [
        ...prev.customFees,
        { id: `fee-${Date.now()}`, name, amount, type: feeDraft.type || 'BHD' },
      ],
    }))
    setFeeDraft({ name: '', amount: '0.000', type: 'BHD' })
  }

  const handleSave = async () => {
    const payload = {
      ...commission,
      model: form.model,
      rate: form.rate,
      commissionRate: form.model === 'Flat per order' ? undefined : stripPercent(form.rate),
      flatFeePerOrder: form.model === 'Flat per order' ? stripCurrency(form.rate) || form.rate : undefined,
      vatOnCommission: form.vatOnCommission,
      currency: 'BHD',
      commissionTiers: form.commissionTiers,
      customFees: form.customFees.map((fee) => ({
        name: fee.name,
        amount: Number(fee.amount),
        type: fee.type === '%' ? 'PERCENT' : 'BHD',
      })),
      gatewayFees: {
        fixedPct: form.fixedPct,
        debitPct: form.debitPct,
        creditPct: form.creditPct,
        applePayPct: form.applePayPct,
        googleWalletPct: form.googleWalletPct,
        otherChargesPct: form.otherChargesPct,
        fixedCharge: form.fixedCharge,
      },
    }

    setLocalError(null)
    setPending(true)
    try {
      await onSave?.(payload)
    } catch (err) {
      setLocalError(err)
    } finally {
      setPending(false)
    }
  }

  const rateLabel =
    form.model === 'Flat per order' ? 'Flat fee per order (BHD)' : 'Commission rate (%)'
  const rateHint =
    form.model === 'Flat per order'
      ? 'Flat amount taken per order.'
      : 'Taken per order on the items value only — delivery and service fees excluded.'

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close edit commission"
        onClick={onClose}
        disabled={busy}
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
            Edit commission &amp; fees{methodLabel ? ` · ${methodLabel}` : ''}
          </h2>
        </div>

        <div className="space-y-5 px-5 py-4">
          {seeded && storeTypeName ? (
            <div className="rounded-[8px] border border-[#b7e4c7] bg-[#e8f7ed] px-3 py-2 text-[12px] leading-[16px] text-[#147940]">
              ✓ Pre-filled from the <strong>{storeTypeName}</strong> commission defaults. Edit any
              field to override it for this vendor.
            </div>
          ) : null}

          <div>
            <span className={labelClass}>
              Commission model
              <InheritanceBadge state={getCommissionInheritanceState(inheritance, 'model')} />
            </span>
            <div className="inline-flex w-fit flex-wrap items-center rounded-[10px] bg-[#e9ebe9] p-[3px]">
              {MODELS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setField('model', option)}
                  disabled={busy}
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
              <span className={labelClass}>
                {rateLabel}
                <InheritanceBadge
                  state={getCommissionInheritanceState(inheritance, rateInheritancePath)}
                />
              </span>
              <input
                className={inputClass}
                value={form.rate}
                disabled={busy}
                onChange={(e) => setField('rate', e.target.value)}
              />
              <p className={hintClass}>{rateHint}</p>
            </label>
            <label className="block min-w-0">
              <span className={labelClass}>VAT on commission</span>
              <input className={readOnlyInputClass} value={form.vatOnCommission} readOnly />
              <p className={hintClass}>Bahrain standard rate — not editable</p>
            </label>
            <label className="block min-w-0">
              <span className={labelClass}>Currency</span>
              <input className={readOnlyInputClass} value={form.currency} readOnly />
              <p className={hintClass}>
                Governs every amount on this vendor — fees, contributions and payouts.
              </p>
            </label>
          </div>

          <div>
            <h3 className="text-[14px] font-bold text-[#17231c]">Online gateway fees</h3>
            <p className="mt-1 text-[12px] leading-[16px] text-[#7c8780]">
              Charged by the payment gateway. The rate applied depends on the method the customer
              paid with.
            </p>

            <div className="mt-3 grid grid-cols-3 gap-3 max-[520px]:grid-cols-1">
              {GATEWAY_FIELDS.map(([key, label, hint]) => (
                <label key={key} className="block min-w-0">
                  <span className={labelClass}>
                    {label}
                    <InheritanceBadge
                      state={getCommissionInheritanceState(inheritance, `gatewayFees.${key}`)}
                    />
                  </span>
                  <input
                    className={inputClass}
                    value={form[key]}
                    disabled={busy}
                    onChange={(e) => setField(key, e.target.value)}
                  />
                  <p className={hintClass}>{hint}</p>
                </label>
              ))}
              <label className="col-span-3 block min-w-0 max-[520px]:col-span-1">
                <span className={labelClass}>
                  Fixed charge / transaction (BHD)
                  <InheritanceBadge
                    state={getCommissionInheritanceState(inheritance, 'gatewayFees.fixedCharge')}
                  />
                </span>
                <input
                  className={inputClass}
                  value={form.fixedCharge}
                  disabled={busy}
                  onChange={(e) => setField('fixedCharge', e.target.value)}
                />
                <p className={hintClass}>
                  Flat amount added once per online transaction, whatever the order value.
                </p>
              </label>
            </div>
          </div>

          <div>
            <h3 className="text-[14px] font-bold text-[#17231c]">
              Custom fees
              <InheritanceBadge state={getCommissionInheritanceState(inheritance, 'customFees')} />
            </h3>
            <p className="mt-1 text-[12px] leading-[16px] text-[#7c8780]">
              Optional extra fees, added per vendor. Each is either a flat amount or a percentage of
              the items value. Never shown to the customer.
            </p>

            <div className="mt-3 flex flex-wrap items-end gap-2.5">
              <label className="min-w-[160px] flex-1">
                <span className={labelClass}>Fee name</span>
                <input
                  className={inputClass}
                  value={feeDraft.name}
                  disabled={busy}
                  placeholder="e.g. Packaging fee"
                  onChange={(e) => setFeeDraft((prev) => ({ ...prev, name: e.target.value }))}
                />
              </label>
              <label className="w-[110px]">
                <span className={labelClass}>Amount / value</span>
                <input
                  className={inputClass}
                  value={feeDraft.amount}
                  disabled={busy}
                  onChange={(e) => setFeeDraft((prev) => ({ ...prev, amount: e.target.value }))}
                />
              </label>
              <div>
                <span className={labelClass}>Type</span>
                <div className="flex rounded-[8px] bg-[#e9ebe9] p-[3px]">
                  {['BHD', '%'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      disabled={busy}
                      onClick={() => setFeeDraft((prev) => ({ ...prev, type }))}
                      className={cn(
                        'h-[34px] rounded-[6px] px-3 text-[12px]',
                        feeDraft.type === type
                          ? 'bg-white font-bold text-[#17231c] shadow-[0_1px_2px_rgba(20,40,28,.08)]'
                          : 'font-medium text-[#69756d]',
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={addCustomFee}
                className="inline-flex h-[40px] items-center rounded-[8px] bg-[#1aa054] px-4 text-[13px] font-medium text-white hover:bg-[#158a47] disabled:opacity-60"
              >
                Add fee
              </button>
            </div>

            <div className="mt-3 space-y-2">
              {form.customFees.length === 0 ? (
                <p className="text-[12px] text-[#8a948e]">No custom fees</p>
              ) : (
                form.customFees.map((fee) => (
                  <div
                    key={fee.id}
                    className="flex h-[40px] items-center gap-3 rounded-[8px] border border-[#dceee3] bg-[#f3faf5] px-3.5"
                  >
                    <span className="min-w-0 flex-1 truncate text-[13px] text-[#17231c]">
                      {fee.name}
                    </span>
                    <span className="shrink-0 text-[13px] font-bold text-[#1aa054]">
                      {fee.type === '%' ? `${fee.amount} %` : `BHD ${fee.amount}`}
                    </span>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          customFees: prev.customFees.filter((item) => item.id !== fee.id),
                        }))
                      }
                      className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-[16px] text-[#9aa49d] hover:bg-[#e4f3ea]"
                      aria-label={`Remove ${fee.name}`}
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {displayError ? (
            <p className="text-[12px] text-[#d64044]">
              {displayError.message || 'Failed to save commission.'}
            </p>
          ) : null}
        </div>

        <div className="flex items-center gap-5 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="inline-flex h-[36px] items-center rounded-full border border-[#e4e8e4] bg-white px-4.5 py-2.5 text-[13px] font-medium text-[#17231c] hover:bg-[#f6f8f6] disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={busy}
            className="inline-flex h-[36px] items-center rounded-full bg-[#1aa054] px-4.5 py-2.5 text-[13px] font-bold text-white hover:bg-[#158a47] disabled:opacity-60"
          >
            {busy ? 'Saving…' : 'Save commission'}
          </button>
        </div>
      </div>
    </div>
  )
}
