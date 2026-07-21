import { cn } from '../cn'

export function OperationsViewTabs({ view, onViewChange }) {
  return ['Pipeline', 'Board', 'Calendar'].map((item) => (
    <button
      key={item}
      onClick={() => onViewChange(item)}
      className={cn(
        'h-[29px] rounded-md border px-3 text-[10px] font-medium',
        view === item ? 'border-[#17231c] bg-[#17231c] text-white' : 'border-[#dfe4e0] bg-white text-[#69756d]',
      )}
    >
      {item}
    </button>
  ))
}
