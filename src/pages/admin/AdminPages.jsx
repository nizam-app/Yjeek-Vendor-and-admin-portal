import { useEffect, useMemo, useState } from 'react'
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

function OrderCard({ order, mode }) {
  const actionStyles = {
    green: 'border-[#19ad5b] bg-[#19ad5b] text-white',
    red: 'border-[#e12e32] bg-[#e12e32] text-white',
    redSoft: 'border-[#fde5e5] bg-[#fde5e5] text-[#bd3b3e]',
    blue: 'border-[#dcecf8] bg-[#e8f3fb] text-[#35729d]',
  }
  return (
    <article className="rounded-md border border-[#e1e5e2] bg-white p-[11px] shadow-[0_1px_2px_rgba(20,40,28,.04)]">
      <div className="flex items-center justify-between">
        <b className="text-[11px]">{order.id}</b>
        <div className="flex gap-1">
          {order.tags.map((tag) => <span key={tag} className={cn('text-[9px] font-medium', tag.includes('Special') ? 'text-[#9a4ea8]' : tag.includes('Day') ? 'text-[#5a69b4]' : 'text-[#69736d]')}>{tag}</span>)}
        </div>
      </div>
      <div className={cn('mt-1 text-[9px] font-medium', order.payment.includes('Declined') || order.payment.includes('expired') ? 'text-[#c54749]' : order.payment.includes('Paid') || order.payment.includes('Ready') ? 'text-[#278d51]' : 'text-[#b4811c]')}>{order.payment}</div>
      <p className="mt-1 text-[10px] font-medium">{order.route}</p>
      {order.slot ? <p className="mt-1 text-[9px] text-[#78827c]">{order.slot}</p> : null}
      {order.champ ? <p className="mt-1 text-[9px] text-[#536158]">♟ {order.champ}</p> : null}
      {order.action ? <button className={cn('mt-2 h-[26px] w-full rounded border text-[9px] font-medium', order.actionTone ? actionStyles[order.actionTone] : 'border-[#dfe4e0] bg-white text-[#4e5a52]')}>{order.action}</button> : null}
      {order.timer ? <div className="mt-1.5 rounded bg-[#fff3d7] px-2 py-1.5 text-center text-[9px] font-medium text-[#9c6b14]">{order.timer}</div> : null}
      {order.note ? <p className="mt-1 text-[9px] leading-tight text-[#8a938d]">{order.note}</p> : null}
      {order.footer ? <button className="mt-1.5 h-[24px] w-full rounded bg-[#ff940f] text-[9px] font-medium text-white">{order.footer}</button> : null}
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
      <div className="mb-2 flex items-center justify-between text-[11px]"><b>💬 Open chats</b><span className="text-[#657169]">3 active</span></div>
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
  return <AdminOperationsBoard mode={mode} />
}

function AdminOperationsBoard({ mode }) {
  const [view, setView] = useState('Pipeline')
  const { data, error, isLoading, refetch } = useApiResource(() => adminService.getOperations(mode), [mode])
  const title = mode === 'scheduled' ? 'Scheduled orders — pipeline' : `${mode[0].toUpperCase()}${mode.slice(1).replace('-', ' ')} — live operations`
  if (!data) return <ApiState isLoading={isLoading} error={error} onRetry={refetch} />

  return (
    <div className={cn('px-7 pt-[18px] max-[700px]:p-4', mode === 'scheduled' ? 'pb-0' : 'pb-[18px]')}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="text-[18px] font-bold">{title}</h2></div>
      </div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {['Pipeline', 'Board', 'Calendar'].map((item) => (
          <button key={item} onClick={() => setView(item)} className={cn('h-[29px] rounded-md border px-3 text-[10px] font-medium', view === item ? 'border-[#17231c] bg-[#17231c] text-white' : 'border-[#dfe4e0] bg-white text-[#69756d]')}>{item}</button>
        ))}
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
                <button className="grid h-5 w-5 place-items-center rounded bg-white text-[#738078]"><ArrowUpRight size={11} /></button>
              </div>
              <div className="space-y-2">
                {cards.map((order, index) => <OrderCard key={`${column.key}-${order.id}-${index}`} order={order} mode={mode} />)}
              </div>
            </section>
          )
        })}
      </div>
      <IncidentLog incidents={data.incidents} />
      <ChatStrip chats={data.chats} />
    </div>
  )
}

function IncidentLog({ incidents }) {
  return (
    <section className="mt-3 overflow-hidden rounded-lg border border-[#dfe4e0] bg-white">
      <div className="flex h-9 items-center border-b border-[#edf0ee] px-4">
        <ShieldAlert size={12} className="mr-2 text-[#d46763]" /><h3 className="text-[10px] font-bold">Incident log — scheduled</h3>
        <span className="ml-2 rounded-full bg-[#f0f2f0] px-2 text-[9px] text-[#718078]">5</span>
        <button className="ml-auto text-[9px] font-medium text-[#16854a]">View all</button>
      </div>
      {incidents.map(({ priority, name, detail, status, time }) => (
        <div key={name} className="flex h-10 items-center border-b border-[#f0f2f0] px-4 last:border-0">
          <span className={cn('mr-3 text-[9px] font-medium', priority === 'P1' ? 'text-[#d84245]' : priority === 'P2' ? 'text-[#dc9a20]' : 'text-[#5083ad]')}>{priority}</span>
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
  if (['Offline', 'Paused', 'Inactive'].includes(status)) return 'red'
  return 'gray'
}

export function AdminManagement({ type }) {
  if (type === 'ui-editor') return <UiEditor />
  if (type === 'settings') return <SettingsPage />
  return <AdminManagementTable type={type} />
}

function AdminManagementTable({ type }) {
  const [query, setQuery] = useState('')
  const { data: config, error, isLoading, refetch } = useApiResource(() => adminService.getManagement(type), [type])
  const visibleRows = useMemo(
    () => config?.rows.filter((row) => row.join(' ').toLowerCase().includes(query.toLowerCase())) || [],
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
