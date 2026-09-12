import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { AutomationCallout } from '../../../components/admin/automation/AutomationCallout'
import { AutomationOperatorNumberField } from '../../../components/admin/automation/AutomationFields'
import {
  AutomationFieldRow,
  AutomationSectionCard,
} from '../../../components/admin/automation/AutomationSectionCard'
import { PodChampPermissionsTable } from '../../../components/admin/automation/PodChampPermissionsTable'
import { Button } from '../../../components/admin/Button'
import { ToggleSwitch } from '../../../components/admin/ui-editor/ExclusiveOfferRow'
import {
  clonePodEditable,
  createPodEditableDefaults,
  getPayOnDeliveryMock,
  validatePodSettings,
} from '../../../mocks/adminAutomationPayOnDelivery.mock'
import { showError, showInfo, showSuccess } from '../../../utils/toast'

export default function AdminPayOnDeliveryPage() {
  const catalog = useMemo(() => getPayOnDeliveryMock(), [])
  const [baseline, setBaseline] = useState(() =>
    clonePodEditable(catalog.editable || createPodEditableDefaults()),
  )
  const [draft, setDraft] = useState(() => clonePodEditable(baseline))
  const [validationError, setValidationError] = useState(null)

  function updateField(key, value) {
    setDraft((prev) => ({ ...prev, [key]: value }))
    setValidationError(null)
  }

  function tryPersist(message) {
    const error = validatePodSettings(draft)
    if (error) {
      setValidationError(error)
      showError(error)
      return
    }
    const next = clonePodEditable(draft)
    setBaseline(next)
    setDraft(clonePodEditable(next))
    setValidationError(null)
    showSuccess(message)
  }

  function handleEnableSelected() {
    showInfo(
      'Enable POD for selected is frontend-only in this phase. No row selection UI is defined in the approved reference, so no bulk change was applied.',
    )
  }

  function handleEdit(champ) {
    showInfo(
      `Edit POD for ${champ.name} is not fully specified in the approved reference. No editor modal was invented. Local mock only.`,
    )
  }

  function handleNearLimit(champ) {
    showInfo(
      `${champ.name} is near the cash-float limit (${champ.currentCashBhd} / ${champ.maxFloatBhd} BHD). Display only — no suspension was triggered.`,
    )
  }

  function handleEnable(champ) {
    const defaultFloat = Number.parseFloat(draft.defaultMaxFloatBhd?.value)
    const maxFloat = Number.isFinite(defaultFloat) && defaultFloat > 0 ? defaultFloat : 100
    setDraft((prev) => ({
      ...prev,
      champs: prev.champs.map((row) =>
        row.id === champ.id
          ? {
              ...row,
              podEnabled: true,
              maxFloatBhd: maxFloat,
              currentCashBhd: 0,
              disputes30d: 0,
            }
          : row,
      ),
    }))
    showInfo(
      `${champ.name} POD enabled in local mock only (max float ${maxFloat} BHD). Backend was not updated.`,
    )
  }

  function handleReset() {
    setDraft(clonePodEditable(baseline))
    setValidationError(null)
    showInfo('Pay on Delivery fields restored to the last saved local mock values.')
  }

  function handleSaveAutomation() {
    tryPersist(
      'Pay on Delivery saved locally via Save Automation (frontend mock only). Backend was not updated.',
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
          onClick={handleEnableSelected}
          className="inline-flex h-[34px] items-center gap-1.5 rounded-[7px] border border-[#1D6A33] bg-[#1D6A33] px-3.5 text-[12px] font-semibold text-white transition hover:bg-[#114225]"
        >
          <Plus size={14} strokeWidth={2.2} aria-hidden />
          Enable POD for selected
        </button>
      </div>

      <AutomationCallout tone="amber" label={catalog.banner.label} className="!mx-0 mb-5">
        <p>{catalog.banner.body}</p>
      </AutomationCallout>

      <AutomationSectionCard title={catalog.globalSettings.title}>
        <AutomationFieldRow label={catalog.globalSettings.defaultFloatLabel}>
          <AutomationOperatorNumberField
            value={draft.defaultMaxFloatBhd}
            unit={catalog.globalSettings.defaultFloatUnit}
            operatorLocked
            operators={['≤']}
            onChange={(next) => updateField('defaultMaxFloatBhd', { ...next, operator: '≤' })}
          />
        </AutomationFieldRow>
        <AutomationFieldRow label={catalog.globalSettings.warningLabel}>
          <AutomationOperatorNumberField
            value={draft.warningThresholdPercent}
            unit={catalog.globalSettings.warningUnit}
            operatorLocked
            operators={['≥']}
            onChange={(next) =>
              updateField('warningThresholdPercent', { ...next, operator: '≥' })
            }
          />
        </AutomationFieldRow>
        <AutomationFieldRow label={catalog.globalSettings.autoSuspendLabel}>
          <div className="flex flex-wrap items-center gap-2">
            <ToggleSwitch
              checked={draft.autoSuspendOnBreach}
              label={catalog.globalSettings.autoSuspendToggleLabel}
              onChange={(next) => updateField('autoSuspendOnBreach', next)}
            />
            <span className="text-[12px] text-[#6b7280]">
              {catalog.globalSettings.autoSuspendToggleLabel}
            </span>
          </div>
        </AutomationFieldRow>
        {validationError ? (
          <div className="border-t border-[#f2cccc] bg-[#fff5f5] px-5 py-3 text-[12.5px] text-[#a93e42]">
            {validationError}
          </div>
        ) : null}
      </AutomationSectionCard>

      <AutomationSectionCard title={catalog.champTable.title}>
        <PodChampPermissionsTable
          columns={catalog.champTable.columns}
          champs={draft.champs}
          warningThresholdPercent={draft.warningThresholdPercent?.value}
          onEdit={handleEdit}
          onEnable={handleEnable}
          onNearLimit={handleNearLimit}
        />
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
