import { useEffect, useMemo, useState } from 'react'
import AdminCommissionEditModal from '../AdminCommissionEditModal'
import {
  COMMISSION_ORDER_METHODS,
  commissionOrderMethodsForServiceLabels,
  getCommissionInheritanceState,
} from '../../../mappers/admin/mapAdminVendorCommission'

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
  enabledServiceLabels = null,
  onSaveCommission,
  isSaving = false,
  saveError = null,
}) {
  const [commission, setCommission] = useState(initialCommission)
  const [editOpen, setEditOpen] = useState(false)
  const [methodId, setMethodId] = useState('delivery')

  const visibleOrderMethods = useMemo(() => {
    if (Array.isArray(enabledServiceLabels)) {
      return commissionOrderMethodsForServiceLabels(enabledServiceLabels)
    }
    return COMMISSION_ORDER_METHODS
  }, [enabledServiceLabels])

  useEffect(() => {
    setCommission(initialCommission)
  }, [initialCommission])

  useEffect(() => {
    if (!visibleOrderMethods.length) return
    if (!visibleOrderMethods.some((method) => method.id === methodId)) {
      setMethodId(visibleOrderMethods[0].id)
    }
  }, [visibleOrderMethods, methodId])

  if (!commission) return null

  const methods =
    commission.methods && typeof commission.methods === 'object'
      ? commission.methods
      : Object.fromEntries(COMMISSION_ORDER_METHODS.map((method) => [method.id, commission]))
  const active = methods[methodId] || commission
  const inheritance = active.inheritance || commission.inheritance || null
  const seeded = Boolean(active.seededFromStoreType ?? commission.seededFromStoreType)
  const isFlat = active.model === 'Flat per order' || active.modelCode === 'FLAT_PER_ORDER'
  const ratePath = isFlat ? 'flatFeePerOrder' : 'commissionRate'
  const rateLabel = isFlat ? 'Flat fee per order' : 'Commission rate'

  const gateway = active.gatewayFees || {}
  const gatewayRows = [
    ['Fixed %', gateway.fixedPct, 'gatewayFees.fixedPct'],
    ['Debit %', gateway.debitPct, 'gatewayFees.debitPct'],
    ['Credit %', gateway.creditPct, 'gatewayFees.creditPct'],
    ['Apple Pay %', gateway.applePayPct, 'gatewayFees.applePayPct'],
    ['Google Wallet %', gateway.googleWalletPct, 'gatewayFees.googleWalletPct'],
    ['Other charges %', gateway.otherChargesPct, 'gatewayFees.otherChargesPct'],
    ['Fixed charge / transaction (BHD)', gateway.fixedCharge, 'gatewayFees.fixedCharge'],
  ]

  const customFeeLines = (Array.isArray(active.customFees) ? active.customFees : [])
    .map(formatCustomFee)
    .filter(Boolean)

  const summaryRows = [
    ['Model', active.model, 'model'],
    [rateLabel, active.rate, ratePath],
    ['VAT on commission', active.vatOnCommission || '—', null],
    ['Currency', active.currency || commission.currency || '—', null],
  ]

  return (
    <>
      <section className="rounded-[14px] border border-[#eceeec] bg-white px-5 py-5 shadow-[0_1px_2px_rgba(20,40,28,.03)]">
        <h3 className="mb-1 text-[15px] font-bold text-[#17231c]">Commission &amp; fees</h3>
        <p className="mb-3 text-[12px] text-[#7c8780]">
          Set separately for each order method enabled for this vendor. VAT stays the shared
          Bahrain rate.
        </p>
        {!visibleOrderMethods.length ? (
          <p className="mb-3 text-[12px] text-[#d64044]">
            No order methods are enabled for this vendor. Turn on service modes on the SLA tab
            first.
          </p>
        ) : (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {visibleOrderMethods.map((method) => (
              <button
                key={method.id}
                type="button"
                onClick={() => setMethodId(method.id)}
                className={cn(
                  'h-[30px] rounded-full px-3 text-[12px]',
                  methodId === method.id
                    ? 'bg-[#1aa054] font-bold text-white'
                    : 'bg-[#f3f5f3] font-medium text-[#455249]',
                )}
              >
                {methods[method.id]?.label || method.label}
              </button>
            ))}
          </div>
        )}

        {visibleOrderMethods.length > 0 && seeded && storeTypeName ? (
          <div className="mt-3 rounded-[8px] border border-[#b7e4c7] bg-[#e8f7ed] px-3 py-2 text-[12px] leading-[16px] text-[#147940]">
            ✓ Pre-filled from <strong>{storeTypeName}</strong> commission defaults (store type
            inherits <strong>SLA → Delivery &amp; fees</strong> unless overridden). Edit any field
            to override for this vendor.
          </div>
        ) : null}

        {visibleOrderMethods.length > 0 ? (
        <>
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
        </>
        ) : null}
      </section>

      <AdminCommissionEditModal
        open={editOpen}
        commission={active}
        methodLabel={visibleOrderMethods.find((method) => method.id === methodId)?.label}
        storeTypeName={storeTypeName}
        saving={isSaving}
        error={saveError}
        onClose={() => setEditOpen(false)}
        onSave={async (updated) => {
          const mergedMethods = {
            ...methods,
            [methodId]: {
              ...(methods[methodId] || commission),
              ...updated,
            },
          }
          const allowedIds = new Set(visibleOrderMethods.map((item) => item.id))
          const filteredMethods = Object.fromEntries(
            Object.entries(mergedMethods).filter(([key]) => allowedIds.has(key)),
          )
          const next = {
            ...commission,
            methods: filteredMethods,
          }
          if (!onSaveCommission) {
            setCommission(next)
            setEditOpen(false)
            return
          }
          const saved = await onSaveCommission(next)
          if (saved) setCommission(saved)
          setEditOpen(false)
        }}
      />
    </>
  )
}
