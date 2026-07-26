import { useState } from 'react'
import { ArrowUpRight, ChevronDown, Clock3, RefreshCw, ShieldAlert, ShieldCheck, TriangleAlert } from 'lucide-react'
import { useApiResource } from '../../../hooks/useApiResource'
import { ApiState } from '../ApiState'
import { Button } from '../Button'
import { cn } from '../cn'
import { AdminChatPanel } from './AdminChatPanel'
import { AdminOpenChats } from './AdminOpenChats'

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

export function AdminIncidentBoard({ fetchData }) {
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
              <Button className="h-[31px] px-3">All vendors ▾</Button>
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
