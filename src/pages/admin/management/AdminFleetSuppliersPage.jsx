import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, MoreVertical, Plus } from 'lucide-react'
import { useApiResource } from '../../../hooks/useApiResource'
import { apiConfig, isAdminRealApiFeature } from '../../../api/config'
import { adminService } from '../../../services/adminService'
import { ApiState } from '../../../components/admin/ApiState'
import { Badge } from '../../../components/admin/Badge'

const MOCK_SUPPLIERS = [
  {
    id: 'sup-yjeek',
    name: 'Yjeek Fleet',
    type: 'In-house',
    champs: 180,
    commission: '—',
    status: 'Active',
  },
  {
    id: 'sup-speedx',
    name: 'SpeedX Logistics',
    type: '3PL',
    champs: 90,
    commission: '12%',
    status: 'Active',
  },
  {
    id: 'sup-rapidgo',
    name: 'RapidGo',
    type: '3PL',
    champs: 42,
    commission: '14%',
    status: 'Active',
  },
]

function typeTone(type) {
  if (type === 'In-house') return 'green'
  if (type === '3PL') return 'blue'
  return 'gray'
}

function statusTone(status) {
  if (status === 'Active') return 'green'
  if (status === 'Inactive') return 'gray'
  return 'gray'
}

export default function AdminFleetSuppliersPage() {
  const navigate = useNavigate()
  const useRealFleet = isAdminRealApiFeature('fleet') || !apiConfig.adminUseMockApi
  const [menuId, setMenuId] = useState(null)
  const menuRef = useRef(null)

  const { data, error, isLoading, refetch } = useApiResource(
    () => {
      if (!useRealFleet) {
        return Promise.resolve({ data: { suppliers: MOCK_SUPPLIERS } })
      }
      return adminService.listAdminFleetSuppliers()
    },
    [useRealFleet],
  )

  const rows = data?.suppliers || (!useRealFleet ? MOCK_SUPPLIERS : [])

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

  if (useRealFleet && !data && (isLoading || error)) {
    return <ApiState isLoading={isLoading} error={error} onRetry={refetch} />
  }

  return (
    <div className="px-5 py-4 pb-8 max-[700px]:px-3">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/admin/fleet')}
            className="inline-flex h-[34px] shrink-0 items-center gap-1 rounded-full border border-[#e4e8e4] bg-white px-3 text-[13px] font-medium text-[#455249] shadow-[0_1px_2px_rgba(20,40,28,.04)] hover:bg-[#f6f8f6]"
          >
            <ChevronLeft size={15} strokeWidth={2.2} />
            Champs
          </button>
          <h2 className="text-[20px] font-bold tracking-[-0.02em] text-[#17231c]">
            Fleet partners / suppliers
          </h2>
        </div>
        <button
          type="button"
          onClick={() => navigate('/admin/fleet/suppliers/new')}
          className="inline-flex h-[34px] items-center gap-1.5 rounded-full bg-[#1aa054] px-4 text-[12px] font-bold text-white shadow-[0_1px_2px_rgba(20,40,28,.15)] hover:bg-[#158a47]"
        >
          <Plus size={14} strokeWidth={2.2} />
          Add supplier
        </button>
      </div>

      <section className="overflow-hidden rounded-[14px] border border-[#eceeec] bg-white shadow-[0_1px_2px_rgba(20,40,28,.03)]">
        <div className="w-full max-w-full overflow-x-auto overscroll-x-contain touch-pan-x [-webkit-overflow-scrolling:touch]">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead>
              <tr className="border-b border-[#edf0ee] bg-[#fafbfa]">
                {['Supplier', 'Type', 'Champs', 'Commission', 'Status', ''].map((column) => (
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
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-[13px] text-[#7c8780]">
                    No suppliers found.
                  </td>
                </tr>
              ) : null}
              {rows.map((row) => {
                const menuOpen = menuId === row.id

                return (
                  <tr
                    key={row.id}
                    onClick={() => navigate(`/admin/fleet/suppliers/${encodeURIComponent(row.id)}`)}
                    className="cursor-pointer border-b border-[#f0f2f0] last:border-0 even:bg-[#fafbfa] hover:bg-[#f6f8f6]"
                  >
                    <td className="whitespace-nowrap px-4 py-3.5 text-[13px] font-bold text-[#17231c]">
                      {row.name}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5">
                      <Badge tone={typeTone(row.type)}>{row.type}</Badge>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-[12.5px] text-[#455249]">
                      {row.champs}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-[12.5px] text-[#455249]">
                      {row.commission}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5">
                      <Badge tone={statusTone(row.status)}>{row.status}</Badge>
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
                            className="absolute top-[calc(100%-6px)] right-4 z-30 w-[140px] overflow-hidden rounded-[10px] border border-[#e4e8e4] bg-white py-1 shadow-[0_10px_24px_rgba(20,40,28,.14)]"
                          >
                            <button
                              type="button"
                              role="menuitem"
                              className="flex w-full px-3.5 py-2.5 text-left text-[13px] font-medium text-[#17231c] hover:bg-[#f6f8f6]"
                              onClick={(event) => {
                                event.stopPropagation()
                                setMenuId(null)
                                navigate(`/admin/fleet/suppliers/${encodeURIComponent(row.id)}`)
                              }}
                            >
                              View
                            </button>
                            <button
                              type="button"
                              role="menuitem"
                              className="flex w-full px-3.5 py-2.5 text-left text-[13px] font-medium text-[#17231c] hover:bg-[#f6f8f6]"
                              onClick={(event) => {
                                event.stopPropagation()
                                setMenuId(null)
                                navigate(`/admin/fleet/suppliers/${encodeURIComponent(row.id)}/edit`)
                              }}
                            >
                              Edit
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
