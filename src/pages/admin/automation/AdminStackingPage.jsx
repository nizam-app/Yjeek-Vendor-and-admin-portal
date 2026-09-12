import { useMemo, useState } from 'react'
import { AutomationCallout } from '../../../components/admin/automation/AutomationCallout'
import {
  AutomationDurationField,
  AutomationOperatorNumberField,
} from '../../../components/admin/automation/AutomationFields'
import {
  AutomationFieldRow,
  AutomationSectionCard,
} from '../../../components/admin/automation/AutomationSectionCard'
import { AutomationStatusPill } from '../../../components/admin/automation/AutomationStatusPill'
import { VehicleStackingCapacityTable } from '../../../components/admin/automation/VehicleStackingCapacityTable'
import { Button } from '../../../components/admin/Button'
import { ToggleSwitch } from '../../../components/admin/ui-editor/ExclusiveOfferRow'
import {
  cloneStackingEditable,
  createStackingEditableDefaults,
  getStackingMock,
} from '../../../mocks/adminAutomationStacking.mock'
import { showInfo, showSuccess } from '../../../utils/toast'

function ToggleWithLabel({ checked, onChange, label, disabled = false }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <ToggleSwitch checked={checked} onChange={onChange} label={label} disabled={disabled} />
      <span className="text-[12px] text-[#6b7280]">{label}</span>
    </div>
  )
}

export default function AdminStackingPage() {
  const catalog = useMemo(() => getStackingMock(), [])
  const [baseline, setBaseline] = useState(() =>
    cloneStackingEditable(catalog.editable || createStackingEditableDefaults()),
  )
  const [draft, setDraft] = useState(() => cloneStackingEditable(baseline))

  function updateField(key, value) {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  function persistLocal(message) {
    const next = cloneStackingEditable(draft)
    setBaseline(next)
    setDraft(cloneStackingEditable(next))
    showSuccess(message)
  }

  function handleSaveChanges() {
    persistLocal('Stacking saved locally via Save Changes (frontend mock only). Backend was not updated.')
  }

  function handleReset() {
    setDraft(cloneStackingEditable(baseline))
    showInfo('Stacking fields restored to the last saved local mock values.')
  }

  function handleSaveAutomation() {
    persistLocal(
      'Stacking saved locally via Save Automation (frontend mock only). Backend was not updated.',
    )
  }

  return (
    <div className="pb-20">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[17px] font-bold text-[#111827]">{catalog.header.title}</h2>
          <p className="mt-1 text-[12px] text-[#6b7280]">{catalog.header.subtitle}</p>
        </div>
        <button
          type="button"
          onClick={handleSaveChanges}
          className="inline-flex h-[34px] items-center gap-1.5 rounded-[7px] border border-[#1D6A33] bg-[#1D6A33] px-3.5 text-[12px] font-semibold text-white transition hover:bg-[#114225]"
        >
          Save Changes
        </button>
      </div>

      <AutomationCallout tone="green" label={catalog.corePrinciple.label} className="!mx-0 mb-5">
        <p>{catalog.corePrinciple.body}</p>
      </AutomationCallout>

      <AutomationSectionCard title={catalog.vehicleCapacity.title}>
        <VehicleStackingCapacityTable
          columns={catalog.vehicleCapacity.columns}
          rows={catalog.vehicleCapacity.rows}
        />
      </AutomationSectionCard>

      <AutomationSectionCard
        title={catalog.trigger1.title}
        subtitle={catalog.trigger1.subtitle}
        actions={
          <AutomationStatusPill tone={catalog.trigger1.statusTone} showDot>
            {catalog.trigger1.status}
          </AutomationStatusPill>
        }
      >
        <AutomationFieldRow label={catalog.trigger1.dropZoneLabel}>
          <AutomationOperatorNumberField
            value={draft.dropZoneRadiusKm}
            unit={catalog.trigger1.dropZoneUnit}
            operatorLocked
            operators={['≤']}
            onChange={(next) => updateField('dropZoneRadiusKm', { ...next, operator: '≤' })}
          />
        </AutomationFieldRow>
        <AutomationFieldRow label={catalog.trigger1.bikeStackingLabel}>
          <AutomationStatusPill tone="off">{catalog.trigger1.bikeStackingBadge}</AutomationStatusPill>
        </AutomationFieldRow>
        <AutomationFieldRow label={catalog.trigger1.multiVendorLabel}>
          <ToggleWithLabel
            checked={false}
            disabled
            label={catalog.trigger1.multiVendorToggleLabel}
            onChange={() => {}}
          />
        </AutomationFieldRow>
      </AutomationSectionCard>

      <AutomationSectionCard
        title={catalog.trigger2.title}
        subtitle={catalog.trigger2.subtitle}
        actions={
          <AutomationStatusPill tone={catalog.trigger2.statusTone} showDot>
            {catalog.trigger2.status}
          </AutomationStatusPill>
        }
      >
        <AutomationFieldRow label={catalog.trigger2.longDistanceLabel}>
          <AutomationOperatorNumberField
            value={draft.longDistanceThresholdKm}
            unit={catalog.trigger2.longDistanceUnit}
            operatorLocked
            operators={['≥']}
            onChange={(next) => updateField('longDistanceThresholdKm', { ...next, operator: '≥' })}
          />
        </AutomationFieldRow>
        <AutomationFieldRow label={catalog.trigger2.holdWindowLabel}>
          <AutomationDurationField
            value={draft.holdWindow}
            operatorLocked
            operators={['≤']}
            onChange={(next) => updateField('holdWindow', { ...next, operator: '≤' })}
          />
        </AutomationFieldRow>
        <AutomationFieldRow label={catalog.trigger2.reevaluateLabel}>
          <ToggleWithLabel
            checked={draft.reevaluateAtStage3}
            label={catalog.trigger2.reevaluateToggleLabel}
            onChange={(next) => updateField('reevaluateAtStage3', next)}
          />
        </AutomationFieldRow>
      </AutomationSectionCard>

      <AutomationSectionCard
        title={catalog.trigger3.title}
        subtitle={catalog.trigger3.subtitle}
        actions={
          <AutomationStatusPill tone={catalog.trigger3.statusTone} showDot>
            {catalog.trigger3.status}
          </AutomationStatusPill>
        }
      >
        <AutomationFieldRow label={catalog.trigger3.pickupRadiusLabel}>
          <AutomationOperatorNumberField
            value={draft.interVendorPickupRadiusKm}
            unit={catalog.trigger3.pickupRadiusUnit}
            operatorLocked
            operators={['≤']}
            onChange={(next) =>
              updateField('interVendorPickupRadiusKm', { ...next, operator: '≤' })
            }
          />
        </AutomationFieldRow>
        <AutomationFieldRow label={catalog.trigger3.enabledLabel}>
          <ToggleWithLabel
            checked={draft.trigger3Enabled}
            label={catalog.trigger3.enabledToggleLabel}
            onChange={(next) => updateField('trigger3Enabled', next)}
          />
        </AutomationFieldRow>
      </AutomationSectionCard>

      <div className="sticky bottom-0 z-10 -mx-5 mt-2 flex items-center justify-end gap-2.5 border-t border-[#e5e7eb] bg-white px-5 py-3 max-[700px]:-mx-3 max-[700px]:px-3">
        <Button type="button" onClick={handleReset} className="rounded-full px-5">
          Reset
        </Button>
        <Button type="button" primary onClick={handleSaveAutomation} className="rounded-full px-6">
          Save Automation
        </Button>
      </div>
    </div>
  )
}
