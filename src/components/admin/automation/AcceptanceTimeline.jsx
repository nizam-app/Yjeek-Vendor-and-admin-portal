import { cn } from '../cn'

const toneStyles = {
  green: {
    cell: 'bg-[#f0fdf4]',
    time: 'text-[#15803d]',
    badge: 'bg-[#dcfce7] text-[#15803d]',
  },
  yellow: {
    cell: 'bg-[#fefce8]',
    time: 'text-[#d97706]',
    badge: 'bg-[#fef9c3] text-[#854d0e]',
  },
  orange: {
    cell: 'bg-[#fff7ed]',
    time: 'text-[#ea580c]',
    badge: 'bg-[#ffedd5] text-[#9a3412]',
  },
  red: {
    cell: 'bg-[#fef2f2]',
    time: 'text-[#dc2626]',
    badge: 'bg-[#fee2e2] text-[#991b1b]',
  },
}

/** Visual-only vendor acceptance timeline (no live timers). */
export function AcceptanceTimeline({ stages }) {
  return (
    <div className="grid grid-cols-1 border-t border-[#e5e7eb] min-[900px]:grid-cols-4">
      {stages.map((stage, index) => {
        const t = toneStyles[stage.tone] || toneStyles.green
        return (
          <div
            key={stage.id}
            className={cn(
              'px-[18px] py-4',
              t.cell,
              index < stages.length - 1 && 'min-[900px]:border-r min-[900px]:border-[#e5e7eb]',
              index < stages.length - 1 && 'border-b border-[#e5e7eb] min-[900px]:border-b-0',
            )}
          >
            <div className={cn('mb-1 text-[18px] font-extrabold leading-none', t.time)}>{stage.time}</div>
            <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.07em] text-[#6b7280]">
              {stage.title}
            </div>
            <p className="text-[11.5px] leading-snug text-[#6b7280]">{stage.body}</p>
            <span
              className={cn(
                'mt-1.5 inline-block rounded-[10px] px-2 py-0.5 text-[9.5px] font-bold',
                t.badge,
              )}
            >
              {stage.badge}
            </span>
          </div>
        )
      })}
    </div>
  )
}
