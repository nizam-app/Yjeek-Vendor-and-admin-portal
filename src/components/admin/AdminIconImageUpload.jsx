import { useEffect, useRef, useState } from 'react'
import { Crop, Eye } from 'lucide-react'
import { CatalogStoreIcon } from '../CatalogStoreIcons'
import { formatApiErrorMessage } from '../../api/errors'
import { resolveAdminMediaUrl } from '../../mappers/admin/mapAdminUpload'
import {
  ADMIN_IMAGE_UPLOAD_ACCEPT,
  ADMIN_IMAGE_UPLOAD_MAX_BYTES,
  adminUploadService,
  validateAdminImageFile,
} from '../../services/admin/uploadService'
import AdminImageCropModal from './AdminImageCropModal'
import AdminImagePreviewModal from './AdminImagePreviewModal'
import AdminMediaImage from './AdminMediaImage'
import { cn } from './cn'

async function resolveImageForEditing(imageUrl, localPreviewUrl) {
  if (localPreviewUrl) return localPreviewUrl

  const trimmed = String(imageUrl || '').trim()
  if (!trimmed) return ''

  if (trimmed.startsWith('blob:')) return trimmed

  const resolved = resolveAdminMediaUrl(trimmed) || trimmed
  const response = await fetch(resolved)
  if (!response.ok) {
    throw new Error('Could not load image for editing.')
  }
  const blob = await response.blob()
  return URL.createObjectURL(blob)
}

/**
 * Compact admin icon upload: square crop, live thumbnail preview, and full-size preview modal.
 * Never persists emoji — only remote upload URLs via onUrlChange.
 */
