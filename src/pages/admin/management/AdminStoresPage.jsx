import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MoreVertical, Plus } from 'lucide-react'
import { useApiResource } from '../../../hooks/useApiResource'
import { adminService } from '../../../services/adminService'
import { ApiState } from '../../../components/admin/ApiState'
import { Badge } from '../../../components/admin/Badge'
import { CatalogStoreIcon } from '../../../components/CatalogStoreIcons'
import { cn } from '../../../components/admin/cn'

const statTone = {
  ink: 'text-[#17231c]',
  green: 'text-[#1aa054]',
  orange: 'text-[#c4841a]',
  red: 'text-[#e14b42]',
}

export default function AdminStoresPage() {
  const navigate = useNavigate()
  const [menuId, setMenuId] = useState(null)
  const [visibilityBusyId, setVisibilityBusyId] = useState(null)
  const [actionError, setActionError] = useState(null)
  const menuRef = useRef(null)
  const { data, error, isLoading, refetch } = useApiResource(
    () => adminService.getManagement('stores'),
    [],
  )

  const rows = useMemo(() => data?.rows || [], [data])

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

  const handleToggleVisibility = async (row) => {
    if (!row?.id || visibilityBusyId) return
    setMenuId(null)
    setActionError(null)
    setVisibilityBusyId(row.id)
    try {
      if (row.visible) {
        await adminService.draftAdminStoreType(row.id)
      } else {
        await adminService.publishAdminStoreType(row.id)
      }
      await refetch()
    } catch (err) {
      setActionError(err?.message || (row.visible ? 'Failed to hide store type.' : 'Failed to show store type.'))
    } finally {
      setVisibilityBusyId(null)
    }
  }

  if (!data) return <ApiState isLoading={isLoading} error={error} onRetry={refetch} />

  return (
    <div className="px-5 py-4 pb-8 max-[700px]:px-3">
      <div className="mb-3.5 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[20px] font-bold tracking-[-0.02em] text-[#17231c]">{data.title}</h2>
          <p className="mt-1 max-w-[560px] text-[12.5px] leading-[18px] text-[#7c8780]">
            {data.subtitle}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/admin/stores/new')}
          className="inline-flex h-[34px] shrink-0 items-center gap-1.5 rounded-full bg-[#1aa054] px-4 text-[12px] font-bold text-white shadow-[0_1px_2px_rgba(20,40,28,.15)] hover:bg-[#158a47]"
        >
          <Plus size={14} strokeWidth={2.2} />
          {data.action}
        </button>
      </div>

      {actionError ? (
        <p className="mb-3 rounded-[10px] border border-[#f5d0d0] bg-[#fdebec] px-3 py-2 text-[12.5px] text-[#d64044]">
          {actionError}
        </p>
      ) : null}

      <div className="mb-4 grid grid-cols-4 gap-3 max-[900px]:grid-cols-2 max-[520px]:grid-cols-1">
        {data.stats.map(({ label, value, tone }) => (
          <div
            key={label}
            className="rounded-[14px] border border-[#eceeec] bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(20,40,28,.03)]"
          >
            <p className="text-[12px] text-[#7c8780]">{label}</p>
            <p className={cn('mt-1.5 text-[26px] font-bold leading-none', statTone[tone] || statTone.ink)}>
              {value}
            </p>
          </div>
        ))}
      </div>

      <section className="overflow-hidden rounded-[14px] border border-[#eceeec] bg-white shadow-[0_1px_2px_rgba(20,40,28,.03)]">
        <div className="w-full max-w-full overflow-x-auto overscroll-x-contain touch-pan-x [-webkit-overflow-scrolling:touch]">
          <table className="w-full min-w-[860px] border-collapse text-left">
            <thead>
              <tr className="border-b border-[#edf0ee] bg-[#fafbfa]">
                {['Store type', 'Order modes', 'Categories', 'Vendors', 'Visible', ''].map((column) => (
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
                      <div className="flex items-center gap-3">
                        <span
                          className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px]"
                          style={{ background: row.iconBg || '#eef2ef' }}
                          aria-hidden
                        >
                          <CatalogStoreIcon
                            id={row.slug || row.id}
                            emoji={row.iconEmoji || row.icon}
                            iconUrl={row.iconUrl}
                            className="size-5"
                          />
                        </span>
                        <div className="min-w-0">
                          <p className="text-[13px] font-bold text-[#17231c]">{row.name}</p>
                          <p className="mt-0.5 text-[11.5px] text-[#7c8780]">{row.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-[12.5px] text-[#455249]">
                      {row.orderModes}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-[12.5px] text-[#455249]">
                      {row.categories}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-[12.5px] text-[#455249]">
                      {row.vendors}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5">
                      <Badge tone={row.visible ? 'green' : 'yellow'}>
                        {row.visible ? 'Visible' : 'Hidden'}
                      </Badge>
                    </td>
                    <td className="relative whitespace-nowrap px-4 py-3.5 text-right">
                      <div className="inline-block" ref={menuOpen ? menuRef : null}>
                        <button
                          type="button"
                          className="grid h-8 w-8 place-items-center rounded-md text-[#8a948e] hover:bg-[#f3f5f3] hover:text-[#455249]"
                          aria-haspopup="menu"
                          aria-expanded={menuOpen}
                          aria-label={`More actions for ${row.name}`}
                          onClick={() => setMenuId(menuOpen ? null : row.id)}
                        >
                          <MoreVertical size={15} />
                        </button>
                        {menuOpen ? (
                          <div
                            role="menu"
                            className="absolute top-[calc(100%-6px)] right-4 z-30 w-[140px] overflow-hidden rounded-[10px] border border-[#e4e8e4] bg-white py-1 shadow-[0_10px_24px_rgba(20,40,28,.14)]"
                          >
                            <button
                              type="button"
                              role="menuitem"
                              className="flex w-full px-3.5 py-2.5 text-left text-[13px] font-medium text-[#17231c] hover:bg-[#f6f8f6]"
                              onClick={() => {
                                setMenuId(null)
                                navigate(`/admin/stores/${encodeURIComponent(row.id)}`)
                              }}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              role="menuitem"
                              disabled={visibilityBusyId === row.id}
                              className="flex w-full px-3.5 py-2.5 text-left text-[13px] font-medium text-[#17231c] hover:bg-[#f6f8f6] disabled:opacity-60"
                              onClick={() => handleToggleVisibility(row)}
                            >
                              {visibilityBusyId === row.id
                                ? 'Updating…'
                                : row.visible
                                  ? 'Hide'
                                  : 'Show'}
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
