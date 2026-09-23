import { useMemo, useState } from 'react'
import { AutomationCallout } from '../../../components/admin/automation/AutomationCallout'
import {
  AutomationClockTimeField,
  AutomationDurationField,
  AutomationOperatorNumberField,
} from '../../../components/admin/automation/AutomationFields'
import {
  AutomationFieldRow,
  AutomationSectionCard,
} from '../../../components/admin/automation/AutomationSectionCard'
import { AutomationStatusPill } from '../../../components/admin/automation/AutomationStatusPill'
import { Button } from '../../../components/admin/Button'
import { ToggleSwitch } from '../../../components/admin/ui-editor/ExclusiveOfferRow'
import {
  cloneScheduledTiersEditable,
  createScheduledTiersEditableDefaults,
  getScheduledTiersMock,
} from '../../../mocks/adminAutomationScheduledTiers.mock'
import { showInfo } from '../../../utils/toast'

function PaymentToggle({ checked, label }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <ToggleSwitch checked={checked} label={label} disabled onChange={() => undefined} />
      <span className="text-[12px] font-semibold text-[#15803d]">{label}</span>
    </div>
  )
}

/**
 * Reference display of scheduled-tier product rules.
 * Not connected to DispatchRuleSet or a dedicated Scheduled Tiers API.
 */
