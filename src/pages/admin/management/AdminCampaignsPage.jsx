import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { formatApiErrorMessage } from '../../../api/errors'
import { adminService } from '../../../services/adminService'
import { MarketingViewTabs } from '../../../components/admin/MarketingViewTabs'
import { cn } from '../../../components/admin/cn'

const labelClass = 'mb-1.5 block text-[12px] font-medium leading-none text-[#7c8780]'
const inputClass =
  'box-border h-[40px] w-full rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white px-3 text-[13px] text-[#17231c] outline-none transition placeholder:text-[#9aa49d] focus:border-[#1aa054] disabled:bg-[#f5f6f5] disabled:text-[#9aa49d]'

const CAMPAIGN_TYPES = [
  { id: 'WELCOME', label: 'Welcome' },
  { id: 'WIN_BACK', label: 'Win-back' },
  { id: 'BOOST_DAY', label: 'Boost day' },
  { id: 'FLASH_DEAL', label: 'Flash deal' },
  { id: 'HAPPY_HOUR', label: 'Happy hour' },
  { id: 'MISSIONS', label: 'Missions' },
  { id: 'SEASONAL', label: 'Seasonal' },
]

const VOUCHER_TYPES = new Set(['WELCOME', 'WIN_BACK', 'FLASH_DEAL', 'HAPPY_HOUR', 'SEASONAL'])
const WINDOW_TYPES = new Set(['HAPPY_HOUR', 'FLASH_DEAL', 'SEASONAL'])

const SEASONS = [
  { id: 'RAMADAN', label: 'Ramadan' },
  { id: 'EID', label: 'Eid' },
  { id: 'NATIONAL_DAY', label: 'National Day' },
  { id: 'F1', label: 'F1' },
  { id: 'BACK_TO_SCHOOL', label: 'Back to school' },
]

const WEEKDAYS = [
  { id: 1, label: 'Mon' },
  { id: 2, label: 'Tue' },
  { id: 3, label: 'Wed' },
  { id: 4, label: 'Thu' },
  { id: 5, label: 'Fri' },
  { id: 6, label: 'Sat' },
  { id: 7, label: 'Sun' },
]

const STATUS_LABELS = {
  DRAFT: 'Draft',
  PENDING_APPROVAL: 'Pending approval',
  LIVE: 'Live',
  ENDED: 'Ended',
}

function emptyForm() {
  return {
    name: '',
    type: 'WELCOME',
    templateIds: [],
    segmentId: '',
    pushId: '',
    bannerId: '',
    budget: '',
    startsAt: '',
    endsAt: '',
    windowStartTime: '',
    windowEndTime: '',
    windowDaysOfWeek: [],
    inactiveDays: '',
    boostCategoryIds: [],
    boostMultiplier: '',
    seasonKey: '',
    rewardTemplateId: '',
    targetOrders: '',
    windowDays: '',
    expectedRedemptionRate: '',
    segmentSizeOverride: '',
    avgVoucherValueOverride: '',
  }
}

function Field({ label, children, hint }) {
  return (
    <label className="block min-w-0">
      <span className={labelClass}>{label}</span>
      {children}
      {hint ? <p className="mt-1 text-[11.5px] text-[#9aa49d]">{hint}</p> : null}
    </label>
  )
}

