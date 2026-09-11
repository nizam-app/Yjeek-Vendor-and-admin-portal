import { useEffect, useState } from 'react'
import { RefreshCw, X } from 'lucide-react'
import { cn } from './cn'
import { adminOrderService } from '../../services/admin/orderService'
import { ApiError, formatApiErrorMessage } from '../../api/errors'

const labelClass = 'mb-1.5 block text-[12px] font-medium text-[#7c8780]'
const inputClass =
  'box-border h-[40px] w-full appearance-none rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white px-3 pr-9 text-[13px] text-[#17231c] outline-none transition focus:border-[#2876c7]'

function formatCurrentChampLine(champ) {
  if (!champ) return 'No champ currently assigned'
  const parts = [
    champ.name || champ.label || null,
    champ.vehicle && champ.vehicle !== '—' ? champ.vehicle : null,
    champ.id ? String(champ.id) : null,
    champ.status || null,
  ].filter(Boolean)
  return parts.length ? `Current: ${parts.join(' · ')}` : 'No champ currently assigned'
}

function formatNearbyDetail(champ) {
  const parts = []
  if (champ.distanceKm != null && champ.distanceKm !== '') {
    const n = Number(champ.distanceKm)
    parts.push(Number.isNaN(n) ? String(champ.distanceKm) : `${n} km`)
  }
  if (champ.vehicle) parts.push(champ.vehicle)
  if (champ.activeCount != null) parts.push(`${champ.activeCount} active`)
  else if (champ.status) parts.push(champ.status)
  return parts.join(' · ')
}

/**
 * Reassign champ modal — Take action → Reassign champ on incident/order details.
 * Loads GET nearby-champs; submits POST reassign-champ.
 */
