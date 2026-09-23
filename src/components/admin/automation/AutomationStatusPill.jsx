import { cn } from '../cn'

export function AutomationStatusPill({ children, tone = 'on', className, showDot = false }) {
  const tones = {
    on: 'bg-[#dcfce7] text-[#15803d]',
    off: 'bg-[#f3f4f6] text-[#6b7280]',
    warn: 'bg-[#fffbeb] text-[#d97706]',
    phase2: 'bg-[#faf5ff] text-[#7c3aed]',
    onTrack: 'bg-[#dcfce7] text-[#15803d]',
    atRisk: 'bg-[#fef9c3] text-[#854d0e]',
    critical: 'bg-[#fee2e2] text-[#991b1b]',
    simulate: 'bg-[#eff6ff] text-[#2563eb] border border-[#bfdbfe]',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-[3px] text-[10.5px] font-semibold',
        tones[tone] || tones.on,
        className,
      )}
    >
      {showDot ? <span className="h-[5px] w-[5px] rounded-full bg-current" aria-hidden /> : null}
      {children}
    </span>
  )
}
