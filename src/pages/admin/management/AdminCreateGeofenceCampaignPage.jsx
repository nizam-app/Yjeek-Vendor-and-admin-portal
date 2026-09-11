import { useCallback, useEffect, useState } from 'react'
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
const DEFAULT_OFFER_WINDOW_MINUTES = 120
const MIN_OFFER_WINDOW_MINUTES = 15
const MAX_OFFER_WINDOW_MINUTES = 24 * 60

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
  vendorId: '',
  vendorLabel: '',
  vendorLocationId: '',
  promoCodeId: '',
  promoLabel: '',
  title: '',
  notificationTitle: '',
  notificationBody: '',
  radiusMeters: '500',
  offerWindowMinutes: String(DEFAULT_OFFER_WINDOW_MINUTES),
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
  const [vendorCoords, setVendorCoords] = useState(null)
  const [coordsLoading, setCoordsLoading] = useState(false)

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
        setForm({
          vendorId: row.vendorId || '',
          vendorLabel: row.vendorName || row.vendorId || '',
          vendorLocationId: row.vendorLocationId || '',
          promoCodeId: row.promoCodeId || '',
          promoLabel: row.promoCode || row.promo?.code || row.promoCodeId || '',
          title: row.title || '',
          notificationTitle: row.notificationTitle || '',
          notificationBody: row.notificationBody || '',
          radiusMeters: String(row.radiusMeters ?? 500),
          offerWindowMinutes: String(row.offerWindowMinutes ?? DEFAULT_OFFER_WINDOW_MINUTES),
          status: row.status || 'DRAFT',
          startsAtDate: splitIsoToDateTime(row.startsAt).date,
          startsAtTime: splitIsoToDateTime(row.startsAt).time || '00:00',
          endsAtDate: splitIsoToDateTime(row.endsAt).date,
          endsAtTime: splitIsoToDateTime(row.endsAt).time || '23:59',
        })
        setStats(row.stats || null)
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

  useEffect(() => {
    const vendorId = String(form.vendorId || '').trim()
    if (!vendorId) {
      setVendorCoords(null)
      setForm((prev) => (prev.vendorLocationId ? { ...prev, vendorLocationId: '' } : prev))
      return undefined
    }

    let cancelled = false
    setCoordsLoading(true)
    ;(async () => {
      try {
        const result = await adminService.listVendorBranches(vendorId)
        if (cancelled) return
        const branches = Array.isArray(result?.data?.branches) ? result.data.branches : []
        const preferredId = String(form.vendorLocationId || '').trim()
        const sorted = [...branches].sort((a, b) => {
          if (preferredId) {
            if (String(a.id) === preferredId) return -1
            if (String(b.id) === preferredId) return 1
          }
          return Number(Boolean(b.isPrimary)) - Number(Boolean(a.isPrimary))
        })
        const hit = sorted.find((branch) => isPlottableLatLng(branch.latitude, branch.longitude))
        if (hit) {
          setVendorCoords({
            latitude: Number(hit.latitude),
            longitude: Number(hit.longitude),
          })
          setForm((prev) =>
            prev.vendorLocationId === String(hit.id)
              ? prev
              : { ...prev, vendorLocationId: String(hit.id) },
          )
        } else {
          setVendorCoords(null)
          setForm((prev) => (prev.vendorLocationId ? { ...prev, vendorLocationId: '' } : prev))
        }
      } catch {
        if (!cancelled) {
          setVendorCoords(null)
        }
      } finally {
        if (!cancelled) setCoordsLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
    // Re-resolve when vendor changes; preferred branch id from edit load is applied on first run.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only refetch on vendorId
  }, [form.vendorId])

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
    }))
  }, [])

  const searchPromoCodes = useCallback(async (query, options = {}) => {
    const result = await adminService.listAdminMarketingPromoCodes({
      status: 'active',
      limit: 50,
      signal: options.signal,
      params: { search: query },
    })
    const rows = result?.data?.promoCodes?.rows || []
    const term = String(query || '').trim().toLowerCase()
    return rows
      .filter((row) => {
        if (!term) return true
        return (
          String(row.code || '')
            .toLowerCase()
            .includes(term) ||
          String(row.description || '')
            .toLowerCase()
            .includes(term)
        )
      })
      .map((row) => ({
        id: String(row.id),
        label: String(row.code || row.id),
        meta: [row.description, row.type].filter((part) => part && part !== '—').join(' · '),
      }))
  }, [])

  async function onSubmit(event) {
    event.preventDefault()
    setError('')

    if (!form.vendorId) {
      setError('Select a vendor.')
      return
    }
    if (!form.promoCodeId) {
      setError('Select a promo code (create one under Promo codes first if needed).')
      return
    }
    if (!form.notificationTitle.trim() || !form.notificationBody.trim()) {
      setError('Notification title and body are required.')
      return
    }

    const radiusMeters = Number(form.radiusMeters)
    const offerWindowMinutes = Number(form.offerWindowMinutes)
    if (!Number.isFinite(radiusMeters) || radiusMeters < 50 || radiusMeters > 5000) {
      setError('Radius must be between 50 and 5000 meters.')
      return
    }
    if (
      !Number.isFinite(offerWindowMinutes) ||
      offerWindowMinutes < MIN_OFFER_WINDOW_MINUTES ||
      offerWindowMinutes > MAX_OFFER_WINDOW_MINUTES
    ) {
      setError('Offer window must be between 15 and 1440 minutes.')
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

    if (!vendorCoords || !isPlottableLatLng(vendorCoords.latitude, vendorCoords.longitude)) {
      setError('Selected vendor has no branch coordinates. Add a branch location first.')
      return
    }

    const payload = {
      vendorId: form.vendorId,
      vendorLocationId: form.vendorLocationId || null,
      promoCodeId: form.promoCodeId,
      title: form.title.trim() || null,
      notificationTitle: form.notificationTitle.trim(),
      notificationBody: form.notificationBody.trim(),
      radiusMeters,
      offerWindowMinutes,
      status: form.status,
      startsAt,
      endsAt,
      latitude: vendorCoords.latitude,
      longitude: vendorCoords.longitude,
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
          Link a vendor location + promo code. Customers who enter the radius get a push with a
          time-limited unlock.
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
            title="Vendor & location"
            subtitle="Uses the vendor branch location automatically. Change radius to update the fence on the map."
          >
            <div className="grid gap-3">
              <AdminEntitySearchPicker
                label="Vendor"
                placeholder="Search vendor…"
                selected={
                  form.vendorId
                    ? [{ id: form.vendorId, label: form.vendorLabel || form.vendorId }]
                    : []
                }
                onChange={(next) => {
                  const item = next.length ? next[next.length - 1] : null
                  setForm((prev) => ({
                    ...prev,
                    vendorId: item?.id || '',
                    vendorLabel: item?.label || '',
                    vendorLocationId: '',
                  }))
                  setVendorCoords(null)
                }}
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
              {form.vendorId && !coordsLoading && !vendorCoords ? (
                <p className="text-[12.5px] text-[#b42318]">
                  This vendor has no branch coordinates yet. Add lat/lng on a branch first.
                </p>
              ) : null}
              {coordsLoading ? (
                <p className="text-[12.5px] text-[#7c8780]">Loading vendor location…</p>
              ) : null}
            </div>
          </Card>

          <Card
            title="Coupon"
            subtitle="Pick an existing code from Marketing → Promo codes (usage limits & discount live on that code)."
          >
            <AdminEntitySearchPicker
              label="Promo code"
              placeholder="Search promo code…"
              helperText="Lists active promo codes from Marketing."
              minQueryLength={0}
              allowRawIdAdd={false}
              selected={
                form.promoCodeId
                  ? [{ id: form.promoCodeId, label: form.promoLabel || form.promoCodeId }]
                  : []
              }
              onChange={(next) => {
                const item = next.length ? next[next.length - 1] : null
                setForm((prev) => ({
                  ...prev,
                  promoCodeId: item?.id || '',
                  promoLabel: item?.label || '',
                }))
              }}
              searchFn={searchPromoCodes}
            />
          </Card>

          <Card title="Notification & timing">
            <div className="grid gap-3">
              <Field label="Internal title (optional)">
                <input
                  className={inputClass}
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="ABC Lunch geofence"
                />
              </Field>
              <Field label="Push title">
                <input
                  className={inputClass}
                  value={form.notificationTitle}
                  onChange={(e) => setForm((p) => ({ ...p, notificationTitle: e.target.value }))}
                  placeholder="You're near ABC Restaurant!"
                  required
                />
              </Field>
              <Field label="Push body">
                <textarea
                  className={cn(inputClass, 'h-auto min-h-[88px] py-2.5')}
                  value={form.notificationBody}
                  onChange={(e) => setForm((p) => ({ ...p, notificationBody: e.target.value }))}
                  placeholder="Get 20% OFF for the next 2 hours. Use code ABC20."
                  required
                />
              </Field>
              <div className="grid grid-cols-2 gap-3 max-[600px]:grid-cols-1">
                <Field label="Personal offer window (minutes)">
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
              latitude={vendorCoords?.latitude}
              longitude={vendorCoords?.longitude}
              radiusMeters={form.radiusMeters}
              label={form.vendorLabel || 'Geofence'}
              emptyHint="Select a vendor to preview its location and radius."
              heightClassName="h-[min(62vh,520px)] max-[980px]:h-[300px]"
            />
          </div>
        </aside>
      </form>
    </div>
  )
}
