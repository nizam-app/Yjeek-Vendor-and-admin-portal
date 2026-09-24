import { useCallback, useEffect, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { formatApiErrorMessage } from '../../../api/errors'
import { adminService } from '../../../services/adminService'
import { adminStoresCatalogService } from '../../../services/admin/storesCatalogService'
import { MarketingViewTabs } from '../../../components/admin/MarketingViewTabs'
import { AdminDatePicker } from '../../../components/admin/AdminDatePicker'
import { cn } from '../../../components/admin/cn'

const labelClass = 'mb-1.5 block text-[12px] font-medium leading-none text-[#7c8780]'
const inputClass =
  'box-border h-[40px] w-full rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white px-3 text-[13px] text-[#17231c] outline-none transition placeholder:text-[#9aa49d] focus:border-[#1aa054] disabled:bg-[#f5f6f5] disabled:text-[#9aa49d]'

const VOUCHER_INNER_TABS = [
  { id: 'templates', label: 'Templates', ready: true },
  { id: 'responses', label: 'Vendor responses', ready: true },
  { id: 'distribution', label: 'Distribution rules', ready: true },
  { id: 'grant', label: 'Grant & manage', ready: true },
]

const ISSUED_STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'USED', label: 'Used' },
  { value: 'EXPIRED', label: 'Expired' },
  { value: 'REVOKED', label: 'Revoked' },
]

function downloadCsv(filename, csvText) {
  const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

const DISTRIBUTION_TRIGGERS = [
  { value: 'REGISTRATION', label: 'Registration', wired: true },
  { value: 'FIRST_ORDER', label: 'First order completed', wired: false },
  { value: 'NO_ORDER_N_DAYS', label: 'No order N days', wired: false },
  { value: 'BIRTHDAY', label: 'Birthday', wired: false },
  { value: 'ORDER_LATE', label: 'Order late', wired: false },
  { value: 'RATING_LE_2', label: 'Rating ≤ 2', wired: false },
  { value: 'MANUAL', label: 'Manual', wired: true },
]

function emptyDistForm() {
  return {
    trigger: 'REGISTRATION',
    triggerDays: '14',
    segmentId: '',
    templateId: '',
    frequencyCap: '1',
    active: true,
  }
}

const TARGET_MODES = [
  { value: 'ALL', label: 'All active vendors' },
  { value: 'LIST', label: 'Vendor list' },
  { value: 'CATEGORY', label: 'Category' },
]

const RESPONSE_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'ACCEPTED', label: 'Accepted' },
  { value: 'DECLINED', label: 'Declined' },
  { value: 'NONE', label: 'No response' },
]

const TYPES = [
  { value: 'PERCENT', label: 'Percent' },
  { value: 'FIXED_AMOUNT', label: 'Fixed amount' },
  { value: 'FREE_DELIVERY', label: 'Free delivery' },
]

const SCOPES = [
  { value: 'ALL', label: 'All' },
  { value: 'CATEGORY', label: 'Category' },
  { value: 'VENDOR', label: 'Vendor' },
  { value: 'DELIVERY_METHOD', label: 'Delivery method' },
]

const SOURCES = [
  { value: 'WELCOME', label: 'Welcome' },
  { value: 'REFERRAL', label: 'Referral' },
  { value: 'CAMPAIGN', label: 'Campaign' },
  { value: 'COMPENSATION', label: 'Compensation' },
  { value: 'ADMIN_MANUAL', label: 'Admin manual' },
]

const FUNDED_BY = [
  { value: 'YJEEK', label: 'Yjeek' },
  { value: 'VENDOR', label: 'Vendor' },
  { value: 'SPLIT', label: 'Split %' },
]

