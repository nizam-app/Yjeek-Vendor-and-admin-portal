import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Pause, Play, Plus, Star } from 'lucide-react'
import { useApiResource } from '../../../hooks/useApiResource'
import { isAdminRealApiFeature } from '../../../api/config'
import { adminService } from '../../../services/adminService'
import { ApiState } from '../../../components/admin/ApiState'
import AdminForceCloseModal from '../../../components/admin/AdminForceCloseModal'
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
  const [forceCloseOpen, setForceCloseOpen] = useState(false)
  const [suspendOpen, setSuspendOpen] = useState(false)
  const [reopening, setReopening] = useState(false)
  const [unsuspending, setUnsuspending] = useState(false)
  const [actionError, setActionError] = useState(null)
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

  const online = storeOnline ?? data.storeOnline
  const statusLower = String(data.status || '').toLowerCase()
  const isForceClosed =
    Boolean(data.forceClosed) || statusLower.includes('force-closed')
  const isSuspended =
    statusLower === 'suspended' ||
    String(data.accountStatus || '').toUpperCase() === 'SUSPENDED'

  const statusBadgeClass = isSuspended
    ? 'bg-[#fdebea] text-[#bf3c36]'
    : isForceClosed
      ? 'bg-[#fff3d6] text-[#9E6B0D]'
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
    setStoreOnline(next.storeOnline === false ? false : Boolean(next.storeOnline))
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
    setActionError(null)
    setReopening(true)
    try {
      const response = await adminService.reopenVendor(vendorId)
      applyVendorDetail(response?.data)
      if (!response?.data) {
        await refetch()
        setStoreOnline(true)
      }
    } catch (err) {
      setActionError(err?.message || 'Failed to reopen vendor.')
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
    setActionError(null)
    setUnsuspending(true)
    try {
      const response = await adminService.unsuspendVendor(vendorId)
      applyVendorDetail(response?.data)
      if (!response?.data) {
        await refetch()
        setStoreOnline(true)
      }
    } catch (err) {
      setActionError(err?.message || 'Failed to unsuspend vendor.')
    } finally {
      setUnsuspending(false)
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
                {data.status}
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
                  <p className="text-[13px] font-bold text-[#17231c]">Store online</p>
                  <p className="mt-0.5 text-[12px] leading-[16px] text-[#7c8780]">
                    {online ? data.storeOnlineHint : 'Hidden from customers'}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={online}
                  onClick={() => setStoreOnline(!online)}
                  className={cn(
                    'relative mt-0.5 h-[28px] w-[48px] shrink-0 rounded-full transition',
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

              <div className="mt-4 flex items-center justify-between gap-3">
                <span className="text-[13px] text-[#7c8780]">Dispatch mode</span>
                <span className="text-[13px] font-bold text-[#17231c]">{data.dispatchMode}</span>
              </div>

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
                {actionError ? (
                  <p className="text-[12px] font-medium text-[#d64044]">{actionError}</p>
                ) : null}
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
                    onClick={() => {
                      setActionError(null)
                      setSuspendOpen(true)
                    }}
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
            <AdminVendorSla sla={sla || data.sla} />
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
        branches={(data.branches || []).map((branch) => branch.name).filter(Boolean)}
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
