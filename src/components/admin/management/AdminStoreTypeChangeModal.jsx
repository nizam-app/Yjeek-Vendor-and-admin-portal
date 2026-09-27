/**
 * Store type changed confirm modal (OG §10 / D02 Batch 6).
 * Two explicit options — never silent overwrite.
 */
import { BRANCH_DELIVERY_MODE_LABELS } from './AdminBranchDeliverySettings'

const MODE_LABEL = {
  ...BRANCH_DELIVERY_MODE_LABELS,
}

function formatModesRemoved(modesRemoved = []) {
  if (!Array.isArray(modesRemoved) || modesRemoved.length === 0) return null
  return modesRemoved.map((key) => MODE_LABEL[key] || key).join(', ')
}

/**
 * @param {{
 *   open: boolean
 *   fromName: string
 *   toName: string
 *   preview: { overriddenFieldCount?: number, modesRemoved?: string[] } | null
 *   previewLoading: boolean
 *   previewError: string | null
 *   choice: 'load_defaults' | 'keep_current'
 *   confirming: boolean
 *   onChoiceChange: (choice: 'load_defaults' | 'keep_current') => void
 *   onCancel: () => void
 *   onConfirm: () => void
 * }} props
 */
export default function AdminStoreTypeChangeModal({
  open,
  fromName,
  toName,
  preview,
  previewLoading,
  previewError,
  choice,
  confirming,
  onChoiceChange,
  onCancel,
  onConfirm,
}) {
  if (!open) return null

  const overrideCount = preview?.overriddenFieldCount ?? 0
  const modesLabel = formatModesRemoved(preview?.modesRemoved)
  const fromLabel = fromName || 'Current type'
  const toLabel = toName || 'New type'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="store-type-change-title"
        className="w-full max-w-[520px] rounded-[14px] border border-[#eceeec] bg-white shadow-[0_8px_30px_rgba(20,40,28,.18)]"
      >
        <div className="border-b border-[#eceeec] px-5 py-4">
          <h4 id="store-type-change-title" className="text-[15px] font-bold text-[#17231c]">
            Store type changed — {fromLabel} → {toLabel}
          </h4>
        </div>

        <div className="space-y-3 px-5 py-4 text-[13px] leading-[18px] text-[#5c665f]">
          {previewLoading ? (
            <p>Loading delivery settings impact…</p>
          ) : null}

          {previewError ? (
            <p className="rounded-[8px] border border-[#f5c2c0] bg-[#fdecea] px-3 py-2 text-[12px] text-[#b42318]">
              {previewError}
            </p>
          ) : null}

          {!previewLoading && !previewError ? (
            <>
              <p>
                {toLabel} uses a different set of delivery settings. This vendor currently has{' '}
                <strong className="font-semibold text-[#17231c]">
                  {overrideCount} overridden field{overrideCount === 1 ? '' : 's'}
                </strong>{' '}
                that were edited by hand.
              </p>
              {modesLabel ? (
                <p>
                  {toLabel} does not support{' '}
                  <strong className="font-semibold text-[#17231c]">{modesLabel}</strong>. That
                  toggle will disappear and its panel will be hidden — its values are kept in case
                  the store type is changed back.
                </p>
              ) : null}
            </>
          ) : null}

          <button
            type="button"
            disabled={previewLoading || confirming}
            onClick={() => onChoiceChange('load_defaults')}
            className={`w-full rounded-[10px] border px-4 py-3 text-left transition ${
              choice === 'load_defaults'
                ? 'border-[#2E9E4D] bg-[#e8f7ed]'
                : 'border-[#eceeec] bg-white hover:bg-[#f7f8f7]'
            }`}
          >
            <span className="block text-[13px] font-bold text-[#17231c]">
              Load {toLabel} settings
            </span>
            <span className="mt-0.5 block text-[12px] leading-[16px] text-[#7c8780]">
              Replaces every delivery and fee field with the {toLabel} defaults
              {overrideCount > 0
                ? `. Your ${overrideCount} override${overrideCount === 1 ? '' : 's'} will be lost.`
                : '.'}
            </span>
          </button>

          <button
            type="button"
            disabled={previewLoading || confirming}
            onClick={() => onChoiceChange('keep_current')}
            className={`w-full rounded-[10px] border px-4 py-3 text-left transition ${
              choice === 'keep_current'
                ? 'border-[#2E9E4D] bg-[#e8f7ed]'
                : 'border-[#eceeec] bg-white hover:bg-[#f7f8f7]'
            }`}
          >
            <span className="block text-[13px] font-bold text-[#17231c]">Keep current values</span>
            <span className="mt-0.5 block text-[12px] leading-[16px] text-[#7c8780]">
              The store type changes, but all delivery and fee fields stay exactly as they are now.
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
            {confirming ? 'Saving…' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}
