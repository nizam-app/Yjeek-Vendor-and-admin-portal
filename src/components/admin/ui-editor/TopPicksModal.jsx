import { X } from 'lucide-react'
import TopPicksEditor from './TopPicksEditor'

export default function TopPicksModal({ open, onClose, onMessage, onPreviewChange }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">
      <button
        type="button"
        className="absolute inset-0 bg-[rgba(26,28,26,0.5)]"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative flex max-h-[92vh] w-full max-w-[640px] flex-col overflow-hidden rounded-[16px] bg-white shadow-[0_18px_40px_rgba(26,28,26,0.2)]">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#eceeec] px-4 py-3">
          <div>
            <h3 className="text-[16px] font-bold text-[#17231c]">Top picks near you</h3>
            <p className="text-[12px] text-[#7c8780]">Per branch · menu items, order, radius & visibility</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-[8px] text-[#8a948e] hover:bg-[#f7f9f7]"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
        <div className="overflow-y-auto px-4 py-4">
          <TopPicksEditor onMessage={onMessage} onPreviewChange={onPreviewChange} />
        </div>
      </div>
    </div>
  )
}
