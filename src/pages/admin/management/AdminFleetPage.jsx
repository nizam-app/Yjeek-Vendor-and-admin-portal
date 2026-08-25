import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { Bell, Car, MoreVertical, Plus, Search, Star } from 'lucide-react'
import motoBikeIcon from '../../../assets/moto_bike.png'
import eyeIcon from '../../../assets/👁.png'
import { useApiResource } from '../../../hooks/useApiResource'
import { apiConfig, isAdminRealApiFeature } from '../../../api/config'
import { formatApiErrorMessage } from '../../../api/errors'
import { adminService } from '../../../services/adminService'
import { ApiErrorBanner, StatCardsSkeleton, TableBodySkeleton } from '../../../components/admin/ApiState'
import { Badge } from '../../../components/admin/Badge'
import { AdminFilterSelect } from '../../../components/admin/AdminFilterSelect'
import AdminSuspendChampModal from '../../../components/admin/AdminSuspendChampModal'
import AdminTerminateChampModal from '../../../components/admin/AdminTerminateChampModal'
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

function mapVehicleMatch(rowVehicle, filter) {
  if (!filter) return true
  if (/^BIKE$/i.test(filter)) return String(rowVehicle).toLowerCase() === 'bike'
  if (/^CAR$/i.test(filter)) return String(rowVehicle).toLowerCase() === 'car'
  return String(rowVehicle).toUpperCase() === String(filter).toUpperCase()
}

function mapTierMatch(rowTier, filter) {
  if (!filter) return true
  if (/^AT_RISK$/i.test(filter)) return String(rowTier).toLowerCase() === 'at risk'
  return String(rowTier).toUpperCase() === String(filter).toUpperCase()
}

const FLEET_COLUMNS = [
  'Champ',
  'Vehicle',
  'Supplier',
  'Contact',
  'Status',
  'Tier',
  'Jobs',
  'Rating',
  '',
]

function VehicleIcon({ type }) {
  if (type === 'Bike') {
    return <img src={motoBikeIcon} alt="" className="h-4 w-4 object-contain" />
  }
  return <Car fill="#C91A24" className="h-4 w-4" />
}

