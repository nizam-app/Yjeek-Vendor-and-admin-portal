import { cn } from '../cn'

/** Read-only vendor status definitions / checkout rules table. */
export function VendorStatusRulesTable({ columns, statuses }) {
  return (
    <div className="w-full max-w-full overflow-x-auto overscroll-x-contain">
      <table className="w-full min-w-[720px] border-collapse text-left">
        <thead>
          <tr className="bg-[#1D6A33]">
            {columns.map((column) => (
              <th key={column} className="px-3.5 py-2.5 text-[11px] font-semibold text-white">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {statuses.map((row, index) => (
            <tr key={row.id} className={cn(index % 2 === 1 ? 'bg-[#f9fafb]' : 'bg-white')}>
              <td className="border-b border-[#e5e7eb] px-3.5 py-2.5 text-[12.5px]">
                <span className="inline-flex items-center gap-2">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ background: row.dotColor }}
                    aria-hidden
                  />
                  <strong className="text-[#111827]">{row.label}</strong>
                </span>
              </td>
              <td className="border-b border-[#e5e7eb] px-3.5 py-2.5 text-[12.5px] text-[#111827]">
                {row.setBy}
              </td>
              <td className="border-b border-[#e5e7eb] px-3.5 py-2.5 text-[12.5px] text-[#111827]">
                {row.customerSees}
              </td>
              <td
                className={cn(
                  'border-b border-[#e5e7eb] px-3.5 py-2.5 text-[12.5px] font-bold',
                  row.checkoutAllowed ? 'text-[#15803d]' : 'text-[#dc2626]',
                )}
              >
                {row.checkoutAllowed ? '✓ Allowed' : '✗ Blocked'}
              </td>
              <td
                className={cn(
                  'border-b border-[#e5e7eb] px-3.5 py-2.5 text-[12.5px] font-bold',
                  row.scheduledAllowed ? 'text-[#15803d]' : 'text-[#dc2626]',
                )}
              >
                {row.scheduledAllowed ? '✓ Allowed' : '✗ Blocked'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
