import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { StatusPill } from '../../components/ui'
import { useVendorPromotions } from '../../hooks/vendor/useVendorPromotions'

const thClass =
  'border-b border-[#E0E6E0] px-5 py-3.5 text-left text-[11px] font-bold tracking-[0.04em] text-ink-muted uppercase'
const tdClass = 'px-5 py-[15px] text-[13px] text-ink'

const typeTone = {
  'Item / category deal': 'bg-green-active-bg text-green-active-text border-green-active-text',
  'Free delivery': 'bg-green-active-bg text-green-active-text ',
  'Buy X Get Y': 'bg-[#E8F5EC] text-[#127036] border-[#127036]',
  '% off': 'bg-green-active-bg text-green-active-text border-green-active-text',
}

export default function Promotions() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState('All')
  const [query, setQuery] = useState('')
  const [menuId, setMenuId] = useState(null)
  const menuRef = useRef(null)
  const { data, error, isLoading, refetch } = useVendorPromotions()
  const promotionFilters = data?.filters || ['All', 'Active', 'Scheduled', 'Paused', 'Ended']
  const promotionKpis = data?.kpis || []
  const promotions = data?.promotions || []

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return promotions.filter((p) => {
      const matchesFilter = filter === 'All' || p.status === filter
      if (!matchesFilter) return false
      if (!needle) return true
      return [p.title, p.subtitle, p.type, p.scope, p.status, p.period]
        .join(' ')
        .toLowerCase()
        .includes(needle)
    })
  }, [promotions, filter, query])

  useEffect(() => {
    if (!menuId) return undefined
    function onDocClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuId(null)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [menuId])

  if (isLoading && promotions.length === 0) {
    return <div className="p-7 text-[13px] text-ink-muted">Loading promotions…</div>
  }
  if (error && promotions.length === 0) {
    return (
      <div className="p-7 text-[13px] text-danger">
        Unable to load promotions.{' '}
        <button type="button" onClick={refetch} className="underline">
          Try again
        </button>
      </div>
    )
  }

  function openDetail(promo) {
    navigate(`/promotions/${encodeURIComponent(promo.id)}`)
  }

  return (
    <div className="px-[28px] pt-[26px] pb-10">
      <div className="mb-4 flex items-start justify-between gap-4">
        <h1 className="text-[20px] font-bold text-ink">Promotions</h1>
        <button
          type="button"
          onClick={() => navigate('/promotions/new')}
          className="rounded-[9px] bg-green-primary px-4 py-[10px] text-[13px] font-medium text-white hover:brightness-[0.96]"
        >
          + New promotion
        </button>
      </div>

      <div className="mb-4 grid grid-cols-4 gap-3 max-[1200px]:grid-cols-2">
        {promotionKpis.map((kpi) => (
          <div
            key={kpi.label}
            className="min-h-[92px] rounded-[12px] border border-[#E0E6E0] bg-white p-[14px]"
          >
            <div className="text-[11px] font-bold tracking-[0.04em] text-ink-muted uppercase">
              {kpi.label}
            </div>
            <div className="mt-[10px] text-[20px] font-bold text-ink">{kpi.value}</div>
            {kpi.delta ? (
              <div className="mt-2 flex items-center gap-1 text-xs text-green-primary">
                ▲ {kpi.delta}
              </div>
            ) : kpi.note ? (
              <div className="mt-2 text-xs text-ink-muted">{kpi.note}</div>
            ) : null}
          </div>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex gap-[2px] rounded-[10px] bg-[#eef1ee] p-[3px]">
          {promotionFilters.map((f) => (
            <button
              key={f}
              type="button"
              className={`rounded-[8px] px-[14px] py-[6px] text-xs font-medium whitespace-nowrap ${
                filter === f ? 'bg-white text-ink shadow-card' : 'text-ink-muted'
              }`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 rounded-full border border-[#E0E6E0] bg-white px-4 py-[10px] text-[12.5px] whitespace-nowrap">
            <span className="font-medium text-ink">All types</span>
            <span className="text-[10px] text-ink-muted">▾</span>
          </div>
          <div className="flex min-w-[200px] items-center gap-2 rounded-[10px] border border-[#E0E6E0] bg-white px-3 py-[9px] text-[12.5px]">
            <Search size={15} strokeWidth={2.2} className="shrink-0 text-ink-faint" />
            <input
              type="search"
              className="w-full border-none bg-transparent text-[12.5px] text-ink outline-none placeholder:text-ink-faint"
              placeholder="Search promotions"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-[14px] border border-[#E0E6E0] bg-white shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#F7F8F7]">
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
              {filtered.length > 0 ? (
                filtered.map((promo) => {
                  const menuOpen = menuId === promo.id
                  return (
                    <tr
                      key={promo.id}
                      className="cursor-pointer border-t border-[#EEF1EE] bg-white hover:bg-[#FAFBFA]"
                      onClick={() => openDetail(promo)}
                    >
                      <td className={tdClass}>
                        <p className="font-bold text-ink">{promo.title}</p>
                        <p className="mt-0.5 text-[11px] text-ink-muted">{promo.subtitle}</p>
                      </td>
                      <td className={tdClass}>
                        <span
                          className={`inline-flex items-center rounded-full  px-[10px] py-[4px] text-[11px] font-medium whitespace-nowrap ${
                            typeTone[promo.type] || typeTone['Item / category deal']
                          }`}
                        >
                          {promo.type}
                        </span>
                      </td>
                      <td className={`${tdClass} text-ink`}>{promo.scope}</td>
                      <td className={tdClass}>
                        <StatusPill status={promo.status} />
                      </td>
                      <td className={`${tdClass} text-ink`}>{promo.period}</td>
                      <td className={tdClass}>{promo.used}</td>
                      <td
                        className={`${tdClass} relative text-right`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="inline-block" ref={menuOpen ? menuRef : null}>
                          <button
                            type="button"
                            className="h-7 w-7 rounded-[8px] text-lg font-bold text-ink-muted hover:bg-[#f5f7f5]"
                            aria-haspopup="menu"
                            aria-expanded={menuOpen}
                            aria-label={`Actions for ${promo.title}`}
                            onClick={() => setMenuId(menuOpen ? null : promo.id)}
                          >
                            ⋮
                          </button>
                          {menuOpen ? (
                            <div
                              className="absolute top-[calc(100%-8px)] right-5 z-30 w-[178px] overflow-hidden rounded-[12px] border border-[#E0E6E0] bg-white shadow-[0_12px_28px_rgba(26,28,26,0.14)]"
                              role="menu"
                            >
                              <button
                                type="button"
                                role="menuitem"
                                className="flex w-full flex-col px-3.5 py-2.5 text-left hover:bg-[#f7f9f7]"
                                onClick={() => {
                                  setMenuId(null)
                                  navigate(`/promotions/${encodeURIComponent(promo.id)}/edit`)
                                }}
                              >
                                <span className="text-[13px] font-medium text-ink">Edit</span>
                                <span className="text-[11px] text-ink-muted">
                                  Change rules &amp; settings
                                </span>
                              </button>
                              <button
                                type="button"
                                role="menuitem"
                                className="flex w-full flex-col border-t border-[#EEF1EE] px-3.5 py-2.5 text-left hover:bg-[#f7f9f7]"
                                onClick={() => {
                                  setMenuId(null)
                                  openDetail(promo)
                                }}
                              >
                                <span className="text-[13px] font-medium text-ink">View</span>
                                <span className="text-[11px] text-ink-muted">
                                  Details &amp; performance
                                </span>
                              </button>
                            </div>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-[13px] text-ink-muted">
                    {query || filter !== 'All'
                      ? 'No promotions match your filters.'
                      : 'No promotions yet.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