export default function AdminScheduledTiersPage() {
  const catalog = useMemo(() => getScheduledTiersMock(), [])
  const [display] = useState(() =>
    cloneScheduledTiersEditable(catalog.editable || createScheduledTiersEditableDefaults()),
  )

  function handleReferenceAction(action) {
    showInfo(
      `Scheduled Tiers is reference-only. ${action} does not save config or call an API. ` +
        'Tier cutoffs/batches are owned by scheduled-dispatch workers and related Admin modules — not editable here.',
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
          onClick={() => handleReferenceAction('Save Changes')}
          className="inline-flex h-[34px] items-center gap-1.5 rounded-[7px] border border-[#d1d5db] bg-white px-3.5 text-[12px] font-semibold text-[#374151] transition hover:border-[#1D6A33] hover:text-[#1D6A33]"
        >
          Save Changes
        </button>
      </div>

      <AutomationCallout tone="amber" label={catalog.paymentBanner.label} className="!mx-0 mb-5">
        <p>{catalog.paymentBanner.body}</p>
      </AutomationCallout>

      <AutomationSectionCard title={catalog.sameDay.title}>
        <AutomationFieldRow label="Order cutoff">
          <AutomationDurationField
            value={display.sameDay.cutoffTime}
            disabled
            operatorLocked
            operators={['≤']}
            hourMax={23}
            hint={catalog.sameDay.cutoffHint}
            onChange={() => undefined}
          />
        </AutomationFieldRow>
        <AutomationFieldRow label="Engine batch fires at">
          <AutomationClockTimeField
            value={display.sameDay.batchTime}
            disabled
            onChange={() => undefined}
          />
        </AutomationFieldRow>
        <AutomationFieldRow label="Assignment KPI — all routed within">
          <AutomationDurationField
            value={display.sameDay.assignmentKpi}
            disabled
            operatorLocked
            operators={['≤']}
            hourMax={23}
            hint={catalog.sameDay.assignmentHint}
            onChange={() => undefined}
          />
        </AutomationFieldRow>
        <AutomationFieldRow label="Delivery window upper bound">
          <AutomationClockTimeField
            value={display.sameDay.deliveryUpperBound}
            disabled
            hint={catalog.sameDay.deliveryHint}
            onChange={() => undefined}
          />
        </AutomationFieldRow>
        <AutomationFieldRow label="5-minute payment window">
          <AutomationStatusPill tone="off">{catalog.sameDay.paymentNa}</AutomationStatusPill>
        </AutomationFieldRow>
        <AutomationFieldRow label="Double-confirm required when slot">
          <AutomationOperatorNumberField
            value={display.sameDay.doubleConfirmHours}
            unit={catalog.sameDay.doubleConfirmUnit}
            disabled
            operatorLocked
            operators={['≥']}
            onChange={() => undefined}
          />
        </AutomationFieldRow>
      </AutomationSectionCard>

      <AutomationSectionCard title={catalog.nextDay.title}>
        <AutomationFieldRow label="Order cutoff">
          <AutomationDurationField
            value={display.nextDay.cutoffTime}
            disabled
            operatorLocked
            operators={['≤']}
            hourMax={23}
            onChange={() => undefined}
          />
        </AutomationFieldRow>
        <AutomationFieldRow label="Engine nightly batch fires at">
          <AutomationClockTimeField
            value={display.nextDay.batchTime}
            disabled
            onChange={() => undefined}
          />
        </AutomationFieldRow>
        <AutomationFieldRow label="Assignment KPI">
          <AutomationDurationField
            value={display.nextDay.assignmentKpi}
            disabled
            operatorLocked
            operators={['≤']}
            hourMax={23}
            onChange={() => undefined}
          />
        </AutomationFieldRow>
        <AutomationFieldRow label="5-minute payment window after vendor accept">
          <PaymentToggle
            checked={display.nextDay.paymentWindowEnabled}
            label={catalog.nextDay.paymentToggleLabel}
          />
        </AutomationFieldRow>
        <AutomationFieldRow label="Double-confirm threshold">
          <AutomationOperatorNumberField
            value={display.nextDay.doubleConfirmHours}
            unit={catalog.nextDay.doubleConfirmUnit}
            disabled
            operatorLocked
            operators={['≥']}
            onChange={() => undefined}
          />
        </AutomationFieldRow>
      </AutomationSectionCard>

      <AutomationSectionCard title={catalog.standard.title}>
        <AutomationFieldRow label="Order cutoff">
          <AutomationStatusPill tone="on">{catalog.standard.rollingBadge}</AutomationStatusPill>
        </AutomationFieldRow>
        <AutomationFieldRow label="Assignment KPI">
          <AutomationDurationField
            value={display.standard.assignmentKpi}
            disabled
            operatorLocked
            operators={['≤']}
            hourMax={99}
            hint={catalog.standard.assignmentHint}
            onChange={() => undefined}
          />
        </AutomationFieldRow>
        <AutomationFieldRow label="Delivery window">
          <AutomationStatusPill tone="on">{catalog.standard.deliveryBadge}</AutomationStatusPill>
        </AutomationFieldRow>
        <AutomationFieldRow label="5-minute payment window after vendor accept">
          <PaymentToggle
            checked={display.standard.paymentWindowEnabled}
            label={catalog.standard.paymentToggleLabel}
          />
        </AutomationFieldRow>
      </AutomationSectionCard>

      <AutomationSectionCard title={catalog.economy.title}>
        <AutomationFieldRow label="Order cutoff">
          <AutomationStatusPill tone="on">{catalog.economy.rollingBadge}</AutomationStatusPill>
        </AutomationFieldRow>
        <AutomationFieldRow label="Assignment KPI">
          <AutomationDurationField
            value={display.economy.assignmentKpi}
            disabled
            operatorLocked
            operators={['≤']}
            hourMax={99}
            hint={catalog.economy.assignmentHint}
            onChange={() => undefined}
          />
        </AutomationFieldRow>
        <AutomationFieldRow label="Delivery window">
          <AutomationStatusPill tone="on">{catalog.economy.deliveryBadge}</AutomationStatusPill>
        </AutomationFieldRow>
        <AutomationFieldRow label="5-minute payment window after vendor accept">
          <PaymentToggle
            checked={display.economy.paymentWindowEnabled}
            label={catalog.economy.paymentToggleLabel}
          />
        </AutomationFieldRow>
      </AutomationSectionCard>

      <div className="sticky bottom-0 z-10 -mx-5 mt-2 flex items-center justify-end gap-2.5 border-t border-[#e5e7eb] bg-white px-5 py-3 max-[700px]:-mx-3 max-[700px]:px-3">
        <Button
          type="button"
          onClick={() => handleReferenceAction('Reset')}
          className="rounded-full px-5"
        >
          Reset
        </Button>
        <Button
          type="button"
          primary
          onClick={() => handleReferenceAction('Save Automation')}
          className="rounded-full px-6"
        >
          Save Automation
        </Button>
      </div>
    </div>
  )
}
