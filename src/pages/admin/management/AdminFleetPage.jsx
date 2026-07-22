import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Car, ChevronDown, MoreVertical, Plus, Search, Star } from 'lucide-react'
import motoBikeIcon from '../../../assets/moto_bike.png'
import eyeIcon from '../../../assets/👁.png'
import { useApiResource } from '../../../hooks/useApiResource'
import { adminService } from '../../../services/adminService'
import { ApiState } from '../../../components/admin/ApiState'
import { Badge } from '../../../components/admin/Badge'
import { cn } from '../../../components/admin/cn'

const statTone = {
  ink: 'text-[#17231c]',
  green: 'text-[#1aa054]',
  blue: 'text-[#2b66a5]',
  red: 'text-[#e14b42]',
}

function statusTone(status) {
  if (status === 'Online') return 'green'
  if (status === 'On delivery') return 'blue'
  if (status === 'Suspended') return 'red'
  return 'gray'
}

function tierTone(tier) {
  if (tier === 'Elite') return 'purple'
  if (tier === 'Gold') return 'yellow'
  if (tier === 'At Risk') return 'red'
  if (tier === 'Bronze') return 'bronze'
  return 'gray'
}

function VehicleIcon({ type }) {
  if (type === 'Bike') {
    return <img src={motoBikeIcon} alt="" className="h-4 w-4 object-contain" />
  }
  return <Car size={14} className="text-[#59655e]" strokeWidth={1.8} />
}

