import { cn } from '../cn'

const tones = {
  green: {
    shell: 'bg-[#f0fdf4] border-l-[#1D6A33]',
    label: 'text-[#1D6A33]',
  },
  red: {
    shell: 'bg-[#fef2f2] border-l-[#dc2626]',
    label: 'text-[#dc2626]',
  },
  blue: {
    shell: 'bg-[#eff6ff] border-l-[#2563eb]',
    label: 'text-[#2563eb]',
  },
  amber: {
    shell: 'bg-[#fffbeb] border-l-[#d97706]',
    label: 'text-[#d97706]',
  },
}

export function AutomationCallout({ tone = 'green', label, children, className }) {
  const t = tones[tone] || tones.green
  return (
    <div className={cn('mx-5 my-4 rounded-r-md border-l-[3px] px-4 py-3', t.shell, className)}>
      {label ? (
        <div className={cn('mb-1 text-[9px] font-bold uppercase tracking-[0.1em]', t.label)}>{label}</div>
      ) : null}
      <div className="text-[12px] leading-relaxed text-[#111827]">{children}</div>
    </div>
  )
}
