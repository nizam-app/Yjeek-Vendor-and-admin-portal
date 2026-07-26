import { ChevronRight, Clock3, Flame, ShieldAlert, ShieldCheck, TriangleAlert } from 'lucide-react'
import { useApiResource } from '../../../hooks/useApiResource'
import { adminService } from '../../../services/adminService'
import { ApiState } from '../../../components/admin/ApiState'
import { cn } from '../../../components/admin/cn'

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

export default function AdminDashboardPage() {
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
                      <span className={cn('flex items-center gap-3 text-[11px] font-medium leading-3', column.tone === 'red' ? 'text-[#d34b4d]' : 'text-[#b27b17]')}>
                      ⏱ 
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
