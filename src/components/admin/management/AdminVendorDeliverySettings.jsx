/**
 * Vendor › Delivery details — template + push-to-branches
 * (OG §09 / D02 Batch 5 + D06 Batch 3 + D07 Batch 3).
 *
 * Template only: live checkout reads each branch after push (never this vendor row).
 * Hot-food + scheduled fee grids + driver rates (on-demand + separate bike/car scheduled).
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { formatApiErrorMessage } from '../../../api/errors'
import { adminService } from '../../../services/adminService'
import { cn } from '../cn'
import AdminStoreTypeHotFoodDefaults, {
  EMPTY_HOT_FOOD_DEFAULTS,
  buildHotFoodDefaultsPayload,
  extractHotFoodFieldMeta,
  normalizeHotFoodDefaults,
} from './AdminStoreTypeHotFoodDefaults'
import AdminScheduledFeesPanel, {
  EMPTY_SCHEDULED_FEES,
  buildScheduledFeesPayload,
  extractScheduledFieldMeta,
  normalizeScheduledFees,
} from './AdminScheduledFeesPanel'
import AdminDriverRatesPanel, {
  EMPTY_DRIVER_RATES,
  buildDriverRatesPayload,
  extractDriverRatesFieldMeta,
  normalizeDriverRates,
} from './AdminDriverRatesPanel'

function applyServerPayload(data, setters) {
  const {
    setStoreTypeName,
    setHasStoredTemplate,
    setHotFoodForm,
    setHotFoodFieldMeta,
    setScheduledForm,
    setScheduledFieldMeta,
    setDriverRatesForm,
    setDriverRatesFieldMeta,
    setCheckoutSource,
  } = setters
  setStoreTypeName(data?.storeTypeName || null)
  setHasStoredTemplate(Boolean(data?.hasStoredTemplate))
  setCheckoutSource(data?.checkoutSource || 'branch')
  if (data?.hotFoodOnDemand) {
    setHotFoodForm(normalizeHotFoodDefaults(data.hotFoodOnDemand))
    setHotFoodFieldMeta(extractHotFoodFieldMeta(data.hotFoodOnDemand))
  } else {
    setHotFoodForm(EMPTY_HOT_FOOD_DEFAULTS)
    setHotFoodFieldMeta(null)
  }
  if (data?.scheduled) {
    setScheduledForm(normalizeScheduledFees(data.scheduled))
    setScheduledFieldMeta(extractScheduledFieldMeta(data.scheduled))
  } else {
    setScheduledForm(EMPTY_SCHEDULED_FEES)
    setScheduledFieldMeta(null)
  }
  if (data?.driverRates) {
    setDriverRatesForm(normalizeDriverRates(data.driverRates))
    setDriverRatesFieldMeta(extractDriverRatesFieldMeta(data.driverRates))
  } else {
    setDriverRatesForm(EMPTY_DRIVER_RATES)
    setDriverRatesFieldMeta(null)
  }
}

function PushConfirmModal({
  open,
  branchCount,
  pushing,
  error,
  onCancel,
  onConfirm,
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="vendor-push-delivery-title"
        className="w-full max-w-[440px] rounded-[14px] border border-[#eceeec] bg-white shadow-[0_8px_30px_rgba(20,40,28,.18)]"
      >
        <div className="border-b border-[#eceeec] px-5 py-4">
          <h4 id="vendor-push-delivery-title" className="text-[15px] font-bold text-[#17231c]">
            Apply delivery settings to all branches?
          </h4>
        </div>
        <div className="space-y-3 px-5 py-4 text-[13px] leading-[18px] text-[#5c665f]">
          <p>
            This overwrites <strong className="font-semibold text-[#17231c]">every</strong> delivery
            and fee field on all <strong className="font-semibold text-[#17231c]">{branchCount}</strong>{' '}
            active branch{branchCount === 1 ? '' : 'es'} with this vendor template.
          </p>
          <p>
            Branch overrides are replaced. Legacy branches are migrated to v1 pricing. Live checkout
            continues to read each <strong className="font-semibold text-[#17231c]">branch</strong>
            — not this vendor template.
          </p>
          {error ? (
            <p className="rounded-[8px] border border-[#f5c2c0] bg-[#fdecea] px-3 py-2 text-[12px] text-[#b42318]">
              {error}
            </p>
          ) : null}
        </div>
        <div className="flex justify-end gap-2 border-t border-[#eceeec] px-5 py-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={pushing}
            className="inline-flex h-[34px] items-center rounded-full border border-[rgba(0,0,0,0.1)] bg-white px-4 text-[12px] font-bold text-[#5c665f] hover:bg-[#f7f8f7] disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pushing}
            className="inline-flex h-[34px] items-center rounded-full bg-[#2E9E4D] px-4 text-[12px] font-bold text-white hover:bg-[#158a47] disabled:opacity-60"
          >
            {pushing ? 'Pushing…' : 'Confirm overwrite'}
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * @param {{
 *   vendorId: string,
 *   storeName?: string,
 *   branchCount?: number,
 *   canEdit?: boolean,
 * }} props
 */
