import { cn } from '../cn'

export function OperationsViewTabs({ view, onViewChange, className }) {
  return (
    <div
      className={cn('flex flex-wrap items-center gap-2 pt-0.5 pb-0.5', className)}
      role="tablist"
      aria-label="Scheduled view"
    >
      {['Pipeline', 'Board', 'Calendar'].map((item) => (
        <button
          key={item}
          type="button"
          role="tab"
          aria-selected={view === item}
          onClick={() => onViewChange(item)}
          className={cn(
            'h-[31px] rounded-md border px-3.5 text-[10px] font-medium',
            view === item ? 'border-[#17231c] bg-[#17231c] text-white' : 'border-[#dfe4e0] bg-white text-[#17231c]',
          )}
        >
          {item}
        </button>
      ))}
    </div>
  )
}
