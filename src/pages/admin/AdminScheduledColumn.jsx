import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Bell, Check, Search, Zap } from 'lucide-react'
import motoBike from '../../assets/moto_bike.png'
import { useAdminScheduledBoard } from '../../hooks/admin/useAdminScheduledBoard'
import { ApiState } from '../../components/admin/ApiState'
import { AdminOrderDetailModal } from './operations/AdminLiveOrdersPage'

const cn = (...parts) => parts.filter(Boolean).join(' ')

const FILTER_CLASS = 'inline-flex h-[34px] items-center gap-1 rounded-[8px] border border-[#dfe4e0] bg-white px-3 text-[11px] font-medium text-[#455249]'
const SEARCH_CLASS = 'flex h-[34px] min-w-[200px] flex-1 items-center gap-2 rounded-[8px] border border-[#dfe4e0] bg-white px-3'
const PILL_FILTER = 'inline-flex h-[32px] items-center gap-1 rounded-full border border-[#dfe4e0] bg-white px-3 text-[10px] font-medium text-[#455249]'

const columnMeta = {
  new: {
    title: 'New',
    tone: '#20b665',
    subtitle: 'Vendor accepted — assign date, time & champ',
    action: { label: 'Auto-assign all eligible', tone: 'green', icon: 'zap' },
  },
  response: {
    title: 'Awaiting champ response',
    tone: '#dfa52b',
    subtitle: 'Champ assigned — waiting to accept the job',
    action: { label: 'Remind all champs', tone: 'amber', icon: 'bell' },
  },
  confirmation: {
    title: 'Awaiting champ confirmation',
    tone: '#dfa52b',
    subtitle: 'Accepted — re-confirm 3h before the window',
    action: { label: 'Remind all champs', tone: 'amber', icon: 'bell' },
  },
  confirmed: {
    title: 'Confirmed',
    tone: '#20b665',
    subtitle: 'Locked — auto-moves to tracking 1h before window',
    action: { label: 'Export', tone: 'white' },
  },
}

function typeBadgeClass(tag) {
  if (tag === 'Standard') return 'bg-[#fff3d6] text-[#9a6d12]'
  if (tag === 'Same Day') return 'bg-[#e5f0ff] text-[#2978db]'
  if (tag === 'Next Day') return 'bg-[#eee8ff] text-[#734dbf]'
  if (tag === 'Economy') return 'bg-[#eff2f0] text-[#667069]'
  return 'bg-[#eff2f0] text-[#667069]'
}

function statusBadge(order) {
  const payment = order.payment || ''
  if (payment === 'Declined') return { label: 'Declined', tone: 'bg-[#fdebec] text-[#c54749]' }
  if (payment.toLowerCase().includes('expired')) return { label: 'No response', tone: 'bg-[#fdebec] text-[#c54749]' }
  if (order.bannerTone === 'danger') return { label: 'No response', tone: 'bg-[#fdebec] text-[#c54749]' }
  if (order.column === 'confirmed') return { label: 'Accepted ✓', tone: 'bg-[#e5f5eb] text-[#24834e]' }
  if (order.column === 'new' && payment.includes('Paid')) return { label: 'Vendor accepted', tone: 'bg-[#e5f5eb] text-[#24834e]' }
  if (order.column === 'new' && (payment.includes('vendor') || payment.includes('payment'))) {
    return { label: 'Awaiting vendor', tone: 'bg-[#fff3d6] text-[#9a6d12]' }
  }
  return { label: 'Awaiting', tone: 'bg-[#fff3d6] text-[#9a6d12]' }
}

