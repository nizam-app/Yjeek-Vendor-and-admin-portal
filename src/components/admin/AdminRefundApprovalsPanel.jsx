import { useCallback, useState } from 'react'
import { Check, X } from 'lucide-react'
import { cn } from './cn'
import { formatAdminMoney } from '../../mappers/admin/mapAdminOrderDetail'
import { adminIncidentService } from '../../services/admin/incidentService'
import { formatApiErrorMessage } from '../../api/errors'
import { useAuth } from '../../context/AuthContext'

function canApproveRefunds(user) {
  const actions = user?.permissions?.LIVE_DASHBOARD
  return Array.isArray(actions) && actions.includes('APPROVE')
}

function bearerLabel(bearer) {
  if (!bearer) return '—'
  return String(bearer).replace(/_/g, ' ')
}

/**
 * Pending incident refund approvals queue for Live Orders.
 */
export default function AdminRefundApprovalsPanel({
  approvals = [],
  loading = false,
  onDecision,
  currentUserId = null,
}) {
  const { user } = useAuth()
  const canApprove = canApproveRefunds(user)
  const [busyId, setBusyId] = useState(null)
  const [rejectingId, setRejectingId] = useState(null)
  const [rejectNote, setRejectNote] = useState('')
  const [error, setError] = useState(null)

  const handleApprove = useCallback(
    async (approvalId) => {
      setError(null)
      setBusyId(approvalId)
      try {
        await adminIncidentService.approveRefund(approvalId)
        setRejectingId(null)
        setRejectNote('')
        onDecision?.()
      } catch (err) {
        setError(formatApiErrorMessage(err, 'Failed to approve refund.'))
      } finally {
        setBusyId(null)
      }
    },
    [onDecision],
  )

  const handleReject = useCallback(
    async (approvalId) => {
      if (!String(rejectNote || '').trim()) {
        setError('Rejection reason is required.')
        return
      }
      setError(null)
      setBusyId(approvalId)
      try {
        await adminIncidentService.rejectRefund(approvalId, {
          reviewNote: rejectNote.trim(),
        })
        setRejectingId(null)
        setRejectNote('')
        onDecision?.()
      } catch (err) {
        setError(formatApiErrorMessage(err, 'Failed to reject refund.'))
      } finally {
        setBusyId(null)
      }
    },
    [onDecision, rejectNote],
  )

  const list = Array.isArray(approvals) ? approvals : []
  if (!list.length && !loading) return null

  return (
    <aside className="mb-3 flex flex-col overflow-hidden rounded-xl border border-[#dfe4e0] bg-white px-[14px] shadow-[0_1px_2px_rgba(20,40,28,.025)]">
      <div className="flex h-[44px] shrink-0 items-center gap-1.5">
        <h2 className="text-[14px] font-bold text-[#17231c]">Refund approvals</h2>
        {list.length ? (
          <span className="rounded-full bg-[#fff8e8] px-2 py-0.5 text-[10px] font-semibold text-[#9a7618]">
            {list.length} pending
          </span>
        ) : null}
      </div>

      {error ? (
        <div className="mb-2 rounded-[8px] bg-[#fdebec] px-3 py-2 text-[11px] text-[#d64044]">
          {error}
        </div>
      ) : null}

      <div className="max-h-[280px] min-h-0 overflow-y-auto pb-2">
        {loading && !list.length ? (
          <p className="py-4 text-center text-[12px] text-[#78837c]">Loading…</p>
        ) : null}
        {list.map((row) => {
          const orderNumber = row.incident?.order?.orderNumber
          const customer = row.incident?.order?.customer
          const customerName = customer
            ? [customer.firstName, customer.lastName].filter(Boolean).join(' ')
            : null
          const isRequester = currentUserId && row.requestedByUserId === currentUserId
          const isBusy = busyId === row.id

          return (
            <div
              key={row.id}
              className="border-b border-[#e2e6e3] py-3 last:border-b-0"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[12px] font-bold text-[#202722]">
                    {orderNumber ? `#${orderNumber}` : 'Order'} ·{' '}
                    {formatAdminMoney(row.amountBhd, 'BHD')}
                  </p>
                  <p className="mt-0.5 truncate text-[10px] text-[#77827b]">
                    {row.incident?.categoryLabel || row.execution?.reason || 'Incident refund'}
                    {customerName ? ` · ${customerName}` : ''}
                  </p>
                  <p className="mt-0.5 text-[10px] text-[#77827b]">
                    Bearer: {bearerLabel(row.costBearer)}
                    {row.incident?.bearerWasOverridden
                      ? ` (override: ${row.incident.bearerOverrideReason || '—'})`
                      : ''}
                  </p>
                  {row.execution?.destination ? (
                    <p className="mt-0.5 text-[10px] text-[#77827b]">
                      To: {String(row.execution.destination).replace(/_/g, ' ')}
                    </p>
                  ) : null}
                  <p className="mt-0.5 text-[10px] text-[#77827b]">
                    Requested by {row.requestedByName}
                    {row.note ? ` · "${row.note}"` : ''}
                  </p>
                </div>
              </div>

              {canApprove && !isRequester ? (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {rejectingId === row.id ? (
                    <>
                      <input
                        type="text"
                        value={rejectNote}
                        onChange={(e) => setRejectNote(e.target.value)}
                        placeholder="Rejection reason (required)"
                        className="min-w-0 flex-1 rounded-[8px] border border-[#e4e8e4] px-2 py-1.5 text-[11px]"
                        disabled={isBusy}
                      />
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleReject(row.id)}
                        className="inline-flex h-7 items-center gap-1 rounded-full bg-[#fdebec] px-2.5 text-[11px] font-medium text-[#d64044] disabled:opacity-60"
                      >
                        <X size={12} />
                        Confirm reject
                      </button>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => {
                          setRejectingId(null)
                          setRejectNote('')
                        }}
                        className="text-[11px] text-[#78837c] hover:underline"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleApprove(row.id)}
                        className={cn(
                          'inline-flex h-7 items-center gap-1 rounded-full bg-[#1aa054] px-2.5 text-[11px] font-medium text-white disabled:opacity-60',
                        )}
                      >
                        <Check size={12} />
                        Approve
                      </button>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => {
                          setRejectingId(row.id)
                          setRejectNote('')
                          setError(null)
                        }}
                        className="inline-flex h-7 items-center gap-1 rounded-full border border-[#e4e8e4] px-2.5 text-[11px] font-medium text-[#455249] disabled:opacity-60"
                      >
                        <X size={12} />
                        Reject
                      </button>
                    </>
                  )}
                </div>
              ) : isRequester ? (
                <p className="mt-2 text-[10px] text-[#9a7618]">
                  Pending approval — you cannot approve your own request.
                </p>
              ) : !canApprove ? (
                <p className="mt-2 text-[10px] text-[#78837c]">
                  Pending approval — requires LIVE_DASHBOARD.APPROVE permission.
                </p>
              ) : null}
            </div>
          )
        })}
      </div>
    </aside>
  )
}