export default function AdminReassignChampModal({
  open,
  onClose,
  orderId,
  orderNumber = null,
  orderStatus = null,
  currentChamp = null,
  reasons = [],
  incidentId = null,
  onSuccess,
}) {
  const [driverId, setDriverId] = useState('')
  const [reason, setReason] = useState('')
  const [notifyCustomer, setNotifyCustomer] = useState(true)
  const [nearbyLoading, setNearbyLoading] = useState(false)
  const [nearbyError, setNearbyError] = useState(null)
  const [nearbyData, setNearbyData] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const reasonOptions = Array.isArray(reasons) ? reasons.filter(Boolean) : []

  useEffect(() => {
    if (!open) return
    setDriverId('')
    setReason('')
    setNotifyCustomer(true)
    setError(null)
    setNearbyError(null)
    setNearbyData(null)
  }, [open, orderId])

  useEffect(() => {
    if (!open || reason) return
    const first = reasonOptions[0]
    if (!first) return
    setReason(String(typeof first === 'string' ? first : first.id || first.label || ''))
  }, [open, reason, reasonOptions])

  useEffect(() => {
    if (!open || !orderId) return undefined

    let cancelled = false
    setNearbyLoading(true)
    setNearbyError(null)

    adminOrderService
      .getNearbyChamps(orderId)
      .then((response) => {
        if (cancelled) return
        const data = response?.data || null
        setNearbyData(data)
        const first = data?.nearby?.[0]
        if (first?.id) setDriverId(String(first.id))
      })
      .catch((err) => {
        if (cancelled) return
        setNearbyError(formatApiErrorMessage(err, 'Failed to load nearby champs.'))
        setNearbyData(null)
      })
      .finally(() => {
        if (!cancelled) setNearbyLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, orderId])

  useEffect(() => {
    if (!open) return undefined
    function onKeyDown(e) {
      if (e.key === 'Escape' && !submitting) onClose?.()
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, submitting, onClose])

  if (!open) return null

  const headerOrder =
    orderNumber || nearbyData?.orderNumber || orderId || '—'
  const headerStatus =
    orderStatus || nearbyData?.status || null
  const current =
    nearbyData?.currentChamp ||
    (currentChamp?.id || currentChamp?.name ? currentChamp : null)
  const nearby = nearbyData?.nearby || []
  const currentId = current?.id ? String(current.id) : null

  async function handleSubmit(event) {
    event.preventDefault()
    if (!orderId || submitting) return

    setError(null)
    setSubmitting(true)
    try {
      const nextId = String(driverId || '').trim()
      if (!nextId) throw new ApiError({ message: 'Select a new champ.' })
      if (currentId && nextId === currentId) {
        throw new ApiError({
          message: 'Choose a different champ — cannot reassign to the current champ.',
        })
      }
      if (!String(reason || '').trim()) {
        throw new ApiError({ message: 'Select a reassign reason.' })
      }

      await adminOrderService.reassignChamp(orderId, {
        driverId: nextId,
        reason: String(reason).trim(),
        notifyCustomer,
        ...(incidentId ? { incidentId: String(incidentId) } : {}),
      })
      onSuccess?.()
      onClose?.()
    } catch (err) {
      setError(formatApiErrorMessage(err, 'Failed to reassign champ.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close reassign champ modal"
        onClick={submitting ? undefined : onClose}
        className="absolute inset-0 bg-black/40"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="reassign-champ-title"
        className="relative flex max-h-[calc(100vh-32px)] w-full max-w-[480px] flex-col overflow-hidden rounded-[16px] bg-white shadow-[0_12px_40px_rgba(20,40,28,.18)]"
      >
        <div className="flex shrink-0 items-start gap-3 px-5 pt-5 pb-3">
          <div className="min-w-0 flex-1">
            <h2 id="reassign-champ-title" className="text-[16px] font-bold text-[#17231c]">
              Reassign champ
            </h2>
            <p className="mt-0.5 truncate text-[12px] text-[#7c8780]">
              #{headerOrder}
              {headerStatus ? ` · ${String(headerStatus).toLowerCase().replace(/_/g, ' ')}` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-[#8a948e] hover:bg-[#f3f5f3] hover:text-[#455249] disabled:opacity-50"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 pb-2">
            <div className="flex items-center gap-2 rounded-[10px] bg-[#f3f5f3] px-3.5 py-3">
              <span className="text-[14px] text-[#69756d]" aria-hidden>
                ☰
              </span>
              <p className="text-[12px] leading-[16px] text-[#455249]">
                {formatCurrentChampLine(current)}
              </p>
            </div>

            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.06em] text-[#8a948e]">
                Select new champ (nearby)
              </p>

              {nearbyLoading ? (
                <p className="py-3 text-[12px] text-[#7c8780]">Loading nearby champs…</p>
              ) : null}
              {nearbyError ? (
                <p className="py-2 text-[12px] text-[#d64044]">{nearbyError}</p>
              ) : null}

              {!nearbyLoading && nearby.length === 0 && !nearbyError ? (
                <p className="rounded-[10px] border border-[#e8ebe9] bg-[#fafbfa] px-3 py-3 text-[12px] text-[#7c8780]">
                  No nearby champs available for this order.
                </p>
              ) : null}

              <div className="space-y-2">
                {nearby.map((champ) => {
                  const selected = String(driverId) === String(champ.id)
                  const detail = formatNearbyDetail(champ)
                  return (
                    <button
                      key={champ.id}
                      type="button"
                      onClick={() => setDriverId(String(champ.id))}
                      className={cn(
                        'flex w-full items-start gap-3 rounded-[12px] border px-3.5 py-3 text-left transition',
                        selected
                          ? 'border-[#4b8fd9] bg-[#f5f9fd]'
                          : 'border-[#e4e8e4] bg-white hover:border-[#c5ced0]',
                      )}
                    >
                      <span
                        className={cn(
                          'mt-0.5 grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full border-2',
                          selected ? 'border-[#2876c7]' : 'border-[#c5ced0]',
                        )}
                      >
                        {selected ? (
                          <span className="h-2.5 w-2.5 rounded-full bg-[#2876c7]" />
                        ) : null}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13px] font-bold text-[#17231c]">
                          {champ.name || champ.label || champ.id}
                          {champ.rating != null ? (
                            <span className="font-medium text-[#455249]">
                              {' '}
                              · ★ {champ.rating}
                            </span>
                          ) : null}
                        </span>
                        {detail ? (
                          <span className="mt-0.5 block text-[11px] text-[#7c8780]">{detail}</span>
                        ) : null}
                      </span>
                    </button>
                  )
                })}
              </div>

              {!nearbyLoading && nearby.length === 0 ? (
                <label className="mt-3 block">
                  <span className={labelClass}>Champ / driver id</span>
                  <input
                    className={cn(inputClass, 'pr-3')}
                    value={driverId}
                    onChange={(e) => setDriverId(e.target.value)}
                    placeholder="Enter driver id"
                    disabled={submitting}
                  />
                </label>
              ) : null}
            </div>

            <label className="block">
              <span className={labelClass}>Reason</span>
              <div className="relative">
                <select
                  className={inputClass}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  disabled={submitting || reasonOptions.length === 0}
                >
                  {reasonOptions.length === 0 ? (
                    <option value="">No reasons from API</option>
                  ) : (
                    reasonOptions.map((item) => {
                      const id = typeof item === 'string' ? item : item.id || item.label
                      const text = typeof item === 'string' ? item : item.label || item.id
                      return (
                        <option key={id} value={id}>
                          {text}
                        </option>
                      )
                    })
                  )}
                </select>
                <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[10px] text-[#69756d]">
                  ▾
                </span>
              </div>
            </label>

            <div className="flex items-center justify-between gap-3">
              <p className="text-[13px] text-[#17231c]">Notify customer of the new champ &amp; ETA</p>
              <button
                type="button"
                role="switch"
                aria-checked={notifyCustomer}
                aria-label="Notify customer"
                disabled={submitting}
                onClick={() => setNotifyCustomer((prev) => !prev)}
                className={cn(
                  'box-border flex h-[22px] w-[38px] shrink-0 items-center rounded-[11px] px-[3px] transition-colors',
                  notifyCustomer ? 'justify-end bg-[#2E9E4D]' : 'justify-start bg-[#C7CFC7]',
                )}
              >
                <span className="size-4 shrink-0 rounded-lg bg-white" />
              </button>
            </div>

            {error ? (
              <div className="rounded-[10px] bg-[#fdebec] px-3.5 py-2.5 text-[12px] text-[#d64044]">
                {error}
              </div>
            ) : null}
          </div>

          <div className="flex shrink-0 items-center justify-end gap-2.5 border-t border-[#edf0ee] px-5 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="inline-flex h-[36px] items-center justify-center rounded-full border border-[#e4e8e4] bg-white px-4 text-[13px] font-medium text-[#455249] hover:bg-[#f6f8f6] disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !String(driverId || '').trim()}
              className="inline-flex h-[36px] items-center justify-center gap-1.5 rounded-full bg-[#2876c7] px-4 text-[13px] font-medium text-white hover:brightness-[0.96] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <RefreshCw size={14} strokeWidth={2.2} />
              {submitting ? 'Reassigning…' : 'Reassign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
