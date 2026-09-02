import { useRef, useState } from 'react'
import { GripVertical, ImageIcon, Package, Trash2 } from 'lucide-react'
import { cn } from '../cn'
import AdminMediaImage from '../AdminMediaImage'
import {
  ADMIN_IMAGE_UPLOAD_MAX_BYTES,
  adminUploadService,
  validateAdminImageFile,
} from '../../../services/admin/uploadService'

export function ToggleSwitch({ checked, onChange, label, disabled = false }) {
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

function ExclusiveOfferImage({
  item,
  compact,
  busy,
  onImageChange,
}) {
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)

  const sizeClass = compact ? 'h-9 w-9 rounded-[8px]' : 'h-11 w-11 rounded-[10px]'

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || !onImageChange) return

    try {
      validateAdminImageFile(file, { maxBytes: ADMIN_IMAGE_UPLOAD_MAX_BYTES })
    } catch {
      return
    }

    setUploading(true)
    try {
      const result = await adminUploadService.uploadImage(file, { feature: 'ui-editor' })
      const url = result?.data?.url
      if (url) await onImageChange(item, url)
    } catch {
      // Upload or persist failed — keep the previous thumbnail.
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="relative shrink-0">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        disabled={busy || uploading}
        onChange={handleFileChange}
      />
      <button
        type="button"
        title="Change image"
        disabled={busy || uploading}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'group relative overflow-hidden border border-transparent hover:border-[#1aa054]',
          sizeClass,
          (busy || uploading) && 'opacity-60',
        )}
      >
        {item.imageUrl ? (
          <AdminMediaImage
            src={item.imageUrl}
            className={cn(sizeClass, 'object-cover')}
            fallbackClassName={cn(sizeClass, 'bg-[#eceeec]')}
            iconSize={compact ? 14 : 16}
          />
        ) : (
          <span className={cn('grid place-items-center bg-[#eceeec] text-[#8a948e]', sizeClass)}>
            <Package size={compact ? 14 : 16} />
          </span>
        )}
        <span
          className={cn(
            'absolute inset-0 grid place-items-center bg-black/45 text-white opacity-0 transition group-hover:opacity-100',
            compact ? 'text-[8px]' : 'text-[9px]',
          )}
        >
          <ImageIcon size={compact ? 12 : 14} />
        </span>
      </button>
    </div>
  )
}

export default function ExclusiveOfferRow({
  item,
  indexLabel,
  rowIndex,
  dragIndex,
  busy,
  compact = false,
  onDragStart,
  onDragOver,
  onDragEnd,
  onToggleVisible,
  onPriceChange,
  onTitleChange,
  onImageChange,
  onRemove,
}) {
  const isDragging = dragIndex === rowIndex

  if (compact) {
    return (
      <div
        draggable={!busy}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        className={cn(
          'flex flex-wrap items-center gap-2 rounded-[10px] px-1.5 py-2 hover:bg-white',
          isDragging && 'bg-[#eaf6ee] ring-1 ring-[#1aa054]',
          !item.isVisible && 'opacity-70',
        )}
      >
        <button
          type="button"
          aria-label="Drag to reorder"
          className="grid h-7 w-5 shrink-0 cursor-grab place-items-center text-[#8a948e] active:cursor-grabbing"
          disabled={busy}
        >
          <GripVertical size={14} />
        </button>

        <span className="w-7 shrink-0 text-center text-[11px] font-bold text-[#8a948e]">
          {indexLabel}
        </span>

        <ExclusiveOfferImage
          item={item}
          compact
          busy={busy}
          onImageChange={onImageChange}
        />

        <input
          type="text"
          disabled={busy}
          value={item.title}
          onChange={(event) => onTitleChange?.(item, event.target.value)}
          className="min-w-[100px] flex-1 truncate rounded-[8px] border border-[#e4e8e4] bg-white px-2 py-1.5 text-[12px] font-semibold text-[#17231c] outline-none focus:border-[#1aa054]"
        />

        <input
          type="number"
          min="0"
          step="0.001"
          disabled={busy}
          value={item.offerPrice}
          onChange={(event) =>
            onPriceChange(item, { offerPrice: Number(event.target.value) })
          }
          className="h-[30px] w-[76px] shrink-0 rounded-[8px] border border-[#e4e8e4] bg-white px-2 text-[12px] font-bold text-[#137333]"
          title="Offer price (BHD)"
        />

        <ToggleSwitch
          checked={item.isVisible}
          disabled={busy}
          label={item.isVisible ? `Hide ${item.title}` : `Show ${item.title}`}
          onChange={() => onToggleVisible(item)}
        />

        <button
          type="button"
          aria-label={`Remove ${item.title}`}
          disabled={busy}
          onClick={() => onRemove(item)}
          className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[#8a948e] hover:bg-[#fce8e8] hover:text-[#c62828] disabled:opacity-60"
        >
          <Trash2 size={14} />
        </button>
      </div>
    )
  }

  return (
    <div
      draggable={!busy}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      className={cn(
        'flex flex-wrap items-center gap-2 rounded-[12px] border border-[#e7ebe8] bg-[#fafbfa] px-2.5 py-2.5',
        isDragging && 'bg-[#eaf6ee] ring-1 ring-[#1aa054]',
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

      <ExclusiveOfferImage item={item} busy={busy} onImageChange={onImageChange} />

      <div className="min-w-0 flex-1">
        <input
          type="text"
          disabled={busy}
          value={item.title}
          onChange={(event) => onTitleChange?.(item, event.target.value)}
          className="w-full truncate rounded-[8px] border border-transparent bg-transparent px-1 py-0.5 text-[13px] font-bold text-[#17231c] outline-none focus:border-[#e4e8e4] focus:bg-white"
        />
        <p className="mt-0.5 truncate px-1 text-[11.5px] text-[#8a948e]">
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
