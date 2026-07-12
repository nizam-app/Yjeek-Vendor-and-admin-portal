import { useState } from 'react'
import { StatusPill } from '../components/ui'
import { orderHistory } from '../data/mockData'

const fieldLabelClass = 'text-[10px] font-bold text-ink-muted tracking-[0.02em] uppercase'
const selectClass =
  'h-10 border border-border rounded-[8px] px-3 flex items-center justify-between gap-2 text-xs text-ink-faint bg-white whitespace-nowrap'

const thClass = 'text-left text-[10px] tracking-[0.02em] text-ink-muted font-bold uppercase'
const tdClass = 'text-[12px] text-ink'

export default function OrdersHistory() {
  const [query, setQuery] = useState('')
  const filtered = orderHistory.filter(
    (o) =>
      o.id.toLowerCase().includes(query.toLowerCase()) ||
      o.branch.toLowerCase().includes(query.toLowerCase()) ||
      o.status.toLowerCase().includes(query.toLowerCase()) ||
      o.customer.toLowerCase().includes(query.toLowerCase()),
  )

  return (
    <div className="pt-[26px] px-[28px] pb-10">
      <div className="flex items-start justify-between mb-[22px]">
        <h1 className="text-[26px] font-bold text-ink">Orders</h1>
        <button type="button" className="border border-border rounded-[8px] py-[10px] px-[18px] text-[13px] font-semibold bg-white">
          ↻ Refresh
        </button>
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
        <div className="flex flex-col gap-1.5">
          <span className={fieldLabelClass}>Type</span>
          <div className={`${selectClass} w-[140px]`}>
            <span>All types</span>
            <span className="text-ink-muted text-[11px]">▾</span>
          </div>
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
              {filtered.map((order, idx) => (
                <tr key={order.id} className={`${idx % 2 === 1 ? 'bg-[#fbfcfb]' : ''} border-t border-border`}>
                  <td className={`${tdClass} py-[15px] px-5 font-semibold text-green-active-text`}>{order.id}</td>
                  <td className={`${tdClass} py-[15px] px-5 text-ink-muted`}>{order.type}</td>
                  <td className="py-[15px] px-5">
                    <StatusPill status={order.status} />
                  </td>
                  <td className={`${tdClass} py-[15px] px-5`}>{order.branch}</td>
                  <td className={`${tdClass} py-[15px] px-5`}>{order.customer}</td>
                  <td className={`${tdClass} py-[15px] px-5 text-ink-muted`}>{order.when}</td>
                  <td className={`${tdClass} py-[15px] px-5 font-bold`}>{order.total}</td>
                  <td className="py-[15px] px-5 text-right">
                    <button type="button" className="w-7 h-7 rounded-[8px] text-ink-muted text-lg font-bold hover:bg-[#f5f7f5]">
                      ⋮
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
