import { useCallback, useEffect, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { formatApiErrorMessage } from '../../../api/errors'
import { useAuth } from '../../../context/AuthContext'
import { adminService } from '../../../services/adminService'
import { MarketingViewTabs } from '../../../components/admin/MarketingViewTabs'
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

function emptyToNullNumber(value) {
  const raw = String(value ?? '').trim()
  if (!raw) return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : NaN
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

function statusTone(status) {
  if (status === 'REWARDED') return 'bg-[#e8f7ed] text-[#147940]'
  if (status === 'INVITED') return 'bg-[#eef3ff] text-[#3b5bdb]'
  if (status === 'EXPIRED') return 'bg-[#eff2f0] text-[#637068]'
  if (status === 'REJECTED') return 'bg-[#fff1f1] text-[#9b2c2c]'
  return 'bg-[#eff2f0] text-[#637068]'
}

/**
 * OG Admin › Marketing › Referral — controls + invites list.
 */
export default function AdminReferralPage() {
  const { user } = useAuth()
  const canEditValuesUi =
    user?.backendRole === 'Super Admin' || user?.roleBadge === 'Super Admin'

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [data, setData] = useState(null)

  const [programmeEnabled, setProgrammeEnabled] = useState(true)
  const [creditValidityDays, setCreditValidityDays] = useState('30')
  const [inviteExpiryDays, setInviteExpiryDays] = useState('30')
  const [minOrderAmount, setMinOrderAmount] = useState('5')
  const [coverageCapPercent, setCoverageCapPercent] = useState('50')
  const [coverageCapEnabled, setCoverageCapEnabled] = useState(true)
  const [invitesPerDay, setInvitesPerDay] = useState('5')
  const [invitesPerMonth, setInvitesPerMonth] = useState('15')

  const [inviterReward, setInviterReward] = useState('1')
  const [inviteeReward, setInviteeReward] = useState('1')
  const [monthlyBudget, setMonthlyBudget] = useState('')

  const [invitesLoading, setInvitesLoading] = useState(false)
  const [invitesError, setInvitesError] = useState('')
  const [invites, setInvites] = useState([])
  const [invitesTotal, setInvitesTotal] = useState(0)
  const [searchQ, setSearchQ] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [page, setPage] = useState(1)
  const limit = 50

  const applySettingsToForm = useCallback((payload) => {
    const s = payload?.settings
    if (!s) return
    setProgrammeEnabled(Boolean(s.programmeEnabled))
    setCreditValidityDays(String(s.creditValidityDays ?? 30))
    setInviteExpiryDays(String(s.inviteExpiryDays ?? 30))
    setMinOrderAmount(String(s.minOrderAmount ?? 5))
    setCoverageCapPercent(String(s.coverageCapPercent ?? 50))
    setCoverageCapEnabled(Boolean(s.coverageCapEnabled))
    setInvitesPerDay(String(s.invitesPerDay ?? 5))
    setInvitesPerMonth(String(s.invitesPerMonth ?? 15))
    setInviterReward(String(s.inviterRewardAmount ?? 1))
    setInviteeReward(String(s.inviteeRewardAmount ?? 1))
    setMonthlyBudget(
      s.monthlyBudget == null || s.monthlyBudget === ''
        ? ''
        : String(s.monthlyBudget),
    )
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await adminService.getAdminReferral()
      const payload = res?.data ?? null
      setData(payload)
      applySettingsToForm(payload)
    } catch (err) {
      setError(formatApiErrorMessage(err) || 'Failed to load referral settings.')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [applySettingsToForm])

  const loadInvites = useCallback(async () => {
    setInvitesLoading(true)
    setInvitesError('')
    try {
      const res = await adminService.listAdminReferralInvites({
        q: searchQ.trim() || undefined,
        status: statusFilter,
        page,
        limit,
      })
      const payload = res?.data ?? null
      setInvites(Array.isArray(payload?.invites) ? payload.invites : [])
      setInvitesTotal(Number(payload?.total) || 0)
    } catch (err) {
      setInvitesError(formatApiErrorMessage(err) || 'Failed to load invites.')
      setInvites([])
      setInvitesTotal(0)
    } finally {
      setInvitesLoading(false)
    }
  }, [searchQ, statusFilter, page])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    loadInvites()
  }, [loadInvites])

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

  async function exportInvites() {
    setInvitesError('')
    try {
      const res = await adminService.exportAdminReferralInvites({
        q: searchQ.trim() || undefined,
        status: statusFilter,
      })
      const csv = res?.data || ''
      if (!String(csv).trim()) {
        setInvitesError('Export returned no CSV data.')
        return
      }
      downloadCsv('referral-invites.csv', csv)
    } catch (err) {
      setInvitesError(formatApiErrorMessage(err) || 'Failed to export invites.')
    }
  }

  async function toggleBlockInviter(row) {
    setInvitesError('')
    try {
      if (row.inviterBlocked) {
        await adminService.unblockAdminReferralInviter(row.inviterId)
      } else {
        const reason = window.prompt('Block reason (optional):', '') || undefined
        await adminService.blockAdminReferralInviter(row.inviterId, { reason })
      }
      await loadInvites()
    } catch (err) {
      setInvitesError(formatApiErrorMessage(err) || 'Failed to update inviter block.')
    }
  }

  const canEditValues = Boolean(data?.canEditReferralValues) && canEditValuesUi
  const totalPages = Math.max(1, Math.ceil(invitesTotal / limit))

  return (
    <div className="px-5 py-4 pb-8 max-[700px]:px-3">
      <div className="mb-3.5">
        <h2 className="text-[20px] font-bold tracking-[-0.02em] text-[#17231c]">Referral</h2>
        <p className="mt-0.5 text-[12.5px] text-[#7c8780]">
          Programme controls, invite list, block inviter, and export.
        </p>
      </div>

      <MarketingViewTabs active="referral" />

      <div className="mt-4 flex flex-col gap-4">
        {error ? <Banner tone="error">{error}</Banner> : null}
        {success ? <Banner tone="success">{success}</Banner> : null}

        {loading ? (
          <Card>
            <p className="text-[13px] text-[#7c8780]">Loading referral settings…</p>
          </Card>
        ) : (
          <>
            <Card
              title="Programme & spend rules"
              subtitle="Marketers with MARKETING.EDIT can change these. Drives invite create, match, checkout, and jobs."
              actions={
                <button
                  type="button"
                  disabled={saving}
                  onClick={() =>
                    withSave(async () => {
                      const minOrder = Number(minOrderAmount)
                      const coverage = Number(coverageCapPercent)
                      const day = Number(invitesPerDay)
                      const month = Number(invitesPerMonth)
                      const creditDays = Number(creditValidityDays)
                      const inviteDays = Number(inviteExpiryDays)
                      if (
                        ![minOrder, coverage, day, month, creditDays, inviteDays].every(
                          (n) => Number.isFinite(n),
                        )
                      ) {
                        throw new Error('Enter valid numbers for all policy fields.')
                      }
                      await adminService.updateAdminReferralSettings({
                        programmeEnabled,
                        creditValidityDays: Math.trunc(creditDays),
                        inviteExpiryDays: Math.trunc(inviteDays),
                        minOrderAmount: minOrder,
                        coverageCapPercent: Math.trunc(coverage),
                        coverageCapEnabled,
                        invitesPerDay: Math.trunc(day),
                        invitesPerMonth: Math.trunc(month),
                      })
                    }, 'Programme settings saved.')
                  }
                  className="h-9 rounded-[8px] bg-[#1aa054] px-3.5 text-[12.5px] font-semibold text-white disabled:opacity-50"
                >
                  Save policy
                </button>
              }
            >
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <label className="inline-flex items-center gap-2 text-[13px] text-[#17231c]">
                  <input
                    type="checkbox"
                    checked={programmeEnabled}
                    disabled={saving}
                    onChange={(e) => setProgrammeEnabled(e.target.checked)}
                  />
                  Programme enabled
                </label>
                {data?.budget ? (
                  <p className="text-[12.5px] text-[#7c8780]">
                    This month spent{' '}
                    <span className="font-semibold text-[#17231c]">
                      BHD {formatBhd(data.budget.spentThisMonth)}
                    </span>
                    {data.budget.monthlyBudget != null ? (
                      <>
                        {' '}
                        / budget BHD {formatBhd(data.budget.monthlyBudget)} (remaining{' '}
                        {formatBhd(data.budget.remaining)})
                      </>
                    ) : (
                      ' · budget uncapped'
                    )}
                  </p>
                ) : null}
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Field label="Credit validity (days)">
                  <input
                    className={inputClass}
                    type="number"
                    min="1"
                    max="365"
                    value={creditValidityDays}
                    disabled={saving}
                    onChange={(e) => setCreditValidityDays(e.target.value)}
                  />
                </Field>
                <Field label="Invite expiry (days)">
                  <input
                    className={inputClass}
                    type="number"
                    min="1"
                    max="365"
                    value={inviteExpiryDays}
                    disabled={saving}
                    onChange={(e) => setInviteExpiryDays(e.target.value)}
                  />
                </Field>
                <Field label="Min order (BHD)" hint="Item value excl. fees">
                  <input
                    className={inputClass}
                    type="number"
                    min="0"
                    step="0.001"
                    value={minOrderAmount}
                    disabled={saving}
                    onChange={(e) => setMinOrderAmount(e.target.value)}
                  />
                </Field>
                <Field label="Coverage cap (%)">
                  <input
                    className={inputClass}
                    type="number"
                    min="1"
                    max="100"
                    value={coverageCapPercent}
                    disabled={saving || !coverageCapEnabled}
                    onChange={(e) => setCoverageCapPercent(e.target.value)}
                  />
                </Field>
                <Field label="Coverage cap enabled">
                  <label className="inline-flex h-[40px] items-center gap-2 text-[13px]">
                    <input
                      type="checkbox"
                      checked={coverageCapEnabled}
                      disabled={saving}
                      onChange={(e) => setCoverageCapEnabled(e.target.checked)}
                    />
                    Enforce coverage cap
                  </label>
                </Field>
                <Field label="Invites / day">
                  <input
                    className={inputClass}
                    type="number"
                    min="1"
                    value={invitesPerDay}
                    disabled={saving}
                    onChange={(e) => setInvitesPerDay(e.target.value)}
                  />
                </Field>
                <Field label="Invites / month">
                  <input
                    className={inputClass}
                    type="number"
                    min="1"
                    value={invitesPerMonth}
                    disabled={saving}
                    onChange={(e) => setInvitesPerMonth(e.target.value)}
                  />
                </Field>
              </div>
            </Card>

            <Card
              title="Reward amounts & monthly budget"
              subtitle="Super Admin only (OG §11 referral values)."
              actions={
                <button
                  type="button"
                  disabled={saving || !canEditValues}
                  onClick={() =>
                    withSave(async () => {
                      const inviter = Number(inviterReward)
                      const invitee = Number(inviteeReward)
                      const budget = emptyToNullNumber(monthlyBudget)
                      if (!Number.isFinite(inviter) || !Number.isFinite(invitee)) {
                        throw new Error('Enter valid reward amounts.')
                      }
                      if (Number.isNaN(budget)) {
                        throw new Error('Monthly budget must be empty or a valid BHD amount.')
                      }
                      await adminService.updateAdminReferralValues({
                        inviterRewardAmount: inviter,
                        inviteeRewardAmount: invitee,
                        monthlyBudget: budget,
                      })
                    }, 'Rewards & budget saved.')
                  }
                  className="h-9 rounded-[8px] bg-[#1aa054] px-3.5 text-[12.5px] font-semibold text-white disabled:opacity-50"
                >
                  Save rewards
                </button>
              }
            >
              <div className="grid gap-3 sm:grid-cols-3">
                <Field
                  label="Inviter reward (BHD)"
                  hint={
                    canEditValues
                      ? 'Credited on OTP-verified registration'
                      : 'Locked — only Super Admin can change referral values.'
                  }
                >
                  <input
                    className={inputClass}
                    type="number"
                    min="0"
                    step="0.001"
                    value={inviterReward}
                    disabled={!canEditValues || saving}
                    onChange={(e) => setInviterReward(e.target.value)}
                  />
                </Field>
                <Field label="Invitee reward (BHD)">
                  <input
                    className={inputClass}
                    type="number"
                    min="0"
                    step="0.001"
                    value={inviteeReward}
                    disabled={!canEditValues || saving}
                    onChange={(e) => setInviteeReward(e.target.value)}
                  />
                </Field>
                <Field label="Monthly budget (BHD)" hint="Leave empty for uncapped">
                  <input
                    className={inputClass}
                    type="number"
                    min="0"
                    step="0.001"
                    value={monthlyBudget}
                    disabled={!canEditValues || saving}
                    onChange={(e) => setMonthlyBudget(e.target.value)}
                    placeholder="None"
                  />
                </Field>
              </div>
            </Card>
          </>
        )}

        <Card
          title="Invites"
          subtitle="Search by phone / hash, filter by status, block inviter, export CSV."
          actions={
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={invitesLoading}
                onClick={() => {
                  setPage(1)
                  loadInvites()
                }}
                className="h-9 rounded-[8px] border border-[#d7ddd9] bg-white px-3.5 text-[12.5px] font-semibold text-[#17231c] disabled:opacity-50"
              >
                Refresh
              </button>
              <button
                type="button"
                disabled={invitesLoading}
                onClick={exportInvites}
                className="h-9 rounded-[8px] bg-[#1aa054] px-3.5 text-[12.5px] font-semibold text-white disabled:opacity-50"
              >
                Export CSV
              </button>
            </div>
          }
        >
          <div className="mb-3 grid gap-3 sm:grid-cols-[1fr_180px]">
            <Field label="Search">
              <input
                className={inputClass}
                value={searchQ}
                placeholder="Phone E.164, hash, or inviter digits…"
                onChange={(e) => setSearchQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setPage(1)
                    loadInvites()
                  }
                }}
              />
            </Field>
            <Field label="Status">
              <Select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  setPage(1)
                }}
              >
                <option value="ALL">All</option>
                <option value="INVITED">Invited</option>
                <option value="REWARDED">Rewarded</option>
                <option value="EXPIRED">Expired</option>
                <option value="REJECTED">Rejected</option>
              </Select>
            </Field>
          </div>

          {invitesError ? <Banner tone="error">{invitesError}</Banner> : null}

          <div className="mt-3 overflow-x-auto rounded-[10px] border border-[#eceeec]">
            <table className="min-w-full text-left text-[12.5px]">
              <thead className="bg-[#f7f8f7] text-[#7c8780]">
                <tr>
                  <th className="px-3 py-2 font-semibold">Created</th>
                  <th className="px-3 py-2 font-semibold">Inviter</th>
                  <th className="px-3 py-2 font-semibold">Invitee hash</th>
                  <th className="px-3 py-2 font-semibold">Status</th>
                  <th className="px-3 py-2 font-semibold">Reason</th>
                  <th className="px-3 py-2 font-semibold">Expires</th>
                  <th className="px-3 py-2 font-semibold" />
                </tr>
              </thead>
              <tbody>
                {invitesLoading ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-4 text-[#7c8780]">
                      Loading invites…
                    </td>
                  </tr>
                ) : invites.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-4 text-[#7c8780]">
                      No invites found.
                    </td>
                  </tr>
                ) : (
                  invites.map((row) => (
                    <tr key={row.id} className="border-t border-[#eceeec]">
                      <td className="px-3 py-2 text-[#17231c]">
                        {row.createdAt ? new Date(row.createdAt).toLocaleString() : '—'}
                      </td>
                      <td className="px-3 py-2">
                        <div className="text-[#17231c]">{row.inviterPhoneMasked || row.inviterId}</div>
                        {row.inviterBlocked ? (
                          <div className="text-[11px] text-[#9b2c2c]">Blocked</div>
                        ) : null}
                      </td>
                      <td className="px-3 py-2 font-mono text-[11.5px] text-[#455249]">
                        {row.phoneHashMasked || row.phoneHash}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={cn(
                            'inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold',
                            statusTone(row.status),
                          )}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="max-w-[180px] truncate px-3 py-2 text-[#7c8780]">
                        {row.reason || '—'}
                      </td>
                      <td className="px-3 py-2 text-[#7c8780]">
                        {row.expiresAt ? new Date(row.expiresAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          type="button"
                          className="text-[12px] font-semibold text-[#1aa054] hover:underline"
                          onClick={() => toggleBlockInviter(row)}
                        >
                          {row.inviterBlocked ? 'Unblock' : 'Block inviter'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[12.5px] text-[#7c8780]">
            <span>
              {invitesTotal} invite{invitesTotal === 1 ? '' : 's'} · page {page} / {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1 || invitesLoading}
                className="h-8 rounded-[8px] border border-[#d7ddd9] px-3 font-semibold disabled:opacity-40"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </button>
              <button
                type="button"
                disabled={page >= totalPages || invitesLoading}
                className="h-8 rounded-[8px] border border-[#d7ddd9] px-3 font-semibold disabled:opacity-40"
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
