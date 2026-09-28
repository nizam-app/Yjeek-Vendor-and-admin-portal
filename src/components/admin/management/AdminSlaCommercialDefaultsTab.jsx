import { useCallback, useEffect, useState } from 'react'
import AdminStoreTypeHotFoodDefaults, {
  buildHotFoodDefaultsPayload,
  hotFoodSeedMissingMessage,
} from './AdminStoreTypeHotFoodDefaults'
import AdminScheduledFeesPanel from './AdminScheduledFeesPanel'
import {
  buildScheduledFeesPayload,
  normalizeScheduledFees,
  scheduledFreeDeliveryMissingMessage,
} from './scheduledFeesForm'
import { AdminVendorCommission } from './AdminVendorCommission'
import { ApiErrorBanner } from '../ApiState'
import { cn } from '../cn'
import { useApiMutation } from '../../../hooks/useApiMutation'
import { adminSlaModelsService } from '../../../services/admin/slaModelsService'
import { mapPlatformCommercialDefaultsToForm } from '../../../mappers/admin/mapPlatformCommercialDefaults'
import { mapAdminUpdateVendorCommissionRequest } from '../../../mappers/admin/mapAdminVendorCommission'

function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-6 w-11 shrink-0 rounded-full transition',
        checked ? 'bg-[#1aa054]' : 'bg-[#d0d5d1]',
        disabled && 'opacity-50',
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition',
          checked && 'translate-x-5',
        )}
      />
    </button>
  )
}

function Card({ title, subtitle, children }) {
  return (
    <section className="rounded-[14px] border border-[#eceeec] bg-white p-5 shadow-[0_1px_2px_rgba(20,40,28,.03)]">
      <div className="mb-4">
        <h3 className="text-[15px] font-bold text-[#17231c]">{title}</h3>
        {subtitle ? <p className="mt-1 text-[12px] text-[#7c8780]">{subtitle}</p> : null}
      </div>
      {children}
    </section>
  )
}

