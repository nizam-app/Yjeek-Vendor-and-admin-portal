import { useCallback, useEffect, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { formatApiErrorMessage } from '../../../api/errors'
import { useAuth } from '../../../context/AuthContext'
import { adminService } from '../../../services/adminService'
import { MarketingViewTabs } from '../../../components/admin/MarketingViewTabs'
import { AdminEntitySearchPicker } from '../../../components/admin/AdminEntitySearchPicker'
import { AdminDatePicker } from '../../../components/admin/AdminDatePicker'
import { cn } from '../../../components/admin/cn'

const labelClass = 'mb-1.5 block text-[12px] font-medium leading-none text-[#7c8780]'
const inputClass =
  'box-border h-[40px] w-full rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white px-3 text-[13px] text-[#17231c] outline-none transition placeholder:text-[#9aa49d] focus:border-[#1aa054] disabled:bg-[#f5f6f5] disabled:text-[#9aa49d]'

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

function percentToRate(percent) {
  const n = Number(percent)
  if (!Number.isFinite(n)) return null
  return Math.round((n / 100) * 10000) / 10000
}

function emptyToNullNumber(value) {
  const raw = String(value ?? '').trim()
  if (!raw) return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : NaN
}

function combineDateStart(dateValue) {
  const date = String(dateValue || '').trim()
  if (!date) return null
  return new Date(`${date}T00:00:00.000Z`).toISOString()
}

function combineDateEnd(dateValue) {
  const date = String(dateValue || '').trim()
  if (!date) return null
  return new Date(`${date}T23:59:59.999Z`).toISOString()
}

function isoToDateInput(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
}

function formatBhd(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '0.000'
  return n.toFixed(3)
}

function downloadCsv(filename, csvText) {
  const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function defaultReportFrom() {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - 30)
  return isoToDateInput(d.toISOString())
}

function defaultReportTo() {
  return isoToDateInput(new Date().toISOString())
}

/**
 * OG Admin › Marketing › Cashback — base rate, overrides, boosts, caps, validity.
 */
export default function AdminCashbackPage() {
  const { user } = useAuth()
  const canEditBaseRateUi =
    user?.backendRole === 'Super Admin' || user?.roleBadge === 'Super Admin'

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [data, setData] = useState(null)

  const [basePercent, setBasePercent] = useState('3')
  const [perOrderCap, setPerOrderCap] = useState('')
  const [perCustomerMonthCap, setPerCustomerMonthCap] = useState('')
  const [validityMonths, setValidityMonths] = useState('6')

  const [overrideScope, setOverrideScope] = useState('CATEGORY')
  const [overrideTargetId, setOverrideTargetId] = useState('')
  const [overrideVendors, setOverrideVendors] = useState([])
  const [overridePercent, setOverridePercent] = useState('')

  const [boostScope, setBoostScope] = useState('CATEGORY')
  const [boostCategoryId, setBoostCategoryId] = useState('')
  const [boostMultiplier, setBoostMultiplier] = useState('2')
  const [boostFundedBy, setBoostFundedBy] = useState('YJEEK')
  const [boostFrom, setBoostFrom] = useState('')
  const [boostTo, setBoostTo] = useState('')

  const [reportFrom, setReportFrom] = useState(defaultReportFrom)
  const [reportTo, setReportTo] = useState(defaultReportTo)
  const [reportVendors, setReportVendors] = useState([])
  const [reportLoading, setReportLoading] = useState(false)
  const [reportError, setReportError] = useState('')
  const [reportData, setReportData] = useState(null)

  const categories = data?.meta?.categories ?? []

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await adminService.getAdminCashback()
      const payload = res?.data ?? null
      setData(payload)
      setBasePercent(String(payload?.baseRate?.ratePercent ?? 3))
      setPerOrderCap(
        payload?.settings?.perOrderCap != null ? String(payload.settings.perOrderCap) : '',
      )
      setPerCustomerMonthCap(
        payload?.settings?.perCustomerMonthCap != null
          ? String(payload.settings.perCustomerMonthCap)
          : '',
      )
      setValidityMonths(String(payload?.settings?.validityMonths ?? 6))
    } catch (err) {
      setError(formatApiErrorMessage(err) || 'Failed to load cashback settings.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

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

  const buildReportParams = useCallback(() => {
    const from = combineDateStart(reportFrom)
    const to = combineDateEnd(reportTo)
    if (!from || !to) throw new Error('Select a valid from/to date range.')
    const vendorId = reportVendors[0]?.id || undefined
    return { from, to, vendorId }
  }, [reportFrom, reportTo, reportVendors])

  const loadReport = useCallback(async () => {
    setReportLoading(true)
    setReportError('')
    try {
      const params = buildReportParams()
      const res = await adminService.getAdminCashbackReport(params)
      setReportData(res?.data ?? null)
    } catch (err) {
      setReportError(formatApiErrorMessage(err) || 'Failed to load cashback report.')
      setReportData(null)
    } finally {
      setReportLoading(false)
    }
  }, [buildReportParams])

  async function exportReport() {
    setReportError('')
    try {
      const params = buildReportParams()
      const res = await adminService.exportAdminCashbackReport(params)
      const csv = res?.data || ''
      if (!String(csv).trim()) {
        setReportError('Export returned no CSV data.')
        return
      }
      const vendorSuffix = params.vendorId ? `-${params.vendorId.slice(0, 8)}` : ''
      downloadCsv(`cashback-report${vendorSuffix}.csv`, csv)
    } catch (err) {
      setReportError(formatApiErrorMessage(err) || 'Failed to export cashback report.')
    }
  }

  async function withSave(fn, okMessage) {
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await fn()
      setSuccess(okMessage)
      await load()
    } catch (err) {
      setError(formatApiErrorMessage(err) || 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  const canEditBaseRate = Boolean(data?.canEditBaseRate) && canEditBaseRateUi

  return (
    <div className="px-5 py-4 pb-8 max-[700px]:px-3">
      <div className="mb-3.5">
        <h2 className="text-[20px] font-bold tracking-[-0.02em] text-[#17231c]">Cashback</h2>
        <p className="mt-0.5 text-[12.5px] text-[#7c8780]">
          Base rate, overrides, boost days, caps, and ledger report.
        </p>
      </div>

      <MarketingViewTabs active="cashback" />

      <div className="mt-4 flex flex-col gap-4">
        {error ? <Banner tone="error">{error}</Banner> : null}
        {success ? <Banner tone="success">{success}</Banner> : null}

        {loading ? (
          <Card>
            <p className="text-[13px] text-[#7c8780]">Loading cashback settings…</p>
          </Card>
        ) : (
          <>
            <Card
              title="Base rate"
              subtitle="Default platform cashback rate. Super Admin only."
              actions={
                <button
                  type="button"
                  disabled={saving || !canEditBaseRate}
                  onClick={() =>
                    withSave(async () => {
                      const rate = percentToRate(basePercent)
                      if (rate == null || rate < 0) throw new Error('Enter a valid base rate %.')
                      await adminService.updateAdminCashbackBaseRate({ rate })
                    }, 'Base rate saved.')
                  }
                  className="h-9 rounded-[8px] bg-[#1aa054] px-3.5 text-[12.5px] font-semibold text-white disabled:opacity-50"
                >
                  Save base rate
                </button>
              }
            >
              <div className="grid max-w-[320px] gap-3">
                <Field
                  label="Rate (%)"
                  hint={
                    canEditBaseRate
                      ? 'Example: 3 = 3%'
                      : 'Locked — only Super Admin can change the base rate.'
                  }
                >
                  <input
                    className={inputClass}
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={basePercent}
                    disabled={!canEditBaseRate || saving}
                    onChange={(e) => setBasePercent(e.target.value)}
                  />
                </Field>
              </div>
            </Card>

            <Card
              title="Caps & validity"
              subtitle="Empty caps = none (OG default). Validity months default 6."
              actions={
                <button
                  type="button"
                  disabled={saving}
                  onClick={() =>
                    withSave(async () => {
                      const perOrder = emptyToNullNumber(perOrderCap)
                      const perMonth = emptyToNullNumber(perCustomerMonthCap)
                      if (Number.isNaN(perOrder) || Number.isNaN(perMonth)) {
                        throw new Error('Caps must be empty or a valid BHD amount.')
                      }
                      const months = Number(validityMonths)
                      if (!Number.isInteger(months) || months < 1) {
                        throw new Error('Validity months must be a positive integer.')
                      }
                      await adminService.updateAdminCashbackSettings({
                        perOrderCap: perOrder,
                        perCustomerMonthCap: perMonth,
                        validityMonths: months,
                      })
                    }, 'Caps & validity saved.')
                  }
                  className="h-9 rounded-[8px] bg-[#1aa054] px-3.5 text-[12.5px] font-semibold text-white disabled:opacity-50"
                >
                  Save policy
                </button>
              }
            >
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Cap per order (BHD)" hint="Leave empty for none">
                  <input
                    className={inputClass}
                    type="number"
                    min="0"
                    step="0.001"
                    value={perOrderCap}
                    disabled={saving}
                    onChange={(e) => setPerOrderCap(e.target.value)}
                    placeholder="None"
                  />
                </Field>
                <Field label="Cap per customer / month (BHD)" hint="Leave empty for none">
                  <input
                    className={inputClass}
                    type="number"
                    min="0"
                    step="0.001"
                    value={perCustomerMonthCap}
                    disabled={saving}
                    onChange={(e) => setPerCustomerMonthCap(e.target.value)}
                    placeholder="None"
                  />
                </Field>
                <Field label="Validity months">
                  <input
                    className={inputClass}
                    type="number"
                    min="1"
                    max="60"
                    step="1"
                    value={validityMonths}
                    disabled={saving}
                    onChange={(e) => setValidityMonths(e.target.value)}
                  />
                </Field>
              </div>
            </Card>

            <Card title="Category / vendor overrides" subtitle="e.g. Electronics 1.5%">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Field label="Scope">
                  <Select
                    value={overrideScope}
                    disabled={saving}
                    onChange={(e) => {
                      setOverrideScope(e.target.value)
                      setOverrideTargetId('')
                      setOverrideVendors([])
                    }}
                  >
                    <option value="CATEGORY">Category</option>
                    <option value="VENDOR">Vendor</option>
                  </Select>
                </Field>
                {overrideScope === 'CATEGORY' ? (
                  <Field label="Category">
                    <Select
                      value={overrideTargetId}
                      disabled={saving}
                      onChange={(e) => setOverrideTargetId(e.target.value)}
                    >
                      <option value="">Select category</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </Select>
                  </Field>
                ) : (
                  <div className="sm:col-span-1 lg:col-span-1">
                    <AdminEntitySearchPicker
                      label="Vendor"
                      placeholder="Search vendor name…"
                      helperText="Pick one vendor for this override."
                      maxSelected={1}
                      allowRawIdAdd={false}
                      selected={overrideVendors}
                      onChange={setOverrideVendors}
                      searchFn={searchVendors}
                      disabled={saving}
                    />
                  </div>
                )}
                <Field label="Override rate (%)">
                  <input
                    className={inputClass}
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={overridePercent}
                    disabled={saving}
                    onChange={(e) => setOverridePercent(e.target.value)}
                  />
                </Field>
                <div className="flex items-end">
                  <button
                    type="button"
                    disabled={saving}
                    className="h-10 w-full rounded-[8px] border border-[#d7ddd9] bg-white text-[12.5px] font-semibold text-[#17231c] disabled:opacity-50"
                    onClick={() =>
                      withSave(async () => {
                        const rate = percentToRate(overridePercent)
                        if (rate == null) throw new Error('Enter override rate %.')
                        const scopeTargetId =
                          overrideScope === 'VENDOR'
                            ? overrideVendors[0]?.id
                            : overrideTargetId
                        if (!scopeTargetId) throw new Error('Select a category or vendor.')
                        await adminService.createAdminCashbackRule({
                          kind: 'OVERRIDE',
                          scope: overrideScope,
                          scopeTargetId,
                          rate,
                          fundedBy: 'YJEEK',
                        })
                        setOverridePercent('')
                        setOverrideTargetId('')
                        setOverrideVendors([])
                      }, 'Override created.')
                    }
                  >
                    Add override
                  </button>
                </div>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[520px] border-collapse text-left text-[12.5px]">
                  <thead>
                    <tr className="border-b border-[#eceeec] text-[#7c8780]">
                      <th className="py-2 pr-3 font-medium">Scope</th>
                      <th className="py-2 pr-3 font-medium">Target</th>
                      <th className="py-2 pr-3 font-medium">Rate</th>
                      <th className="py-2 pr-3 font-medium">Active</th>
                      <th className="py-2 font-medium" />
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.overrides || []).length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-3 text-[#9aa49d]">
                          No overrides yet.
                        </td>
                      </tr>
                    ) : (
                      (data?.overrides || []).map((row) => (
                        <tr key={row.id} className="border-b border-[#f3f4f3]">
                          <td className="py-2.5 pr-3 text-[#17231c]">{row.scope}</td>
                          <td className="py-2.5 pr-3 text-[#17231c]">
                            {row.scopeTargetLabel || row.scopeTargetId || '—'}
                          </td>
                          <td className="py-2.5 pr-3 text-[#17231c]">{row.ratePercent}%</td>
                          <td className="py-2.5 pr-3 text-[#17231c]">
                            {row.active ? 'Yes' : 'No'}
                          </td>
                          <td className="py-2.5 text-right">
                            <button
                              type="button"
                              disabled={saving}
                              className="text-[12px] font-semibold text-[#9b2c2c] disabled:opacity-50"
                              onClick={() =>
                                withSave(
                                  () => adminService.deleteAdminCashbackRule(row.id),
                                  'Override removed.',
                                )
                              }
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card
              title="Boost days"
              subtitle="Date range + categories + multiplier + who funds the extra (Yjeek / vendor)."
            >
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Scope">
                  <Select
                    value={boostScope}
                    disabled={saving}
                    onChange={(e) => {
                      setBoostScope(e.target.value)
                      setBoostCategoryId('')
                    }}
                  >
                    <option value="CATEGORY">Category</option>
                    <option value="GLOBAL">All categories</option>
                  </Select>
                </Field>
                {boostScope === 'CATEGORY' ? (
                  <Field label="Category">
                    <Select
                      value={boostCategoryId}
                      disabled={saving}
                      onChange={(e) => setBoostCategoryId(e.target.value)}
                    >
                      <option value="">Select category</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </Select>
                  </Field>
                ) : null}
                <Field label="Multiplier" hint="e.g. 2 = double cashback">
                  <input
                    className={inputClass}
                    type="number"
                    min="1.01"
                    max="20"
                    step="0.01"
                    value={boostMultiplier}
                    disabled={saving}
                    onChange={(e) => setBoostMultiplier(e.target.value)}
                  />
                </Field>
                <Field label="Funded by">
                  <Select
                    value={boostFundedBy}
                    disabled={saving}
                    onChange={(e) => setBoostFundedBy(e.target.value)}
                  >
                    <option value="YJEEK">Yjeek</option>
                    <option value="VENDOR">Vendor</option>
                  </Select>
                </Field>
                <Field label="From">
                  <AdminDatePicker
                    value={boostFrom}
                    onChange={setBoostFrom}
                    disabled={saving}
                    min={null}
                  />
                </Field>
                <Field label="To">
                  <AdminDatePicker
                    value={boostTo}
                    onChange={setBoostTo}
                    disabled={saving}
                    min={null}
                  />
                </Field>
              </div>
              <div className="mt-3">
                <button
                  type="button"
                  disabled={saving}
                  className="h-10 rounded-[8px] border border-[#d7ddd9] bg-white px-4 text-[12.5px] font-semibold text-[#17231c] disabled:opacity-50"
                  onClick={() =>
                    withSave(async () => {
                      const multiplier = Number(boostMultiplier)
                      if (!Number.isFinite(multiplier) || multiplier <= 1) {
                        throw new Error('Multiplier must be greater than 1.')
                      }
                      if (boostScope === 'CATEGORY' && !boostCategoryId) {
                        throw new Error('Select a category for the boost.')
                      }
                      await adminService.createAdminCashbackRule({
                        kind: 'BOOST',
                        scope: boostScope,
                        scopeTargetId: boostScope === 'CATEGORY' ? boostCategoryId : null,
                        multiplier,
                        fundedBy: boostFundedBy,
                        validFrom: combineDateStart(boostFrom),
                        validTo: combineDateEnd(boostTo),
                      })
                      setBoostMultiplier('2')
                      setBoostCategoryId('')
                      setBoostFrom('')
                      setBoostTo('')
                    }, 'Boost day created.')
                  }
                >
                  Add boost day
                </button>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[640px] border-collapse text-left text-[12.5px]">
                  <thead>
                    <tr className="border-b border-[#eceeec] text-[#7c8780]">
                      <th className="py-2 pr-3 font-medium">Scope</th>
                      <th className="py-2 pr-3 font-medium">Target</th>
                      <th className="py-2 pr-3 font-medium">×</th>
                      <th className="py-2 pr-3 font-medium">Funded</th>
                      <th className="py-2 pr-3 font-medium">Window</th>
                      <th className="py-2 font-medium" />
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.boosts || []).length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-3 text-[#9aa49d]">
                          No boost days yet.
                        </td>
                      </tr>
                    ) : (
                      (data?.boosts || []).map((row) => (
                        <tr key={row.id} className="border-b border-[#f3f4f3]">
                          <td className="py-2.5 pr-3">{row.scope}</td>
                          <td className="py-2.5 pr-3">
                            {row.scope === 'GLOBAL'
                              ? 'All'
                              : row.scopeTargetLabel || row.scopeTargetId || '—'}
                          </td>
                          <td className="py-2.5 pr-3">{row.multiplier}</td>
                          <td className="py-2.5 pr-3">{row.fundedBy}</td>
                          <td className="py-2.5 pr-3">
                            {isoToDateInput(row.validFrom) || '—'} →{' '}
                            {isoToDateInput(row.validTo) || '—'}
                          </td>
                          <td className="py-2.5 text-right">
                            <button
                              type="button"
                              disabled={saving}
                              className="text-[12px] font-semibold text-[#9b2c2c] disabled:opacity-50"
                              onClick={() =>
                                withSave(
                                  () => adminService.deleteAdminCashbackRule(row.id),
                                  'Boost removed.',
                                )
                              }
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card
              title="Cashback report"
              subtitle="Accrued / released / reversed / expired per day, per vendor (UTC)."
              actions={
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={reportLoading}
                    onClick={loadReport}
                    className="h-9 rounded-[8px] bg-[#1aa054] px-3.5 text-[12.5px] font-semibold text-white disabled:opacity-50"
                  >
                    {reportLoading ? 'Loading…' : 'Run report'}
                  </button>
                  <button
                    type="button"
                    disabled={reportLoading}
                    onClick={exportReport}
                    className="h-9 rounded-[8px] border border-[#d5dbd7] bg-white px-3.5 text-[12.5px] font-semibold text-[#17231c] disabled:opacity-50"
                  >
                    Export CSV
                  </button>
                </div>
              }
            >
              {reportError ? (
                <div className="mb-3">
                  <Banner tone="error">{reportError}</Banner>
                </div>
              ) : null}
              <div className="grid items-start gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Field label="From">
                  <AdminDatePicker value={reportFrom} onChange={setReportFrom} />
                </Field>
                <Field label="To">
                  <AdminDatePicker value={reportTo} onChange={setReportTo} />
                </Field>
                <div className="min-w-0 sm:col-span-2">
                  <AdminEntitySearchPicker
                    label="Vendor"
                    placeholder="Search vendor name…"
                    helperText="Optional. Empty = all vendors."
                    maxSelected={1}
                    allowRawIdAdd={false}
                    selected={reportVendors}
                    onChange={setReportVendors}
                    searchFn={searchVendors}
                  />
                </div>
              </div>

              {reportData ? (
                <div className="mt-4 space-y-3">
                  <div className="grid gap-2 sm:grid-cols-4">
                    {[
                      ['Accrued', reportData.totals?.accrued],
                      ['Released', reportData.totals?.released],
                      ['Reversed', reportData.totals?.reversed],
                      ['Expired', reportData.totals?.expired],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="rounded-[10px] border border-[#eceeec] bg-[#fafbfa] px-3 py-2"
                      >
                        <p className="text-[11px] font-medium uppercase tracking-wide text-[#7c8780]">
                          {label}
                        </p>
                        <p className="mt-0.5 text-[15px] font-bold text-[#17231c]">
                          BHD {formatBhd(value)}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px] border-collapse text-left text-[12.5px]">
                      <thead>
                        <tr className="border-b border-[#eceeec] text-[#7c8780]">
                          <th className="py-2 pr-3 font-medium">Day</th>
                          <th className="py-2 pr-3 font-medium">Vendor</th>
                          <th className="py-2 pr-3 font-medium">Accrued</th>
                          <th className="py-2 pr-3 font-medium">Released</th>
                          <th className="py-2 pr-3 font-medium">Reversed</th>
                          <th className="py-2 font-medium">Expired</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(reportData.rows || []).length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-3 text-[#9aa49d]">
                              No cashback ledger activity in this range.
                            </td>
                          </tr>
                        ) : (
                          (reportData.rows || []).map((row) => (
                            <tr
                              key={`${row.day}-${row.vendorId}`}
                              className="border-b border-[#f3f4f3]"
                            >
                              <td className="py-2.5 pr-3 text-[#17231c]">{row.day}</td>
                              <td className="py-2.5 pr-3 text-[#17231c]">
                                {row.vendorName || row.vendorId}
                              </td>
                              <td className="py-2.5 pr-3">{formatBhd(row.accrued)}</td>
                              <td className="py-2.5 pr-3">{formatBhd(row.released)}</td>
                              <td className="py-2.5 pr-3">{formatBhd(row.reversed)}</td>
                              <td className="py-2.5">{formatBhd(row.expired)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-[11.5px] text-[#9aa49d]">
                    Released equals accrued (Available at Delivered). Expired fills when credits
                    pass expiresAt.
                  </p>
                </div>
              ) : (
                <p className="mt-3 text-[12.5px] text-[#9aa49d]">
                  Choose a range and run the report to see ledger totals.
                </p>
              )}
            </Card>

            <Card
              title="Payment rules"
              subtitle="Fixed OG table — cashback only on money the customer paid from their own pocket."
            >
              <div className="overflow-x-auto">
                <table className="w-full min-w-[480px] border-collapse text-left text-[12.5px]">
                  <thead>
                    <tr className="border-b border-[#eceeec] text-[#7c8780]">
                      <th className="py-2 pr-3 font-medium">Paid with</th>
                      <th className="py-2 pr-3 font-medium">Cashback?</th>
                      <th className="py-2 font-medium">Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.meta?.paymentRules || []).map((row) => (
                      <tr key={row.paidWith} className="border-b border-[#f3f4f3]">
                        <td className="py-2.5 pr-3 text-[#17231c]">{row.paidWith}</td>
                        <td className="py-2.5 pr-3 font-semibold text-[#17231c]">
                          {row.cashback ? 'Yes' : 'No'}
                        </td>
                        <td className="py-2.5 text-[#7c8780]">{row.note || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
