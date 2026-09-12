import { cn } from '../cn'

/** Display-only scoring weight row (locked 40/30/20/10 — no free sliders). */
export function ScoringWeightRow({ label, labelSuffix, percent, note, barTone = 'green' }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-[#e5e7eb] px-5 py-3 last:border-b-0 min-[900px]:flex-nowrap">
      <div
        className={cn(
          'min-w-[160px] shrink-0 text-[13px] font-medium sm:min-w-[200px]',
          barTone === 'muted' ? 'text-[#6b7280]' : 'text-[#d97706]',
        )}
      >
        {label}
        {labelSuffix ? (
          <span className="ml-1 text-[10px] font-normal text-[#9ca3af]">{labelSuffix}</span>
        ) : null}
      </div>
      <div className="relative h-1.5 min-w-[120px] flex-1 overflow-hidden rounded-sm bg-[#e5e7eb]">
        <div
          className={cn(
            'h-full rounded-sm',
            barTone === 'muted' ? 'bg-[#9ca3af]' : 'bg-[#1D6A33]',
          )}
          style={{ width: `${Math.max(0, Math.min(100, percent))}%` }}
        />
      </div>
      <div
        className={cn(
          'w-9 shrink-0 text-right text-[12.5px] font-bold',
          barTone === 'muted' ? 'text-[#6b7280]' : 'text-[#1D6A33]',
        )}
      >
        {percent}%
      </div>
      <div className="w-full text-[11px] text-[#9ca3af] min-[900px]:w-[220px] min-[900px]:shrink-0">
        {note}
      </div>
    </div>
  )
}
