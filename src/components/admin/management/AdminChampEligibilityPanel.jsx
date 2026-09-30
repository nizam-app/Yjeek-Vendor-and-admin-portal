/**
 * Champ delivery eligibility panel (OG §07 / D07 Batch 4).
 *
 * Progressive disclosure on Add champ + Edit champ.
 * Store types come from Store Management (caller) — never hardcoded.
 */
import { cn } from '../cn'
import {
  CHAMP_ORDER_MODE_OPTIONS,
  CHAMP_SCHEDULED_CLASS_OPTIONS,
  CHAMP_SPECIAL_ITEM_TYPE_OPTIONS,
  applyChampModeToggle,
  applyChampScheduledClasses,
  getChampEligibilityVisibility,
  clearAllChampNormalStoreTypes,
  selectAllChampNormalStoreTypes,
  toggleChampNormalStoreType,
} from './champEligibilityForm'

export {
  EMPTY_CHAMP_ELIGIBILITY,
  CHAMP_MODE_REQUIRED_MESSAGE,
  CHAMP_SPECIAL_ITEM_TYPES_REQUIRED_MESSAGE,
  CHAMP_SPECIAL_STORE_TYPES_REQUIRED_MESSAGE,
  CHAMP_SPECIAL_ITEM_TYPE_OPTIONS,
  applyChampModeToggle,
  applyChampScheduledClasses,
  buildChampEligibilityPayload,
  champAllowedCategorySlugsFromEligibility,
  getChampEligibilityVisibility,
  isNormalIncluded,
  isScheduledModeOn,
  isSpecialIncluded,
  mapSpecialItemTypesToStoreTypeIds,
  normalizeChampEligibility,
  clearAllChampNormalStoreTypes,
  selectAllChampNormalStoreTypes,
  selectAllChampSpecialStoreTypes,
  toggleChampNormalStoreType,
  toggleChampSpecialStoreType,
  validateChampEligibility,
} from './champEligibilityForm'

const hintClass = 'mt-1 text-[11px] leading-[14px] text-[#9aa49d]'

/**
 * ON when every item is selected.
 * Click: none → select all; any or all → unselect all.
 */
function BulkSelectToggle({
  disabled = false,
  allSelected,
  anySelected,
  onSelectAll,
  onUnselectAll,
  label = 'Select all',
}) {
  const handleClick = () => {
    if (allSelected || anySelected) onUnselectAll()
    else onSelectAll()
  }

  return (
    <div className="flex shrink-0 items-center gap-2.5">
      <span className="text-[12px] font-medium text-[#7c8780]">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={allSelected}
        aria-label={allSelected || anySelected ? 'Unselect all' : 'Select all'}
        disabled={disabled}
        onClick={handleClick}
        className={cn(
          'relative h-[28px] w-[48px] shrink-0 rounded-full transition disabled:cursor-not-allowed disabled:opacity-50',
          allSelected ? 'bg-[#1aa054]' : 'bg-[#d5dbd7]',
        )}
      >
        <span
          className={cn(
            'absolute top-[3px] h-[22px] w-[22px] rounded-full bg-white shadow transition',
            allSelected ? 'left-[23px]' : 'left-[3px]',
          )}
        />
      </button>
    </div>
  )
}

function ModeToggle({ checked, onChange, disabled = false, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-[28px] w-[48px] shrink-0 rounded-full transition disabled:cursor-not-allowed disabled:opacity-50',
        checked ? 'bg-[#1aa054]' : 'bg-[#d5dbd7]',
      )}
    >
      <span
        className={cn(
          'absolute top-[3px] h-[22px] w-[22px] rounded-full bg-white shadow transition',
          checked ? 'left-[23px]' : 'left-[3px]',
        )}
      />
    </button>
  )
}

function ClassPill({ label, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex h-[32px] items-center rounded-full border px-3 text-[12px] font-medium transition',
        selected
          ? 'border-[#1aa054] bg-[#e8f7ed] text-[#147940]'
          : 'border-[#e4e8e4] bg-white text-[#59655e] hover:bg-[#f6f8f6]',
      )}
    >
      {label}
    </button>
  )
}

