import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowDownRight,
  ArrowUpRight,
  Bike,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  Clock3,
  Download,
  Eye,
  Filter,
  Flame,
  MoreHorizontal,
  MoreVertical,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Store,
  TriangleAlert,
  Users,
  WalletCards,
  Zap,
  Copy,
} from 'lucide-react'
import motoBike from '../../assets/moto_bike.png'
import { useApiResource } from '../../hooks/useApiResource'
import { adminService } from '../../services/adminService'

const cn = (...parts) => parts.filter(Boolean).join(' ')

function Button({ children, primary = false, className = '', ...props }) {
  return (
    <button
      className={cn(
        'inline-flex h-[34px] items-center justify-center gap-2 rounded-md border px-3 text-[11px] font-medium transition',
        primary
          ? 'border-[#118446] bg-[#118446] text-white hover:bg-[#0d713b]'
          : 'border-[#dfe4e0] bg-white text-[#455249] hover:bg-[#f6f8f6]',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

function Badge({ children, tone = 'green' }) {
  const tones = {
    green: 'bg-[#e8f7ed] text-[#147940]',
    yellow: 'bg-[#fff5d9] text-[#9a6510]',
    red: 'bg-[#fdebea] text-[#bf3c36]',
    blue: 'bg-[#eaf2fc] text-[#2b66a5]',
    gray: 'bg-[#eff2f0] text-[#637068]',
    purple: 'bg-[#f1eafe] text-[#7752a8]',
  }
  return <span className={cn('inline-flex rounded-full px-2 py-1 text-[10px] font-medium', tones[tone])}>{children}</span>
}

function ApiState({ isLoading, error, onRetry }) {
  if (isLoading) return <div className="p-7 text-[12px] text-[#78837c]">Loading…</div>
  if (error) {
    return (
      <div className="m-7 rounded-lg border border-[#f2cccc] bg-[#fff5f5] p-4 text-[12px] text-[#a93e42]">
        Unable to load this page.
        <button onClick={onRetry} className="ml-2 font-medium underline">Try again</button>
      </div>
    )
  }
  return null
}

function Toolbar({ placeholder = 'Search…', action = 'Export', onSearch }) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-[#e9ecea] bg-white p-3">
      <label className="flex h-[34px] min-w-[230px] flex-1 items-center gap-2 rounded-md border border-[#dfe4e0] px-3">
        <Search size={14} className="text-[#89938c]" />
        <input onChange={(e) => onSearch?.(e.target.value)} className="min-w-0 flex-1 border-0 bg-transparent text-xs outline-none" placeholder={placeholder} />
      </label>
      <Button><Filter size={14} /> Filters</Button>
      <Button><CalendarDays size={14} /> Today <ChevronDown size={12} /></Button>
      <Button><Download size={14} /> {action}</Button>
    </div>
  )
}

function DashboardKpiStrip({ items }) {
  return (
    <section
      aria-label="Live order summary"
      className="grid h-[58px] grid-cols-9 rounded-[11px] border border-[#e4e8e4] bg-white shadow-[0_1px_3px_rgba(20,40,28,.04)] max-[700px]:h-auto max-[700px]:grid-cols-3"
    >
      {items.map(({ value, label, tone }, index) => (
        <div
          key={label}
          className="relative flex min-w-0 flex-col items-center justify-center px-1"
        >
          <strong className={cn('text-[20px] font-bold leading-5', tone === 'red' ? 'text-[#df4a4e]' : 'text-[#17231c]')}>
            {value}
          </strong>
          <span className="max-w-full truncate text-[11px] font-medium leading-3 text-[#717c75]">{label}</span>
          {index < items.length - 1 ? (
            <ChevronRight
              aria-hidden="true"
              size={14}
              strokeWidth={1.4}
              className="absolute right-[-4px] top-1/2 -translate-y-1/2 text-[#dfe3df]"
            />
          ) : null}
        </div>
      ))}
    </section>
  )
}

export function AdminDashboard() {
  const { data, error, isLoading, refetch } = useApiResource(() => adminService.getDashboard(), [])
  if (!data) return <ApiState isLoading={isLoading} error={error} onRetry={refetch} />

  return (
    <div className="px-4 pb-5 pt-2 max-[700px]:px-3">
      <DashboardKpiStrip items={data.summary} />

      <div className="mt-4 grid grid-cols-[minmax(0,2.3fr)_minmax(260px,1fr)] items-start gap-4 max-[900px]:grid-cols-1">
        <section className="h-[407px] rounded-xl border border-[#e4e8e4] bg-white p-3 shadow-[0_1px_2px_rgba(20,40,28,.025)]">
          <div className="flex h-[20px] items-center justify-between">
            <h2 className="text-[16px] font-bold leading-4">Live map</h2>
            <div className="flex items-center gap-1 text-[11px] font-medium text-[#6f7a73]">
              {data.map.tabs.map((tab) => (
                <button key={tab} className={cn('rounded px-2 py-1', data.map.activeTabs.includes(tab) && 'bg-[#edf8f0] text-[#168247]')}>{tab}</button>
              ))}
            </div>
          </div>
          <div className="relative mt-1 h-[347px] overflow-hidden rounded-lg bg-[#e9eeea]">
            <div className="absolute bottom-2 left-2 flex items-center gap-2 rounded-md bg-white/95 px-2.5 py-1.5 text-[11px] font-medium text-[#667269] shadow-sm">
              {data.map.legend.map((item) => (
                <span key={item.label}><i className="mr-1 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />{item.label}</span>
              ))}
            </div>
          </div>
          <p className="mt-1 text-[10px] font-normal text-[#a1a8a3]">{data.map.scopeNote}</p>
        </section>

        <section className="h-[360px] overflow-hidden rounded-xl border border-[#dfe4e0] bg-white px-[14px] shadow-[0_1px_2px_rgba(20,40,28,.025)]">
          <div className="flex h-[44px] items-center gap-1.5 px-0.5">
            <ShieldAlert size={14} strokeWidth={2} className="text-[#d46763]" />
            <h2 className="text-[14px] font-bold">Incidents Log</h2>
          </div>
          {data.incidents.map(({ priority, title, detail, tone }) => (
            <div key={title} className="flex h-[63px] items-center border-b border-[#e2e6e3] px-0.5">
              <span className={cn(
                'mr-2.5 grid h-[19px] w-8 shrink-0 place-items-center rounded-md text-[10px] font-medium',
                tone === 'red' && 'bg-[#fdebec] text-[#d64044]',
                tone === 'yellow' && 'bg-[#fff4d9] text-[#c78a18]',
                tone === 'blue' && 'bg-[#eaf2fb] text-[#3974ad]',
                tone === 'gray' && 'bg-[#f0f2f0] text-[#737d77]',
              )}>{priority}</span>
              <div className="min-w-0">
                <p className="truncate text-[12px] font-bold leading-[15px] text-[#202722]">{title}</p>
                <p className="truncate text-[10px] font-normal leading-[14px] text-[#77827b]">{detail}</p>
              </div>
            </div>
          ))}
        </section>
      </div>

      <div className="mt-[18px] grid grid-cols-3 gap-8 max-[700px]:grid-cols-1">
        {data.slaColumns.map((column) => (
          <section key={column.title} className="min-w-0">
            <div className="flex h-[25px] items-center gap-1.5 px-2 text-[11px] font-medium">
              <div className={cn(
                'inline-flex h-5 items-center gap-1 rounded-md px-1.5',
                column.tone === 'red' && 'bg-[#fff0ed] text-[#d34b4d]',
                column.tone === 'yellow' && 'bg-[#fff5d9] text-[#b27b17]',
                column.tone === 'green' && 'bg-[#edf7f0] text-[#32815a]',
              )}>
                {column.tone === 'red' ? <Flame size={11} fill="currentColor" className="text-[#e59028]" /> : null}
                {column.tone === 'yellow' ? <TriangleAlert size={11} fill="currentColor" className="text-[#d99820]" /> : null}
                {column.tone === 'green' ? <ShieldCheck size={11} fill="currentColor" className="text-[#58a980]" /> : null}
                <span>{column.title}</span>
              </div>
              <strong className={column.tone === 'red' ? 'text-[#d34b4d]' : column.tone === 'yellow' ? 'text-[#b27b17]' : 'text-[#32815a]'}>{column.count}</strong>
            </div>
            {column.orders.length ? (
              <div className="mt-1.5 space-y-2.5">
                {column.orders.map(({ id, detail, timeLeft }) => (
                  <article key={id} className="h-[74px] rounded-[8px] border border-[#e5e8e5] bg-white px-2.5 py-2 shadow-[0_1px_3px_rgba(20,40,28,.04)]">
                    <div className="flex items-center justify-between">
                      <strong className="text-[11px] font-medium leading-3 tracking-[.02em]">{id}</strong>
                      <span className={cn('flex items-center gap-0.5 text-[11px] font-medium leading-3', column.tone === 'red' ? 'text-[#d34b4d]' : 'text-[#b27b17]')}>
                        <Clock3 size={12} strokeWidth={1.8} />
                        {timeLeft}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] font-medium leading-3 text-[#727c76]">{detail}</p>
                    <span className={cn('mt-1 inline-block rounded px-1.5 py-0.5 text-[11px] font-medium leading-3', column.tone === 'red' ? 'bg-[#fdecec] text-[#d44749]' : 'bg-[#fff4dc] text-[#b67f17]')}>Incident</span>
                  </article>
                ))}
              </div>
            ) : (
              <p className="mt-1.5 px-2 text-[11px] font-medium text-[#a0a7a2]">No orders</p>
            )}
          </section>
        ))}
      </div>
    </div>
  )
}

function orderTagClass(tag) {
  if (tag.includes('Special')) return 'rounded-full bg-[#f2edfc] px-1.5 py-0.5 text-[#8f4da0]'
  if (tag === 'Normal') return 'text-[#6f7973]'
  if (tag === 'Standard') return 'rounded-full bg-[#fff3d6] px-1.5 py-0.5 text-[#9a6d12]'
  if (tag === 'Same Day') return 'rounded-full bg-[#e5f0ff] px-1.5 py-0.5 text-[#2978DB]'
  if (tag === 'Next Day') return 'rounded-full bg-[#eee8ff] px-1.5 py-0.5 text-[#734DBF]'
  if (tag === 'Economy') return 'rounded-full bg-[#eff2f0] px-1.5 py-0.5 text-[#667069]'
  return 'rounded-full bg-[#eff2f0] px-1.5 py-0.5 text-[#667069]'
}

function OrderPaymentBadge({ payment }) {
  const expired = payment.toLowerCase().includes('expired')
  const declined = payment === 'Declined'
  const preparing = payment === 'Preparing'
  const readyPickup = payment === 'Ready for pickup'
  const paidReady = payment.includes('Paid') || payment.includes('Ready for dispatch')
  const awaiting = payment.includes('Awaiting') || payment.includes('payment')

  let tone = 'bg-[#fff3d6] text-[#9a6d12]'
  if (expired || declined) tone = 'bg-[#fdebec] text-[#c54749]'
  else if (paidReady || readyPickup) tone = 'bg-[#e5f5eb] text-[#24834e]'
  else if (preparing || awaiting) tone = 'bg-[#fff3d6] text-[#9a6d12]'

  return (
    <div className="mt-1.5">
      <span className={cn('inline-flex max-w-full items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-medium', tone)}>
        {preparing ? <span aria-hidden="true">🍲</span> : null}
        {readyPickup ? <Check size={9} strokeWidth={3} /> : null}
        <span className="truncate">{payment}</span>
      </span>
    </div>
  )
}

function OrderCard({ order, mode }) {
  const actionStyles = {
    green: 'border-[#19ad5b] bg-[#19ad5b] text-white',
    red: 'border-[#e12e32] bg-[#e12e32] text-white',
    redSoft: 'border-[#fde5e5] bg-[#fde5e5] text-[#bd3b3e]',
    blue: 'border-[#dcecf8] bg-[#e8f3fb] text-[#35729d]',
  }
  return (
    <article className="rounded-[12px] border border-[#e1e5e2] bg-white p-[11px] shadow-[0_1px_2px_rgba(20,40,28,.04)]">
      <div className="flex items-start justify-between gap-2">
        <b className="text-[11px]">{order.id}</b>
        <div className="flex flex-wrap items-center justify-end gap-1">
          {order.tags.map((tag) => (
            <span key={tag} className={cn('text-[9px] font-medium', orderTagClass(tag))}>{tag}</span>
          ))}
        </div>
      </div>
      <OrderPaymentBadge payment={order.payment} />
      <p className="mt-1.5 text-[10px] font-medium">{order.route}</p>
      {order.slot ? <p className="mt-1 text-[9px] text-[#78827c]">{order.slot}</p> : null}
      {order.champ ? <p className="mt-1 text-[9px] text-[#536158]">♟ {order.champ}</p> : null}
      {order.action ? <button className={cn('mt-2 h-[26px] w-full rounded-[8px] border text-[9px] font-medium', order.actionTone ? actionStyles[order.actionTone] : 'border-[#dfe4e0] bg-white text-[#4e5a52]')}>{order.action}</button> : null}
      {order.timer ? <div className="mt-1.5 rounded-[8px] bg-[#fff3d7] px-2 py-1.5 text-center text-[9px] font-medium text-[#9c6b14]">{order.timer}</div> : null}
      {order.note ? <p className="mt-1 text-[9px] leading-tight text-[#8a938d]">{order.note}</p> : null}
      {order.footer ? <button className="mt-1.5 h-[24px] w-full rounded-[8px] bg-[#ff940f] text-[9px] font-medium text-white">{order.footer}</button> : null}
    </article>
  )
}

function AdminLiveOrderCard({ order, tone, onIncidentClick, onContactClick, onOrderClick }) {
  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onOrderClick?.(order)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onOrderClick?.(order)
        }
      }}
      className="h-[112px] cursor-pointer rounded-[9px] border border-[#dde3df] bg-white p-2.5 shadow-[0_1px_2px_rgba(20,40,28,.03)] transition hover:border-[#a9cdb5] hover:shadow-[0_3px_8px_rgba(20,40,28,.08)] focus:outline-none focus:ring-2 focus:ring-[#1a9b53]/20"
    >
      <div className="flex items-center gap-2">
        <strong className="min-w-0 flex-1 truncate text-[11px] font-bold">{order.id}</strong>
        <span className={cn(
          'shrink-0 text-[9px] font-medium',
          order.temperature === 'Hot food'
            ? 'rounded-full bg-[#fff0e8] px-1.5 py-0.5 text-[#ff5b2d]'
            : 'text-[#6f7973]',
        )}>{order.temperature}</span>
        {order.schedule ? <span className="rounded bg-[#eee8ff] px-1 text-[9px] font-medium text-[#7055aa]">{order.schedule}</span> : null}
        <span className={cn('flex items-center gap-0.5 text-[10px] font-medium', tone === 'red' ? 'text-[#d13f45]' : tone === 'yellow' ? 'text-[#c68618]' : 'text-[#c68618]')}>
          <Clock3 size={11} /> {order.timeLeft}
        </span>
      </div>
      <p className="mt-1.5 truncate text-[11px] font-bold">{order.vendor}</p>
      <div className="mt-1 flex items-center gap-1.5">
        <span className={cn(
          'max-w-[112px] truncate rounded-md px-2 py-1 text-[9px] font-medium',
          order.state.startsWith('Preparing') && 'bg-[#fff3d8] text-[#a97013]',
          order.state.startsWith('Ready') && 'bg-[#e4efff] text-[#3470ae]',
          order.state.startsWith('Picked') && 'bg-[#e4efff] text-[#3470ae]',
          order.state.startsWith('On the way') && 'bg-[#e5f5eb] text-[#24834e]',
        )}>{order.state}</span>
      </div>
      <div className="mt-1 flex items-center gap-1.5">
        {order.hasIncident ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              onIncidentClick?.(order)
            }}
            className="rounded-[9px] bg-[#fdebec] px-2 py-1 text-[9px] font-medium text-[#DB2626] transition hover:bg-[#f9d9da] focus:outline-none focus:ring-2 focus:ring-danger/25"
          >
            Incident
          </button>
        ) : null}
        {order.contactType ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              onContactClick?.(order)
            }}
            className={cn(
              'rounded-[9px] px-2 py-1 text-[9px] font-medium transition hover:brightness-95',
              order.contactType === 'Champ' ? 'bg-[#e5efff] text-[#3470ae]' : 'bg-[#eee8ff] text-[#7454ad]',
            )}
          >
            💬 {order.contactType}
          </button>
        ) : null}
      </div>
      <p className="mt-1 flex items-center gap-1 truncate text-[9px] font-medium text-[#2f3933]">
        <img src={motoBike} alt="" className="h-3 w-3 shrink-0 object-contain" />
        <span className="truncate">{order.rider.name}</span>
      </p>
    </article>
  )
}