function Select({ children, ...props }) {
  return (
    <div className="relative">
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

function toLocalInput(iso) {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function toIso(local) {
  const raw = String(local || '').trim()
  if (!raw) return null
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}

function optionalNumber(value) {
  const raw = String(value ?? '').trim()
  if (!raw) return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

function typeLabel(type) {
  return CAMPAIGN_TYPES.find((item) => item.id === type)?.label ?? type
}

function formFromCampaign(row) {
  return {
    name: row.name ?? '',
    type: row.type ?? 'WELCOME',
    templateIds: Array.isArray(row.templates) ? row.templates.map((item) => item.id) : [],
    segmentId: row.segmentId ?? '',
    pushId: row.pushId ?? '',
    bannerId: row.bannerId ?? '',
    budget: row.budget != null ? String(row.budget) : '',
    startsAt: toLocalInput(row.startsAt),
    endsAt: toLocalInput(row.endsAt),
    windowStartTime: row.windowStartTime ?? '',
    windowEndTime: row.windowEndTime ?? '',
    windowDaysOfWeek: Array.isArray(row.windowDaysOfWeek) ? row.windowDaysOfWeek : [],
    inactiveDays: row.inactiveDays != null ? String(row.inactiveDays) : '',
    boostCategoryIds: Array.isArray(row.boostCategoryIds) ? row.boostCategoryIds : [],
    boostMultiplier: row.boostMultiplier != null ? String(row.boostMultiplier) : '',
    seasonKey: row.seasonKey ?? '',
    rewardTemplateId: row.mission?.rewardTemplateId ?? '',
    targetOrders: row.mission?.targetOrders != null ? String(row.mission.targetOrders) : '',
    windowDays: row.mission?.windowDays != null ? String(row.mission.windowDays) : '',
    expectedRedemptionRate:
      row.expectedRedemptionRate != null ? String(row.expectedRedemptionRate) : '',
    segmentSizeOverride: row.segmentSizeOverride != null ? String(row.segmentSizeOverride) : '',
    avgVoucherValueOverride:
      row.avgVoucherValueOverride != null ? String(row.avgVoucherValueOverride) : '',
  }
}

const MISSING_LABELS = {
  segmentSize: 'segment size',
  expectedRedemptionRate: 'expected redemption rate',
  avgVoucherValue: 'average voucher value',
}

function formatBhd(value) {
  if (value == null || !Number.isFinite(Number(value))) return null
  return `BHD ${Number(value).toFixed(3)}`
}

function sizeSourceLabel(source) {
  if (source === 'override') return 'manual size'
  if (source === 'segment') return 'segment size'
  return ''
}

function avgSourceLabel(source) {
  if (source === 'override') return 'manual average'
  if (source === 'templates') return 'template average'
  return ''
}

function buildPayload(form) {
  const templateIds =
    form.type === 'MISSIONS'
      ? form.rewardTemplateId
        ? [form.rewardTemplateId]
        : []
      : form.templateIds
  return {
    name: form.name.trim(),
    type: form.type,
    templateIds,
    segmentId: form.segmentId || null,
    pushId: form.pushId || null,
    bannerId: form.bannerId || null,
    budget: optionalNumber(form.budget),
    startsAt: toIso(form.startsAt),
    endsAt: toIso(form.endsAt),
    windowStartTime: WINDOW_TYPES.has(form.type) ? form.windowStartTime || null : null,
    windowEndTime: WINDOW_TYPES.has(form.type) ? form.windowEndTime || null : null,
    windowDaysOfWeek: WINDOW_TYPES.has(form.type) ? form.windowDaysOfWeek : [],
    inactiveDays: form.type === 'WIN_BACK' ? optionalNumber(form.inactiveDays) : null,
    boostCategoryIds: form.type === 'BOOST_DAY' ? form.boostCategoryIds : [],
    boostMultiplier: form.type === 'BOOST_DAY' ? optionalNumber(form.boostMultiplier) : null,
    seasonKey: form.type === 'SEASONAL' ? form.seasonKey || null : null,
    rewardTemplateId: form.type === 'MISSIONS' ? form.rewardTemplateId || null : null,
    targetOrders: form.type === 'MISSIONS' ? optionalNumber(form.targetOrders) : null,
    windowDays: form.type === 'MISSIONS' ? optionalNumber(form.windowDays) : null,
    expectedRedemptionRate: optionalNumber(form.expectedRedemptionRate),
    segmentSizeOverride: optionalNumber(form.segmentSizeOverride),
    avgVoucherValueOverride: optionalNumber(form.avgVoucherValueOverride),
    status: 'DRAFT',
  }
}

export default function AdminCampaignsPage() {
  const [campaigns, setCampaigns] = useState([])
  const [options, setOptions] = useState({
    templates: [],
    segments: [],
    pushes: [],
    banners: [],
    categories: [],
    seasonPresets: [],
  })
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [editingStatus, setEditingStatus] = useState(null)
  const [boostRules, setBoostRules] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [projection, setProjection] = useState(null)
  const [projectionError, setProjectionError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [listRes, optionsRes] = await Promise.all([
        adminService.listAdminCampaigns({ limit: 50 }),
        adminService.getAdminCampaignOptions(),
      ])
      setCampaigns(Array.isArray(listRes?.data?.campaigns) ? listRes.data.campaigns : [])
      setOptions({
        templates: optionsRes?.data?.templates ?? [],
        segments: optionsRes?.data?.segments ?? [],
        pushes: optionsRes?.data?.pushes ?? [],
        banners: optionsRes?.data?.banners ?? [],
        categories: optionsRes?.data?.categories ?? [],
        seasonPresets: optionsRes?.data?.seasonPresets ?? [],
      })
    } catch (err) {
      setError(formatApiErrorMessage(err) || 'Failed to load campaigns.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const selectedTemplates = useMemo(() => {
    const ids = new Set(form.templateIds)
    return options.templates.filter((row) => ids.has(row.id))
  }, [form.templateIds, options.templates])

  function patch(partial) {
    setForm((current) => ({ ...current, ...partial }))
  }

  function toggleId(key, id) {
    setForm((current) => {
      const list = current[key]
      const next = list.includes(id) ? list.filter((item) => item !== id) : [...list, id]
      return { ...current, [key]: next }
    })
  }

  function applySaved(saved, message) {
    if (saved?.id) {
      setEditingId(saved.id)
      setEditingStatus(saved.status ?? 'DRAFT')
      setBoostRules(Array.isArray(saved.boostRules) ? saved.boostRules : [])
      setForm(formFromCampaign(saved))
      setProjection(saved.projection ?? null)
    }
    if (message) setNotice(message)
  }

  function startNew() {
    setEditingId(null)
    setEditingStatus(null)
    setBoostRules([])
    setForm(emptyForm())
    setProjection(null)
    setProjectionError('')
    setNotice('')
    setError('')
  }

  function startEdit(row) {
    setEditingId(row.id)
    setEditingStatus(row.status ?? 'DRAFT')
    setBoostRules(Array.isArray(row.boostRules) ? row.boostRules : [])
    setForm(formFromCampaign(row))
    setProjection(row.projection ?? null)
    setProjectionError('')
    setNotice('')
    setError('')
  }

  useEffect(() => {
    const rateRaw = String(form.expectedRedemptionRate ?? '').trim()
    const sizeRaw = String(form.segmentSizeOverride ?? '').trim()
    const avgRaw = String(form.avgVoucherValueOverride ?? '').trim()
    const rate = optionalNumber(form.expectedRedemptionRate)
    const size = optionalNumber(form.segmentSizeOverride)
    const avg = optionalNumber(form.avgVoucherValueOverride)
    if (rateRaw && (rate == null || rate < 0 || rate > 1)) {
      setProjectionError('Expected redemption rate must be a number from 0 to 1.')
      return undefined
    }
    if (sizeRaw && (size == null || !Number.isInteger(size) || size < 0)) {
      setProjectionError('Segment size override must be a whole number, 0 or more.')
      return undefined
    }
    if (avgRaw && (avg == null || avg < 0)) {
      setProjectionError('Average voucher value must be a BHD amount, 0 or more.')
      return undefined
    }

    setProjectionError('')
    const handle = setTimeout(async () => {
      try {
        const templateIds =
          form.type === 'MISSIONS'
            ? form.rewardTemplateId
              ? [form.rewardTemplateId]
              : []
            : form.templateIds
        const res = await adminService.previewAdminCampaignCost({
          type: form.type,
          templateIds,
          segmentId: form.segmentId || null,
          rewardTemplateId: form.type === 'MISSIONS' ? form.rewardTemplateId || null : null,
          expectedRedemptionRate: rate,
          segmentSizeOverride: size,
          avgVoucherValueOverride: avg,
        })
        setProjection(res?.data ?? null)
      } catch (err) {
        setProjectionError(formatApiErrorMessage(err) || 'Could not preview the projected cost.')
      }
    }, 350)
    return () => clearTimeout(handle)
  }, [
    form.type,
    form.templateIds,
    form.segmentId,
    form.rewardTemplateId,
    form.expectedRedemptionRate,
    form.segmentSizeOverride,
    form.avgVoucherValueOverride,
  ])

  async function onSave(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const body = buildPayload(form)
      const res = editingId
        ? await adminService.updateAdminCampaign(editingId, body)
        : await adminService.createAdminCampaign(body)
      const saved = res?.data
      applySaved(saved, editingId ? 'Draft updated.' : 'Draft saved.')
      await load()
    } catch (err) {
      setError(formatApiErrorMessage(err) || 'Could not save the campaign draft.')
    } finally {
      setSaving(false)
    }
  }

  async function onDelete(id) {
    setError('')
    setNotice('')
    try {
      await adminService.deleteAdminCampaign(id)
      if (editingId === id) startNew()
      setNotice('Draft deleted.')
      await load()
    } catch (err) {
      setError(formatApiErrorMessage(err) || 'Could not delete the draft.')
    }
  }

  async function onActivate() {
    if (!editingId) return
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const res = await adminService.activateAdminCampaign(editingId)
      applySaved(res?.data, 'Campaign is live.')
      await load()
    } catch (err) {
      setError(formatApiErrorMessage(err) || 'Could not activate the campaign.')
    } finally {
      setSaving(false)
    }
  }

  async function onEnd() {
    if (!editingId) return
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const res = await adminService.endAdminCampaign(editingId)
      applySaved(res?.data, 'Campaign ended.')
      await load()
    } catch (err) {
      setError(formatApiErrorMessage(err) || 'Could not end the campaign.')
    } finally {
      setSaving(false)
    }
  }

  async function onSubmitApproval() {
    if (!editingId) return
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const res = await adminService.submitAdminCampaignApproval(editingId)
      applySaved(
        res?.data?.campaign,
        'Submitted for Founder approval. It stays pending until that gate exists and does not go live.',
      )
      await load()
    } catch (err) {
      setError(formatApiErrorMessage(err) || 'Could not submit the campaign.')
    } finally {
      setSaving(false)
    }
  }

  async function onRevertDraft() {
    if (!editingId) return
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const res = await adminService.revertAdminCampaignDraft(editingId)
      applySaved(res?.data, 'Returned to draft. Founder approval is not in this step.')
      await load()
    } catch (err) {
      setError(formatApiErrorMessage(err) || 'Could not return the campaign to draft.')
    } finally {
      setSaving(false)
    }
  }

  async function onFromSeason(seasonKey) {
    if (form.templateIds.length < 1) {
      setError('Select a voucher template first, then create the seasonal draft.')
      return
    }
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const res = await adminService.createAdminCampaignFromSeason({
        seasonKey,
        templateIds: form.templateIds,
        name: form.name.trim() || undefined,
        segmentId: form.segmentId || null,
        pushId: form.pushId || null,
        bannerId: form.bannerId || null,
        budget: optionalNumber(form.budget),
        expectedRedemptionRate: optionalNumber(form.expectedRedemptionRate),
        segmentSizeOverride: optionalNumber(form.segmentSizeOverride),
        avgVoucherValueOverride: optionalNumber(form.avgVoucherValueOverride),
      })
      applySaved(res?.data?.campaign, 'Seasonal draft created.')
      await load()
    } catch (err) {
      setError(formatApiErrorMessage(err) || 'Could not create the seasonal draft.')
    } finally {
      setSaving(false)
    }
  }

  const templatesRequired = VOUCHER_TYPES.has(form.type)
  const selectedSegment = options.segments.find((row) => row.id === form.segmentId) ?? null
  const projectedLabel = formatBhd(projection?.projectedCost)
  const missingLabels = (projection?.missingInputs ?? []).map((key) => MISSING_LABELS[key] ?? key)
  const locked = Boolean(editingStatus && editingStatus !== 'DRAFT')
  const canLeaveDraft =
    Boolean(editingId) &&
    editingStatus === 'DRAFT' &&
    !projectionError &&
    projection &&
    !projection.activationBlocked
  const statusLabel = STATUS_LABELS[editingStatus] ?? 'Draft'

  return (
    <div className="mx-auto max-w-[1180px] px-4 py-5">
      <div className="mb-3">
        <h1 className="text-[20px] font-bold text-[#17231c]">Campaigns</h1>
        <p className="mt-1 text-[13px] text-[#7c8780]">
          A campaign is one bundle: voucher templates, an optional segment, push, banner, dates, and a budget.
          Activate a complete draft to run it. End stops it.
        </p>
      </div>
      <MarketingViewTabs active="campaigns" />

      {error ? (
        <div className="mb-3 rounded-[10px] border border-[#f3d0d0] bg-[#fff6f6] px-3 py-2 text-[12.5px] text-[#9b2c2c]">
          {error}
        </div>
      ) : null}
      {notice ? (
        <div className="mb-3 rounded-[10px] border border-[#cfe8d7] bg-[#f3fbf6] px-3 py-2 text-[12.5px] text-[#1a6b3c]">
          {notice}
        </div>
      ) : null}

      <div className="grid items-start gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <section className="rounded-[14px] border border-[#eceeec] bg-white p-4 shadow-[0_1px_2px_rgba(20,40,28,.03)]">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-[15px] font-bold text-[#17231c]">Campaigns</h2>
            <button
              type="button"
              onClick={startNew}
              className="h-[32px] rounded-full bg-[#1aa054] px-3 text-[12px] font-bold text-white"
            >
              New
            </button>
          </div>
          {loading ? <p className="text-[13px] text-[#7c8780]">Loading…</p> : null}
          {!loading && campaigns.length === 0 ? (
            <p className="text-[13px] text-[#7c8780]">No campaigns yet.</p>
          ) : null}
          <ul className="space-y-2">
            {campaigns.map((row) => (
              <li key={row.id}>
                <button
                  type="button"
                  onClick={() => startEdit(row)}
                  className={cn(
                    'w-full rounded-[10px] border px-3 py-2 text-left',
                    editingId === row.id
                      ? 'border-[#1aa054] bg-[#f3fbf6]'
                      : 'border-[#eceeec] bg-white hover:border-[#cfe8d7]',
                  )}
                >
                  <span className="block text-[13px] font-bold text-[#17231c]">{row.name}</span>
                  <span className="mt-1 flex flex-wrap items-center gap-2 text-[11.5px] text-[#7c8780]">
                    <span>{typeLabel(row.type)}</span>
                    <span className="rounded-full bg-[#f4f6f4] px-2 py-0.5 font-bold text-[#455249]">
                      {STATUS_LABELS[row.status] ?? row.status}
                    </span>
                    <span className="font-bold text-[#17231c]">
                      {formatBhd(row.projection?.projectedCost ?? row.projectedCost) ?? 'Cost incomplete'}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <form
          onSubmit={onSave}
          className="rounded-[14px] border border-[#eceeec] bg-white p-5 shadow-[0_1px_2px_rgba(20,40,28,.03)]"
        >
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-[15px] font-bold text-[#17231c]">
                {editingId ? (locked ? statusLabel : 'Edit draft') : 'New draft'}
              </h2>
              <p className="mt-1 text-[12.5px] text-[#7c8780]">
                {locked
                  ? 'This campaign is not a draft, so the bundle is locked. End a live campaign to stop it.'
                  : 'Save stays a draft. Activate runs the campaign. Funded-by stays on the voucher template.'}
              </p>
            </div>
            <span className="rounded-full bg-[#f4f6f4] px-3 py-1 text-[12px] font-bold text-[#455249]">
              {statusLabel}
            </span>
          </div>

          <fieldset disabled={locked} className="min-w-0 border-0 p-0 disabled:opacity-80">

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Name">
              <input
                className={inputClass}
                value={form.name}
                onChange={(event) => patch({ name: event.target.value })}
                required
                maxLength={160}
              />
            </Field>
            <Field label="Type">
              <Select
                value={form.type}
                onChange={(event) => patch({ type: event.target.value })}
              >
                {CAMPAIGN_TYPES.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Budget (BHD)" hint="Cap for this campaign. Not spent until a later batch.">
              <input
                className={inputClass}
                inputMode="decimal"
                value={form.budget}
                onChange={(event) => patch({ budget: event.target.value })}
                placeholder="500"
              />
            </Field>
            <Field label="Segment" hint="Leave empty for all customers.">
              <Select
                value={form.segmentId}
                onChange={(event) => patch({ segmentId: event.target.value })}
              >
                <option value="">All customers</option>
                {options.segments.map((row) => (
                  <option key={row.id} value={row.id}>
                    {row.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Starts">
              <input
                className={inputClass}
                type="datetime-local"
                value={form.startsAt}
                onChange={(event) => patch({ startsAt: event.target.value })}
                required={form.type === 'FLASH_DEAL'}
              />
            </Field>
            <Field label="Ends">
              <input
                className={inputClass}
                type="datetime-local"
                value={form.endsAt}
                onChange={(event) => patch({ endsAt: event.target.value })}
                required={form.type === 'FLASH_DEAL'}
              />
            </Field>
            <Field
              label="Push"
              hint="Optional. A push that is still scheduled is sent at the campaign start, or now if that start has passed. Win-back does not send that blast; it uses this title and body when it issues a voucher."
            >
              <Select value={form.pushId} onChange={(event) => patch({ pushId: event.target.value })}>
                <option value="">None</option>
                {options.pushes.map((row) => (
                  <option key={row.id} value={row.id}>
                    {row.title}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Banner" hint="Optional home or vendor banner.">
              <Select
                value={form.bannerId}
                onChange={(event) => patch({ bannerId: event.target.value })}
              >
                <option value="">None</option>
                {options.banners.map((row) => (
                  <option key={row.id} value={row.id}>
                    {row.title}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          {form.type === 'WIN_BACK' ? (
            <div className="mt-3 max-w-xs">
              <Field label="No order for (days)">
                <input
                  className={inputClass}
                  inputMode="numeric"
                  value={form.inactiveDays}
                  onChange={(event) => patch({ inactiveDays: event.target.value })}
                  required
                  placeholder="14"
                />
              </Field>
            </div>
          ) : null}

          {form.type === 'BOOST_DAY' ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Field
                label="Multiplier"
                hint="Checkout uses a cashback rule for each category after activation. Yjeek funds the boost."
              >
                <input
                  className={inputClass}
                  inputMode="decimal"
                  value={form.boostMultiplier}
                  onChange={(event) => patch({ boostMultiplier: event.target.value })}
                  required
                  placeholder="2"
                />
              </Field>
              <div>
                <span className={labelClass}>Categories</span>
                <div className="max-h-40 space-y-1 overflow-auto rounded-[8px] border border-[rgba(0,0,0,0.1)] p-2">
                  {options.categories.length === 0 ? (
                    <p className="text-[12.5px] text-[#7c8780]">No categories.</p>
                  ) : null}
                  {options.categories.map((row) => (
                    <label key={row.id} className="flex items-center gap-2 text-[13px] text-[#17231c]">
                      <input
                        type="checkbox"
                        checked={form.boostCategoryIds.includes(row.id)}
                        onChange={() => toggleId('boostCategoryIds', row.id)}
                      />
                      {row.name}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {form.type === 'HAPPY_HOUR' || form.type === 'FLASH_DEAL' || form.type === 'SEASONAL' ? (
            <div className="mt-4">
              <span className={labelClass}>
                {form.type === 'HAPPY_HOUR' ? 'Daily window' : 'Recurring window (optional)'}
              </span>
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  className={inputClass}
                  type="time"
                  value={form.windowStartTime}
                  onChange={(event) => patch({ windowStartTime: event.target.value })}
                  required={form.type === 'HAPPY_HOUR'}
                />
                <input
                  className={inputClass}
                  type="time"
                  value={form.windowEndTime}
                  onChange={(event) => patch({ windowEndTime: event.target.value })}
                  required={form.type === 'HAPPY_HOUR'}
                />
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {WEEKDAYS.map((day) => {
                  const on = form.windowDaysOfWeek.includes(day.id)
                  return (
                    <button
                      key={day.id}
                      type="button"
                      onClick={() => toggleId('windowDaysOfWeek', day.id)}
                      className={cn(
                        'h-[30px] rounded-full px-3 text-[12px] font-bold',
                        on ? 'bg-[#e8f7ed] text-[#1aa054]' : 'bg-[#f4f6f4] text-[#69756d]',
                      )}
                    >
                      {day.label}
                    </button>
                  )
                })}
              </div>
              <p className="mt-1 text-[11.5px] text-[#9aa49d]">
                Empty weekdays means every day. Times are Bahrain local.
              </p>
            </div>
          ) : null}

          {form.type === 'SEASONAL' ? (
            <div className="mt-3">
              <div className="max-w-xs">
                <Field label="Season">
                  <Select
                    value={form.seasonKey}
                    onChange={(event) => patch({ seasonKey: event.target.value })}
                    required
                  >
                    <option value="">Select</option>
                    {SEASONS.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.label}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
              {!locked ? (
                <div className="mt-3">
                  <span className={labelClass}>Calendar presets</span>
                  <div className="flex flex-wrap gap-2">
                    {(options.seasonPresets.length ? options.seasonPresets : SEASONS.map((item) => ({
                      seasonKey: item.id,
                      name: item.label,
                      note: '',
                    }))).map((preset) => (
                      <button
                        key={preset.seasonKey}
                        type="button"
                        disabled={saving}
                        onClick={() => onFromSeason(preset.seasonKey)}
                        className="h-[32px] rounded-full px-3 text-[12px] font-bold text-[#1a6b3c] ring-1 ring-[#cfe8d7] disabled:opacity-60"
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                  <p className="mt-1 text-[11.5px] text-[#9aa49d]">
                    Creates a draft from the season. National Day is set to 16 December. Other seasons
                    do not invent a date. Select at least one voucher template first.
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}

          {form.type === 'MISSIONS' ? (
            <div className="mt-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Target orders">
                <input
                  className={inputClass}
                  inputMode="numeric"
                  value={form.targetOrders}
                  onChange={(event) => patch({ targetOrders: event.target.value })}
                  required
                  placeholder="3"
                />
              </Field>
              <Field label="Window (days)">
                <input
                  className={inputClass}
                  inputMode="numeric"
                  value={form.windowDays}
                  onChange={(event) => patch({ windowDays: event.target.value })}
                  required
                  placeholder="7"
                />
              </Field>
              <Field label="Reward template" hint="Funded-by is already on the template.">
                <Select
                  value={form.rewardTemplateId}
                  onChange={(event) => patch({ rewardTemplateId: event.target.value })}
                  required
                >
                  <option value="">Select</option>
                  {options.templates.map((row) => (
                    <option key={row.id} value={row.id}>
                      {row.name} · {row.fundedBy}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <p className="mt-2 text-[11.5px] text-[#9aa49d]">
              A live mission counts each Delivered, Collected, or Completed order. The window starts
              on the customer&apos;s first counted order and lasts the number of days above. My Rewards
              shows the progress. The reward voucher is issued once when the target is reached.
            </p>
            </div>
          ) : (
            <div className="mt-4">
              <span className={labelClass}>
                Voucher templates{templatesRequired ? '' : ' (optional)'}
              </span>
              <div className="max-h-48 space-y-1 overflow-auto rounded-[8px] border border-[rgba(0,0,0,0.1)] p-2">
                {options.templates.length === 0 ? (
                  <p className="text-[12.5px] text-[#7c8780]">
                    No active voucher templates. Create one under Vouchers first.
                  </p>
                ) : null}
                {options.templates.map((row) => (
                  <label key={row.id} className="flex items-start gap-2 text-[13px] text-[#17231c]">
                    <input
                      type="checkbox"
                      className="mt-0.5"
                      checked={form.templateIds.includes(row.id)}
                      onChange={() => toggleId('templateIds', row.id)}
                    />
                    <span>
                      {row.name}
                      <span className="ml-2 text-[11.5px] text-[#7c8780]">
                        {row.type} · funded by {row.fundedBy}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
              {selectedTemplates.length > 0 ? (
                <p className="mt-1 text-[11.5px] text-[#9aa49d]">
                  {selectedTemplates.length} template{selectedTemplates.length === 1 ? '' : 's'} linked.
                  Funded-by is not set on the campaign.
                </p>
              ) : null}
            </div>
          )}

          <section className="mt-4 rounded-[12px] border border-[#eceeec] bg-[#f8faf8] p-4">
            <h3 className="text-[14px] font-bold text-[#17231c]">Projected cost</h3>
            <p className="mt-1 text-[12.5px] text-[#7c8780]">
              Segment size × expected redemption rate × average voucher value. Shown before activation.
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <Field
                label="Expected redemption rate"
                hint="Fraction from 0 to 1. 0.25 means 25%. There is no default."
              >
                <input
                  className={inputClass}
                  inputMode="decimal"
                  value={form.expectedRedemptionRate}
                  onChange={(event) => patch({ expectedRedemptionRate: event.target.value })}
                  placeholder="0.25"
                />
              </Field>
              <Field
                label="Segment size override"
                hint={
                  selectedSegment
                    ? `Replaces the segment size on file (${selectedSegment.size}).`
                    : 'Required when no segment is selected. All customers is not a headcount.'
                }
              >
                <input
                  className={inputClass}
                  inputMode="numeric"
                  value={form.segmentSizeOverride}
                  onChange={(event) => patch({ segmentSizeOverride: event.target.value })}
                  placeholder={selectedSegment ? String(selectedSegment.size) : '1000'}
                />
              </Field>
              <Field
                label="Average voucher value override (BHD)"
                hint="Replaces the template average. Needed for free delivery, a percent voucher with no max discount, or boost day."
              >
                <input
                  className={inputClass}
                  inputMode="decimal"
                  value={form.avgVoucherValueOverride}
                  onChange={(event) => patch({ avgVoucherValueOverride: event.target.value })}
                  placeholder="1.500"
                />
              </Field>
            </div>
            {projectionError ? (
              <p className="mt-3 text-[12.5px] text-[#9b2c2c]">{projectionError}</p>
            ) : null}
            {projectionError ? null : projectedLabel ? (
              <p className="mt-3 text-[13px] text-[#17231c]">
                <span className="font-bold">{projection.segmentSize}</span>
                {sizeSourceLabel(projection.segmentSizeSource)
                  ? ` (${sizeSourceLabel(projection.segmentSizeSource)})`
                  : ''}
                {' × '}
                <span className="font-bold">{Number(projection.expectedRedemptionRate).toFixed(4)}</span>
                {' × '}
                <span className="font-bold">{formatBhd(projection.avgVoucherValue)}</span>
                {avgSourceLabel(projection.avgVoucherValueSource)
                  ? ` (${avgSourceLabel(projection.avgVoucherValueSource)})`
                  : ''}
                {' = '}
                <span className="text-[15px] font-bold text-[#1a6b3c]">{projectedLabel}</span>
              </p>
            ) : (
              <p className="mt-3 text-[13px] text-[#17231c]">
                Projected cost is incomplete
                {missingLabels.length ? `: missing ${missingLabels.join(', ')}` : ''}.
              </p>
            )}
            <p className="mt-2 text-[11.5px] text-[#7c8780]">
              {!projectionError && projection && !projection.activationBlocked
                ? 'Cost inputs are complete. Activate recomputes this figure and refuses to go live if an input is missing.'
                : 'Activation is blocked until segment size, expected redemption rate, and average voucher value are all set. Saving this draft is still allowed.'}
            </p>
            {boostRules.length > 0 ? (
              <p className="mt-2 text-[12px] text-[#17231c]">
                Cashback rules:{' '}
                {boostRules
                  .map((rule) => `${rule.scopeTargetId ?? rule.id}${rule.active ? '' : ' (off)'}`)
                  .join(', ')}
              </p>
            ) : null}
          </section>
          </fieldset>

          <div className="mt-4 flex flex-wrap gap-2">
            {locked ? null : (
              <button
                type="submit"
                disabled={saving}
                className="h-[38px] rounded-full bg-[#1aa054] px-4 text-[13px] font-bold text-white disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Save draft'}
              </button>
            )}
            {canLeaveDraft ? (
              <button
                type="button"
                onClick={onActivate}
                disabled={saving}
                className="h-[38px] rounded-full bg-[#17231c] px-4 text-[13px] font-bold text-white disabled:opacity-60"
              >
                Activate
              </button>
            ) : null}
            {canLeaveDraft ? (
              <button
                type="button"
                onClick={onSubmitApproval}
                disabled={saving}
                className="h-[38px] rounded-full px-4 text-[13px] font-bold text-[#455249] ring-1 ring-[#d7ddd8] disabled:opacity-60"
              >
                Submit for approval
              </button>
            ) : null}
            {editingStatus === 'PENDING_APPROVAL' ? (
              <button
                type="button"
                onClick={onRevertDraft}
                disabled={saving}
                className="h-[38px] rounded-full px-4 text-[13px] font-bold text-[#455249] ring-1 ring-[#d7ddd8] disabled:opacity-60"
              >
                Back to draft
              </button>
            ) : null}
            {editingStatus === 'LIVE' ? (
              <button
                type="button"
                onClick={onEnd}
                disabled={saving}
                className="h-[38px] rounded-full px-4 text-[13px] font-bold text-[#9b2c2c] ring-1 ring-[#f3d0d0] disabled:opacity-60"
              >
                End campaign
              </button>
            ) : null}
            {editingId && editingStatus === 'DRAFT' ? (
              <button
                type="button"
                onClick={() => onDelete(editingId)}
                className="h-[38px] rounded-full px-4 text-[13px] font-bold text-[#9b2c2c] ring-1 ring-[#f3d0d0]"
              >
                Delete draft
              </button>
            ) : null}
          </div>
        </form>
      </div>
    </div>
  )
}
