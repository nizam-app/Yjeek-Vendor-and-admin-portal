import { X } from 'lucide-react'
import { AdminFilterDropdown } from './AdminFilterDropdown'
import {
  removeScheduledBoardChip,
  scheduledBoardFilterChips,
  zonesFromOrders,
} from '../../../lib/adminScheduledBoardQuery'

/**
 * Scheduled Pipeline / Board zone filter — sits in the right action cluster.
 * Optional `trailing` (e.g. Auto-assign) shares the same baseline as Zone.
 */
export function AdminScheduledBoardFilterBar({
  query,
  onChange,
  onClear,
  orders = [],
  align = 'right',
  trailing = null,
}) {
  const zones = zonesFromOrders(orders)
  const chips = scheduledBoardFilterChips(query, { zones }).filter((chip) => chip.group === 'zones')
  const showClear = chips.length > 0

  return (
    <div className="flex shrink-0 flex-col items-end gap-2">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <AdminFilterDropdown
          label="Zone"
          searchable
          searchPlaceholder="Search zones…"
          options={zones}
          selectedIds={query?.zones || []}
          onChange={(zonesNext) => onChange?.({ ...query, zones: zonesNext })}
          align={align}
          rounded="md"
        />
        {trailing}
      </div>

      {showClear ? (
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          {chips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => onChange?.(removeScheduledBoardChip(query, chip))}
              className="inline-flex h-[22px] items-center gap-1 rounded-full border border-[#d5e6da] bg-[#f3faf5] px-2 text-[10px] font-medium text-[#2f6a45]"
            >
              {chip.label}
              <X size={10} aria-hidden />
            </button>
          ))}
          <button
            type="button"
            onClick={() => onClear?.()}
            className="h-[22px] px-1 text-[10px] font-medium text-[#16854a] hover:underline"
          >
            Clear all
          </button>
        </div>
      ) : null}
    </div>
  )
}