export default function AdminIconImageUpload({
  iconUrl = null,
  onUrlChange,
  size = 48,
  aspect = 1,
  feature = 'store-types',
  disabled = false,
  className,
}) {
  const inputRef = useRef(null)
  const localPreviewRef = useRef(null)
  const cropSourceRef = useRef(null)

  const [localPreviewUrl, setLocalPreviewUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const [cropOpen, setCropOpen] = useState(false)
  const [cropImageSrc, setCropImageSrc] = useState('')
  const [previewOpen, setPreviewOpen] = useState(false)
  const [loadingCropSource, setLoadingCropSource] = useState(false)

  const revokeLocalPreview = () => {
    if (localPreviewRef.current) {
      URL.revokeObjectURL(localPreviewRef.current)
      localPreviewRef.current = null
    }
    setLocalPreviewUrl('')
  }

  const revokeCropSource = () => {
    if (cropSourceRef.current) {
      URL.revokeObjectURL(cropSourceRef.current)
      cropSourceRef.current = null
    }
    setCropImageSrc('')
  }

  useEffect(
    () => () => {
      if (localPreviewRef.current) URL.revokeObjectURL(localPreviewRef.current)
      if (cropSourceRef.current) URL.revokeObjectURL(cropSourceRef.current)
    },
    [],
  )

  const hasLocalPreview = Boolean(localPreviewUrl)
  const hasRemoteImage = Boolean(String(iconUrl || '').trim())
  const hasImage = hasLocalPreview || hasRemoteImage
  const previewSrc = localPreviewUrl || iconUrl
  const isBusy = uploading || loadingCropSource || disabled
  const buttonLabel = uploading ? 'Uploading…' : hasImage ? 'Replace image' : 'Upload image'

  const uploadFile = async (file) => {
    setError(null)
    setUploading(true)
    try {
      const result = await adminUploadService.uploadImage(file, { feature })
      const url = result?.data?.url
      if (!url) throw new Error('Upload succeeded but no image URL was returned.')
      onUrlChange?.(url)
      revokeLocalPreview()
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setUploading(false)
    }
  }

  const openCropWithFile = (file) => {
    revokeCropSource()
    const objectUrl = URL.createObjectURL(file)
    cropSourceRef.current = objectUrl
    setCropImageSrc(objectUrl)
    setCropOpen(true)
  }

  const handlePick = () => {
    if (isBusy) return
    inputRef.current?.click()
  }

  const handleFileChange = (event) => {
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

    openCropWithFile(file)
  }

  const handleCropApply = async (croppedFile) => {
    revokeLocalPreview()
    const objectUrl = URL.createObjectURL(croppedFile)
    localPreviewRef.current = objectUrl
    setLocalPreviewUrl(objectUrl)

    await uploadFile(croppedFile)
    revokeCropSource()
  }

  const handleOpenCrop = async () => {
    if (isBusy) return

    setError(null)
    setLoadingCropSource(true)
    try {
      const src = await resolveImageForEditing(iconUrl, localPreviewUrl)
      if (!src) return

      if (src !== localPreviewUrl) {
        revokeCropSource()
        cropSourceRef.current = src
      }

      setCropImageSrc(src)
      setCropOpen(true)
    } catch (err) {
      setError(err)
    } finally {
      setLoadingCropSource(false)
    }
  }

  const handleCloseCrop = () => {
    setCropOpen(false)
    revokeCropSource()
  }

  const handleOpenPreview = () => {
    if (!hasImage || isBusy) return
    setPreviewOpen(true)
  }

  const iconButtonClass =
    'inline-flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full border border-[#d5dbd6] bg-white text-[#455249] hover:bg-[#f7f9f7] disabled:opacity-60'

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
        <button
          type="button"
          onClick={handleOpenPreview}
          disabled={!hasImage || isBusy}
          className={cn(
            'grid shrink-0 place-items-center overflow-hidden rounded-[12px] bg-[#f3f5f3]',
            hasImage && !isBusy && 'cursor-zoom-in ring-offset-1 hover:ring-2 hover:ring-[#1aa054]/35',
            (!hasImage || isBusy) && 'cursor-default',
          )}
          style={{ width: size, height: size }}
          aria-label={hasImage ? 'Preview image' : 'No image uploaded'}
        >
          {hasLocalPreview ? (
            <img src={localPreviewUrl} alt="" className="h-full w-full object-cover" />
          ) : hasRemoteImage ? (
            <AdminMediaImage
              src={iconUrl}
              alt=""
              className="h-full w-full object-cover"
              fallbackClassName="h-full w-full"
            />
          ) : (
            <CatalogStoreIcon
              iconUrl={iconUrl}
              className="size-[70%] max-h-full max-w-full"
              placeholderSize={Math.max(12, Math.round(size * 0.35))}
            />
          )}
        </button>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={handlePick}
            disabled={isBusy}
            className="inline-flex h-[34px] items-center rounded-full border border-[#1aa054] bg-white px-3.5 text-[12.5px] font-medium text-[#1aa054] hover:bg-[#f3faf5] disabled:opacity-60"
          >
            {buttonLabel}
          </button>

          {hasImage ? (
            <>
              <button
                type="button"
                onClick={handleOpenPreview}
                disabled={isBusy}
                className={iconButtonClass}
                aria-label="Preview image"
                title="Preview"
              >
                <Eye size={15} strokeWidth={1.9} />
              </button>
              <button
                type="button"
                onClick={handleOpenCrop}
                disabled={isBusy}
                className={iconButtonClass}
                aria-label="Crop image"
                title={loadingCropSource ? 'Loading…' : 'Crop'}
              >
                <Crop size={15} strokeWidth={1.9} />
              </button>
            </>
          ) : null}
        </div>
      </div>

      {error ? (
        <p className="mt-1.5 text-[11.5px] text-[#d64044]">{formatApiErrorMessage(error)}</p>
      ) : null}

      <AdminImageCropModal
        open={cropOpen}
        imageSrc={cropImageSrc}
        aspect={aspect}
        title="Crop store type icon"
        busy={uploading}
        onClose={handleCloseCrop}
        onApply={handleCropApply}
      />

      <AdminImagePreviewModal
        open={previewOpen}
        imageSrc={previewSrc}
        title="Store type icon"
        onClose={() => setPreviewOpen(false)}
      />
    </div>
  )
}