function ColumnOrderCard({ order, onAssign, onOrderClick }) {
  const status = statusBadge(order)
  const typeTag = order.tags?.find((tag) => !tag.includes('Special') && tag !== 'Normal' && tag !== 'Incident' && tag !== 'Champ')
    || order.deliverySpeedLabel
    || 'Standard'
  const isSpecial = order.tags?.some((tag) => tag.includes('Special')) || order.priorityLabel === 'Special'
  const actionCode = order.actionCode

  const showAssign = actionCode === 'ASSIGN_DATE_TIME_CHAMP'
  const showRemind = actionCode === 'REMIND_CHAMP'
  const showReassign = actionCode === 'REASSIGN_CHAMP'
  const showBanner = Boolean(order.timer)
  const showForcePickup = Boolean(order.footer)
  const canOpenDetails = typeof onOrderClick === 'function'

  return (
    <article
      role={canOpenDetails ? 'button' : undefined}
      tabIndex={canOpenDetails ? 0 : undefined}
      onClick={canOpenDetails ? () => onOrderClick(order) : undefined}
      onKeyDown={canOpenDetails ? (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onOrderClick(order)
        }
      } : undefined}
      className={cn(
        'rounded-[12px] border border-[#e4e8e4] bg-white p-4 shadow-[0_1px_3px_rgba(20,40,28,.05)]',
        canOpenDetails && 'cursor-pointer transition hover:border-[#c9d2cc] hover:shadow-[0_2px_8px_rgba(20,40,28,.08)]',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <b className="text-[13px] font-bold text-[#17231c]">{order.id}</b>
        <span className={cn('rounded-[6px] px-2 py-0.5 text-[10px] font-medium', status.tone)}>{status.label}</span>
      </div>

      {order.column === 'new' && (order.payment?.includes('Paid') || order.payment?.includes('payment') || order.payment?.includes('vendor')) ? (
        <div className={cn(
          'mt-2.5 rounded-full px-2.5 py-1.5 text-[10px] font-medium',
          order.payment.includes('Paid') ? 'bg-[#e5f5eb] text-[#24834e]' : 'bg-[#fff3d6] text-[#9a6d12]',
        )}>
          {order.payment.includes('Paid') ? order.payment : order.payment.includes('payment') ? 'Awaiting customer payment' : 'Awaiting vendor acceptance'}
        </div>
      ) : null}

      {order.column === 'confirmed' && (order.payment === 'Preparing' || order.payment === 'Ready for pickup') ? (
        <div className={cn(
          'mt-2.5 flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[10px] font-medium',
          order.payment === 'Preparing' ? 'bg-[#fff3d6] text-[#9a6d12]' : 'bg-[#e5f5eb] text-[#24834e]',
        )}>
          {order.payment === 'Preparing' ? <span aria-hidden="true">🍲</span> : <Check size={11} strokeWidth={3} />}
          {order.payment}
        </div>
      ) : null}

      <div className={cn(
        'mt-2.5 rounded-full px-2.5 py-1.5 text-[10px] font-medium',
        isSpecial ? 'bg-[#f2edfc] text-[#8f4da0]' : 'bg-[#f3f5f3] text-[#6f7973]',
      )}>
        {isSpecial ? '★ Special' : 'Normal'}
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        <span className={cn('rounded-full px-2.5 py-0.5 text-[10px] font-medium', typeBadgeClass(typeTag))}>{typeTag}</span>
        <span className="text-[11px] font-medium text-[#78827c]">{order.slot || '—'}</span>
      </div>

      <p className="mt-2.5 text-[12px] font-bold text-[#17231c]">{order.route}</p>
      <p className="mt-1.5 text-[11px] text-[#8a948e]">Prep {order.prep || '—'}</p>
      <p className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-[#17231c]">
        <img src={motoBike} alt="" className="h-3.5 w-3.5 object-contain" />
        {order.champ || 'Unassigned'}
      </p>

      {showRemind ? (
        <button
          type="button"
          onClick={(event) => event.stopPropagation()}
          className="mt-3.5 flex h-[32px] w-full items-center justify-center gap-1.5 rounded-[8px] border border-[#dfe4e0] bg-white text-[11px] font-medium text-[#17231c]"
        >
          <Bell size={13} className="text-[#e0a020]" /> Remind champ
        </button>
      ) : null}

      {showReassign ? (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onAssign?.(order)
          }}
          className="mt-3.5 h-[32px] w-full rounded-[8px] bg-[#e12e32] text-[11px] font-medium text-white hover:brightness-[0.97]"
        >
          Reassign champ
        </button>
      ) : null}

      {showAssign && order.action ? (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onAssign?.(order)
          }}
          className={cn(
            'mt-3.5 h-[32px] w-full rounded-[8px] text-[11px] font-medium',
            order.actionTone === 'green' && 'bg-[#19ad5b] text-white',
            order.actionTone === 'red' && 'bg-[#e12e32] text-white',
            !order.actionTone && 'border border-[#dfe4e0] bg-white text-[#17231c]',
          )}
        >
          {order.action}
        </button>
      ) : null}

      {showBanner ? (
        <div className={cn(
          'mt-2 rounded-[8px] px-2.5 py-2 text-center text-[10px] font-medium',
          order.bannerTone === 'danger' ? 'bg-[#fdebec] text-[#c54749]' : 'bg-[#fff3d7] text-[#9c6b14]',
        )}>
          {order.timer}
        </div>
      ) : null}

      {showForcePickup ? (
        <button
          type="button"
          onClick={(event) => event.stopPropagation()}
          className="mt-2 h-[30px] w-full rounded-[8px] bg-[#ff940f] text-[11px] font-medium text-white"
        >
          {order.footer}
        </button>
      ) : null}
    </article>
  )
}

