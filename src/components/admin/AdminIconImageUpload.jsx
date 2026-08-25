import { useRef, useState } from 'react'
import { CatalogStoreIcon } from '../CatalogStoreIcons'
import { formatApiErrorMessage } from '../../api/errors'
import {
  ADMIN_IMAGE_UPLOAD_ACCEPT,
  ADMIN_IMAGE_UPLOAD_MAX_BYTES,
  adminUploadService,
  validateAdminImageFile,
} from '../../services/admin/uploadService'
import { cn } from './cn'

/**
 * Compact admin icon upload: shows iconUrl or placeholder; upload / replace via adminUploadService.
 * Never persists emoji — only remote upload URLs via onUrlChange.
 */
export default function AdminIconImageUpload({
  iconUrl = null,
  onUrlChange,
  size = 48,
  feature = 'store-types',
  disabled = false,
  className,
}) {
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)

  const hasImage = Boolean(String(iconUrl || '').trim())
  const buttonLabel = uploading ? 'Uploading…' : hasImage ? 'Replace image' : 'Upload image'

  const handlePick = () => {
    if (disabled || uploading) return
    inputRef.current?.click()
  }

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setError(null)
    try {
      validateAdminImageFile(file, { maxBytes: ADMIN_IMAGE_UPLOAD_MAX_BYTES })
    } catch (err) {
      setError(err)
      return
    }

    setUploading(true)
    try {
      const result = await adminUploadService.uploadImage(file, { feature })
      const url = result?.data?.url
      if (!url) throw new Error('Upload succeeded but no image URL was returned.')
      onUrlChange?.(url)
    } catch (err) {
      setError(err)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className={cn('min-w-0', className)}>
      <input
        ref={inputRef}
        type="file"
        accept={ADMIN_IMAGE_UPLOAD_ACCEPT}
        className="hidden"
        onChange={handleFileChange}
      />
      <div className="flex items-center gap-2.5">
        <span
          className="grid shrink-0 place-items-center overflow-hidden rounded-[12px] bg-[#f3f5f3]"
          style={{ width: size, height: size }}
        >
          <CatalogStoreIcon
            iconUrl={iconUrl}
            className="size-[70%] max-h-full max-w-full"
            placeholderSize={Math.max(12, Math.round(size * 0.35))}
          />
        </span>
        <button
          type="button"
          onClick={handlePick}
          disabled={disabled || uploading}
          className="inline-flex h-[34px] items-center rounded-full border border-[#1aa054] bg-white px-3.5 text-[12.5px] font-medium text-[#1aa054] hover:bg-[#f3faf5] disabled:opacity-60"
        >
          {buttonLabel}
        </button>
      </div>
      {error ? (
        <p className="mt-1.5 text-[11.5px] text-[#d64044]">{formatApiErrorMessage(error)}</p>
      ) : null}
    </div>
  )
}