export default function AdminFleetPage() {
  const navigate = useNavigate()
  const [statusTab, setStatusTab] = useState('All')
  const [query, setQuery] = useState('')
  const [menuId, setMenuId] = useState(null)
  const menuRef = useRef(null)
  const { data, error, isLoading, refetch } = useApiResource(
    () => adminService.getManagement('fleet'),
    [],
  )

  const rows = useMemo(() => {
    if (!data?.rows) return []
    return data.rows.filter((row) => {
      const matchesTab = statusTab === 'All' || row.status === statusTab
      const haystack = `${row.name} ${row.id} ${row.supplier} ${row.contact} ${row.status} ${row.tier}`.toLowerCase()
      return matchesTab && haystack.includes(query.toLowerCase())
    })
  }, [data, statusTab, query])

  const openChamp = (champId) => {
    navigate(`/admin/fleet/${encodeURIComponent(champId)}`)
  }

  useEffect(() => {
    if (!menuId) return undefined

    const handlePointerDown = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuId(null)
      }
    }
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setMenuId(null)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [menuId])

  if (!data) return <ApiState isLoading={isLoading} error={error} onRetry={refetch} />

  return (
    <div className="px-5 py-4 pb-8 max-[700px]:px-3">
      <div className="mb-3.5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[20px] font-bold tracking-[-0.02em] text-[#17231c]">
          Fleet · Champs
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/admin/fleet/notify')}
            className="inline-flex h-[34px] items-center gap-1.5 rounded-full border border-[#e4e8e4] bg-white px-3.5 text-[12px] font-bold text-[#17231c] shadow-[0_1px_2px_rgba(20,40,28,.04)] hover:bg-[#fafbfa]"
          >
            <Bell size={14} strokeWidth={2} className="text-[#c4841a]" />
            Notify
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/fleet/new')}
            className="inline-flex h-[34px] items-center gap-1.5 rounded-full bg-[#1aa054] px-4 text-[12px] font-bold text-white shadow-[0_1px_2px_rgba(20,40,28,.15)] hover:bg-[#158a47]"
          >
            <Plus size={14} strokeWidth={2.2} />
            {data.action}
          </button>
        </div>
      </div>

      <div className="mb-4 inline-flex items-center gap-1">
        {data.viewTabs.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => {
              if (item === 'Suppliers') navigate('/admin/fleet/suppliers')
            }}
            className={cn(
              'h-[34px] rounded-full px-4 text-[12.5px] font-bold transition',
              item === 'Champs'
                ? 'bg-[#e8f7ed] text-[#1aa054]'
                : 'bg-white text-[#69756d] ring-1 ring-[#e4e8e4] hover:text-[#455249]',
            )}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="mb-4 grid grid-cols-5 gap-3 max-[1100px]:grid-cols-3 max-[700px]:grid-cols-2 max-[480px]:grid-cols-1">
            {data.stats.map(({ label, value, tone, star }) => (
              <div
                key={label}
                className="rounded-[14px] border border-[#eceeec] bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(20,40,28,.03)]"
              >
                <p className="text-[12px] text-[#7c8780]">{label}</p>
                <p
                  className={cn(
                    'mt-1.5 flex items-center gap-1 text-[22px] font-bold leading-none tracking-[-0.02em]',
                    statTone[tone] || statTone.ink,
                  )}
                >
                  {star ? <Star size={15} className="shrink-0 fill-[#1aa054] text-[#1aa054]" /> : null}
                  {value}
                </p>
              </div>
            ))}
          </div>

          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center rounded-[10px] bg-[#e9ebe9] p-[3px]">
              {data.statusTabs.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setStatusTab(item)}
                  className={cn(
                    'h-[28px] rounded-[8px] px-3.5 text-[12px]',
                    statusTab === item
                      ? 'bg-white font-bold text-[#17231c] shadow-[0_1px_3px_rgba(20,40,28,.12)]'
                      : 'font-medium text-[#69756d] hover:text-[#455249]',
                  )}
                >
                  {item}
                </button>
              ))}
            </div>


            <span className="flex-1" />
            {['Categories', 'Vehicle', 'Tier'].map((filter) => (
              <button
                key={filter}
                type="button"
                className="inline-flex h-[32px] items-center gap-1 rounded-full border border-[#e4e8e4] bg-white px-3 text-[12px] font-medium text-[#6B736E] shadow-[0_1px_2px_rgba(20,40,28,.04)] hover:bg-[#fafbfa]"
              >
                {filter} ▾
              </button>
            ))}

            <label className="flex h-[32px] w-[210px] items-center gap-2 rounded-sm border border-[#e4e8e4] bg-white px-3 shadow-[0_1px_2px_rgba(20,40,28,.04)] max-[700px]:w-full">
              <Search size={14} className="text-[#9aa49d]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="min-w-0 flex-1 border-0 bg-transparent text-[12px] text-[#17231c] outline-none placeholder:text-[#9aa49d]"
                placeholder="Search champ"
              />
            </label>
          </div>

          <section className="overflow-hidden rounded-[14px] border border-[#eceeec] bg-white shadow-[0_1px_2px_rgba(20,40,28,.03)]">
            <div className="w-full max-w-full overflow-x-auto overscroll-x-contain touch-pan-x [-webkit-overflow-scrolling:touch]">
              <table className="w-full min-w-[1180px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-[#edf0ee] bg-[#fafbfa]">
                    {data.columns.map((column) => (
                      <th
                        key={column || 'actions'}
                        className="whitespace-nowrap px-4 py-3 text-[10px] font-medium uppercase tracking-[0.05em] text-[#8a948e]"
                      >
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const menuOpen = menuId === row.id

                    return (
                      <tr
                        key={row.id}
                        className="border-b border-[#f0f2f0] last:border-0 even:bg-[#fafbfa] hover:bg-[#f6f8f6]"
                      >
                        <td className="whitespace-nowrap px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <span
                              className="grid h-8 w-8 shrink-0 place-items-center rounded-sm text-[11px] font-bold"
                              style={{ background: row.avatarBg, color: row.avatarText }}
                            >
                              {row.initials}
                            </span>
                            <span className="text-[13px] font-medium text-[#1C211F]">{row.name}</span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap font-medium px-4 py-3.5 text-[12.5px] text-[#1C211F]">{row.id}</td>
                        <td className="whitespace-nowrap font-medium px-4 py-3.5 text-[12.5px] text-[#1C211F]">{row.supplier}</td>
                        <td className="whitespace-nowrap font-medium px-4 py-3.5 text-[12.5px] text-[#1C211F]">{row.contact}</td>
                        <td className="whitespace-nowrap font-medium  px-4 py-3.5 text-[12.5px] text-[#1C211F]">{row.cpr}</td>
                        <td className="whitespace-nowrap font-medium  px-4 py-3.5">
                          <span className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-[#455249]">
                            <VehicleIcon type={row.vehicle} />
                            {row.vehicle}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5">
                          <div className="flex items-center gap-1">
                            {row.categories.map((category) => (
                              <span
                                key={category}
                                className="inline-flex rounded-full bg-[#eff2f0] px-2 py-0.5 text-[10px] font-medium text-[#637068]"
                              >
                                {category}
                              </span>
                            ))}
                            {row.extraCategories > 0 ? (
                              <span className="inline-flex rounded-full bg-[#e8f7ed] px-2 py-0.5 text-[10px] font-medium text-[#1aa054]">
                                +{row.extraCategories}
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-[12.5px] font-medium text-[#17231c]">{row.cashLimit}</td>
                        <td className="whitespace-nowrap px-4 py-3.5">
                          <Badge tone={statusTone(row.status)}>{row.status}</Badge>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5">
                          <Badge tone={tierTone(row.tier)}>{row.tier}</Badge>
                        </td>
                        <td className="relative whitespace-nowrap px-4 py-3.5 text-right">
                          <div className="inline-block" ref={menuOpen ? menuRef : null}>
                            <button
                              type="button"
                              className="grid h-8 w-8 place-items-center rounded-md text-[#8a948e] hover:bg-[#f3f5f3] hover:text-[#455249]"
                              aria-haspopup="menu"
                              aria-expanded={menuOpen}
                              aria-label={`More actions for ${row.name}`}
                              onClick={(event) => {
                                event.stopPropagation()
                                setMenuId(menuOpen ? null : row.id)
                              }}
                            >
                              <MoreVertical size={15} />
                            </button>
                            {menuOpen ? (
                              <div
                                role="menu"
                                className="absolute top-[calc(100%-6px)] right-4 z-30 w-[160px] overflow-hidden rounded-[10px] border border-[#e4e8e4] bg-white py-1 shadow-[0_10px_24px_rgba(20,40,28,.14)]"
                              >
                                <button
                                  type="button"
                                  role="menuitem"
                                  className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-[13px] font-medium text-[#17231c] hover:bg-[#f6f8f6]"
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    setMenuId(null)
                                    openChamp(row.id)
                                  }}
                                >
                                  <img src={eyeIcon} alt="" className="h-3.5 w-3.5 object-contain opacity-70" />
                                  View champ
                                </button>
                                <div className="my-1 border-t border-[#edf0ee]" />
                                <button
                                  type="button"
                                  role="menuitem"
                                  className="flex w-full px-3.5 py-2.5 text-left text-[13px] font-medium text-[#c4841a] hover:bg-[#fff8eb]"
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    setMenuId(null)
                                  }}
                                >
                                  Suspend
                                </button>
                                <button
                                  type="button"
                                  role="menuitem"
                                  className="flex w-full px-3.5 py-2.5 text-left text-[13px] font-medium text-[#d64044] hover:bg-[#fdebec]"
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    setMenuId(null)
                                  }}
                                >
                                  Terminate
                                </button>
                              </div>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>
    </div>
  )
}
