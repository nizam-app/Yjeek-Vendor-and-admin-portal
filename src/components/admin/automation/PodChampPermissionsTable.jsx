import { cn } from '../cn'
import { AutomationStatusPill } from './AutomationStatusPill'
import {
  formatBhdDisplay,
  isChampNearLimit,
} from '../../../mocks/adminAutomationPayOnDelivery.mock'

/** Champ POD permissions table. */
export function PodChampPermissionsTable({
  columns,
  champs,
  warningThresholdPercent,
  onEdit,
  onEnable,
  onDisable,
  onNearLimit,
  onReconcile,
  realMode = false,
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
            const floatBlocked = champ.floatBlocked === true
            return (
              <tr key={champ.id} className="hover:bg-[#f9fafb]">
                <td className="border-b border-[#e5e7eb] px-3.5 py-2.5 text-[12.5px]">
                  <strong className="text-[#111827]">{champ.name}</strong>
                  {realMode && floatBlocked ? (
                    <div className="mt-0.5 text-[10.5px] font-medium text-[#b45309]">
                      Float blocked (CASH only) — account not suspended
                    </div>
                  ) : null}
                  {realMode && champ.accountStatus && champ.accountStatus !== 'ACTIVE' ? (
                    <div className="mt-0.5 text-[10.5px] text-[#6b7280]">
                      Account: {champ.accountStatus}
                    </div>
                  ) : null}
                </td>
                <td className="border-b border-[#e5e7eb] px-3.5 py-2.5 text-[12.5px]">
                  {champ.podEnabled ? (
                    <AutomationStatusPill tone="on">✓ Yes</AutomationStatusPill>
                  ) : (
                    <AutomationStatusPill tone="off">✗ No</AutomationStatusPill>
                  )}
                  {realMode && champ.podEnabled && champ.effectivePodEligible === false ? (
                    <div className="mt-1 text-[10.5px] text-[#6b7280]">Effective: blocked</div>
                  ) : null}
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
                        nearLimit || floatBlocked
                          ? 'font-bold text-[#dc2626]'
                          : 'text-[#111827]',
                      )}
                    >
                      {formatBhdDisplay(champ.currentCashBhd, { forceCents: true })}
                      {nearLimit && !floatBlocked ? ' ⚠' : ''}
                      {floatBlocked ? ' ⛔' : ''}
                      {realMode && champ.utilizationPercent != null ? (
                        <span className="ml-1 font-normal text-[#6b7280]">
                          ({champ.utilizationPercent}%)
                        </span>
                      ) : null}
                    </span>
                  )}
                </td>
                <td className="border-b border-[#e5e7eb] px-3.5 py-2.5 text-[12.5px] text-[#111827]">
                  {champ.disputes30d == null ? (
                    <span className="text-[#9ca3af]" title="P6 — not available">
                      —
                    </span>
                  ) : (
                    <span>
                      {champ.disputes30d}
                      {champ.disputes30d === 0 ? ' ⭐' : ''}
                    </span>
                  )}
                </td>
                <td className="border-b border-[#e5e7eb] px-3.5 py-2.5 text-[12.5px]">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {!champ.podEnabled ? (
                      <button
                        type="button"
                        onClick={() => onEnable?.(champ)}
                        className="inline-flex items-center rounded-[7px] border border-[#1D6A33] bg-[#1D6A33] px-2.5 py-1 text-[11px] font-semibold text-white"
                      >
                        Enable
                      </button>
                    ) : (
                      <>
                        {realMode ? (
                          <button
                            type="button"
                            onClick={() => onDisable?.(champ)}
                            className="inline-flex items-center rounded-[7px] border border-[#d1d5db] bg-white px-2.5 py-1 text-[11px] font-medium text-[#111827]"
                          >
                            Disable
                          </button>
                        ) : null}
                        {nearLimit || floatBlocked ? (
                          <button
                            type="button"
                            onClick={() =>
                              realMode ? onReconcile?.(champ) : onNearLimit?.(champ)
                            }
                            className="inline-flex items-center rounded-[7px] border border-[#dc2626] bg-white px-2.5 py-1 text-[11px] font-medium text-[#dc2626]"
                          >
                            {realMode ? 'Full reconcile' : 'Near limit'}
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
                      </>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
