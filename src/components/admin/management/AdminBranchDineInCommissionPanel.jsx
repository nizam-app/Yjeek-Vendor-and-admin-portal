import { useCallback, useEffect, useState } from 'react'
import { formatApiErrorMessage } from '../../../api/errors'
import { adminService } from '../../../services/adminService'
import { AdminVendorCommission } from './AdminVendorCommission'

/**
 * Vendor-wide dine-in commission (OG §08 by order method).
 * Shown under branch Status & controls when Dine-in mode is enabled for the branch.
 */
export default function AdminBranchDineInCommissionPanel({
  vendorId,
  storeTypeName = '',
  disabled = false,
}) {
  const [commission, setCommission] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)

  const load = useCallback(async () => {
    const id = String(vendorId || '').trim()
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const res = await adminService.getVendorCommission(id)
      setCommission(res?.data || null)
    } catch (err) {
      setCommission(null)
      setError(formatApiErrorMessage(err, 'Failed to load dine-in commission.'))
    } finally {
      setLoading(false)
    }
  }, [vendorId])

  useEffect(() => {
    if (!vendorId || disabled) return
    void load()
  }, [vendorId, disabled, load])

  const handleSave = useCallback(
    async (next) => {
      const id = String(vendorId || '').trim()
      if (!id) return null
      setSaving(true)
      setSaveError(null)
      try {
        const res = await adminService.updateVendorCommission(id, next)
        const data = res?.data || null
        setCommission(data)
        return data
      } catch (err) {
        setSaveError(err)
        return null
      } finally {
        setSaving(false)
      }
    },
    [vendorId],
  )

  if (!vendorId) {
    return (
      <p className="text-[12px] leading-[16px] text-[#7c8780]">
        Save the branch first to configure dine-in commission for this vendor.
      </p>
    )
  }

  if (loading && !commission) {
    return <p className="text-[12px] text-[#7c8780]">Loading dine-in commission…</p>
  }

  if (error && !commission) {
    return <p className="text-[12px] text-[#d64044]">{error}</p>
  }

  if (!commission) {
    return <p className="text-[12px] text-[#7c8780]">No commission data for this vendor.</p>
  }

  return (
    <AdminVendorCommission
      commission={commission}
      storeTypeName={storeTypeName}
      enabledServiceLabels={['Dine-in']}
      onSaveCommission={disabled ? undefined : handleSave}
      isSaving={saving}
      saveError={saveError}
      embedded
      sectionTitle="Dine-in commission & fees"
      sectionDescription="Applies to dine-in orders for this vendor (shared across branches). Override rates, gateway fees, and custom fees for the Dine-in order method."
    />
  )
}