export default function AdminSlaCommercialDefaultsTab() {
  const [allowedVehicles, setAllowedVehicles] = useState({ bike: true, car: true })
  const [hotFood, setHotFood] = useState(null)
  const [scheduledFees, setScheduledFees] = useState(null)
  const [commission, setCommission] = useState(null)
  const [loadError, setLoadError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saveMessage, setSaveMessage] = useState(null)
  const [commissionSaveError, setCommissionSaveError] = useState(null)

  const { mutate: saveAll, isLoading: saving, error: saveError, reset: resetSave } = useApiMutation(
    (body) => adminSlaModelsService.updateCommercialDefaults(body),
  )

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const result = await adminSlaModelsService.getCommercialDefaults()
      const form = mapPlatformCommercialDefaultsToForm(result?.data)
      setAllowedVehicles(form.allowedVehicles)
      setHotFood(form.hotFood)
      setScheduledFees(form.scheduledFees)
      setCommission(form.commission)
    } catch (err) {
      setLoadError(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function handleSaveCommission(updated) {
    setCommissionSaveError(null)
    const commissionBody = mapAdminUpdateVendorCommissionRequest(updated)
    const payload = { commission: commissionBody }
    const result = await saveAll(payload)
    const form = mapPlatformCommercialDefaultsToForm(result?.data)
    setCommission(form.commission)
    setSaveMessage('Commission defaults saved.')
    return form.commission
  }

  async function handleSaveDeliveryFees() {
    setSaveMessage(null)
    resetSave()
    const feeError = hotFoodSeedMissingMessage(hotFood)
    if (feeError) {
      throw new Error(feeError)
    }
    const scheduledError = scheduledFreeDeliveryMissingMessage(scheduledFees)
    if (scheduledError) {
      throw new Error(scheduledError)
    }
    if (!allowedVehicles.bike && !allowedVehicles.car) {
      throw new Error('At least one allowed vehicle (Bike or Car) must stay enabled.')
    }
    const body = {
      allowedVehicles: {
        bike: Boolean(allowedVehicles.bike),
        car: Boolean(allowedVehicles.car),
      },
      hotFoodOnDemand: buildHotFoodDefaultsPayload(hotFood),
      scheduled: buildScheduledFeesPayload(scheduledFees),
    }
    const result = await saveAll(body)
    const form = mapPlatformCommercialDefaultsToForm(result?.data)
    setAllowedVehicles(form.allowedVehicles)
    setHotFood(form.hotFood)
    setScheduledFees(form.scheduledFees)
    setSaveMessage('Platform delivery fee defaults saved. Store types inherit until overridden.')
  }

  function toggleVehicle(key) {
    setAllowedVehicles((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  if (loading && !hotFood) {
    return <p className="text-[13px] text-[#7c8780]">Loading platform delivery &amp; fee defaults…</p>
  }

  return (
    <div className="space-y-4 pb-8">
      <div className="rounded-[12px] border border-[#d4e8dc] bg-[#f0faf4] px-4 py-3 text-[12.5px] text-[#2d5a40]">
        These are <strong>global defaults</strong> for the commercial hierarchy: SLA platform → store
        type → vendor. Timing SLAs on other tabs are unchanged. Saving here does not alter existing
        vendors until they reset or you change store-type overrides.
      </div>

      <ApiErrorBanner error={loadError} onRetry={() => void load()} />
      {saveError?.message ? (
        <div className="rounded-[10px] border border-[#f2cccc] bg-[#fff5f5] px-3 py-2 text-[12.5px] text-[#a93e42]">
          {saveError.message}
        </div>
      ) : null}
      {saveMessage ? <p className="text-[13px] text-[#147940]">{saveMessage}</p> : null}

      <div className="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={() => void load()}
          disabled={saving || loading}
          className="inline-flex h-[34px] items-center rounded-full border border-[#e4e8e4] bg-white px-4 text-[12px] font-bold text-[#455249] hover:bg-[#f8faf8] disabled:opacity-60"
        >
          Reload
        </button>
        <button
          type="button"
          onClick={() => void handleSaveDeliveryFees().catch(() => undefined)}
          disabled={saving || loading}
          className="inline-flex h-[34px] items-center rounded-full bg-[#1aa054] px-4 text-[12px] font-bold text-white hover:bg-[#158a47] disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save delivery defaults'}
        </button>
      </div>

      <Card
        title="Allowed vehicles"
        subtitle="Store types and vendors may narrow this list, never widen it."
      >
        <div className="flex w-fit flex-col gap-2.5">
          <div className="flex items-center justify-between gap-3 rounded-[12px] bg-[#f3f5f3] px-4 py-3">
            <span className="text-[13px] font-medium text-[#17231c]">Bike</span>
            <Toggle
              checked={Boolean(allowedVehicles.bike)}
              onChange={() => toggleVehicle('bike')}
              disabled={saving}
            />
          </div>
          <div className="flex items-center justify-between gap-3 rounded-[12px] bg-[#f3f5f3] px-4 py-3">
            <span className="text-[13px] font-medium text-[#17231c]">Car</span>
            <Toggle
              checked={Boolean(allowedVehicles.car)}
              onChange={() => toggleVehicle('car')}
              disabled={saving}
            />
          </div>
        </div>
      </Card>

      <Card
        title="Hot food — on demand delivery fees"
        subtitle="Default vendor + customer fee inputs for hot food on-demand (store types inherit)."
      >
        <AdminStoreTypeHotFoodDefaults
          value={hotFood}
          onChange={setHotFood}
          disabled={saving}
        />
      </Card>

      <Card
        title="Scheduled delivery fees"
        subtitle="Flat rates per speed tier and item class — inherited by store types."
      >
        <AdminScheduledFeesPanel
          value={scheduledFees}
          onChange={setScheduledFees}
          disabled={saving}
        />
      </Card>

      <Card
        title="Commission & other fees"
        subtitle="Default commission model, gateway fees, and custom fees for new store types and vendors."
      >
        {commission ? (
          <AdminVendorCommission
            commission={commission}
            storeTypeName="SLA platform defaults"
            onSaveCommission={handleSaveCommission}
            isSaving={saving}
            saveError={commissionSaveError}
          />
        ) : (
          <p className="text-[12.5px] text-[#7c8780]">
            No commission defaults yet. Use Edit to set platform commission and gateway fees.
          </p>
        )}
        {!commission ? (
          <button
            type="button"
            disabled={saving}
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
              })
            }
            className="mt-3 inline-flex h-[34px] items-center rounded-full border border-[#1aa054] px-4 text-[12px] font-bold text-[#1aa054]"
          >
            Set commission defaults
          </button>
        ) : null}
      </Card>
    </div>
  )
}
