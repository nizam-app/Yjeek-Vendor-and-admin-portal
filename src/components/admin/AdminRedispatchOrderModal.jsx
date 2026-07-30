import { useEffect, useMemo, useState } from 'react'
import { RefreshCw, Search, X } from 'lucide-react'
import { cn } from './cn'
import { adminOrderService } from '../../services/admin/orderService'
import { ApiError, formatApiErrorMessage } from '../../api/errors'
import { formatAdminMoney } from '../../mappers/admin/mapAdminOrderDetail'

const labelClass = 'mb-1.5 block text-[12px] font-medium text-[#7c8780]'
const inputClass =
  'box-border h-[40px] w-full appearance-none rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white px-3 pr-9 text-[13px] text-[#17231c] outline-none transition focus:border-[#1aa054]'

function reasonValue(item) {
  if (typeof item === 'string') return item
  return String(item?.id || item?.label || '')
}

function reasonLabel(item) {
  if (typeof item === 'string') return item
  return String(item?.label || item?.id || '')
}

/**
 * Redispatch order modal — Take action → Redispatch order on incident details.
 * Confirmed POST body: { scope: FULL|PARTIAL, itemIds, reason, notifyCustomer }
 * Note field is UI-only (not in API body).
 */
export default function AdminRedispatchOrderModal({
  open,
  onClose,
  orderId,
  orderNumber = null,
  orderStatus = null,
  vendorName = null,
  items = [],
  currency = 'BHD',
  reasons = [],
  onSuccess,
}) {
  const [scope, setScope] = useState('FULL')
  const [selectedIds, setSelectedIds] = useState([])
  const [reason, setReason] = useState('')
  const [notifyCustomer, setNotifyCustomer] = useState(true)
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const reasonOptions = Array.isArray(reasons) ? reasons.filter(Boolean) : []
  const orderItems = Array.isArray(items) ? items.filter(Boolean) : []
  const selectableIds = useMemo(
    () =>
      (Array.isArray(items) ? items : [])
        .filter((item) => item?.id != null && item.id !== '')
        .map((item) => String(item.id)),
    [items],
  )

  useEffect(() => {
    if (!open) return
    setScope('FULL')
    setSelectedIds(selectableIds)
    setReason('')
    setNotifyCustomer(true)
    setNote('')
    setError(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset when modal opens / order changes
  }, [open, orderId])

  useEffect(() => {
    if (!open || reason) return
    const first = reasonOptions[0]
    if (!first) return
    setReason(reasonValue(first))
  }, [open, reason, reasonOptions])

  useEffect(() => {
    if (!open) return
    if (scope === 'FULL') setSelectedIds(selectableIds)
  }, [open, scope, selectableIds])

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

  const remakeValue = useMemo(() => {
    const selected = new Set(selectedIds.map(String))
    const source = Array.isArray(items) ? items : []
    const total = source.reduce((sum, item) => {
      if (item?.id == null || item.id === '') return sum
      if (!selected.has(String(item.id))) return sum
      const amount = Number(item.lineTotal ?? item.unitPrice ?? 0)
      return sum + (Number.isNaN(amount) ? 0 : amount)
    }, 0)
    return formatAdminMoney(total, currency)
  }, [items, selectedIds, currency])

  if (!open) return null

  const headerOrder = orderNumber || orderId || '—'
  const statusLabel = orderStatus
    ? String(orderStatus).toLowerCase().replace(/_/g, ' ')
    : null
  const contextLine = [vendorName, orderNumber ? `#${orderNumber}` : null, statusLabel]
    .filter(Boolean)
    .join(' · ')

  function toggleItem(id) {
    if (scope === 'FULL') return
    const key = String(id)
    setSelectedIds((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key],
    )
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!orderId || submitting) return

    setError(null)
    setSubmitting(true)
    try {
      if (!String(reason || '').trim()) {
        throw new ApiError({ message: 'Select a remake reason.' })
      }

      const body = {
        scope: scope === 'PARTIAL' ? 'PARTIAL' : 'FULL',
        itemIds: [],
        reason: String(reason).trim(),
        notifyCustomer,
      }

      if (body.scope === 'PARTIAL') {
        if (!selectedIds.length) {
          throw new ApiError({ message: 'Select at least one item for partial remake.' })
        }
        if (!orderItems.length) {
          throw new ApiError({
            message: 'Order items have no ids — partial remake is not available.',
          })
        }
        body.itemIds = selectedIds.map(String)
      }

      await adminOrderService.redispatch(orderId, body)
      onSuccess?.()
      onClose?.()
    } catch (err) {
      setError(formatApiErrorMessage(err, 'Failed to redispatch order.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close redispatch order modal"
        onClick={submitting ? undefined : onClose}
        className="absolute inset-0 bg-black/40"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="redispatch-order-title"
        className="relative flex max-h-[calc(100vh-32px)] w-full max-w-[520px] flex-col overflow-hidden rounded-[16px] bg-white shadow-[0_12px_40px_rgba(20,40,28,.18)]"
      >
        <div className="flex shrink-0 items-start gap-3 px-5 pt-5 pb-3">
          <div className="min-w-0 flex-1">
            <h2 id="redispatch-order-title" className="text-[16px] font-bold text-[#17231c]">
              Redispatch order
            </h2>
            <p className="mt-0.5 truncate text-[12px] text-[#7c8780]">
              #{headerOrder}
              {vendorName ? ` · ${vendorName}` : ''}
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
            {contextLine ? (
              <div className="flex items-center gap-2 rounded-[10px] bg-[#f3f5f3] px-3.5 py-3">
                <Search size={14} className="shrink-0 text-[#69756d]" strokeWidth={2} />
                <p className="truncate text-[12px] leading-[16px] text-[#455249]">{contextLine}</p>
              </div>
            ) : null}

            <p className="text-[12px] leading-[16px] text-[#7c8780]">
              Ask the restaurant to prepare the order again. Choose a full remake or select specific
              items.
            </p>

            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.06em] text-[#8a948e]">
                Remake scope
              </p>
              <div className="space-y-2">
                {[
                  { id: 'FULL', label: 'Full remake — all items' },
                  { id: 'PARTIAL', label: 'Partial remake — selected items only' },
                ].map((option) => {
                  const selected = scope === option.id
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setScope(option.id)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-[12px] border px-3.5 py-3 text-left transition',
                        selected
                          ? 'border-[#1aa054] bg-[#f3faf5]'
                          : 'border-[#e4e8e4] bg-white hover:border-[#c5ced0]',
                      )}
                    >
                      <span
                        className={cn(
                          'grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full border-2',
                          selected ? 'border-[#1aa054]' : 'border-[#c5ced0]',
                        )}
                      >
                        {selected ? <span className="h-2.5 w-2.5 rounded-full bg-[#1aa054]" /> : null}
                      </span>
                      <span className="text-[13px] font-medium text-[#17231c]">{option.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.06em] text-[#8a948e]">
                Items to remake
              </p>
              {orderItems.length === 0 ? (
                <p className="rounded-[10px] border border-[#e8ebe9] bg-[#fafbfa] px-3 py-3 text-[12px] text-[#7c8780]">
                  No order items available.
                </p>
              ) : (
                <div className="overflow-hidden rounded-[12px] border border-[#e8ebe9]">
                  {orderItems.map((item, index) => {
                    const id = item.id != null && item.id !== '' ? String(item.id) : null
                    const checked = scope === 'FULL' ? true : id ? selectedIds.includes(id) : false
                    const canToggle = scope === 'PARTIAL' && Boolean(id)
                    return (
                      <label
                        key={id || `${item.name}-${index}`}
                        className={cn(
                          'flex items-center gap-3 border-b border-[#edf0ee] px-3.5 py-3 last:border-0',
                          canToggle ? 'cursor-pointer' : 'cursor-default',
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={!canToggle || submitting}
                          onChange={() => id && toggleItem(id)}
                          className="size-4 accent-[#1aa054]"
                        />
                        <span className="min-w-0 flex-1 text-[13px] text-[#17231c]">{item.name}</span>
                        <span className="shrink-0 text-[13px] font-medium text-[#17231c]">
                          {item.price}
                        </span>
                      </label>
                    )
                  })}
                  <div className="flex items-center justify-between bg-[#fafbfa] px-3.5 py-3">
                    <span className="text-[13px] font-bold text-[#17231c]">Remake value</span>
                    <span className="text-[13px] font-bold text-[#17231c]">{remakeValue}</span>
                  </div>
                </div>
              )}
            </div>

            <label className="block">
              <span className={labelClass}>Reason for remake</span>
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
                    reasonOptions.map((item) => (
                      <option key={reasonValue(item)} value={reasonValue(item)}>
                        {reasonLabel(item)}
                      </option>
                    ))
                  )}
                </select>
                <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[10px] text-[#69756d]">
                  ▾
                </span>
              </div>
            </label>

            <div className="flex items-center justify-between gap-3">
              <p className="text-[13px] text-[#17231c]">Notify customer of the new ETA</p>
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

            <label className="block">
              <span className={labelClass}>Note (optional)</span>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                disabled={submitting}
                rows={2}
                placeholder="Add a note for the log…"
                className="box-border w-full resize-none rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white px-3 py-2.5 text-[13px] text-[#17231c] outline-none transition placeholder:text-[#9aa49d] focus:border-[#1aa054]"
              />
            </label>

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
              disabled={submitting}
              className="inline-flex h-[36px] items-center justify-center gap-1.5 rounded-full bg-[#1aa054] px-4 text-[13px] font-medium text-white hover:bg-[#158a47] disabled:opacity-60"
            >
              <RefreshCw size={14} strokeWidth={2.2} />
              {submitting ? 'Redispatching…' : 'Redispatch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
