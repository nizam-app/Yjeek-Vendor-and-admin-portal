import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatApiErrorMessage } from '../../../api/errors'
import { adminService } from '../../../services/adminService'
import { MarketingViewTabs } from '../../../components/admin/MarketingViewTabs'
import { cn } from '../../../components/admin/cn'

const QUEUE_TABS = [
  { id: 'PENDING_REVIEW', label: 'Pending review' },
  { id: 'APPROVED', label: 'Approved' },
  { id: 'REJECTED', label: 'Rejected' },
  { id: 'LIVE', label: 'Live' },
  { id: 'ENDED', label: 'Ended' },
  { id: 'CANCELLED', label: 'Cancelled' },
]

const inputClass =
  'box-border h-[40px] w-full rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white px-3 text-[13px] text-[#17231c] outline-none transition placeholder:text-[#9aa49d] focus:border-[#1aa054]'

function formatWhen(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
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

function voucherConflictsOf(promo) {
  return Array.isArray(promo?.voucherConflicts) ? promo.voucherConflicts : []
}

/**
 * OG Admin › Marketing › Vendor Promotions — approval queue + guardrails.
 */
export default function AdminVendorPromotionsPage() {
  const [status, setStatus] = useState('PENDING_REVIEW')
  const [page, setPage] = useState(1)
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [queue, setQueue] = useState(null)
  const [report, setReport] = useState(null)
  const [reportError, setReportError] = useState('')
  const [settings, setSettings] = useState(null)
  const [settingsForm, setSettingsForm] = useState({
    maxDiscountPercent: '70',
    minNoticeHours: '2',
    maxConcurrentPerVendor: '5',
    listingBoostEnabled: false,
  })
  const [savingSettings, setSavingSettings] = useState(false)
  const [actingId, setActingId] = useState('')
  const [rejectingId, setRejectingId] = useState('')
  const [rejectReason, setRejectReason] = useState('')
  const [confirmingId, setConfirmingId] = useState('')

  const loadQueue = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await adminService.listAdminVendorPromotions({
        status,
        page,
        limit: 25,
        ...(search ? { q: search } : {}),
      })
      setQueue(response?.data ?? null)
    } catch (err) {
      setError(formatApiErrorMessage(err, 'Could not load vendor promotions.'))
      setQueue(null)
    } finally {
      setLoading(false)
    }
  }, [page, search, status])

  const loadReport = useCallback(async () => {
    setReportError('')
    try {
      const response = await adminService.getAdminVendorPromotionReport()
      setReport(response?.data ?? null)
    } catch (err) {
      setReport(null)
      setReportError(formatApiErrorMessage(err, 'Could not load the promotions report.'))
    }
  }, [])

  const loadSettings = useCallback(async () => {
    try {
      const response = await adminService.getAdminVendorPromotionSettings()
      const next = response?.data?.settings
      if (!next) return
      setSettings(next)
      setSettingsForm({
        maxDiscountPercent: String(next.maxDiscountPercent ?? 70),
        minNoticeHours: String(next.minNoticeHours ?? 2),
        maxConcurrentPerVendor: String(next.maxConcurrentPerVendor ?? 5),
        listingBoostEnabled: next.listingBoostEnabled === true,
      })
    } catch (err) {
      setError(formatApiErrorMessage(err, 'Could not load guardrail settings.'))
    }
  }, [])

  useEffect(() => {
    void loadReport()
    void loadSettings()
  }, [loadReport, loadSettings])

  useEffect(() => {
    void loadQueue()
  }, [loadQueue])

  async function saveSettings(event) {
    event.preventDefault()
    setSavingSettings(true)
    setError('')
    setNotice('')
    const maxDiscountPercent = Number(settingsForm.maxDiscountPercent)
    const minNoticeHours = Number(settingsForm.minNoticeHours)
    const maxConcurrentPerVendor = Number(settingsForm.maxConcurrentPerVendor)
    if (
      !Number.isInteger(maxDiscountPercent) ||
      !Number.isInteger(minNoticeHours) ||
      !Number.isInteger(maxConcurrentPerVendor)
    ) {
      setError('Guardrails must be whole numbers.')
      setSavingSettings(false)
      return
    }
    try {
      const response = await adminService.updateAdminVendorPromotionSettings({
        maxDiscountPercent,
        minNoticeHours,
        maxConcurrentPerVendor,
        listingBoostEnabled: settingsForm.listingBoostEnabled === true,
      })
      const next = response?.data?.settings
      if (next) {
        setSettings(next)
        setSettingsForm((current) => ({
          ...current,
          listingBoostEnabled: next.listingBoostEnabled === true,
        }))
      }
      setNotice(
        next?.listingBoostEnabled
          ? 'Settings saved. Stores with a live promotion are listed first in the default directory.'
          : 'Settings saved. Listing boost is off, so the default directory order is unchanged.',
      )
    } catch (err) {
      setError(formatApiErrorMessage(err, 'Could not save guardrails.'))
    } finally {
      setSavingSettings(false)
    }
  }

  async function approve(promotionId) {
    setActingId(promotionId)
    setError('')
    setNotice('')
    try {
      const response = await adminService.approveAdminVendorPromotion(promotionId)
      const nextStatus = response?.data?.promotion?.workflowStatus
      setNotice(
        nextStatus === 'LIVE'
          ? 'Approved. The promotion is live now.'
          : 'Approved. The promotion goes live at its start time.',
      )
      setRejectingId('')
      setConfirmingId('')
      await Promise.all([loadQueue(), loadReport()])
    } catch (err) {
      setError(formatApiErrorMessage(err, 'Could not approve this promotion.'))
    } finally {
      setActingId('')
    }
  }

  async function reject(promotionId) {
    const reason = rejectReason.trim()
    if (!reason) {
      setError('A rejection reason is required.')
      return
    }
    setActingId(promotionId)
    setError('')
    setNotice('')
    try {
      await adminService.rejectAdminVendorPromotion(promotionId, { reason })
      setNotice('Rejected. The vendor can see this reason on the promotion.')
      setRejectingId('')
      setRejectReason('')
      await Promise.all([loadQueue(), loadReport()])
    } catch (err) {
      setError(formatApiErrorMessage(err, 'Could not reject this promotion.'))
    } finally {
      setActingId('')
    }
  }

  const promotions = Array.isArray(queue?.promotions) ? queue.promotions : []
  const counts = queue?.counts || {}
  const total = Number(queue?.total || 0)
  const limit = Number(queue?.limit || 25)
  const pageCount = Math.max(1, Math.ceil(total / limit))

  return (
    <div className="px-5 py-4 pb-8 max-[700px]:px-3">
      <div className="mb-3.5">
        <h2 className="text-[20px] font-bold tracking-[-0.02em] text-[#17231c]">
          Vendor promotions
        </h2>
        <p className="mt-0.5 max-w-[640px] text-[12.5px] text-[#7c8780]">
        Approve or reject vendor-funded offers. Approved promotions go live at the start time
        and end at the end time. If the same item has an active admin-funded voucher, a warning
        is shown before you confirm. Approval is not blocked. Approve and reject need Marketing
        Approve permission.
        </p>
      </div>
      <MarketingViewTabs active="vendor-promotions" />

      <div className="mb-4 space-y-3">
        {error ? <Banner tone="error">{error}</Banner> : null}
        {notice ? <Banner>{notice}</Banner> : null}
      </div>

      <section className="mb-4 rounded-[14px] border border-[#eceeec] bg-white p-5 shadow-[0_1px_2px_rgba(20,40,28,.03)]">
        <h3 className="text-[15px] font-bold text-[#17231c]">Report</h3>
        {reportError ? <p className="mt-2 text-[12.5px] text-[#9b2c2c]">{reportError}</p> : null}
        <p className="mt-1 text-[12.5px] text-[#7c8780]">
          Active means a promotion customers can use now. Items and categories are the selected
          targets. A full-store promotion counts the store only. Orders count when that customer
          opened Offers before placing the order. Cancelled and rejected orders are left out.
        </p>
        <dl className="mt-4 grid gap-3 sm:grid-cols-5">
          {[
            ['Active promotions', report?.activePromotions],
            ['Items covered', report?.itemsCovered],
            ['Categories covered', report?.categoriesCovered],
            ['Stores covered', report?.storesCovered],
            ['Orders from Offers', report?.offersAttributedOrders],
          ].map(([label, value]) => (
            <div key={label} className="rounded-[10px] border border-[#eceeec] bg-[#f7faf8] px-3 py-2.5">
              <dt className="text-[11.5px] font-medium text-[#7c8780]">{label}</dt>
              <dd className="mt-1 text-[18px] font-bold tracking-[-0.02em] text-[#17231c]">
                {Number.isFinite(Number(value)) ? Number(value).toLocaleString() : '—'}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mb-4 rounded-[14px] border border-[#eceeec] bg-white p-5 shadow-[0_1px_2px_rgba(20,40,28,.03)]">
        <h3 className="text-[15px] font-bold text-[#17231c]">Guardrails and listing boost</h3>
        <p className="mt-1 text-[12.5px] text-[#7c8780]">
          Admin-set ceiling. Violations are blocked on vendor submit and on approve. Paused
          approved or live promotions still count toward the concurrent cap. Listing boost is
          off until you turn it on. It only changes the default directory (A–Z).
        </p>
        <form onSubmit={saveSettings} className="mt-4 space-y-3">
          <label className="inline-flex items-center gap-2 text-[13px] text-[#17231c]">
            <input
              type="checkbox"
              checked={settingsForm.listingBoostEnabled}
              onChange={(event) =>
                setSettingsForm((current) => ({
                  ...current,
                  listingBoostEnabled: event.target.checked,
                }))
              }
            />
            Boost stores with a live promotion in the default directory
          </label>
          <div className="grid gap-3 sm:grid-cols-4">
          <label className="block text-[12px] font-medium text-[#7c8780]">
            Max discount %
            <input
              className={cn(inputClass, 'mt-1.5')}
              inputMode="numeric"
              value={settingsForm.maxDiscountPercent}
              onChange={(event) =>
                setSettingsForm((current) => ({
                  ...current,
                  maxDiscountPercent: event.target.value,
                }))
              }
            />
          </label>
          <label className="block text-[12px] font-medium text-[#7c8780]">
            Min notice (hours)
            <input
              className={cn(inputClass, 'mt-1.5')}
              inputMode="numeric"
              value={settingsForm.minNoticeHours}
              onChange={(event) =>
                setSettingsForm((current) => ({
                  ...current,
                  minNoticeHours: event.target.value,
                }))
              }
            />
          </label>
          <label className="block text-[12px] font-medium text-[#7c8780]">
            Max concurrent / vendor
            <input
              className={cn(inputClass, 'mt-1.5')}
              inputMode="numeric"
              value={settingsForm.maxConcurrentPerVendor}
              onChange={(event) =>
                setSettingsForm((current) => ({
                  ...current,
                  maxConcurrentPerVendor: event.target.value,
                }))
              }
            />
          </label>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={savingSettings || !settings}
              className="inline-flex h-[40px] items-center rounded-full bg-[#1aa054] px-4 text-[13px] font-bold text-white hover:bg-[#158a47] disabled:opacity-60"
            >
              {savingSettings ? 'Saving…' : 'Save settings'}
            </button>
          </div>
          </div>
        </form>
      </section>

      <div className="mb-3 flex flex-wrap gap-1">
        {QUEUE_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setStatus(tab.id)
              setPage(1)
              setRejectingId('')
              setConfirmingId('')
            }}
            className={cn(
              'h-[32px] rounded-full px-3 text-[12px] font-bold',
              status === tab.id
                ? 'bg-[#17231c] text-white'
                : 'bg-white text-[#69756d] ring-1 ring-[#e4e8e4]',
            )}
          >
            {tab.label}
            {counts[tab.id] != null ? ` (${counts[tab.id]})` : ''}
          </button>
        ))}
      </div>

      <form
        className="mb-3 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault()
          setPage(1)
          setSearch(query.trim())
        }}
      >
        <input
          className={cn(inputClass, 'max-w-[320px]')}
          placeholder="Search vendor or promotion"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <button
          type="submit"
          className="inline-flex h-[40px] items-center rounded-full border border-[#e4e8e4] bg-white px-4 text-[13px] font-bold text-[#17231c]"
        >
          Search
        </button>
      </form>

      <section className="overflow-hidden rounded-[14px] border border-[#eceeec] bg-white shadow-[0_1px_2px_rgba(20,40,28,.03)]">
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[880px] border-collapse text-left">
            <thead>
              <tr className="border-b border-[#edf0ee] bg-[#fafbfa]">
                {['Vendor', 'Promotion', 'Discount', 'Scope', 'Start', 'End', 'Review', ''].map(
                  (column) => (
                    <th
                      key={column || 'actions'}
                      className="whitespace-nowrap px-4 py-3 text-[10px] font-medium uppercase tracking-[0.05em] text-[#8a948e]"
                    >
                      {column}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-[13px] text-[#7c8780]">
                    Loading promotions…
                  </td>
                </tr>
              ) : null}
              {!loading && promotions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-[13px] text-[#7c8780]">
                    No promotions in this queue.
                  </td>
                </tr>
              ) : null}
              {!loading
                ? promotions.map((promo) => (
                    <tr key={promo.id} className="border-b border-[#f0f2f0] align-top last:border-0">
                      <td className="px-4 py-3 text-[13px] font-medium text-[#17231c]">
                        <Link
                          to={`/admin/vendors/${promo.vendorId}`}
                          className="text-[#1aa054] hover:underline"
                        >
                          {promo.vendorName}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-[13px] text-[#17231c]">
                        <div className="font-bold">{promo.name}</div>
                        {promo.isPaused ? (
                          <div className="mt-1 text-[11.5px] text-[#9a6510]">Paused</div>
                        ) : null}
                        {promo.rejectionReason ? (
                          <div className="mt-1 max-w-[240px] text-[12px] text-[#9b2c2c]">
                            {promo.rejectionReason}
                          </div>
                        ) : null}
                        {voucherConflictsOf(promo).length > 0 ? (
                          <div className="mt-2 max-w-[280px] space-y-1">
                            {voucherConflictsOf(promo).map((conflict) => (
                              <div
                                key={`${promo.id}-${conflict.templateId}`}
                                className="rounded-[8px] border border-[#f3e2c0] bg-[#fff8ee] px-2 py-1.5 text-[12px] text-[#8a5a10]"
                              >
                                {conflict.message}
                                {Number(conflict.activeIssuedCount) > 0
                                  ? ` ${conflict.activeIssuedCount} active issued voucher${
                                      Number(conflict.activeIssuedCount) === 1 ? '' : 's'
                                    }.`
                                  : ''}
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-[12.5px] text-[#455249]">
                        {promo.discountLabel}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-[12.5px] text-[#455249]">
                        {promo.scopeLabel}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-[12px] text-[#455249]">
                        {formatWhen(promo.startsAt)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-[12px] text-[#455249]">
                        {promo.noEndDate ? 'No end' : formatWhen(promo.endsAt)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-[12px] text-[#455249]">
                        {formatWhen(promo.submittedAt || promo.reviewedAt)}
                      </td>
                      <td className="px-4 py-3">
                        {status === 'PENDING_REVIEW' ? (
                          <div className="flex min-w-[180px] flex-col items-start gap-2">
                            <div className="flex gap-2">
                              <button
                                type="button"
                                disabled={actingId === promo.id}
                                onClick={() => {
                                  const conflicts = voucherConflictsOf(promo)
                                  if (conflicts.length > 0 && confirmingId !== promo.id) {
                                    setConfirmingId(promo.id)
                                    setRejectingId('')
                                    setError('')
                                    return
                                  }
                                  void approve(promo.id)
                                }}
                                className="inline-flex h-[32px] items-center rounded-full bg-[#1aa054] px-3 text-[12px] font-bold text-white disabled:opacity-60"
                              >
                                {voucherConflictsOf(promo).length > 0 && confirmingId === promo.id
                                  ? 'Approve anyway'
                                  : 'Approve'}
                              </button>
                              <button
                                type="button"
                                disabled={actingId === promo.id}
                                onClick={() => {
                                  setRejectingId(promo.id)
                                  setConfirmingId('')
                                  setRejectReason('')
                                  setError('')
                                }}
                                className="inline-flex h-[32px] items-center rounded-full border border-[#f3d0d0] bg-white px-3 text-[12px] font-bold text-[#9b2c2c]"
                              >
                                Reject
                              </button>
                            </div>
                            {confirmingId === promo.id && voucherConflictsOf(promo).length > 0 ? (
                              <p className="max-w-[220px] text-[11.5px] text-[#8a5a10]">
                                Warning only. Confirm to approve anyway.
                              </p>
                            ) : null}
                            {rejectingId === promo.id ? (
                              <div className="w-full">
                                <textarea
                                  className="box-border min-h-[72px] w-full rounded-[8px] border border-[rgba(0,0,0,0.1)] px-3 py-2 text-[12.5px] outline-none focus:border-[#1aa054]"
                                  placeholder="Reason shown to the vendor"
                                  value={rejectReason}
                                  onChange={(event) => setRejectReason(event.target.value)}
                                />
                                <button
                                  type="button"
                                  disabled={actingId === promo.id}
                                  onClick={() => reject(promo.id)}
                                  className="mt-2 inline-flex h-[32px] items-center rounded-full bg-[#17231c] px-3 text-[12px] font-bold text-white disabled:opacity-60"
                                >
                                  Confirm reject
                                </button>
                              </div>
                            ) : null}
                          </div>
                        ) : (
                          <span className="text-[12px] text-[#8a948e]">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                : null}
            </tbody>
          </table>
        </div>
      </section>

      {pageCount > 1 ? (
        <div className="mt-3 flex items-center gap-2 text-[12.5px] text-[#455249]">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            className="rounded-full border border-[#e4e8e4] bg-white px-3 py-1 disabled:opacity-50"
          >
            Previous
          </button>
          <span>
            Page {page} of {pageCount}
          </span>
          <button
            type="button"
            disabled={page >= pageCount}
            onClick={() => setPage((current) => current + 1)}
            className="rounded-full border border-[#e4e8e4] bg-white px-3 py-1 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      ) : null}
    </div>
  )
}