function AdminOrderDetailModal({ order, onClose }) {
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  if (!order) return null

  const timeline = [
    ['Placed', '12:02', 'done'],
    ['Accepted', '12:05', 'done'],
    ['Preparing', '12:08', 'active'],
    ['Ready', 'pending', 'pending'],
    ['Picked up', 'pending', 'pending'],
    ['Delivered', 'pending', 'pending'],
  ]
  const people = [
    { title: 'Customer', rows: [['Name', 'Aisha Mohammed'], ['Phone', '+973 3401 2233'], ['Address', 'Blk 0322, Manama']] },
    { title: 'Vendor', rows: [['Store', order.vendor], ['Branch', 'Adliya'], ['Phone', '+973 1700 8800']] },
    { title: 'Champ', rows: [['Name', order.rider.name], ['Vehicle', 'Bike'], ['Status', 'On delivery']] },
  ]

  return (
    <div
      className="fixed inset-0 z-110 flex items-center justify-center overflow-y-auto bg-[rgba(20,25,22,.47)] p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-order-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="flex max-h-[calc(100vh-32px)] w-full max-w-[505px] flex-col overflow-hidden rounded-lg bg-white shadow-[0_16px_44px_rgba(8,18,12,.28)]">
        <div className="overflow-y-auto p-[14px]">
          <header className="relative pr-8">
            <div className="flex flex-wrap items-center gap-2">
              <h2 id="admin-order-title" className="text-[13px] font-bold">Order #{order.id}</h2>
              <Badge tone="yellow">Preparing</Badge>
              <span className="rounded-full bg-[#fff0e8] px-2 py-1 text-[9px] font-medium text-[#e36831]">Hot food</span>
            </div>
            <p className="mt-1 text-[9px] text-[#818a84]">{order.vendor} · on demand · placed 12:02</p>
            <button type="button" onClick={onClose} aria-label="Close order details" className="absolute -right-1 -top-1 grid h-7 w-7 place-items-center rounded-full text-[19px] font-light text-[#77817b] hover:bg-[#f1f3f1]">×</button>
          </header>

          <div className="mt-2 flex gap-1.5">
            <Badge tone="blue">Stage: Preparing</Badge>
            <Badge tone="yellow">ETA 41m</Badge>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2 max-[520px]:grid-cols-1">
            <section className="rounded-md border border-[#dfe4e0] p-2.5">
              <h3 className="text-[10px] font-bold">Order details</h3>
              <div className="mt-2 grid grid-cols-2 gap-x-5 gap-y-1 text-[9px]">
                {[['Items', '3 items'], ['Order value', 'BHD 8.400'], ['Payment', 'Card · paid'], ['Distance', '3.2 km'], ['Pickup', `${order.vendor}, Adliya`], ['Drop-off', 'Blk 0322, Manama']].map(([label, value]) => (
                  <div key={label}><p className="text-[#7d8781]">{label}</p><p className="font-medium">{value}</p></div>
                ))}
              </div>
              <h4 className="mt-2 text-[9px] font-medium">Items</h4>
              <div className="mt-1 space-y-1 text-[9px]">
                {[['Chicken Biryani ×1', 'BHD 3.500'], ['Garlic bread ×2', 'BHD 2.400'], ['Coke 330ml ×2', 'BHD 1.000'], ['Side salad ×1', 'BHD 0.500']].map(([name, price]) => (
                  <div key={name} className="flex justify-between gap-3"><span>{name}</span><b>{price}</b></div>
                ))}
              </div>
              <div className="mt-2 border-t border-[#e5e8e6] pt-1.5 text-[9px]">
                {[['Subtotal', 'BHD 7.400'], ['Delivery fee', 'BHD 1.000'], ['Discount', '– BHD 0.000'], ['Total', 'BHD 8.400']].map(([label, value]) => (
                  <div key={label} className={cn('flex justify-between py-0.5', label === 'Total' ? 'font-bold' : 'text-[#78827c]')}><span>{label}</span><span>{value}</span></div>
                ))}
              </div>
            </section>

            <section className="rounded-md border border-[#dfe4e0] p-2.5">
              <h3 className="text-[10px] font-bold">Timeline</h3>
              <div className="mt-2">
                {timeline.map(([label, time, state], index) => (
                  <div key={label} className={cn('relative flex gap-2', index < timeline.length - 1 && 'min-h-[28px]')}>
                    {index < timeline.length - 1 ? <span className="absolute bottom-[-6px] left-[3.5px] top-[8px] w-px bg-[#d9dfdb]" /> : null}
                    <span className={cn(
                      'relative z-10 mt-0.5 h-2 w-2 shrink-0 rounded-full',
                      state === 'done' && 'bg-[#20a653]',
                      state === 'active' && 'bg-[#f58b19]',
                      state === 'pending' && 'bg-[#c9cfcb]',
                    )} />
                    <div className="-mt-0.5"><p className="text-[9px] font-medium leading-3">{label}</p><p className="text-[8px] leading-3 text-[#89928c]">{time}</p></div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="mt-2 grid grid-cols-3 gap-2 max-[520px]:grid-cols-1">
            {people.map(({ title, rows }) => (
              <section key={title} className="rounded-md border border-[#dfe4e0] p-2.5">
                <h3 className="mb-2 text-[10px] font-bold">{title}</h3>
                <div className="space-y-1.5">
                  {rows.map(([label, value]) => <div key={label}><p className="text-[8px] text-[#7d8781]">{label}</p><p className="text-[9px] font-medium">{value}</p></div>)}
                </div>
              </section>
            ))}
          </div>
        </div>

        <footer className="flex shrink-0 justify-end border-t border-[#e3e7e4] px-[14px] py-2.5">
          <Button onClick={onClose} className="h-[28px] rounded-full px-4">Close</Button>
        </footer>
      </div>
    </div>
  )
}

function IncidentOrderModal({ order, onClose }) {
  const [openActionMenu, setOpenActionMenu] = useState(null)

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        if (openActionMenu) setOpenActionMenu(null)
        else onClose()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose, openActionMenu])

  if (!order) return null

  const timeline = [
    ['Placed', '12:02', 'done'],
    ['Accepted', '12:05', 'done'],
    ['Preparing', '12:08', 'done'],
    ['Ready', '12:20', 'done'],
    ['Picked up', '12:26', 'done'],
    ['On the way', '12:30', 'active'],
    ['Delivered', 'pending', 'active'],
  ]
  const infoGroups = [
    {
      title: 'Customer',
      rows: [['Name', 'Aisha Mohammed'], ['Phone', '+973 3401 2233'], ['Address', 'Blk 0322, Manama'], ['Member since', '2024']],
    },
    {
      title: 'Vendor',
      rows: [['Store', order.vendor], ['Branch', 'Adliya'], ['Phone', '+973 1700 8800'], ['Prep time', '18 min']],
    },
    {
      title: 'Champ',
      rows: [['Name', order.rider.name], ['Vehicle', 'Bike · DRV-2201'], ['Phone', '+973 3300 2201'], ['Status', 'On delivery']],
    },
  ]

  return (
    <div
      className="fixed inset-0 z-120 flex items-center justify-center overflow-y-auto bg-[rgba(20,25,22,.47)] p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="incident-order-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="relative flex max-h-[calc(100vh-32px)] w-full max-w-[532px] flex-col overflow-hidden rounded-[14px] bg-white shadow-[0_18px_55px_rgba(8,18,12,.28)]">
        <div className="overflow-y-auto px-[14px] pb-2 pt-[14px]">
          <header className="relative pr-8">
            <div className="flex flex-wrap items-center gap-2">
              <h2 id="incident-order-title" className="text-[13px] font-bold text-[#202722]">Order #{order.id}</h2>
              <Badge tone="red">Critical</Badge>
              <Badge tone="yellow">2 incidents</Badge>
            </div>
            <p className="mt-1 text-[9px] text-[#78827c]">{order.vendor} · Hot food — on demand · placed 12:02</p>
            <button type="button" onClick={onClose} aria-label="Close incident details" className="absolute -right-1 -top-1 grid h-7 w-7 place-items-center rounded-full text-[19px] font-light text-[#77817b] hover:bg-[#f1f3f1]">×</button>
          </header>

          <div className="mt-2 flex flex-wrap gap-1.5">
            <Badge tone="blue">Stage: Out for delivery</Badge>
            <Badge tone="red">SLA: Breached</Badge>
            <Badge tone="yellow">Reported: Yes</Badge>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2 max-[520px]:grid-cols-1">
            <section className="rounded-md border border-[#dfe4e0] p-2.5">
              <h3 className="text-[10px] font-bold">Order details</h3>
              <div className="mt-2 grid grid-cols-2 gap-x-5 gap-y-1 text-[9px]">
                {[['Items', '3 items'], ['Order value', 'BHD 8.400'], ['Payment', 'Card · paid'], ['Distance', '3.2 km'], ['Pickup', `${order.vendor}, Adliya`], ['Drop-off', 'Blk 0322, Manama']].map(([label, value]) => (
                  <div key={label}><p className="text-[#7d8781]">{label}</p><p className="font-medium text-[#202722]">{value}</p></div>
                ))}
              </div>
              <h4 className="mt-2 text-[9px] font-medium">Items</h4>
              <div className="mt-1 space-y-1 text-[9px]">
                {[['Chicken Biryani ×1', 'BHD 3.500'], ['Garlic bread ×2', 'BHD 2.400'], ['Coke 330ml ×2', 'BHD 1.000'], ['Side salad ×1', 'BHD 0.500']].map(([name, price]) => (
                  <div key={name} className="flex justify-between gap-3"><span>{name}</span><b>{price}</b></div>
                ))}
              </div>
              <div className="mt-2 border-t border-[#e5e8e6] pt-1.5 text-[9px]">
                {[['Subtotal', 'BHD 7.400'], ['Delivery fee', 'BHD 1.000'], ['Discount', '– BHD 0.000'], ['Total', 'BHD 8.400']].map(([label, value]) => (
                  <div key={label} className={cn('flex justify-between py-0.5', label === 'Total' ? 'font-bold' : 'text-[#78827c]')}><span>{label}</span><span>{value}</span></div>
                ))}
              </div>
            </section>

            <section className="rounded-md border border-[#dfe4e0] p-2.5">
              <h3 className="text-[10px] font-bold">Timeline</h3>
              <div className="mt-2">
                {timeline.map(([label, time, state], index) => (
                  <div key={label} className={cn('relative flex gap-2', index < timeline.length - 1 && 'min-h-[28px]')}>
                    {index < timeline.length - 1 ? <span className="absolute bottom-[-6px] left-[3.5px] top-[8px] w-px bg-[#d9dfdb]" /> : null}
                    <span className={cn(
                      'relative z-10 mt-0.5 h-2 w-2 shrink-0 rounded-full',
                      state === 'pending' ? 'bg-[#c9cfcb]' : state === 'active' ? 'bg-[#f58b19]' : 'bg-[#20a653]',
                    )} />
                    <div className="-mt-0.5"><p className="text-[9px] font-medium leading-3">{label}</p><p className="text-[8px] leading-3 text-[#89928c]">{time}</p></div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="mt-2 grid grid-cols-3 gap-2 max-[520px]:grid-cols-1">
            {infoGroups.map(({ title, rows }) => (
              <section key={title} className="rounded-md border border-[#dfe4e0] p-2.5">
                <h3 className="mb-2 text-[10px] font-bold">{title}</h3>
                <div className="space-y-1.5">
                  {rows.map(([label, value]) => <div key={label}><p className="text-[8px] text-[#7d8781]">{label}</p><p className="text-[9px] font-medium">{value}</p></div>)}
                </div>
              </section>
            ))}
          </div>

          <section className="mt-2 rounded-md border border-[#dfe4e0] p-2.5">
            <h3 className="mb-2 text-[10px] font-bold">Incidents</h3>
            {[
              { title: 'Acceptance SLA breached', status: 'Solved', statusTone: 'green', badges: [['SLA breached', 'red'], ['Cause: Vendor', 'yellow'], ['Stage: At vendor (preparing)', 'gray']], detail: 'Vendor took 3m 12s to accept (limit = 2m). Auto-flagged by system.', meta: 'Auto · 12:09 · resolved 12:14 by Ops' },
              { title: 'Late delivery', status: 'Pending', statusTone: 'yellow', badges: [['Reported', 'blue'], ['Cause: Champ', 'blue'], ['Stage: During delivery', 'gray']], detail: 'Customer reports order is ~25 min late', meta: 'Reported by customer · 12:34 · awaiting Ops action' },
            ].map((incident) => (
              <article key={incident.title} className="relative mb-2 rounded-[9px] border border-[#e0e5e1] bg-[#fafbfa] p-2.5 last:mb-0">
                <div className="flex items-center justify-between gap-2"><h4 className="text-[9px] font-bold">{incident.title}</h4><Badge tone={incident.statusTone}>{incident.status}</Badge></div>
                <div className="mt-1 flex flex-wrap gap-1">{incident.badges.map(([label, tone]) => <Badge key={label} tone={tone}>{label}</Badge>)}</div>
                <p className="mt-1.5 text-[8px] text-[#515c55]">{incident.detail}</p>
                <p className="mt-1 text-[8px] text-[#929a95]">{incident.meta}</p>
                <button
                  type="button"
                  aria-expanded={openActionMenu === incident.title}
                  onClick={() => setOpenActionMenu((current) => current === incident.title ? null : incident.title)}
                  className="mt-2 rounded-full bg-[#18a653] px-3 py-1.5 text-[8px] font-medium text-white hover:bg-[#128944]"
                >
                  ⚡ &nbsp; Take action &nbsp;⌄
                </button>

                {openActionMenu === incident.title ? (
                  <div className="absolute left-2.5 top-[calc(100%-2px)] z-30 w-[262px] overflow-hidden rounded-[9px] border border-[#e1e5e2] bg-white text-[10px] shadow-[0_10px_26px_rgba(20,30,24,.18)]">
                    {[
                      {
                        title: 'Dispatch',
                        actions: [
                          ['↻', 'Reassign champ', 'text-[#2876c7]'],
                          ['↻', 'Redispatch order', 'text-[#2876c7]'],
                        ],
                      },
                      {
                        title: 'Resolution',
                        actions: [
                          ['↝', 'Refund — full/partial', 'text-[#18a653]'],
                          ['×', 'Cancel order', 'text-[#d92f35]'],
                        ],
                      },
                      {
                        title: 'Enforcement · Ops',
                        actions: [
                          ['⊘', 'Suspend champ', 'text-[#dc2931]'],
                          ['⚑', 'Flag vendor', 'text-[#d92f35]'],
                        ],
                      },
                      {
                        title: 'Close-out',
                        actions: [
                          ['✓', 'Mark resolved', 'text-[#18a653]'],
                        ],
                      },
                    ].map((group) => (
                      <div key={group.title}>
                        <div className="bg-[#f5f6f7] px-3 py-1.5 text-[8px] font-bold uppercase tracking-wide text-[#929ba6]">{group.title}</div>
                        {group.actions.map(([icon, label, tone]) => (
                          <button
                            key={label}
                            type="button"
                            onClick={() => setOpenActionMenu(null)}
                            className="flex h-[30px] w-full items-center gap-2.5 px-3 text-left font-medium text-[#29332d] hover:bg-[#f5f8f6]"
                          >
                            <span className={cn('w-3 text-center text-[13px]', tone)}>{icon}</span>
                            <span className={label === 'Cancel order' || label === 'Suspend champ' ? 'text-[#d92f35]' : ''}>{label}</span>
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                ) : null}
              </article>
            ))}
          </section>
        </div>

        <footer className="flex shrink-0 justify-end gap-2 border-t border-[#e3e7e4] bg-white px-[14px] py-2.5">
          <Button onClick={onClose} className="h-[28px] rounded-full px-3">Close</Button>
          <Button primary className="h-[28px] rounded-full px-3">Mark resolved</Button>
        </footer>
      </div>
    </div>
  )
}

function AdminChatPanel({ chat, onClose }) {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState(() => (
    chat.role === 'Customer'
      ? [
          { id: 1, text: 'My order is very late', time: '12:34', own: false },
          { id: 2, text: 'Where is the champ now?', time: '12:34', own: false },
          { id: 3, text: 'Champ is 5 min away, apologies', time: '12:35', own: true },
          { id: 4, text: 'Can I get a partial refund?', time: '12:36', own: false },
        ]
      : [
          { id: 1, text: 'Hi, I picked up the order', time: '12:26', own: false },
          { id: 2, text: 'Great, the customer is waiting', time: '12:27', own: true },
          { id: 3, text: 'Heavy traffic on the highway', time: '12:31', own: false },
          { id: 4, text: 'I will be 5 min late', time: '12:31', own: false },
          { id: 5, text: 'Okay, keep them updated', time: '12:32', own: true },
        ]
  ))

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const sendMessage = (event) => {
    event.preventDefault()
    const text = message.trim()
    if (!text) return
    setMessages((current) => [...current, { id: Date.now(), text, time: 'now', own: true }])
    setMessage('')
  }

  return (
    <aside
      className="fixed right-[50px] top-[70px] z-50 flex h-[520px] w-[440px] flex-col items-start overflow-hidden rounded-[16px] border border-[#dce3de] bg-white p-0 shadow-[0_12px_34px_rgba(0,0,0,.28)] max-[700px]:right-4 max-[520px]:left-3 max-[520px]:right-3 max-[520px]:w-auto"
      aria-label={`Chat with ${chat.name}`}
    >
      <header className={cn(
        'flex h-[60px] w-full shrink-0 items-center border-b border-[#e7e3e9] px-4',
        chat.role === 'Customer' ? 'bg-[#f4edff]' : 'bg-[#eaf2ff]',
      )}>
        <span className={cn(
          'grid h-10 w-10 place-items-center rounded-md text-[12px] font-bold',
          chat.initials === 'AM' ? 'bg-[#f0e8ff] text-[#7552b5]' : 'bg-white text-[#3974ad]',
        )}>{chat.initials}</span>
        <div className="ml-2 min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <strong className="truncate text-[13px]">{chat.name}</strong>
            <span className="h-1.5 w-1.5 rounded-full bg-[#28a85b]" />
            <span className="text-[9px] font-medium text-[#22a155]">online</span>
          </div>
          <p className={cn('truncate text-[10px]', chat.role === 'Customer' ? 'text-[#7c4dbe]' : 'text-[#6680a0]')}>{chat.role} · Order {chat.orderId || '#YJK-…2YKZ9VF'}</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Minimize chat" className="grid h-7 w-7 place-items-center text-[20px] font-light text-[#68716c] hover:text-[#26332b]">−</button>
        <button type="button" onClick={onClose} aria-label="Close chat" className="grid h-7 w-7 place-items-center text-[20px] font-light text-[#68716c] hover:text-[#26332b]">×</button>
      </header>

      <div className="w-full flex-1 space-y-2 overflow-y-auto p-3">
        {messages.map((item) => (
          <div key={item.id} className={cn('flex', item.own ? 'justify-end' : 'justify-start')}>
            <div className={cn(
              'max-w-[78%] rounded-lg px-3 py-2.5 shadow-[0_1px_2px_rgba(20,35,25,.05)]',
              item.own ? 'bg-[#e0f4e8]' : 'border border-[#dfe4e0] bg-white',
            )}>
              <p className="text-[12px] leading-[16px] text-[#354039]">{item.text}</p>
              <p className="mt-0.5 text-[8px] text-[#929b95]">{item.time}</p>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={sendMessage} className="flex w-full shrink-0 gap-2 border-t border-[#e1e6e2] bg-white p-3.5">
        <input
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          className="h-[34px] min-w-0 flex-1 rounded-full border border-[#dfe4e0] px-3 text-[11px] outline-none focus:border-[#25a65b]"
          placeholder="Type a message..."
        />
        <button type="submit" className="h-[34px] rounded-full bg-[#25a65b] px-4 text-[11px] font-medium text-white hover:bg-[#188949]">Send</button>
      </form>
    </aside>
  )
}

function AdminOpenChats({ chats, onChatClick }) {
  return (
    <section className="mt-auto rounded-t-xl border border-b-0 border-[#dfe4e0] bg-white px-[14px] pb-3 pt-2.5">
      <div className="mb-2 flex items-center justify-between text-[11px]"><b>chats</b><span className="text-[#657169]">{chats.length} active</span></div>
      <div className="grid grid-cols-3 gap-2.5 max-[700px]:grid-cols-1">
        {chats.map(({ id, initials, name, role, message, unreadCount }) => (
          <button
            key={id}
            type="button"
            onClick={() => onChatClick?.({ id, initials, name, role, message, unreadCount })}
            className="flex h-[54px] items-center rounded-[8px] border border-[#dfe4e0] px-2.5 text-left transition hover:border-[#9ecdb0] hover:bg-[#fbfdfb]"
          >
            <span className={cn('grid h-[30px] w-[30px] place-items-center rounded-md text-[10px] font-bold', initials === 'AM' ? 'bg-[#f0e8ff] text-[#7552b5]' : 'bg-[#e6f1ff] text-[#3974ad]')}>{initials}</span>
            <span className="ml-2 min-w-0 flex-1">
              <span className="flex items-center gap-1.5 text-[10px] font-bold">{name}<i className={cn('rounded px-1 text-[8px] not-italic', role === 'Champ' ? 'bg-[#e5efff] text-[#3470ae]' : 'bg-[#eee8ff] text-[#7454ad]')}>{role}</i></span>
              <span className="block truncate text-[9px] text-[#828b85]">{message}</span>
            </span>
            {unreadCount ? <span className="grid h-4 w-4 place-items-center rounded-full bg-[#c91f2b] text-[9px] text-white">{unreadCount}</span> : null}
          </button>
        ))}
      </div>
    </section>
  )
}

function AdminLiveOrdersFullView({ column, chats, onBack, onIncidentClick, onContactClick, onOrderClick, onChatClick }) {
  const orders = [...column.orders, ...column.orders]

  return (
    <div className="flex min-h-[calc(100vh-44px)] flex-col px-[18px] pb-0 pt-[15px]">
      <div className="flex items-start gap-3">
        <button onClick={onBack} className="h-[27px] rounded-full border border-[#dfe4e0] bg-white px-3 text-[10px] font-medium text-[#536158]">‹ Live orders</button>
        <div>
          <h2 className="flex items-center gap-1.5 text-[18px] font-bold">
            <span>{column.tone === 'red' ? '🔥' : column.tone === 'yellow' ? '⚠' : '🛡'}</span>
            {column.title} orders — full view
          </h2>
          <p className="mt-0.5 text-[10px] text-[#7a847e]">All orders in this status</p>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-2">
        <label className="flex h-[31px] w-[225px] items-center gap-2 rounded-full border border-[#dfe4e0] bg-white px-3">
          <Search size={12} className="text-[#7b867f]" />
          <input className="min-w-0 flex-1 border-0 bg-transparent text-[10px] outline-none" placeholder="Search order, vendor, champ, customer..." />
        </label>
        {['Vendor · All⌄', 'Type · All⌄', 'Champ · All⌄'].map((filter) => (
          <button key={filter} className="h-[31px] rounded-full border border-[#dfe4e0] bg-white px-3 text-[10px] text-[#59655e]">{filter}</button>
        ))}
        <button className="ml-auto h-[31px] rounded-full border border-[#dfe4e0] bg-white px-3 text-[10px] text-[#59655e]">Sort · <b>Time left</b>⌄</button>
      </div>

      <div className="mt-8 grid grid-cols-4 gap-3 max-[1000px]:grid-cols-3 max-[760px]:grid-cols-2 max-[520px]:grid-cols-1">
        {orders.map((order, index) => (
          <AdminLiveOrderCard
            key={`${order.id}-${index}`}
            order={order}
            tone={column.tone}
            onIncidentClick={onIncidentClick}
            onContactClick={onContactClick}
            onOrderClick={onOrderClick}
          />
        ))}
      </div>

      <AdminOpenChats chats={chats} onChatClick={onChatClick} />
    </div>
  )
}

function AdminLiveOrders() {
  const [filter, setFilter] = useState('All orders')
  const [fullView, setFullView] = useState(null)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [incidentOrder, setIncidentOrder] = useState(null)
  const [activeChat, setActiveChat] = useState(null)
  const { data, error, isLoading, refetch } = useApiResource(() => adminService.getLiveOrders(), [])

  if (!data) return <ApiState isLoading={isLoading} error={error} onRetry={refetch} />

  const openOrderChat = (order) => {
    const matchingChat = data.chats.find((chat) => chat.role === order.contactType) || data.chats[0]
    setActiveChat({ ...matchingChat, orderId: order.id })
  }

  if (fullView) {
    return (
      <>
        <AdminLiveOrdersFullView
          column={fullView}
          chats={data.chats}
          onBack={() => setFullView(null)}
          onIncidentClick={setIncidentOrder}
          onContactClick={openOrderChat}
          onOrderClick={setSelectedOrder}
          onChatClick={setActiveChat}
        />
        {selectedOrder ? <AdminOrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} /> : null}
        {incidentOrder ? <IncidentOrderModal order={incidentOrder} onClose={() => setIncidentOrder(null)} /> : null}
        {activeChat ? <AdminChatPanel key={`${activeChat.id}-${activeChat.orderId || ''}`} chat={activeChat} onClose={() => setActiveChat(null)} /> : null}
      </>
    )
  }

  return (
    <div className="flex min-h-[calc(100vh-44px)] flex-col px-[18px] pb-0 pt-[15px]">
      <div className="grid grid-cols-[minmax(0,1fr)_292px] gap-3 max-[1050px]:grid-cols-1">
        <div className="min-w-0">
          <div className="flex h-[32px] items-start justify-between">
            <div className="flex items-center gap-2.5">
              <h2 className="text-[14px] font-bold">{data.activeOrderCount} active orders</h2>
              <span className="rounded-full bg-[#e4f5e9] px-2 py-1 text-[10px] font-medium text-[#188248]">● auto-refresh {data.refreshIntervalSeconds}s</span>
            </div>
            <div className="flex gap-3">
              <Button className="h-[31px] px-3">All vendors⌄</Button>
              <Button className="h-[31px] px-4"><RefreshCw size={11} /> Refresh</Button>
            </div>
          </div>

          <div className="mb-3 mt-3 flex flex-wrap items-center gap-2 text-[10px] text-[#59655e]">
            <span>Filter:</span>
            {data.filters.map((item) => (
              <button
                key={item}
                onClick={() => setFilter(item)}
                className={cn(
                  'h-[26px] rounded-full border px-3 font-medium',
                  filter === item ? 'border-[#15904a] bg-white text-[#14763f]' : 'border-[#d9dfdb] bg-white text-[#657068]',
                )}
              >
                {item !== 'All orders' ? '💬 ' : ''}{item}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-3 max-[800px]:grid-cols-1">
            {data.columns.map((column) => (
              <section key={column.title} className="min-h-[416px] rounded-[10px] bg-[#f1f4f1] p-2.5">
                <div className="flex h-[22px] items-center gap-2">
                  <span className={cn(
                    'rounded-md px-2 py-1 text-[10px] font-medium',
                    column.tone === 'red' && 'bg-[#fff0ed] text-[#d33f44]',
                    column.tone === 'yellow' && 'bg-[#fff3d8] text-[#b87c13]',
                    column.tone === 'green' && 'bg-[#e7f5eb] text-[#247c4b]',
                  )}>
                    {column.tone === 'red' ? '🔥' : column.tone === 'yellow' ? '⚠' : '🛡'} {column.title}
                  </span>
                  <strong className={cn('text-[12px]', column.tone === 'red' ? 'text-[#d33f44]' : column.tone === 'yellow' ? 'text-[#b87c13]' : 'text-[#247c4b]')}>{column.count}</strong>
                  <button
                    onClick={() => setFullView(column)}
                    className="ml-auto grid h-[22px] w-[22px] place-items-center rounded-md border border-[#dfe4e0] bg-white text-[#748078] hover:text-[#118446]"
                    aria-label={`Open ${column.title} orders full view`}
                  >
                    <ArrowUpRight size={12} />
                  </button>
                </div>
                <div className="mt-2 space-y-2.5">
                  {column.orders.map((order, index) => (
                    <AdminLiveOrderCard
                      key={`${column.title}-${order.id}-${index}`}
                      order={order}
                      tone={column.tone}
                      onIncidentClick={setIncidentOrder}
                      onContactClick={openOrderChat}
                      onOrderClick={setSelectedOrder}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>

        <aside className="h-[441px] overflow-hidden rounded-xl border border-[#dfe4e0] bg-white px-[14px]">
          <div className="flex h-[43px] items-center gap-1.5">
            <ShieldAlert size={14} className="text-[#d46763]" />
            <h2 className="text-[14px] font-bold">Incidents Log</h2>
          </div>
          {data.incidents.map(({ id, priority, title, detail, tone }) => (
            <div key={id} className="flex h-[59px] items-center border-b border-[#e2e6e3]">
              <span className={cn(
                'mr-2.5 grid h-[19px] w-8 shrink-0 place-items-center rounded-md text-[9px] font-medium',
                tone === 'red' && 'bg-[#fdebec] text-[#d64044]',
                tone === 'yellow' && 'bg-[#fff4d9] text-[#c78a18]',
                tone === 'blue' && 'bg-[#eaf2fb] text-[#3974ad]',
                tone === 'gray' && 'bg-[#f0f2f0] text-[#737d77]',
              )}>{priority}</span>
              <div className="min-w-0">
                <p className="truncate text-[11px] font-bold">{title}</p>
                <p className="truncate text-[9px] text-[#818b84]">{detail}</p>
              </div>
            </div>
          ))}
        </aside>
      </div>

      <AdminOpenChats chats={data.chats} onChatClick={setActiveChat} />
      {selectedOrder ? <AdminOrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} /> : null}
      {incidentOrder ? <IncidentOrderModal order={incidentOrder} onClose={() => setIncidentOrder(null)} /> : null}
      {activeChat ? <AdminChatPanel key={`${activeChat.id}-${activeChat.orderId || ''}`} chat={activeChat} onClose={() => setActiveChat(null)} /> : null}
    </div>
  )
}

export function AdminOperations({ mode = 'live' }) {
  if (mode === 'live orders') return <AdminLiveOrders />
  if (mode === 'pickup') return <AdminIncidentBoard key="pickup" fetchData={() => adminService.getPickup()} />
  if (mode === 'dine-in') return <AdminIncidentBoard key="dine-in" fetchData={() => adminService.getDineIn()} />
  if (mode === 'services') return <AdminIncidentBoard key="services" fetchData={() => adminService.getServices()} />
  return <AdminOperationsBoard mode={mode} />
}

function AdminIncidentCard({ order }) {
  return (
    <article className="rounded-[12px] border border-[#e4e8e4] bg-white p-3.5 shadow-[0_1px_2px_rgba(20,40,28,.04)]">
      <div className="flex items-start justify-between gap-2">
        <strong className="truncate text-[12px] font-bold text-[#17231c]">{order.id}</strong>
        <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-[#d13f45]">
          <Clock3 size={12} /> {order.timeLeft}
        </span>
      </div>
      <p className="mt-2 truncate text-[13px] font-bold text-[#17231c]">{order.vendor}</p>
      <p className="mt-1 truncate text-[11px] text-[#7a847e]">{order.detail}</p>
      {order.hasIncident ? (
        <span className="mt-2.5 inline-flex rounded-full bg-[#fdebec] px-2.5 py-0.5 text-[10px] font-medium text-[#d64044]">Incident</span>
      ) : null}
    </article>
  )
}

function AdminIncidentBoard({ fetchData }) {
  const [filter, setFilter] = useState('All orders')
  const [activeChat, setActiveChat] = useState(null)
  const { data, error, isLoading, refetch } = useApiResource(fetchData, [])

  if (!data) return <ApiState isLoading={isLoading} error={error} onRetry={refetch} />

  return (
    <div className="flex min-h-[calc(100vh-44px)] flex-col px-[18px] pb-0 pt-[15px]">
      <div className="grid flex-1 grid-cols-[minmax(0,1fr)_292px] gap-3 max-[1050px]:grid-cols-1">
        <div className="min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-[14px] font-bold text-[#17231c]">
                {data.activeCount} {data.activeLabel}
              </h2>
              <span className="rounded-full bg-[#e4f5e9] px-2.5 py-1 text-[10px] font-medium text-[#188248]">
                ● auto-refresh {data.refreshIntervalSeconds}s
              </span>
            </div>
            <div className="flex gap-2">
              <Button className="h-[31px] px-3">All vendors <ChevronDown size={12} /></Button>
              <Button className="h-[31px] px-4" onClick={refetch}><RefreshCw size={11} /> Refresh</Button>
            </div>
          </div>

          <div className="mb-3 mt-3 flex flex-wrap items-center gap-2 text-[10px] text-[#59655e]">
            <span>Filter:</span>
            {data.filters.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={cn(
                  'h-[26px] rounded-full border px-3 font-medium',
                  filter === item ? 'border-[#15904a] bg-white text-[#14763f]' : 'border-[#d9dfdb] bg-white text-[#657068]',
                )}
              >
                {item !== 'All orders' ? '💬 ' : ''}{item}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 max-[700px]:grid-cols-1">
            {data.columns.map((column) => (
              <section key={column.id} className="min-h-[416px] rounded-[10px] bg-[#f1f4f1] p-2.5">
                <div className="mb-2 flex h-[22px] items-center gap-2">
                  <span className={cn(
                    'inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium',
                    column.tone === 'red' ? 'bg-[#fff0ed] text-[#d33f44]' : 'bg-[#e7f5eb] text-[#247c4b]',
                  )}>
                    {column.tone === 'red' ? <TriangleAlert size={12} /> : <ShieldCheck size={12} />}
                    {column.title}
                  </span>
                  <strong className={cn('text-[12px]', column.tone === 'red' ? 'text-[#d33f44]' : 'text-[#247c4b]')}>{column.count}</strong>
                  <button
                    type="button"
                    className="ml-auto grid h-[22px] w-[22px] place-items-center rounded-md border border-[#dfe4e0] bg-white text-[#748078]"
                    aria-label={`Open ${column.title}`}
                  >
                    <ArrowUpRight size={12} />
                  </button>
                </div>
                <div className="space-y-2.5">
                  {column.orders.map((order) => (
                    <AdminIncidentCard key={order.id} order={order} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>

        <aside className="h-[441px] overflow-hidden rounded-xl border border-[#dfe4e0] bg-white px-[14px]">
          <div className="flex h-[43px] items-center gap-1.5">
            <ShieldAlert size={14} className="text-[#d46763]" />
            <h3 className="text-[14px] font-bold text-[#17231c]">Incidents Log</h3>
          </div>
          {data.incidents.map(({ id, priority, title, detail, tone }) => (
            <div key={id} className="flex h-[59px] items-center border-b border-[#e2e6e3]">
              <span className={cn(
                'mr-2.5 grid h-[19px] w-8 shrink-0 place-items-center rounded-md text-[9px] font-medium',
                tone === 'red' && 'bg-[#fdebec] text-[#d64044]',
                tone === 'yellow' && 'bg-[#fff4d9] text-[#c78a18]',
                tone === 'blue' && 'bg-[#eaf2fb] text-[#3974ad]',
                tone === 'gray' && 'bg-[#f0f2f0] text-[#737d77]',
              )}>{priority}</span>
              <div className="min-w-0">
                <p className="truncate text-[11px] font-bold text-[#17231c]">{title}</p>
                <p className="truncate text-[9px] text-[#818b84]">{detail}</p>
              </div>
            </div>
          ))}
        </aside>
      </div>

      <AdminOpenChats chats={data.chats} onChatClick={setActiveChat} />
      {activeChat ? <AdminChatPanel key={activeChat.id} chat={activeChat} onClose={() => setActiveChat(null)} /> : null}
    </div>
  )
}

function AdminOperationsBoard({ mode }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const viewParam = searchParams.get('view')
  const [view, setView] = useState(() => (
    mode === 'scheduled' && ['Pipeline', 'Board', 'Calendar'].includes(viewParam)
      ? viewParam
      : 'Pipeline'
  ))

  useEffect(() => {
    if (mode !== 'scheduled') return
    if (['Pipeline', 'Board', 'Calendar'].includes(viewParam) && viewParam !== view) {
      setView(viewParam)
    }
  }, [mode, viewParam, view])

  const onViewChange = (next) => {
    setView(next)
    if (mode === 'scheduled') {
      setSearchParams(next === 'Pipeline' ? {} : { view: next }, { replace: true })
    }
  }

  const { data, error, isLoading, refetch } = useApiResource(() => adminService.getOperations(mode), [mode])
  const title = mode === 'scheduled'
    ? (view === 'Board' ? 'Scheduled orders — dispatch' : view === 'Calendar' ? 'Scheduled Orders · Dispatching' : 'Scheduled orders — pipeline')
    : `${mode[0].toUpperCase()}${mode.slice(1).replace('-', ' ')} — live operations`
  if (!data) return <ApiState isLoading={isLoading} error={error} onRetry={refetch} />

  return (
    <div className={cn('px-7 pt-[18px] max-[700px]:p-4', mode === 'scheduled' ? 'pb-0' : 'pb-[18px]')}>
      {view === 'Calendar' && mode === 'scheduled' ? null : (
        <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="text-[18px] font-bold">{title}</h2></div>
        </div>
      )}
      {view === 'Board' && mode === 'scheduled' ? (
        <ScheduledDispatchBoard data={data} view={view} onViewChange={onViewChange} />
      ) : view === 'Calendar' && mode === 'scheduled' ? (
        <ScheduledCalendarDispatch view={view} onViewChange={onViewChange} />
      ) : (
        <>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <OperationsViewTabs view={view} onViewChange={onViewChange} />
            <span className="flex-1" />
            <Button>Zone: All <ChevronDown size={12} /></Button>
            <Button primary><Zap size={12} /> Auto-assign</Button>
          </div>
          <div className="grid grid-cols-4 gap-3 overflow-x-auto max-[1100px]:grid-cols-2 max-[650px]:grid-cols-1">
            {data.columns.map((column) => {
              const cards = data.orders.filter((order) => order.column === column.key)
              return (
                <section key={column.key} className="min-h-[548px] min-w-[230px] rounded-lg bg-[#f1f4f1] p-2.5">
                  <div className="mb-2 flex h-6 items-center gap-2 px-1">
                    <span className="h-2 w-2 rounded-full" style={{ background: column.tone }} />
                    <h3 className="text-[10px] font-bold">{column.title}</h3>
                    <span className="rounded-full bg-white px-2 py-0.5 text-[9px] text-[#6d7871]">{cards.length}</span>
                    <span className="flex-1" />
                    {mode === 'scheduled' ? (
                      <Link
                        to={`/admin/scheduled/${column.key}`}
                        className="grid h-5 w-5 place-items-center rounded bg-white text-[#738078] hover:text-[#17231c]"
                        aria-label={`Open ${column.title} page`}
                        title={`Open ${column.title}`}
                      >
                        <ArrowUpRight size={11} />
                      </Link>
                    ) : (
                      <button className="grid h-5 w-5 place-items-center rounded bg-white text-[#738078]"><ArrowUpRight size={11} /></button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {cards.map((order, index) => <OrderCard key={`${column.key}-${order.id}-${index}`} order={order} mode={mode} />)}
                  </div>
                </section>
              )
            })}
          </div>
          <IncidentLog incidents={data.incidents} />
        </>
      )}
      {view === 'Calendar' && mode === 'scheduled' ? null : <ChatStrip chats={data.chats} />}
    </div>
  )
}

function OperationsViewTabs({ view, onViewChange }) {
  return ['Pipeline', 'Board', 'Calendar'].map((item) => (
    <button
      key={item}
      onClick={() => onViewChange(item)}
      className={cn(
        'h-[29px] rounded-md border px-3 text-[10px] font-medium',
        view === item ? 'border-[#17231c] bg-[#17231c] text-white' : 'border-[#dfe4e0] bg-white text-[#69756d]',
      )}
    >
      {item}
    </button>
  ))
}

const calendarDays = [
  { key: 'mon', label: 'Mon 29 Jun' },
  { key: 'tue', label: 'Tue 30 Jun' },
  { key: 'wed', label: 'Wed 1 Jul' },
  { key: 'thu', label: 'Thu 2 Jul' },
  { key: 'fri', label: 'Fri 3 Jul' },
  { key: 'sat', label: 'Sat 4 Jul' },
  { key: 'sun', label: 'Sun 5 Jul' },
]

const calendarOrders = [
  {
    id: '#YJK-8001',
    store: 'Green store',
    place: 'Manama · 0322',
    type: 'Same day',
    slots: { mon: { kind: 'assigned', champ: 'Champ A', window: '2-4 PM' }, tue: 'assign', wed: 'assign', thu: 'empty', fri: 'assign', sat: 'assign', sun: 'empty' },
  },
  {
    id: '#YJK-8002',
    store: 'Lulu Express',
    place: 'Muharraq · 0214',
    type: 'Next day',
    slots: { mon: 'assign', tue: 'assign', wed: 'empty', thu: 'empty', fri: 'assign', sat: 'assign', sun: 'empty' },
  },
  {
    id: '#YJK-8003',
    store: 'City mart',
    place: 'Seef · 0428',
    type: 'Standard',
    slots: { mon: 'empty', tue: 'assign', wed: 'assign', thu: 'empty', fri: 'assign', sat: 'assign', sun: 'empty' },
  },
  {
    id: '#YJK-8004',
    store: 'Sharaf DG',
    place: 'Hidd · 0114',
    type: 'Economy',
    slots: { mon: 'empty', tue: 'empty', wed: 'assign', thu: 'empty', fri: 'assign', sat: 'assign', sun: 'assign' },
  },
  {
    id: '#YJK-8005',
    store: 'Daily needs',
    place: 'Isa Town · 0733',
    type: 'Same day',
    slots: { mon: 'empty', tue: 'empty', wed: 'empty', thu: 'empty', fri: 'assign', sat: 'assign', sun: 'assign' },
  },
  {
    id: '#YJK-8006',
    store: 'Quick shop',
    place: 'Sitra · 0550',
    type: 'Next day',
    slots: { mon: 'empty', tue: 'empty', wed: 'empty', thu: 'empty', fri: 'assign', sat: 'assign', sun: 'empty' },
  },
]

const calendarFilterConfig = {
  Governorates: [
    { id: 'capital', label: 'Capital', count: 12 },
    { id: 'muharraq', label: 'Muharraq', count: 7 },
    { id: 'northern', label: 'Northern', count: 0 },
    { id: 'southern', label: 'Southern', count: 0 },
  ],
  Cities: [
    { id: 'manama', label: 'Manama', count: 12 },
    { id: 'muharraq-city', label: 'Muharraq', count: 5 },
    { id: 'seef', label: 'Seef', count: 2 },
    { id: 'arad', label: 'Arad', count: 2 },
    { id: 'juffair', label: 'Juffair', count: 0 },
    { id: 'riffa', label: 'Riffa', count: 1 },
    { id: 'isa', label: 'Isa Town', count: 0 },
  ],
  Blocks: [
    { id: 'b0322', label: 'Block 0322', sub: 'Manama', count: 8 },
    { id: 'b0214', label: 'Block 0214', sub: 'Muharraq', count: 8 },
    { id: 'b0428', label: 'Block 0428', sub: 'Seef', count: 1 },
    { id: 'b0911', label: 'Block 0911', sub: 'Riffa', count: 1 },
    { id: 'b0346', label: 'Block 0346', sub: 'Manama', count: 0 },
    { id: 'b0733', label: 'Block 0733', sub: 'Isa Town', count: 0 },
  ],
}

function CalendarSlotCell({ slot, onAssign }) {
  if (slot?.kind === 'assigned') {
    return (
      <div className="mx-auto min-w-[82px] rounded-[8px] border border-[#b7e4c7] bg-[#e7f6ec] px-2.5 py-2 text-center">
        <p className="text-[11px] font-bold leading-none text-[#16854a]">{slot.champ}</p>
        <p className="mt-1.5 text-[10px] font-medium leading-none text-[#3d9a62]">{slot.window}</p>
      </div>
    )
  }
  if (slot === 'assign') {
    return (
      <button
        type="button"
        onClick={onAssign}
        className="inline-flex h-[30px] min-w-[82px] items-center justify-center gap-1 rounded-[8px] border border-dashed border-[#19ad5b] bg-white px-3 text-[11px] font-semibold text-[#19ad5b] hover:bg-[#f3fbf6]"
      >
        <Plus size={12} strokeWidth={2.5} /> Assign
      </button>
    )
  }
  return <span className="mx-auto block h-1 w-1 rounded-full bg-[#d0d6d1]" />
}

function CalendarFilterDropdown({ title, items, selected, onToggle, open, onToggleOpen }) {
  const [query, setQuery] = useState('')
  const selectedCount = selected.length
  const visible = items.filter((item) => item.label.toLowerCase().includes(query.toLowerCase()) || item.sub?.toLowerCase().includes(query.toLowerCase()))
  const first = items.find((item) => item.id === selected[0])
  const valueLabel = selectedCount === 0
    ? 'All'
    : title === 'Blocks' && selectedCount > 1
      ? `${selectedCount} selected`
      : selectedCount === 1
        ? (title === 'Blocks' ? (first?.label?.replace(/^Block\s+/i, '') || first?.label) : (first?.label || '1'))
        : `${first?.label || ''} +${selectedCount - 1}`

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggleOpen}
        className={cn(
          'inline-flex h-[30px] items-center gap-1 rounded-full border px-3 text-[11px] transition',
          (open || selectedCount > 0) && 'border-[#b7e4c7] bg-[#e8f7ed] text-[#147940]',
          !open && selectedCount === 0 && 'border-[#d7ddd8] bg-white text-[#455249]',
        )}
      >
        <span className={cn('font-medium', open || selectedCount > 0 ? 'text-[#2f8f55]' : 'text-[#6a746e]')}>{title}</span>
        <span className={cn('font-bold', open || selectedCount > 0 ? 'text-[#0f6b3a]' : 'text-[#17231c]')}>· {valueLabel}</span>
        <ChevronDown size={11} className="opacity-70" />
      </button>
      {open ? (
        <div className="absolute left-0 top-[36px] z-30 w-[220px] overflow-hidden rounded-[12px] border border-[#e2e6e3] bg-white shadow-[0_12px_32px_rgba(20,40,28,.16)]">
          <div className="border-b border-[#edf0ee] p-2">
            <label className="flex h-[30px] items-center gap-2 rounded-full border border-[#e2e6e3] bg-[#f7f9f7] px-2.5">
              <Search size={12} className="text-[#8a948e]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="min-w-0 flex-1 border-0 bg-transparent text-[11px] outline-none"
                placeholder="Search…"
              />
            </label>
          </div>
          <div className="max-h-[240px] space-y-0.5 overflow-y-auto p-1.5">
            {visible.map((item) => {
              const checked = selected.includes(item.id)
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onToggle(item.id)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-[8px] px-2 py-2 text-left transition',
                    checked ? 'bg-[#e8f7ed] text-[#147940]' : item.count === 0 ? 'bg-white text-[#9aa39c]' : 'bg-white text-[#314039] hover:bg-[#f5f8f5]',
                  )}
                >
                  <span className={cn(
                    'grid h-[15px] w-[15px] shrink-0 place-items-center rounded-[3px] border',
                    checked ? 'border-[#19ad5b] bg-[#19ad5b] text-white' : 'border-[#c5cdc7] bg-white',
                  )}>
                    {checked ? <Check size={10} strokeWidth={3} /> : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[11px] font-semibold">{item.label}</span>
                    {item.sub ? <span className="block text-[9px] font-medium text-[#8a948e]">{item.sub}</span> : null}
                  </span>
                  <span className={cn(
                    'grid h-[18px] min-w-[18px] place-items-center rounded-full px-1.5 text-[9px] font-bold leading-none',
                    item.count > 0 ? 'bg-[#ffe8b8] text-[#9a6d12]' : 'bg-transparent text-[#b0b8b2]',
                  )}>{item.count}</span>
                </button>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function ScheduledCalendarDispatch({ view, onViewChange }) {
  const navigate = useNavigate()
  const [openFilters, setOpenFilters] = useState(() => new Set())
  const [selected, setSelected] = useState({
    Governorates: ['capital', 'muharraq'],
    Cities: ['manama', 'muharraq-city', 'seef', 'arad'],
    Blocks: ['b0322', 'b0214', 'b0428', 'b0911'],
  })

  const toggleItem = (group, id) => {
    setSelected((current) => {
      const list = current[group]
      return {
        ...current,
        [group]: list.includes(id) ? list.filter((item) => item !== id) : [...list, id],
      }
    })
  }

  const toggleOpen = (title) => {
    setOpenFilters((current) => {
      const next = new Set(current)
      if (next.has(title)) next.delete(title)
      else next.add(title)
      return next
    })
  }

  const openAssignChamp = (order, day) => {
    const orderId = order.id.replace(/^#/, '')
    const dayMap = {
      mon: 'thu-2',
      tue: 'thu-2',
      wed: 'thu-2',
      thu: 'thu-2',
      fri: 'fri-3',
      sat: 'sat-4',
      sun: 'sun-5',
    }
    const params = new URLSearchParams({
      day: dayMap[day.key] || 'thu-2',
      window: '2–4 PM',
    })
    navigate(`/admin/scheduled/assign/${encodeURIComponent(orderId)}?${params.toString()}`)
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <OperationsViewTabs view={view} onViewChange={onViewChange} />
      </div>

      <h2 className="text-[18px] font-bold tracking-[-0.02em] text-[#17231c]">Scheduled Orders · Dispatching</h2>

      <div className="mt-3 flex flex-wrap gap-2">
        {[
          ['Capital', 5],
          ['Muharraq', 5],
          ['Northern', 5],
          ['Southern', 9],
        ].map(([name, count]) => (
          <span key={name} className="inline-flex h-[28px] items-center gap-1.5 rounded-full border border-[#e2e6e3] bg-white px-3 text-[11px] font-medium text-[#455249]">
            {name}
            <i className="grid h-[18px] min-w-[18px] place-items-center rounded-full bg-[#f4c76a] px-1 text-[10px] not-italic font-bold leading-none text-[#7a4e08]">{count}</i>
          </span>
        ))}
      </div>

      <section className="relative mt-4 overflow-visible rounded-[16px] border border-[#e4e8e4] bg-white shadow-[0_1px_3px_rgba(20,40,28,.04)]">
        <div className="border-b border-[#e8ebe8] px-5 py-4">
          <h3 className="text-[15px] font-bold tracking-[-0.01em] text-[#17231c]">Orders × available delivery days</h3>
          <div className="mt-3.5 flex flex-wrap items-center gap-2">
            <CalendarFilterDropdown
              title="Governorates"
              items={calendarFilterConfig.Governorates}
              selected={selected.Governorates}
              onToggle={(id) => toggleItem('Governorates', id)}
              open={openFilters.has('Governorates')}
              onToggleOpen={() => toggleOpen('Governorates')}
            />
            <CalendarFilterDropdown
              title="Cities"
              items={calendarFilterConfig.Cities}
              selected={selected.Cities}
              onToggle={(id) => toggleItem('Cities', id)}
              open={openFilters.has('Cities')}
              onToggleOpen={() => toggleOpen('Cities')}
            />
            <CalendarFilterDropdown
              title="Blocks"
              items={calendarFilterConfig.Blocks}
              selected={selected.Blocks}
              onToggle={(id) => toggleItem('Blocks', id)}
              open={openFilters.has('Blocks')}
              onToggleOpen={() => toggleOpen('Blocks')}
            />
            {['Champ', 'Type', 'Vendor'].map((filter) => (
              <button key={filter} type="button" className="inline-flex h-[30px] items-center gap-1 rounded-full border border-[#d7ddd8] bg-white px-3 text-[11px] transition">
                <span className="font-medium text-[#6a746e]">{filter}</span>
                <span className="font-bold text-[#17231c]">· All</span>
                <ChevronDown size={11} className="opacity-70" />
              </button>
            ))}
            <span className="flex-1" />
            <label className="flex h-[30px] min-w-[160px] items-center gap-2 rounded-full border border-[#e2e6e3] bg-[#f3f5f3] px-3">
              <Search size={13} className="text-[#8a948e]" />
              <input className="min-w-0 flex-1 border-0 bg-transparent text-[11px] text-[#314039] outline-none placeholder:text-[#8a948e]" placeholder="Search order" />
            </label>
          </div>
          <div className="mt-2.5">
            <button type="button" className="inline-flex h-[28px] items-center gap-1 rounded-full border border-[#d7ddd8] bg-white px-3 text-[11px] font-medium text-[#455249]">
              Sort <ChevronDown size={11} className="opacity-70" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-b-[16px]">
          <table className="w-full min-w-[1020px] border-collapse text-left">
            <thead>
              <tr className="bg-[#f7f8f7]">
                <th className="w-[168px] border-b border-r border-[#e8ebe8] px-4 py-3 text-[10px] font-semibold uppercase tracking-[.06em] text-[#8a948e]">Order</th>
                {calendarDays.map((day) => (
                  <th key={day.key} className="border-b border-r border-[#e8ebe8] px-2 py-3 text-center text-[12px] font-bold text-[#1a2420] last:border-r-0">{day.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {calendarOrders.map((order) => (
                <tr key={order.id} className="last:[&>td]:border-b-0">
                  <td className="border-b border-r border-[#e8ebe8] px-4 py-4 align-top">
                    <p className="text-[12px] font-bold leading-none text-[#17231c]">{order.id}</p>
                    <p className="mt-1.5 text-[12px] font-semibold leading-none text-[#16854a]">{order.store}</p>
                    <p className="mt-1.5 text-[11px] leading-none text-[#7a847e]">{order.place}</p>
                    <p className="mt-1.5 text-[11px] leading-none text-[#7a847e]">{order.type}</p>
                  </td>
                  {calendarDays.map((day) => (
                    <td key={day.key} className="border-b border-r border-[#e8ebe8] px-2 py-3.5 text-center align-middle last:border-r-0">
                      <div className="flex min-h-[38px] items-center justify-center">
                        <CalendarSlotCell
                          slot={order.slots[day.key]}
                          onAssign={() => openAssignChamp(order, day)}
                        />
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

const dispatchRows = [
  { id: '#YJK-…50', route: 'VEERA → Juffair', type: 'Same Day', prep: '3 hrs', window: '30 Jun · 1–3 PM', champ: 'Ahmed K.', stage: 'Awaiting champ', timer: '38m to respond', tone: 'yellow' },
  { id: '#YJK-…51', route: 'Sharaf DG → Adliya', type: 'Economy', prep: '20 min', window: '30 Jun · 6–8 PM', champ: 'Yusuf R.', stage: 'Awaiting confirm', timer: '12m to confirm', tone: 'yellow' },
  { id: '#YJK-…62', route: 'The Green Kitchen → Seef', type: '★ Standard', prep: '~20 min', window: '30 Jun · 1–3 PM', champ: '—', stage: 'New · Paid', timer: '12m to confirm', tone: 'green' },
  { id: '#YJK-…63', route: 'Lulu Express → Manama', type: 'Same Day', prep: '~15 min', window: '30 Jun · 3–5 PM', champ: '—', stage: 'New · Awaiting payment', timer: '12m to confirm', tone: 'blue' },
  { id: '#YJK-…64', route: 'VEERA → Juffair', type: 'Next Day', prep: '~24 hrs', window: 'Tomorrow 5–8 PM', champ: '—', stage: 'New · Awaiting vendor', timer: '12m to confirm', tone: 'blue' },
  { id: '#YJK-…64', route: 'VEERA → Juffair', type: '★ Economy', prep: '~24 hrs', window: '01 Jul', champ: '—', stage: 'Auto-cancelled · expired', timer: '12m to confirm', tone: 'red' },
]

function ScheduledDispatchBoard({ data, view, onViewChange }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_220px] items-start gap-3 max-[900px]:grid-cols-1">
      <div className="min-w-0">
        <div className="mb-3 flex items-center gap-2">
          <OperationsViewTabs view={view} onViewChange={onViewChange} />
        </div>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {['Date: Today', 'Type: All', 'Stage: All', 'Zone: All'].map((filter) => (
            <Button key={filter} className="h-[29px] px-2.5">{filter} <ChevronDown size={10} /></Button>
          ))}
          <span className="flex-1" />
          <Button primary className="h-[31px] px-4"><Zap size={11} /> Auto-assign</Button>
        </div>
        <section className="overflow-hidden rounded-[10px] border border-[#dfe4e0] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] table-fixed border-collapse text-left">
              <colgroup>
                <col className="w-[11%]" /><col className="w-[21%]" /><col className="w-[10%]" /><col className="w-[10%]" />
                <col className="w-[15%]" /><col className="w-[11%]" /><col className="w-[19%]" /><col className="w-[3%]" />
              </colgroup>
              <thead>
                <tr className="h-[38px] border-b border-[#e8ebe9] bg-[#fafbfa] text-[8px] uppercase tracking-[.04em] text-[#8a948e]">
                  {['Order', 'Vendor → zone', 'Type', 'Prep', 'Window', 'Champ', 'Stage', ''].map((heading, index) => (
                    <th key={`${heading}-${index}`} className="whitespace-nowrap px-3 font-medium">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dispatchRows.map((order, index) => (
                  <tr key={`${order.id}-${index}`} className="h-[54px] border-b border-[#edf0ee] last:border-0 hover:bg-[#fafcfa]">
                    <td className="whitespace-nowrap px-3 text-[10px] font-bold">{order.id}</td>
                    <td className="truncate px-3 text-[10px] font-semibold">{order.route}</td>
                    <td className="px-3"><BoardTag>{order.type}</BoardTag></td>
                    <td className="whitespace-nowrap px-3 text-[10px] text-[#566159]">{order.prep}</td>
                    <td className="whitespace-nowrap px-3 text-[10px] font-medium">{order.window}</td>
                    <td className="whitespace-nowrap px-3 text-[10px]">{order.champ}</td>
                    <td className="px-3">
                      <div className="flex items-center gap-1 whitespace-nowrap">
                        <BoardStage tone={order.tone}>{order.stage}</BoardStage>
                        <span className="inline-flex items-center gap-0.5 text-[8px] text-[#a66f13]"><Clock3 size={8} />{order.timer}</span>
                      </div>
                    </td>
                    <td className="px-1"><button className="text-[9px] font-medium text-[#16854a]">View</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <IncidentLog incidents={[
          ...data.incidents.slice(0, 3),
          { priority: 'P4', name: 'Address unclear', detail: '#YJK-…48 · clarified', status: 'Resolved', time: '2h' },
        ]} countLabel="5 today" />
      </div>

      <aside className="space-y-3">
        <DispatchSummary title="Ops snapshot · Today">
          {[['Scheduled today', '18'], ['Unassigned', '5'], ['Re-confirm pending', '2']].map(([label, value]) => (
            <SummaryRow key={label} label={label} value={value} alert={label === 'Unassigned'} warning={label === 'Re-confirm pending'} />
          ))}
        </DispatchSummary>
        <DispatchSummary title="Windows today">
          {[['1–3 PM', '4 orders'], ['3–5 PM', '2 orders'], ['6–8 PM', '9 orders'], ['8–10 PM', '3 orders']].map(([label, value]) => (
            <SummaryRow key={label} label={label} value={value} pill />
          ))}
        </DispatchSummary>
        <DispatchSummary title="Champ capacity">
          <SummaryRow label="Available tonight" value="12" success />
          <Button primary className="mt-2 h-8 w-full rounded-[8px]"><Zap size={11} /> Auto-assign all</Button>
        </DispatchSummary>
      </aside>
    </div>
  )
}

function BoardTag({ children }) {
  const label = String(children)
  const tone = label.includes('Same Day')
    ? 'bg-[#e5f0ff] text-[#2978db]'
    : 'bg-[#f0f2f0] text-[#667169]'
  return <span className={cn('whitespace-nowrap rounded-full px-2 py-0.5 text-[8px] font-medium', tone)}>{children}</span>
}

function BoardStage({ children, tone }) {
  const tones = {
    yellow: 'bg-[#fff3d5] text-[#a06d16]',
    green: 'bg-[#e4f5e9] text-[#287a48]',
    blue: 'bg-[#e7f1fb] text-[#3575a7]',
    red: 'bg-[#fde9e9] text-[#c74747]',
  }
  return <span className={cn('rounded-full px-2 py-0.5 text-[8px] font-medium', tones[tone])}>{children}</span>
}

function DispatchSummary({ title, children }) {
  return (
    <section className="rounded-[10px] border border-[#dfe4e0] bg-white p-3 shadow-[0_1px_2px_rgba(25,45,32,.03)]">
      <h3 className="mb-3 text-[10px] font-bold">{title}</h3>
      <div className="space-y-2.5">{children}</div>
    </section>
  )
}

function SummaryRow({ label, value, alert = false, warning = false, success = false, pill = false }) {
  return (
    <div className="flex items-center justify-between text-[10px]">
      <span className="text-[#77827b]">{label}</span>
      <span className={cn(
        'font-bold text-[#17231c]',
        alert && 'text-[#d84448]',
        warning && 'text-[#b57a16]',
        success && 'text-[#16854a]',
        pill && 'rounded-full bg-[#f1f3f1] px-2 py-0.5 text-[9px] font-medium text-[#68736c]',
      )}>{value}</span>
    </div>
  )
}

function IncidentLog({ incidents, countLabel = '5' }) {
  const priorityTone = {
    P1: 'bg-[#fdebec] text-[#d84245]',
    P2: 'bg-[#fff3d6] text-[#c78a18]',
    P3: 'bg-[#eaf2fb] text-[#3974ad]',
    P4: 'bg-[#f0f2f0] text-[#737d77]',
  }
  return (
    <section className="mt-3 overflow-hidden rounded-lg border border-[#dfe4e0] bg-white">
      <div className="flex h-9 items-center border-b border-[#edf0ee] px-4">
        <ShieldAlert size={12} className="mr-2 text-[#d46763]" /><h3 className="text-[10px] font-bold">Incident log — scheduled</h3>
        <span className="ml-2 rounded-full bg-[#f0f2f0] px-2 text-[9px] text-[#718078]">{countLabel}</span>
        <button className="ml-auto text-[9px] font-medium text-[#16854a]">View all</button>
      </div>
      {incidents.map(({ priority, name, detail, status, time }) => (
        <div key={name} className="flex h-10 items-center border-b border-[#f0f2f0] px-4 last:border-0">
          <span className={cn('mr-3 grid h-[18px] min-w-[22px] place-items-center rounded-[6px] px-1.5 text-[9px] font-medium', priorityTone[priority] || priorityTone.P4)}>{priority}</span>
          <div className="min-w-0 flex-1"><p className="text-[9px] font-medium">{name}</p><p className="truncate text-[9px] text-[#99a09b]">{detail}</p></div>
          <Badge tone={status === 'Open' ? 'red' : 'green'}>{status}</Badge>
          <span className="ml-6 w-10 text-right text-[9px] text-[#929a95]">{time}</span>
        </div>
      ))}
    </section>
  )
}

function ChatStrip({ chats }) {
  return (
    <section className="mt-2 rounded-t-lg border border-b-0 border-[#dfe4e0] bg-white px-3 pb-2.5 pt-2">
      <div className="mb-1.5 flex items-center justify-between text-[9px]"><b>chats</b><span className="text-[#7a847e]">3 active</span></div>
      <div className="grid grid-cols-3 gap-2 max-[700px]:grid-cols-1">
        {chats.map(({ id, initials, name, role, message, unreadCount }) => (
          <button key={id} className="flex h-[50px] items-center rounded-md border border-[#e1e5e2] bg-white px-3 text-left">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-[#eaf2f8] text-[9px] font-medium text-[#4d7594]">{initials}</span>
            <span className="ml-2 min-w-0 flex-1"><span className="flex items-center gap-1.5 text-[9px] font-medium">{name}<i className="rounded bg-[#eef0fb] px-1 text-[9px] not-italic text-[#6967a8]">{role}</i></span><span className="block truncate text-[9px] text-[#9aa19c]">{message}</span></span>
            {unreadCount ? <span className="grid h-4 w-4 place-items-center rounded-full bg-[#d92d35] text-[9px] text-white">{unreadCount}</span> : null}
          </button>
        ))}
      </div>
    </section>
  )
}

function statusTone(status) {
  if (['Active', 'Open', 'Available', 'Ready', 'On delivery'].includes(status)) return 'green'
  if (['Pending', 'Under review', 'Scheduled', 'Draft', 'Busy'].includes(status)) return 'yellow'
  if (['Offline', 'Paused', 'Inactive', 'Suspended'].includes(status)) return 'red'
  return 'gray'
}

export function AdminManagement({ type }) {
  if (type === 'ui-editor') return <UiEditor />
  if (type === 'settings') return <SettingsPage />
  if (type === 'vendors') return <AdminVendorsPage />
  return <AdminManagementTable type={type} />
}

function AdminVendorsPage() {
  const [tab, setTab] = useState('All')
  const [query, setQuery] = useState('')
  const { data, error, isLoading, refetch } = useApiResource(() => adminService.getManagement('vendors'), [])

  const rows = useMemo(() => {
    if (!data?.rows) return []
    return data.rows.filter((row) => {
      const matchesTab = tab === 'All'
        || (tab === 'Pending' ? ['Pending', 'Draft'].includes(row.status) : row.status === tab)
      const haystack = `${row.name} ${row.id} ${row.category} ${row.status}`.toLowerCase()
      return matchesTab && haystack.includes(query.toLowerCase())
    })
  }, [data, tab, query])

  if (!data) return <ApiState isLoading={isLoading} error={error} onRetry={refetch} />

  const statTone = {
    ink: 'text-[#17231c]',
    green: 'text-[#1aa054]',
    orange: 'text-[#c4841a]',
    red: 'text-[#e14b42]',
  }

  const vendorStatusTone = (status) => {
    if (status === 'Active') return 'green'
    if (status === 'Suspended') return 'red'
    if (status === 'Pending') return 'yellow'
    return 'gray'
  }

  return (
    <div className="px-5 py-4 max-[700px]:px-3">
      <div className="mb-3.5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[20px] font-bold tracking-[-0.02em] text-[#17231c]">{data.title}</h2>
        <button
          type="button"
          className="inline-flex h-[34px] items-center gap-1.5 rounded-[8px] bg-[#1aa054] px-3.5 text-[12px] font-medium text-white hover:bg-[#158a47]"
        >
          <Plus size={14} strokeWidth={2.2} /> {data.action}
        </button>
      </div>

      <div className="mb-3.5 grid grid-cols-4 gap-3 max-[900px]:grid-cols-2 max-[520px]:grid-cols-1">
        {data.stats.map(({ label, value, tone }) => (
          <div
            key={label}
            className="rounded-[10px] border border-[#e8ebe9] bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(20,40,28,.04)]"
          >
            <p className="text-[10px] font-medium uppercase tracking-[0.04em] text-[#8a948e]">{label}</p>
            <p className={cn('mt-2 text-[24px] font-bold leading-none', statTone[tone] || statTone.ink)}>{value}</p>
          </div>
        ))}
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap items-center gap-1">
          {data.tabs.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              className={cn(
                'h-[30px] rounded-full px-3.5 text-[12px] font-medium',
                tab === item
                  ? 'bg-[#e9ecea] text-[#17231c]'
                  : 'text-[#657169] hover:bg-[#f0f2f0]',
              )}
            >
              {item}
            </button>
          ))}
        </div>
        <span className="flex-1" />
        <button
          type="button"
          className="inline-flex h-[32px] items-center gap-1 rounded-[8px] border border-[#dfe4e0] bg-white px-3 text-[12px] font-medium text-[#455249]"
        >
          All categories <ChevronDown size={13} />
        </button>
        <label className="flex h-[32px] w-[210px] items-center gap-2 rounded-[8px] border border-[#dfe4e0] bg-white px-2.5 max-[700px]:w-full">
          <Search size={14} className="text-[#9aa49d]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="min-w-0 flex-1 border-0 bg-transparent text-[12px] text-[#17231c] outline-none placeholder:text-[#9aa49d]"
            placeholder="Search vendors"
          />
        </label>
      </div>

      <section className="overflow-hidden rounded-[10px] border border-[#e8ebe9] bg-white shadow-[0_1px_2px_rgba(20,40,28,.04)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-left">
            <thead>
              <tr className="border-b border-[#edf0ee] bg-[#f7f8f7]">
                {data.columns.map((column) => (
                  <th
                    key={column}
                    className="whitespace-nowrap px-4 py-3 text-[10px] font-medium uppercase tracking-[0.05em] text-[#8a948e]"
                  >
                    {column}
                  </th>
                ))}
                <th className="w-11" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-[#f0f2f0] last:border-0 hover:bg-[#fafbfa]">
                  <td className="whitespace-nowrap px-4 py-3.5 text-[13px] font-bold text-[#17231c]">{row.name}</td>
                  <td className="whitespace-nowrap px-4 py-3.5">
                    <span className="inline-flex items-center gap-1.5 text-[12px] text-[#59655e]">
                      {row.id}
                      <button
                        type="button"
                        className="text-[#b0b8b2] hover:text-[#59655e]"
                        aria-label={`Copy ${row.id}`}
                        onClick={() => navigator.clipboard?.writeText(row.id)}
                      >
                        <Copy size={12} />
                      </button>
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-[12px] text-[#455249]">{row.category}</td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-[12px] text-[#455249]">{row.orders}</td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-[12px] text-[#455249]">{row.branches}</td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-[12px] text-[#455249]">{row.users}</td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-[12px] font-medium text-[#17231c]">★ {row.rating}</td>
                  <td className="whitespace-nowrap px-4 py-3.5">
                    <Badge tone={vendorStatusTone(row.status)}>{row.status}</Badge>
                  </td>
                  <td className="px-2">
                    <button
                      type="button"
                      className="grid h-8 w-8 place-items-center rounded-md text-[#8a948e] hover:bg-[#f3f5f3] hover:text-[#455249]"
                      aria-label={`More actions for ${row.name}`}
                    >
                      <MoreVertical size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function AdminManagementTable({ type }) {
  const [query, setQuery] = useState('')
  const { data: config, error, isLoading, refetch } = useApiResource(() => adminService.getManagement(type), [type])
  const visibleRows = useMemo(
    () => config?.rows.filter((row) => Array.isArray(row) && row.join(' ').toLowerCase().includes(query.toLowerCase())) || [],
    [config, query],
  )
  if (!config) return <ApiState isLoading={isLoading} error={error} onRetry={refetch} />

  return (
    <div className="p-7 max-[700px]:p-4">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div><h2 className="text-[20px] font-bold">{config.title}</h2><p className="mt-1 text-[11px] text-[#7c8780]">{config.subtitle}</p></div>
        <Button primary><Plus size={14} /> {config.action}</Button>
      </div>
      <div className="mb-4 grid grid-cols-4 gap-3 max-[900px]:grid-cols-2">
        {config.stats.map(({ label, value }) => (
          <div key={label} className="rounded-lg border border-[#e2e6e3] bg-white p-4">
            <p className="text-[11px] font-medium text-[#7e8982]">{label}</p><p className="mt-1.5 text-xl font-bold">{value}</p>
          </div>
        ))}
      </div>
      <section className="overflow-hidden rounded-lg border border-[#e2e6e3] bg-white">
        <Toolbar placeholder={`Search ${config.title.toLowerCase()}…`} onSearch={setQuery} />
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead><tr className="border-b border-[#e8ebe9] bg-[#fafbfa]">{config.columns.map((column) => <th key={column} className="whitespace-nowrap px-4 py-3 text-[10px] font-medium uppercase tracking-[.04em] text-[#78837c]">{column}</th>)}<th /></tr></thead>
            <tbody>
              {visibleRows.map((row) => (
                <tr key={row[0]} className="border-b border-[#eef1ef] last:border-0 hover:bg-[#fafcfa]">
                  {row.map((cell, index) => (
                    <td key={index} className={cn('whitespace-nowrap px-4 py-3 text-[11px]', index === 0 && 'font-medium')}>
                      {index === row.length - 1 ? <Badge tone={statusTone(cell)}>{cell}</Badge> : cell}
                    </td>
                  ))}
                  <td className="px-3"><button className="text-[#7d8781]"><MoreHorizontal size={16} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-[#e8ebe9] px-4 py-3 text-[10px] text-[#7c8780]">
          <span>Showing {visibleRows.length} of {config.stats[0].value}</span>
          <div className="flex gap-1"><Button className="h-7 px-2">Previous</Button><Button className="h-7 px-2">Next</Button></div>
        </div>
      </section>
    </div>
  )
}

function UiEditor() {
  const [accent, setAccent] = useState('#118446')
  return (
    <div className="grid min-h-[calc(100vh-64px)] grid-cols-[320px_1fr] max-[900px]:grid-cols-1">
      <section className="border-r border-[#e2e6e3] bg-white p-5">
        <h2 className="text-lg font-bold">UI Editor</h2>
        <p className="mt-1 text-[11px] text-[#7b867f]">Customize customer-facing app surfaces</p>
        <div className="mt-6 space-y-5">
          <label className="block text-[13px] font-medium">Brand color<input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="mt-2 block h-10 w-full rounded border border-[#dfe4e0]" /></label>
          <label className="block text-[13px] font-medium">Home layout<select className="mt-2 h-10 w-full rounded-md border border-[#dfe4e0] px-3 text-xs"><option>Campaign hero + categories</option><option>Categories first</option></select></label>
          <label className="block text-[13px] font-medium">Homepage announcement<textarea className="mt-2 h-20 w-full resize-none rounded-md border border-[#dfe4e0] p-3 text-xs" defaultValue="Free delivery on your first order" /></label>
          <Button primary className="w-full"><Check size={14} /> Publish changes</Button>
        </div>
      </section>
      <section className="grid place-items-center bg-[#eef1ef] p-8">
        <div className="h-[560px] w-[285px] overflow-hidden rounded-[32px] border-[7px] border-[#202722] bg-white shadow-xl">
          <div className="h-8 bg-[#17231c]" />
          <div className="p-4 text-white" style={{ background: accent }}>
            <p className="text-[10px] opacity-80">Delivering to</p><b className="text-xs">Seef, Bahrain</b>
            <div className="mt-4 rounded-lg bg-white/95 p-3 text-[10px] text-[#7b867f]">What are you looking for?</div>
          </div>
          <div className="p-4"><h3 className="text-sm font-bold">Good evening 👋</h3><div className="mt-3 h-28 rounded-lg" style={{ background: `${accent}20` }} /><div className="mt-5 grid grid-cols-3 gap-2">{[1,2,3,4,5,6].map((item) => <div key={item} className="aspect-square rounded-lg bg-[#edf0ee]" />)}</div></div>
        </div>
      </section>
    </div>
  )
}

function SettingsPage() {
  return (
    <div className="mx-auto max-w-[920px] p-7 max-[700px]:p-4">
      <h2 className="text-[20px] font-bold">Platform settings</h2>
      <p className="mt-1 text-[11px] text-[#7c8780]">Manage global operational and account preferences</p>
      <div className="mt-5 grid grid-cols-[210px_1fr] gap-4 max-[750px]:grid-cols-1">
        <nav className="rounded-lg border border-[#e2e6e3] bg-white p-2">
          {['General', 'Regions & zones', 'Order settings', 'Payments', 'Notifications', 'Integrations', 'Security'].map((item, index) => <button key={item} className={cn('block h-9 w-full rounded-md px-3 text-left text-xs', index === 0 ? 'bg-[#e8f7ed] font-medium text-[#118446]' : 'text-[#657169] hover:bg-[#f5f7f5]')}>{item}</button>)}
        </nav>
        <section className="rounded-lg border border-[#e2e6e3] bg-white">
          <div className="border-b border-[#e8ebe9] p-5"><h3 className="text-sm font-bold">General settings</h3><p className="mt-1 text-[10px] text-[#7c8780]">Default platform configuration</p></div>
          <div className="space-y-5 p-5">
            {[['Platform name', 'Yjeek'], ['Support email', 'support@yjeek.com'], ['Default country', 'Bahrain'], ['Default currency', 'BHD']].map(([label, value]) => <label key={label} className="block text-[13px] font-medium">{label}<input defaultValue={value} className="mt-2 h-10 w-full rounded-md border border-[#dfe4e0] px-3 text-xs outline-none focus:border-[#118446]" /></label>)}
            <div className="flex justify-end"><Button primary>Save changes</Button></div>
          </div>
        </section>
      </div>
    </div>
  )
}