export function AdminScheduledColumn() {
  const { columnKey } = useParams()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const { data, error, isLoading, refetch } = useAdminScheduledBoard({
    sort: 'time_left',
    limit: 50,
  })
  const meta = columnMeta[columnKey]

  const orders = useMemo(() => {
    if (!data?.orders) return []
    return data.orders.filter((order) => {
      if (order.column !== columnKey) return false
      if (!query.trim()) return true
      return [order.id, order.route, order.champ, ...(order.tags || [])].join(' ').toLowerCase().includes(query.toLowerCase())
    })
  }, [data, columnKey, query])

  const openAssignChamp = (order) => {
    const orderId = order?.orderId || String(order?.id || '').replace(/^#/, '')
    if (!orderId) return
    navigate(`/admin/scheduled/assign/${encodeURIComponent(orderId)}`)
  }

  if (!data) {
    return <ApiState isLoading={isLoading} error={error} onRetry={refetch} />
  }

  if (!meta) {
    return (
      <div className="p-7">
        <Link to="/admin/scheduled" className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#16854a] hover:underline">
          <ArrowLeft size={14} /> Back to pipeline
        </Link>
        <p className="mt-4 text-[13px] text-[#78837c]">Column not found.</p>
      </div>
    )
  }

  const ActionIcon = meta.action.icon === 'zap' ? Zap : meta.action.icon === 'bell' ? Bell : null

  return (
    <div className="px-7 pb-8 pt-[18px] max-[700px]:p-4">
      <Link to="/admin/scheduled" className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#16854a] hover:underline">
        <ArrowLeft size={14} /> Back to pipeline
      </Link>

      <div className="mt-3 mb-4">
        <h2 className="flex items-center gap-2 text-[20px] font-bold tracking-[-0.02em]">
          {meta.title}
          <span
            className="grid h-[22px] min-w-[22px] place-items-center rounded-full px-1.5 text-[11px] font-bold text-white"
            style={{ background: meta.tone }}
          >
            {orders.length}
          </span>
        </h2>
        <p className="mt-1 text-[12px] text-[#7c8780]">{meta.subtitle}</p>
      </div>

      <div className="mb-2.5 flex flex-wrap items-center gap-2">
        <label className={SEARCH_CLASS}>
          <Search size={14} className="text-[#89938c]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="min-w-0 flex-1 border-0 bg-transparent text-[12px] outline-none"
            placeholder="Search orders, vendors, champs…"
          />
        </label>
        <button type="button" className={FILTER_CLASS}>Sort: Window ▾</button>
        <button type="button" className={FILTER_CLASS}>Filter: All ▾</button>
        <button
          type="button"
          className={cn(
            'inline-flex h-[34px] items-center gap-1.5 rounded-[8px] px-3.5 text-[11px] font-medium',
            meta.action.tone === 'green' && 'bg-[#19ad5b] text-white',
            meta.action.tone === 'amber' && 'border border-[#f0dfb0] bg-[#fff3d6] text-[#a06d16]',
            meta.action.tone === 'white' && 'border border-[#dfe4e0] bg-white text-[#455249]',
          )}
        >
          {ActionIcon ? <ActionIcon size={13} /> : null}
          {meta.action.label}
        </button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <label className="flex h-[32px] min-w-[150px] items-center gap-2 rounded-full border border-[#dfe4e0] bg-white px-3">
          <Search size={12} className="text-[#89938c]" />
          <input className="min-w-0 flex-1 border-0 bg-transparent text-[11px] outline-none" placeholder="Search…" />
        </label>
        {['Vendor · All', 'Zone · All', 'Type · All', 'Champ · All'].map((filter) => (
          <button key={filter} type="button" className={PILL_FILTER}>
            {filter}▾
          </button>
        ))}
        <span className="flex-1" />
        <button type="button" className={PILL_FILTER}>
          Sort · Time left▾
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-[12px] border border-[#e4e8e4] bg-white p-8 text-center text-[12px] text-[#78837c]">No orders in this column</div>
      ) : (
        <div className="grid grid-cols-4 gap-3.5 max-[1200px]:grid-cols-3 max-[900px]:grid-cols-2 max-[560px]:grid-cols-1">
          {orders.map((order, index) => (
            <ColumnOrderCard
              key={`${order.id}-${index}`}
              order={order}
              onAssign={openAssignChamp}
              onOrderClick={setSelectedOrder}
            />
          ))}
        </div>
      )}

      {selectedOrder ? (
        <AdminOrderDetailModal
          order={selectedOrder}
          preference="scheduled"
          onClose={() => setSelectedOrder(null)}
        />
      ) : null}
    </div>
  )
}
