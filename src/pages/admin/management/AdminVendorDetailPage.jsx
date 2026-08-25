import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Pause, Play, Plus, Star } from 'lucide-react'
import { useApiResource } from '../../../hooks/useApiResource'
import { isAdminRealApiFeature } from '../../../api/config'
import { formatApiErrorMessage } from '../../../api/errors'
import { adminService } from '../../../services/adminService'
import { ApiState } from '../../../components/admin/ApiState'
import AdminForceCloseModal from '../../../components/admin/AdminForceCloseModal'
import { showError, showFlashMessage, showSuccess } from '../../../utils/toast'
import AdminSuspendVendorModal from '../../../components/admin/AdminSuspendVendorModal'
import AdminDeliveryCoverageMap from '../../../components/admin/AdminDeliveryCoverageMap'
import { AdminVendorBranches } from '../../../components/admin/management/AdminVendorBranches'
import { AdminVendorDeliveryZones } from '../../../components/admin/management/AdminVendorDeliveryZones'
import { AdminVendorUsers } from '../../../components/admin/management/AdminVendorUsers'
import { AdminVendorPromotions } from '../../../components/admin/management/AdminVendorPromotions'
import { AdminVendorCommission } from '../../../components/admin/management/AdminVendorCommission'
import { AdminVendorSla } from '../../../components/admin/management/AdminVendorSla'
import { cn } from '../../../components/admin/cn'
import {
  emptyAdminDeliveryZones,
  mapAdminDeliveryZoneOverridesFromBranches,
} from '../../../mappers/admin/mapAdminVendors'