function ChampRowMenu({
  open,
  row,
  actionBusy,
  onToggle,
  onClose,
  onView,
  onSuspend,
  onUnsuspend,
  onTerminate,
}) {
  const triggerRef = useRef(null)
  const menuRef = useRef(null)
  const [coords, setCoords] = useState(null)
  const status = String(row.status).toLowerCase()
  const isTerminated = status === 'terminated'
  const isSuspended = status === 'suspended'

  useLayoutEffect(() => {
    if (!open) return undefined

    const place = () => {
      const trigger = triggerRef.current
      if (!trigger) return
      const rect = trigger.getBoundingClientRect()
      const width = menuRef.current?.offsetWidth || 160
      const height = menuRef.current?.offsetHeight || 140
      const gap = 4
      const left = Math.min(
        Math.max(8, rect.right - width),
        window.innerWidth - width - 8,
      )
      const openUp =
        rect.bottom + gap + height > window.innerHeight - 8 &&
        rect.top - gap - height > 8
      const top = openUp ? rect.top - height - gap : rect.bottom + gap
      setCoords({ top, left })
    }

    place()
    const raf = requestAnimationFrame(place)
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [open])

  useEffect(() => {
    if (!open) return undefined

    const handlePointerDown = (event) => {
      if (
        triggerRef.current?.contains(event.target) ||
        menuRef.current?.contains(event.target)
      ) {
        return
      }
      onClose()
    }
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onClose])

  return (
    <div className="inline-block" ref={triggerRef}>
      <button
        type="button"
        className="grid h-8 w-8 place-items-center rounded-md text-[#8a948e] hover:bg-[#f3f5f3] hover:text-[#455249]"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`More actions for ${row.name}`}
        onClick={(event) => {
          event.stopPropagation()
          onToggle()
        }}
      >
        <MoreVertical size={15} />
      </button>
      {open && typeof document !== 'undefined'
        ? createPortal(
            <div
              ref={menuRef}
              role="menu"
              className="fixed z-[200] w-[160px] overflow-hidden rounded-[10px] border border-[#e4e8e4] bg-white py-1 shadow-[0_10px_24px_rgba(20,40,28,.14)]"
              style={
                coords
                  ? { top: coords.top, left: coords.left }
                  : { top: 0, left: 0, visibility: 'hidden' }
              }
            >
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-[13px] font-medium text-[#17231c] hover:bg-[#f6f8f6]"
                onClick={(event) => {
                  event.stopPropagation()
                  onClose()
                  onView()
                }}
              >
                <img src={eyeIcon} alt="" className="h-3.5 w-3.5 object-contain opacity-70" />
                View champ
              </button>
              <div className="my-1 border-t border-[#edf0ee]" />
              {isSuspended ? (
                <button
                  type="button"
                  role="menuitem"
                  disabled={actionBusy === `unsuspend:${row.id}`}
                  className="flex w-full px-3.5 py-2.5 text-left text-[13px] font-medium text-[#1aa054] hover:bg-[#f3faf5] disabled:opacity-60"
                  onClick={(event) => {
                    event.stopPropagation()
                    onClose()
                    onUnsuspend()
                  }}
                >
                  {actionBusy === `unsuspend:${row.id}` ? 'Unsuspending…' : 'Unsuspend'}
                </button>
              ) : !isTerminated ? (
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full px-3.5 py-2.5 text-left text-[13px] font-medium text-[#c4841a] hover:bg-[#fff8eb]"
                  onClick={(event) => {
                    event.stopPropagation()
                    onClose()
                    onSuspend()
                  }}
                >
                  Suspend
                </button>
              ) : null}
              {!isTerminated ? (
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full px-3.5 py-2.5 text-left text-[13px] font-medium text-[#d64044] hover:bg-[#fdebec]"
                  onClick={(event) => {
                    event.stopPropagation()
                    onClose()
                    onTerminate()
                  }}
                >
                  Terminate
                </button>
              ) : null}
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}

export default function AdminFleetPage() {
  const navigate = useNavigate()
  // Prefer real fleet APIs when feature flagged OR when admin mocks are fully off
  // (avoids dead GET /admin/management?type=fleet which does not exist on backend).
  const useRealFleet = isAdminRealApiFeature('fleet') || !apiConfig.adminUseMockApi
  const [statusTab, setStatusTab] = useState('All')
  const [query, setQuery] = useState('')
  const [vehicleFilter, setVehicleFilter] = useState('')
  const [tierFilter, setTierFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [menuId, setMenuId] = useState(null)
  const [actionChamp, setActionChamp] = useState(null)
  const [suspendOpen, setSuspendOpen] = useState(false)
  const [terminateOpen, setTerminateOpen] = useState(false)
  const [actionBusy, setActionBusy] = useState('')
  const [actionError, setActionError] = useState('')
  const [actionSuccess, setActionSuccess] = useState('')

  const { data, error, isLoading, refetch } = useApiResource(
    () => {
      if (useRealFleet) {
        return adminService.listAdminFleetChamps({
          search: query,
          statusTab,
          vehicle: vehicleFilter,
          tier: tierFilter,
          category: categoryFilter,
          limit: 20,
          includeSummary: true,
        })
      }
      return adminService.getManagement('fleet')
    },
    [useRealFleet, query, statusTab, vehicleFilter, tierFilter, categoryFilter],
  )

  const stats = data?.stats || []
  const filterOptions = data?.filterOptions || {
    vehicles: [
      { value: '', label: 'Vehicle' },
      { value: 'BIKE', label: 'Bike' },
      { value: 'CAR', label: 'Car' },
    ],
    tiers: [
      { value: '', label: 'Tier' },
      { value: 'ELITE', label: 'Elite' },
      { value: 'GOLD', label: 'Gold' },
      { value: 'SILVER', label: 'Silver' },
      { value: 'BRONZE', label: 'Bronze' },
      { value: 'AT_RISK', label: 'At Risk' },
    ],
    categories: [{ value: '', label: 'Categories' }],
  }

  const rows = useMemo(() => {
    if (!data?.rows) return []
    if (useRealFleet) return data.rows

    return data.rows.filter((row) => {
      const matchesTab = statusTab === 'All' || row.status === statusTab
      const matchesVehicle = !vehicleFilter || mapVehicleMatch(row.vehicle, vehicleFilter)
      const matchesTier = !tierFilter || mapTierMatch(row.tier, tierFilter)
      const matchesCategory =
        !categoryFilter
        || (row.categories || []).some((c) => String(c).toLowerCase() === categoryFilter.toLowerCase())
      const haystack = `${row.name} ${row.id} ${row.supplier} ${row.contact} ${row.status} ${row.tier}`.toLowerCase()
      return (
        matchesTab
        && matchesVehicle
        && matchesTier
        && matchesCategory
        && haystack.includes(query.toLowerCase())
      )
    })
  }, [data, useRealFleet, statusTab, query, vehicleFilter, tierFilter, categoryFilter])

  const openChamp = (champId) => {
    navigate(`/admin/fleet/${encodeURIComponent(champId)}`)
  }

  const openSuspend = (row) => {
    setActionError('')
    setActionSuccess('')
    setActionChamp(row)
    setSuspendOpen(true)
  }

  const openTerminate = (row) => {
    setActionError('')
    setActionSuccess('')
    setActionChamp(row)
    setTerminateOpen(true)
  }

  const handleSuspendSuccess = async () => {
    setActionSuccess(`${actionChamp?.name || 'Champ'} suspended.`)
    setActionChamp(null)
    await refetch()
  }

  const handleTerminateSuccess = async () => {
    setActionSuccess(`${actionChamp?.name || 'Champ'} terminated.`)
    setActionChamp(null)
    await refetch()
  }

  const handleUnsuspend = async (row) => {
    const id = String(row?.id || '').trim()
    if (!id || actionBusy) return
    setActionBusy(`unsuspend:${id}`)
    setActionError('')
    setActionSuccess('')
    try {
      await adminService.unsuspendAdminFleetChamp(id)
      setActionSuccess(`${row.name || 'Champ'} unsuspended.`)
      await refetch()
    } catch (err) {
      setActionError(formatApiErrorMessage(err, 'Failed to unsuspend champ.'))
    } finally {
      setActionBusy('')
    }
  }

  const columns = data?.columns?.length ? data.columns : FLEET_COLUMNS
  const showTableSkeleton = isLoading && rows.length === 0 && !error

  return (
    <div className="px-5 py-4 pb-8 max-[700px]:px-3">
      <AdminSuspendChampModal
        open={suspendOpen}
        onClose={() => {
          setSuspendOpen(false)
          setActionChamp(null)
        }}
        champId={actionChamp?.id}
        onSuccess={handleSuspendSuccess}
      />
      <AdminTerminateChampModal
        open={terminateOpen}
        onClose={() => {
          setTerminateOpen(false)
          setActionChamp(null)
        }}
        champName={actionChamp?.name || 'Champ'}
        champId={actionChamp?.id || ''}
        defaultCod="BHD 0.000"
        onSuccess={handleTerminateSuccess}
      />

      {actionError ? (
        <div className="mb-4 rounded-[12px] border border-[#f0c9c6] bg-[#fff5f4] px-4 py-3 text-[13px] text-[#b42318]">
          {actionError}
        </div>
      ) : null}
      {actionSuccess ? (
        <div className="mb-4 rounded-[12px] border border-[#b7e4c7] bg-[#f0faf4] px-4 py-3 text-[13px] text-[#147940]">
          {actionSuccess}
        </div>
      ) : null}

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
            {data?.action || 'Add champ'}
          </button>
        </div>
      </div>

      <div className="mb-4 inline-flex items-center gap-1">
        {(data?.viewTabs || ['Champs', 'Suppliers']).map((item) => (
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

      <ApiErrorBanner error={error} onRetry={refetch} />

      {stats.length ? (
      <div className="mb-4 grid grid-cols-5 gap-3 max-[1100px]:grid-cols-3 max-[700px]:grid-cols-2 max-[480px]:grid-cols-1">
        {stats.map(({ label, value, tone, star }) => (
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
      ) : (
        <StatCardsSkeleton
          count={5}
          className="mb-4 grid grid-cols-5 gap-3 max-[1100px]:grid-cols-3 max-[700px]:grid-cols-2 max-[480px]:grid-cols-1"
        />
      )}

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center rounded-[10px] bg-[#e9ebe9] p-[3px]">
          {(data?.statusTabs || ['All', 'Online', 'On delivery', 'Offline', 'Suspended']).map((item) => (
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
        <AdminFilterSelect
          label="Categories"
          placeholder="Categories"
          options={filterOptions.categories}
          value={categoryFilter}
          onChange={setCategoryFilter}
          className="h-[32px] text-[#6B736E]"
        />
        <AdminFilterSelect
          label="Vehicle"
          placeholder="Vehicle"
          options={filterOptions.vehicles}
          value={vehicleFilter}
          onChange={setVehicleFilter}
          className="h-[32px] text-[#6B736E]"
        />
        <AdminFilterSelect
          label="Tier"
          placeholder="Tier"
          options={filterOptions.tiers}
          value={tierFilter}
          onChange={setTierFilter}
          className="h-[32px] text-[#6B736E]"
        />

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
                    {columns.map((column) => (
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
                  {showTableSkeleton ? (
                    <TableBodySkeleton columns={columns.length} rows={6} />
                  ) : rows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={columns.length || 11}
                        className="px-4 py-8 text-center text-[13px] text-[#7c8780]"
                      >
                        No champs found.
                      </td>
                    </tr>
                  ) : null}
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
                        <td className="whitespace-nowrap font-medium px-4 py-3.5 text-[12.5px] text-[#1C211F]">
                          {row.displayId || row.id}
                        </td>
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
                        <td className="whitespace-nowrap px-4 py-3.5 text-right">
                          <ChampRowMenu
                            open={menuOpen}
                            row={row}
                            actionBusy={actionBusy}
                            onToggle={() => setMenuId(menuOpen ? null : row.id)}
                            onClose={() => setMenuId(null)}
                            onView={() => openChamp(row.id)}
                            onSuspend={() => openSuspend(row)}
                            onUnsuspend={() => handleUnsuspend(row)}
                            onTerminate={() => openTerminate(row)}
                          />
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
