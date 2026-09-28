import { useEffect, useState } from 'react'
import AdminCommissionEditModal from '../AdminCommissionEditModal'
import { getCommissionInheritanceState } from '../../../mappers/admin/mapAdminVendorCommission'

const cn = (...parts) => parts.filter(Boolean).join(' ')

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

function formatCustomFee(fee) {
  if (!fee || typeof fee !== 'object') return null
  const name = String(fee.name || '').trim()
  if (!name) return null
  const amount = fee.amount != null ? Number(fee.amount) : NaN
  const typeRaw = String(fee.type || 'BHD').toUpperCase()
  const isPct = typeRaw === '%' || typeRaw === 'PERCENT' || typeRaw === 'PCT'
  const value = Number.isFinite(amount)
    ? isPct
      ? `${amount} %`
      : `BHD ${amount.toFixed(3)}`
    : String(fee.amount ?? '')
  return `${name} · ${value}`
}

export function AdminVendorCommission({
  commission: initialCommission,
  storeTypeName = '',
  onSaveCommission,
  isSaving = false,
  saveError = null,
}) {
  const [commission, setCommission] = useState(initialCommission)
  const [editOpen, setEditOpen] = useState(false)

  useEffect(() => {
    setCommission(initialCommission)
  }, [initialCommission])

  if (!commission) return null

  const inheritance = commission.inheritance || null
  const seeded = Boolean(commission.seededFromStoreType)
  const isFlat = commission.model === 'Flat per order' || commission.modelCode === 'FLAT_PER_ORDER'
  const ratePath = isFlat ? 'flatFeePerOrder' : 'commissionRate'
  const rateLabel = isFlat ? 'Flat fee per order' : 'Commission rate'

  const gateway = commission.gatewayFees || {}
  const gatewayRows = [
    ['Fixed %', gateway.fixedPct, 'gatewayFees.fixedPct'],
    ['Debit %', gateway.debitPct, 'gatewayFees.debitPct'],
    ['Credit %', gateway.creditPct, 'gatewayFees.creditPct'],
    ['Apple Pay %', gateway.applePayPct, 'gatewayFees.applePayPct'],
    ['Google Wallet %', gateway.googleWalletPct, 'gatewayFees.googleWalletPct'],
    ['Other charges %', gateway.otherChargesPct, 'gatewayFees.otherChargesPct'],
    ['Fixed charge / transaction (BHD)', gateway.fixedCharge, 'gatewayFees.fixedCharge'],
  ]

  const customFeeLines = (Array.isArray(commission.customFees) ? commission.customFees : [])
    .map(formatCustomFee)
    .filter(Boolean)

  const summaryRows = [
    ['Model', commission.model, 'model'],
    [rateLabel, commission.rate, ratePath],
    ['VAT on commission', commission.vatOnCommission || '10% (auto)', null],
    ['Currency', 'BHD', null],
  ]

  return (
    <>
      <section className="rounded-[14px] border border-[#eceeec] bg-white px-5 py-5 shadow-[0_1px_2px_rgba(20,40,28,.03)]">
        <h3 className="mb-1 text-[15px] font-bold text-[#17231c]">Commission &amp; fees</h3>

        {seeded && storeTypeName ? (
          <div className="mt-3 rounded-[8px] border border-[#b7e4c7] bg-[#e8f7ed] px-3 py-2 text-[12px] leading-[16px] text-[#147940]">
            ✓ Pre-filled from <strong>{storeTypeName}</strong> commission defaults (store type
            inherits <strong>SLA → Delivery &amp; fees</strong> unless overridden). Edit any field
            to override for this vendor.
          </div>
        ) : null}

        <div className="mt-3">
          {summaryRows.map(([label, value, path]) => (
            <div
              key={label}
              className="flex items-center gap-6 border-b border-[#f0f2f0] py-3.5 last:border-0 last:pb-0"
            >
              <span className="flex-1 text-[12.5px] text-[#7c8780]">
                {label}
                <InheritanceBadge state={getCommissionInheritanceState(inheritance, path)} />
              </span>
              <span className="flex-1 text-[13px] font-medium text-[#17231c]">{value}</span>
            </div>
          ))}
        </div>

        <div className="mt-5 border-t border-[#f0f2f0] pt-4">
          <h4 className="text-[13px] font-bold text-[#17231c]">Online gateway fees</h4>
          <p className="mt-0.5 text-[11px] leading-[14px] text-[#8a948e]">
            Charged by the payment gateway. Cash orders incur zero gateway fees.
          </p>
          <div className="mt-2">
            {gatewayRows.map(([label, value, path]) => (
              <div
                key={label}
                className="flex items-center gap-6 border-b border-[#f0f2f0] py-2.5 last:border-0"
              >
                <span className="flex-1 text-[12.5px] text-[#7c8780]">
                  {label}
                  <InheritanceBadge state={getCommissionInheritanceState(inheritance, path)} />
                </span>
                <span className="flex-1 text-[13px] font-medium text-[#17231c]">
                  {value || '—'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 border-t border-[#f0f2f0] pt-4">
          <h4 className="text-[13px] font-bold text-[#17231c]">
            Custom fees
            <InheritanceBadge state={getCommissionInheritanceState(inheritance, 'customFees')} />
          </h4>
          <p className="mt-0.5 text-[11px] leading-[14px] text-[#8a948e]">
            Internal only — never shown to the customer.
          </p>
          {customFeeLines.length === 0 ? (
            <p className="mt-2 text-[12px] text-[#8a948e]">No custom fees</p>
          ) : (
            <ul className="mt-2 space-y-1.5">
              {customFeeLines.map((line) => (
                <li key={line} className="text-[13px] text-[#17231c]">
                  {line}
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          type="button"
          onClick={() => setEditOpen(true)}
          className="mt-5 inline-flex h-[36px] items-center rounded-full border border-[#cfe8d8] bg-white px-4 text-[13px] font-medium text-[#1aa054] shadow-[0_1px_2px_rgba(20,40,28,.04)] hover:bg-[#f3faf5]"
        >
          Edit commission
        </button>
      </section>

      <AdminCommissionEditModal
        open={editOpen}
        commission={commission}
        storeTypeName={storeTypeName}
        saving={isSaving}
        error={saveError}
        onClose={() => setEditOpen(false)}
        onSave={async (updated) => {
          if (!onSaveCommission) {
            setCommission(updated)
            setEditOpen(false)
            return
          }
          const saved = await onSaveCommission(updated)
          if (saved) setCommission(saved)
          setEditOpen(false)
        }}
      />
    </>
  )
}
