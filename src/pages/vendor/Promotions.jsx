import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Search } from 'lucide-react'
import { StatusPill } from '../../components/ui'
import { useVendorPromotions } from '../../hooks/vendor/useVendorPromotions'

const SEARCH_DEBOUNCE_MS = 300

const thClass =
  'border-b border-[#E0E6E0] px-5 py-3.5 text-left text-[11px] font-bold tracking-[0.04em] text-ink-muted uppercase'
const tdClass = 'px-5 py-[15px] text-[13px] text-ink'

const typeTone = {
  'Item / category deal': 'bg-green-active-bg text-green-active-text border-green-active-text',
  'Free delivery': 'bg-green-active-bg text-green-active-text ',
  'Buy X Get Y': 'bg-[#E8F5EC] text-[#127036] border-[#127036]',
  '% off': 'bg-green-active-bg text-green-active-text border-green-active-text',
}

const TYPE_OPTIONS = [
  { label: 'All types', value: '' },
  { label: 'Item / category deal', value: 'ITEM_CATEGORY_DEAL' },
  { label: 'Free delivery', value: 'FREE_DELIVERY' },
  { label: 'Buy X Get Y', value: 'BUY_X_GET_Y' },
]

function statusToApi(filter) {
  const raw = String(filter || 'All').trim().toLowerCase()
  if (!raw || raw === 'all') return 'all'
  if (raw === 'active') return 'active'
  if (raw === 'scheduled') return 'scheduled'
  if (raw === 'paused') return 'paused'
  if (raw === 'ended') return 'ended'
  return 'all'
}

export default function Promotions() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState('All')
  const [typeFilter, setTypeFilter] = useState('')
  const [typeOpen, setTypeOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [menuId, setMenuId] = useState(null)
  const menuRef = useRef(null)
  const typeRef = useRef(null)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(query.trim())
    }, SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [query])

  const { data, error, isLoading, refetch } = useVendorPromotions({
    status: statusToApi(filter),
    type: typeFilter,
    search: debouncedSearch,
  })
  const promotionFilters = data?.filters || ['All', 'Active', 'Scheduled', 'Paused', 'Ended']
  const promotionKpis = data?.kpis || []
  const promotions = data?.promotions || []

  const selectedType = useMemo(
    () => TYPE_OPTIONS.find((opt) => opt.value === typeFilter) || TYPE_OPTIONS[0],
    [typeFilter],
  )

  // Soft client filter while debounced search / API catch up
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const selectedTypeLabel = selectedType.label
    return promotions.filter((p) => {
      if (filter !== 'All' && p.status !== filter) return false
      if (typeFilter && p.type !== selectedTypeLabel && p.typeRaw !== typeFilter) return false
      if (!needle) return true
      return [p.title, p.subtitle, p.type, p.scope, p.status, p.period]
        .join(' ')
        .toLowerCase()
        .includes(needle)
    })
  }, [promotions, filter, query, typeFilter, selectedType.label])

  useEffect(() => {
    if (!menuId && !typeOpen) return undefined
    function onDocClick(e) {
      if (menuId && menuRef.current && !menuRef.current.contains(e.target)) setMenuId(null)
      if (typeOpen && typeRef.current && !typeRef.current.contains(e.target)) setTypeOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [menuId, typeOpen])

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
          <div className="relative" ref={typeRef}>
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-full border border-[#E0E6E0] bg-white px-4 py-[10px] text-[12.5px] whitespace-nowrap hover:bg-[#f7f9f7]"
              aria-haspopup="listbox"
              aria-expanded={typeOpen}
              onClick={() => {
                setTypeOpen((open) => !open)
                setMenuId(null)
              }}
            >
              <span className={`font-medium ${typeFilter ? 'text-ink' : 'text-ink'}`}>
                {selectedType.label}
              </span>
              <span className="text-[10px] text-ink-muted">▾</span>
            </button>
            {typeOpen ? (
              <div
                className="absolute top-[calc(100%+6px)] right-0 z-30 min-w-[200px] overflow-hidden rounded-[12px] border border-[#E0E6E0] bg-white shadow-[0_12px_28px_rgba(26,28,26,0.14)]"
                role="listbox"
                aria-label="Promotion type"
              >
                {TYPE_OPTIONS.map((option, idx) => {
                  const selected = option.value === typeFilter
                  return (
                    <button
                      key={option.value || 'all'}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      className={`flex w-full items-center justify-between px-3.5 py-2.5 text-left text-[13px] ${
                        idx > 0 ? 'border-t border-[#EEF1EE]' : ''
                      } ${selected ? 'font-medium text-green-light-text' : 'font-medium text-ink hover:bg-[#f7f9f7]'}`}
                      onClick={() => {
                        setTypeFilter(option.value)
                        setTypeOpen(false)
                      }}
                    >
                      <span>{option.label}</span>
                      {selected ? (
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
          <div className="flex min-w-[200px] items-center gap-2 rounded-[10px] border border-[#E0E6E0] bg-white px-3 py-[9px] text-[12.5px]">
            <Search size={15} strokeWidth={2.2} className="shrink-0 text-ink-faint" />
            <input
              type="search"
              className="w-full border-none bg-transparent text-[12.5px] text-ink outline-none placeholder:text-ink-faint"
              placeholder="Search promotions"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search promotions"
            />
          </div>
        </div>
      </div>

      {error ? (
        <p className="mb-3 text-[12px] text-danger">
          Could not refresh promotions.{' '}
          <button type="button" onClick={refetch} className="underline">
            Retry
          </button>
        </p>
      ) : null}

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
                    {query || filter !== 'All' || typeFilter
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
