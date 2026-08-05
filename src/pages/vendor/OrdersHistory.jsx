import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check } from 'lucide-react'
import { StatusPill } from '../../components/ui'
import OrderHistoryReceiptModal from '../../components/OrderHistoryReceiptModal'
import { useVendorOrderHistory } from '../../hooks/vendor/useVendorOrderHistory'

const TYPE_OPTIONS = ['All types', 'Delivery', 'Pickup', 'Dine-in', 'Services']

const fieldLabelClass = 'text-[13px] font-medium text-ink-muted tracking-[0.02em] uppercase'
const selectClass =
  'h-10 border border-border rounded-[8px] px-3 flex items-center justify-between gap-2 text-xs text-ink-faint bg-white whitespace-nowrap'

const thClass = 'text-left text-[10px] tracking-[0.02em] text-ink-muted font-bold uppercase'
const tdClass = 'text-[12px] text-ink'

export default function OrdersHistory() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('All types')
  const [typeOpen, setTypeOpen] = useState(false)
  const [menuOrderId, setMenuOrderId] = useState(null)
  const [receiptOrder, setReceiptOrder] = useState(null)
  const typeRef = useRef(null)
  const menuRef = useRef(null)
  const { data: orderHistory, error, isLoading, refetch } = useVendorOrderHistory({ limit: 20 })

  useEffect(() => {
    if (!typeOpen && !menuOrderId) return undefined

    function handlePointerDown(event) {
      if (typeOpen && typeRef.current && !typeRef.current.contains(event.target)) {
        setTypeOpen(false)
      }
      if (menuOrderId && menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOrderId(null)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [typeOpen, menuOrderId])

  const filtered = (orderHistory || []).filter((o) => {
    const haystack = [o.id, o.branch, o.status, o.customer, o.orderNumber]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    const matchesQuery = !query.trim() || haystack.includes(query.trim().toLowerCase())
    const matchesType = typeFilter === 'All types' || o.type === typeFilter
    return matchesQuery && matchesType
  })

  if (isLoading && !orderHistory) {
    return <div className="p-7 text-[13px] text-ink-muted">Loading order history…</div>
  }
  if (error && !orderHistory) {
    return (
      <div className="p-7 text-[13px] text-danger">
        Unable to load order history.{' '}
        <button type="button" onClick={refetch} className="underline">
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="pt-[26px] px-[28px] pb-10">
      <div className="flex items-start justify-between mb-[22px]">
        <h1 className="text-[20px] font-bold text-ink">Orders</h1>
        <div className="flex items-center gap-2">
          {error ? (
            <p className="text-[12px] text-danger">
              Refresh failed.{' '}
              <button type="button" onClick={refetch} className="underline">
                Retry
              </button>
            </p>
          ) : null}
          <button
            type="button"
            onClick={() => refetch()}
            className="border border-border rounded-[8px] py-[10px] px-[18px] text-[13px] font-medium bg-white"
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      <div className="bg-white border border-border rounded-[14px] py-[18px] px-5 flex gap-4 mb-[22px] flex-wrap">
        <div className="flex-1 min-w-[160px] flex flex-col gap-1.5">
          <span className={fieldLabelClass}>Search</span>
          <input
            className="h-10 border border-border rounded-[8px] px-3 text-xs bg-white"
            placeholder="Order #, customer…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className={fieldLabelClass}>Status</span>
          <div className={`${selectClass} w-[150px]`}>
            <span>All</span>
            <span className="text-ink-muted text-[11px]">▾</span>
          </div>
        </div>
        <div className="relative flex flex-col gap-1.5" ref={typeRef}>
          <span className={fieldLabelClass}>Type</span>
          <button
            type="button"
            className={`${selectClass} w-[140px] cursor-pointer`}
            aria-haspopup="listbox"
            aria-expanded={typeOpen}
            onClick={() => setTypeOpen((open) => !open)}
          >
            <span className={typeFilter === 'All types' ? 'text-ink-faint' : 'text-ink'}>{typeFilter}</span>
            <span className="text-ink-muted text-[11px]">▾</span>
          </button>
          {typeOpen ? (
            <div
              className="absolute top-[calc(100%+6px)] left-0 z-30 w-[140px] overflow-hidden rounded-[10px] border border-border bg-white shadow-[0_12px_28px_rgba(26,28,26,0.14)]"
              role="listbox"
              aria-label="Order type"
            >
              {TYPE_OPTIONS.map((option, idx) => {
                const selected = option === typeFilter
                return (
                  <button
                    key={option}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    className={`flex w-full items-center justify-between px-3 py-[11px] text-left text-[13px] ${
                      idx > 0 ? 'border-t border-border' : ''
                    } ${selected ? 'font-medium text-green-light-text' : 'font-medium text-ink hover:bg-[#f7f9f7]'}`}
                    onClick={() => {
                      setTypeFilter(option)
                      setTypeOpen(false)
                    }}
                  >
                    <span>{option}</span>
                    {selected ? (
                      <span className="inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-green-primary">
                        <Check size={11} strokeWidth={3} className="text-white" />
                      </span>
                    ) : null}
                  </button>
                )
              })}
            </div>
          ) : null}
        </div>
        <div className="flex flex-col gap-1.5">
          <span className={fieldLabelClass}>Branch</span>
          <div className={`${selectClass} w-[170px]`}>
            <span>All</span>
            <span className="text-ink-muted text-[11px]">▾</span>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className={fieldLabelClass}>From</span>
          <div className={`${selectClass} w-[150px]`}>
            <span>mm/dd/yyyy</span>
          </div>
        </div>
      </div>

      <div className="bg-white border border-border rounded-[14px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#f9faf9]">
                <th className={`${thClass} py-3.5 px-5`}>ORDER #</th>
                <th className={`${thClass} py-3.5 px-5`}>TYPE</th>
                <th className={`${thClass} py-3.5 px-5`}>STATUS</th>
                <th className={`${thClass} py-3.5 px-5`}>BRANCH</th>
                <th className={`${thClass} py-3.5 px-5`}>CUSTOMER</th>
                <th className={`${thClass} py-3.5 px-5`}>WHEN</th>
                <th className={`${thClass} py-3.5 px-5`}>TOTAL</th>
                <th className={`${thClass} py-3.5 px-5`} />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 px-5 text-center text-[13px] text-ink-muted">
                    No orders found
                  </td>
                </tr>
              ) : (
                filtered.map((order, idx) => {
                  const menuOpen = menuOrderId === order.id
                  return (
                    <tr
                      key={`${order.backendId || order.id}-${idx}`}
                      className={`${idx % 2 === 1 ? 'bg-[#fbfcfb]' : ''} border-t border-border`}
                    >
                      <td className="py-[15px] px-5 text-[12px] font-medium text-green-light-text">{order.id}</td>
                      <td className={`${tdClass} py-[15px] px-5 text-ink-muted`}>{order.type}</td>
                      <td className="py-[15px] px-5">
                        <StatusPill status={order.status} />
                      </td>
                      <td className={`${tdClass} py-[15px] px-5`}>{order.branch}</td>
                      <td className={`${tdClass} py-[15px] px-5`}>{order.customer}</td>
                      <td className={`${tdClass} py-[15px] px-5 text-ink-muted`}>{order.when}</td>
                      <td className={`${tdClass} py-[15px] px-5 font-bold`}>{order.total}</td>
                      <td className="relative py-[15px] px-5 text-right">
                        <div className="inline-block" ref={menuOpen ? menuRef : null}>
                          <button
                            type="button"
                            className="h-7 w-7 rounded-[8px] text-lg font-bold text-ink-muted hover:bg-[#f5f7f5]"
                            aria-haspopup="menu"
                            aria-expanded={menuOpen}
                            aria-label={`Actions for ${order.id}`}
                            onClick={() => setMenuOrderId(menuOpen ? null : order.id)}
                          >
                            ⋮
                          </button>
                          {menuOpen ? (
                            <div
                              className="absolute right-5 top-[calc(100%-8px)] z-30 w-[148px] overflow-hidden rounded-[10px] border border-border bg-white shadow-[0_12px_28px_rgba(26,28,26,0.14)]"
                              role="menu"
                            >
                              <button
                                type="button"
                                role="menuitem"
                                className="flex w-full px-3.5 py-2.5 text-left text-[13px] font-medium text-ink hover:bg-[#f7f9f7]"
                                onClick={() => {
                                  setMenuOrderId(null)
                                  const detailId = order.backendId || order.id
                                  navigate(`/orders-history/${encodeURIComponent(detailId)}`)
                                }}
                              >
                                Order details
                              </button>
                              <button
                                type="button"
                                role="menuitem"
                                className="flex w-full border-t border-border px-3.5 py-2.5 text-left text-[13px] font-medium text-ink hover:bg-[#f7f9f7]"
                                onClick={() => {
                                  setMenuOrderId(null)
                                  setReceiptOrder(order)
                                }}
                              >
                                Receipt
                              </button>
                            </div>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <OrderHistoryReceiptModal
        open={Boolean(receiptOrder)}
        onClose={() => setReceiptOrder(null)}
        orderId={receiptOrder?.backendId || null}
        order={receiptOrder}
      />
    </div>
  )
}
