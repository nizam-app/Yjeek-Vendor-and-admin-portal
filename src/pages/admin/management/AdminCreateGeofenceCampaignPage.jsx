import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronDown, ChevronLeft } from 'lucide-react'
import { formatApiErrorMessage } from '../../../api/errors'
import { isPlottableLatLng } from '../../../lib/googleMaps'
import { adminService } from '../../../services/adminService'
import { AdminEntitySearchPicker } from '../../../components/admin/AdminEntitySearchPicker'
import AdminGeofenceRadiusMap from '../../../components/admin/AdminGeofenceRadiusMap'
import { AdminDatePicker } from '../../../components/admin/AdminDatePicker'
import { cn } from '../../../components/admin/cn'

const labelClass = 'mb-1.5 block text-[12px] font-medium leading-none text-[#7c8780]'
const inputClass =
  'box-border h-[40px] w-full rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white px-3 text-[13px] text-[#17231c] outline-none transition placeholder:text-[#9aa49d] focus:border-[#1aa054]'

const STATUS_OPTIONS = ['DRAFT', 'ACTIVE', 'PAUSED']
const ORDER_TYPE_OPTIONS = [
  { value: 'DELIVERY', label: 'Delivery' },
  { value: 'PICKUP', label: 'Pickup' },
  { value: 'DINE_IN', label: 'Dine-in' },
  { value: 'SERVICE', label: 'Service' },
]
const DEFAULT_OFFER_WINDOW_MINUTES = 120
const MIN_OFFER_WINDOW_MINUTES = 5
const MAX_OFFER_WINDOW_MINUTES = 24 * 60

function orderTypesFromSlaServiceModes(modes = {}) {
  const types = []
  if (modes.hotFoodOnDemand || modes.scheduledDelivery) types.push('DELIVERY')
  if (modes.pickup) types.push('PICKUP')
  if (modes.dineIn) types.push('DINE_IN')
  if (modes.services) types.push('SERVICE')
  return types
}

function unionOrderTypeOptions(selectedVendors) {
  const allowed = new Set()
  for (const vendor of selectedVendors) {
    for (const type of vendor.orderTypes || []) {
      allowed.add(String(type || '').trim().toUpperCase())
    }
  }
  return ORDER_TYPE_OPTIONS.filter((opt) => allowed.has(opt.value))
}

function Field({ label, children, className }) {
  return (
    <label className={cn('block min-w-0', className)}>
      <span className={labelClass}>{label}</span>
      {children}
    </label>
  )
}

