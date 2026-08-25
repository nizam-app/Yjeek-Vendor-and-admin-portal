import { Search, X } from 'lucide-react'
import {
  LIVE_ORDER_SORTS,
  LIVE_ORDER_TYPES,
  champsFromOrders,
  liveOrderFilterChips,
  liveOrderQueryIsActive,
  removeLiveOrderChip,
  vendorsFromOrders,
} from '../../../lib/adminLiveOrderQuery'
import { AdminVendorFilterButton } from '../AdminVendorFilterButton'
import { AdminFilterDropdown } from './AdminFilterDropdown'

/**
 * Live Orders search + Vendor / Type / Champ / Sort controls.
 * Filters combine with AND. Active values render as removable chips.
 */
export function AdminLiveOrderFilterBar({
  query,
  onChange,
  onClear,
  orders = [],
  extraVendors = [],
  showTypes = true,
}) {
  const champs = champsFromOrders(orders)
  const vendors = [...vendorsFromOrders(orders), ...extraVendors]
  const chips = liveOrderFilterChips(query, { vendors, champs })
  const active = liveOrderQueryIsActive(query)
  const sort = query?.sort || 'time_left'

  return (
    <div className="shrink-0">
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex h-[31px] w-[225px] items-center gap-2 rounded-full border border-[#dfe4e0] bg-white px-3">
          <Search size={12} className="text-[#7b867f]" />
          <input
            value={query?.q || ''}
            onChange={(event) => onChange?.({ ...query, q: event.target.value })}
            className="min-w-0 flex-1 border-0 bg-transparent text-[10px] outline-none"
            placeholder="Search order, vendor, champ"
            aria-label="Search orders, vendors, champ"
          />
        </label>
        <AdminVendorFilterButton
          variant="pill"
          selectedIds={query?.vendorIds || []}
          onChange={(vendorIds) => onChange?.({ ...query, vendorIds })}
          extraVendors={vendors}
        />
        {showTypes ? (
          <AdminFilterDropdown
            label="Type"
            searchable
            searchPlaceholder="Search types…"
            options={LIVE_ORDER_TYPES}
            selectedIds={query?.types || []}
            onChange={(types) => onChange?.({ ...query, types })}
          />
        ) : null}
        <AdminFilterDropdown
          label="Champ"
          searchable
          searchPlaceholder="Search champs…"
          options={champs}
          selectedIds={query?.champIds || []}
          onChange={(champIds) => onChange?.({ ...query, champIds })}
        />
        <div className="ml-auto">
          <AdminFilterDropdown
            label="Sort"
            multiple={false}
            showAll={false}
            align="right"
            options={LIVE_ORDER_SORTS}
            selectedIds={[sort]}
            onChange={(ids) => onChange?.({ ...query, sort: ids[0] || 'time_left' })}
          />
        </div>
      </div>

      {chips.length > 0 ? (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {chips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => onChange?.(removeLiveOrderChip(query, chip))}
              className="inline-flex h-[22px] items-center gap-1 rounded-full border border-[#d5e6da] bg-[#f3faf5] px-2 text-[10px] font-medium text-[#2f6a45]"
            >
              {chip.label}
              <X size={10} aria-hidden />
            </button>
          ))}
          {active ? (
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