export default function AdminVendorDeliverySettings({
  vendorId,
  storeName = '',
  branchCount = 0,
  canEdit = true,
}) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [pushing, setPushing] = useState(false)
  const [error, setError] = useState(null)
  const [saveOk, setSaveOk] = useState(false)
  const [pushOk, setPushOk] = useState(null)
  const [storeTypeName, setStoreTypeName] = useState(null)
  const [hasStoredTemplate, setHasStoredTemplate] = useState(false)
  const [checkoutSource, setCheckoutSource] = useState('branch')
  const [hotFoodForm, setHotFoodForm] = useState(EMPTY_HOT_FOOD_DEFAULTS)
  const [hotFoodFieldMeta, setHotFoodFieldMeta] = useState(null)
  const [scheduledForm, setScheduledForm] = useState(EMPTY_SCHEDULED_FEES)
  const [scheduledFieldMeta, setScheduledFieldMeta] = useState(null)
  const [driverRatesForm, setDriverRatesForm] = useState(EMPTY_DRIVER_RATES)
  const [driverRatesFieldMeta, setDriverRatesFieldMeta] = useState(null)
  const [dirtyHotFood, setDirtyHotFood] = useState(false)
  const [dirtyScheduled, setDirtyScheduled] = useState(false)
  const [dirtyDriverRates, setDirtyDriverRates] = useState(false)
  const [resettingPath, setResettingPath] = useState(null)
  const [pushModalOpen, setPushModalOpen] = useState(false)
  const [pushModalError, setPushModalError] = useState(null)
  const [applyToggle, setApplyToggle] = useState(false)

  const dirtyFields = dirtyHotFood || dirtyScheduled || dirtyDriverRates

  const setters = useMemo(
    () => ({
      setStoreTypeName,
      setHasStoredTemplate,
      setHotFoodForm,
      setHotFoodFieldMeta,
      setScheduledForm,
      setScheduledFieldMeta,
      setDriverRatesForm,
      setDriverRatesFieldMeta,
      setCheckoutSource,
    }),
    [],
  )

  const load = useCallback(async () => {
    if (!vendorId) return
    setLoading(true)
    setError(null)
    try {
      const res = await adminService.getVendorDeliverySettings(vendorId)
      applyServerPayload(res?.data, setters)
      setDirtyHotFood(false)
      setDirtyScheduled(false)
      setDirtyDriverRates(false)
    } catch (err) {
      setError(formatApiErrorMessage(err, 'Failed to load vendor delivery settings.'))
    } finally {
      setLoading(false)
    }
  }, [vendorId, setters])

  useEffect(() => {
    load()
  }, [load])

  const showSeedBanner = useMemo(() => {
    if (dirtyFields) return false
    if (hasStoredTemplate && hotFoodFieldMeta) {
      for (const side of ['vendor', 'customer']) {
        const bag = hotFoodFieldMeta[side] || {}
        for (const meta of Object.values(bag)) {
          if (meta?.state === 'overridden') return false
        }
      }
    }
    return Boolean(storeTypeName) && Boolean(hotFoodForm?.vendor)
  }, [dirtyFields, hasStoredTemplate, hotFoodFieldMeta, storeTypeName, hotFoodForm])

  const onHotFoodChange = (next) => {
    setHotFoodForm(next)
    setDirtyHotFood(true)
    setSaveOk(false)
    setPushOk(null)
  }

  const onScheduledChange = (next) => {
    setScheduledForm(next)
    setDirtyScheduled(true)
    setSaveOk(false)
    setPushOk(null)
  }

  const onDriverRatesChange = (next) => {
    setDriverRatesForm(next)
    setDirtyDriverRates(true)
    setSaveOk(false)
    setPushOk(null)
  }

  const buildSaveBody = () => {
    return {
      modes: { HOT_FOOD_ON_DEMAND: { enabled: true } },
      hotFoodOnDemand: buildHotFoodDefaultsPayload(hotFoodForm),
      scheduled: buildScheduledFeesPayload(scheduledForm),
      driverRates: buildDriverRatesPayload(driverRatesForm),
    }
  }

  const handleSave = async () => {
    if (!canEdit || saving) return
    setSaving(true)
    setError(null)
    setSaveOk(false)
    try {
      const res = await adminService.updateVendorDeliverySettings(vendorId, buildSaveBody())
      applyServerPayload(res?.data, setters)
      setDirtyHotFood(false)
      setDirtyScheduled(false)
      setDirtyDriverRates(false)
      setSaveOk(true)
    } catch (err) {
      setError(formatApiErrorMessage(err, 'Failed to save vendor delivery settings.'))
    } finally {
      setSaving(false)
    }
  }

  const handleResetField = async (path) => {
    if (!canEdit || resettingPath) return
    setResettingPath(path)
    setError(null)
    setSaveOk(false)
    try {
      if (dirtyFields) {
        await adminService.updateVendorDeliverySettings(vendorId, buildSaveBody())
      }
      const res = await adminService.resetVendorDeliverySettingsField(vendorId, { path })
      applyServerPayload(res?.data, setters)
      setDirtyHotFood(false)
      setDirtyScheduled(false)
      setDirtyDriverRates(false)
    } catch (err) {
      setError(formatApiErrorMessage(err, 'Failed to reset field.'))
    } finally {
      setResettingPath(null)
    }
  }

  const openPushModal = () => {
    if (!canEdit || pushing) return
    if (dirtyFields) {
      setError('Save vendor delivery settings before pushing to branches.')
      return
    }
    if (!hasStoredTemplate) {
      setError('Save the template first, then push to branches.')
      return
    }
    setPushModalError(null)
    setPushModalOpen(true)
    setApplyToggle(true)
  }

  const closePushModal = () => {
    if (pushing) return
    setPushModalOpen(false)
    setPushModalError(null)
    setApplyToggle(false)
  }

  const handleConfirmPush = async () => {
    if (!canEdit || pushing) return
    setPushing(true)
    setPushModalError(null)
    try {
      const res = await adminService.pushVendorDeliverySettingsToBranches(vendorId, {
        confirm: true,
      })
      const count = res?.data?.pushedBranchCount ?? branchCount
      setPushOk(
        `Pushed to ${count} branch${count === 1 ? '' : 'es'}. Checkout still reads each branch.`,
      )
      setPushModalOpen(false)
      setApplyToggle(false)
    } catch (err) {
      setPushModalError(formatApiErrorMessage(err, 'Failed to push delivery settings.'))
    } finally {
      setPushing(false)
    }
  }

  return (
    <div className="rounded-[14px] border border-[#eceeec] bg-white px-5 py-5 shadow-[0_1px_2px_rgba(20,40,28,.03)]">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[15px] font-bold text-[#17231c]">Vendor delivery details</h3>
          <p className="mt-1 text-[12px] leading-[16px] text-[#7c8780]">
            {storeName ? `${storeName} · ` : ''}
            Template for push · live checkout reads the{' '}
            <span className="font-semibold text-[#17231c]">{checkoutSource}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={!canEdit || loading || saving || !dirtyFields}
          className="inline-flex h-[32px] items-center justify-center rounded-full bg-[#2E9E4D] px-4 text-[12px] font-bold text-white hover:bg-[#158a47] disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save template'}
        </button>
      </div>

      {loading ? (
        <p className="text-[12px] text-[#7c8780]">Loading vendor delivery settings…</p>
      ) : null}

      {error ? (
        <div className="mb-3 rounded-[8px] border border-[#f5c2c0] bg-[#fdecea] px-3 py-2 text-[12px] leading-[16px] text-[#b42318]">
          {error}
        </div>
      ) : null}

      {saveOk ? (
        <div className="mb-3 rounded-[8px] border border-[#b7e4c7] bg-[#e8f7ed] px-3 py-2 text-[12px] leading-[16px] text-[#147940]">
          Vendor template saved.
        </div>
      ) : null}

      {pushOk ? (
        <div className="mb-3 rounded-[8px] border border-[#b7e4c7] bg-[#e8f7ed] px-3 py-2 text-[12px] leading-[16px] text-[#147940]">
          {pushOk}
        </div>
      ) : null}

      {showSeedBanner && storeTypeName ? (
        <div className="mb-3 rounded-[8px] border border-[#b7e4c7] bg-[#e8f7ed] px-3 py-2 text-[12px] leading-[16px] text-[#147940]">
          ✓ Pre-filled from the <strong>{storeTypeName}</strong> delivery settings. Edit any field
          to override it for this vendor.
        </div>
      ) : null}

      <AdminStoreTypeHotFoodDefaults
        value={hotFoodForm}
        onChange={onHotFoodChange}
        disabled={!canEdit || loading || saving || pushing}
        fieldMeta={hotFoodFieldMeta}
        onResetField={hasStoredTemplate ? handleResetField : undefined}
        resettingPath={resettingPath}
      />

      <div className="mt-5 border-t border-[#f0f2f0] pt-4">
        <div className="mb-3">
          <h4 className="text-[14px] font-bold text-[#17231c]">Scheduled fees</h4>
          <p className="mt-0.5 text-[12px] leading-[16px] text-[#7c8780]">
            Flat rates per speed tier and item class. No distance fields.
          </p>
        </div>
        <AdminScheduledFeesPanel
          value={scheduledForm}
          onChange={onScheduledChange}
          disabled={!canEdit || loading || saving || pushing}
          fieldMeta={scheduledFieldMeta}
          onResetField={hasStoredTemplate ? handleResetField : undefined}
          resettingPath={resettingPath}
        />
      </div>

      <div className="mt-5 border-t border-[#f0f2f0] pt-4">
        <div className="mb-3">
          <h4 className="text-[14px] font-bold text-[#17231c]">Driver rates</h4>
          <p className="mt-0.5 text-[12px] leading-[16px] text-[#7c8780]">
            What Yjeek pays for the delivery leg. On-demand adds distance; scheduled is flat per
            vehicle.
          </p>
        </div>
        <AdminDriverRatesPanel
          value={driverRatesForm}
          onChange={onDriverRatesChange}
          disabled={!canEdit || loading || saving || pushing}
          fieldMeta={driverRatesFieldMeta}
          onResetField={hasStoredTemplate ? handleResetField : undefined}
          resettingPath={resettingPath}
        />
      </div>

      <div className="mt-5 flex items-start gap-3 border-t border-[#f0f2f0] pt-4">
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-bold text-[#17231c]">
            Apply these delivery settings to all branches
          </p>
          <p className="mt-0.5 text-[12px] leading-[16px] text-[#7c8780]">
            Pushes every delivery and fee field above to all branches of this vendor. Confirmation
            required — does not change that checkout reads the branch.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={applyToggle}
          aria-label="Apply vendor delivery settings to all branches"
          disabled={!canEdit || loading || saving || pushing}
          onClick={() => {
            if (applyToggle) {
              setApplyToggle(false)
              return
            }
            openPushModal()
          }}
          className={cn(
            'relative h-[24px] w-[42px] shrink-0 rounded-full transition disabled:cursor-not-allowed disabled:opacity-50',
            applyToggle ? 'bg-[#2E9E4D]' : 'bg-[#d5dbd7]',
          )}
        >
          <span
            className={cn(
              'absolute top-[2px] h-[20px] w-[20px] rounded-full bg-white shadow transition',
              applyToggle ? 'left-[20px]' : 'left-[2px]',
            )}
          />
        </button>
      </div>

      <PushConfirmModal
        open={pushModalOpen}
        branchCount={branchCount}
        pushing={pushing}
        error={pushModalError}
        onCancel={closePushModal}
        onConfirm={handleConfirmPush}
      />
    </div>
  )
}
