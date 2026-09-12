import { cn } from '../cn'

const toneStyles = {
  s1: {
    cell: 'bg-[#f0fdf4]',
    km: 'text-[#15803d]',
    alert: 'bg-[#dcfce7] text-[#15803d]',
  },
  s2: {
    cell: 'bg-[#fefce8]',
    km: 'text-[#d97706]',
    alert: 'bg-[#fef9c3] text-[#854d0e]',
  },
  s3: {
    cell: 'bg-[#fff7ed]',
    km: 'text-[#ea580c]',
    alert: 'bg-[#ffedd5] text-[#9a3412]',
  },
  s4: {
    cell: 'bg-[#fef2f2]',
    km: 'text-[#dc2626]',
    alert: 'bg-[#fee2e2] text-[#991b1b]',
  },
}

/** Visual-only four-stage radius escalation chain. */
export function RadiusEscalationStageChain({ stages }) {
  return (
    <div className="mb-5 overflow-hidden rounded-[10px] border border-[#e5e7eb] bg-white">
      <div className="grid grid-cols-1 min-[900px]:grid-cols-4">
        {stages.map((stage, index) => {
          const t = toneStyles[stage.tone] || toneStyles.s1
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
              <div className={cn('mb-1 text-[22px] font-extrabold leading-none', t.km)}>
                {stage.displayValue}
              </div>
              <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.07em] text-[#6b7280]">
                {stage.name}
              </div>
              <p className="text-[11.5px] leading-snug text-[#6b7280]">{stage.detail}</p>
              <span
                className={cn(
                  'mt-1.5 inline-block rounded-[10px] px-2 py-0.5 text-[9.5px] font-bold',
                  t.alert,
                )}
              >
                {stage.alert}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
