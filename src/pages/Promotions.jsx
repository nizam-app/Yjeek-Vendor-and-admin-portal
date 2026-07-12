import { useState } from 'react'
import { StatusPill } from '../components/ui'
import { promotionFilters, promotionKpis, promotions } from '../data/mockData'

const thClass = 'text-left text-[11px] tracking-[0.04em] text-ink-muted font-bold uppercase py-3 px-4 border-b border-border'
const tdClass = 'py-[14px] px-4 text-[13px] text-ink'

export default function Promotions() {
  const [filter, setFilter] = useState('All')

  const filtered = filter === 'All' ? promotions : promotions.filter((p) => p.status === filter)

  return (
    <div className="pt-[26px] px-[28px] pb-10">
      <div className="flex items-start justify-between gap-4 mb-4">
        <h1 className="text-[26px] font-bold text-ink">Promotions</h1>
        <button type="button" className="bg-green-primary text-white rounded-[9px] py-[10px] px-4 text-[13px] font-semibold hover:brightness-[0.96]">
          + New promotion
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-4 max-[1200px]:grid-cols-2">
        {promotionKpis.map((kpi) => (
          <div key={kpi.label} className="bg-white border border-border rounded-lg p-[14px] min-h-[92px]">
            <div className="text-[11px] font-bold tracking-[0.04em] text-ink-muted uppercase">{kpi.label}</div>
            <div className="mt-[10px] text-[22px] font-bold text-ink">{kpi.value}</div>
            {kpi.delta ? (
              <div className="mt-2 text-xs text-green-primary flex items-center gap-1">▲ {kpi.delta}</div>
            ) : kpi.note ? (
              <div className="mt-2 text-xs text-ink-muted">{kpi.note}</div>
            ) : null}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="inline-flex bg-[#eef1ee] rounded-[10px] p-[3px] gap-[2px]">
          {promotionFilters.map((f) => (
            <button
              key={f}
              type="button"
              className={`py-[6px] px-[14px] rounded-[8px] text-xs font-semibold whitespace-nowrap ${
                filter === f ? 'bg-white text-ink shadow-card' : 'text-ink-muted'
              }`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2.5">
          <div className="bg-white border border-border rounded-[9px] py-[9px] px-3 flex items-center gap-1.5 text-[12.5px] whitespace-nowrap">
            <span className="font-semibold text-ink">All types</span>
            <span className="text-ink-muted text-[10px]">▾</span>
          </div>
          <div className="bg-white border border-border rounded-[9px] py-[9px] px-3 flex items-center gap-2 text-[12.5px] text-ink-faint">
            <span>🔍</span>
            <span>Search promotions</span>
          </div>
        </div>
      </div>

      <div className="bg-white border border-border rounded-lg shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#fafafa]">
                <th className={thClass}>PROMOTION</th>
                <th className={thClass}>TYPE</th>
                <th className={thClass}>SCOPE</th>
                <th className={thClass}>STATUS</th>
                <th className={thClass}>PERIOD</th>
                <th className={thClass}>USED</th>
                <th className={thClass} />
              </tr>
            </thead>
            <tbody>
              {filtered.map((promo, idx) => {
                const border = idx === filtered.length - 1 ? '' : 'border-b border-border'
                return (
                  <tr key={promo.title}>
                    <td className={`${tdClass} ${border}`}>
                      <p className="font-bold text-ink">{promo.title}</p>
                      <p className="text-[11.5px] text-ink-muted mt-0.5">{promo.subtitle}</p>
                    </td>
                    <td className={`${tdClass} ${border}`}>
                      <span className="inline-flex items-center bg-green-active-bg text-green-active-text rounded-full py-[3px] px-[9px] text-[11px] font-semibold whitespace-nowrap">
                        {promo.type}
                      </span>
                    </td>
                    <td className={`${tdClass} ${border} text-ink-muted`}>{promo.scope}</td>
                    <td className={`${tdClass} ${border}`}>
                      <StatusPill status={promo.status} />
                    </td>
                    <td className={`${tdClass} ${border} text-ink-muted`}>{promo.period}</td>
                    <td className={`${tdClass} ${border}`}>{promo.used}</td>
                    <td className={`${tdClass} ${border} text-right`}>
                      <button type="button" className="w-7 h-7 rounded-[8px] text-ink-muted text-lg font-bold hover:bg-[#f5f7f5]">
                        ⋮
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
