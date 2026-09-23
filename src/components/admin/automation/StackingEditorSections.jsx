import { AutomationFieldRow } from './AutomationSectionCard'
import {
  AutomationDurationField,
  AutomationOperatorNumberField,
} from './AutomationFields'
import { AutomationStatusPill } from './AutomationStatusPill'
import { VehicleStackingCapacityTable } from './VehicleStackingCapacityTable'
import { AutomationSectionCard } from './AutomationSectionCard'
import { ToggleSwitch } from '../ui-editor/ExclusiveOfferRow'

function ToggleWithLabel({ checked, onChange, label, disabled = false }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <ToggleSwitch checked={checked} onChange={onChange} label={label} disabled={disabled} />
      <span className="text-[12px] text-[#6b7280]">{label}</span>
    </div>
  )
}

/**
 * Shared stacking draft fields (mock + real API). Always keeps live stacking off.
 */
export function StackingEditorSections({
  catalog,
  draft,
  updateField,
  capacityRows,
  trigger1Status,
  trigger2Status,
}) {
  const capacity = catalog.vehicleCapacity
  const t1 = catalog.trigger1
  const t2 = catalog.trigger2
  const t3 = catalog.trigger3

  return (
    <>
      <AutomationSectionCard title={capacity.title}>
        <AutomationFieldRow label={capacity.maxCarOrdersLabel}>
          <AutomationOperatorNumberField
            value={draft.maxCarOrders}
            unit={capacity.maxCarOrdersUnit}
            operatorLocked
            operators={['≤']}
            onChange={(next) => updateField('maxCarOrders', { ...next, operator: '≤' })}
          />
        </AutomationFieldRow>
        <VehicleStackingCapacityTable columns={capacity.columns} rows={capacityRows} />
      </AutomationSectionCard>

      <AutomationSectionCard
        title={t1.title}
        subtitle={t1.subtitle}
        actions={
          <AutomationStatusPill tone={trigger1Status?.tone || t1.statusTone} showDot>
            {trigger1Status?.label || t1.status}
          </AutomationStatusPill>
        }
      >
        <AutomationFieldRow label={t1.enabledLabel}>
          <ToggleWithLabel
            checked={draft.trigger1Enabled}
            label={t1.enabledToggleLabel}
            onChange={(next) => updateField('trigger1Enabled', next)}
          />
        </AutomationFieldRow>
        <AutomationFieldRow label={t1.dropZoneLabel}>
          <AutomationOperatorNumberField
            value={draft.dropZoneRadiusKm}
            unit={t1.dropZoneUnit}
            operatorLocked
            operators={['≤']}
            onChange={(next) => updateField('dropZoneRadiusKm', { ...next, operator: '≤' })}
          />
        </AutomationFieldRow>
        <AutomationFieldRow label={t1.bikeStackingLabel}>
          <AutomationStatusPill tone="off">{t1.bikeStackingBadge}</AutomationStatusPill>
        </AutomationFieldRow>
        <AutomationFieldRow label={t1.multiVendorLabel}>
          <ToggleWithLabel
            checked={false}
            disabled
            label={t1.multiVendorToggleLabel}
            onChange={() => {}}
          />
        </AutomationFieldRow>
      </AutomationSectionCard>

      <AutomationSectionCard
        title={t2.title}
        subtitle={t2.subtitle}
        actions={
          <AutomationStatusPill tone={trigger2Status?.tone || t2.statusTone} showDot>
            {trigger2Status?.label || t2.status}
          </AutomationStatusPill>
        }
      >
        <AutomationFieldRow label={t2.enabledLabel}>
          <ToggleWithLabel
            checked={draft.trigger2Enabled}
            label={t2.enabledToggleLabel}
            onChange={(next) => updateField('trigger2Enabled', next)}
          />
        </AutomationFieldRow>
        <AutomationFieldRow label={t2.longDistanceLabel}>
          <AutomationOperatorNumberField
            value={draft.longDistanceThresholdKm}
            unit={t2.longDistanceUnit}
            operatorLocked
            operators={['≥']}
            onChange={(next) =>
              updateField('longDistanceThresholdKm', { ...next, operator: '≥' })
            }
          />
        </AutomationFieldRow>
        <AutomationFieldRow label={t2.companionDropLabel}>
          <AutomationOperatorNumberField
            value={draft.companionDropKm}
            unit={t2.companionDropUnit}
            operatorLocked
            operators={['≤']}
            onChange={(next) => updateField('companionDropKm', { ...next, operator: '≤' })}
          />
        </AutomationFieldRow>
        <AutomationFieldRow label={t2.holdWindowLabel}>
          <AutomationDurationField
            value={draft.holdWindow}
            operatorLocked
            operators={['≤']}
            onChange={(next) => updateField('holdWindow', { ...next, operator: '≤' })}
          />
        </AutomationFieldRow>
        <AutomationFieldRow label={t2.reevaluateLabel}>
          <ToggleWithLabel
            checked={draft.reevaluateAtStage3}
            label={t2.reevaluateToggleLabel}
            onChange={(next) => updateField('reevaluateAtStage3', next)}
          />
        </AutomationFieldRow>
      </AutomationSectionCard>

      <AutomationSectionCard
        title={t3.title}
        subtitle={t3.subtitle}
        actions={
          <AutomationStatusPill tone={t3.statusTone} showDot>
            {t3.status}
          </AutomationStatusPill>
        }
      >
        <AutomationFieldRow label={t3.pickupRadiusLabel}>
          <AutomationOperatorNumberField
            value={draft.interVendorPickupRadiusKm}
            unit={t3.pickupRadiusUnit}
            operatorLocked
            operators={['≤']}
            onChange={(next) =>
              updateField('interVendorPickupRadiusKm', { ...next, operator: '≤' })
            }
          />
        </AutomationFieldRow>
        <AutomationFieldRow label={t3.requiredFailedOffersLabel}>
          <AutomationOperatorNumberField
            value={draft.requiredFailedOffers}
            unit={t3.requiredFailedOffersUnit}
            operatorLocked
            operators={['≥']}
            onChange={(next) =>
              updateField('requiredFailedOffers', { ...next, operator: '≥' })
            }
          />
        </AutomationFieldRow>
        <AutomationFieldRow label={t3.enabledLabel}>
          <ToggleWithLabel
            checked={draft.trigger3Enabled}
            label={t3.enabledToggleLabel}
            onChange={(next) => updateField('trigger3Enabled', next)}
          />
        </AutomationFieldRow>
      </AutomationSectionCard>
    </>
  )
}