function Field({ label, children, className, hint }) {
  return (
    <label className={cn('block min-w-0', className)}>
      <span className={labelClass}>{label}</span>
      {children}
      {hint ? <p className="mt-1 text-[11.5px] text-[#9aa49d]">{hint}</p> : null}
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

function Card({ title, subtitle, children, actions }) {
  return (
    <section className="rounded-[14px] border border-[#eceeec] bg-white p-5 shadow-[0_1px_2px_rgba(20,40,28,.03)] max-[700px]:p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          {title ? <h3 className="text-[15px] font-bold text-[#17231c]">{title}</h3> : null}
          {subtitle ? <p className="mt-1 text-[12.5px] text-[#7c8780]">{subtitle}</p> : null}
        </div>
        {actions}
      </div>
      <div className={title || subtitle ? 'mt-4' : undefined}>{children}</div>
    </section>
  )
}

function Banner({ tone, children }) {
  const styles =
    tone === 'error'
      ? 'border-[#f3d0d0] bg-[#fff6f6] text-[#9b2c2c]'
      : 'border-[#cfe8d7] bg-[#f3fbf6] text-[#1a6b3c]'
  return (
    <div className={cn('rounded-[10px] border px-3 py-2 text-[12.5px]', styles)}>{children}</div>
  )
}

function emptyToNullNumber(value) {
  const raw = String(value ?? '').trim()
  if (!raw) return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : NaN
}

function isoToDateInput(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function combineDateStart(date) {
  const raw = String(date || '').trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null
  return new Date(`${raw}T00:00:00.000Z`).toISOString()
}

function combineDateEnd(date) {
  const raw = String(date || '').trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null
  return new Date(`${raw}T23:59:59.999Z`).toISOString()
}

function defaultDeadlineIso() {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() + 7)
  d.setUTCHours(23, 59, 59, 999)
  return d.toISOString()
}

function parseIdList(text) {
  return String(text || '')
    .split(/[,;\s]+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

function formatMoney(value) {
  if (value == null) return '—'
  const n = Number(value)
  if (!Number.isFinite(n)) return '—'
  return n.toFixed(3)
}

function typeLabel(type) {
  return TYPES.find((t) => t.value === type)?.label || type
}

function fundedLabel(fundedBy) {
  return FUNDED_BY.find((t) => t.value === fundedBy)?.label || fundedBy
}

function emptyForm() {
  return {
    name: '',
    type: 'PERCENT',
    value: '20',
    maxDiscount: '2',
    minOrder: '5',
    maxOrder: '',
    scope: 'ALL',
    scopeIdsText: '',
    validFrom: '',
    validTo: '',
    validityDays: '14',
    source: 'WELCOME',
    fundedBy: 'YJEEK',
    splitYjeekPercent: '',
    active: true,
  }
}

function formFromTemplate(row) {
  return {
    name: String(row.name || ''),
    type: row.type || 'PERCENT',
    value: row.value == null ? '' : String(row.value),
    maxDiscount: row.maxDiscount == null ? '' : String(row.maxDiscount),
    minOrder: row.minOrder == null ? '' : String(row.minOrder),
    maxOrder: row.maxOrder == null ? '' : String(row.maxOrder),
    scope: row.scope || 'ALL',
    scopeIdsText: Array.isArray(row.scopeIds) ? row.scopeIds.join(', ') : '',
    validFrom: isoToDateInput(row.validFrom),
    validTo: isoToDateInput(row.validTo),
    validityDays: row.validityDays == null ? '' : String(row.validityDays),
    source: row.source || 'ADMIN_MANUAL',
    fundedBy: row.fundedBy || 'YJEEK',
    splitYjeekPercent: row.splitYjeekPercent == null ? '' : String(row.splitYjeekPercent),
    active: Boolean(row.active),
  }
}

function buildPayload(form) {
  const type = form.type
  const fundedBy = form.fundedBy
  const scope = form.scope

  const value = emptyToNullNumber(form.value)
  const maxDiscount = emptyToNullNumber(form.maxDiscount)
  const minOrder = emptyToNullNumber(form.minOrder)
  const maxOrder = emptyToNullNumber(form.maxOrder)
  const validityDays = emptyToNullNumber(form.validityDays)
  const splitYjeekPercent = emptyToNullNumber(form.splitYjeekPercent)

  if (
    [value, maxDiscount, minOrder, maxOrder, validityDays, splitYjeekPercent].some(
      (n) => Number.isNaN(n),
    )
  ) {
    throw new Error('Enter valid numbers for amount fields.')
  }

  const scopeIds =
    scope === 'ALL'
      ? []
      : String(form.scopeIdsText || '')
          .split(/[,;\s]+/)
          .map((s) => s.trim())
          .filter(Boolean)

  const body = {
    name: String(form.name || '').trim(),
    type,
    scope,
    scopeIds,
    source: form.source,
    fundedBy,
    active: Boolean(form.active),
    validFrom: form.validFrom ? combineDateStart(form.validFrom) : null,
    validTo: form.validTo ? combineDateEnd(form.validTo) : null,
    validityDays,
    minOrder,
    maxOrder,
  }

  if (!body.name) throw new Error('Name is required.')

  if (type === 'FREE_DELIVERY') {
    body.value = null
    body.maxDiscount = null
  } else {
    body.value = value
    body.maxDiscount = maxDiscount
  }

  if (fundedBy === 'SPLIT') {
    body.splitYjeekPercent = splitYjeekPercent
  } else {
    body.splitYjeekPercent = null
  }

  return body
}

/**
 * OG Admin › Marketing › Vouchers — Templates · Vendor responses · Distribution · Grant (M03 B2–B10).
 */
export default function AdminVouchersPage() {
  const [innerTab, setInnerTab] = useState('templates')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [templates, setTemplates] = useState([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)

  const [sendTemplateId, setSendTemplateId] = useState('')
  const [sendTarget, setSendTarget] = useState('ALL')
  const [sendVendorIdsText, setSendVendorIdsText] = useState('')
  const [sendCategoryIdsText, setSendCategoryIdsText] = useState('')
  const [sendDeadline, setSendDeadline] = useState(() => isoToDateInput(defaultDeadlineIso()))
  const [sending, setSending] = useState(false)

  const [responsesTemplateId, setResponsesTemplateId] = useState('')
  const [responseFilter, setResponseFilter] = useState('all')
  const [responsesLoading, setResponsesLoading] = useState(false)
  const [requests, setRequests] = useState([])
  const [requestSummary, setRequestSummary] = useState(null)
  const [requestsTotal, setRequestsTotal] = useState(0)
  const [actionBusyId, setActionBusyId] = useState('')
  const [panelRequestId, setPanelRequestId] = useState('')
  const [excludedItemIdsText, setExcludedItemIdsText] = useState('')
  const [excludedCategoryIdsText, setExcludedCategoryIdsText] = useState('')
  const [resendDeadline, setResendDeadline] = useState(() =>
    isoToDateInput(defaultDeadlineIso()),
  )
  const [catalogHint, setCatalogHint] = useState('')
  const [catalogLoading, setCatalogLoading] = useState(false)
  const [previewItemsText, setPreviewItemsText] = useState('')
  const [previewResult, setPreviewResult] = useState(null)
  const [previewBusy, setPreviewBusy] = useState(false)

  const [rules, setRules] = useState([])
  const [rulesTotal, setRulesTotal] = useState(0)
  const [rulesLoading, setRulesLoading] = useState(false)
  const [distForm, setDistForm] = useState(emptyDistForm)
  const [editingRuleId, setEditingRuleId] = useState(null)
  const [distSaving, setDistSaving] = useState(false)
  const [runPhone, setRunPhone] = useState('')
  const [runBusyId, setRunBusyId] = useState('')
  const [deferredTriggers, setDeferredTriggers] = useState([])

  const [grantTemplateId, setGrantTemplateId] = useState('')
  const [grantPhone, setGrantPhone] = useState('')
  const [grantSegmentId, setGrantSegmentId] = useState('')
  const [grantBusy, setGrantBusy] = useState(false)
  const [issuedStatus, setIssuedStatus] = useState('all')
  const [issuedPhone, setIssuedPhone] = useState('')
  const [issuedLoading, setIssuedLoading] = useState(false)
  const [issuedRows, setIssuedRows] = useState([])
  const [issuedTotal, setIssuedTotal] = useState(0)
  const [revokeBusyId, setRevokeBusyId] = useState('')
  const [settlementPreset, setSettlementPreset] = useState('mtd')
  const [settlementBusy, setSettlementBusy] = useState(false)
  const [settlementPreview, setSettlementPreview] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await adminService.listAdminVoucherTemplates({
        search: search.trim() || undefined,
        active: activeFilter,
        limit: 50,
        page: 1,
      })
      const data = res?.data
      const list = Array.isArray(data?.templates) ? data.templates : []
      setTemplates(list)
      setTotal(Number(data?.total) || 0)
      setSendTemplateId((prev) => prev || list[0]?.id || '')
      setResponsesTemplateId((prev) => prev || list[0]?.id || '')
      setGrantTemplateId((prev) => prev || list[0]?.id || '')
    } catch (err) {
      setError(formatApiErrorMessage(err) || 'Failed to load voucher templates.')
      setTemplates([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [search, activeFilter])

  const loadIssued = useCallback(async () => {
    setIssuedLoading(true)
    setError('')
    try {
      const res = await adminService.listAdminIssuedVouchers({
        status: issuedStatus,
        phone: issuedPhone.trim() || undefined,
        templateId: grantTemplateId || undefined,
        limit: 50,
        page: 1,
      })
      const data = res?.data
      setIssuedRows(Array.isArray(data?.vouchers) ? data.vouchers : [])
      setIssuedTotal(Number(data?.total) || 0)
    } catch (err) {
      setError(formatApiErrorMessage(err) || 'Failed to load issued vouchers.')
      setIssuedRows([])
      setIssuedTotal(0)
    } finally {
      setIssuedLoading(false)
    }
  }, [issuedStatus, issuedPhone, grantTemplateId])

  const loadResponses = useCallback(async () => {
    if (!responsesTemplateId) {
      setRequests([])
      setRequestSummary(null)
      setRequestsTotal(0)
      return
    }
    setResponsesLoading(true)
    setError('')
    try {
      const res = await adminService.listAdminVoucherVendorRequests(responsesTemplateId, {
        response: responseFilter,
        limit: 100,
        page: 1,
      })
      const data = res?.data
      setRequests(Array.isArray(data?.requests) ? data.requests : [])
      setRequestSummary(data?.summary ?? null)
      setRequestsTotal(Number(data?.total) || 0)
    } catch (err) {
      setError(formatApiErrorMessage(err) || 'Failed to load vendor responses.')
      setRequests([])
      setRequestSummary(null)
      setRequestsTotal(0)
    } finally {
      setResponsesLoading(false)
    }
  }, [responsesTemplateId, responseFilter])

  const loadRules = useCallback(async () => {
    setRulesLoading(true)
    setError('')
    try {
      const res = await adminService.listAdminDistributionRules({ limit: 100, page: 1 })
      const data = res?.data
      setRules(Array.isArray(data?.rules) ? data.rules : [])
      setRulesTotal(Number(data?.total) || 0)
      setDeferredTriggers(Array.isArray(data?.deferredTriggers) ? data.deferredTriggers : [])
      setDistForm((prev) => ({
        ...prev,
        templateId: prev.templateId || templates[0]?.id || '',
      }))
    } catch (err) {
      setError(formatApiErrorMessage(err) || 'Failed to load distribution rules.')
      setRules([])
      setRulesTotal(0)
    } finally {
      setRulesLoading(false)
    }
  }, [templates])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (innerTab === 'responses') loadResponses()
  }, [innerTab, loadResponses])

  useEffect(() => {
    if (innerTab === 'distribution') loadRules()
  }, [innerTab, loadRules])

  useEffect(() => {
    if (innerTab === 'grant') loadIssued()
  }, [innerTab, loadIssued])

  async function onGrantPhone(e) {
    e.preventDefault()
    if (!grantTemplateId || !grantPhone.trim()) {
      setError('Select a template and enter a customer phone.')
      return
    }
    setGrantBusy(true)
    setError('')
    setSuccess('')
    try {
      const res = await adminService.grantAdminVoucher(grantTemplateId, {
        phone: grantPhone.trim(),
        countryCode: '+973',
      })
      const data = res?.data
      setSuccess(
        `Granted voucher${data?.voucher?.id ? ` ${data.voucher.id}` : ''}` +
          (data?.authority?.tier ? ` · ${data.authority.tier}` : ''),
      )
      setGrantPhone('')
      await loadIssued()
    } catch (err) {
      setError(formatApiErrorMessage(err) || 'Grant failed.')
    } finally {
      setGrantBusy(false)
    }
  }

  async function onGrantSegment(e) {
    e.preventDefault()
    if (!grantTemplateId || !grantSegmentId.trim()) {
      setError('Select a template and enter a segment id.')
      return
    }
    setGrantBusy(true)
    setError('')
    setSuccess('')
    try {
      const res = await adminService.grantAdminVoucher(grantTemplateId, {
        segmentId: grantSegmentId.trim(),
      })
      const data = res?.data
      setSuccess(
        `Bulk grant: issued ${data?.issued ?? 0}` +
          (data?.skipped ? ` · skipped ${data.skipped}` : ''),
      )
      setGrantSegmentId('')
      await loadIssued()
    } catch (err) {
      setError(formatApiErrorMessage(err) || 'Bulk grant failed.')
    } finally {
      setGrantBusy(false)
    }
  }

  async function onRevoke(row) {
    if (!row?.id) return
    if (!window.confirm(`Revoke voucher ${row.id}?`)) return
    setRevokeBusyId(row.id)
    setError('')
    setSuccess('')
    try {
      await adminService.revokeAdminVoucher(row.id)
      setSuccess('Voucher revoked.')
      await loadIssued()
    } catch (err) {
      setError(formatApiErrorMessage(err) || 'Revoke failed.')
    } finally {
      setRevokeBusyId('')
    }
  }

  async function onExportSettlement() {
    setSettlementBusy(true)
    setError('')
    try {
      const params = { preset: settlementPreset }
      const preview = await adminService.getAdminVoucherSettlement(params)
      setSettlementPreview(preview?.data ?? null)
      const csv = await adminService.exportAdminVoucherSettlement(params)
      const text = typeof csv === 'string' ? csv : csv?.data || ''
      if (!String(text).trim()) {
        setError('Settlement export returned no CSV data.')
        return
      }
      downloadCsv(`voucher-settlement-${settlementPreset}.csv`, text)
      setSuccess('Settlement CSV downloaded.')
    } catch (err) {
      setError(formatApiErrorMessage(err) || 'Settlement export failed.')
    } finally {
      setSettlementBusy(false)
    }
  }

  function resetForm() {
    setEditingId(null)
    setForm(emptyForm())
  }

  function resetDistForm() {
    setEditingRuleId(null)
    setDistForm({
      ...emptyDistForm(),
      templateId: templates[0]?.id || '',
    })
  }

  function startEdit(row) {
    setEditingId(row.id)
    setForm(formFromTemplate(row))
    setSuccess('')
    setError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function onSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const body = buildPayload(form)
      if (editingId) {
        await adminService.updateAdminVoucherTemplate(editingId, body)
        setSuccess('Template updated.')
      } else {
        await adminService.createAdminVoucherTemplate(body)
        setSuccess('Template created.')
      }
      resetForm()
      await load()
    } catch (err) {
      setError(formatApiErrorMessage(err) || 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(row) {
    setError('')
    setSuccess('')
    try {
      await adminService.updateAdminVoucherTemplate(row.id, { active: !row.active })
      setSuccess(row.active ? 'Template deactivated.' : 'Template activated.')
      await load()
    } catch (err) {
      setError(formatApiErrorMessage(err) || 'Update failed.')
    }
  }

  function startEditRule(row) {
    setEditingRuleId(row.id)
    setDistForm({
      trigger: row.trigger || 'REGISTRATION',
      triggerDays: row.triggerDays != null ? String(row.triggerDays) : '14',
      segmentId: row.segmentId || '',
      templateId: row.templateId || templates[0]?.id || '',
      frequencyCap: row.frequencyCap != null ? String(row.frequencyCap) : '',
      active: Boolean(row.active),
    })
    setSuccess('')
    setError('')
  }

  async function onSubmitRule(e) {
    e.preventDefault()
    if (!distForm.templateId) {
      setError('Select a voucher template.')
      return
    }
    setDistSaving(true)
    setError('')
    setSuccess('')
    try {
      const body = {
        trigger: distForm.trigger,
        templateId: distForm.templateId,
        segmentId: distForm.segmentId.trim() || null,
        frequencyCap: distForm.frequencyCap.trim()
          ? Number(distForm.frequencyCap)
          : null,
        active: Boolean(distForm.active),
        triggerDays:
          distForm.trigger === 'NO_ORDER_N_DAYS'
            ? Number(distForm.triggerDays) || null
            : null,
      }
      if (editingRuleId) {
        await adminService.updateAdminDistributionRule(editingRuleId, body)
        setSuccess('Distribution rule updated.')
      } else {
        await adminService.createAdminDistributionRule(body)
        setSuccess('Distribution rule created.')
      }
      resetDistForm()
      await loadRules()
    } catch (err) {
      setError(formatApiErrorMessage(err) || 'Failed to save distribution rule.')
    } finally {
      setDistSaving(false)
    }
  }

  async function toggleRuleActive(row) {
    setError('')
    setSuccess('')
    try {
      await adminService.updateAdminDistributionRule(row.id, { active: !row.active })
      setSuccess(row.active ? 'Rule deactivated.' : 'Rule activated.')
      await loadRules()
    } catch (err) {
      setError(formatApiErrorMessage(err) || 'Failed to update rule.')
    }
  }

  async function onRunRule(row) {
    setRunBusyId(row.id)
    setError('')
    setSuccess('')
    try {
      const body = {}
      if (runPhone.trim()) body.phone = runPhone.trim()
      const res = await adminService.runAdminDistributionRule(row.id, body)
      const data = res?.data
      setSuccess(
        `Run complete: issued ${data?.issued ?? 0}, skipped ${data?.skipped ?? 0}.`,
      )
      setRunPhone('')
    } catch (err) {
      setError(formatApiErrorMessage(err) || 'Failed to run rule.')
    } finally {
      setRunBusyId('')
    }
  }

  async function onSendForAcceptance(e) {
    e.preventDefault()
    if (!sendTemplateId) {
      setError('Select a template to send.')
      return
    }
    setSending(true)
    setError('')
    setSuccess('')
    try {
      const deadline = sendDeadline ? combineDateEnd(sendDeadline) : null
      if (!deadline) throw new Error('Response deadline is required.')
      const body = {
        target: sendTarget,
        deadline,
        vendorIds: sendTarget === 'LIST' ? parseIdList(sendVendorIdsText) : [],
        categoryIds: sendTarget === 'CATEGORY' ? parseIdList(sendCategoryIdsText) : [],
      }
      const res = await adminService.sendAdminVoucherForAcceptance(sendTemplateId, body)
      const data = res?.data
      setSuccess(
        `Sent for acceptance: ${data?.created ?? 0} request(s) created` +
          (data?.skippedExisting
            ? ` · ${data.skippedExisting} already had a request`
            : '') +
          (data?.targetLabel ? ` · ${data.targetLabel}` : '') +
          '.',
      )
      setResponsesTemplateId(sendTemplateId)
      if (innerTab === 'responses') await loadResponses()
    } catch (err) {
      setError(formatApiErrorMessage(err) || 'Send for acceptance failed.')
    } finally {
      setSending(false)
    }
  }

  function openExclusionsPanel(row) {
    setPanelRequestId(row.id)
    setExcludedItemIdsText(
      Array.isArray(row.excludedItemIds) ? row.excludedItemIds.join(', ') : '',
    )
    setExcludedCategoryIdsText(
      Array.isArray(row.excludedCategoryIds) ? row.excludedCategoryIds.join(', ') : '',
    )
    setCatalogHint('')
    setPreviewResult(null)
    setPreviewItemsText('')
    setError('')
    setSuccess('')
  }

  function closeExclusionsPanel() {
    setPanelRequestId('')
    setCatalogHint('')
    setPreviewResult(null)
  }

  async function loadCatalogHint(vendorId) {
    setCatalogLoading(true)
    setCatalogHint('')
    try {
      const catalog = await adminStoresCatalogService.getVendorCatalog(vendorId)
      const cats = []
      for (const root of catalog.catalogCategories || []) {
        cats.push(`${root.name} (${root.id})`)
        for (const child of root.children || []) {
          cats.push(`  └ ${child.name} (${child.id})`)
        }
      }
      const products = (catalog.products || [])
        .slice(0, 40)
        .map((p) => `${p.name} (${p.id})`)
      setCatalogHint(
        [
          cats.length ? `Catalog categories:\n${cats.join('\n')}` : 'No catalog categories.',
          products.length
            ? `Products (sample):\n${products.join('\n')}`
            : 'No products on this vendor.',
        ].join('\n\n'),
      )
    } catch (err) {
      setCatalogHint(formatApiErrorMessage(err) || 'Failed to load vendor catalog.')
    } finally {
      setCatalogLoading(false)
    }
  }

  async function onConfirmRequest(row) {
    setActionBusyId(row.id)
    setError('')
    setSuccess('')
    try {
      const body =
        panelRequestId === row.id
          ? {
              excludedItemIds: parseIdList(excludedItemIdsText),
              excludedCategoryIds: parseIdList(excludedCategoryIdsText),
            }
          : {}
      await adminService.confirmAdminVoucherVendorRequest(row.id, body)
      setSuccess(`Confirmed ${row.vendorName || row.vendorId} — voucher is live for this store.`)
      closeExclusionsPanel()
      await loadResponses()
    } catch (err) {
      setError(formatApiErrorMessage(err) || 'Confirm failed.')
    } finally {
      setActionBusyId('')
    }
  }

  async function onSaveExclusions(row) {
    setActionBusyId(row.id)
    setError('')
    setSuccess('')
    try {
      await adminService.updateAdminVoucherVendorExclusions(row.id, {
        excludedItemIds: parseIdList(excludedItemIdsText),
        excludedCategoryIds: parseIdList(excludedCategoryIdsText),
      })
      setSuccess(`Exclusions updated for ${row.vendorName || row.vendorId}.`)
      await loadResponses()
    } catch (err) {
      setError(formatApiErrorMessage(err) || 'Update exclusions failed.')
    } finally {
      setActionBusyId('')
    }
  }

  async function onRemoveRequest(row) {
    if (
      !window.confirm(
        `Remove ${row.vendorName || row.vendorId} from the live voucher list?`,
      )
    ) {
      return
    }
    setActionBusyId(row.id)
    setError('')
    setSuccess('')
    try {
      await adminService.removeAdminVoucherVendorRequest(row.id)
      setSuccess(`Removed ${row.vendorName || row.vendorId} from the live list.`)
      if (panelRequestId === row.id) closeExclusionsPanel()
      await loadResponses()
    } catch (err) {
      setError(formatApiErrorMessage(err) || 'Remove failed.')
    } finally {
      setActionBusyId('')
    }
  }

  async function onResendRequest(row) {
    setActionBusyId(row.id)
    setError('')
    setSuccess('')
    try {
      const deadline = resendDeadline ? combineDateEnd(resendDeadline) : null
      if (!deadline) throw new Error('Re-send deadline is required.')
      await adminService.resendAdminVoucherVendorRequest(row.id, { deadline })
      setSuccess(`Re-sent acceptance request to ${row.vendorName || row.vendorId}.`)
      if (panelRequestId === row.id) closeExclusionsPanel()
      await loadResponses()
    } catch (err) {
      setError(formatApiErrorMessage(err) || 'Re-send failed.')
    } finally {
      setActionBusyId('')
    }
  }

  async function onPreviewApplicability(row) {
    if (!responsesTemplateId) return
    setPreviewBusy(true)
    setError('')
    setPreviewResult(null)
    try {
      const productIds = parseIdList(previewItemsText)
      const items = productIds.map((productId) => ({ productId }))
      const res = await adminService.previewAdminVoucherVendorApplicability(
        responsesTemplateId,
        { vendorId: row.vendorId, items },
      )
      setPreviewResult(res?.data ?? null)
    } catch (err) {
      setError(formatApiErrorMessage(err) || 'Applicability preview failed.')
    } finally {
      setPreviewBusy(false)
    }
  }

  const needsValue = form.type !== 'FREE_DELIVERY'
  const needsSplit = form.fundedBy === 'SPLIT'
  const needsScopeIds = form.scope !== 'ALL'

  return (
    <div className="px-5 py-4 pb-8 max-[700px]:px-3">
      <div className="mb-3.5">
        <h2 className="text-[20px] font-bold tracking-[-0.02em] text-[#17231c]">Vouchers</h2>
        <p className="mt-0.5 text-[12.5px] text-[#7c8780]">
          Define voucher templates once. Customers never type a code — vouchers are issued to accounts.
        </p>
      </div>

      <MarketingViewTabs active="vouchers" />

      <div className="mb-4 inline-flex flex-wrap items-center gap-1">
        {VOUCHER_INNER_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            disabled={!tab.ready}
            onClick={() => tab.ready && setInnerTab(tab.id)}
            title={tab.ready ? undefined : 'Coming in a later batch'}
            className={cn(
              'h-[32px] rounded-full px-3.5 text-[12px] font-bold transition',
              innerTab === tab.id && tab.ready
                ? 'bg-[#17231c] text-white'
                : tab.ready
                  ? 'bg-white text-[#69756d] ring-1 ring-[#e4e8e4] hover:text-[#455249]'
                  : 'cursor-not-allowed bg-[#f5f6f5] text-[#b0b8b2]',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-1 flex flex-col gap-4">
        {error ? <Banner tone="error">{error}</Banner> : null}
        {success ? <Banner tone="success">{success}</Banner> : null}

        {innerTab === 'templates' ? (
          <>
            <Card
              title={editingId ? 'Edit template' : 'New template'}
              subtitle="OG fields: type, value + max discount, order bounds, scope, validity, source, funded_by."
              actions={
                editingId ? (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="h-[34px] rounded-[8px] px-3 text-[12.5px] font-bold text-[#69756d] ring-1 ring-[#e4e8e4]"
                  >
                    Cancel edit
                  </button>
                ) : null
              }
            >
              <form onSubmit={onSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Name" className="sm:col-span-2 lg:col-span-3">
                  <input
                    className={inputClass}
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder='e.g. Welcome 20%'
                    required
                  />
                </Field>

                <Field label="Type">
                  <Select
                    value={form.type}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        type: e.target.value,
                        ...(e.target.value === 'FREE_DELIVERY'
                          ? { value: '', maxDiscount: '' }
                          : {}),
                      }))
                    }
                  >
                    {TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field
                  label={form.type === 'PERCENT' ? 'Value (%)' : 'Value (BHD)'}
                  hint={needsValue ? undefined : 'Not used for free delivery'}
                >
                  <input
                    className={inputClass}
                    type="number"
                    step="any"
                    min="0"
                    disabled={!needsValue}
                    value={form.value}
                    onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
                    placeholder={form.type === 'PERCENT' ? '20' : '1.000'}
                  />
                </Field>

                <Field label="Max discount (BHD)" hint={needsValue ? 'Cap for percent discounts' : undefined}>
                  <input
                    className={inputClass}
                    type="number"
                    step="any"
                    min="0"
                    disabled={!needsValue}
                    value={form.maxDiscount}
                    onChange={(e) => setForm((f) => ({ ...f, maxDiscount: e.target.value }))}
                    placeholder="2.000"
                  />
                </Field>

                <Field label="Min order (BHD)">
                  <input
                    className={inputClass}
                    type="number"
                    step="any"
                    min="0"
                    value={form.minOrder}
                    onChange={(e) => setForm((f) => ({ ...f, minOrder: e.target.value }))}
                  />
                </Field>

                <Field label="Max order (BHD)">
                  <input
                    className={inputClass}
                    type="number"
                    step="any"
                    min="0"
                    value={form.maxOrder}
                    onChange={(e) => setForm((f) => ({ ...f, maxOrder: e.target.value }))}
                  />
                </Field>

                <Field label="Validity days" hint="Relative expiry after issuance (e.g. 14)">
                  <input
                    className={inputClass}
                    type="number"
                    min="1"
                    value={form.validityDays}
                    onChange={(e) => setForm((f) => ({ ...f, validityDays: e.target.value }))}
                  />
                </Field>

                <Field label="Valid from">
                  <AdminDatePicker
                    value={form.validFrom}
                    onChange={(v) => setForm((f) => ({ ...f, validFrom: v }))}
                    min={null}
                  />
                </Field>

                <Field label="Valid to">
                  <AdminDatePicker
                    value={form.validTo}
                    onChange={(v) => setForm((f) => ({ ...f, validTo: v }))}
                    min={null}
                  />
                </Field>

                <Field label="Scope">
                  <Select
                    value={form.scope}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        scope: e.target.value,
                        ...(e.target.value === 'ALL' ? { scopeIdsText: '' } : {}),
                      }))
                    }
                  >
                    {SCOPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field
                  label="Scope IDs"
                  className="sm:col-span-2"
                  hint={needsScopeIds ? 'Comma-separated category / vendor / delivery-method ids' : 'Leave empty when scope is All'}
                >
                  <input
                    className={inputClass}
                    disabled={!needsScopeIds}
                    value={form.scopeIdsText}
                    onChange={(e) => setForm((f) => ({ ...f, scopeIdsText: e.target.value }))}
                    placeholder="id1, id2"
                  />
                </Field>

                <Field label="Source">
                  <Select
                    value={form.source}
                    onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}
                  >
                    {SOURCES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field label="Funded by" hint="Required on every template">
                  <Select
                    value={form.fundedBy}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        fundedBy: e.target.value,
                        ...(e.target.value !== 'SPLIT' ? { splitYjeekPercent: '' } : {}),
                      }))
                    }
                  >
                    {FUNDED_BY.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field
                  label="Yjeek split %"
                  hint={needsSplit ? '0–100; remainder is vendor-funded' : 'Only when funded by Split'}
                >
                  <input
                    className={inputClass}
                    type="number"
                    min="0"
                    max="100"
                    step="any"
                    disabled={!needsSplit}
                    value={form.splitYjeekPercent}
                    onChange={(e) => setForm((f) => ({ ...f, splitYjeekPercent: e.target.value }))}
                  />
                </Field>

                <Field label="Active">
                  <Select
                    value={form.active ? 'true' : 'false'}
                    onChange={(e) => setForm((f) => ({ ...f, active: e.target.value === 'true' }))}
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </Select>
                </Field>

                <div className="flex items-end sm:col-span-2 lg:col-span-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="h-[40px] rounded-[8px] bg-[#1aa054] px-5 text-[13px] font-bold text-white disabled:opacity-60"
                  >
                    {saving ? 'Saving…' : editingId ? 'Update template' : 'Create template'}
                  </button>
                </div>
              </form>
            </Card>

            <Card
              title="Send for acceptance"
              subtitle="OG: select vendors by list, category, or all — creates pending requests and notifies Vendor Panel accounts."
            >
              <form onSubmit={onSendForAcceptance} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Template" className="sm:col-span-2 lg:col-span-3">
                  <Select
                    value={sendTemplateId}
                    onChange={(e) => setSendTemplateId(e.target.value)}
                    required
                  >
                    <option value="">Select template…</option>
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                        {t.active ? '' : ' (inactive)'}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field label="Target">
                  <Select value={sendTarget} onChange={(e) => setSendTarget(e.target.value)}>
                    {TARGET_MODES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field label="Response deadline">
                  <AdminDatePicker
                    value={sendDeadline}
                    onChange={(v) => setSendDeadline(v)}
                    min={null}
                  />
                </Field>

                <Field
                  label="Vendor IDs"
                  className="sm:col-span-2 lg:col-span-3"
                  hint={sendTarget === 'LIST' ? 'Comma-separated vendor ids' : 'Only used when target is Vendor list'}
                >
                  <input
                    className={inputClass}
                    disabled={sendTarget !== 'LIST'}
                    value={sendVendorIdsText}
                    onChange={(e) => setSendVendorIdsText(e.target.value)}
                    placeholder="vendorId1, vendorId2"
                  />
                </Field>

                <Field
                  label="Category IDs"
                  className="sm:col-span-2 lg:col-span-3"
                  hint={
                    sendTarget === 'CATEGORY'
                      ? 'Comma-separated platform category ids (VendorCategory links)'
                      : 'Only used when target is Category'
                  }
                >
                  <input
                    className={inputClass}
                    disabled={sendTarget !== 'CATEGORY'}
                    value={sendCategoryIdsText}
                    onChange={(e) => setSendCategoryIdsText(e.target.value)}
                    placeholder="categoryId1, categoryId2"
                  />
                </Field>

                <div className="flex items-end sm:col-span-2 lg:col-span-3">
                  <button
                    type="submit"
                    disabled={sending || !sendTemplateId}
                    className="h-[40px] rounded-[8px] bg-[#17231c] px-5 text-[13px] font-bold text-white disabled:opacity-60"
                  >
                    {sending ? 'Sending…' : 'Send for acceptance'}
                  </button>
                </div>
              </form>
            </Card>

            <Card
              title="Templates"
              subtitle={`${total} template${total === 1 ? '' : 's'}`}
              actions={
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    className={cn(inputClass, 'h-[34px] w-[180px]')}
                    placeholder="Search name…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <Select
                    className="w-[130px]"
                    value={activeFilter}
                    onChange={(e) => setActiveFilter(e.target.value)}
                  >
                    <option value="all">All</option>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </Select>
                </div>
              }
            >
              {loading ? (
                <p className="text-[13px] text-[#7c8780]">Loading templates…</p>
              ) : templates.length === 0 ? (
                <p className="text-[13px] text-[#7c8780]">No voucher templates yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] border-collapse text-left text-[12.5px]">
                    <thead>
                      <tr className="border-b border-[#eceeec] text-[#7c8780]">
                        <th className="pb-2 pr-3 font-medium">Name</th>
                        <th className="pb-2 pr-3 font-medium">Type</th>
                        <th className="pb-2 pr-3 font-medium">Value</th>
                        <th className="pb-2 pr-3 font-medium">Funded by</th>
                        <th className="pb-2 pr-3 font-medium">Source</th>
                        <th className="pb-2 pr-3 font-medium">Status</th>
                        <th className="pb-2 font-medium" />
                      </tr>
                    </thead>
                    <tbody>
                      {templates.map((row) => (
                        <tr key={row.id} className="border-b border-[#f3f4f3] text-[#17231c]">
                          <td className="py-2.5 pr-3 font-semibold">{row.name}</td>
                          <td className="py-2.5 pr-3">{typeLabel(row.type)}</td>
                          <td className="py-2.5 pr-3">
                            {row.type === 'FREE_DELIVERY'
                              ? 'Free delivery'
                              : row.type === 'PERCENT'
                                ? `${formatMoney(row.value)}%${row.maxDiscount != null ? ` · max ${formatMoney(row.maxDiscount)}` : ''}`
                                : `BHD ${formatMoney(row.value)}`}
                          </td>
                          <td className="py-2.5 pr-3">
                            {fundedLabel(row.fundedBy)}
                            {row.fundedBy === 'SPLIT' && row.splitYjeekPercent != null
                              ? ` (${formatMoney(row.splitYjeekPercent)}% Yjeek)`
                              : ''}
                          </td>
                          <td className="py-2.5 pr-3">{row.source}</td>
                          <td className="py-2.5 pr-3">
                            <span
                              className={cn(
                                'inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold',
                                row.active
                                  ? 'bg-[#e8f7ed] text-[#147940]'
                                  : 'bg-[#eff2f0] text-[#637068]',
                              )}
                            >
                              {row.active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="py-2.5 text-right">
                            <div className="inline-flex gap-2">
                              <button
                                type="button"
                                className="text-[12px] font-bold text-[#1aa054]"
                                onClick={() => startEdit(row)}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="text-[12px] font-bold text-[#17231c]"
                                onClick={() => {
                                  setSendTemplateId(row.id)
                                  window.scrollTo({ top: 0, behavior: 'smooth' })
                                }}
                              >
                                Send
                              </button>
                              <button
                                type="button"
                                className="text-[12px] font-bold text-[#69756d]"
                                onClick={() => toggleActive(row)}
                              >
                                {row.active ? 'Deactivate' : 'Activate'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </>
        ) : null}

        {innerTab === 'responses' ? (
          <Card
            title="Vendor responses"
            subtitle="Confirm the final live list. Remove accepted vendors or re-send declined ones. Set item/category exclusions per vendor."
            actions={
              <div className="flex flex-wrap items-center gap-2">
                <Select
                  className="min-w-[200px]"
                  value={responsesTemplateId}
                  onChange={(e) => setResponsesTemplateId(e.target.value)}
                >
                  <option value="">Select template…</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </Select>
                <Select
                  className="w-[150px]"
                  value={responseFilter}
                  onChange={(e) => setResponseFilter(e.target.value)}
                >
                  {RESPONSE_FILTERS.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </Select>
                <button
                  type="button"
                  onClick={loadResponses}
                  className="h-[34px] rounded-[8px] px-3 text-[12.5px] font-bold text-[#69756d] ring-1 ring-[#e4e8e4]"
                >
                  Refresh
                </button>
              </div>
            }
          >
            <div className="mb-3 flex flex-wrap items-end gap-3">
              <Field label="Re-send deadline" className="w-[180px]">
                <AdminDatePicker
                  value={resendDeadline}
                  onChange={(v) => setResendDeadline(v)}
                  min={null}
                />
              </Field>
              <p className="pb-2 text-[11.5px] text-[#9aa49d]">
                Used when re-sending to declined or withdrawn vendors.
              </p>
            </div>

            {requestSummary ? (
              <p className="mb-3 text-[12.5px] text-[#7c8780]">
                Total {requestSummary.total} · Accepted {requestSummary.accepted} · Declined{' '}
                {requestSummary.declined} · No response {requestSummary.noResponse} · Confirmed live{' '}
                {requestSummary.confirmed ?? 0}
                {requestSummary.withdrawn
                  ? ` · Withdrawn ${requestSummary.withdrawn}`
                  : ''}
                {requestsTotal !== requestSummary.total
                  ? ` · Showing ${requestsTotal} (filtered)`
                  : ''}
              </p>
            ) : null}

            {!responsesTemplateId ? (
              <p className="text-[13px] text-[#7c8780]">Select a template to view vendor responses.</p>
            ) : responsesLoading ? (
              <p className="text-[13px] text-[#7c8780]">Loading responses…</p>
            ) : requests.length === 0 ? (
              <p className="text-[13px] text-[#7c8780]">No vendor requests for this template yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[880px] border-collapse text-left text-[12.5px]">
                  <thead>
                    <tr className="border-b border-[#eceeec] text-[#7c8780]">
                      <th className="pb-2 pr-3 font-medium">Vendor</th>
                      <th className="pb-2 pr-3 font-medium">Response</th>
                      <th className="pb-2 pr-3 font-medium">Sent</th>
                      <th className="pb-2 pr-3 font-medium">Deadline</th>
                      <th className="pb-2 pr-3 font-medium">Live</th>
                      <th className="pb-2 pr-3 font-medium">Exclusions</th>
                      <th className="pb-2 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((row) => {
                      const busy = actionBusyId === row.id
                      const panelOpen = panelRequestId === row.id
                      const canConfirm =
                        row.response === 'ACCEPTED' && !row.withdrawnAt && !row.adminConfirmed
                      const canEditExclusions =
                        row.response === 'ACCEPTED' && !row.withdrawnAt
                      const canRemove =
                        (row.response === 'ACCEPTED' || row.adminConfirmed) && !row.withdrawnAt
                      const canResend =
                        row.response === 'DECLINED' || Boolean(row.withdrawnAt)
                      const exclusionCount =
                        (row.excludedItemIds?.length || 0) +
                        (row.excludedCategoryIds?.length || 0)

                      return (
                        <tr key={row.id} className="border-b border-[#f3f4f3] text-[#17231c] align-top">
                          <td className="py-2.5 pr-3 font-semibold">
                            {row.vendorName || row.vendorId}
                            {row.withdrawnAt ? (
                              <span className="mt-1 block text-[11px] font-medium text-[#9b2c2c]">
                                Withdrawn
                              </span>
                            ) : null}
                          </td>
                          <td className="py-2.5 pr-3">
                            <span
                              className={cn(
                                'inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold',
                                row.response === 'ACCEPTED'
                                  ? 'bg-[#e8f7ed] text-[#147940]'
                                  : row.response === 'DECLINED'
                                    ? 'bg-[#fff0f0] text-[#9b2c2c]'
                                    : 'bg-[#eff2f0] text-[#637068]',
                              )}
                            >
                              {row.responseLabel || row.response}
                            </span>
                          </td>
                          <td className="py-2.5 pr-3">{isoToDateInput(row.sentAt) || '—'}</td>
                          <td className="py-2.5 pr-3">{isoToDateInput(row.deadline) || '—'}</td>
                          <td className="py-2.5 pr-3">
                            {row.isLive ? (
                              <span className="inline-flex rounded-full bg-[#e8f7ed] px-2 py-0.5 text-[11px] font-bold text-[#147940]">
                                Live
                              </span>
                            ) : row.adminConfirmed ? (
                              'Confirmed'
                            ) : (
                              'No'
                            )}
                          </td>
                          <td className="py-2.5 pr-3">
                            {exclusionCount > 0 ? `${exclusionCount} id(s)` : '—'}
                          </td>
                          <td className="py-2.5">
                            <div className="flex flex-wrap gap-2">
                              {canConfirm ? (
                                <button
                                  type="button"
                                  disabled={busy}
                                  className="text-[12px] font-bold text-[#1aa054] disabled:opacity-50"
                                  onClick={() => onConfirmRequest(row)}
                                >
                                  {busy ? '…' : 'Confirm'}
                                </button>
                              ) : null}
                              {canEditExclusions ? (
                                <button
                                  type="button"
                                  className="text-[12px] font-bold text-[#17231c]"
                                  onClick={() =>
                                    panelOpen ? closeExclusionsPanel() : openExclusionsPanel(row)
                                  }
                                >
                                  {panelOpen ? 'Close' : 'Exclusions'}
                                </button>
                              ) : null}
                              {canRemove ? (
                                <button
                                  type="button"
                                  disabled={busy}
                                  className="text-[12px] font-bold text-[#9b2c2c] disabled:opacity-50"
                                  onClick={() => onRemoveRequest(row)}
                                >
                                  Remove
                                </button>
                              ) : null}
                              {canResend ? (
                                <button
                                  type="button"
                                  disabled={busy}
                                  className="text-[12px] font-bold text-[#1aa054] disabled:opacity-50"
                                  onClick={() => onResendRequest(row)}
                                >
                                  Re-send
                                </button>
                              ) : null}
                            </div>

                            {panelOpen ? (
                              <div className="mt-3 max-w-[520px] rounded-[10px] border border-[#eceeec] bg-[#f8faf8] p-3">
                                <p className="mb-2 text-[11.5px] text-[#7c8780]">
                                  Product ids and vendor catalog category ids to exclude inside this
                                  store.
                                </p>
                                <Field label="Excluded item IDs" className="mb-2">
                                  <input
                                    className={inputClass}
                                    value={excludedItemIdsText}
                                    onChange={(e) => setExcludedItemIdsText(e.target.value)}
                                    placeholder="productId1, productId2"
                                  />
                                </Field>
                                <Field label="Excluded catalog category IDs" className="mb-2">
                                  <input
                                    className={inputClass}
                                    value={excludedCategoryIdsText}
                                    onChange={(e) => setExcludedCategoryIdsText(e.target.value)}
                                    placeholder="catalogCategoryId1, …"
                                  />
                                </Field>
                                <div className="mb-2 flex flex-wrap gap-2">
                                  {canConfirm ? (
                                    <button
                                      type="button"
                                      disabled={busy}
                                      onClick={() => onConfirmRequest(row)}
                                      className="h-[34px] rounded-[8px] bg-[#1aa054] px-3 text-[12px] font-bold text-white disabled:opacity-60"
                                    >
                                      Confirm with exclusions
                                    </button>
                                  ) : null}
                                  <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() => onSaveExclusions(row)}
                                    className="h-[34px] rounded-[8px] bg-[#17231c] px-3 text-[12px] font-bold text-white disabled:opacity-60"
                                  >
                                    Save exclusions
                                  </button>
                                  <button
                                    type="button"
                                    disabled={catalogLoading}
                                    onClick={() => loadCatalogHint(row.vendorId)}
                                    className="h-[34px] rounded-[8px] px-3 text-[12px] font-bold text-[#69756d] ring-1 ring-[#e4e8e4]"
                                  >
                                    {catalogLoading ? 'Loading…' : 'Load catalog ids'}
                                  </button>
                                </div>
                                {catalogHint ? (
                                  <pre className="mb-2 max-h-[160px] overflow-auto rounded-[8px] bg-white p-2 text-[11px] text-[#455249] ring-1 ring-[#e4e8e4]">
                                    {catalogHint}
                                  </pre>
                                ) : null}

                                <Field
                                  label="Preview cart product IDs"
                                  hint="Gate check: unconfirmed ⇒ not accepted by store; all excluded ⇒ not applicable."
                                  className="mb-2"
                                >
                                  <input
                                    className={inputClass}
                                    value={previewItemsText}
                                    onChange={(e) => setPreviewItemsText(e.target.value)}
                                    placeholder="productId (optional)"
                                  />
                                </Field>
                                <button
                                  type="button"
                                  disabled={previewBusy}
                                  onClick={() => onPreviewApplicability(row)}
                                  className="h-[34px] rounded-[8px] px-3 text-[12px] font-bold text-[#69756d] ring-1 ring-[#e4e8e4] disabled:opacity-60"
                                >
                                  {previewBusy ? 'Checking…' : 'Preview applicability'}
                                </button>
                                {previewResult ? (
                                  <p className="mt-2 text-[12px] text-[#17231c]">
                                    {previewResult.applicable
                                      ? `Applicable · eligible items ${previewResult.eligibleItems?.length ?? 0}` +
                                        (previewResult.excludedItemCount
                                          ? ` · excluded ${previewResult.excludedItemCount}`
                                          : '')
                                      : `Not applicable — ${previewResult.reason || '—'}`}
                                    {previewResult.vendorLive
                                      ? ' · vendor live'
                                      : ' · vendor not live'}
                                  </p>
                                ) : null}
                              </div>
                            ) : null}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        ) : null}

        {innerTab === 'distribution' ? (
          <>
            <Card
              title={editingRuleId ? 'Edit distribution rule' : 'New distribution rule'}
              subtitle="Trigger + Segment → Template. Frequency cap = max issues per customer per rolling week (OG max-per-week)."
              actions={
                editingRuleId ? (
                  <button
                    type="button"
                    onClick={resetDistForm}
                    className="h-[34px] rounded-[8px] px-3 text-[12.5px] font-bold text-[#69756d] ring-1 ring-[#e4e8e4]"
                  >
                    Cancel edit
                  </button>
                ) : null
              }
            >
              <form
                onSubmit={onSubmitRule}
                className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
              >
                <Field label="Trigger">
                  <Select
                    value={distForm.trigger}
                    onChange={(e) =>
                      setDistForm((f) => ({ ...f, trigger: e.target.value }))
                    }
                  >
                    {DISTRIBUTION_TRIGGERS.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                        {t.wired ? '' : ' (deferred)'}
                      </option>
                    ))}
                  </Select>
                </Field>

                {distForm.trigger === 'NO_ORDER_N_DAYS' ? (
                  <Field label="Days without order" hint="e.g. 14 for win-back">
                    <input
                      className={inputClass}
                      type="number"
                      min={1}
                      max={3650}
                      value={distForm.triggerDays}
                      onChange={(e) =>
                        setDistForm((f) => ({ ...f, triggerDays: e.target.value }))
                      }
                      required
                    />
                  </Field>
                ) : null}

                <Field
                  label="Template"
                  className={distForm.trigger === 'NO_ORDER_N_DAYS' ? '' : 'sm:col-span-1'}
                >
                  <Select
                    value={distForm.templateId}
                    onChange={(e) =>
                      setDistForm((f) => ({ ...f, templateId: e.target.value }))
                    }
                    required
                  >
                    <option value="">Select template…</option>
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                        {t.active ? '' : ' (inactive)'}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field
                  label="Segment id (optional)"
                  hint="Empty = all customers. Paste a customer_segments id."
                  className="sm:col-span-2 lg:col-span-2"
                >
                  <input
                    className={inputClass}
                    value={distForm.segmentId}
                    onChange={(e) =>
                      setDistForm((f) => ({ ...f, segmentId: e.target.value }))
                    }
                    placeholder="Leave blank for all customers"
                  />
                </Field>

                <Field
                  label="Frequency cap / week"
                  hint="Max issues per customer per rolling 7 days. Blank = unlimited."
                >
                  <input
                    className={inputClass}
                    type="number"
                    min={1}
                    max={10000}
                    value={distForm.frequencyCap}
                    onChange={(e) =>
                      setDistForm((f) => ({ ...f, frequencyCap: e.target.value }))
                    }
                    placeholder="e.g. 1"
                  />
                </Field>

                <Field label="Active">
                  <Select
                    value={distForm.active ? 'true' : 'false'}
                    onChange={(e) =>
                      setDistForm((f) => ({ ...f, active: e.target.value === 'true' }))
                    }
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </Select>
                </Field>

                <div className="flex items-end sm:col-span-2 lg:col-span-3">
                  <button
                    type="submit"
                    disabled={distSaving}
                    className="h-[40px] rounded-[8px] bg-[#1aa054] px-4 text-[13px] font-bold text-white disabled:opacity-60"
                  >
                    {distSaving
                      ? 'Saving…'
                      : editingRuleId
                        ? 'Update rule'
                        : 'Create rule'}
                  </button>
                </div>
              </form>
              {deferredTriggers.length > 0 ? (
                <p className="mt-3 text-[11.5px] text-[#9aa49d]">
                  Deferred auto-issue (CRUD only): {deferredTriggers.join(', ')}. Wired now:
                  REGISTRATION (on OTP register) · MANUAL (Run now).
                </p>
              ) : null}
            </Card>

            <Card
              title="Rules"
              subtitle={`${rulesTotal} rule${rulesTotal === 1 ? '' : 's'}. Registration fires on new customer OTP; Manual uses Run now.`}
              actions={
                <div className="flex flex-wrap items-center gap-2">
                  <Field label="Run phone (optional)" className="w-[160px]">
                    <input
                      className={inputClass}
                      value={runPhone}
                      onChange={(e) => setRunPhone(e.target.value)}
                      placeholder="+973…"
                    />
                  </Field>
                  <button
                    type="button"
                    onClick={loadRules}
                    className="mt-5 h-[34px] rounded-[8px] px-3 text-[12.5px] font-bold text-[#69756d] ring-1 ring-[#e4e8e4]"
                  >
                    Refresh
                  </button>
                </div>
              }
            >
              {rulesLoading ? (
                <p className="text-[13px] text-[#7c8780]">Loading rules…</p>
              ) : rules.length === 0 ? (
                <p className="text-[13px] text-[#7c8780]">
                  No distribution rules yet. Create a REGISTRATION rule with a Welcome template to
                  auto-issue on signup.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] border-collapse text-left text-[12.5px]">
                    <thead>
                      <tr className="border-b border-[#eceeec] text-[#7c8780]">
                        <th className="pb-2 pr-3 font-medium">Trigger</th>
                        <th className="pb-2 pr-3 font-medium">Template</th>
                        <th className="pb-2 pr-3 font-medium">Segment</th>
                        <th className="pb-2 pr-3 font-medium">Cap / wk</th>
                        <th className="pb-2 pr-3 font-medium">Status</th>
                        <th className="pb-2 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rules.map((row) => {
                        const busy = runBusyId === row.id
                        const triggerMeta = DISTRIBUTION_TRIGGERS.find(
                          (t) => t.value === row.trigger,
                        )
                        return (
                          <tr
                            key={row.id}
                            className="border-b border-[#f3f4f3] text-[#17231c] align-top"
                          >
                            <td className="py-2.5 pr-3 font-semibold">
                              {triggerMeta?.label || row.trigger}
                              {row.triggerDays != null ? ` · ${row.triggerDays}d` : ''}
                              {row.deferred ? (
                                <span className="mt-1 block text-[11px] font-medium text-[#9aa49d]">
                                  Deferred
                                </span>
                              ) : (
                                <span className="mt-1 block text-[11px] font-medium text-[#1aa054]">
                                  Wired
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 pr-3">
                              {row.template?.name || row.templateId}
                            </td>
                            <td className="py-2.5 pr-3">
                              {row.segment?.name || row.segmentId || 'All customers'}
                            </td>
                            <td className="py-2.5 pr-3">
                              {row.frequencyCap != null ? row.frequencyCap : '∞'}
                            </td>
                            <td className="py-2.5 pr-3">
                              <span
                                className={cn(
                                  'inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold',
                                  row.active
                                    ? 'bg-[#e8f7ee] text-[#1aa054]'
                                    : 'bg-[#f5f6f5] text-[#9aa49d]',
                                )}
                              >
                                {row.active ? 'Active' : 'Off'}
                              </span>
                            </td>
                            <td className="py-2.5">
                              <div className="flex flex-wrap gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => startEditRule(row)}
                                  className="h-[30px] rounded-[8px] px-2.5 text-[11.5px] font-bold text-[#69756d] ring-1 ring-[#e4e8e4]"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => toggleRuleActive(row)}
                                  className="h-[30px] rounded-[8px] px-2.5 text-[11.5px] font-bold text-[#69756d] ring-1 ring-[#e4e8e4]"
                                >
                                  {row.active ? 'Deactivate' : 'Activate'}
                                </button>
                                {row.trigger === 'MANUAL' ? (
                                  <button
                                    type="button"
                                    disabled={busy || !row.active}
                                    onClick={() => onRunRule(row)}
                                    className="h-[30px] rounded-[8px] bg-[#17231c] px-2.5 text-[11.5px] font-bold text-white disabled:opacity-60"
                                  >
                                    {busy ? 'Running…' : 'Run now'}
                                  </button>
                                ) : null}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </>
        ) : null}

        {innerTab === 'grant' ? (
          <>
            <Card
              title="Grant voucher"
              subtitle="Grant by phone or segment. CX L1 ≤ BHD 5.000 · L2 ≤ BHD 15.000 (support-agent / operations). Marketing uncapped."
            >
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <form onSubmit={onGrantPhone} className="space-y-3">
                  <Field label="Template">
                    <Select
                      value={grantTemplateId}
                      onChange={(e) => setGrantTemplateId(e.target.value)}
                    >
                      <option value="">Select…</option>
                      {templates.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                          {t.type === 'FIXED_AMOUNT' && t.value != null
                            ? ` · BHD ${Number(t.value).toFixed(3)}`
                            : ''}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Customer phone" hint="Bahrain national or E.164">
                    <input
                      className={inputClass}
                      value={grantPhone}
                      onChange={(e) => setGrantPhone(e.target.value)}
                      placeholder="36001234"
                    />
                  </Field>
                  <button
                    type="submit"
                    disabled={grantBusy}
                    className="h-[40px] rounded-[8px] bg-[#1aa054] px-4 text-[13px] font-bold text-white disabled:opacity-60"
                  >
                    {grantBusy ? 'Granting…' : 'Grant by phone'}
                  </button>
                </form>
                <form onSubmit={onGrantSegment} className="space-y-3">
                  <Field label="Segment id" hint="Bulk grant (M09 segments)">
                    <input
                      className={inputClass}
                      value={grantSegmentId}
                      onChange={(e) => setGrantSegmentId(e.target.value)}
                      placeholder="segment cuid"
                    />
                  </Field>
                  <button
                    type="submit"
                    disabled={grantBusy || !grantTemplateId}
                    className="h-[40px] rounded-[8px] bg-[#17231c] px-4 text-[13px] font-bold text-white disabled:opacity-60"
                  >
                    {grantBusy ? 'Granting…' : 'Grant to segment'}
                  </button>
                </form>
              </div>
            </Card>

            <Card
              title="Issued vouchers"
              subtitle={`${issuedTotal} total · status + order id`}
              actions={
                <button
                  type="button"
                  onClick={() => loadIssued()}
                  className="h-[34px] rounded-[8px] px-3 text-[12.5px] font-bold text-[#69756d] ring-1 ring-[#e4e8e4]"
                >
                  Refresh
                </button>
              }
            >
              <div className="mb-3 flex flex-wrap gap-2">
                <Select
                  className="w-[160px]"
                  value={issuedStatus}
                  onChange={(e) => setIssuedStatus(e.target.value)}
                >
                  {ISSUED_STATUS_FILTERS.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </Select>
                <input
                  className={cn(inputClass, 'max-w-[200px]')}
                  value={issuedPhone}
                  onChange={(e) => setIssuedPhone(e.target.value)}
                  placeholder="Filter phone"
                />
                <button
                  type="button"
                  onClick={() => loadIssued()}
                  className="h-[40px] rounded-[8px] px-3 text-[12.5px] font-bold text-[#69756d] ring-1 ring-[#e4e8e4]"
                >
                  Apply
                </button>
              </div>
              {issuedLoading ? (
                <p className="text-[13px] text-[#7c8780]">Loading…</p>
              ) : issuedRows.length === 0 ? (
                <p className="text-[13px] text-[#7c8780]">No issued vouchers.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] border-collapse text-left text-[12.5px]">
                    <thead>
                      <tr className="border-b border-[#eceeec] text-[#7c8780]">
                        <th className="pb-2 pr-3 font-medium">Customer</th>
                        <th className="pb-2 pr-3 font-medium">Template</th>
                        <th className="pb-2 pr-3 font-medium">Status</th>
                        <th className="pb-2 pr-3 font-medium">Order</th>
                        <th className="pb-2 pr-3 font-medium">Valid to</th>
                        <th className="pb-2 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {issuedRows.map((row) => {
                        const busy = revokeBusyId === row.id
                        return (
                          <tr
                            key={row.id}
                            className="border-b border-[#f3f4f3] text-[#17231c] align-top"
                          >
                            <td className="py-2.5 pr-3">
                              <div className="font-semibold">
                                {row.customer?.phone || '—'}
                              </div>
                              <div className="text-[11px] text-[#9aa49d]">
                                {row.customer?.name || row.customer?.id}
                              </div>
                            </td>
                            <td className="py-2.5 pr-3">{row.template?.name || '—'}</td>
                            <td className="py-2.5 pr-3">
                              <span className="inline-flex rounded-full bg-[#f5f6f5] px-2 py-0.5 text-[11px] font-bold text-[#69756d]">
                                {row.status}
                              </span>
                            </td>
                            <td className="py-2.5 pr-3 font-mono text-[11.5px]">
                              {row.orderNumber || row.orderId || '—'}
                            </td>
                            <td className="py-2.5 pr-3">
                              {row.validTo
                                ? new Date(row.validTo).toLocaleDateString()
                                : '—'}
                            </td>
                            <td className="py-2.5">
                              {row.status === 'ACTIVE' ? (
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => onRevoke(row)}
                                  className="h-[30px] rounded-[8px] px-2.5 text-[11.5px] font-bold text-[#b42318] ring-1 ring-[#f0c8c4] disabled:opacity-60"
                                >
                                  {busy ? '…' : 'Revoke'}
                                </button>
                              ) : (
                                '—'
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            <Card
              title="Settlement export"
              subtitle="Per vendor: Yjeek-funded · vendor-funded · split (OG funded_by)"
              actions={
                <div className="flex flex-wrap items-center gap-2">
                  <Select
                    className="w-[140px]"
                    value={settlementPreset}
                    onChange={(e) => setSettlementPreset(e.target.value)}
                  >
                    <option value="mtd">Month to date</option>
                    <option value="30d">Last 30 days</option>
                    <option value="7d">Last 7 days</option>
                  </Select>
                  <button
                    type="button"
                    disabled={settlementBusy}
                    onClick={onExportSettlement}
                    className="h-[34px] rounded-[8px] bg-[#17231c] px-3 text-[12.5px] font-bold text-white disabled:opacity-60"
                  >
                    {settlementBusy ? 'Exporting…' : 'Export CSV'}
                  </button>
                </div>
              }
            >
              {settlementPreview?.totals ? (
                <p className="text-[12.5px] text-[#7c8780]">
                  Totals · Yjeek {Number(settlementPreview.totals.yjeekFunded || 0).toFixed(3)} ·
                  Vendor {Number(settlementPreview.totals.vendorFunded || 0).toFixed(3)} · Split
                  Yjeek {Number(settlementPreview.totals.splitYjeek || 0).toFixed(3)} / Vendor{' '}
                  {Number(settlementPreview.totals.splitVendor || 0).toFixed(3)} · Orders{' '}
                  {settlementPreview.totals.orderCount ?? 0}
                </p>
              ) : (
                <p className="text-[13px] text-[#7c8780]">
                  Export downloads CSV with columns yjeek_funded, vendor_funded, split_yjeek,
                  split_vendor.
                </p>
              )}
            </Card>
          </>
        ) : null}
      </div>
    </div>
  )
}
