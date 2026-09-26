import { cn } from '../cn'
import { AutomationStatusPill } from './AutomationStatusPill'
import {
  formatBhdDisplay,
  isChampNearLimit,
} from '../../../mappers/admin/mapAdminPodAutomation'

/** Champ POD permissions table — live Fleet rows only. */
export function PodChampPermissionsTable({
  columns,
  champs,
  warningThresholdPercent,
  busyChampId = null,
  onEdit,
  onEnable,
  onDisable,
  onReconcile,
}) {
  const busy = Boolean(busyChampId)

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
            const rowBusy = busyChampId === champ.id
            return (
              <tr key={champ.id} className="hover:bg-[#f9fafb]">
                <td className="border-b border-[#e5e7eb] px-3.5 py-2.5 text-[12.5px]">
                  <strong className="text-[#111827]">{champ.name}</strong>
                  {floatBlocked ? (
                    <div className="mt-0.5 text-[10.5px] font-medium text-[#b45309]">
                      Float blocked (CASH only) — account not suspended
                    </div>
                  ) : null}
                  {champ.accountStatus && champ.accountStatus !== 'ACTIVE' ? (
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
                  {champ.podEnabled && champ.effectivePodEligible === false ? (
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
                      {champ.utilizationPercent != null ? (
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
                        disabled={busy}
                        onClick={() => onEnable?.(champ)}
                        className="inline-flex items-center rounded-[7px] border border-[#1D6A33] bg-[#1D6A33] px-2.5 py-1 text-[11px] font-semibold text-white disabled:opacity-50"
                      >
                        {rowBusy ? '…' : 'Enable'}
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => onDisable?.(champ)}
                          className="inline-flex items-center rounded-[7px] border border-[#d1d5db] bg-white px-2.5 py-1 text-[11px] font-medium text-[#111827] disabled:opacity-50"
                        >
                          Disable
                        </button>
                        {nearLimit || floatBlocked ? (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => onReconcile?.(champ)}
                            className="inline-flex items-center rounded-[7px] border border-[#dc2626] bg-white px-2.5 py-1 text-[11px] font-medium text-[#dc2626] disabled:opacity-50"
                          >
                            {rowBusy ? '…' : 'Full reconcile'}
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => onEdit?.(champ)}
                            className="inline-flex items-center rounded-[7px] border border-[#d1d5db] bg-white px-2.5 py-1 text-[11px] font-medium text-[#111827] disabled:opacity-50"
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
