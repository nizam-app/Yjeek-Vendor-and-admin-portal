import { useEffect, useState } from 'react'
import { adminService } from '../../../services/adminService'

function formatWhen(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString()
}

export function AdminCustomerSupportTicketModal({ customerId, ticketId, onClose }) {
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!customerId || !ticketId) return undefined
    let cancelled = false
    setLoading(true)
    setError(null)
    adminService
      .getAdminCustomerSupportTicket(customerId, ticketId)
      .then((response) => {
        if (cancelled) return
        setDetail(response?.data ?? null)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err?.message || 'Failed to load ticket.')
        setDetail(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [customerId, ticketId])

  if (!ticketId) return null

  const ticket = detail?.ticket
  const order = detail?.order
  const ticketMessages = Array.isArray(detail?.messages) ? detail.messages : []
  const conversationMessages = Array.isArray(detail?.conversationMessages)
    ? detail.conversationMessages
    : []

  const thread = [
    ...ticketMessages.map((m) => ({
      id: `t-${m.id}`,
      body: m.body,
      when: m.createdAt,
      label: m.sender === 'SYSTEM' ? 'System' : m.sender === 'CUSTOMER' ? 'Customer' : 'Care',
      system: m.sender === 'SYSTEM',
    })),
    ...conversationMessages.map((m) => ({
      id: `c-${m.id}`,
      body: m.body,
      when: m.createdAt,
      label: m.senderRole === 'SYSTEM' ? 'System' : m.senderRole === 'CUSTOMER' ? 'Customer' : 'Care',
      system: m.senderRole === 'SYSTEM',
    })),
  ].sort((a, b) => new Date(a.when).getTime() - new Date(b.when).getTime())

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose?.()
      }}
    >
      <div className="flex max-h-[90vh] w-full max-w-[720px] flex-col overflow-hidden rounded-[14px] border border-[#e3e8e4] bg-white shadow-xl">
        <header className="flex items-start justify-between gap-3 border-b border-[#edf0ee] px-5 py-4">
          <div className="min-w-0">
            <h3 className="text-[16px] font-bold text-[#17231c]">
              {ticket?.displayCode || 'Support ticket'}
            </h3>
            <p className="mt-1 text-[12px] text-[#7c8780]">{ticket?.subject || '—'}</p>
            <p className="mt-1 text-[11px] text-[#536158]">
              Status: {ticket?.status || '—'}
              {detail?.conversationStatus
                ? ` · Conversation: ${detail.conversationStatus}`
                : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[20px] text-[#68716c] hover:bg-[#f1f3f1]"
            aria-label="Close"
          >
            ×
          </button>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {loading ? (
            <p className="text-center text-[13px] text-[#7c8780]">Loading ticket…</p>
          ) : null}
          {error ? <p className="text-[12px] text-[#d64044]">{error}</p> : null}

          {order ? (
            <section className="rounded-[10px] border border-[#eceeec] bg-[#fafbfa] p-3">
              <p className="text-[11px] font-bold uppercase tracking-wide text-[#8a948e]">Order</p>
              <p className="mt-1 text-[13px] font-semibold text-[#17231c]">
                #{order.orderNumber} · {order.orderType || '—'} · {order.status || '—'}
              </p>
              <p className="text-[12px] text-[#536158]">
                {order.vendor?.name || '—'}
                {order.vendor?.area ? ` · ${order.vendor.area}` : ''}
              </p>
              <p className="text-[12px] text-[#536158]">Total: {order.totalAmount || '—'}</p>
              {Array.isArray(order.items) && order.items.length > 0 ? (
                <ul className="mt-2 space-y-1 text-[12px] text-[#455249]">
                  {order.items.map((item) => (
                    <li key={item.id}>
                      {item.quantity}× {item.name} — {item.unitPrice}
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ) : null}

          <section>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-[#8a948e]">
              Conversation
            </p>
            <div className="space-y-2">
              {thread.length === 0 ? (
                <p className="text-[12px] text-[#7c8780]">No messages recorded.</p>
              ) : (
                thread.map((row) => (
                  <div
                    key={row.id}
                    className={`rounded-[10px] px-3 py-2 ${
                      row.system
                        ? 'border border-[#e8ebe9] bg-[#f6f7f6] text-center'
                        : 'border border-[#eceeec] bg-white'
                    }`}
                  >
                    {!row.system ? (
                      <p className="text-[9px] font-semibold uppercase tracking-wide text-[#929b95]">
                        {row.label}
                      </p>
                    ) : null}
                    <p className="text-[12px] leading-[1.45] text-[#354039]">{row.body}</p>
                    <p className="mt-1 text-[9px] text-[#929b95]">{formatWhen(row.when)}</p>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
