import { useEffect, useRef, useState } from 'react'
import { Crop, Eye, Upload } from 'lucide-react'
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

function FieldLabel({ children }) {
  return <span className="mb-1.5 block text-[12px] font-medium text-[#7c8780]">{children}</span>
}

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

export default function AdminVendorImageUpload({
  label,
  imageUrl = '',
  aspect = 1,
  onUrlChange,
}) {
  const inputRef = useRef(null)
  const localPreviewRef = useRef(null)
  const cropSourceRef = useRef(null)

  const [localPreviewUrl, setLocalPreviewUrl] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)
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

  const uploadFile = async (file) => {
    setUploadError(null)
    setIsUploading(true)
    try {
      const result = await adminUploadService.uploadImage(file, { feature: 'vendors' })
      const url = result?.data?.url
      if (!url) {
        throw new Error('Upload succeeded but no image URL was returned.')
      }
      onUrlChange?.(url)
      revokeLocalPreview()
    } catch (err) {
      setUploadError(err)
      throw err
    } finally {
      setIsUploading(false)
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
    if (isUploading || loadingCropSource) return
    inputRef.current?.click()
  }

  const handleFileChange = (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setUploadError(null)

    try {
      validateAdminImageFile(file, { maxBytes: ADMIN_IMAGE_UPLOAD_MAX_BYTES })
    } catch (err) {
      setUploadError(err)
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
    if (isUploading || loadingCropSource) return

    setUploadError(null)
    setLoadingCropSource(true)
    try {
      const src = await resolveImageForEditing(imageUrl, localPreviewUrl)
      if (!src) return

      if (src !== localPreviewUrl) {
        revokeCropSource()
        cropSourceRef.current = src
      }

      setCropImageSrc(src)
      setCropOpen(true)
    } catch (err) {
      setUploadError(err)
    } finally {
      setLoadingCropSource(false)
    }
  }

  const handleCloseCrop = () => {
    setCropOpen(false)
    revokeCropSource()
  }

  const hasLocalPreview = Boolean(localPreviewUrl)
  const hasRemoteImage = Boolean(String(imageUrl || '').trim())
  const hasImage = hasLocalPreview || hasRemoteImage
  const previewSrc = localPreviewUrl || imageUrl
  const isBusy = isUploading || loadingCropSource

  return (
    <label className="block">
      <FieldLabel>{label}</FieldLabel>
      <input
        ref={inputRef}
        type="file"
        accept={ADMIN_IMAGE_UPLOAD_ACCEPT}
        className="hidden"
        onChange={handleFileChange}
      />

      <div
        className={cn(
          'relative flex h-[120px] w-full flex-col overflow-hidden rounded-[10px] border border-[#e4e8e4] bg-[#f3f5f3]',
          isBusy && 'opacity-80',
        )}
      >
        {hasLocalPreview ? (
          <img src={localPreviewUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : hasRemoteImage ? (
          <AdminMediaImage
            src={imageUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            fallbackClassName="absolute inset-0 h-full w-full"
          />
        ) : null}

        <div
          className={cn(
            'relative z-[1] flex h-full flex-col items-center justify-center gap-2',
            hasImage ? 'bg-gradient-to-t from-black/45 via-black/10 to-transparent p-2' : 'text-[#7c8780]',
          )}
        >
          {!hasImage ? (
            <button
              type="button"
              onClick={handlePick}
              disabled={isBusy}
              className={cn(
                'flex flex-col items-center gap-2 transition hover:text-[#1aa054]',
                isBusy && 'cursor-wait',
              )}
            >
              <Upload size={18} strokeWidth={1.8} />
              <span className="text-[12px] font-medium">
                {isUploading ? 'Uploading…' : 'Upload image'}
              </span>
            </button>
          ) : (
            <div className="mt-auto flex w-full flex-wrap items-center justify-center gap-1.5">
              <button
                type="button"
                disabled={isBusy}
                onClick={() => setPreviewOpen(true)}
                className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-[#17231c] shadow-sm hover:bg-white disabled:opacity-60"
              >
                <Eye size={12} />
                Preview
              </button>
              <button
                type="button"
                disabled={isBusy}
                onClick={handleOpenCrop}
                className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-[#17231c] shadow-sm hover:bg-white disabled:opacity-60"
              >
                <Crop size={12} />
                {loadingCropSource ? 'Loading…' : 'Crop'}
              </button>
              <button
                type="button"
                disabled={isBusy}
                onClick={handlePick}
                className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-[#17231c] shadow-sm hover:bg-white disabled:opacity-60"
              >
                <Upload size={12} />
                {isUploading ? 'Uploading…' : 'Change'}
              </button>
            </div>
          )}
        </div>
      </div>

      {uploadError ? (
        <p className="mt-1.5 text-[11px] text-[#c0392b]">
          {formatApiErrorMessage(uploadError) || 'Upload failed. Try again.'}
        </p>
      ) : null}

      <AdminImageCropModal
        open={cropOpen}
        imageSrc={cropImageSrc}
        aspect={aspect}
        title={`Crop ${label.toLowerCase()}`}
        busy={isUploading}
        onClose={handleCloseCrop}
        onApply={handleCropApply}
      />

      <AdminImagePreviewModal
        open={previewOpen}
        imageSrc={previewSrc}
        title={label}
        onClose={() => setPreviewOpen(false)}
      />
    </label>
  )
}
