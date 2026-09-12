import { cn } from '../cn'
import { AutomationStatusPill } from './AutomationStatusPill'

/** Colored status header card used by Champ Status reference sections. */
export function ChampStatusSectionCard({
  title,
  titleNote,
  subtitle,
  headerBg,
  titleColor,
  dotColor,
  stackedAccent = false,
  badge,
  badgeTone,
  badgeClassName,
  children,
  className,
}) {
  return (
    <section
      className={cn(
        'mb-5 overflow-hidden rounded-[10px] border border-[#e5e7eb] bg-white',
        className,
      )}
    >
      <div
        className="flex flex-wrap items-center gap-3 border-b border-[#e5e7eb] px-5 py-4"
        style={{ background: headerBg || '#fff' }}
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span className="relative h-3 w-3 shrink-0 rounded-full" style={{ background: dotColor }}>
            {stackedAccent ? (
              <span
                className="absolute -right-[3px] -top-[3px] h-2 w-2 rounded-full border-[1.5px] border-white bg-[#f59e0b]"
                aria-hidden
              />
            ) : null}
          </span>
          <div className="min-w-0">
            <h3 className="text-[14px] font-bold" style={{ color: titleColor || '#111827' }}>
              {title}
              {titleNote ? (
                <span className="ml-1.5 text-[12px] font-normal text-[#6b7280]">{titleNote}</span>
              ) : null}
            </h3>
            {subtitle ? <p className="mt-0.5 text-[11.5px] text-[#6b7280]">{subtitle}</p> : null}
          </div>
        </div>
        {badge ? (
          <AutomationStatusPill tone={badgeTone || 'on'} className={badgeClassName}>
            {badge}
          </AutomationStatusPill>
        ) : null}
      </div>
      {children}
    </section>
  )
}

export function ChampStatusSchemaCode({ children, tone = 'neutral' }) {
  const tones = {
    neutral: 'bg-[#f3f4f6] text-[#111827]',
    computed: 'bg-[#dbeafe] text-[#1d4ed8]',
    danger: 'bg-[#fee2e2] text-[#991b1b]',
  }
  return (
    <code
      className={cn(
        'inline-block max-w-full break-all rounded-[5px] px-2 py-[3px] text-[11px] leading-snug',
        tones[tone] || tones.neutral,
      )}
    >
      {children}
    </code>
  )
}

export function ChampStatusDisplayTable({ rows }) {
  return (
    <div className="w-full max-w-full overflow-x-auto overscroll-x-contain">
      <table className="w-full min-w-[760px] border-collapse text-left">
        <thead>
          <tr className="bg-[#f9fafb]">
            {[
              'champ.status (stored)',
              'champ.active_orders (stored)',
              'Display label (computed)',
              'Load multiplier',
              'Eligible for more offers?',
            ].map((column) => (
              <th
                key={column}
                className="border-b border-[#e5e7eb] px-3.5 py-2.5 text-[11px] font-semibold text-[#6b7280]"
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.orders}-${row.label}`}>
              <td className="border-b border-[#e5e7eb] px-3.5 py-2.5 text-[12.5px]">
                <code className="text-[12px]">{row.status}</code>
              </td>
              <td className="border-b border-[#e5e7eb] px-3.5 py-2.5 text-center text-[12.5px] font-bold text-[#111827]">
                {row.orders}
              </td>
              <td className="border-b border-[#e5e7eb] px-3.5 py-2.5">
                <AutomationStatusPill className={row.labelClass}>{row.label}</AutomationStatusPill>
              </td>
              <td
                className={cn(
                  'border-b border-[#e5e7eb] px-3.5 py-2.5 text-[12.5px] font-semibold',
                  row.loadClass,
                )}
              >
                {row.load}
              </td>
              <td
                className={cn(
                  'border-b border-[#e5e7eb] px-3.5 py-2.5 text-[12.5px] font-bold',
                  row.eligible ? 'text-[#15803d]' : 'text-[#dc2626]',
                )}
              >
                {row.eligibleText}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function ChampStatusTransitionTable({ columns, rows }) {
  return (
    <div className="w-full max-w-full overflow-x-auto overscroll-x-contain">
      <table className="w-full min-w-[860px] border-collapse text-left">
        <thead>
          <tr className="bg-[#f9fafb]">
            {columns.map((column) => (
              <th
                key={column}
                className="border-b border-[#e5e7eb] px-3.5 py-2.5 text-[11px] font-semibold text-[#6b7280]"
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${row.from}-${row.to}-${row.trigger}-${index}`}>
              <td className="border-b border-[#e5e7eb] px-3.5 py-2.5 text-[12.5px] text-[#111827]">
                {row.from}
              </td>
              <td className="border-b border-[#e5e7eb] px-3.5 py-2.5 text-[12.5px] font-bold">
                <span style={{ color: row.toColor }}>{row.to}</span>
              </td>
              <td className="border-b border-[#e5e7eb] px-3.5 py-2.5 text-[12.5px] text-[#111827]">
                {row.trigger}
              </td>
              <td className="border-b border-[#e5e7eb] px-3.5 py-2.5 text-[12.5px] text-[#111827]">
                {row.who}
              </td>
              <td className="border-b border-[#e5e7eb] px-3.5 py-2.5 text-[12.5px] text-[#111827]">
                {row.fires}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