/** Read-only stacking activity from overview API. */
export function StackingActivityPanel({ title, emptyLabel, rows }) {
  const list = Array.isArray(rows) ? rows : []
  return (
    <AutomationSectionCard title={title}>
      {list.length === 0 ? (
        <p className="px-1 py-2 text-[12.5px] text-[#6b7280]">{emptyLabel}</p>
      ) : (
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left text-[12px]">
            <thead>
              <tr className="bg-[#f3f4f6] text-[#6b7280]">
                <th className="px-3 py-2 font-semibold">When</th>
                <th className="px-3 py-2 font-semibold">Trigger</th>
                <th className="px-3 py-2 font-semibold">Orders</th>
                <th className="px-3 py-2 font-semibold">Vendor</th>
                <th className="px-3 py-2 font-semibold">Vehicle</th>
                <th className="px-3 py-2 font-semibold">SLA</th>
                <th className="px-3 py-2 font-semibold">Outcome</th>
              </tr>
            </thead>
            <tbody>
              {list.map((row) => (
                <tr key={row.id || `${row.trigger}-${row.at}`} className="border-t border-[#e5e7eb]">
                  <td className="px-3 py-2 text-[#6b7280]">
                    {row.at ? new Date(row.at).toLocaleString() : '—'}
                  </td>
                  <td className="px-3 py-2 font-medium text-[#111827]">{row.triggerLabel}</td>
                  <td className="px-3 py-2">{row.orderCount}</td>
                  <td className="px-3 py-2">{row.vendorName}</td>
                  <td className="px-3 py-2">{row.vehicleType}</td>
                  <td className="px-3 py-2">
                    {row.slaClear ? (
                      <span className="text-[#15803d]">Clear</span>
                    ) : (
                      <span className="text-[#dc2626]">At risk</span>
                    )}
                  </td>
                  <td className="px-3 py-2">{row.outcome}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AutomationSectionCard>
  )
}
