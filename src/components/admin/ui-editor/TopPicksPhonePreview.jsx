import { Package } from 'lucide-react'
import AdminMediaImage from '../AdminMediaImage'
import { cn } from '../cn'

export function formatTopPickBhd(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '0.000'
  return n.toFixed(3)
}

function TopPickCard({ item, branchName, compact = false }) {
  const priceLabel = `BHD ${formatTopPickBhd(item.price)}`

  return (
    <div
      className={cn(
        'shrink-0 overflow-hidden rounded-[12px] border border-[#cfe8d1] bg-white',
        'shadow-[0_6px_16px_rgba(22,54,32,0.1)]',
        compact ? 'w-[100px]' : 'w-[112px]',
      )}
    >
      {item.imageUrl ? (
        <AdminMediaImage
          src={item.imageUrl}
          className={cn('w-full object-cover', compact ? 'h-[72px]' : 'h-[80px]')}
          fallbackClassName={cn('w-full bg-[#eceeec]', compact ? 'h-[72px]' : 'h-[80px]')}
          iconSize={16}
        />
      ) : (
        <div
          className={cn(
            'grid w-full place-items-center bg-gradient-to-br from-[#eef5ef] to-[#e2ebe3] text-[#8a948e]',
            compact ? 'h-[72px]' : 'h-[80px]',
          )}
        >
          <Package size={18} strokeWidth={1.75} />
        </div>
      )}
      <div className="space-y-0.5 p-2">
        <p className="line-clamp-2 text-[10px] font-bold leading-tight text-[#17231c]">
          {item.name || 'Menu item'}
        </p>
        <p className="text-[10.5px] font-extrabold tracking-tight text-[#0d7a32]">{priceLabel}</p>
        {branchName ? (
          <p className="truncate text-[8.5px] font-medium text-[#8a948e]">{branchName}</p>
        ) : null}
      </div>
    </div>
  )
}

/** Inline block for customer home preview (banners tab + top picks tab). */
export function TopPicksHomeSection({
  items = [],
  isActive = true,
  highlight = false,
  branchName,
  onConfigure,
}) {
  const visible = items.filter((item) => item.isActive !== false)
  const interactive = typeof onConfigure === 'function'

  const shellClass = cn(
    'w-full text-left',
    interactive && 'cursor-pointer rounded-[10px] transition hover:opacity-95',
    highlight && 'rounded-[10px] ring-2 ring-[#e53935] ring-offset-1',
  )

  const inner = !isActive ? (
    <div className="rounded-[10px] border border-dashed border-[#cfd6d1] bg-[#f5f6f5] px-3 py-2.5 text-center text-[10px] font-medium text-[#8a948e]">
      Inactive for preview branch — tap to configure
    </div>
  ) : visible.length > 0 ? (
    <div className="space-y-2">
      <div className="flex gap-2.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {visible.slice(0, 8).map((item) => (
          <TopPickCard
            key={item.id || item.productId}
            item={item}
            branchName={visible.length === 1 ? '' : branchName}
            compact
          />
        ))}
      </div>
      {interactive ? (
        <p className="text-center text-[10px] font-medium text-[#66a06a]">Tap to edit Top picks</p>
      ) : null}
    </div>
  ) : (
    <div
      className={cn(
        'flex w-full flex-col items-center justify-center rounded-[12px] border border-dashed border-[#81c784] bg-gradient-to-b from-[#f1f8f2] to-[#e8f5e9]/80 px-2 py-4 text-center',
        interactive && 'hover:from-[#eaf6ec] hover:to-[#e8f5e9]',
      )}
    >
      <span className="text-[12px] font-bold text-[#2e7d32]">+ Add menu items here</span>
      <span className="mt-0.5 text-[10px] font-medium text-[#66a06a]">Top picks near you</span>
    </div>
  )

  if (interactive) {
    return (
      <button type="button" onClick={onConfigure} className={shellClass}>
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <p className="text-[12px] font-bold text-[#17231c]">Top picks near you</p>
          {branchName ? (
            <span className="truncate text-[9px] font-medium text-[#8a948e]">{branchName}</span>
          ) : null}
        </div>
        {inner}
      </button>
    )
  }

  return (
    <div className={shellClass}>
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <p className="text-[12px] font-bold text-[#17231c]">Top picks near you</p>
        {branchName ? (
          <span className="truncate text-[9px] font-medium text-[#8a948e]">{branchName}</span>
        ) : null}
      </div>
      {inner}
    </div>
  )
}

export default function TopPicksPhonePreview({ items = [], isActive = true, branchName }) {
  return (
    <div className="mx-auto w-full max-w-[280px]">
      <div className="overflow-hidden rounded-[28px] border-[5px] border-[#1a1a1a] bg-white shadow-[0_12px_32px_rgba(20,40,28,.12)]">
        <div className="flex items-center justify-between bg-[#f7f8f7] px-4 py-2 text-[11px] font-semibold text-[#17231c]">
          <span>9:41</span>
          <span className="font-bold tracking-wide">Yjeek</span>
          <span className="inline-flex items-center gap-0.5 text-[10px]">
            <span className="h-[7px] w-[7px] rounded-full bg-[#17231c]/30" />
            <span className="h-[7px] w-[7px] rounded-full bg-[#17231c]/55" />
            <span className="h-[7px] w-[10px] rounded-[2px] bg-[#17231c]/80" />
          </span>
        </div>
        <div className="space-y-3 bg-[#fafbfa] p-3">
          <div className="grid grid-cols-4 gap-2 opacity-40">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="flex flex-col items-center gap-1">
                <div className="h-10 w-10 rounded-[12px] bg-[#e8f5e9]" />
                <span className="h-2 w-8 rounded bg-[#eceeec]" />
              </div>
            ))}
          </div>
          <TopPicksHomeSection
            items={items}
            isActive={isActive}
            highlight
            branchName={branchName}
            onConfigure={undefined}
          />
        </div>
      </div>
    </div>
  )
}
