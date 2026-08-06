import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check } from 'lucide-react'
import { StatusPill } from '../../components/ui'
import OrderHistoryReceiptModal from '../../components/OrderHistoryReceiptModal'
import { useVendorBranches } from '../../hooks/vendor/useVendorBranches'
import { useVendorOrderHistory } from '../../hooks/vendor/useVendorOrderHistory'

const SEARCH_DEBOUNCE_MS = 300

const TYPE_OPTIONS = [
  { label: 'All types', value: '' },
  { label: 'Delivery', value: 'DELIVERY' },
  { label: 'Pickup', value: 'PICKUP' },
  { label: 'Dine-in', value: 'DINE_IN' },
  { label: 'Services', value: 'SERVICE' },
]

const STATUS_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Delivered', value: 'DELIVERED' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Collected', value: 'COLLECTED' },
  { label: 'Cancelled', value: 'CANCELLED' },
  { label: 'Rejected', value: 'REJECTED' },
]

const fieldLabelClass = 'text-[13px] font-medium text-ink-muted tracking-[0.02em] uppercase'
const selectClass =
  'h-10 border border-border rounded-[8px] px-3 flex items-center justify-between gap-2 text-xs bg-white whitespace-nowrap'

const thClass = 'text-left text-[10px] tracking-[0.02em] text-ink-muted font-bold uppercase'
const tdClass = 'text-[12px] text-ink'

function toStartIso(dateValue) {
  const raw = String(dateValue || '').trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return ''
  const date = new Date(`${raw}T00:00:00`)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString()
}

function toEndIso(dateValue) {
  const raw = String(dateValue || '').trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return ''
  const date = new Date(`${raw}T23:59:59.999`)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString()
}