function Select({ children, className, ...props }) {
  return (
    <div className={cn('relative', className)}>
      <select
        className={cn(
          inputClass,
          'appearance-none pr-9 [-webkit-appearance:none] [-moz-appearance:none] [&::-ms-expand]:hidden',
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        size={15}
        strokeWidth={2}
        className="pointer-events-none absolute right-3 top-1/2 z-[1] -translate-y-1/2 text-[#7c8780]"
        aria-hidden
      />
    </div>
  )
}

function Card({ title, subtitle, children }) {
  return (
    <section className="rounded-[14px] border border-[#eceeec] bg-white p-5 shadow-[0_1px_2px_rgba(20,40,28,.03)] max-[700px]:p-4">
      {title ? <h3 className="text-[15px] font-bold text-[#17231c]">{title}</h3> : null}
      {subtitle ? <p className="mt-1 text-[12.5px] text-[#7c8780]">{subtitle}</p> : null}
      <div className={title || subtitle ? 'mt-4' : undefined}>{children}</div>
    </section>
  )
}

function splitIsoToDateTime(value) {
  if (!value) return { date: '', time: '' }
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return { date: '', time: '' }
  const pad = (n) => String(n).padStart(2, '0')
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  }
}

function combineDateAndTime(dateValue, timeValue) {
  const date = String(dateValue || '').trim()
  if (!date) return null
  const time = String(timeValue || '').trim() || '00:00'
  const d = new Date(`${date}T${time}:00`)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString()
}

const emptyForm = {
  selectedVendors: [],
  title: '',
  notificationTitle: '',
  notificationBody: '',
  radiusMeters: '500',
  offerWindowMinutes: String(DEFAULT_OFFER_WINDOW_MINUTES),
  discountPercent: '25',
  maxUses: '',
  maxUsesPerCustomer: '1',
  applicableOrderTypes: [],
  promoCodeId: '',
  promoLabel: '',
  status: 'DRAFT',
  startsAtDate: '',
  startsAtTime: '00:00',
  endsAtDate: '',
  endsAtTime: '23:59',
}

export default function AdminCreateGeofenceCampaignPage() {
  const navigate = useNavigate()
  const { campaignId } = useParams()
  const isEdit = Boolean(campaignId)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(isEdit)
  const [error, setError] = useState('')
  const [stats, setStats] = useState(null)
  const [mapLocations, setMapLocations] = useState([])
  const [coordsLoading, setCoordsLoading] = useState(false)
  const [vendorGeoWarnings, setVendorGeoWarnings] = useState([])

  const goBack = () => navigate('/admin/marketing/geofence')

  useEffect(() => {
    if (!isEdit) return undefined
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const result = await adminService.getAdminGeofenceCampaign(campaignId)
        const row = result?.data
        if (cancelled || !row) return

        const vendorsFromApi = Array.isArray(row.vendors) ? row.vendors : []
        const selectedVendors =
          vendorsFromApi.length > 0
            ? vendorsFromApi.map((v) => ({
                id: String(v.vendorId || v.id),
                label: String(v.vendorName || v.name || v.vendorId || v.id),
                orderTypes: Array.isArray(v.orderTypes)
                  ? v.orderTypes.map((t) => String(t || '').trim().toUpperCase()).filter(Boolean)
                  : [],
              }))
            : row.vendorId
              ? [{ id: String(row.vendorId), label: String(row.vendorName || row.vendorId) }]
              : []

        setForm({
          selectedVendors,
          title: row.title || '',
          notificationTitle: row.notificationTitle || '',
          notificationBody: row.notificationBody || '',
          radiusMeters: String(row.radiusMeters ?? 500),
          offerWindowMinutes: String(row.offerWindowMinutes ?? DEFAULT_OFFER_WINDOW_MINUTES),
          discountPercent: String(
            row.discountPercent ??
              (row.promo?.discountType === 'PERCENT' ? row.promo?.discountValue : '') ??
              '',
          ),
          maxUses: row.maxUses != null ? String(row.maxUses) : row.promo?.maxUses != null ? String(row.promo.maxUses) : '',
          maxUsesPerCustomer:
            row.maxUsesPerCustomer != null
              ? String(row.maxUsesPerCustomer)
              : row.promo?.maxUsesPerCustomer != null
                ? String(row.promo.maxUsesPerCustomer)
                : '',
          applicableOrderTypes: Array.isArray(row.applicableOrderTypes)
            ? row.applicableOrderTypes
            : [],
          promoCodeId: row.promoCodeId || '',
          promoLabel: row.promoCode || row.promo?.code || row.promoCodeId || '',
          status: row.status || 'DRAFT',
          startsAtDate: splitIsoToDateTime(row.startsAt).date,
          startsAtTime: splitIsoToDateTime(row.startsAt).time || '00:00',
          endsAtDate: splitIsoToDateTime(row.endsAt).date,
          endsAtTime: splitIsoToDateTime(row.endsAt).time || '23:59',
        })
        setStats(row.stats || null)
        // Map pins load via selectedVendors effect (all plottable vendor locations).
      } catch (err) {
        if (!cancelled) setError(formatApiErrorMessage(err) || 'Failed to load campaign.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [campaignId, isEdit])

  const selectedVendorIdsKey = useMemo(
    () => form.selectedVendors.map((v) => v.id).join(','),
    [form.selectedVendors],
  )

  const allowedOrderTypeOptions = useMemo(
    () => unionOrderTypeOptions(form.selectedVendors),
    [form.selectedVendors],
  )

  const allowedOrderTypeKey = useMemo(
    () => allowedOrderTypeOptions.map((o) => o.value).join(','),
    [allowedOrderTypeOptions],
  )

  useEffect(() => {
    const missing = form.selectedVendors.filter(
      (v) => !Array.isArray(v.orderTypes) || v.orderTypes.length === 0,
    )
    if (!missing.length) return undefined

    let cancelled = false
    ;(async () => {
      const byId = new Map()
      for (const vendor of missing) {
        const vendorId = String(vendor.id || '').trim()
        if (!vendorId) continue
        try {
          const result = await adminService.getVendorDetail(vendorId)
          const types = result?.data?.orderTypes
          if (Array.isArray(types) && types.length) {
            byId.set(vendorId, types)
            continue
          }
          const slaResult = await adminService.getVendorSla(vendorId)
          const fromSla = orderTypesFromSlaServiceModes(slaResult?.data?.serviceModes)
          if (fromSla.length) byId.set(vendorId, fromSla)
        } catch {
          /* keep chip; save may fail server-side if geo invalid */
        }
      }
      if (cancelled || !byId.size) return
      setForm((prev) => ({
        ...prev,
        selectedVendors: prev.selectedVendors.map((v) =>
          byId.has(v.id) ? { ...v, orderTypes: byId.get(v.id) } : v,
        ),
      }))
    })()

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refetch when vendor set changes
  }, [selectedVendorIdsKey])

  useEffect(() => {
    const allowed = new Set(allowedOrderTypeOptions.map((o) => o.value))
    setForm((prev) => {
      const nextTypes = prev.applicableOrderTypes.filter((t) => allowed.has(t))
      if (
        nextTypes.length === prev.applicableOrderTypes.length &&
        nextTypes.every((t, i) => t === prev.applicableOrderTypes[i])
      ) {
        return prev
      }
      return { ...prev, applicableOrderTypes: nextTypes }
    })
  }, [allowedOrderTypeKey, allowedOrderTypeOptions])

  useEffect(() => {
    const vendorIds = form.selectedVendors.map((v) => String(v.id || '').trim()).filter(Boolean)
    if (!vendorIds.length) {
      setMapLocations([])
      setVendorGeoWarnings([])
      return undefined
    }

    let cancelled = false
    setCoordsLoading(true)
    ;(async () => {
      const warnings = []
      const plottable = []
      for (const vendorId of vendorIds) {
        try {
          const result = await adminService.listVendorBranches(vendorId)
          if (cancelled) return
          const branches = Array.isArray(result?.data?.branches) ? result.data.branches : []
          const plottableBranches = branches.filter((branch) =>
            isPlottableLatLng(branch.latitude, branch.longitude),
          )
          // Prefer primary branch; avoid picking an arbitrary far/misplaced branch.
          const hit =
            plottableBranches.find((b) => b.isPrimary) || plottableBranches[0]
          const vendorMeta = form.selectedVendors.find((v) => v.id === vendorId)
          if (hit) {
            plottable.push({
              latitude: Number(hit.latitude),
              longitude: Number(hit.longitude),
              label: vendorMeta?.label || vendorId,
              vendorLocationId: hit.id ? String(hit.id) : undefined,
            })
          } else {
            warnings.push(vendorMeta?.label || vendorId)
          }
        } catch {
          const vendorMeta = form.selectedVendors.find((v) => v.id === vendorId)
          warnings.push(vendorMeta?.label || vendorId)
        }
      }
      if (!cancelled) {
        setMapLocations(plottable)
        setVendorGeoWarnings(warnings)
        setCoordsLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refetch when vendor set changes
  }, [selectedVendorIdsKey])

  const searchVendors = useCallback(async (query, options = {}) => {
    const result = await adminService.getVendors({
      search: query,
      status: 'All',
      limit: 10,
      page: 1,
      signal: options.signal,
    })
    const rows = result?.data?.rows || []
    return rows.map((row) => ({
      id: String(row.id),
      label: String(row.name || row.id),
      meta: [row.area || row.city, row.category].filter(Boolean).join(' · '),
      orderTypes: Array.isArray(row.orderTypes) ? row.orderTypes : [],
    }))
  }, [])

  function toggleOrderType(value) {
    if (!allowedOrderTypeOptions.some((o) => o.value === value)) return
    setForm((prev) => {
      const has = prev.applicableOrderTypes.includes(value)
      return {
        ...prev,
        applicableOrderTypes: has
          ? prev.applicableOrderTypes.filter((t) => t !== value)
          : [...prev.applicableOrderTypes, value],
      }
    })
  }

  async function onSubmit(event) {
    event.preventDefault()
    setError('')

    if (!form.selectedVendors.length) {
      setError('Select at least one vendor.')
      return
    }
    if (!form.notificationTitle.trim() || !form.notificationBody.trim()) {
      setError('Notification title and body are required.')
      return
    }

    const radiusMeters = Number(form.radiusMeters)
    const offerWindowMinutes = Number(form.offerWindowMinutes)
    const discountPercent = Number(form.discountPercent)
    if (!Number.isFinite(radiusMeters) || radiusMeters < 50 || radiusMeters > 5000) {
      setError('Radius must be between 50 and 5000 meters.')
      return
    }
    if (
      !Number.isFinite(offerWindowMinutes) ||
      offerWindowMinutes < MIN_OFFER_WINDOW_MINUTES ||
      offerWindowMinutes > MAX_OFFER_WINDOW_MINUTES
    ) {
      setError('Offer duration must be between 5 and 1440 minutes.')
      return
    }
    if (!Number.isFinite(discountPercent) || discountPercent <= 0 || discountPercent > 100) {
      setError('Discount percentage must be between 0 and 100.')
      return
    }
    if (vendorGeoWarnings.length) {
      setError(
        `Vendors missing geolocation: ${vendorGeoWarnings.join(', ')}. Add branch/vendor coordinates first.`,
      )
      return
    }

    const allowed = new Set(allowedOrderTypeOptions.map((o) => o.value))
    const invalidModes = form.applicableOrderTypes.filter((t) => !allowed.has(t))
    if (invalidModes.length) {
      setError(
        `Order mode not supported by selected vendor(s): ${invalidModes.join(', ')}.`,
      )
      return
    }

    const startsAt = combineDateAndTime(form.startsAtDate, form.startsAtTime)
    const endsAt = combineDateAndTime(form.endsAtDate, form.endsAtTime)
    if (form.startsAtDate && !startsAt) {
      setError('Campaign start date/time is invalid.')
      return
    }
    if (form.endsAtDate && !endsAt) {
      setError('Campaign end date/time is invalid.')
      return
    }
    if (startsAt && endsAt && new Date(endsAt) <= new Date(startsAt)) {
      setError('Campaign end must be after campaign start.')
      return
    }

    const maxUsesRaw = String(form.maxUses || '').trim()
    const maxUsesPerCustomerRaw = String(form.maxUsesPerCustomer || '').trim()

    const payload = {
      vendorIds: form.selectedVendors.map((v) => v.id),
      title: form.title.trim() || null,
      notificationTitle: form.notificationTitle.trim(),
      notificationBody: form.notificationBody.trim(),
      radiusMeters,
      offerWindowMinutes,
      discountPercent,
      maxUses: maxUsesRaw ? Number(maxUsesRaw) : null,
      maxUsesPerCustomer: maxUsesPerCustomerRaw ? Number(maxUsesPerCustomerRaw) : null,
      applicableOrderTypes: form.applicableOrderTypes,
      status: form.status,
      startsAt,
      endsAt,
      ...(form.promoCodeId ? { promoCodeId: form.promoCodeId } : {}),
      ...(mapLocations[0]
        ? {
            latitude: mapLocations[0].latitude,
            longitude: mapLocations[0].longitude,
            ...(mapLocations[0].vendorLocationId
              ? { vendorLocationId: mapLocations[0].vendorLocationId }
              : {}),
          }
        : {}),
    }

    setSaving(true)
    try {
      if (isEdit) {
        await adminService.updateAdminGeofenceCampaign(campaignId, payload)
      } else {
        await adminService.createAdminGeofenceCampaign(payload)
      }
      navigate('/admin/marketing/geofence')
    } catch (err) {
      setError(formatApiErrorMessage(err) || 'Could not save geofence campaign.')
    } finally {
      setSaving(false)
    }
  }

  async function onPauseOrDelete() {
    if (!isEdit) return
    setSaving(true)
    setError('')
    try {
      await adminService.deleteAdminGeofenceCampaign(campaignId)
      navigate('/admin/marketing/geofence')
    } catch (err) {
      setError(formatApiErrorMessage(err) || 'Could not pause/delete campaign.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="px-5 py-8 text-[13px] text-[#7c8780] max-[700px]:px-3">Loading…</div>
    )
  }

  const mapLabel =
    form.selectedVendors.length === 1
      ? form.selectedVendors[0].label
      : form.selectedVendors.length > 1
        ? `${form.selectedVendors.length} vendors`
        : 'Geofence'

  return (
    <div className="px-5 py-4 pb-10 max-[700px]:px-3">
      <button
        type="button"
        onClick={goBack}
        className="mb-3 inline-flex items-center gap-1 text-[12.5px] font-semibold text-[#69756d] hover:text-[#17231c]"
      >
        <ChevronLeft size={14} />
        Back to geofence offers
      </button>

      <div className="mb-4">
        <h2 className="text-[20px] font-bold tracking-[-0.02em] text-[#17231c]">
          {isEdit ? 'Edit geofence offer' : 'New geofence offer'}
        </h2>
        <p className="mt-0.5 text-[12.5px] text-[#7c8780]">
          Configure multi-vendor radius offers, discount, order mode, and push copy. Discount and
          usage limits are stored on the linked PromoCode.
        </p>
      </div>

      {stats ? (
        <div className="mb-4 grid grid-cols-3 gap-3 max-[700px]:grid-cols-1">
          {[
            { label: 'Triggered', value: stats.triggered ?? 0 },
            { label: 'Opened', value: stats.opened ?? 0 },
            { label: 'Used', value: stats.used ?? 0 },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-[14px] border border-[#eceeec] bg-white px-4 py-3.5"
            >
              <p className="text-[22px] font-bold text-[#17231c]">{item.value}</p>
              <p className="mt-1 text-[12px] text-[#7c8780]">{item.label}</p>
            </div>
          ))}
        </div>
      ) : null}

      {error ? (
        <div className="mb-4 rounded-[10px] border border-[#f0d6d6] bg-[#fff6f6] px-3.5 py-2.5 text-[12.5px] text-[#b42318]">
          {error}
        </div>
      ) : null}

      <form
        onSubmit={onSubmit}
        className="grid max-w-[1200px] grid-cols-[minmax(0,1fr)_minmax(320px,420px)] items-start gap-4 max-[980px]:grid-cols-1"
      >
        <div className="flex min-w-0 flex-col gap-4">
          <Card
            title="Vendors & radius"
            subtitle="Select one or more participating vendors. Each vendor needs usable coordinates."
          >
            <div className="grid gap-3">
              <AdminEntitySearchPicker
                label="Vendors"
                placeholder="Search vendors…"
                helperText={`${form.selectedVendors.length} selected`}
                minQueryLength={0}
                selected={form.selectedVendors}
                onChange={(selectedVendors) => setForm((prev) => ({ ...prev, selectedVendors }))}
                searchFn={searchVendors}
              />
              <Field label="Radius (meters)">
                <input
                  className={inputClass}
                  type="number"
                  min={50}
                  max={5000}
                  value={form.radiusMeters}
                  onChange={(e) => setForm((p) => ({ ...p, radiusMeters: e.target.value }))}
                />
              </Field>
              {coordsLoading ? (
                <p className="text-[12.5px] text-[#7c8780]">Checking vendor locations…</p>
              ) : null}
              {vendorGeoWarnings.length ? (
                <p className="text-[12.5px] text-[#b42318]">
                  Missing geolocation: {vendorGeoWarnings.join(', ')}. Add branch/vendor lat/lng
                  before saving.
                </p>
              ) : null}
              {!form.selectedVendors.length ? (
                <p className="text-[12.5px] text-[#7c8780]">No vendors selected yet.</p>
              ) : null}
            </div>
          </Card>

          <Card
            title="Discount & usage"
            subtitle="Stored on the campaign PromoCode (percentage discount + usage caps)."
          >
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Discount %">
                <input
                  className={inputClass}
                  type="number"
                  min={1}
                  max={100}
                  step="0.1"
                  value={form.discountPercent}
                  onChange={(e) => setForm((p) => ({ ...p, discountPercent: e.target.value }))}
                  required
                />
              </Field>
              <Field label="Total usage limit">
                <input
                  className={inputClass}
                  type="number"
                  min={1}
                  placeholder="Unlimited"
                  value={form.maxUses}
                  onChange={(e) => setForm((p) => ({ ...p, maxUses: e.target.value }))}
                />
              </Field>
              <Field label="Per-customer limit">
                <input
                  className={inputClass}
                  type="number"
                  min={1}
                  placeholder="Unlimited"
                  value={form.maxUsesPerCustomer}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, maxUsesPerCustomer: e.target.value }))
                  }
                />
              </Field>
            </div>
            {form.promoLabel ? (
              <p className="mt-3 text-[12px] text-[#7c8780]">
                Linked promo code: <span className="font-semibold text-[#17231c]">{form.promoLabel}</span>
              </p>
            ) : null}
          </Card>

          <Card title="Order mode & offer window">
            <div className="grid gap-3">
              <div>
                <span className={labelClass}>Applicable order modes</span>
                {!form.selectedVendors.length ? (
                  <p className="mt-1.5 text-[12.5px] text-[#7c8780]">
                    Select vendor(s) first — only their supported order modes will appear here.
                  </p>
                ) : allowedOrderTypeOptions.length === 0 ? (
                  <p className="mt-1.5 text-[12.5px] text-[#b42318]">
                    Selected vendor(s) have no order modes configured. Update vendor SLA / service
                    modes first.
                  </p>
                ) : (
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    {allowedOrderTypeOptions.map((opt) => {
                      const active = form.applicableOrderTypes.includes(opt.value)
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => toggleOrderType(opt.value)}
                          className={cn(
                            'h-[32px] rounded-full px-3.5 text-[12px] font-bold transition',
                            active
                              ? 'bg-[#e8f7ed] text-[#1aa054] ring-1 ring-[#b7e4c7]'
                              : 'bg-white text-[#69756d] ring-1 ring-[#e4e8e4]',
                          )}
                        >
                          {opt.label}
                        </button>
                      )
                    })}
                  </div>
                )}
                <p className="mt-1.5 text-[11.5px] text-[#8a948e]">
                  Options match selected vendors (delivery, pickup, dine-in, service). Leave all
                  unchecked for every supported mode. Example: Pickup only → 25% OFF PICKUP.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 max-[600px]:grid-cols-1">
                <Field label="Offer duration (minutes)">
                  <input
                    className={inputClass}
                    type="number"
                    min={MIN_OFFER_WINDOW_MINUTES}
                    max={MAX_OFFER_WINDOW_MINUTES}
                    value={form.offerWindowMinutes}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, offerWindowMinutes: e.target.value }))
                    }
                  />
                </Field>
                <Field label="Status">
                  <Select
                    value={form.status}
                    onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
            </div>
          </Card>

          <Card title="Campaign & push">
            <div className="grid gap-3">
              <Field label="Campaign name">
                <input
                  className={inputClass}
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="Lunch pickup near Seef"
                />
              </Field>
              <Field label="Push title">
                <input
                  className={inputClass}
                  value={form.notificationTitle}
                  onChange={(e) => setForm((p) => ({ ...p, notificationTitle: e.target.value }))}
                  placeholder="You're near a Yjeek offer!"
                  required
                />
              </Field>
              <Field label="Push message">
                <textarea
                  className={cn(inputClass, 'h-auto min-h-[88px] py-2.5')}
                  value={form.notificationBody}
                  onChange={(e) => setForm((p) => ({ ...p, notificationBody: e.target.value }))}
                  placeholder="Get 25% OFF pickup for the next 10 minutes."
                  required
                />
              </Field>
              <div className="grid grid-cols-2 gap-3 max-[600px]:grid-cols-1">
                <div className="grid gap-2">
                  <Field label="Campaign starts">
                    <AdminDatePicker
                      value={form.startsAtDate}
                      onChange={(date) => setForm((p) => ({ ...p, startsAtDate: date }))}
                      min={null}
                      placeholder="Start date"
                    />
                  </Field>
                  <Field label="Start time">
                    <input
                      type="time"
                      className={inputClass}
                      value={form.startsAtTime}
                      onChange={(e) => setForm((p) => ({ ...p, startsAtTime: e.target.value }))}
                    />
                  </Field>
                </div>
                <div className="grid gap-2">
                  <Field label="Campaign ends">
                    <AdminDatePicker
                      value={form.endsAtDate}
                      onChange={(date) => setForm((p) => ({ ...p, endsAtDate: date }))}
                      min={form.startsAtDate || null}
                      placeholder="End date"
                    />
                  </Field>
                  <Field label="End time">
                    <input
                      type="time"
                      className={inputClass}
                      value={form.endsAtTime}
                      onChange={(e) => setForm((p) => ({ ...p, endsAtTime: e.target.value }))}
                    />
                  </Field>
                </div>
              </div>
            </div>
          </Card>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-[40px] items-center rounded-full bg-[#1aa054] px-5 text-[13px] font-bold text-white hover:bg-[#158a47] disabled:opacity-60"
            >
              {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create campaign'}
            </button>
            <button
              type="button"
              onClick={goBack}
              className="inline-flex h-[40px] items-center rounded-full border border-[#e4e8e4] bg-white px-5 text-[13px] font-bold text-[#455249]"
            >
              Cancel
            </button>
            {isEdit ? (
              <button
                type="button"
                disabled={saving}
                onClick={onPauseOrDelete}
                className="inline-flex h-[40px] items-center rounded-full border border-[#f0d6d6] bg-white px-5 text-[13px] font-bold text-[#b42318] disabled:opacity-60"
              >
                Pause / delete
              </button>
            ) : null}
          </div>
        </div>

        <aside className="min-w-0 max-[980px]:order-first">
          <div className="sticky top-4">
            <AdminGeofenceRadiusMap
              locations={mapLocations}
              radiusMeters={form.radiusMeters}
              label={mapLabel}
              emptyHint="Select vendors to preview all plottable locations and radius."
              heightClassName="h-[min(62vh,520px)] max-[980px]:h-[300px]"
            />
          </div>
        </aside>
      </form>
    </div>
  )
}
