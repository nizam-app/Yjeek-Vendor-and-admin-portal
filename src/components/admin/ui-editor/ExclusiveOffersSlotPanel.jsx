import { Plus } from 'lucide-react'
import { cn } from '../cn'
import ExclusiveOfferRow, { ToggleSwitch } from './ExclusiveOfferRow'

export default function ExclusiveOffersSlotPanel({
  section,
  items,
  summary,
  busy = false,
  dragIndex,
  variant = 'compact',
  className,
  onSectionChange,
  onSectionToggle,
  onAdd,
  onDragStart,
  onDragOver,
  onDragEnd,
  onToggleVisible,
  onPriceChange,
  onTitleChange,
  onImageChange,
  onRemove,
}) {
  const compact = variant === 'compact'

  return (
    <div className={cn(compact ? 'space-y-2' : 'space-y-3', className)}>
      <div
        className={cn(
          'rounded-[10px] border border-[#e4e8e4] bg-white p-2.5',
          compact ? '' : 'p-3.5',
        )}
      >
        <div className="flex flex-wrap items-center gap-3">
          <label className="min-w-[160px] flex-1">
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.04em] text-[#8a948e]">
              Section title
            </span>
            <input
              type="text"
              value={section.title}
              disabled={busy}
              onChange={(event) => onSectionChange?.({ title: event.target.value })}
              className="h-[34px] w-full rounded-[8px] border border-[#e4e8e4] bg-[#fafbfa] px-2.5 text-[13px] font-bold text-[#17231c] outline-none focus:border-[#1aa054] focus:bg-white"
            />
          </label>
          <div className="flex shrink-0 items-center gap-2">
            <span className="text-[11px] font-semibold text-[#8a948e]">
              {section.isVisible ? 'Section on' : 'Section off'}
            </span>
            <ToggleSwitch
              checked={section.isVisible}
              disabled={busy}
              label="Show section on customer home"
              onChange={onSectionToggle}
            />
          </div>
        </div>
        {summary?.unpublishedChanges ? (
          <p className="mt-2 text-[11px] font-semibold text-[#e65100]">
            Unpublished changes — publish to update the customer app
          </p>
        ) : null}
      </div>

      {items.length > 0 ? (
        <div className="space-y-0.5">
          {compact ? (
            <div className="flex flex-wrap items-center gap-2 px-1.5 pb-1 text-[10px] font-bold uppercase tracking-[0.04em] text-[#8a948e]">
              <span className="w-5" />
              <span className="w-7 text-center">#</span>
              <span className="w-9" />
              <span className="min-w-[100px] flex-1">Title</span>
              <span className="w-[76px]">Offer</span>
              <span className="w-[48px]">Show</span>
              <span className="w-7" />
            </div>
          ) : null}
          {items.map((item, index) => (
            <ExclusiveOfferRow
              key={item.id}
              item={item}
              indexLabel={`#${index + 1}`}
              rowIndex={index}
              dragIndex={dragIndex}
              busy={busy}
              compact={compact}
              onDragStart={() => onDragStart?.(index)}
              onDragOver={(event) => onDragOver?.(event, index)}
              onDragEnd={onDragEnd}
              onToggleVisible={onToggleVisible}
              onPriceChange={onPriceChange}
              onTitleChange={onTitleChange}
              onImageChange={onImageChange}
              onRemove={onRemove}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-[10px] border border-dashed border-[#d5dbd6] bg-[#fafbfa] px-4 py-6 text-center">
          <p className="text-[12.5px] text-[#8a948e]">No products in this carousel yet.</p>
          <button
            type="button"
            disabled={busy}
            onClick={() => onAdd?.()}
            className="mt-3 inline-flex h-[32px] items-center gap-1 rounded-full bg-[#1aa054] px-3.5 text-[12px] font-bold text-white hover:bg-[#158a47] disabled:opacity-60"
          >
            <Plus size={13} strokeWidth={2.8} />
            Add products
          </button>
        </div>
      )}

      {items.length > 0 ? (
        <p className="px-1 text-[11px] text-[#8a948e]">
          Drag rows to reorder · click image to replace · toggle to hide from carousel
        </p>
      ) : null}
    </div>
  )
}
