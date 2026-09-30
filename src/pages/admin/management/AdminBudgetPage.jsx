import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { adminService } from '../../../services/adminService'
import { MarketingViewTabs } from '../../../components/admin/MarketingViewTabs'
import { cn } from '../../../components/admin/cn'

function formatBhd(val) {
  if (val === null || val === undefined || val === '') return '—'
  const num = Number(val)
  if (Number.isNaN(num)) return '—'
  return `${num.toFixed(3)} BHD`
}

function checkIsFounderOrSuperAdmin(user) {
  const r = (user?.backendRole || user?.roleBadge || user?.role || '').trim().toUpperCase().replace(/\s+/g, '_')
  return r === 'FOUNDER' || r === 'SUPER_ADMIN' || r === 'SUPERADMIN'
}

export default function AdminBudgetPage() {
  const { user } = useAuth()
  const canEdit = checkIsFounderOrSuperAdmin(user)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [data, setData] = useState(null)

  // Caps & threshold state
  const [boostsCap, setBoostsCap] = useState('')
  const [referralCap, setReferralCap] = useState('')
  const [vouchersCap, setVouchersCap] = useState('')
  const [campaignsCap, setCampaignsCap] = useState('')
  const [campaignApprovalThreshold, setCampaignApprovalThreshold] = useState('')

  // Pending campaigns
  const [campaignsLoading, setCampaignsLoading] = useState(false)
  const [pendingCampaigns, setPendingCampaigns] = useState([])
  const [actionCampaignId, setActionCampaignId] = useState(null)
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [actionError, setActionError] = useState('')
  const [actionSuccess, setActionSuccess] = useState('')

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await adminService.getAdminBudgetSettings()
      const d = res?.data
      setData(d)
      if (d?.caps) {
        setBoostsCap(d.caps.boostsCap != null ? String(d.caps.boostsCap) : '')
        setReferralCap(d.caps.referralCap != null ? String(d.caps.referralCap) : '')
        setVouchersCap(d.caps.vouchersCap != null ? String(d.caps.vouchersCap) : '')
        setCampaignsCap(d.caps.campaignsCap != null ? String(d.caps.campaignsCap) : '')
      }
      setCampaignApprovalThreshold(
        d?.campaignApprovalThreshold != null ? String(d.campaignApprovalThreshold) : '',
      )
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load budget settings.')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadPendingCampaigns = useCallback(async () => {
    setCampaignsLoading(true)
    try {
      const res = await adminService.listAdminCampaigns({ limit: 100 })
      const list = Array.isArray(res?.data?.campaigns) ? res.data.campaigns : []
      setPendingCampaigns(list.filter((c) => c.status === 'PENDING_APPROVAL'))
    } catch {
      // ignore secondary failure
    } finally {
      setCampaignsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
    loadPendingCampaigns()
  }, [loadData, loadPendingCampaigns])

  async function handleSaveSettings(e) {
    e.preventDefault()
    if (!canEdit) return
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const parseVal = (v) => (v.trim() === '' ? null : Number(v))
      const payload = {
        boostsCap: parseVal(boostsCap),
        referralCap: parseVal(referralCap),
        vouchersCap: parseVal(vouchersCap),
        campaignsCap: parseVal(campaignsCap),
        campaignApprovalThreshold: parseVal(campaignApprovalThreshold),
      }

      const res = await adminService.updateAdminBudgetSettings(payload)
      setData(res?.data)
      setSuccess('Budget caps and campaign approval threshold saved successfully.')
      await loadData()
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to save budget settings.')
    } finally {
      setSaving(false)
    }
  }

  async function handleApproveCampaign(campaignId) {
    if (!canEdit) return
    setActionCampaignId(campaignId)
    setActionError('')
    setActionSuccess('')
    try {
      await adminService.approveAdminCampaign(campaignId)
      setActionSuccess('Campaign approved and activated successfully.')
      await Promise.all([loadPendingCampaigns(), loadData()])
    } catch (err) {
      setActionError(err?.response?.data?.message || err?.message || 'Failed to approve campaign.')
    } finally {
      setActionCampaignId(null)
    }
  }

  function openRejectModal(campaignId) {
    setActionCampaignId(campaignId)
    setRejectReason('')
    setActionError('')
    setActionSuccess('')
    setRejectModalOpen(true)
  }

  async function handleConfirmReject() {
    if (!actionCampaignId) return
    setSaving(true)
    setActionError('')
    try {
      await adminService.rejectAdminCampaign(actionCampaignId, { reason: rejectReason.trim() || undefined })
      setActionSuccess('Campaign rejected and returned to draft.')
      setRejectModalOpen(false)
      setActionCampaignId(null)
      await Promise.all([loadPendingCampaigns(), loadData()])
    } catch (err) {
      setActionError(err?.response?.data?.message || err?.message || 'Failed to reject campaign.')
    } finally {
      setSaving(false)
    }
  }

  const sections = [
    {
      id: 'boosts',
      name: 'Boosts',
      subtitle: 'Extra cashback above base 3%',
      cap: data?.caps?.boostsCap,
      spend: data?.currentSpend?.boosts ?? 0,
      utilization: data?.utilization?.boostsPct,
      paused: Boolean(data?.pauseState?.boostsPaused),
      rule: 'Base 3% cashback continues uncapped. Boost multiplier is paused when 100% cap is hit.',
    },
    {
      id: 'referral',
      name: 'Referrals',
      subtitle: 'Customer referral rewards',
      cap: data?.caps?.referralCap,
      spend: data?.currentSpend?.referral ?? 0,
      utilization: data?.utilization?.referralPct,
      paused: Boolean(data?.pauseState?.referralPaused),
      rule: 'Referral reward earn is paused when 100% cap is reached this Bahrain calendar month.',
    },
    {
      id: 'vouchers',
      name: 'Vouchers',
      subtitle: 'Granted voucher liabilities',
      cap: data?.caps?.vouchersCap,
      spend: data?.currentSpend?.vouchers ?? 0,
      utilization: data?.utilization?.vouchersPct,
      paused: Boolean(data?.pauseState?.vouchersPaused),
      rule: 'Issuance of new vouchers is paused. Existing vouchers remain valid until expiry.',
    },
    {
      id: 'campaigns',
      name: 'Campaigns',
      subtitle: 'Activated campaign projected spend',
      cap: data?.caps?.campaignsCap,
      spend: data?.currentSpend?.campaigns ?? 0,
      utilization: data?.utilization?.campaignsPct,
      paused: Boolean(data?.pauseState?.campaignsPaused),
      rule: 'Activating new marketing campaigns is paused. Live campaigns continue running.',
    },
  ]

  return (
    <div className="mx-auto max-w-[1240px] px-4 py-5">
      <div className="mb-3">
        <h1 className="text-[20px] font-bold text-[#17231c]">Budget & Approval</h1>
        <p className="mt-1 text-[13px] text-[#7c8780]">
          OG §11: Monthly section caps (Asia/Bahrain calendar month), automated alerts at 80% & 100%, and Founder approval gate for campaigns.
        </p>
      </div>

      <MarketingViewTabs active="budget" />

      {error ? (
        <div className="mb-4 rounded-[10px] border border-[#f3d0d0] bg-[#fff6f6] px-4 py-3 text-[13px] text-[#9b2c2c]">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="mb-4 rounded-[10px] border border-[#cfe8d7] bg-[#f3fbf6] px-4 py-3 text-[13px] text-[#1a6b3c]">
          {success}
        </div>
      ) : null}

      {!canEdit ? (
        <div className="mb-4 rounded-[10px] border border-[#fef3c7] bg-[#fffbeb] p-3 text-[12.5px] text-[#92400e]">
          <span className="font-bold">Read-only view:</span> Only Founder and Super Admin roles can update monthly budget caps or approve/reject high-budget campaigns. Marketers have view-only access.
        </div>
      ) : null}

      {/* Bahrain Month Banner */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-[12px] border border-[#e4e8e4] bg-[#f9faf9] px-4 py-3 text-[13px]">
        <div>
          <span className="font-bold text-[#17231c]">Bahrain Calendar Month:</span>{' '}
          <span className="text-[#455249]">{data?.bahrainMonthWindow?.label ?? 'Asia/Bahrain (UTC+3)'}</span>
          <span className="ml-2 text-[11.5px] text-[#7c8780]">
            (Resets 00:00 AST on the 1st of every month)
          </span>
        </div>
        <div className="text-[12px] text-[#7c8780]">
          Threshold Alerts: <span className="font-semibold text-[#1aa054]">80% Warning</span> &bull;{' '}
          <span className="font-semibold text-[#9b2c2c]">100% Section Pause</span>
        </div>
      </div>

      {/* Section Caps Cards Grid */}
      <h2 className="mb-3 text-[16px] font-bold text-[#17231c]">Section Caps & Current Spend</h2>
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {sections.map((sec) => {
          const isPaused = sec.paused
          const pct = sec.utilization != null ? Math.min(sec.utilization, 100) : 0
          const isAlert = sec.utilization != null && sec.utilization >= 80 && !isPaused

          return (
            <div
              key={sec.id}
              className={cn(
                'flex flex-col justify-between rounded-[14px] border p-4 shadow-[0_1px_2px_rgba(20,40,28,.04)] transition',
                isPaused
                  ? 'border-[#f3d0d0] bg-[#fffbfb]'
                  : isAlert
                    ? 'border-[#fed7aa] bg-[#fffdf9]'
                    : 'border-[#eceeec] bg-white',
              )}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-[14.5px] font-bold text-[#17231c]">{sec.name}</h3>
                    <p className="text-[11.5px] text-[#7c8780]">{sec.subtitle}</p>
                  </div>
                  {isPaused ? (
                    <span className="rounded-full bg-[#fde8e8] px-2.5 py-0.5 text-[11px] font-bold uppercase text-[#9b2c2c]">
                      PAUSED
                    </span>
                  ) : isAlert ? (
                    <span className="rounded-full bg-[#ffedd5] px-2.5 py-0.5 text-[11px] font-bold uppercase text-[#c2410c]">
                      80% ALERT
                    </span>
                  ) : (
                    <span className="rounded-full bg-[#e8f7ed] px-2.5 py-0.5 text-[11px] font-bold uppercase text-[#147940]">
                      ACTIVE
                    </span>
                  )}
                </div>

                <div className="my-4 space-y-1">
                  <div className="flex items-baseline justify-between text-[13px]">
                    <span className="text-[#7c8780]">Spend:</span>
                    <span className="font-bold text-[#17231c]">{formatBhd(sec.spend)}</span>
                  </div>
                  <div className="flex items-baseline justify-between text-[13px]">
                    <span className="text-[#7c8780]">Monthly Cap:</span>
                    <span className="font-semibold text-[#455249]">
                      {sec.cap != null ? formatBhd(sec.cap) : 'Uncapped'}
                    </span>
                  </div>
                  {sec.cap != null ? (
                    <div className="flex items-baseline justify-between text-[12px]">
                      <span className="text-[#7c8780]">Utilization:</span>
                      <span
                        className={cn(
                          'font-bold',
                          isPaused ? 'text-[#9b2c2c]' : isAlert ? 'text-[#c2410c]' : 'text-[#1aa054]',
                        )}
                      >
                        {sec.utilization?.toFixed(1)}%
                      </span>
                    </div>
                  ) : null}
                </div>

                {sec.cap != null ? (
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[#eceeec]">
                    <div
                      className={cn(
                        'h-full transition-all duration-300',
                        isPaused ? 'bg-[#9b2c2c]' : isAlert ? 'bg-[#f97316]' : 'bg-[#1aa054]',
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                ) : (
                  <div className="h-2 w-full rounded-full bg-[#eceeec]" />
                )}
              </div>

              <p className="mt-4 text-[11px] leading-relaxed text-[#7c8780]">{sec.rule}</p>
            </div>
          )
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        {/* Pending Campaign Approvals Queue */}
        <section className="rounded-[14px] border border-[#eceeec] bg-white p-5 shadow-[0_1px_2px_rgba(20,40,28,.03)]">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-[15px] font-bold text-[#17231c]">
                Pending Founder Campaign Approvals ({pendingCampaigns.length})
              </h2>
              <p className="text-[12px] text-[#7c8780]">
                Campaigns whose projected cost exceeds{' '}
                <span className="font-bold text-[#17231c]">
                  {data?.campaignApprovalThreshold != null
                    ? formatBhd(data.campaignApprovalThreshold)
                    : 'the approval threshold'}
                </span>{' '}
                require Founder or Super Admin approval before going live.
              </p>
            </div>
          </div>

          {actionError ? (
            <div className="mb-3 rounded-[8px] bg-[#fff6f6] p-2.5 text-[12.5px] text-[#9b2c2c]">
              {actionError}
            </div>
          ) : null}
          {actionSuccess ? (
            <div className="mb-3 rounded-[8px] bg-[#f3fbf6] p-2.5 text-[12.5px] text-[#1a6b3c]">
              {actionSuccess}
            </div>
          ) : null}

          {campaignsLoading ? (
            <p className="py-6 text-center text-[13px] text-[#7c8780]">Loading pending campaigns…</p>
          ) : pendingCampaigns.length === 0 ? (
            <div className="rounded-[10px] border border-dashed border-[#d7ddd8] py-8 text-center">
              <p className="text-[13px] font-semibold text-[#455249]">No campaigns pending approval</p>
              <p className="mt-1 text-[11.5px] text-[#7c8780]">
                When a campaign projected cost exceeds the threshold, it will appear here for review.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[12.5px]">
                <thead>
                  <tr className="border-b border-[#eceeec] text-[#7c8780]">
                    <th className="pb-2 font-semibold">Campaign</th>
                    <th className="pb-2 font-semibold">Type</th>
                    <th className="pb-2 font-semibold">Projected Cost</th>
                    <th className="pb-2 font-semibold">Dates</th>
                    <th className="pb-2 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f4f6f4]">
                  {pendingCampaigns.map((c) => (
                    <tr key={c.id}>
                      <td className="py-3">
                        <span className="font-bold text-[#17231c]">{c.name}</span>
                        <div className="text-[11px] text-[#7c8780]">{c.id}</div>
                      </td>
                      <td className="py-3 text-[#455249]">{c.type}</td>
                      <td className="py-3 font-bold text-[#17231c]">
                        {formatBhd(c.projectedCost ?? c.projection?.projectedCost)}
                      </td>
                      <td className="py-3 text-[11.5px] text-[#7c8780]">
                        {c.startDate ? new Date(c.startDate).toLocaleDateString() : '—'} &rarr;{' '}
                        {c.endDate ? new Date(c.endDate).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3 text-right">
                        {canEdit ? (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleApproveCampaign(c.id)}
                              disabled={actionCampaignId === c.id}
                              className="rounded-full bg-[#1aa054] px-3 py-1 text-[12px] font-bold text-white hover:bg-[#147940] disabled:opacity-50"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => openRejectModal(c.id)}
                              disabled={actionCampaignId === c.id}
                              className="rounded-full border border-[#f3d0d0] bg-white px-3 py-1 text-[12px] font-bold text-[#9b2c2c] hover:bg-[#fff6f6] disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-[#7c8780]">Pending Founder</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Update Caps & Thresholds Settings Form */}
        <section className="rounded-[14px] border border-[#eceeec] bg-white p-5 shadow-[0_1px_2px_rgba(20,40,28,.03)]">
          <h2 className="text-[15px] font-bold text-[#17231c]">Budget Caps & Approval Settings</h2>
          <p className="mt-1 text-[12px] text-[#7c8780]">
            Leave empty for uncapped. All monetary values are in Bahraini Dinar (BHD, 3 decimals).
          </p>

          <form onSubmit={handleSaveSettings} className="mt-4 space-y-4">
            <div>
              <label className="block text-[12.5px] font-semibold text-[#17231c]">
                Boosts Monthly Cap (BHD)
              </label>
              <input
                type="number"
                step="0.001"
                min="0"
                value={boostsCap}
                onChange={(e) => setBoostsCap(e.target.value)}
                disabled={!canEdit || saving}
                placeholder="Uncapped"
                className="mt-1 h-[36px] w-full rounded-[8px] border border-[#d7ddd8] px-3 text-[13px] disabled:bg-[#f4f6f4]"
              />
              <span className="text-[11px] text-[#7c8780]">Extra cashback spend above base 3%.</span>
            </div>

            <div>
              <label className="block text-[12.5px] font-semibold text-[#17231c]">
                Referral Monthly Cap (BHD)
              </label>
              <input
                type="number"
                step="0.001"
                min="0"
                value={referralCap}
                onChange={(e) => setReferralCap(e.target.value)}
                disabled={!canEdit || saving}
                placeholder="Uncapped"
                className="mt-1 h-[36px] w-full rounded-[8px] border border-[#d7ddd8] px-3 text-[13px] disabled:bg-[#f4f6f4]"
              />
              <span className="text-[11px] text-[#7c8780]">Total referral reward credits issued.</span>
            </div>

            <div>
              <label className="block text-[12.5px] font-semibold text-[#17231c]">
                Vouchers Monthly Cap (BHD)
              </label>
              <input
                type="number"
                step="0.001"
                min="0"
                value={vouchersCap}
                onChange={(e) => setVouchersCap(e.target.value)}
                disabled={!canEdit || saving}
                placeholder="Uncapped"
                className="mt-1 h-[36px] w-full rounded-[8px] border border-[#d7ddd8] px-3 text-[13px] disabled:bg-[#f4f6f4]"
              />
              <span className="text-[11px] text-[#7c8780]">Platform voucher liability granted.</span>
            </div>

            <div>
              <label className="block text-[12.5px] font-semibold text-[#17231c]">
                Campaigns Monthly Cap (BHD)
              </label>
              <input
                type="number"
                step="0.001"
                min="0"
                value={campaignsCap}
                onChange={(e) => setCampaignsCap(e.target.value)}
                disabled={!canEdit || saving}
                placeholder="Uncapped"
                className="mt-1 h-[36px] w-full rounded-[8px] border border-[#d7ddd8] px-3 text-[13px] disabled:bg-[#f4f6f4]"
              />
              <span className="text-[11px] text-[#7c8780]">Total projected cost of activated campaigns.</span>
            </div>

            <hr className="border-[#eceeec]" />

            <div>
              <label className="block text-[12.5px] font-semibold text-[#17231c]">
                Campaign Founder Approval Threshold (BHD)
              </label>
              <input
                type="number"
                step="0.001"
                min="0"
                value={campaignApprovalThreshold}
                onChange={(e) => setCampaignApprovalThreshold(e.target.value)}
                disabled={!canEdit || saving}
                placeholder="Uncapped (direct activate)"
                className="mt-1 h-[36px] w-full rounded-[8px] border border-[#d7ddd8] px-3 text-[13px] disabled:bg-[#f4f6f4]"
              />
              <span className="text-[11px] text-[#7c8780]">
                If projected cost exceeds this, activation enters PENDING_APPROVAL.
              </span>
            </div>

            {canEdit ? (
              <button
                type="submit"
                disabled={saving || loading}
                className="h-[38px] w-full rounded-full bg-[#17231c] text-[13px] font-bold text-white transition hover:bg-[#25382d] disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save Budget Settings'}
              </button>
            ) : null}
          </form>
        </section>
      </div>

      {/* Reject Modal */}
      {rejectModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-[14px] bg-white p-6 shadow-xl">
            <h3 className="text-[16px] font-bold text-[#17231c]">Reject Campaign</h3>
            <p className="mt-1 text-[12.5px] text-[#7c8780]">
              The campaign will be returned to DRAFT so the marketer can revise inputs.
            </p>
            <div className="mt-4">
              <label className="block text-[12.5px] font-semibold text-[#17231c]">
                Rejection Reason (Optional)
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Budget exceeds quarterly targets or targeting segment too broad"
                rows={3}
                className="mt-1 w-full rounded-[8px] border border-[#d7ddd8] p-2.5 text-[13px] focus:outline-none focus:ring-1 focus:ring-[#1aa054]"
              />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectModalOpen(false)}
                className="rounded-full px-4 py-2 text-[12.5px] font-bold text-[#455249] hover:bg-[#f4f6f4]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={saving}
                className="rounded-full bg-[#9b2c2c] px-4 py-2 text-[12.5px] font-bold text-white hover:bg-[#822424] disabled:opacity-50"
              >
                {saving ? 'Rejecting…' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
