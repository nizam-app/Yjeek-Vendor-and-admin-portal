import { X } from 'lucide-react'
import { AdminFilterDropdown } from './AdminFilterDropdown'
import {
  SCHEDULED_DATE_OPTIONS,
  SCHEDULED_STAGE_OPTIONS,
  SCHEDULED_TYPE_OPTIONS,
  removeScheduledBoardChip,
  scheduledBoardFilterChips,
  zonesFromOrders,
} from '../../../lib/adminScheduledBoardQuery'

/**
 * Scheduled filters.
 * - `variant="pipeline"`: Zone only (right action cluster next to tabs).
 * - `variant="board"`: Date / Type / Stage / Zone row matching dispatch board chrome.
 */
export function AdminScheduledBoardFilterBar({
  query,
  onChange,
  onClear,
  orders = [],
  align = 'right',
  trailing = null,
  variant = 'pipeline',
}) {
  const zones = zonesFromOrders(orders)
  const isBoard = variant === 'board'
  const chips = scheduledBoardFilterChips(query, { zones }).filter((chip) => (
    isBoard ? true : chip.group === 'zones'
  ))
  const showClear = chips.length > 0
  const separator = isBoard ? ': ' : ' · '
  const rounded = isBoard ? 'full' : 'md'

  const zoneDropdown = (
    <AdminFilterDropdown
      label="Zone"
      searchable
      searchPlaceholder="Search zones…"
      options={zones}
      selectedIds={query?.zones || []}
      onChange={(zonesNext) => onChange?.({ ...query, zones: zonesNext })}
      align={align}
      rounded={rounded}
      separator={separator}
    />
  )

  if (!isBoard) {
    return (
      <div className="flex shrink-0 flex-col items-end gap-2">
        <div className="flex flex-wrap items-center justify-end gap-2">
          {zoneDropdown}
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

  const dates = query?.dates || []
  const showCustomRange = dates.includes('custom')

  return (
    <div className="w-full shrink-0">
      <div className="flex flex-wrap items-center gap-2">
        <AdminFilterDropdown
          label="Date"
          options={SCHEDULED_DATE_OPTIONS}
          selectedIds={dates}
          onChange={(datesNext) => {
            const next = { ...query, dates: datesNext }
            if (!datesNext.includes('custom')) {
              next.dateFrom = ''
              next.dateTo = ''
            }
            onChange?.(next)
          }}
          rounded={rounded}
          separator={separator}
        />
        <AdminFilterDropdown
          label="Type"
          options={SCHEDULED_TYPE_OPTIONS}
          selectedIds={query?.types || []}
          onChange={(types) => onChange?.({ ...query, types })}
          rounded={rounded}
          separator={separator}
        />
        <AdminFilterDropdown
          label="Stage"
          options={SCHEDULED_STAGE_OPTIONS}
          selectedIds={query?.stages || []}
          onChange={(stages) => onChange?.({ ...query, stages })}
          rounded={rounded}
          separator={separator}
        />
        {zoneDropdown}
        {trailing ? <div className="ml-auto flex shrink-0 items-center">{trailing}</div> : null}
      </div>

      {showCustomRange ? (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <label className="flex h-[31px] items-center gap-1.5 rounded-full border border-[#dfe4e0] bg-white px-3 text-[10px] text-[#59655e]">
            From
            <input
              type="date"
              value={query?.dateFrom || ''}
              onChange={(event) => onChange?.({ ...query, dateFrom: event.target.value })}
              className="border-0 bg-transparent text-[10px] outline-none"
            />
          </label>
          <label className="flex h-[31px] items-center gap-1.5 rounded-full border border-[#dfe4e0] bg-white px-3 text-[10px] text-[#59655e]">
            To
            <input
              type="date"
              value={query?.dateTo || ''}
              onChange={(event) => onChange?.({ ...query, dateTo: event.target.value })}
              className="border-0 bg-transparent text-[10px] outline-none"
            />
          </label>
        </div>
      ) : null}

      {showClear ? (
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
