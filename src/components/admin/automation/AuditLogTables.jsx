import { cn } from '../cn'
import { AutomationStatusPill } from './AutomationStatusPill'

const acceptanceToneClass = {
  onTime: 'bg-[#dcfce7] text-[#15803d]',
  late: 'bg-[#fef9c3] text-[#854d0e]',
  none: 'bg-[#fee2e2] text-[#991b1b]',
}

/** Read-only Vendor Acceptance Log table. */
export function VendorAcceptanceLogTable({ columns, rows }) {
  return (
    <div className="w-full max-w-full overflow-x-auto overscroll-x-contain">
      <table className="w-full min-w-[780px] border-collapse text-left text-[12px]">
        <thead>
          <tr className="border-b border-[#e5e7eb] bg-[#f9fafb]">
            {columns.map((column) => (
              <th
                key={column}
                className="px-3.5 py-2.5 text-[10.5px] font-semibold tracking-[0.04em] text-[#6b7280]"
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-[#f9fafb]">
              <td className="border-b border-[#e5e7eb] px-3.5 py-2.5 text-[#111827]">
                {row.order}
              </td>
              <td className="border-b border-[#e5e7eb] px-3.5 py-2.5 text-[#111827]">{row.vendor}</td>
              <td className="border-b border-[#e5e7eb] px-3.5 py-2.5 text-[#111827]">{row.type}</td>
              <td className="border-b border-[#e5e7eb] px-3.5 py-2.5 text-[#111827]">
                {row.placedAt}
              </td>
              <td className="border-b border-[#e5e7eb] px-3.5 py-2.5 text-[#111827]">
                {row.acceptedAt}
              </td>
              <td className="border-b border-[#e5e7eb] px-3.5 py-2.5 text-[#111827]">
                {row.elapsed}
              </td>
              <td className="border-b border-[#e5e7eb] px-3.5 py-2.5">
                <AutomationStatusPill
                  className={cn(acceptanceToneClass[row.statusTone] || acceptanceToneClass.late)}
                >
                  {row.statusLabel}
                </AutomationStatusPill>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Read-only Automation Rule Change Audit Log table. */
export function AutomationRuleChangeLogTable({ columns, rows }) {
  return (
    <div className="w-full max-w-full overflow-x-auto overscroll-x-contain">
      <table className="w-full min-w-[920px] border-collapse text-left text-[12px]">
        <thead>
          <tr className="border-b border-[#e5e7eb] bg-[#f9fafb]">
            {columns.map((column) => (
              <th
                key={column}
                className="px-3.5 py-2.5 text-[10.5px] font-semibold tracking-[0.04em] text-[#6b7280]"
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-[#f9fafb]">
              <td className="border-b border-[#e5e7eb] px-3.5 py-2.5 whitespace-nowrap text-[#111827]">
                {row.timestamp}
              </td>
              <td className="border-b border-[#e5e7eb] px-3.5 py-2.5 text-[#111827]">{row.module}</td>
              <td className="border-b border-[#e5e7eb] px-3.5 py-2.5 text-[#111827]">
                {row.fieldChanged}
              </td>
              <td className="border-b border-[#e5e7eb] px-3.5 py-2.5 text-[#111827]">
                {row.changedBy}
              </td>
              <td className="border-b border-[#e5e7eb] px-3.5 py-2.5 text-[#111827]">{row.from}</td>
              <td className="border-b border-[#e5e7eb] px-3.5 py-2.5 text-[#111827]">{row.to}</td>
              <td className="border-b border-[#e5e7eb] px-3.5 py-2.5 text-[#111827]">{row.reason}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
