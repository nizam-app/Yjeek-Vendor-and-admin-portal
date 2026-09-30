import React, { useState, useEffect } from 'react'
import { MarketingViewTabs } from '../../../components/admin/MarketingViewTabs'
import { adminFraudService } from '../../../services/admin/fraudService'

const SIGNAL_LABELS = {
  device_cluster: { label: 'Device Cluster', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  shared_card_or_address: { label: 'Shared Card / Address', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  referral_zero_order_invitees: { label: 'Zero-Order Invitees (≥5 / 14d)', color: 'bg-red-100 text-red-800 border-red-200' },
  referral_same_device_invites: { label: 'Same Device Invites', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  referral_bulk_invites: { label: 'Bulk Invites', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  voucher_refund_loop: { label: 'Voucher Refund Loop', color: 'bg-rose-100 text-rose-800 border-rose-200' },
}

export default function AdminFraudReviewPage() {
  const [flags, setFlags] = useState([])
  const [total, setTotal] = useState(0)
  const [statusFilter, setStatusFilter] = useState('pending')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionSuccess, setActionSuccess] = useState(null)
  const [actionLoading, setActionLoading] = useState(null)

  // Action dialog state
  const [activeModal, setActiveModal] = useState(null) // { type: 'RELEASE'|'CANCEL'|'SUSPEND', flag: obj }
  const [suspensionNote, setSuspensionNote] = useState('')

  const fetchFlags = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await adminFraudService.listFlags({ status: statusFilter })
      setFlags(res.items || [])
      setTotal(res.total || 0)
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load fraud flags')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFlags()
  }, [statusFilter])

  const handleDecision = async (type, flagId, payload = {}) => {
    try {
      setActionLoading(flagId)
      setError(null)
      setActionSuccess(null)

      if (type === 'RELEASE') {
        const res = await adminFraudService.releaseFlag(flagId)
        setActionSuccess(`Credits released successfully (BHD ${res.releasedAmount.toFixed(3)})`)
      } else if (type === 'CANCEL') {
        const res = await adminFraudService.cancelCredits(flagId)
        setActionSuccess(`Credits cancelled successfully (BHD ${res.cancelledAmount.toFixed(3)})`)
      } else if (type === 'SUSPEND') {
        await adminFraudService.suspendAccount(flagId, payload)
        setActionSuccess('Account(s) suspended successfully.')
      }

      setActiveModal(null)
      setSuspensionNote('')
      await fetchFlags()
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Action failed'
      setError(msg)
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[#1a2420] tracking-tight">
          Marketing &amp; Promotions
        </h1>
        <p className="text-sm text-[#5c6b63] mt-1">
          Review queue for fraud signals, frozen credits, device clusters, and refund loops (OG §10).
        </p>
      </div>

      <MarketingViewTabs active="fraud" />

      {/* Alert Banners */}
      {actionSuccess && (
        <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex justify-between items-center">
          <span>{actionSuccess}</span>
          <button type="button" onClick={() => setActionSuccess(null)} className="font-bold text-emerald-900">&times;</button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-sm flex justify-between items-center">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} className="font-bold text-rose-900">&times;</button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b border-[#dde5df] pb-3">
        <div className="flex items-center gap-2">
          {['pending', 'decided', 'all'].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                statusFilter === tab
                  ? 'bg-[#179F56] text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)} {statusFilter === tab ? `(${total})` : ''}
            </button>
          ))}
        </div>
        <div className="text-xs text-gray-500">
          Decisions: <span className="font-semibold text-gray-700">Super Admin only</span>
        </div>
      </div>

      {/* Review Queue Table */}
      <div className="bg-white border border-[#dde5df] rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-sm text-gray-500">Loading fraud review queue...</div>
        ) : flags.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-500">
            No {statusFilter} review flags found. All signals are clean.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-[#f4f8f5] text-[#1a2420] text-xs uppercase tracking-wider font-mono border-b border-[#dde5df]">
                  <th className="py-3 px-4">Signal</th>
                  <th className="py-3 px-4">Accounts Involved</th>
                  <th className="py-3 px-4">Frozen Amount</th>
                  <th className="py-3 px-4">Opened</th>
                  <th className="py-3 px-4">Status / Decision</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#dde5df]">
                {flags.map((flag) => {
                  const signalMeta = SIGNAL_LABELS[flag.signal] || {
                    label: flag.signal,
                    color: 'bg-gray-100 text-gray-800 border-gray-200',
                  }
                  const isPending = !flag.decision

                  return (
                    <tr key={flag.id} className="hover:bg-gray-50 transition">
                      <td className="py-3.5 px-4 align-top">
                        <span
                          className={`inline-block border px-2.5 py-1 rounded-full text-xs font-semibold ${signalMeta.color}`}
                        >
                          {signalMeta.label}
                        </span>
                        {flag.dedupeKey && (
                          <div className="font-mono text-[11px] text-gray-400 mt-1 truncate max-w-xs" title={flag.dedupeKey}>
                            {flag.dedupeKey}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 align-top">
                        <div className="space-y-1">
                          {flag.accounts && flag.accounts.length > 0 ? (
                            flag.accounts.map((acc, idx) => (
                              <div key={acc.customerId || idx} className="text-xs">
                                <span className="font-semibold text-gray-800">{acc.name}</span>
                                {acc.phone && <span className="text-gray-500 ml-1.5 font-mono">{acc.phone}</span>}
                                {acc.userStatus === 'SUSPENDED' && (
                                  <span className="ml-1.5 px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 text-[10px] font-bold">
                                    SUSPENDED
                                  </span>
                                )}
                              </div>
                            ))
                          ) : (
                            <span className="text-gray-400 text-xs font-mono">
                              {flag.userIds.join(', ') || '—'}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 align-top">
                        {flag.frozenAmount > 0 ? (
                          <span className="font-mono font-bold text-amber-700">
                            BHD {flag.frozenAmount.toFixed(3)}
                          </span>
                        ) : (
                          <span className="text-gray-400 font-mono">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 align-top text-xs text-gray-500">
                        {new Date(flag.createdAt).toLocaleString()}
                      </td>

                      <td className="py-3.5 px-4 align-top">
                        {isPending ? (
                          <span className="inline-block px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-xs font-bold">
                            PENDING REVIEW
                          </span>
                        ) : (
                          <div>
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                                flag.decision === 'RELEASE'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : flag.decision === 'CANCEL'
                                  ? 'bg-gray-100 text-gray-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {flag.decision}
                            </span>
                            {flag.decidedAt && (
                              <div className="text-[11px] text-gray-400 mt-0.5">
                                {new Date(flag.decidedAt).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 align-top text-right space-x-1.5">
                        {isPending ? (
                          <>
                            <button
                              type="button"
                              disabled={actionLoading === flag.id}
                              onClick={() => setActiveModal({ type: 'RELEASE', flag })}
                              className="px-2.5 py-1 text-xs font-semibold rounded bg-emerald-600 text-white hover:bg-emerald-700 transition disabled:opacity-50"
                            >
                              Release
                            </button>
                            <button
                              type="button"
                              disabled={actionLoading === flag.id}
                              onClick={() => setActiveModal({ type: 'CANCEL', flag })}
                              className="px-2.5 py-1 text-xs font-semibold rounded bg-amber-600 text-white hover:bg-amber-700 transition disabled:opacity-50"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              disabled={actionLoading === flag.id}
                              onClick={() => setActiveModal({ type: 'SUSPEND', flag })}
                              className="px-2.5 py-1 text-xs font-semibold rounded bg-rose-600 text-white hover:bg-rose-700 transition disabled:opacity-50"
                            >
                              Suspend
                            </button>
                          </>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Decided</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">
              Confirm {activeModal.type === 'RELEASE' ? 'Release Credits' : activeModal.type === 'CANCEL' ? 'Cancel Credits' : 'Suspend Account'}
            </h3>

            <p className="text-sm text-gray-600">
              {activeModal.type === 'RELEASE' && (
                <>
                  Are you sure you want to <strong>RELEASE</strong> frozen credits for this flag?
                  The frozen referral bonus (BHD {activeModal.flag.frozenAmount.toFixed(3)}) will become AVAILABLE and spendable, and the pattern block will be lifted.
                </>
              )}
              {activeModal.type === 'CANCEL' && (
                <>
                  Are you sure you want to <strong>CANCEL</strong> these credits?
                  The frozen amount (BHD {activeModal.flag.frozenAmount.toFixed(3)}) will be marked REVERSED and will NOT be returned to the account(s).
                </>
              )}
              {activeModal.type === 'SUSPEND' && (
                <>
                  Are you sure you want to <strong>SUSPEND</strong> the account(s) involved in this flag?
                  The account(s) will be permanently suspended from placing orders.
                </>
              )}
            </p>

            {activeModal.type === 'SUSPEND' && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Suspension Note
                </label>
                <textarea
                  value={suspensionNote}
                  onChange={(e) => setSuspensionNote(e.target.value)}
                  placeholder="Reason for suspension..."
                  className="w-full text-xs p-2.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-emerald-500"
                  rows={3}
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() =>
                  handleDecision(activeModal.type, activeModal.flag.id, {
                    note: suspensionNote,
                  })
                }
                className={`px-4 py-2 text-xs font-semibold text-white rounded-lg transition ${
                  activeModal.type === 'RELEASE'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : activeModal.type === 'CANCEL'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                Confirm {activeModal.type}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
