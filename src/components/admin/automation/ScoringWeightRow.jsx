import { cn } from '../cn'

/** Scoring weight row — editable percent when onChange provided; otherwise display-only. */
export function ScoringWeightRow({
  label,
  labelSuffix,
  percent,
  note,
  barTone = 'green',
  editable = false,
  onChange,
  disabled = false,
}) {
  const value = Math.max(0, Math.min(100, Number(percent) || 0))

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
          style={{ width: `${value}%` }}
        />
      </div>
      {editable ? (
        <div className="flex w-[72px] shrink-0 items-center justify-end gap-0.5">
          <input
            type="number"
            min={0}
            max={100}
            step={1}
            disabled={disabled}
            value={Number.isFinite(Number(percent)) ? Number(percent) : 0}
            onChange={(e) => {
              const raw = e.target.value
              if (raw === '') {
                onChange?.(0)
                return
              }
              const next = Math.max(0, Math.min(100, Math.round(Number(raw))))
              if (Number.isFinite(next)) onChange?.(next)
            }}
            className="h-7 w-12 rounded border border-[#d1d5db] bg-white px-1.5 text-right text-[12.5px] font-bold text-[#1D6A33] outline-none focus:border-[#1D6A33] disabled:bg-[#f3f4f6] disabled:text-[#9ca3af]"
            aria-label={`${label} weight percent`}
          />
          <span className="text-[12px] font-bold text-[#1D6A33]">%</span>
        </div>
      ) : (
        <div
          className={cn(
            'w-9 shrink-0 text-right text-[12.5px] font-bold',
            barTone === 'muted' ? 'text-[#6b7280]' : 'text-[#1D6A33]',
          )}
        >
          {value}%
        </div>
      )}
      <div className="w-full text-[11px] text-[#9ca3af] min-[900px]:w-[220px] min-[900px]:shrink-0">
        {note}
      </div>
    </div>
  )
}
