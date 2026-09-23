import { cn } from '../cn'

const tierTone = {
  elite: 'text-[#15803d]',
  gold: 'text-[#1d4ed8]',
  silver: 'text-[#111827]',
  watch: 'text-[#d97706]',
  risk: 'text-[#dc2626]',
}

const multiplierTone = {
  elite: 'text-[#15803d]',
  gold: 'text-[#1d4ed8]',
  silver: 'text-[#111827]',
  watch: 'text-[#d97706]',
  risk: 'text-[#dc2626]',
}

/** Read-only CPI tier dispatch multipliers table. */
export function CpiTierTable({ columns, tiers }) {
  return (
    <div className="w-full max-w-full overflow-x-auto overscroll-x-contain">
      <table className="w-full min-w-[720px] border-collapse text-left">
        <thead>
          <tr className="bg-[#1D6A33]">
            {columns.map((column) => (
              <th
                key={column}
                className="px-3.5 py-2.5 text-[11px] font-semibold text-white"
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tiers.map((row, index) => (
            <tr
              key={row.id}
              className={cn(index % 2 === 1 ? 'bg-[#f9fafb]' : 'bg-white')}
            >
              <td className="border-b border-[#e5e7eb] px-3.5 py-2.5 text-[12.5px]">
                <strong className={tierTone[row.tone] || 'text-[#111827]'}>{row.tier}</strong>
              </td>
              <td className="border-b border-[#e5e7eb] px-3.5 py-2.5 text-[12.5px] text-[#111827]">
                {row.scoreRange}
              </td>
              <td className="border-b border-[#e5e7eb] px-3.5 py-2.5 text-[12.5px]">
                <strong className={multiplierTone[row.tone] || 'text-[#111827]'}>
                  {row.multiplier}
                </strong>
              </td>
              <td className="border-b border-[#e5e7eb] px-3.5 py-2.5 text-[12.5px] text-[#111827]">
                {row.effect}
              </td>
              <td className="border-b border-[#e5e7eb] px-3.5 py-2.5 text-[12.5px] text-[#111827]">
                {row.action}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
