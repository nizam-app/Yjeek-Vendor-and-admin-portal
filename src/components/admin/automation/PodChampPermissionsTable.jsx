import { cn } from '../cn'
import { AutomationStatusPill } from './AutomationStatusPill'
import {
  formatBhdDisplay,
  isChampNearLimit,
} from '../../../mocks/adminAutomationPayOnDelivery.mock'

/** Champ POD permissions table — local/mock presentation only. */
export function PodChampPermissionsTable({
  columns,
  champs,
  warningThresholdPercent,
  onEdit,
  onEnable,
  onNearLimit,
}) {
  return (
    <div className="w-full max-w-full overflow-x-auto overscroll-x-contain">
      <table className="w-full min-w-[760px] border-collapse text-left">
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
          {champs.map((champ) => {
            const nearLimit = isChampNearLimit(champ, warningThresholdPercent)
            return (
              <tr key={champ.id} className="hover:bg-[#f9fafb]">
                <td className="border-b border-[#e5e7eb] px-3.5 py-2.5 text-[12.5px]">
                  <strong className="text-[#111827]">{champ.name}</strong>
                </td>
                <td className="border-b border-[#e5e7eb] px-3.5 py-2.5 text-[12.5px]">
                  {champ.podEnabled ? (
                    <AutomationStatusPill tone="on">✓ Yes</AutomationStatusPill>
                  ) : (
                    <AutomationStatusPill tone="off">✗ No</AutomationStatusPill>
                  )}
                </td>
                <td className="border-b border-[#e5e7eb] px-3.5 py-2.5 text-[12.5px] text-[#111827]">
                  {formatBhdDisplay(champ.maxFloatBhd)}
                </td>
                <td className="border-b border-[#e5e7eb] px-3.5 py-2.5 text-[12.5px]">
                  {champ.currentCashBhd == null ? (
                    <span className="text-[#111827]">—</span>
                  ) : (
                    <span
                      className={cn(
                        nearLimit ? 'font-bold text-[#dc2626]' : 'text-[#111827]',
                      )}
                    >
                      {formatBhdDisplay(champ.currentCashBhd, { forceCents: true })}
                      {nearLimit ? ' ⚠' : ''}
                    </span>
                  )}
                </td>
                <td className="border-b border-[#e5e7eb] px-3.5 py-2.5 text-[12.5px] text-[#111827]">
                  {champ.disputes30d == null ? (
                    '—'
                  ) : (
                    <span>
                      {champ.disputes30d}
                      {champ.disputes30d === 0 ? ' ⭐' : ''}
                    </span>
                  )}
                </td>
                <td className="border-b border-[#e5e7eb] px-3.5 py-2.5 text-[12.5px]">
                  {!champ.podEnabled ? (
                    <button
                      type="button"
                      onClick={() => onEnable?.(champ)}
                      className="inline-flex items-center rounded-[7px] border border-[#1D6A33] bg-[#1D6A33] px-2.5 py-1 text-[11px] font-semibold text-white"
                    >
                      Enable
                    </button>
                  ) : nearLimit ? (
                    <button
                      type="button"
                      onClick={() => onNearLimit?.(champ)}
                      className="inline-flex items-center rounded-[7px] border border-[#dc2626] bg-white px-2.5 py-1 text-[11px] font-medium text-[#dc2626]"
                    >
                      Near limit
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onEdit?.(champ)}
                      className="inline-flex items-center rounded-[7px] border border-[#d1d5db] bg-white px-2.5 py-1 text-[11px] font-medium text-[#111827]"
                    >
                      Edit
                    </button>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
