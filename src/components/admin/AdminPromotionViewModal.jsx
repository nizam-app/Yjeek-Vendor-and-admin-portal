import { Badge } from './Badge'

const detailRows = (promo) => [
  ['Type', promo.detailType || promo.type],
  ['Discount cap', promo.discountCap || '—'],
  ['Min order', promo.minOrder || '—'],
  ['Scope', promo.detailScope || promo.scope],
  ['Period', promo.detailPeriod || promo.period],
  ['Eligibility', promo.eligibility || '—'],
  ['Used', promo.usedLabel || String(promo.used ?? '—')],
  ['Status', promo.status],
]

export default function AdminPromotionViewModal({
  open,
  promotion,
  onClose,
}) {
  if (!open || !promotion) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close promotion details"
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="promotion-view-title"
        className="relative w-full max-w-[460px] overflow-hidden rounded-[14px] bg-white shadow-[0_12px_40px_rgba(20,40,28,.18)]"
      >
        <div className="flex items-center gap-2.5 px-5 pt-5">
          <h2
            id="promotion-view-title"
            className="min-w-0 text-[16px] font-bold tracking-[-0.02em] text-[#17231c]"
          >
            {promotion.name}
          </h2>
          <Badge tone={promotion.status === 'Active' ? 'green' : promotion.status === 'Scheduled' ? 'yellow' : 'gray'}>
            {promotion.status}
          </Badge>
        </div>

        <div className="mt-4 px-5">
          {detailRows(promotion).map(([label, value]) => (
            <div
              key={label}
              className="flex items-start justify-between gap-6 border-b border-[#f0f2f0] py-3 last:border-0"
            >
              <span className="shrink-0 text-[12.5px] text-[#7c8780]">{label}</span>
              <span className="text-right text-[13px] font-medium text-[#17231c]">{value}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-[36px] items-center rounded-full border border-[#e4e8e4] bg-white px-4 text-[13px] font-medium text-[#17231c] hover:bg-[#f6f8f6]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
