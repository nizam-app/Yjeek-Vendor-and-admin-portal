import { useEffect, useState } from 'react'
import { AdminVendorCommission } from './AdminVendorCommission'
import { mapAdminUpdateVendorCommissionRequest } from '../../../mappers/admin/mapAdminVendorCommission'
import { mapStoreTypeCommissionDefaultsResponse } from '../../../mappers/admin/mapStoreTypeCommissionDefaults'
import { adminService } from '../../../services/adminService'

export default function AdminStoreTypeCommissionSection({
  storeTypeId,
  commission: initialCommission,
  sectionInheritance = 'empty',
  onInheritanceChange,
  disabled = false,
}) {
  const [commission, setCommission] = useState(initialCommission)
  const [inheritance, setInheritance] = useState(sectionInheritance)
  const [saving, setSaving] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    setCommission(initialCommission)
    setInheritance(sectionInheritance)
  }, [initialCommission, sectionInheritance])

  const inherited = inheritance === 'inherited'
  const sourceLabel = inherited ? 'SLA platform defaults' : 'this store type'

  function applyApiPayload(data) {
    const mapped = mapStoreTypeCommissionDefaultsResponse(data)
    setCommission(mapped.commission)
    setInheritance(mapped.sectionInheritance)
    onInheritanceChange?.(mapped.sectionInheritance)
  }

  async function handleSave(updated) {
    if (!storeTypeId) return updated
    setSaving(true)
    setError(null)
    try {
      const body = { commission: mapAdminUpdateVendorCommissionRequest(updated) }
      const result = await adminService.updateAdminStoreTypeCommissionDefaults(storeTypeId, body)
      applyApiPayload(result?.data)
      const mapped = mapStoreTypeCommissionDefaultsResponse(result?.data)
      return mapped.commission || updated
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setSaving(false)
    }
  }

  async function handleReset() {
    if (!storeTypeId) return
    setResetting(true)
    setError(null)
    try {
      const result = await adminService.resetAdminStoreTypeCommissionDefaults(storeTypeId)
      applyApiPayload(result?.data)
    } catch (err) {
      setError(err?.message || 'Failed to reset commission defaults.')
    } finally {
      setResetting(false)
    }
  }

  if (!commission) {
    return (
      <section className="rounded-[14px] border border-[#eceeec] bg-white px-5 py-5 shadow-[0_1px_2px_rgba(20,40,28,.03)]">
        <h3 className="text-[15px] font-bold text-[#17231c]">Commission &amp; fees</h3>
        <p className="mt-2 text-[12.5px] text-[#7c8780]">
          No commission defaults yet. Set values under SLA → Delivery &amp; fees, or configure here.
        </p>
        <button
          type="button"
          disabled={disabled || !storeTypeId}
          onClick={() =>
            setCommission({
              model: '% of order',
              modelCode: 'PERCENT_OF_ORDER',
              rate: '15%',
              commissionRate: 15,
              gatewayFees: {},
              customFees: [],
              currency: 'BHD',
              vatOnCommission: '10% (auto)',
              seededFromStoreType: inherited,
            })
          }
          className="mt-3 inline-flex h-[34px] items-center rounded-full border border-[#1aa054] px-4 text-[12px] font-bold text-[#1aa054] disabled:opacity-50"
        >
          Configure commission
        </button>
      </section>
    )
  }

  return (
    <div className="space-y-3">
      {inherited ? (
        <div className="rounded-[12px] border border-[#d4e8dc] bg-[#f0faf4] px-4 py-3 text-[12.5px] text-[#2d5a40]">
          Inherited from <strong>SLA platform defaults</strong>. Edit any field to override for this
          store type; new vendors copy the effective values.
        </div>
      ) : inheritance === 'overridden' ? (
        <div className="rounded-[12px] border border-[#e8e0c8] bg-[#fffbf0] px-4 py-3 text-[12.5px] text-[#6b5a2e]">
          Custom commission for this store type (overrides SLA platform defaults).
        </div>
      ) : null}

      <AdminVendorCommission
        commission={commission}
        storeTypeName={sourceLabel}
        onSaveCommission={handleSave}
        isSaving={saving}
        saveError={error}
      />

      {storeTypeId && inheritance === 'overridden' ? (
        <button
          type="button"
          disabled={disabled || resetting || saving}
          onClick={() => void handleReset()}
          className="inline-flex h-[34px] items-center rounded-full border border-[#e4e8e4] bg-white px-4 text-[12px] font-bold text-[#455249] hover:bg-[#f8faf8] disabled:opacity-60"
        >
          {resetting ? 'Resetting…' : 'Reset to SLA platform defaults'}
        </button>
      ) : null}
    </div>
  )
}