function StoreTypeChip({ label, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex h-[32px] items-center rounded-full border px-3 text-[12px] font-medium transition',
        selected
          ? 'border-[#1aa054] bg-[#e8f7ed] text-[#147940]'
          : 'border-[#e4e8e4] bg-white text-[#59655e] hover:bg-[#f6f8f6]',
      )}
    >
      {selected ? `${label} ✓` : label}
    </button>
  )
}

function ItemTypeChip({ label, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex h-[32px] items-center rounded-full border px-3 text-[12px] font-medium transition',
        selected
          ? 'border-[#1aa054] bg-[#e8f7ed] text-[#147940]'
          : 'border-[#e4e8e4] bg-white text-[#59655e] hover:bg-[#f6f8f6]',
      )}
    >
      {label}
    </button>
  )
}

/**
 * @param {object} props
 * @param {ReturnType<typeof normalizeChampEligibility>} props.value
 * @param {(next: ReturnType<typeof normalizeChampEligibility>) => void} props.onChange
 * @param {string[]} props.specialItemTypes
 * @param {(next: string[]) => void} props.onSpecialItemTypesChange
 * @param {Array<{ id: string, name: string, slug?: string }>} [props.storeTypeOptions]
 * @param {boolean} [props.storeTypesLoading]
 * @param {string} [props.storeTypesError]
 * @param {boolean} [props.disabled]
 */