export default function AdminVendorDetailPage() {
  const { vendorId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [tab, setTab] = useState(location.state?.tab ?? 'Overview')
  const [storeOnline, setStoreOnline] = useState(null)
  const [storeVisible, setStoreVisible] = useState(null)
  const [forceCloseOpen, setForceCloseOpen] = useState(false)
  const [suspendOpen, setSuspendOpen] = useState(false)
  const [reopening, setReopening] = useState(false)
  const [unsuspending, setUnsuspending] = useState(false)
  const [storeOnlineSaving, setStoreOnlineSaving] = useState(false)
  const [storeVisibleSaving, setStoreVisibleSaving] = useState(false)
  const [activating, setActivating] = useState(false)
  const [deactivating, setDeactivating] = useState(false)
  const [dispatchSaving, setDispatchSaving] = useState(false)
  const [dispatchModeValue, setDispatchModeValue] = useState(null)
  const [branches, setBranches] = useState([])
  const [branchesCount, setBranchesCount] = useState(0)
  const [branchesLoading, setBranchesLoading] = useState(false)
  const [branchesError, setBranchesError] = useState(null)
  const [staff, setStaff] = useState([])
  const [staffCount, setStaffCount] = useState(0)
  const [staffLoading, setStaffLoading] = useState(false)
  const [staffError, setStaffError] = useState(null)
  const [deliveryZones, setDeliveryZones] = useState(null)
  const [deliveryZonesLoading, setDeliveryZonesLoading] = useState(false)
  const [deliveryZonesError, setDeliveryZonesError] = useState(null)
  const [commission, setCommission] = useState(null)
  const [commissionLoading, setCommissionLoading] = useState(false)
  const [commissionError, setCommissionError] = useState(null)
  const [commissionSaving, setCommissionSaving] = useState(false)
  const [commissionSaveError, setCommissionSaveError] = useState(null)
  const [promotions, setPromotions] = useState([])
  const [promotionsLoading, setPromotionsLoading] = useState(false)
  const [promotionsError, setPromotionsError] = useState(null)
  const [promotionSaving, setPromotionSaving] = useState(false)
  const [promotionSaveError, setPromotionSaveError] = useState(null)
  const [sla, setSla] = useState(null)
  const [slaLoading, setSlaLoading] = useState(false)
  const [slaError, setSlaError] = useState(null)
  const { data, error, isLoading, refetch, setData } = useApiResource(
    () => adminService.getVendorDetail(vendorId),
    [vendorId],
  )

  useEffect(() => {
    if (location.state?.tab) setTab(location.state.tab)
  }, [location.state?.tab])

  useEffect(() => {
    if (location.state?.flash) {
      showFlashMessage(String(location.state.flash))
      navigate(location.pathname, { replace: true, state: { ...location.state, flash: undefined } })
    }
  }, [location.pathname, location.state, navigate])

  useEffect(() => {
    if (!data) return
    setStoreOnline(
      typeof data.isOnline === 'boolean'
        ? data.isOnline
        : data.storeOnline === false
          ? false
          : Boolean(data.storeOnline),
    )
    setStoreVisible(
      typeof data.isCustomerVisible === 'boolean'
        ? data.isCustomerVisible
        : Boolean(data.storeOnline),
    )
    setDispatchModeValue(data.dispatchModeValue || 'AUTO')
  }, [
    data?.backendId,
    data?.storeOnline,
    data?.isOnline,
    data?.isCustomerVisible,
    data?.status,
    data?.dispatchModeValue,
  ])

  useEffect(() => {
    if (!vendorId || !isAdminRealApiFeature('vendors')) {
      setBranches([])
      setBranchesCount(0)
      setBranchesError(null)
      setBranchesLoading(false)
      return undefined
    }

    let cancelled = false
    setBranchesLoading(true)
    setBranchesError(null)

    adminService
      .listVendorBranches(vendorId)
      .then((response) => {
        if (cancelled) return
        const list = response?.data?.branches || []
        const count = Number(response?.data?.count) || list.length
        setBranches(list)
        setBranchesCount(count)
        setData((prev) => (prev ? { ...prev, branches: list } : prev))
      })
      .catch((err) => {
        if (cancelled) return
        setBranches([])
        setBranchesCount(0)
        setBranchesError(err?.message || 'Failed to load branches.')
      })
      .finally(() => {
        if (!cancelled) setBranchesLoading(false)
      })

    return () => {
      cancelled = true
    }
    // setData is stable (useCallback). Do not depend on render-only values.
  }, [vendorId, location.key, setData])

  useEffect(() => {
    if (!vendorId || !isAdminRealApiFeature('vendors')) {
      setStaff([])
      setStaffCount(0)
      setStaffError(null)
      setStaffLoading(false)
      return undefined
    }

    let cancelled = false
    setStaffLoading(true)
    setStaffError(null)

    adminService
      .listVendorStaff(vendorId)
      .then((response) => {
        if (cancelled) return
        const list = response?.data?.users || []
        const count = Number(response?.data?.count) || list.length
        setStaff(list)
        setStaffCount(count)
        setData((prev) => (prev ? { ...prev, users: list } : prev))
      })
      .catch((err) => {
        if (cancelled) return
        setStaff([])
        setStaffCount(0)
        setStaffError(err?.message || 'Failed to load staff.')
      })
      .finally(() => {
        if (!cancelled) setStaffLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [vendorId, location.key, setData])

  useEffect(() => {
    if (!vendorId || !isAdminRealApiFeature('vendors')) {
      setDeliveryZones(null)
      setDeliveryZonesError(null)
      setDeliveryZonesLoading(false)
      return undefined
    }

    let cancelled = false
    setDeliveryZonesLoading(true)
    setDeliveryZonesError(null)

    adminService
      .getVendorDeliveryZones(vendorId)
      .then((response) => {
        if (cancelled) return
        setDeliveryZones(response?.data || null)
        setData((prev) => (prev ? { ...prev, deliveryZones: response?.data || prev.deliveryZones } : prev))
      })
      .catch((err) => {
        if (cancelled) return
        setDeliveryZones(null)
        setDeliveryZonesError(err?.message || 'Failed to load delivery zones.')
      })
      .finally(() => {
        if (!cancelled) setDeliveryZonesLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [vendorId, location.key, setData])

  useEffect(() => {
    if (!vendorId || !isAdminRealApiFeature('vendors')) {
      setCommission(null)
      setCommissionError(null)
      setCommissionLoading(false)
      return undefined
    }

    let cancelled = false
    setCommissionLoading(true)
    setCommissionError(null)

    adminService
      .getVendorCommission(vendorId)
      .then((response) => {
        if (cancelled) return
        const next = response?.data || null
        setCommission(next)
        setData((prev) => (prev ? { ...prev, commission: next } : prev))
      })
      .catch((err) => {
        if (cancelled) return
        setCommission(null)
        setCommissionError(err?.message || 'Failed to load commission.')
      })
      .finally(() => {
        if (!cancelled) setCommissionLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [vendorId, location.key, setData])

  useEffect(() => {
    if (!vendorId || !isAdminRealApiFeature('vendors')) {
      setPromotions([])
      setPromotionsError(null)
      setPromotionsLoading(false)
      return undefined
    }

    let cancelled = false
    setPromotionsLoading(true)
    setPromotionsError(null)

    adminService
      .listVendorPromotions(vendorId)
      .then((response) => {
        if (cancelled) return
        const list = response?.data?.promotions || []
        setPromotions(list)
        setData((prev) => (prev ? { ...prev, promotions: list } : prev))
      })
      .catch((err) => {
        if (cancelled) return
        setPromotions([])
        setPromotionsError(err?.message || 'Failed to load promotions.')
      })
      .finally(() => {
        if (!cancelled) setPromotionsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [vendorId, location.key, setData])

  useEffect(() => {
    if (!vendorId || !isAdminRealApiFeature('vendors')) {
      setSla(null)
      setSlaError(null)
      setSlaLoading(false)
      return undefined
    }

    let cancelled = false
    setSlaLoading(true)
    setSlaError(null)

    adminService
      .getVendorSla(vendorId)
      .then((response) => {
        if (cancelled) return
        const next = response?.data || null
        setSla(next)
        setData((prev) => (prev ? { ...prev, sla: next } : prev))
      })
      .catch((err) => {
        if (cancelled) return
        setSla(null)
        setSlaError(err?.message || 'Failed to load SLA.')
      })
      .finally(() => {
        if (!cancelled) setSlaLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [vendorId, location.key, setData])

  if (!data) return <ApiState isLoading={isLoading} error={error} onRetry={refetch} />

  const online = storeOnline ?? data.isOnline ?? data.storeOnline
  const visible =
    storeVisible ??
    (typeof data.isCustomerVisible === 'boolean' ? data.isCustomerVisible : Boolean(online))
  const dispatchMode = dispatchModeValue ?? data.dispatchModeValue ?? 'AUTO'
  const statusLower = String(data.status || '').toLowerCase()
  const accountStatusUpper = String(data.accountStatus || '').toUpperCase()
  const isDraft =
    statusLower === 'draft' || accountStatusUpper === 'DRAFT'
  const isPending =
    statusLower.includes('pending') || accountStatusUpper === 'PENDING_APPROVAL'
  const isForceClosed =
    Boolean(data.forceClosed) || statusLower.includes('force-closed')
  const isSuspended =
    statusLower === 'suspended' || accountStatusUpper === 'SUSPENDED'
  const isActiveAccount =
    !isDraft && !isPending && !isSuspended && Boolean(data.isAccountActive ?? !isDraft)
  const storeControlsDisabled =
    isSuspended ||
    isForceClosed ||
    storeOnlineSaving ||
    storeVisibleSaving ||
    activating ||
    deactivating
  const storeVisibleHint = isDraft || isPending
    ? isPending
      ? 'Approve the vendor before showing in the customer app'
      : 'Activate the vendor before showing in the customer app'
    : visible
      ? 'Shown in customer search and category listings.'
      : 'Hidden from the customer app.'
  const storeActiveHint = isDraft || isPending
    ? isPending
      ? 'Approve the vendor before accepting orders'
      : 'Activate the vendor before accepting orders'
    : online
      ? 'Vendor can receive orders; customers can check out.'
      : 'Customers cannot place orders (can still browse if Visible is ON).'

  let displayStatus = String(data.status || '').trim() || '—'
  if (isSuspended) displayStatus = 'Suspended'
  else if (isForceClosed) displayStatus = 'Force-closed'
  else if (isDraft) displayStatus = 'Draft'
  else if (isPending) displayStatus = 'Pending approval'
  else if (isActiveAccount) {
    if (!visible) displayStatus = 'Hidden'
    else if (!online) displayStatus = 'Unavailable'
    else displayStatus = 'Active'
  }

  const statusBadgeClass = isSuspended
    ? 'bg-[#fdebea] text-[#bf3c36]'
    : isForceClosed || displayStatus === 'Unavailable'
      ? 'bg-[#fff3d6] text-[#9E6B0D]'
      : isDraft || isPending || displayStatus === 'Hidden' || displayStatus === 'Inactive'
        ? 'bg-[#eff2f0] text-[#637068]'
        : 'bg-[#e8f7ed] text-[#147940]'

  const deliveryZonesForTab = (() => {
    if (deliveryZones?.defaults) return deliveryZones
    const base =
      data.deliveryZones &&
      typeof data.deliveryZones === 'object' &&
      !Array.isArray(data.deliveryZones) &&
      data.deliveryZones.defaults
        ? data.deliveryZones
        : emptyAdminDeliveryZones()
    const branchSource = branches.length ? branches : data.branches
    return {
      defaults: base.defaults || emptyAdminDeliveryZones().defaults,
      overrides: Array.isArray(base.overrides) && base.overrides.length
        ? base.overrides
        : mapAdminDeliveryZoneOverridesFromBranches(branchSource),
      coverage: base.coverage || null,
    }
  })()

  const refreshDeliveryZones = async () => {
    const response = await adminService.getVendorDeliveryZones(vendorId)
    setDeliveryZones(response?.data || null)
    setData((prev) => (prev ? { ...prev, deliveryZones: response?.data || prev.deliveryZones } : prev))
    return response?.data
  }

  const handleApplyDeliveryZonesToAll = async (formDefaults = {}) => {
    // 1) PATCH current Delivery form → general defaults
    await adminService.updateVendorDeliveryZones(vendorId, formDefaults)

    // 2) POST apply-all → overwrite every branch from general
    const response = await adminService.applyVendorDeliveryZonesToAll(vendorId)
    if (response?.data) {
      setDeliveryZones(response.data)
      setData((prev) => (prev ? { ...prev, deliveryZones: response.data } : prev))
      return response.data
    }
    return refreshDeliveryZones()
  }

  const commissionForTab = commission || data.commission || null

  const handleSaveCommission = async (updated) => {
    setCommissionSaving(true)
    setCommissionSaveError(null)
    try {
      if (!isAdminRealApiFeature('vendors')) {
        setCommission(updated)
        setData((prev) => (prev ? { ...prev, commission: updated } : prev))
        return updated
      }
      const response = await adminService.updateVendorCommission(vendorId, updated)
      const next = response?.data || null
      setCommission(next)
      setData((prev) => (prev ? { ...prev, commission: next } : prev))
      return next
    } catch (err) {
      setCommissionSaveError(err)
      throw err
    } finally {
      setCommissionSaving(false)
    }
  }

  const promotionsForTab = isAdminRealApiFeature('vendors')
    ? promotions
    : (Array.isArray(data.promotions) ? data.promotions : [])

  const refreshPromotions = async () => {
    if (!isAdminRealApiFeature('vendors')) return promotionsForTab
    const response = await adminService.listVendorPromotions(vendorId)
    const list = response?.data?.promotions || []
    setPromotions(list)
    setData((prev) => (prev ? { ...prev, promotions: list } : prev))
    return list
  }

  const handleViewPromotion = async (promo) => {
    if (!isAdminRealApiFeature('vendors') || !promo?.id) return promo
    const response = await adminService.getVendorPromotion(vendorId, promo.id)
    return response?.data || promo
  }

  const handleSavePromotion = async (form) => {
    setPromotionSaving(true)
    setPromotionSaveError(null)
    try {
      if (!isAdminRealApiFeature('vendors')) {
        if (form.__create || !form.id) {
          const created = {
            ...form,
            id: `local-${Date.now()}`,
            __create: undefined,
            period: form.detailPeriod || form.period,
          }
          setPromotions((prev) => [created, ...prev])
          setData((prev) =>
            prev ? { ...prev, promotions: [created, ...(prev.promotions || [])] } : prev,
          )
          return created
        }
        setPromotions((prev) => prev.map((p) => (p.id === form.id ? { ...p, ...form } : p)))
        return form
      }

      if (form.__create || !form.id) {
        const response = await adminService.createVendorPromotion(vendorId, form)
        await refreshPromotions()
        return response?.data
      }

      const response = await adminService.updateVendorPromotion(vendorId, form.id, form)
      await refreshPromotions()
      return response?.data
    } catch (err) {
      setPromotionSaveError(err)
      throw err
    } finally {
      setPromotionSaving(false)
    }
  }

  const applyVendorDetail = (next) => {
    if (!next) return
    setData(next)
    setStoreOnline(
      typeof next.isOnline === 'boolean'
        ? next.isOnline
        : next.storeOnline === false
          ? false
          : Boolean(next.storeOnline),
    )
    setStoreVisible(
      typeof next.isCustomerVisible === 'boolean'
        ? next.isCustomerVisible
        : Boolean(next.storeOnline),
    )
  }

  const handleForceClose = async (form) => {
    const response = await adminService.forceCloseVendor(vendorId, form)
    applyVendorDetail(response?.data)
    if (!response?.data) {
      await refetch()
      setStoreOnline(false)
    }
  }

  const handleReopen = async () => {
    if (reopening) return
    setReopening(true)
    try {
      const response = await adminService.reopenVendor(vendorId)
      applyVendorDetail(response?.data)
      if (!response?.data) {
        await refetch()
        setStoreOnline(true)
      }
      showSuccess('Store reopened.')
    } catch (err) {
      showError(err?.message || 'Failed to reopen vendor.')
    } finally {
      setReopening(false)
    }
  }

  const handleSuspend = async (form) => {
    const response = await adminService.suspendVendor(vendorId, form)
    applyVendorDetail(response?.data)
    if (!response?.data) {
      await refetch()
      setStoreOnline(false)
    }
  }

  const handleUnsuspend = async () => {
    if (unsuspending) return
    setUnsuspending(true)
    try {
      const response = await adminService.unsuspendVendor(vendorId)
      applyVendorDetail(response?.data)
      if (!response?.data) {
        await refetch()
        setStoreOnline(true)
      }
      showSuccess('Vendor unsuspended.')
    } catch (err) {
      showError(err?.message || 'Failed to unsuspend vendor.')
    } finally {
      setUnsuspending(false)
    }
  }

  const handleActivateVendor = async (successLabel = 'Vendor activated successfully.') => {
    if (activating || !isAdminRealApiFeature('vendors')) return
    setActivating(true)
    try {
      const response = await adminService.activateVendor(vendorId, {
        activate: true,
        isCustomerVisible: true,
        isOnline: true,
      })
      applyVendorDetail(response?.data)
      if (!response?.data) await refetch()
      showSuccess(successLabel)
    } catch (err) {
      showError(formatApiErrorMessage(err, 'Failed to activate vendor.'))
    } finally {
      setActivating(false)
    }
  }

  const handleReturnToDraft = async () => {
    if (deactivating || !isAdminRealApiFeature('vendors')) return
    setDeactivating(true)
    try {
      const response = await adminService.activateVendor(vendorId, { activate: false })
      applyVendorDetail(response?.data)
      if (!response?.data) await refetch()
      showSuccess('Vendor moved back to draft.')
    } catch (err) {
      showError(formatApiErrorMessage(err, 'Failed to update vendor status.'))
    } finally {
      setDeactivating(false)
    }
  }

  const handleStoreVisibleToggle = async () => {
    if (storeControlsDisabled) return
    const nextVisible = !visible

    if (isDraft || isPending) {
      if (!nextVisible) return
      await handleActivateVendor(
        isPending ? 'Vendor approved and activated.' : 'Vendor activated successfully.',
      )
      return
    }

    if (!isAdminRealApiFeature('vendors')) {
      setStoreVisible(nextVisible)
      showSuccess(nextVisible ? 'Store is now visible.' : 'Store is now hidden from the customer app.')
      return
    }

    setStoreVisibleSaving(true)
    try {
      const response = await adminService.updateVendorStoreControls(vendorId, {
        isCustomerVisible: nextVisible,
      })
      applyVendorDetail(response?.data)
      if (!response?.data) {
        await refetch()
        setStoreVisible(nextVisible)
      }
      showSuccess(nextVisible ? 'Store is now visible.' : 'Store is now hidden from the customer app.')
    } catch (err) {
      showError(formatApiErrorMessage(err, 'Failed to update visibility.'))
    } finally {
      setStoreVisibleSaving(false)
    }
  }

  const handleStoreOnlineToggle = async () => {
    if (storeControlsDisabled) return

    const nextOnline = !online

    if (isDraft || isPending) {
      if (!nextOnline) return
      await handleActivateVendor(
        isPending ? 'Vendor approved and activated.' : 'Vendor activated successfully.',
      )
      return
    }

    if (!isAdminRealApiFeature('vendors')) {
      setStoreOnline(nextOnline)
      showSuccess(nextOnline ? 'Store is now accepting orders.' : 'Store is unavailable for ordering.')
      return
    }

    setStoreOnlineSaving(true)
    try {
      const response = await adminService.updateVendorStoreControls(vendorId, {
        isOnline: nextOnline,
      })
      applyVendorDetail(response?.data)
      if (!response?.data) {
        await refetch()
        setStoreOnline(nextOnline)
      }
      showSuccess(nextOnline ? 'Store is now accepting orders.' : 'Store is unavailable for ordering.')
    } catch (err) {
      showError(formatApiErrorMessage(err, 'Failed to update store status.'))
    } finally {
      setStoreOnlineSaving(false)
    }
  }

  const handleDispatchModeChange = async (nextMode) => {
    const normalized = String(nextMode || '').toUpperCase() === 'MANUAL' ? 'MANUAL' : 'AUTO'
    if (normalized === dispatchMode || dispatchSaving) return

    setDispatchModeValue(normalized)
    if (!isAdminRealApiFeature('vendors')) {
      showSuccess(`Dispatch mode set to ${normalized === 'MANUAL' ? 'Manual dispatch' : 'Auto-dispatch'}.`)
      return
    }

    setDispatchSaving(true)
    try {
      const response = await adminService.updateVendorStoreControls(vendorId, {
        dispatchMode: normalized,
      })
      applyVendorDetail(response?.data)
      if (!response?.data) await refetch()
      showSuccess(`Dispatch mode set to ${normalized === 'MANUAL' ? 'Manual dispatch' : 'Auto-dispatch'}.`)
    } catch (err) {
      setDispatchModeValue(data.dispatchModeValue || 'AUTO')
      showError(formatApiErrorMessage(err, 'Failed to update dispatch mode.'))
    } finally {
      setDispatchSaving(false)
    }
  }

  return (
    <div className="px-5 pb-10 pt-4 max-[700px]:px-3">
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/admin/vendors')}
          className="inline-flex h-[34px] shrink-0 items-center gap-1 rounded-full border border-[#e4e8e4] bg-white px-3 text-[13px] font-medium text-[#455249] shadow-[0_1px_2px_rgba(20,40,28,.04)] hover:bg-[#f6f8f6]"
        >
          <ChevronLeft size={15} strokeWidth={2.2} />
          Vendors
        </button>

        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-[14px] bg-[#e5f5eb] text-[15px] font-bold text-[#127036]">
            {data.initials}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[22px] font-bold tracking-[-0.02em] text-[#17231c]">{data.name}</h2>
              <span className={cn('inline-flex rounded-full px-2.5 py-[3px] text-[11px] font-bold', statusBadgeClass)}>
                {displayStatus}
              </span>
            </div>
            <p className="mt-1 truncate text-[12.5px] text-[#7c8780]">
              {data.id} · {data.storeType} · {data.branchesLabel} · ★ {data.rating}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            navigate('/admin/vendors/new', {
              state: {
                mode: 'edit',
                vendorId,
                storeName: data.name,
                step: 1,
              },
            })
          }
          className="inline-flex h-[36px] shrink-0 items-center gap-1.5 rounded-full border border-[#dfe4e0] bg-white px-3.5 text-[13px] font-medium text-[#127338] shadow-[0_1px_2px_rgba(20,40,28,.04)] hover:bg-[#f6f8f6]"
        >
          ✎
          Edit
        </button>
      </div>

      {/* Pill tabs */}
      <div className="mb-4 overflow-x-auto overscroll-x-contain touch-pan-x [-webkit-overflow-scrolling:touch]">
        <div className="inline-flex w-full min-w-full items-center rounded-[10px] bg-[#ebeceb] p-[4px]">
          {data.tabs.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              className={cn(
                'h-[32px] shrink-0 flex-1 rounded-[8px] px-3.5 text-[12.5px] whitespace-nowrap transition',
                tab === item
                  ? 'bg-white font-bold shadow-[0_1px_3px_rgba(20,40,28,.12)]'
                  : 'font-medium hover:text-[#455249]',
              )}
              style={{ color: tab === item ? '#1aa054' : '#69756d' }}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {tab === 'Overview' ? (
        <>
          {/* KPI row */}
          <div className="mb-4 grid grid-cols-5 gap-3 max-[1100px]:grid-cols-3 max-[700px]:grid-cols-2 max-[420px]:grid-cols-1">
            {data.metrics.map(({ label, value, star, tone }) => {
              const valueColor =
                tone === 'green' ? '#1aa054' : tone === 'orange' ? '#c4841a' : '#17231c'

              return (
              <div
                key={label}
                className="rounded-[14px] border border-[#eceeec] bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(20,40,28,.03)]"
              >
                <p className="text-[12px] text-[#7c8780]">{label}</p>
                <p
                  className="mt-2 flex items-center gap-1 text-[24px] font-bold leading-none tracking-[-0.02em]"
                  style={{ color: valueColor }}
                >
                  {star ? <Star size={16} className="shrink-0 fill-[#1aa054] text-[#1aa054]" /> : null}
                  <span>{value}</span>
                </p>
              </div>
              )
            })}
          </div>

          {/* Bottom cards: ~65% / ~35% */}
          <div className="grid grid-cols-[minmax(0,1.7fr)_minmax(260px,1fr)] items-start gap-4 max-[900px]:grid-cols-1">
            <section className="rounded-[14px] border border-[#eceeec] bg-white px-5 py-5 shadow-[0_1px_2px_rgba(20,40,28,.03)]">
              <h3 className="mb-1 text-[15px] font-bold text-[#17231c]">Store profile</h3>
              {[
                ['Legal name', data.legalName],
                ['Category', data.category],
                ['Delivery', data.delivery],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center justify-between gap-6 border-b border-[#f0f2f0] py-3.5 last:border-0 last:pb-0"
                >
                  <span className="shrink-0 text-[12.5px] text-[#7c8780]">{label}</span>
                  <span className="text-right text-[13px] font-medium text-[#17231c]">{value}</span>
                </div>
              ))}
            </section>

            <section className="rounded-[14px] border border-[#eceeec] bg-white px-5 py-5 shadow-[0_1px_2px_rgba(20,40,28,.03)]">
              <h3 className="mb-4 text-[15px] font-bold text-[#17231c]">Status & controls</h3>

              <div className="flex items-start justify-between gap-3 border-b border-[#f0f2f0] pb-3">
                <div className="min-w-0">
                  <p className="text-[13px] font-bold text-[#17231c]">Visible</p>
                  <p className="mt-0.5 text-[12px] leading-[16px] text-[#7c8780]">
                    {storeVisibleHint}
                  </p>
                  {isActiveAccount ? (
                    <p className="mt-1 text-[11px] leading-[15px] text-[#9aa49d]">
                      Controls customer-app discovery only. Does not deactivate the vendor account.
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={visible}
                  aria-label="Visible"
                  disabled={storeControlsDisabled}
                  onClick={handleStoreVisibleToggle}
                  className={cn(
                    'relative mt-0.5 h-[28px] w-[48px] shrink-0 rounded-full transition disabled:cursor-not-allowed disabled:opacity-60',
                    visible ? 'bg-[#1aa054]' : 'bg-[#d5dbd7]',
                  )}
                >
                  <span
                    className={cn(
                      'absolute top-[3px] h-[22px] w-[22px] rounded-full bg-white shadow transition',
                      visible ? 'left-[23px]' : 'left-[3px]',
                    )}
                  />
                </button>
              </div>

              <div className="mt-3 flex items-start justify-between gap-3 border-b border-[#f0f2f0] pb-3">
                <div className="min-w-0">
                  <p className="text-[13px] font-bold text-[#17231c]">Active</p>
                  <p className="mt-0.5 text-[12px] leading-[16px] text-[#7c8780]">
                    {storeActiveHint}
                  </p>
                  {isActiveAccount ? (
                    <p className="mt-1 text-[11px] leading-[15px] text-[#9aa49d]">
                      Controls order acceptance. Vendor can stay visible while Active is OFF.
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={online}
                  aria-label="Active"
                  disabled={storeControlsDisabled}
                  onClick={handleStoreOnlineToggle}
                  className={cn(
                    'relative mt-0.5 h-[28px] w-[48px] shrink-0 rounded-full transition disabled:cursor-not-allowed disabled:opacity-60',
                    online ? 'bg-[#1aa054]' : 'bg-[#d5dbd7]',
                  )}
                >
                  <span
                    className={cn(
                      'absolute top-[3px] h-[22px] w-[22px] rounded-full bg-white shadow transition',
                      online ? 'left-[23px]' : 'left-[3px]',
                    )}
                  />
                </button>
              </div>

              {isDraft ? (
                <div className="mt-4 border-b border-[#f0f2f0] pb-4">
                  <p className="text-[12px] leading-relaxed text-[#7c8780]">
                    This vendor is still a draft. Activate it to make the store visible in the customer app.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleActivateVendor()}
                    disabled={activating}
                    className="mt-3 inline-flex h-[38px] items-center rounded-full bg-[#1aa054] px-4 text-[12.5px] font-bold text-white hover:bg-[#158a47] disabled:opacity-60"
                  >
                    {activating ? 'Activating…' : 'Activate vendor'}
                  </button>
                </div>
              ) : null}

              {isPending ? (
                <div className="mt-4 border-b border-[#f0f2f0] pb-4">
                  <p className="text-[12px] leading-relaxed text-[#7c8780]">
                    This vendor is waiting for approval before it can go live.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleActivateVendor('Vendor approved and activated.')}
                      disabled={activating || deactivating}
                      className="inline-flex h-[38px] items-center rounded-full bg-[#1aa054] px-4 text-[12.5px] font-bold text-white hover:bg-[#158a47] disabled:opacity-60"
                    >
                      {activating ? 'Approving…' : 'Approve & activate'}
                    </button>
                    <button
                      type="button"
                      onClick={handleReturnToDraft}
                      disabled={activating || deactivating}
                      className="inline-flex h-[38px] items-center rounded-full border border-[#d5dbd6] bg-white px-4 text-[12.5px] font-bold text-[#455249] hover:bg-[#f7f9f7] disabled:opacity-60"
                    >
                      {deactivating ? 'Updating…' : 'Return to draft'}
                    </button>
                  </div>
                </div>
              ) : null}

              <div className="mt-4 border-b border-[#f0f2f0] pb-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[13px] font-bold text-[#17231c]">Dispatch mode</p>
                    <p className="mt-0.5 text-[12px] text-[#7c8780]">
                      {dispatchMode === 'MANUAL' ? 'Manual dispatch' : 'Auto-dispatch'}
                    </p>
                  </div>
                  {dispatchSaving ? (
                    <span className="text-[12px] text-[#7c8780]">Saving…</span>
                  ) : null}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {[
                    { value: 'AUTO', label: 'Auto-dispatch' },
                    { value: 'MANUAL', label: 'Manual dispatch' },
                  ].map((option) => {
                    const selected = dispatchMode === option.value
                    return (
                      <button
                        key={option.value}
                        type="button"
                        disabled={dispatchSaving || isDraft || isPending || isSuspended}
                        onClick={() => handleDispatchModeChange(option.value)}
                        className={cn(
                          'inline-flex h-[34px] items-center rounded-full border px-3.5 text-[12.5px] font-medium transition disabled:cursor-not-allowed disabled:opacity-60',
                          selected
                            ? 'border-[#1aa054] bg-[#e8f7ed] text-[#147940]'
                            : 'border-[#e1e5e2] bg-white text-[#455249] hover:border-[#c9d0cb]',
                        )}
                      >
                        {option.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {isActiveAccount && !isForceClosed && !isSuspended ? (
                <div className="mt-4 border-b border-[#f0f2f0] pb-4">
                  <p className="text-[12px] leading-relaxed text-[#7c8780]">
                    Need to stop all activity? Move the vendor back to draft. This hides the store and disables the account until reactivated.
                  </p>
                  <button
                    type="button"
                    onClick={handleReturnToDraft}
                    disabled={deactivating}
                    className="mt-3 inline-flex h-[36px] items-center rounded-full border border-[#d5dbd6] bg-white px-4 text-[12.5px] font-bold text-[#455249] hover:bg-[#f7f9f7] disabled:opacity-60"
                  >
                    {deactivating ? 'Updating…' : 'Move to draft'}
                  </button>
                </div>
              ) : null}

              <div className="mt-5 flex flex-col gap-2.5">
                {isForceClosed ? (
                  <button
                    type="button"
                    onClick={handleReopen}
                    disabled={reopening}
                    className="inline-flex h-[42px] w-fit items-center justify-center gap-2 rounded-full bg-[#e8f7ed] px-4 text-[13px] font-bold text-[#147940] hover:bg-[#d8f1e1] disabled:opacity-60"
                  >
                    <Play size={15} className="fill-[#147940] text-[#147940]" strokeWidth={0} />
                    {reopening ? 'Resuming…' : 'Resume'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setForceCloseOpen(true)}
                    className="inline-flex h-[42px] w-fit items-center justify-center gap-2 rounded-full bg-[#fff3d6] px-4 text-[13px] font-bold text-[#9E6B0D] hover:bg-[#ffecc0]"
                  >
                    <Pause size={15} className="text-[#3b82f6]" fill="#3b82f6" strokeWidth={0} />
                    Force close store
                  </button>
                )}
                {isSuspended ? (
                  <button
                    type="button"
                    onClick={handleUnsuspend}
                    disabled={unsuspending}
                    className="inline-flex h-[42px] w-fit items-center justify-center rounded-full bg-[#e8f7ed] px-4 text-[13px] font-bold text-[#147940] hover:bg-[#d8f1e1] disabled:opacity-60"
                  >
                    {unsuspending ? 'Unsuspending…' : 'Unsuspend'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSuspendOpen(true)}
                    className="inline-flex h-[42px] w-fit items-center justify-center rounded-full bg-[#fdebec] px-4 text-[13px] font-bold text-[#d64044] hover:bg-[#f9d9da]"
                  >
                    Suspend vendor
                  </button>
                )}
              </div>
            </section>
          </div>

          <section className="mt-4 rounded-[14px] border border-[#eceeec] bg-white px-5 py-5 shadow-[0_1px_2px_rgba(20,40,28,.03)]">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-[15px] font-bold text-[#17231c]">Coverage map</h3>
              {deliveryZonesError ? (
                <p className="text-[12px] text-[#d64044]">{deliveryZonesError}</p>
              ) : null}
            </div>
            {deliveryZonesLoading && !deliveryZones?.coverage ? (
              <p className="py-10 text-center text-[13px] text-[#7c8780]">Loading coverage map…</p>
            ) : (
              <AdminDeliveryCoverageMap coverage={deliveryZonesForTab.coverage} />
            )}
          </section>
        </>
      ) : tab === 'Branches' ? (
        <>
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-[15px] font-bold text-[#17231c]">
                Branches ({branchesCount || branches.length})
              </h3>
              <p className="mt-1 max-w-[520px] text-[12px] leading-[18px] text-[#7c8780]">
                Add, edit, force-close or delete branches. Each has its own radius, ETA &amp; min order.
              </p>
              {branchesError ? (
                <p className="mt-2 text-[12px] font-medium text-[#d64044]">{branchesError}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() =>
                navigate(`/admin/vendors/${encodeURIComponent(vendorId)}/branches/new`, {
                  state: { storeName: data.name, vendorId, mode: 'create' },
                })
              }
              className="inline-flex h-[34px] shrink-0 items-center gap-1.5 rounded-full bg-[#1aa054] px-4 text-[12px] font-bold text-white shadow-[0_1px_2px_rgba(20,40,28,.15)] hover:bg-[#158a47]"
            >
              <Plus size={14} strokeWidth={2.2} />
              Add branch
            </button>
          </div>
          <AdminVendorBranches
            branches={branches}
            vendorId={vendorId}
            storeName={data.name}
            isLoading={branchesLoading}
          />
        </>
      ) : tab === 'Users & staff' ? (
        <>
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-[15px] font-bold text-[#17231c]">
                Users &amp; staff ({isAdminRealApiFeature('vendors') ? staffCount || staff.length : data.users.length})
              </h3>
              <p className="mt-1 max-w-[520px] text-[12px] leading-[18px] text-[#7c8780]">
                Vendor admins, branch managers and staff with scoped, role-based access.
              </p>
              {staffError ? (
                <p className="mt-1 text-[12px] text-[#d64044]">{staffError}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() =>
                navigate(`/admin/vendors/${encodeURIComponent(vendorId)}/users/new`, {
                  state: {
                    storeName: data.name,
                    vendorId,
                    mode: 'create',
                    branches: branches.length ? branches : data.branches,
                  },
                })
              }
              className="inline-flex h-[34px] shrink-0 items-center gap-1.5 rounded-full bg-[#1aa054] px-4 text-[12px] font-bold text-white shadow-[0_1px_2px_rgba(20,40,28,.15)] hover:bg-[#158a47]"
            >
              <Plus size={14} strokeWidth={2.2} />
              Add user
            </button>
          </div>
          <AdminVendorUsers
            users={isAdminRealApiFeature('vendors') ? staff : data.users}
            vendorId={vendorId}
            storeName={data.name}
            branches={branches.length ? branches : data.branches}
            isLoading={staffLoading}
          />
        </>
      ) : tab === 'Delivery zones' ? (
        <div className="space-y-3">
          {deliveryZonesError ? (
            <p className="text-[12px] text-[#d64044]">{deliveryZonesError}</p>
          ) : null}
          {deliveryZonesLoading && !deliveryZones ? (
            <p className="py-10 text-center text-[13px] text-[#7c8780]">Loading delivery zones…</p>
          ) : (
            <AdminVendorDeliveryZones
              deliveryZones={deliveryZonesForTab}
              onApplyToAll={
                isAdminRealApiFeature('vendors') ? handleApplyDeliveryZonesToAll : undefined
              }
            />
          )}
        </div>
      ) : tab === 'Promotions' ? (
        <AdminVendorPromotions
          promotions={promotionsForTab}
          isLoading={promotionsLoading}
          error={promotionsError}
          onRetry={() => {
            setPromotionsError(null)
            refreshPromotions().catch((err) => {
              setPromotionsError(err?.message || 'Failed to load promotions.')
            })
          }}
          onViewPromotion={handleViewPromotion}
          onSavePromotion={handleSavePromotion}
          saving={promotionSaving}
          saveError={promotionSaveError}
        />
      ) : tab === 'Commission & fees' ? (
        <div className="space-y-3">
          {commissionError ? (
            <p className="text-[12px] text-[#d64044]">{commissionError}</p>
          ) : null}
          {commissionLoading && !commissionForTab ? (
            <p className="text-[12px] text-[#7c8780]">Loading commission…</p>
          ) : commissionForTab ? (
            <AdminVendorCommission
              commission={commissionForTab}
              onSaveCommission={handleSaveCommission}
              isSaving={commissionSaving}
              saveError={commissionSaveError}
            />
          ) : (
            <div className="rounded-[14px] border border-[#eceeec] bg-white px-5 py-12 text-center shadow-[0_1px_2px_rgba(20,40,28,.03)]">
              <p className="text-[15px] font-bold text-[#17231c]">Commission &amp; fees</p>
              <p className="mt-1 text-[12px] text-[#7c8780]">
                No commission data for this vendor.
              </p>
            </div>
          )}
        </div>
      ) : tab === 'SLA' ? (
        <div className="space-y-3">
          {slaError ? (
            <p className="text-[12px] text-[#d64044]">{slaError}</p>
          ) : null}
          {slaLoading && !(sla || data.sla) ? (
            <p className="text-[12px] text-[#7c8780]">Loading SLA…</p>
          ) : (sla || data.sla) ? (
            <AdminVendorSla
              sla={sla || data.sla}
              vendorId={data.backendId || vendorId}
              storeName={data.name}
            />
          ) : (
            <div className="rounded-[14px] border border-[#eceeec] bg-white px-5 py-12 text-center shadow-[0_1px_2px_rgba(20,40,28,.03)]">
              <p className="text-[15px] font-bold text-[#17231c]">SLA</p>
              <p className="mt-1 text-[12px] text-[#7c8780]">No SLA data for this vendor.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-[14px] border border-[#eceeec] bg-white px-5 py-12 text-center shadow-[0_1px_2px_rgba(20,40,28,.03)]">
          <p className="text-[15px] font-bold text-[#17231c]">{tab}</p>
          <p className="mt-1 text-[12px] text-[#7c8780]">This section will be available in a later update.</p>
        </div>
      )}

      <AdminForceCloseModal
        open={forceCloseOpen}
        onClose={() => setForceCloseOpen(false)}
        storeName={data.name}
        branches={(branches.length ? branches : data.branches || []).map((branch) => ({
          id: branch.id,
          name: branch.name,
        }))}
        defaultScope="store"
        onConfirm={handleForceClose}
      />
      <AdminSuspendVendorModal
        open={suspendOpen}
        onClose={() => setSuspendOpen(false)}
        storeName={data.name}
        onConfirm={handleSuspend}
      />
    </div>
  )
}
