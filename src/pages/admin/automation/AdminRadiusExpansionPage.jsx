import { useMemo, useState } from 'react'
import {
  AutomationDurationField,
  AutomationOperatorNumberField,
} from '../../../components/admin/automation/AutomationFields'
import {
  AutomationFieldRow,
  AutomationSectionCard,
} from '../../../components/admin/automation/AutomationSectionCard'
import { RadiusEscalationStageChain } from '../../../components/admin/automation/RadiusEscalationStageChain'
import { Button } from '../../../components/admin/Button'
import {
  cloneRadiusExpansionEditable,
  createRadiusExpansionEditableDefaults,
  getRadiusExpansionMock,
  validateRadiusStageOrder,
} from '../../../mocks/adminAutomationRadiusExpansion.mock'
import { showError, showInfo, showSuccess } from '../../../utils/toast'

export default function AdminRadiusExpansionPage() {
  const catalog = useMemo(() => getRadiusExpansionMock(), [])
  const [baseline, setBaseline] = useState(() =>
    cloneRadiusExpansionEditable(catalog.editable || createRadiusExpansionEditableDefaults()),
  )
  const [draft, setDraft] = useState(() => cloneRadiusExpansionEditable(baseline))
  const [validationError, setValidationError] = useState(null)

  const stageChain = useMemo(() => {
    return catalog.stages.map((stage) => {
      if (stage.displayMode === 'open') {
        return { ...stage, displayValue: stage.openLabel }
      }
      const km = draft[stage.radiusKey]?.value
      return {
        ...stage,
        displayValue: km === '' || km == null ? '— km' : `${km} km`,
      }
    })
  }, [catalog.stages, draft])

  function updateField(key, value) {
    setDraft((prev) => ({ ...prev, [key]: value }))
    setValidationError(null)
  }

  function tryPersist(message) {
    const error = validateRadiusStageOrder(draft)
    if (error) {
      setValidationError(error)
      showError(error)
      return
    }
    const next = cloneRadiusExpansionEditable(draft)
    setBaseline(next)
    setDraft(cloneRadiusExpansionEditable(next))
    setValidationError(null)
    showSuccess(message)
  }

  function handleSaveChanges() {
    tryPersist(
      'Radius Expansion saved locally via Save Changes (frontend mock only). Backend was not updated.',
    )
  }

  function handleReset() {
    setDraft(cloneRadiusExpansionEditable(baseline))
    setValidationError(null)
    showInfo('Radius Expansion fields restored to the last saved local mock values.')
  }

  function handleSaveAutomation() {
    tryPersist(
      'Radius Expansion saved locally via Save Automation (frontend mock only). Backend was not updated.',
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

      <RadiusEscalationStageChain stages={stageChain} />

      <AutomationSectionCard title={catalog.radii.title}>
        {catalog.radii.rows.map((row) => (
          <AutomationFieldRow key={row.id} label={row.label}>
            <AutomationOperatorNumberField
              value={draft[row.fieldKey]}
              unit={row.unit}
              operatorLocked
              operators={['≤']}
              onChange={(next) => updateField(row.fieldKey, { ...next, operator: '≤' })}
            />
          </AutomationFieldRow>
        ))}
        {validationError ? (
          <div className="border-t border-[#f2cccc] bg-[#fff5f5] px-5 py-3 text-[12.5px] text-[#a93e42]">
            {validationError}
          </div>
        ) : null}
      </AutomationSectionCard>

      <AutomationSectionCard title={catalog.timers.title}>
        {catalog.timers.rows.map((row) => (
          <AutomationFieldRow key={row.id} label={row.label}>
            <AutomationDurationField
              value={draft[row.fieldKey]}
              operatorLocked
              operators={[row.operator]}
              onChange={(next) => updateField(row.fieldKey, { ...next, operator: row.operator })}
            />
          </AutomationFieldRow>
        ))}
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
