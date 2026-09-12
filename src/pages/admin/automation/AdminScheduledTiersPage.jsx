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
  validateScheduledTiers,
} from '../../../mocks/adminAutomationScheduledTiers.mock'
import { showError, showInfo, showSuccess } from '../../../utils/toast'

function PaymentToggle({ checked, label, onChange }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <ToggleSwitch checked={checked} label={label} onChange={onChange} />
      <span className="text-[12px] font-semibold text-[#15803d]">{label}</span>
    </div>
  )
}

export default function AdminScheduledTiersPage() {
  const catalog = useMemo(() => getScheduledTiersMock(), [])
  const [baseline, setBaseline] = useState(() =>
    cloneScheduledTiersEditable(catalog.editable || createScheduledTiersEditableDefaults()),
  )
  const [draft, setDraft] = useState(() => cloneScheduledTiersEditable(baseline))
  const [validationError, setValidationError] = useState(null)

  function updateTier(tierKey, patch) {
    setDraft((prev) => ({
      ...prev,
      [tierKey]: { ...prev[tierKey], ...patch },
    }))
    setValidationError(null)
  }

  function tryPersist(message) {
    const error = validateScheduledTiers(draft)
    if (error) {
      setValidationError(error)
      showError(error)
      return
    }
    const next = cloneScheduledTiersEditable(draft)
    setBaseline(next)
    setDraft(cloneScheduledTiersEditable(next))
    setValidationError(null)
    showSuccess(message)
  }

  function handleSaveChanges() {
    tryPersist(
      'Scheduled Tiers saved locally via Save Changes (frontend mock only). Backend was not updated.',
    )
  }

  function handleReset() {
    setDraft(cloneScheduledTiersEditable(baseline))
    setValidationError(null)
    showInfo('Scheduled Tiers fields restored to the last saved local mock values.')
  }

  function handleSaveAutomation() {
    tryPersist(
      'Scheduled Tiers saved locally via Save Automation (frontend mock only). Backend was not updated.',
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

      <AutomationCallout tone="amber" label={catalog.paymentBanner.label} className="!mx-0 mb-5">
        <p>{catalog.paymentBanner.body}</p>
      </AutomationCallout>

      {validationError ? (
        <div className="mb-4 rounded-[10px] border border-[#f2cccc] bg-[#fff5f5] px-4 py-3 text-[12.5px] text-[#a93e42]">
          {validationError}
        </div>
      ) : null}

      <AutomationSectionCard title={catalog.sameDay.title}>
        <AutomationFieldRow label="Order cutoff">
          <AutomationDurationField
            value={draft.sameDay.cutoffTime}
            operatorLocked
            operators={['≤']}
            hourMax={23}
            hint={catalog.sameDay.cutoffHint}
            onChange={(next) => updateTier('sameDay', { cutoffTime: { ...next, operator: '≤' } })}
          />
        </AutomationFieldRow>
        <AutomationFieldRow label="Engine batch fires at">
          <AutomationClockTimeField
            value={draft.sameDay.batchTime}
            onChange={(batchTime) => updateTier('sameDay', { batchTime })}
          />
        </AutomationFieldRow>
        <AutomationFieldRow label="Assignment KPI — all routed within">
          <AutomationDurationField
            value={draft.sameDay.assignmentKpi}
            operatorLocked
            operators={['≤']}
            hourMax={23}
            hint={catalog.sameDay.assignmentHint}
            onChange={(next) =>
              updateTier('sameDay', { assignmentKpi: { ...next, operator: '≤' } })
            }
          />
        </AutomationFieldRow>
        <AutomationFieldRow label="Delivery window upper bound">
          <AutomationClockTimeField
            value={draft.sameDay.deliveryUpperBound}
            hint={catalog.sameDay.deliveryHint}
            onChange={(deliveryUpperBound) => updateTier('sameDay', { deliveryUpperBound })}
          />
        </AutomationFieldRow>
        <AutomationFieldRow label="5-minute payment window">
          <AutomationStatusPill tone="off">{catalog.sameDay.paymentNa}</AutomationStatusPill>
        </AutomationFieldRow>
        <AutomationFieldRow label="Double-confirm required when slot">
          <AutomationOperatorNumberField
            value={draft.sameDay.doubleConfirmHours}
            unit={catalog.sameDay.doubleConfirmUnit}
            operatorLocked
            operators={['≥']}
            onChange={(next) =>
              updateTier('sameDay', { doubleConfirmHours: { ...next, operator: '≥' } })
            }
          />
        </AutomationFieldRow>
      </AutomationSectionCard>

      <AutomationSectionCard title={catalog.nextDay.title}>
        <AutomationFieldRow label="Order cutoff">
          <AutomationDurationField
            value={draft.nextDay.cutoffTime}
            operatorLocked
            operators={['≤']}
            hourMax={23}
            onChange={(next) => updateTier('nextDay', { cutoffTime: { ...next, operator: '≤' } })}
          />
        </AutomationFieldRow>
        <AutomationFieldRow label="Engine nightly batch fires at">
          <AutomationClockTimeField
            value={draft.nextDay.batchTime}
            onChange={(batchTime) => updateTier('nextDay', { batchTime })}
          />
        </AutomationFieldRow>
        <AutomationFieldRow label="Assignment KPI">
          <AutomationDurationField
            value={draft.nextDay.assignmentKpi}
            operatorLocked
            operators={['≤']}
            hourMax={23}
            onChange={(next) =>
              updateTier('nextDay', { assignmentKpi: { ...next, operator: '≤' } })
            }
          />
        </AutomationFieldRow>
        <AutomationFieldRow label="5-minute payment window after vendor accept">
          <PaymentToggle
            checked={draft.nextDay.paymentWindowEnabled}
            label={catalog.nextDay.paymentToggleLabel}
            onChange={(paymentWindowEnabled) => updateTier('nextDay', { paymentWindowEnabled })}
          />
        </AutomationFieldRow>
        <AutomationFieldRow label="Double-confirm threshold">
          <AutomationOperatorNumberField
            value={draft.nextDay.doubleConfirmHours}
            unit={catalog.nextDay.doubleConfirmUnit}
            operatorLocked
            operators={['≥']}
            onChange={(next) =>
              updateTier('nextDay', { doubleConfirmHours: { ...next, operator: '≥' } })
            }
          />
        </AutomationFieldRow>
      </AutomationSectionCard>

      <AutomationSectionCard title={catalog.standard.title}>
        <AutomationFieldRow label="Order cutoff">
          <AutomationStatusPill tone="on">{catalog.standard.rollingBadge}</AutomationStatusPill>
        </AutomationFieldRow>
        <AutomationFieldRow label="Assignment KPI">
          <AutomationDurationField
            value={draft.standard.assignmentKpi}
            operatorLocked
            operators={['≤']}
            hourMax={99}
            hint={catalog.standard.assignmentHint}
            onChange={(next) =>
              updateTier('standard', { assignmentKpi: { ...next, operator: '≤' } })
            }
          />
        </AutomationFieldRow>
        <AutomationFieldRow label="Delivery window">
          <AutomationStatusPill tone="on">{catalog.standard.deliveryBadge}</AutomationStatusPill>
        </AutomationFieldRow>
        <AutomationFieldRow label="5-minute payment window after vendor accept">
          <PaymentToggle
            checked={draft.standard.paymentWindowEnabled}
            label={catalog.standard.paymentToggleLabel}
            onChange={(paymentWindowEnabled) => updateTier('standard', { paymentWindowEnabled })}
          />
        </AutomationFieldRow>
      </AutomationSectionCard>

      <AutomationSectionCard title={catalog.economy.title}>
        <AutomationFieldRow label="Order cutoff">
          <AutomationStatusPill tone="on">{catalog.economy.rollingBadge}</AutomationStatusPill>
        </AutomationFieldRow>
        <AutomationFieldRow label="Assignment KPI">
          <AutomationDurationField
            value={draft.economy.assignmentKpi}
            operatorLocked
            operators={['≤']}
            hourMax={99}
            hint={catalog.economy.assignmentHint}
            onChange={(next) =>
              updateTier('economy', { assignmentKpi: { ...next, operator: '≤' } })
            }
          />
        </AutomationFieldRow>
        <AutomationFieldRow label="Delivery window">
          <AutomationStatusPill tone="on">{catalog.economy.deliveryBadge}</AutomationStatusPill>
        </AutomationFieldRow>
        <AutomationFieldRow label="5-minute payment window after vendor accept">
          <PaymentToggle
            checked={draft.economy.paymentWindowEnabled}
            label={catalog.economy.paymentToggleLabel}
            onChange={(paymentWindowEnabled) => updateTier('economy', { paymentWindowEnabled })}
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