function FilterSelect({ label, value, options, open, onToggle, onSelect, widthClass = 'w-[150px]', listRef }) {
  const selected = options.find((opt) => opt.value === value) || options[0]

  return (
    <div className="relative flex flex-col gap-1.5" ref={listRef}>
      <span className={fieldLabelClass}>{label}</span>
      <button
        type="button"
        className={`${selectClass} ${widthClass} cursor-pointer`}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={onToggle}
      >
        <span className={!value || value === 'all' ? 'text-ink-faint' : 'text-ink'}>
          {selected?.label || 'All'}
        </span>
        <span className="text-ink-muted text-[11px]">▾</span>
      </button>
      {open ? (
        <div
          className={`absolute top-[calc(100%+6px)] left-0 z-30 overflow-hidden rounded-[10px] border border-border bg-white shadow-[0_12px_28px_rgba(26,28,26,0.14)] ${widthClass}`}
          role="listbox"
          aria-label={label}
        >
          {options.map((option, idx) => {
            const isSelected = option.value === value
            return (
              <button
                key={option.value || option.label}
                type="button"
                role="option"
                aria-selected={isSelected}
                className={`flex w-full items-center justify-between px-3 py-[11px] text-left text-[13px] ${
                  idx > 0 ? 'border-t border-border' : ''
                } ${isSelected ? 'font-medium text-green-light-text' : 'font-medium text-ink hover:bg-[#f7f9f7]'}`}
                onClick={() => onSelect(option.value)}
              >
                <span>{option.label}</span>
                {isSelected ? (
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
  )
}

export default function OrdersHistory() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('')
  const [branchFilter, setBranchFilter] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [statusOpen, setStatusOpen] = useState(false)
  const [typeOpen, setTypeOpen] = useState(false)
  const [branchOpen, setBranchOpen] = useState(false)
  const [menuOrderId, setMenuOrderId] = useState(null)
  const [receiptOrder, setReceiptOrder] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  const statusRef = useRef(null)
  const typeRef = useRef(null)
  const branchRef = useRef(null)
  const menuRef = useRef(null)

  const { data: branchesData } = useVendorBranches()
  const branchOptions = useMemo(() => {
    const rows = Array.isArray(branchesData?.branches) ? branchesData.branches : []
    return [
      { label: 'All', value: '' },
      ...rows
        .map((branch) => ({
          label: String(branch.name || branch.id || 'Branch'),
          value: String(branch.id || ''),
        }))
        .filter((opt) => opt.value),
    ]
  }, [branchesData])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(query.trim())
    }, SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [query])

  const fromIso = toStartIso(fromDate)
  const toIso = toEndIso(toDate)

  const { data: orderHistory, error, isLoading, refetch } = useVendorOrderHistory({
    limit: 50,
    search: debouncedSearch,
    status: statusFilter,
    type: typeFilter,
    branchId: branchFilter || undefined,
    from: fromIso || undefined,
    to: toIso || undefined,
  })

  useEffect(() => {
    if (!statusOpen && !typeOpen && !branchOpen && !menuOrderId) return undefined

    function handlePointerDown(event) {
      if (statusOpen && statusRef.current && !statusRef.current.contains(event.target)) {
        setStatusOpen(false)
      }
      if (typeOpen && typeRef.current && !typeRef.current.contains(event.target)) {
        setTypeOpen(false)
      }
      if (branchOpen && branchRef.current && !branchRef.current.contains(event.target)) {
        setBranchOpen(false)
      }
      if (menuOrderId && menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOrderId(null)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [statusOpen, typeOpen, branchOpen, menuOrderId])

  const handleRefresh = useCallback(async () => {
    if (refreshing) return
    setRefreshing(true)
    try {
      await refetch()
    } finally {
      setRefreshing(false)
    }
  }, [refetch, refreshing])

  const rows = Array.isArray(orderHistory) ? orderHistory : []

  if (isLoading && !orderHistory) {
    return <div className="p-7 text-[13px] text-ink-muted">Loading order history…</div>
  }
  if (error && !orderHistory) {
    return (
      <div className="p-7 text-[13px] text-danger">
        Unable to load order history.{' '}
        <button type="button" onClick={handleRefresh} className="underline">
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
              <button type="button" onClick={handleRefresh} className="underline">
                Retry
              </button>
            </p>
          ) : null}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing || (isLoading && !orderHistory)}
            className="border border-border rounded-[8px] py-[10px] px-[18px] text-[13px] font-medium bg-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {refreshing ? 'Refreshing…' : '↻ Refresh'}
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
            aria-label="Search orders"
          />
        </div>

        <FilterSelect
          label="Status"
          value={statusFilter}
          options={STATUS_OPTIONS}
          open={statusOpen}
          listRef={statusRef}
          widthClass="w-[150px]"
          onToggle={() => {
            setStatusOpen((open) => !open)
            setTypeOpen(false)
            setBranchOpen(false)
          }}
          onSelect={(value) => {
            setStatusFilter(value)
            setStatusOpen(false)
          }}
        />

        <FilterSelect
          label="Type"
          value={typeFilter}
          options={TYPE_OPTIONS}
          open={typeOpen}
          listRef={typeRef}
          widthClass="w-[140px]"
          onToggle={() => {
            setTypeOpen((open) => !open)
            setStatusOpen(false)
            setBranchOpen(false)
          }}
          onSelect={(value) => {
            setTypeFilter(value)
            setTypeOpen(false)
          }}
        />

        <FilterSelect
          label="Branch"
          value={branchFilter}
          options={branchOptions}
          open={branchOpen}
          listRef={branchRef}
          widthClass="w-[170px]"
          onToggle={() => {
            setBranchOpen((open) => !open)
            setStatusOpen(false)
            setTypeOpen(false)
          }}
          onSelect={(value) => {
            setBranchFilter(value)
            setBranchOpen(false)
          }}
        />

        <div className="flex flex-col gap-1.5">
          <span className={fieldLabelClass}>From</span>
          <input
            type="date"
            className="h-10 w-[150px] border border-border rounded-[8px] px-3 text-xs bg-white text-ink"
            value={fromDate}
            max={toDate || undefined}
            onChange={(e) => {
              const next = e.target.value
              setFromDate(next)
              if (toDate && next && toDate < next) setToDate(next)
            }}
            aria-label="From date"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className={fieldLabelClass}>To</span>
          <input
            type="date"
            className="h-10 w-[150px] border border-border rounded-[8px] px-3 text-xs bg-white text-ink"
            value={toDate}
            min={fromDate || undefined}
            onChange={(e) => setToDate(e.target.value)}
            aria-label="To date"
          />
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
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 px-5 text-center text-[13px] text-ink-muted">
                    No orders found
                  </td>
                </tr>
              ) : (
                rows.map((order, idx) => {
                  const menuOpen = menuOrderId === order.id
                  return (
                    <tr
                      key={`${order.backendId || order.id}-${idx}`}
                      className={`${idx % 2 === 1 ? 'bg-[#fbfcfb]' : ''} border-t border-border`}
                    >
                      <td className="py-[15px] px-5 text-[12px] font-medium text-green-light-text">
                        {order.id}
                      </td>
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
