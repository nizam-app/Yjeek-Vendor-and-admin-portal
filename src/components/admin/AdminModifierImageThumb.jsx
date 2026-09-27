import { useRef, useState } from 'react'
import AdminMediaImage from './AdminMediaImage'
import { resolveAdminMediaUrl } from '../../mappers/admin/mapAdminUpload'
import {
  ADMIN_IMAGE_UPLOAD_ACCEPT,
  adminUploadService,
  validateAdminImageFile,
} from '../../services/admin/uploadService'

/**
 * Compact image thumb for add-on / option-choice rows.
 * Uploads immediately on pick → returns persisted URL via onChange.
 */
export default function AdminModifierImageThumb({
  imageUrl = null,
  onChange,
  disabled = false,
  sizeClass = 'size-[34px]',
}) {
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  async function handleFile(file) {
    if (!file || disabled || uploading) return
    setError('')
    try {
      validateAdminImageFile(file)
    } catch (err) {
      setError(err?.message || 'Unable to use this image.')
      return
    }
    setUploading(true)
    try {
      const uploaded = await adminUploadService.uploadImage(file, { feature: 'menu-import' })
      const url = uploaded?.data?.url || uploaded?.url || uploaded?.imageUrl || ''
      if (!url) throw new Error('Image upload failed.')
      onChange?.(String(url))
    } catch (err) {
      setError(err?.message || 'Image upload failed.')
    } finally {
      setUploading(false)
    }
  }

  const displayUrl = imageUrl ? resolveAdminMediaUrl(imageUrl) || imageUrl : null

  return (
    <div className="relative shrink-0">
      <input
        ref={inputRef}
        type="file"
        accept={ADMIN_IMAGE_UPLOAD_ACCEPT}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0]
          event.target.value = ''
          void handleFile(file)
        }}
      />
      {displayUrl ? (
        <div className={`relative flex ${sizeClass} overflow-hidden rounded-[8px] bg-[#E3F2EB]`}>
          <AdminMediaImage
            src={displayUrl}
            alt=""
            className="absolute inset-0 size-full object-cover"
            fallbackClassName="absolute inset-0 size-full"
            iconSize={14}
          />
          <button
            type="button"
            disabled={disabled || uploading}
            onClick={() => onChange?.(null)}
            className="absolute top-0 end-0 z-[1] flex size-4 items-center justify-center rounded-bl-[6px] bg-black/55 text-[9px] text-white hover:bg-black/70 disabled:opacity-50"
            aria-label="Remove image"
          >
            ✕
          </button>
          <button
            type="button"
            disabled={disabled || uploading}
            onClick={() => inputRef.current?.click()}
            className="absolute inset-0 z-0"
            aria-label="Change image"
          />
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled || uploading}
          onClick={() => inputRef.current?.click()}
          className={`box-border flex ${sizeClass} shrink-0 items-center justify-center rounded-[8px] border-[1.4px] border-dashed border-[#C7CFC7] bg-white text-[12px] disabled:opacity-60`}
          aria-label="Add image"
          title={error || undefined}
        >
          {uploading ? '…' : '📷'}
        </button>
      )}
      {error ? (
        <p className="absolute start-0 top-full z-10 mt-0.5 max-w-[140px] text-[9px] font-medium leading-tight text-[#C0392B]">
          {error}
        </p>
      ) : null}
    </div>
  )
}

/** Reorder helper for drag-and-drop lists. */
export function moveListItem(list, fromIndex, toIndex) {
  if (
    !Array.isArray(list) ||
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= list.length ||
    toIndex >= list.length
  ) {
    return list
  }
  const next = [...list]
  const [item] = next.splice(fromIndex, 1)
  next.splice(toIndex, 0, item)
  return next
}
