import { useCallback, useEffect, useState } from 'react'
import Cropper from 'react-easy-crop'
import { Minus, Plus, X, ZoomIn, ZoomOut } from 'lucide-react'
import { getCroppedImageBlob } from '../../utils/cropImage'
import { cn } from './cn'

export default function AdminImageCropModal({
  open,
  imageSrc,
  aspect = 1,
  title = 'Crop image',
  busy = false,
  onClose,
  onApply,
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
  const [error, setError] = useState(null)
  const [applying, setApplying] = useState(false)

  const onCropComplete = useCallback((_croppedArea, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels)
  }, [])

  useEffect(() => {
    if (!open) return
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setCroppedAreaPixels(null)
    setError(null)
  }, [open, imageSrc])

  const handleApply = async () => {
    if (!imageSrc || !croppedAreaPixels || applying || busy) return

    setError(null)
    setApplying(true)
    try {
      const blob = await getCroppedImageBlob(imageSrc, croppedAreaPixels)
      const ext = blob.type === 'image/png' ? 'png' : blob.type === 'image/webp' ? 'webp' : 'jpg'
      const file = new File([blob], `cropped.${ext}`, { type: blob.type })
      await onApply?.(file)
      onClose?.()
    } catch (err) {
      setError(err?.message || 'Failed to crop image.')
    } finally {
      setApplying(false)
    }
  }

  if (!open || !imageSrc) return null

  const isBusy = busy || applying

  return (
    <div className="fixed inset-0 z-[150] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Close crop editor"
        className="absolute inset-0 bg-black/50"
        disabled={isBusy}
        onClick={() => !isBusy && onClose?.()}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative flex w-full max-w-[560px] flex-col overflow-hidden rounded-t-[16px] bg-white shadow-[0_18px_44px_rgba(0,0,0,0.28)] sm:rounded-[16px]"
      >
        <div className="flex items-center justify-between border-b border-[#eceeec] px-4 py-3">
          <h3 className="text-[15px] font-bold text-[#17231c]">{title}</h3>
          <button
            type="button"
            aria-label="Close"
            disabled={isBusy}
            onClick={() => onClose?.()}
            className="grid h-8 w-8 place-items-center rounded-full text-[#637068] hover:bg-[#f3f5f3] disabled:opacity-60"
          >
            <X size={18} />
          </button>
        </div>

        <div className="relative h-[280px] bg-[#1a1f1c] sm:h-[320px]">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            objectFit="contain"
          />
        </div>

        <div className="border-t border-[#eceeec] px-4 py-3">
          <div className="flex items-center gap-3">
            <ZoomOut size={16} className="shrink-0 text-[#7c8780]" />
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              disabled={isBusy}
              onChange={(event) => setZoom(Number(event.target.value))}
              className="h-1.5 w-full cursor-pointer accent-[#1aa054]"
              aria-label="Zoom"
            />
            <ZoomIn size={16} className="shrink-0 text-[#7c8780]" />
          </div>
          <div className="mt-2 flex items-center justify-center gap-2">
            <button
              type="button"
              disabled={isBusy || zoom <= 1}
              onClick={() => setZoom((value) => Math.max(1, value - 0.1))}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#d5dbd6] text-[#455249] hover:bg-[#f7f9f7] disabled:opacity-40"
              aria-label="Zoom out"
            >
              <Minus size={14} />
            </button>
            <span className="min-w-[48px] text-center text-[11px] font-medium text-[#7c8780]">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              disabled={isBusy || zoom >= 3}
              onClick={() => setZoom((value) => Math.min(3, value + 0.1))}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#d5dbd6] text-[#455249] hover:bg-[#f7f9f7] disabled:opacity-40"
              aria-label="Zoom in"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>

        {error ? (
          <p className="px-4 pb-2 text-[12px] text-[#c0392b]">{error}</p>
        ) : null}

        <div className="flex justify-end gap-2 border-t border-[#eceeec] px-4 py-3">
          <button
            type="button"
            disabled={isBusy}
            onClick={() => onClose?.()}
            className="inline-flex h-[36px] items-center rounded-full border border-[#d5dbd6] px-4 text-[12.5px] font-bold text-[#455249] hover:bg-[#f7f9f7] disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isBusy || !croppedAreaPixels}
            onClick={handleApply}
            className={cn(
              'inline-flex h-[36px] items-center rounded-full bg-[#1aa054] px-4 text-[12.5px] font-bold text-white hover:bg-[#158a47] disabled:opacity-60',
              isBusy && 'cursor-wait',
            )}
          >
            {isBusy ? 'Applying…' : 'Apply crop'}
          </button>
        </div>
      </div>
    </div>
  )
}
