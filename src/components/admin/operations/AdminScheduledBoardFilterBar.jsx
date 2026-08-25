import { X } from 'lucide-react'
import { AdminFilterDropdown } from './AdminFilterDropdown'
import {
  SCHEDULED_DATE_OPTIONS,
  SCHEDULED_STAGE_OPTIONS,
  SCHEDULED_TYPE_OPTIONS,
  removeScheduledBoardChip,
  scheduledBoardFilterChips,
  scheduledBoardQueryIsActive,
  zonesFromOrders,
} from '../../../lib/adminScheduledBoardQuery'

/**
 * Scheduled Pipeline / Board filters: Date, Type, Stage, Zone.
 * Multi-select, AND across groups, live chips.
 */
export function AdminScheduledBoardFilterBar({
  query,
  onChange,
  onClear,
  orders = [],
}) {
  const zones = zonesFromOrders(orders)
  const chips = scheduledBoardFilterChips(query, { zones })
  const showCustom = (query?.dates || []).includes('custom')
  const showClear = scheduledBoardQueryIsActive(query) || showCustom

  return (
    <div className="shrink-0">
      <div className="flex flex-wrap items-center gap-2">
        <AdminFilterDropdown
          label="Date"
          allLabel="All"
          options={SCHEDULED_DATE_OPTIONS}
          selectedIds={query?.dates || []}
          onChange={(dates) => onChange?.({ ...query, dates })}
        />
        <AdminFilterDropdown
          label="Type"
          searchable
          searchPlaceholder="Search types…"
          options={SCHEDULED_TYPE_OPTIONS}
          selectedIds={query?.types || []}
          onChange={(types) => onChange?.({ ...query, types })}
        />
        <AdminFilterDropdown
          label="Stage"
          options={SCHEDULED_STAGE_OPTIONS}
          selectedIds={query?.stages || []}
          onChange={(stages) => onChange?.({ ...query, stages })}
        />
        <AdminFilterDropdown
          label="Zone"
          searchable
          searchPlaceholder="Search zones…"
          options={zones}
          selectedIds={query?.zones || []}
          onChange={(zonesNext) => onChange?.({ ...query, zones: zonesNext })}
        />
      </div>

      {showCustom ? (
        <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-[#59655e]">
          <span>From</span>
          <input
            type="date"
            value={query?.dateFrom || ''}
            onChange={(event) => onChange?.({ ...query, dateFrom: event.target.value })}
            className="h-[29px] rounded-full border border-[#dfe4e0] bg-white px-2.5 text-[10px] outline-none"
          />
          <span>To</span>
          <input
            type="date"
            value={query?.dateTo || ''}
            onChange={(event) => onChange?.({ ...query, dateTo: event.target.value })}
            className="h-[29px] rounded-full border border-[#dfe4e0] bg-white px-2.5 text-[10px] outline-none"
          />
        </div>
      ) : null}

      {chips.length > 0 || showClear ? (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
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
          {showClear ? (
            <button
              type="button"
              onClick={() => onClear?.()}
              className="h-[22px] px-1 text-[10px] font-medium text-[#16854a] hover:underline"
            >
              Clear all
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
