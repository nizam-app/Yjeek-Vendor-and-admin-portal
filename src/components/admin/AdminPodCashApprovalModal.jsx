import { useEffect, useState } from 'react'
import { Button } from './Button'
import { adminOrderService } from '../../services/admin/orderService'
import { formatApiErrorMessage } from '../../api/errors'
import { showError, showSuccess } from '../../utils/toast'

/**
 * Dispatcher popup when automation parks a COD order for REQUIRE_APPROVAL.
 */
export default function AdminPodCashApprovalModal({ orderId, open, onClose, onDone }) {
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [ctx, setCtx] = useState(null)

  useEffect(() => {
    if (!open || !orderId) return
    let cancelled = false
    setLoading(true)
    adminOrderService
      .getPodCashApproval(orderId)
      .then((res) => {
        if (!cancelled) setCtx(res?.data ?? res)
      })
      .catch((err) => {
        if (!cancelled) showError(formatApiErrorMessage(err, 'Failed to load POD approval.'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, orderId])

  if (!open) return null

  async function approve() {
    setBusy(true)
    try {
      await adminOrderService.approvePodCash(orderId)
      showSuccess('COD assignment approved.')
      onDone?.()
      onClose?.()
    } catch (err) {
      showError(formatApiErrorMessage(err, 'Approve failed.'))
    } finally {
      setBusy(false)
    }
  }

  async function reject() {
    setBusy(true)
    try {
      await adminOrderService.rejectPodCash(orderId)
      showSuccess('Rejected — automation will continue looking for another champ.')
      onDone?.()
      onClose?.()
    } catch (err) {
      showError(formatApiErrorMessage(err, 'Reject failed.'))
    } finally {
      setBusy(false)
    }
  }

  const pending = ctx?.pending === true
  const champ = ctx?.champ
  const order = ctx?.order

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
        <h3 className="text-[16px] font-bold text-[#111827]">POD cash approval required</h3>
        <p className="mt-1 text-[12px] text-[#6b7280]">
          Automation paused for this COD order until you approve or reject.
        </p>

        {loading ? (
          <p className="mt-4 text-[13px] text-[#6b7280]">Loading…</p>
        ) : !pending ? (
          <p className="mt-4 text-[13px] text-[#6b7280]">No pending POD approval for this order.</p>
        ) : (
          <div className="mt-4 space-y-2 rounded-xl bg-[#f9fafb] p-3 text-[13px]">
            <p>
              <span className="font-semibold">Order:</span> {order?.orderNumber}
            </p>
            <p>
              <span className="font-semibold">Order cash:</span> BHD{' '}
              {Number(order?.orderCashBhd ?? 0).toFixed(3)}
            </p>
            <p>
              <span className="font-semibold">Champ:</span> {champ?.name || '—'} (
              {champ?.displayCode || champ?.id})
            </p>
            <p>
              <span className="font-semibold">Cash held:</span> BHD{' '}
              {Number(champ?.cashHeldBhd ?? 0).toFixed(3)} / max{' '}
              {Number(champ?.maxFloatBhd ?? 0).toFixed(3)}
            </p>
          </div>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" onClick={onClose} className="rounded-full px-4" disabled={busy}>
            Close
          </Button>
          {pending ? (
            <>
              <Button
                type="button"
                onClick={reject}
                disabled={busy}
                className="rounded-full px-4 border border-[#dc2626] text-[#dc2626]"
              >
                Reject
              </Button>
              <Button type="button" primary onClick={approve} disabled={busy} className="rounded-full px-5">
                Approve
              </Button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}
