import { useEffect, useRef, useState } from 'react'
import { Eye, MoreVertical, Pencil, Plus } from 'lucide-react'
import { Badge } from '../Badge'
import AdminPromotionEditModal from '../AdminPromotionEditModal'

const statusTone = (status) => {
  if (status === 'Active') return 'green'
  if (status === 'Scheduled') return 'yellow'
  return 'gray'
}

function getPromotionDetails(promo) {
  if (!promo) return []
  if (promo.details?.length) return promo.details

  return [
    ['Type', promo.detailType || (promo.type === '% off' ? 'Percentage off (20%)' : promo.type)],
    ['Discount cap', promo.discountCap || 'BHD 3.000'],
    ['Min order', promo.minOrder || 'BHD 5.000'],
    ['Scope', promo.detailScope || `${promo.scope} · entire menu`],
    ['Period', promo.detailPeriod || promo.period],
    ['Eligibility', promo.eligibility || 'Everyone · code RAMADAN20'],
    ['Used', promo.usedLabel || (promo.usedLimit ? `${promo.used} of ${promo.usedLimit}` : `${promo.used}`)],
    ['Status', promo.status],
  ]
}

function PromotionViewModal({ promo, onClose, onEdit }) {
  if (!promo) return null

  const rows = getPromotionDetails(promo)

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close promotion details"
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="promotion-view-title"
        className="relative w-full max-w-[480px] overflow-hidden rounded-[14px] bg-white shadow-[0_12px_40px_rgba(20,40,28,.18)]"
      >
        <div className="flex items-center gap-2.5   px-5 py-4">
          <h2 id="promotion-view-title" className="min-w-0 text-[16px] font-bold text-[#17231c]">
            {promo.name}
          </h2>
          <Badge tone={statusTone(promo.status)}>{promo.status}</Badge>
        </div>

        <div className="px-5 py-1">
          {rows.map(([label, value]) => (
            <div
              key={label}
              className="flex items-center gap-4 border-b border-[#f0f2f0] py-3 last:border-0"
            >
              <span className="flex-1 text-[12.5px] text-[#7c8780]">{label}</span>
              <span className="text-left flex-1 text-[13px] font-medium text-[#17231c]">{value}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-start gap-4 border-t border-[#edf0ee] px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-[36px] items-center rounded-full border border-[#e4e8e4] bg-white px-4 text-[13px] font-medium text-[#17231c] hover:bg-[#f6f8f6]"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => {
              onEdit?.(promo)
              onClose?.()
            }}
            className="inline-flex h-[36px] items-center gap-1.5 rounded-full bg-[#1aa054] px-4 text-[13px] font-medium text-white hover:bg-[#158a47]"
          >
            <Pencil size={14} strokeWidth={2.2} className="text-white" />
            Edit
          </button>
        </div>
      </div>
    </div>
  )
}

export function AdminVendorPromotions({
  promotions = [],
  onNewPromotion,
  onViewPromotion,
  onEditPromotion,
  onSavePromotion,
}) {
  const [menuId, setMenuId] = useState(null)
  const [viewPromo, setViewPromo] = useState(null)
  const [editPromo, setEditPromo] = useState(null)
  const menuRef = useRef(null)

  const openEditPromotion = (promo) => {
    setViewPromo(null)
    setMenuId(null)
    setEditPromo(promo)
    onEditPromotion?.(promo)
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

  return (
    <>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-bold text-[#17231c]">Promotions</h3>
          <p className="mt-1 max-w-[520px] text-[12px] leading-[18px] text-[#7c8780]">
            See &amp; manage store-wide and branch-specific promotions.
          </p>
        </div>
        <button
          type="button"
          onClick={onNewPromotion}
          className="inline-flex h-[34px] shrink-0 items-center gap-1.5 rounded-full bg-[#1aa054] px-4 text-[12px] font-bold text-white shadow-[0_1px_2px_rgba(20,40,28,.15)] hover:bg-[#158a47]"
        >
          <Plus size={14} strokeWidth={2.2} />
          New promotion
        </button>
      </div>

      <section className="overflow-hidden rounded-[14px] border border-[#eceeec] bg-white shadow-[0_1px_2px_rgba(20,40,28,.03)]">
        <div className="w-full max-w-full overflow-x-auto overscroll-x-contain touch-pan-x [-webkit-overflow-scrolling:touch]">
          <table className="w-full min-w-[920px] border-collapse text-left">
            <thead>
              <tr className="border-b border-[#edf0ee] bg-[#fafbfa]">
                {['Promotion', 'Type', 'Scope', 'Period', 'Used', 'Status', ''].map((column) => (
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
              {promotions.map((promo) => {
                const menuOpen = menuId === promo.id

                return (
                  <tr
                    key={promo.id}
                    className="border-b border-[#f0f2f0] last:border-0 even:bg-[#fafbfa] hover:bg-[#f6f8f6]"
                  >
                    <td className="whitespace-nowrap px-4 py-3.5 text-[13px] font-bold text-[#17231c]">
                      {promo.name}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5">
                      <Badge tone="green">{promo.type}</Badge>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-[12px] text-[#455249]">
                      {promo.scope}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-[12px] text-[#455249]">
                      {promo.period}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-[12px] text-[#455249]">
                      {promo.used}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5">
                      <Badge tone={statusTone(promo.status)}>{promo.status}</Badge>
                    </td>
                    <td className="relative whitespace-nowrap px-4 py-3.5 text-right">
                      <div className="inline-block" ref={menuOpen ? menuRef : null}>
                        <button
                          type="button"
                          className="grid h-8 w-8 place-items-center rounded-md text-[#8a948e] hover:bg-[#f3f5f3] hover:text-[#455249]"
                          aria-haspopup="menu"
                          aria-expanded={menuOpen}
                          aria-label={`More actions for ${promo.name}`}
                          onClick={() => setMenuId(menuOpen ? null : promo.id)}
                        >
                          <MoreVertical size={15} />
                        </button>

                        {menuOpen ? (
                          <div
                            role="menu"
                            className="absolute top-[calc(100%-6px)] right-4 z-30 w-[128px] overflow-hidden rounded-[10px] border border-[#e4e8e4] bg-white py-1 shadow-[0_10px_24px_rgba(20,40,28,.14)]"
                          >
                            <button
                              type="button"
                              role="menuitem"
                              className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[13px] font-medium text-[#17231c] hover:bg-[#f6f8f6]"
                              onClick={() => {
                                setMenuId(null)
                                setViewPromo(promo)
                                onViewPromotion?.(promo)
                              }}
                            >
                              <Eye size={14} strokeWidth={2} className="text-[#69756d]" />
                              View
                            </button>
                            <button
                              type="button"
                              role="menuitem"
                              className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[13px] font-medium text-[#17231c] hover:bg-[#f6f8f6]"
                              onClick={() => openEditPromotion(promo)}
                            >
                              <Pencil size={14} strokeWidth={2} className="text-[#127338]" />
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

      <PromotionViewModal
        promo={viewPromo}
        onClose={() => setViewPromo(null)}
        onEdit={openEditPromotion}
      />

      <AdminPromotionEditModal
        open={Boolean(editPromo)}
        promotion={editPromo}
        onClose={() => setEditPromo(null)}
        onSave={(updated) => {
          onSavePromotion?.(updated)
          setEditPromo(null)
        }}
      />
    </>
  )
}
