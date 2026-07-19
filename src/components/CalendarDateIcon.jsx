function getTodayParts(date = new Date()) {
  return {
    month: date.toLocaleString('en-US', { month: 'short' }).toUpperCase(),
    day: String(date.getDate()),
  }
}

export function CalendarDateIcon({ month, day, className = '' }) {
  const today = getTodayParts()
  const monthLabel = month ?? today.month
  const dayLabel = day ?? today.day

  return (
    <span
      className={`relative inline-flex h-4 w-4 shrink-0 flex-col overflow-hidden rounded-[2px] ${className}`}
      aria-hidden="true"
    >
      <span className="absolute top-0 left-[2px] z-10 h-[2px] w-[2px] rounded-full bg-white" />
      <span className="absolute top-0 right-[2px] z-10 h-[2px] w-[2px] rounded-full bg-white" />

      <span className="flex h-[5px] shrink-0 items-end bg-[#b86a6a] px-[2px] pb-px">
        <span className="text-[9px] font-bold uppercase leading-none text-white">{monthLabel}</span>
      </span>

      <span className="flex min-h-0 flex-1 items-center justify-center bg-[#e6e6e6]">
        <span className="text-[9px] font-bold leading-none text-[#333333]">{dayLabel}</span>
      </span>
    </span>
  )
}
