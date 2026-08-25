import { useEffect, useState } from 'react'
import { Minus, Plus, X, ZoomIn, ZoomOut } from 'lucide-react'
import AdminMediaImage from './AdminMediaImage'
import { cn } from './cn'

export default function AdminImagePreviewModal({ open, imageSrc, title = 'Image preview', onClose }) {
  const [zoom, setZoom] = useState(1)

  useEffect(() => {
    if (open) setZoom(1)
  }, [open, imageSrc])

  if (!open || !imageSrc) return null

  const isRemoteUrl = /^https?:\/\//i.test(String(imageSrc)) || String(imageSrc).startsWith('/uploads')

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close preview"
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative flex max-h-[90vh] w-full max-w-[720px] flex-col overflow-hidden rounded-[16px] bg-white shadow-[0_18px_44px_rgba(0,0,0,0.32)]"
      >
        <div className="flex items-center justify-between border-b border-[#eceeec] px-4 py-3">
          <h3 className="text-[15px] font-bold text-[#17231c]">{title}</h3>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full text-[#637068] hover:bg-[#f3f5f3]"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex min-h-[240px] flex-1 items-center justify-center overflow-auto bg-[#f3f5f3] p-4">
          <div
            className="transition-transform duration-150"
            style={{ transform: `scale(${zoom})` }}
          >
            {isRemoteUrl && !String(imageSrc).startsWith('blob:') ? (
              <AdminMediaImage
                src={imageSrc}
                alt=""
                className="max-h-[60vh] max-w-full object-contain"
              />
            ) : (
              <img
                src={imageSrc}
                alt=""
                className="max-h-[60vh] max-w-full object-contain"
              />
            )}
          </div>
        </div>

        <div className="border-t border-[#eceeec] px-4 py-3">
          <div className="flex items-center justify-center gap-3">
            <ZoomOut size={16} className="shrink-0 text-[#7c8780]" />
            <input
              type="range"
              min={0.5}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
              className="h-1.5 w-full max-w-[280px] cursor-pointer accent-[#1aa054]"
              aria-label="Preview zoom"
            />
            <ZoomIn size={16} className="shrink-0 text-[#7c8780]" />
          </div>
          <div className="mt-2 flex items-center justify-center gap-2">
            <button
              type="button"
              disabled={zoom <= 0.5}
              onClick={() => setZoom((value) => Math.max(0.5, value - 0.1))}
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
              disabled={zoom >= 3}
              onClick={() => setZoom((value) => Math.min(3, value + 0.1))}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#d5dbd6] text-[#455249] hover:bg-[#f7f9f7] disabled:opacity-40"
              aria-label="Zoom in"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>

        <div className="flex justify-end border-t border-[#eceeec] px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className={cn(
              'inline-flex h-[36px] items-center rounded-full bg-[#1aa054] px-4 text-[12.5px] font-bold text-white hover:bg-[#158a47]',
            )}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