export default function AdminChampEligibilityPanel({
  value,
  onChange,
  specialItemTypes = [],
  onSpecialItemTypesChange,
  storeTypeOptions = [],
  storeTypesLoading = false,
  storeTypesError = '',
  disabled = false,
}) {
  const visibility = getChampEligibilityVisibility(value)
  const enabledSet = new Set(value?.enabledModes || [])
  const selectedSpecialSet = new Set(specialItemTypes)

  const handleModeToggle = (modeKey, nextOn) => {
    if (disabled) return
    onChange(applyChampModeToggle(value, modeKey, nextOn))
  }

  const handleClassSelect = (classKey) => {
    if (disabled) return
    onChange(applyChampScheduledClasses(value, classKey))
  }

  const handleNormalStoreTypeToggle = (storeTypeId) => {
    if (disabled) return
    onChange(toggleChampNormalStoreType(value, storeTypeId))
  }

  const handleSelectAllNormalStoreTypes = () => {
    if (disabled || !storeTypeOptions.length) return
    onChange(selectAllChampNormalStoreTypes(value, storeTypeOptions))
  }

  const handleUnselectAllNormalStoreTypes = () => {
    if (disabled) return
    onChange(clearAllChampNormalStoreTypes(value))
  }

  const handleSpecialItemTypeToggle = (label) => {
    if (disabled) return
    const next = selectedSpecialSet.has(label)
      ? specialItemTypes.filter((item) => item !== label)
      : [...specialItemTypes, label]
    onSpecialItemTypesChange(next)
  }

  const handleSelectAllSpecialItemTypes = () => {
    if (disabled) return
    onSpecialItemTypesChange([...CHAMP_SPECIAL_ITEM_TYPE_OPTIONS])
  }

  const handleUnselectAllSpecialItemTypes = () => {
    if (disabled) return
    onSpecialItemTypesChange([])
  }

  const allNormalStoreTypesSelected =
    storeTypeOptions.length > 0 &&
    storeTypeOptions.every((item) =>
      (value?.normalStoreTypeIds || []).includes(item.id),
    )

  const allSpecialItemTypesSelected =
    CHAMP_SPECIAL_ITEM_TYPE_OPTIONS.length > 0 &&
    CHAMP_SPECIAL_ITEM_TYPE_OPTIONS.every((label) => selectedSpecialSet.has(label))

  const anyNormalStoreTypesSelected = (value?.normalStoreTypeIds || []).length > 0
  const anySpecialItemTypesSelected = specialItemTypes.length > 0

  return (
    <div className="space-y-5">
      <div>
        <h4 className="mb-1 text-[13px] font-bold text-[#17231c]">Order modes</h4>
        <p className={cn(hintClass, 'mt-0 mb-3')}>
          Which delivery modes this champ can take. At least one must be on.
        </p>
        <div className="space-y-2">
          {CHAMP_ORDER_MODE_OPTIONS.map((opt) => {
            const checked = enabledSet.has(opt.key)
            const wouldLeaveNone =
              checked && (value?.enabledModes || []).length === 1
            return (
              <div
                key={opt.key}
                className="flex items-center justify-between gap-3 rounded-[12px] bg-[#f3f5f3] px-4 py-3"
              >
                <span className="text-[13px] font-medium text-[#17231c]">{opt.label}</span>
                <ModeToggle
                  checked={checked}
                  label={opt.label}
                  disabled={disabled || wouldLeaveNone}
                  onChange={(next) => handleModeToggle(opt.key, next)}
                />
              </div>
            )
          })}
        </div>
      </div>

      {visibility.showScheduledClasses ? (
        <div>
          <h4 className="mb-1 text-[13px] font-bold text-[#17231c]">
            Scheduled — item classes
          </h4>
          <p className={cn(hintClass, 'mt-0 mb-3')}>
            Shown only because Scheduled is on. Choose what he is allowed to carry.
          </p>
          <div className="flex flex-wrap gap-2">
            {CHAMP_SCHEDULED_CLASS_OPTIONS.map((opt) => (
              <ClassPill
                key={opt.key}
                label={opt.label}
                selected={value?.scheduledClasses === opt.key}
                onClick={() => handleClassSelect(opt.key)}
              />
            ))}
          </div>
        </div>
      ) : null}

      {visibility.showNormalStoreTypes ? (
        <div>
          <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-[13px] font-bold text-[#17231c]">
              Normal — allowed store types
            </h4>
            {storeTypeOptions.length > 0 ? (
              <BulkSelectToggle
                disabled={disabled}
                allSelected={allNormalStoreTypesSelected}
                anySelected={anyNormalStoreTypesSelected}
                onSelectAll={handleSelectAllNormalStoreTypes}
                onUnselectAll={handleUnselectAllNormalStoreTypes}
              />
            ) : null}
          </div>
          <p className={cn(hintClass, 'mt-0 mb-3')}>
            Shown because Normal is included. Limits which store types this champ can take for
            on-demand and normal scheduled orders. Leave empty to allow any store type.
          </p>
          {storeTypesLoading ? (
            <p className="text-[12px] text-[#7c8780]">Loading store types…</p>
          ) : storeTypeOptions.length ? (
            <div className="flex flex-wrap gap-2">
              {storeTypeOptions.map((item) => (
                <StoreTypeChip
                  key={item.id}
                  label={item.name}
                  selected={(value?.normalStoreTypeIds || []).includes(item.id)}
                  onClick={() => handleNormalStoreTypeToggle(item.id)}
                />
              ))}
            </div>
          ) : (
            <p className="text-[12px] text-[#b42318]">
              {storeTypesError || 'No store types available from Store Management.'}
            </p>
          )}
          <p className={cn(hintClass, 'mt-2')}>
            List comes from Store Management. Multi-select — optional for Normal-only champs.
          </p>
        </div>
      ) : null}

      {visibility.showSpecialItemTypes ? (
        <div>
          <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-[13px] font-bold text-[#17231c]">Special item types allowed</h4>
            <BulkSelectToggle
              disabled={disabled}
              allSelected={allSpecialItemTypesSelected}
              anySelected={anySpecialItemTypesSelected}
              onSelectAll={handleSelectAllSpecialItemTypes}
              onUnselectAll={handleUnselectAllSpecialItemTypes}
            />
          </div>
          <p className={cn(hintClass, 'mt-0 mb-3')}>
            Shown because Special is included. Age-restricted, pharmacy, fragile, vape,
            high-value and similar handling rules.
          </p>
          <div className="flex flex-wrap gap-2">
            {CHAMP_SPECIAL_ITEM_TYPE_OPTIONS.map((label) => (
              <ItemTypeChip
                key={label}
                label={label}
                selected={selectedSpecialSet.has(label)}
                onClick={() => handleSpecialItemTypeToggle(label)}
              />
            ))}
          </div>
          <p className={cn(hintClass, 'mt-2')}>
            At least one required when Special is included.
          </p>
        </div>
      ) : null}
    </div>
  )
}
