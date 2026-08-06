import { useState } from 'react'
import { Activity, AlertCircle, Check, Clock, Flame, XCircle } from 'lucide-react'
import { PageHeader, StatusPill } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'
import { useVendorDashboard } from '../../hooks/vendor/useVendorDashboard'

const kpiIcons = {
  Completed: { icon: Check, tone: 'green' },
  'Active Now': { icon: Flame, tone: 'amber' },
  Rejected: { icon: AlertCircle, tone: 'red' },
  Cancelled: { icon: XCircle, tone: 'red' },
  Acceptance: { icon: Activity, tone: 'green' },
  'Avg Prep': { icon: Clock, tone: 'blue' },
}

function formatPeriodDate(value) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const year = date.getFullYear()
  return `${month}/${day}/${year}`
}

export default function Dashboard() {
  const { user } = useAuth()
  const [range, setRange] = useState('Day')
  const { data, error, isLoading, refetch } = useVendorDashboard({ rangeLabel: range })

  const thClass = 'text-left text-[11px] tracking-[0.04em] text-ink-muted font-bold uppercase py-3 px-4 border-b border-border'
  const tdClass = 'py-[14px] px-4 text-[13px] text-ink'
  if (isLoading) return <div className="p-7 text-[13px] text-ink-muted">Loading dashboard…</div>
  if (error) return <div className="p-7 text-[13px] text-danger">Unable to load dashboard. <button onClick={refetch} className="underline">Try again</button></div>

  const kpis = data?.kpis || []
  const recentOrders = data?.recentOrders || []
  const revenueDays = data?.revenueDays || []
  const topSellers = data?.topSellers || []
  const greetingName = user?.vendorName || user?.name || 'Green Kitchen'
  const periodFrom = formatPeriodDate(data?.period?.from) || '05/16/2026'
  const periodTo = formatPeriodDate(data?.period?.to) || '06/15/2026'

  return (
    <div className="pt-[26px] px-[28px] pb-10">
      <PageHeader
        title={`Hi, ${greetingName}`}
        actions={
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="border border-border rounded-[8px] py-2 px-[10px] text-xs bg-white">{periodFrom}</div>
              <span className="text-ink-muted text-[13px] font-medium">→</span>
              <div className="border border-border rounded-[8px] py-2 px-[10px] text-xs bg-white">{periodTo}</div>
            </div>
            <div className="inline-flex bg-[#eef1ee] rounded-[10px] p-[3px] gap-[2px]" style={{ float: 'right' }}>
              {['Day', 'Week', 'Month'].map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`py-[6px] px-[14px] rounded-[8px] text-xs font-medium ${
                    range === item ? 'bg-white text-ink shadow-card' : 'text-ink-muted'
                  }`}
                  onClick={() => setRange(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        }
      />

      <div className="grid grid-cols-7 gap-3 mb-4 max-[1200px]:grid-cols-4 max-[900px]:grid-cols-2">
        {kpis.map((kpi) => {
          const meta = kpiIcons[kpi.label]
          const toneClasses = {
            green: 'bg-green-active-bg text-green-active-text',
            amber: 'bg-warn-soft text-warn',
            red: 'bg-danger-soft text-danger',
            blue: 'bg-info-soft text-[#2978db]',
          }
          return (
            <div key={kpi.label} className="bg-white border border-border rounded-lg p-[14px] min-h-[104px]">
              <div className="flex items-center gap-2 text-[11px] font-bold tracking-[0.04em] text-ink-muted uppercase">
                {kpi.prefix ? (
                  <span className="bg-[#eef6f0] text-green-active-text rounded-[6px] py-[2px] px-[6px] text-[10px]">{kpi.prefix}</span>
                ) : meta ? (
                  <span
                    className={`inline-flex items-center justify-center w-[30px] h-4 rounded-[8px] shrink-0 ${toneClasses[meta.tone]}`}
                  >
                    <meta.icon size={13} strokeWidth={2.5} />
                  </span>
                ) : null}
                {kpi.label}
              </div>
              <div className="mt-[10px] text-[20px] font-bold">{kpi.value}</div>
              {kpi.delta ? (
                <div className="mt-2 text-xs text-green-primary flex items-center gap-1">▲ {kpi.delta}</div>
              ) : null}
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-[2fr_1fr] gap-4 mb-4 max-[1200px]:grid-cols-1">
        <div className="bg-white border border-border rounded-lg shadow-card overflow-hidden py-[18px] px-5">
          <div className="text-[16px] font-bold mb-[14px] flex items-center justify-between">
            <span>Revenue chart</span>
            <span className="text-ink-muted text-[13px] font-medium">
              {data?.chartSubtitle || 'today'}
            </span>
          </div>
          <div className="flex items-end gap-4 h-[220px] pt-3">
            {revenueDays.length === 0 ? (
              <div className="w-full h-full grid place-items-center text-[13px] text-ink-muted">No revenue data for this period</div>
            ) : (
              revenueDays.map((d) => (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <div
                    className="w-full max-w-[70px] rounded-t-[6px] rounded-b-[2px] bg-[linear-gradient(180deg,#3bc46a,var(--color-green-primary))] min-h-2"
                    style={{ height: `${d.height}%` }}
                  />
                  <span className="text-[11px] text-ink-muted font-medium">{d.day}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white border border-border rounded-lg shadow-card overflow-hidden py-[18px] px-5">
          <div className="text-[16px] font-bold mb-[14px] flex items-center justify-between">🏆 Top sellers</div>
          {topSellers.length === 0 ? (
            <div className="py-6 text-[13px] text-ink-muted">No top sellers for this period</div>
          ) : (
            topSellers.map((item, idx) => (
              <div key={item.productId || `${item.name}-${item.rank || idx}`} className="flex items-center justify-between py-2 text-[13px]">
                <div className="flex items-center gap-2.5">
                  <span className="w-[22px] h-[13px] rounded-[6px] bg-green-active-bg grid place-items-center text-[11px] font-bold text-green-active-text">
                    {item.rank || idx + 1}
                  </span>
                  <span className="min-w-[120px] h-4 font-medium text-[13px] leading-[100%] tracking-[0%] whitespace-nowrap">
                    {item.name}
                  </span>
                </div>
                <span className="text-ink-muted text-[13px] font-medium">{item.sold} sold</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="bg-white border border-border rounded-lg shadow-card overflow-hidden">
        <div className="pt-[18px] px-5">
          <div className="text-[16px] font-bold mb-[14px] flex items-center justify-between">Recent orders</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#fafafa]">
                <th className={thClass}>ORDER #</th>
                <th className={thClass}>TYPE</th>
                <th className={thClass}>STATUS</th>
                <th className={thClass}>BRANCH</th>
                <th className={thClass}>TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className={`${tdClass} text-ink-muted`}>
                    No recent orders for this period
                  </td>
                </tr>
              ) : (
                recentOrders.map((order, idx) => {
                  const border = idx === recentOrders.length - 1 ? '' : 'border-b border-border'
                  return (
                    <tr key={order.id}>
                      <td className={`${tdClass} ${border}`}>
                        <strong>{order.id}</strong>
                      </td>
                      <td className={`${tdClass} ${border} text-ink-muted`}>{order.type}</td>
                      <td className={`${tdClass} ${border} `}>
                        <StatusPill status={order.status} />
                      </td>
                      <td className={`${tdClass} ${border}`}>{order.branch}</td>
                      <td className={`${tdClass} ${border}`}>
                        <strong>{order.total}</strong>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
