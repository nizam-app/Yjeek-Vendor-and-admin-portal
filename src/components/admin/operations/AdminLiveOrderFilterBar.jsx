import { Search, X } from 'lucide-react'
import { cn } from '../cn'
import {
  LIVE_ORDER_SORTS,
  LIVE_ORDER_TYPES,
  LIVE_INCIDENT_PRIORITY_SORTS,
  LIVE_INCIDENT_AGE_SORTS,
  INCIDENT_SEVERITIES,
  champsFromOrders,
  liveOrderFilterChips,
  liveOrderQueryIsActive,
  removeLiveOrderChip,
  vendorsFromOrders,
} from '../../../lib/adminLiveOrderQuery'
import { AdminVendorFilterButton } from '../AdminVendorFilterButton'
import { AdminFilterDropdown } from './AdminFilterDropdown'
import { AdminSortDropdown } from './AdminSortDropdown'

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
  incidentCategories = [],
  showTypes = true,
  showIncidentFilters = true,
}) {
  const champs = champsFromOrders(orders)
  const vendors = [...vendorsFromOrders(orders), ...extraVendors]
  const chips = liveOrderFilterChips(query, { vendors, champs })
  const active = liveOrderQueryIsActive(query)
  const sort = query?.sort || 'time_left'
  const sortOptions = [
    ...LIVE_ORDER_SORTS,
    ...(showIncidentFilters ? LIVE_INCIDENT_PRIORITY_SORTS : []),
    ...(showIncidentFilters ? LIVE_INCIDENT_AGE_SORTS : []),
  ]

  return (
    <div className="shrink-0">
      <div className="flex items-center gap-2">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
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
        {showIncidentFilters ? (
          <>
            <AdminFilterDropdown
              label="Severity"
              searchable
              searchPlaceholder="Search severity…"
              options={INCIDENT_SEVERITIES}
              selectedIds={query?.incidentSeverities || []}
              onChange={(incidentSeverities) => onChange?.({ ...query, incidentSeverities })}
            />
            {incidentCategories.length ? (
              <AdminFilterDropdown
                label="Incident type"
                searchable
                searchPlaceholder="Search types…"
                options={incidentCategories}
                selectedIds={query?.incidentCategories || []}
                onChange={(incidentCategories) => onChange?.({ ...query, incidentCategories })}
              />
            ) : null}
            <button
              type="button"
              aria-pressed={Boolean(query?.incidentUnattended)}
              onClick={() => onChange?.({ ...query, incidentUnattended: !query?.incidentUnattended })}
              className={cn(
                'inline-flex h-[31px] items-center rounded-full border px-3 text-[10px] font-medium transition',
                query?.incidentUnattended
                  ? 'border-[#efb8ba] bg-[#fff0ed] text-[#c62828]'
                  : 'border-[#dfe4e0] bg-white text-[#657068] hover:border-[#c5cdc7]',
              )}
            >
              Unattended
            </button>
          </>
        ) : null}
        </div>
        <AdminSortDropdown
          value={sort}
          options={sortOptions}
          align="right"
          onChange={(nextSort) => onChange?.({ ...query, sort: nextSort || 'time_left' })}
        />
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
