import { useEffect, useState } from 'react'
import { Package, X } from 'lucide-react'
import { adminIncidentService } from '../../services/admin/incidentService'
import { formatApiErrorMessage } from '../../api/errors'

const labelClass = 'mb-1.5 block text-[12px] font-medium text-[#7c8780]'
const inputClass =
  'box-border h-[40px] w-full rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white px-3 text-[13px] text-[#17231c] outline-none transition focus:border-[#1aa054]'

export default function AdminRedeliverModal({
  open,
  onClose,
  incidentId = null,
  mode = 'REDELIVER',
  items = [],
  onSuccess,
}) {
  const [reason, setReason] = useState('')
  const [selectedIds, setSelectedIds] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const isReplace = mode === 'REPLACE'

  useEffect(() => {
    if (!open) return
    setReason(isReplace ? 'Vendor item replacement' : 'Redelivery requested')
    setSelectedIds([])
    setError(null)
  }, [open, mode, isReplace])

  if (!open) return null

  function toggleItem(id) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((row) => row !== id) : [...current, id],
    )
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!incidentId || submitting) return
    if (isReplace && selectedIds.length === 0) {
      setError('Select at least one item to replace.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const body = {
        action: isReplace ? 'REPLACE' : 'REDELIVER',
        reason: String(reason || '').trim() || (isReplace ? 'Item replacement' : 'Redelivery'),
        ...(isReplace ? { itemIds: selectedIds } : {}),
      }
      const result = await adminIncidentService.runAction(incidentId, body)
      const payload = result?.data ?? result
      if (payload?.actionResult?.idempotentReplay) {
        setError(`${isReplace ? 'Replacement' : 'Redelivery'} was already recorded for this incident.`)
        return
      }
      onSuccess?.(payload)
      onClose?.()
    } catch (err) {
      setError(formatApiErrorMessage(err, `Failed to ${isReplace ? 'replace items' : 'initiate redelivery'}.`))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center p-4">
      <button type="button" aria-label="Close" onClick={submitting ? undefined : onClose} className="absolute inset-0 bg-black/40" />
      <div role="dialog" aria-modal="true" className="relative w-full max-w-[480px] rounded-[16px] bg-white p-5 shadow-lg">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[16px] font-bold text-[#17231c]">{isReplace ? 'Replace items' : 'Redeliver order'}</h2>
            <p className="mt-0.5 text-[12px] text-[#7c8780]">
              {isReplace
                ? 'Vendor remake for selected items — no refund substitute'
                : 'Same order, new delivery attempt'}
            </p>
          </div>
          <button type="button" onClick={onClose} disabled={submitting} className="grid h-8 w-8 place-items-center rounded-md text-[#8a948e] hover:bg-[#f3f5f3]">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          {isReplace ? (
            <div>
              <p className={labelClass}>Items to replace</p>
              <div className="max-h-[160px] space-y-1 overflow-y-auto rounded-[8px] border border-[#e4e8e4] p-2">
                {items.length === 0 ? (
                  <p className="text-[12px] text-[#7c8780]">No items on this order.</p>
                ) : (
                  items.map((item) => {
                    const id = item.id || item.name
                    const checked = selectedIds.includes(id)
                    return (
                      <label key={id} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-[#f6f8f6]">
                        <input type="checkbox" checked={checked} onChange={() => toggleItem(id)} disabled={submitting} />
                        <span className="text-[12px] text-[#17231c]">{item.name}</span>
                      </label>
                    )
                  })
                )}
              </div>
            </div>
          ) : null}
          <label className="block">
            <span className={labelClass}>Reason</span>
            <input className={inputClass} value={reason} onChange={(e) => setReason(e.target.value)} disabled={submitting} />
          </label>
          {error ? <div className="rounded-[10px] bg-[#fdebec] px-3 py-2 text-[12px] text-[#d64044]">{error}</div> : null}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} disabled={submitting} className="h-[36px] rounded-full border px-4 text-[13px]">Cancel</button>
            <button type="submit" disabled={submitting || !incidentId} className="inline-flex h-[36px] items-center gap-1.5 rounded-full bg-[#1aa054] px-4 text-[13px] text-white disabled:opacity-60">
              <Package size={14} />
              {submitting ? 'Working…' : isReplace ? 'Request replacement' : 'Initiate redelivery'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
