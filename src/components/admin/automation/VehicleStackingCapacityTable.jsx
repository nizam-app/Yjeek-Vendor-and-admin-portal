import { cn } from '../cn'
import { AutomationStatusPill } from './AutomationStatusPill'

function CapacityCell({ cell }) {
  if (!cell) return null
  if (cell.kind === 'pill') {
    return <AutomationStatusPill tone={cell.tone || 'off'}>{cell.text}</AutomationStatusPill>
  }
  if (cell.kind === 'yes') {
    return <span className="font-bold text-[#15803d]">{cell.text}</span>
  }
  if (cell.kind === 'no') {
    return <span className="font-bold text-[#dc2626]">{cell.text}</span>
  }
  if (cell.kind === 'phase2') {
    return <span className="text-[11px] italic text-[#9ca3af]">{cell.text}</span>
  }
  return <span className="text-[#111827]">{cell.text}</span>
}

/** Read-only vehicle stacking capacity matrix. */
export function VehicleStackingCapacityTable({ columns, rows }) {
  return (
    <div className="w-full max-w-full overflow-x-auto overscroll-x-contain">
      <table className="w-full min-w-[640px] border-collapse text-left">
        <thead>
          <tr className="bg-[#1D6A33]">
            {columns.map((column) => (
              <th key={column} className="px-3.5 py-2 text-[10.5px] font-semibold text-white">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={row.id}
              className={cn(index % 2 === 1 ? 'bg-[#f9fafb]' : 'bg-white', row.phase2 && 'opacity-90')}
            >
              <td className="border-b border-[#e5e7eb] px-3.5 py-2.5 text-[12.5px]">
                <strong className="text-[#111827]">{row.vehicle}</strong>
              </td>
              <td className="border-b border-[#e5e7eb] px-3.5 py-2.5 text-[12.5px]">
                <CapacityCell cell={row.maxActiveOrders} />
              </td>
              <td className="border-b border-[#e5e7eb] px-3.5 py-2.5 text-[12.5px]">
                <CapacityCell cell={row.trigger1} />
              </td>
              <td className="border-b border-[#e5e7eb] px-3.5 py-2.5 text-[12.5px]">
                <CapacityCell cell={row.trigger2} />
              </td>
              <td className="border-b border-[#e5e7eb] px-3.5 py-2.5 text-[12.5px]">
                <CapacityCell cell={row.trigger3} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
