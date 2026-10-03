import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { MoreVertical, Plus } from 'lucide-react'
import { useApiResource } from '../../../hooks/useApiResource'
import { useAuth } from '../../../context/AuthContext'
import { isSuperAdminUser } from '../../../mappers/admin/authMapper'
import { adminService } from '../../../services/adminService'
import { ApiErrorBanner, StatCardsSkeleton, TableBodySkeleton } from '../../../components/admin/ApiState'
import { Badge } from '../../../components/admin/Badge'
import { CatalogStoreIcon } from '../../../components/CatalogStoreIcons'
import AdminSuperDeleteModal from '../../../components/admin/AdminSuperDeleteModal'
import { cn } from '../../../components/admin/cn'

const statTone = {
  ink: 'text-[#17231c]',
  green: 'text-[#1aa054]',
  orange: 'text-[#c4841a]',
  red: 'text-[#e14b42]',
}

function StoreTypeRowMenu({
  open,
  row,
  visibilityBusy,
  canDelete,
  onToggle,
  onClose,
  onEdit,
  onToggleVisibility,
  onDelete,
}) {
  const triggerRef = useRef(null)
  const menuRef = useRef(null)
  const [coords, setCoords] = useState(null)

  useLayoutEffect(() => {
    if (!open) return undefined

    const place = () => {
      const trigger = triggerRef.current
      if (!trigger) return
      const rect = trigger.getBoundingClientRect()
      const width = menuRef.current?.offsetWidth || 140
      const height = menuRef.current?.offsetHeight || 132
      const gap = 4
      const left = Math.min(Math.max(8, rect.right - width), window.innerWidth - width - 8)
      const openUp =
        rect.bottom + gap + height > window.innerHeight - 8 && rect.top - gap - height > 8
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
      if (triggerRef.current?.contains(event.target) || menuRef.current?.contains(event.target)) {
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
              className="fixed z-[200] w-[140px] overflow-hidden rounded-[10px] border border-[#e4e8e4] bg-white py-1 shadow-[0_10px_24px_rgba(20,40,28,.14)]"
              style={
                coords ? { top: coords.top, left: coords.left } : { top: 0, left: 0, visibility: 'hidden' }
              }
            >
              <button
                type="button"
                role="menuitem"
                className="flex w-full px-3.5 py-2.5 text-left text-[13px] font-medium text-[#17231c] hover:bg-[#f6f8f6]"
                onClick={(event) => {
                  event.stopPropagation()
                  onEdit()
                }}
              >
                Edit
              </button>
              <button
                type="button"
                role="menuitem"
                disabled={visibilityBusy}
                className="flex w-full px-3.5 py-2.5 text-left text-[13px] font-medium text-[#17231c] hover:bg-[#f6f8f6] disabled:opacity-60"
                onClick={(event) => {
                  event.stopPropagation()
                  onToggleVisibility()
                }}
              >
                {visibilityBusy ? 'Updating…' : row.visible ? 'Hide' : 'Show'}
              </button>
              {canDelete ? (
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full px-3.5 py-2.5 text-left text-[13px] font-medium text-[#d64044] hover:bg-[#fdebec]"
                  onClick={(event) => {
                    event.stopPropagation()
                    onDelete()
                  }}
                >
                  Delete
                </button>
              ) : null}
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}

export default function AdminStoresPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const canDelete = isSuperAdminUser(user)
  const [menuId, setMenuId] = useState(null)
  const [visibilityBusyId, setVisibilityBusyId] = useState(null)
  const [actionError, setActionError] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const { data, error, isLoading, refetch } = useApiResource(
    () => adminService.getManagement('stores'),
    [],
  )

  const rows = useMemo(() => data?.rows || [], [data])

  const title = data?.title || 'Store types'
  const subtitle = data?.subtitle || 'Catalog store types shown in the customer app.'
  const action = data?.action || 'Add store type'
  const stats = data?.stats?.length ? data.stats : null
  const showTableSkeleton = isLoading && rows.length === 0 && !error

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

  return (
    <div className="px-5 py-4 pb-8 max-[700px]:px-3">
      <div className="mb-3.5 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[20px] font-bold tracking-[-0.02em] text-[#17231c]">{title}</h2>
          <p className="mt-1 max-w-[560px] text-[12.5px] leading-[18px] text-[#7c8780]">
            {subtitle}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/admin/stores/products')}
            className="inline-flex h-[34px] shrink-0 items-center gap-1.5 rounded-full border border-[#dfe4e0] bg-white px-4 text-[12px] font-medium text-[#127338] hover:bg-[#f6f8f6]"
          >
            Products
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/stores/new')}
            className="inline-flex h-[34px] shrink-0 items-center gap-1.5 rounded-full bg-[#1aa054] px-4 text-[12px] font-bold text-white shadow-[0_1px_2px_rgba(20,40,28,.15)] hover:bg-[#158a47]"
          >
            <Plus size={14} strokeWidth={2.2} />
            {action}
          </button>
        </div>
      </div>

      {actionError ? (
        <p className="mb-3 rounded-[10px] border border-[#f5d0d0] bg-[#fdebec] px-3 py-2 text-[12.5px] text-[#d64044]">
          {actionError}
        </p>
      ) : null}

      <ApiErrorBanner error={error} onRetry={refetch} />

      {stats ? (
      <div className="mb-4 grid grid-cols-4 gap-3 max-[900px]:grid-cols-2 max-[520px]:grid-cols-1">
        {stats.map(({ label, value, tone }) => (
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
      ) : (
        <StatCardsSkeleton
          count={4}
          className="mb-4 grid grid-cols-4 gap-3 max-[900px]:grid-cols-2 max-[520px]:grid-cols-1"
        />
      )}

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
              {showTableSkeleton ? (
                <TableBodySkeleton columns={6} rows={5} />
              ) : (
              rows.map((row) => {
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
                            iconUrl={row.iconUrl}
                            className="size-5"
                            placeholderSize={14}
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
                      <StoreTypeRowMenu
                        open={menuOpen}
                        row={row}
                        visibilityBusy={visibilityBusyId === row.id}
                        canDelete={canDelete}
                        onToggle={() => setMenuId(menuOpen ? null : row.id)}
                        onClose={() => setMenuId(null)}
                        onEdit={() => {
                          setMenuId(null)
                          navigate(`/admin/stores/${encodeURIComponent(row.id)}`)
                        }}
                        onToggleVisibility={() => handleToggleVisibility(row)}
                        onDelete={() => {
                          setMenuId(null)
                          setDeleteTarget(row)
                        }}
                      />
                    </td>
                  </tr>
                )
              })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <AdminSuperDeleteModal
        open={Boolean(deleteTarget)}
        title={`Delete ${deleteTarget?.name || 'store type'}?`}
        message="If nothing is linked to it, the store type is removed. If vendors or products still use it, it is only hidden."
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          const row = deleteTarget
          const result = await adminService.deleteAdminStoreType(row.id)
          setDeleteTarget(null)
          if (result?.data?.hardDelete === false) {
            setActionError(`${row.name} was hidden because vendors or products still use it.`)
          } else {
            setActionError(null)
          }
          await refetch()
        }}
      />
    </div>
  )
}
