import { useEffect, useRef, useState } from 'react'
import { GripVertical, Package, Plus, Trash2 } from 'lucide-react'
import { cn } from '../cn'
import AdminMediaImage from '../AdminMediaImage'
import { formatApiErrorMessage } from '../../../api/errors'
import { useAdminUiEditorExclusiveOffers } from '../../../hooks/admin/useAdminUiEditor'
import { adminUiEditorService } from '../../../services/admin/uiEditorService'
import AddExclusiveProductsModal from './AddExclusiveProductsModal'

function formatBhd(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '0.000'
  return n.toFixed(3)
}

function ToggleSwitch({ checked, onChange, label, disabled = false }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={cn(
        'relative h-[28px] w-[48px] shrink-0 rounded-full transition disabled:cursor-not-allowed disabled:opacity-50',
        checked ? 'bg-[#1aa054]' : 'bg-[#d5dbd7]',
      )}
    >
      <span
        className={cn(
          'absolute top-[3px] h-[22px] w-[22px] rounded-full bg-white shadow transition',
          checked ? 'left-[23px]' : 'left-[3px]',
        )}
      />
    </button>
  )
}

function ExclusiveOfferRow({
  item,
  indexLabel,
  rowIndex,
  dragIndex,
  busy,
  onDragStart,
  onDragOver,
  onDragEnd,
  onToggleVisible,
  onPriceChange,
  onRemove,
}) {
  const isDragging = dragIndex === rowIndex

  return (
    <div
      draggable={!busy}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      className={cn(
        'flex flex-wrap items-center gap-2 rounded-[12px] border border-[#e7ebe8] bg-[#fafbfa] px-2.5 py-2.5',
        isDragging && 'ring-1 ring-[#1aa054] bg-[#eaf6ee]',
        !item.isVisible && 'opacity-70',
      )}
    >
      <button
        type="button"
        aria-label="Drag to reorder"
        className="grid h-8 w-6 shrink-0 cursor-grab place-items-center text-[#8a948e] active:cursor-grabbing"
        disabled={busy}
      >
        <GripVertical size={16} />
      </button>

      <span className="w-9 shrink-0 text-center text-[12px] font-bold text-[#8a948e]">{indexLabel}</span>

      {item.imageUrl ? (
        <AdminMediaImage
          src={item.imageUrl}
          className="h-11 w-11 shrink-0 rounded-[10px] object-cover"
          fallbackClassName="h-11 w-11 shrink-0 rounded-[10px] bg-[#eceeec]"
          iconSize={16}
        />
      ) : (
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[10px] bg-[#eceeec] text-[#8a948e]">
          <Package size={16} />
        </span>
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-bold text-[#17231c]">{item.title}</p>
        <p className="mt-0.5 truncate text-[11.5px] text-[#8a948e]">
          {item.vendor?.name || 'Vendor'}
          {!item.liveOnCustomer ? ' · Not live on customer app' : ''}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <label className="text-[10px] font-bold uppercase tracking-[0.04em] text-[#8a948e]">
          Was
        </label>
        <input
          type="number"
          min="0"
          step="0.001"
          disabled={busy}
          value={item.originalPrice}
          onChange={(event) =>
            onPriceChange(item, { originalPrice: Number(event.target.value) })
          }
          className="h-[32px] w-[72px] rounded-[8px] border border-[#e4e8e4] bg-white px-2 text-[12px] text-[#17231c]"
        />
        <label className="text-[10px] font-bold uppercase tracking-[0.04em] text-[#8a948e]">
          Offer
        </label>
        <input
          type="number"
          min="0"
          step="0.001"
          disabled={busy}
          value={item.offerPrice}
          onChange={(event) =>
            onPriceChange(item, { offerPrice: Number(event.target.value) })
          }
          className="h-[32px] w-[72px] rounded-[8px] border border-[#e4e8e4] bg-white px-2 text-[12px] font-bold text-[#137333]"
        />
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <span className="text-[11px] font-semibold text-[#8a948e]">
          {item.isVisible ? 'Visible' : 'Hidden'}
        </span>
        <ToggleSwitch
          checked={item.isVisible}
          disabled={busy}
          label={item.isVisible ? `Hide ${item.title}` : `Show ${item.title}`}
          onChange={() => onToggleVisible(item)}
        />
      </div>

      <button
        type="button"
        aria-label={`Remove ${item.title}`}
        disabled={busy}
        onClick={() => onRemove(item)}
        className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[#8a948e] hover:bg-white hover:text-[#c62828] disabled:opacity-60"
      >
        <Trash2 size={15} />
      </button>
    </div>
  )
}

function ExclusiveOffersPhonePreview({ section, items }) {
  const visible = items.filter((item) => item.isVisible)
  return (
    <div className="mx-auto w-full max-w-[280px]">
      <div className="overflow-hidden rounded-[28px] border-[5px] border-[#1a1a1a] bg-white shadow-[0_12px_32px_rgba(20,40,28,.12)]">
        <div className="flex items-center justify-between bg-[#f7f8f7] px-4 py-2 text-[11px] font-semibold text-[#17231c]">
          <span>9:41</span>
          <span className="font-bold tracking-wide">Yjeek</span>
          <span className="inline-flex items-center gap-0.5 text-[10px]">
            <span className="h-[7px] w-[7px] rounded-full bg-[#17231c]/30" />
            <span className="h-[7px] w-[7px] rounded-full bg-[#17231c]/55" />
            <span className="h-[7px] w-[10px] rounded-[2px] bg-[#17231c]/80" />
          </span>
        </div>
        <div className="space-y-3 bg-[#fafbfa] p-3">
          <div className="grid grid-cols-4 gap-2 opacity-40">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="flex flex-col items-center gap-1">
                <div className="h-10 w-10 rounded-[12px] bg-[#e8f5e9]" />
                <span className="h-2 w-8 rounded bg-[#eceeec]" />
              </div>
            ))}
          </div>
          <div className="opacity-40">
            <p className="mb-2 text-[12px] font-bold text-[#17231c]">Top picks near you</p>
            <div className="h-11 rounded-[10px] bg-[#e8f5e9]" />
          </div>
          {section.isVisible && visible.length > 0 ? (
            <div>
              <p className="mb-2 text-[12px] font-bold text-[#17231c]">{section.title}</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {visible.slice(0, 6).map((item) => (
                  <div
                    key={item.id}
                    className="w-[92px] shrink-0 rounded-[10px] border border-[#e4e8e4] bg-white p-1.5"
                  >
                    {item.imageUrl ? (
                      <AdminMediaImage
                        src={item.imageUrl}
                        className="mb-1.5 h-[52px] w-full rounded-[8px] object-cover"
                        fallbackClassName="mb-1.5 h-[52px] w-full rounded-[8px] bg-[#eceeec]"
                        iconSize={14}
                      />
                    ) : (
                      <div className="mb-1.5 grid h-[52px] w-full place-items-center rounded-[8px] bg-[#eceeec] text-[#8a948e]">
                        <Package size={16} />
                      </div>
                    )}
                    <p className="line-clamp-2 text-[9px] font-semibold leading-tight text-[#17231c]">
                      {item.title}
                    </p>
                    <p className="mt-1 text-[10px] font-bold text-[#137333]">
                      BHD {formatBhd(item.offerPrice)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-[10px] border border-dashed border-[#81c784] bg-[#e8f5e9]/70 px-3 py-4 text-center">
              <p className="text-[11px] font-bold text-[#2e7d32]">Section hidden or empty</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ExclusiveOffersTab({ onMessage }) {
  const {
    section: apiSection,
    summary,
    items: apiItems,
    isLoading,
    error,
    refetch,
    enabled,
  } = useAdminUiEditorExclusiveOffers()

  const [section, setSection] = useState({
    title: 'Super Exclusive offers',
    titleAr: '',
    isVisible: true,
  })
  const [items, setItems] = useState([])
  const itemsRef = useRef(items)
  const [dragIndex, setDragIndex] = useState(null)
  const [busy, setBusy] = useState(false)
  const [localError, setLocalError] = useState(null)
  const [addOpen, setAddOpen] = useState(false)
  const sectionSaveTimer = useRef(null)
  const priceSaveTimers = useRef({})

  useEffect(() => {
    itemsRef.current = items
  }, [items])

  useEffect(() => {
    if (!enabled) return
    setSection({
      title: apiSection.title || 'Super Exclusive offers',
      titleAr: apiSection.titleAr || '',
      isVisible: apiSection.isVisible !== false,
    })
    setItems(apiItems)
  }, [apiSection, apiItems, enabled])

  const persistSection = async (patch) => {
    if (!enabled) return
    setLocalError(null)
    try {
      await adminUiEditorService.updateExclusiveOffersSection(patch)
      await refetch()
    } catch (err) {
      setLocalError(err)
    }
  }

  const scheduleSectionSave = (nextSection) => {
    if (!enabled) return
    if (sectionSaveTimer.current) clearTimeout(sectionSaveTimer.current)
    sectionSaveTimer.current = setTimeout(() => {
      persistSection({
        title: nextSection.title,
        titleAr: nextSection.titleAr,
        isVisible: nextSection.isVisible,
      })
    }, 500)
  }

  const handleSectionChange = (patch) => {
    setSection((prev) => {
      const next = { ...prev, ...patch }
      scheduleSectionSave(next)
      return next
    })
  }

  const handleSectionToggle = (isVisible) => {
    handleSectionChange({ isVisible })
    onMessage?.(
      isVisible
        ? 'Section will show on customer home after publish.'
        : 'Section hidden from customer home after publish.',
    )
  }

  const handleAddProducts = async ({ productIds }) => {
    setBusy(true)
    setLocalError(null)
    try {
      await adminUiEditorService.addExclusiveOfferItems({ productIds })
      await refetch()
      setAddOpen(false)
      onMessage?.('Products added to Super Exclusive offers.')
    } catch (err) {
      setLocalError(err)
      throw err
    } finally {
      setBusy(false)
    }
  }

  const handleToggleVisible = async (item) => {
    const nextVisible = !item.isVisible
    setItems((prev) =>
      prev.map((row) => (row.id === item.id ? { ...row, isVisible: nextVisible } : row)),
    )
    if (!enabled) return
    setLocalError(null)
    try {
      await adminUiEditorService.patchExclusiveOfferItem(item.id, { isVisible: nextVisible })
      await refetch()
    } catch (err) {
      setLocalError(err)
      await refetch()
    }
  }

  const handlePriceChange = (item, patch) => {
    setItems((prev) =>
      prev.map((row) => (row.id === item.id ? { ...row, ...patch } : row)),
    )
  }

  const schedulePriceSave = (item, patch) => {
    handlePriceChange(item, patch)
    if (!enabled) return
    if (priceSaveTimers.current[item.id]) clearTimeout(priceSaveTimers.current[item.id])
    priceSaveTimers.current[item.id] = setTimeout(async () => {
      setLocalError(null)
      try {
        await adminUiEditorService.patchExclusiveOfferItem(item.id, patch)
        await refetch()
      } catch (err) {
        setLocalError(err)
        await refetch()
      }
    }, 450)
  }

  const handleRemove = async (item) => {
    if (!window.confirm(`Remove “${item.title}” from Super Exclusive offers?`)) return
    if (!enabled) {
      setItems((prev) => prev.filter((row) => row.id !== item.id))
      return
    }
    setBusy(true)
    setLocalError(null)
    try {
      await adminUiEditorService.deleteExclusiveOfferItem(item.id)
      await refetch()
      onMessage?.('Product removed.')
    } catch (err) {
      setLocalError(err)
    } finally {
      setBusy(false)
    }
  }

  const onDragStart = (index) => setDragIndex(index)

  const onDragOver = (event, index) => {
    event.preventDefault()
    if (dragIndex === null || dragIndex === index) return
    setItems((prev) => {
      const next = [...prev]
      const [moved] = next.splice(dragIndex, 1)
      next.splice(index, 0, moved)
      const ordered = next.map((row, sortOrder) => ({ ...row, sortOrder }))
      itemsRef.current = ordered
      return ordered
    })
    setDragIndex(index)
  }

  const onDragEnd = async () => {
    setDragIndex(null)
    if (!enabled) return
    setLocalError(null)
    const ordered = itemsRef.current.map((row, sortOrder) => ({ ...row, sortOrder }))
    setItems(ordered)
    try {
      await adminUiEditorService.reorderExclusiveOfferItems(ordered)
      await refetch()
      onMessage?.('Serial order updated.')
    } catch (err) {
      setLocalError(err)
      await refetch()
    }
  }

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_minmax(250px,300px)] items-start gap-5 max-[980px]:grid-cols-1">
      <section className="rounded-[14px] border border-[#eceeec] bg-white p-4">
        <div className="mb-4 rounded-[12px] border border-[#eef1ef] bg-[#fafbfa] p-3.5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-[0.04em] text-[#8a948e]">
                Section title (customer home)
              </p>
              <input
                type="text"
                value={section.title}
                disabled={busy}
                onChange={(event) => handleSectionChange({ title: event.target.value })}
                placeholder="Super Exclusive offers"
                className="mt-1 h-[40px] w-full rounded-[10px] border border-[#e4e8e4] bg-white px-3 text-[15px] font-bold text-[#17231c] outline-none focus:border-[#1aa054]"
              />
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-[0.04em] text-[#8a948e]">
                Show section
              </span>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'text-[12px] font-bold',
                    section.isVisible ? 'text-[#147940]' : 'text-[#8a948e]',
                  )}
                >
                  {section.isVisible ? 'On' : 'Off'}
                </span>
                <ToggleSwitch
                  checked={section.isVisible}
                  disabled={busy}
                  label="Show section on customer home"
                  onChange={handleSectionToggle}
                />
              </div>
            </div>
          </div>

          <label className="block">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.04em] text-[#8a948e]">
              Title (AR)
            </span>
            <input
              type="text"
              dir="rtl"
              value={section.titleAr}
              disabled={busy}
              onChange={(event) => handleSectionChange({ titleAr: event.target.value })}
              placeholder="عروض حصرية جداً"
              className="h-[38px] w-full rounded-[10px] border border-[#e4e8e4] bg-white px-3 text-[13px] text-[#17231c] outline-none focus:border-[#1aa054]"
            />
          </label>
        </div>

        <div className="mb-3.5 flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-[16px] font-bold text-[#17231c]">Products in carousel</h3>
            <p className="mt-0.5 text-[12.5px] text-[#7c8780]">
              Drag to set serial order · toggle visibility · edit offer prices
            </p>
            {summary.unpublishedChanges ? (
              <p className="mt-1 text-[12px] font-semibold text-[#e65100]">
                Unpublished changes — publish to update the customer app
              </p>
            ) : null}
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={() => setAddOpen(true)}
            className="inline-flex h-[36px] shrink-0 items-center gap-1 rounded-full bg-[#1aa054] px-4 text-[12.5px] font-bold text-white shadow-[0_1px_2px_rgba(20,40,28,.12)] hover:bg-[#158a47] disabled:opacity-60"
          >
            <Plus size={14} strokeWidth={2.8} />
            Add products
          </button>
        </div>

        {enabled && isLoading && apiItems.length === 0 ? (
          <p className="mb-3 text-[13px] text-[#8a948e]">Loading exclusive offers…</p>
        ) : null}
        {enabled && (error || localError) ? (
          <p className="mb-3 text-[13px] text-[#c91a24]">
            {formatApiErrorMessage(localError || error, 'Unable to load exclusive offers.')}{' '}
            <button type="button" className="underline" onClick={refetch}>
              Retry
            </button>
          </p>
        ) : null}

        {items.length > 0 ? (
          <div className="mb-2 hidden flex-wrap items-center gap-2 px-1 text-[10px] font-bold uppercase tracking-[0.04em] text-[#8a948e] sm:flex">
            <span className="w-6" />
            <span className="w-9 text-center">#</span>
            <span className="w-11" />
            <span className="min-w-[120px] flex-1">Product</span>
            <span className="w-[168px]">Prices (BHD)</span>
            <span className="w-[108px]">Visible</span>
            <span className="w-8" />
          </div>
        ) : null}

        <div className="space-y-2">
          {items.length === 0 ? (
            <p className="rounded-[10px] border border-dashed border-[#d5dbd6] bg-[#fafbfa] px-4 py-8 text-center text-[13px] text-[#8a948e]">
              No products yet. Add products to build the carousel.
            </p>
          ) : (
            items.map((item, index) => (
              <ExclusiveOfferRow
                key={item.id}
                item={item}
                indexLabel={`#${index + 1}`}
                rowIndex={index}
                dragIndex={dragIndex}
                busy={busy}
                onDragStart={() => onDragStart(index)}
                onDragOver={(event) => onDragOver(event, index)}
                onDragEnd={onDragEnd}
                onToggleVisible={handleToggleVisible}
                onPriceChange={schedulePriceSave}
                onRemove={handleRemove}
              />
            ))
          )}
        </div>

        <p className="mt-3 text-[12px] text-[#8a948e]">
          {summary.liveOnCustomerCount ?? items.filter((i) => i.liveOnCustomer).length} live on
          customer app · {summary.visibleCount ?? items.filter((i) => i.isVisible).length} visible
          · {items.length} in serial order
        </p>
      </section>

      <section className="rounded-[14px] border border-[#eceeec] bg-white p-4">
        <h3 className="mb-1 text-[14px] font-bold text-[#17231c]">Phone preview</h3>
        <p className="mb-4 text-[12px] text-[#8a948e]">
          Customer home — {section.isVisible ? 'section on' : 'section off'}
        </p>
        <ExclusiveOffersPhonePreview section={section} items={items} />
      </section>

      <AddExclusiveProductsModal
        open={addOpen}
        onClose={() => !busy && setAddOpen(false)}
        isSubmitting={busy}
        onSubmit={handleAddProducts}
      />
    </div>
  )
}
