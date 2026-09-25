/**
 * Store-type item-class convert modal (OG §03 / D05 Batch 4).
 * Never convert silently — show vendor + item counts before Confirm.
 */

/**
 * @param {{
 *   open: boolean
 *   storeTypeName?: string
 *   disable: 'NORMAL' | 'SPECIAL' | null
 *   preview: { vendorCount?: number, itemCount?: number, categoryCount?: number, convertAction?: string } | null
 *   previewLoading: boolean
 *   previewError: string | null
 *   choice: 'convert' | 'cancel_change'
 *   confirming?: boolean
 *   onChoiceChange: (choice: 'convert' | 'cancel_change') => void
 *   onCancel: () => void
 *   onConfirm: () => void
 * }} props
 */
export default function AdminItemClassConvertModal({
  open,
  storeTypeName = 'this store type',
  disable,
  preview,
  previewLoading,
  previewError,
  choice,
  confirming = false,
  onChoiceChange,
  onCancel,
  onConfirm,
}) {
  if (!open) return null

  const classLabel = disable === 'NORMAL' ? 'Normal' : 'Special'
  const remainingLabel = disable === 'NORMAL' ? 'Special' : 'Normal'
  const vendorCount = preview?.vendorCount ?? 0
  const itemCount = preview?.itemCount ?? 0
  const typeLabel = storeTypeName || 'this store type'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="item-class-convert-title"
        className="w-full max-w-[520px] rounded-[14px] border border-[#eceeec] bg-white shadow-[0_8px_30px_rgba(20,40,28,.18)]"
      >
        <div className="border-b border-[#eceeec] px-5 py-4">
          <h4 id="item-class-convert-title" className="text-[15px] font-bold text-[#17231c]">
            Turning off {classLabel} items for {typeLabel}
          </h4>
        </div>

        <div className="space-y-3 px-5 py-4 text-[13px] leading-[18px] text-[#5c665f]">
          {previewLoading ? <p>Loading convert impact…</p> : null}

          {previewError ? (
            <p className="rounded-[8px] border border-[#f5c2c0] bg-[#fdecea] px-3 py-2 text-[12px] text-[#b42318]">
              {previewError}
            </p>
          ) : null}

          {!previewLoading && !previewError ? (
            <p>
              <strong className="font-semibold text-[#17231c]">
                {vendorCount} vendor{vendorCount === 1 ? '' : 's'}
              </strong>{' '}
              under this store type would be affected, covering{' '}
              <strong className="font-semibold text-[#17231c]">
                {itemCount} item{itemCount === 1 ? '' : 's'}
              </strong>
              . {classLabel} will no longer be available for this type.
            </p>
          ) : null}

          <button
            type="button"
            disabled={previewLoading || confirming}
            onClick={() => onChoiceChange('convert')}
            className={`w-full rounded-[10px] border px-4 py-3 text-left transition ${
              choice === 'convert'
                ? 'border-[#2E9E4D] bg-[#e8f7ed]'
                : 'border-[#eceeec] bg-white hover:bg-[#f7f8f7]'
            }`}
          >
            <span className="block text-[13px] font-bold text-[#17231c]">
              Convert them to {remainingLabel}
            </span>
            <span className="mt-0.5 block text-[12px] leading-[16px] text-[#7c8780]">
              All affected vendors, categories and items move to {remainingLabel} and are locked
              there.
            </span>
          </button>

          <button
            type="button"
            disabled={previewLoading || confirming}
            onClick={() => onChoiceChange('cancel_change')}
            className={`w-full rounded-[10px] border px-4 py-3 text-left transition ${
              choice === 'cancel_change'
                ? 'border-[#2E9E4D] bg-[#e8f7ed]'
                : 'border-[#eceeec] bg-white hover:bg-[#f7f8f7]'
            }`}
          >
            <span className="block text-[13px] font-bold text-[#17231c]">Cancel the change</span>
            <span className="mt-0.5 block text-[12px] leading-[16px] text-[#7c8780]">
              Nothing is modified. Review the {vendorCount} vendor
              {vendorCount === 1 ? '' : 's'} first.
            </span>
          </button>
        </div>

        <div className="flex justify-end gap-2 border-t border-[#eceeec] px-5 py-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={confirming}
            className="inline-flex h-[34px] items-center rounded-full border border-[rgba(0,0,0,0.1)] bg-white px-4 text-[12px] font-bold text-[#5c665f] hover:bg-[#f7f8f7] disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={previewLoading || Boolean(previewError) || confirming || !choice}
            className="inline-flex h-[34px] items-center rounded-full bg-[#2E9E4D] px-4 text-[12px] font-bold text-white hover:bg-[#158a47] disabled:opacity-60"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}
