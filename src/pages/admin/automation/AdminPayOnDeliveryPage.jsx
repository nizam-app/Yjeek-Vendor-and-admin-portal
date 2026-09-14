import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { ApiState } from '../../../components/admin/ApiState'
import { AutomationCallout } from '../../../components/admin/automation/AutomationCallout'
import { AutomationOperatorNumberField } from '../../../components/admin/automation/AutomationFields'
import {
  AutomationFieldRow,
  AutomationSectionCard,
} from '../../../components/admin/automation/AutomationSectionCard'
import { PodChampPermissionsTable } from '../../../components/admin/automation/PodChampPermissionsTable'
import { Button } from '../../../components/admin/Button'
import { ToggleSwitch } from '../../../components/admin/ui-editor/ExclusiveOfferRow'
import { formatApiErrorMessage } from '../../../api/errors'
import {
  clonePodEditable,
  createPodEditableDefaults,
  editableFromPodApi,
  getPayOnDeliveryMock,
  validatePodSettings,
} from '../../../mocks/adminAutomationPayOnDelivery.mock'
import { isAutomationRealApi } from '../../../services/admin/dispatchAutomationFeature'
import { adminPodAutomationService } from '../../../services/admin/podAutomationService'
import { showError, showInfo, showSuccess } from '../../../utils/toast'

function MockPayOnDeliveryPage() {
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
      `${champ.name} is near the cash-float limit (${champ.currentCashBhd} / ${champ.maxFloatBhd} BHD). Display only — no account suspension was triggered.`,
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
              disputes30d: null,
              effectivePodEligible: true,
              floatBlocked: false,
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
      'Pay on Delivery saved locally via Save (frontend mock only). Backend was not updated.',
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

      <AutomationCallout tone="amber" label={catalog.scoringNote.label} className="!mx-0 mt-5">
        <p>{catalog.scoringNote.body}</p>
      </AutomationCallout>

      <div className="sticky bottom-0 z-10 -mx-5 mt-2 flex items-center justify-end gap-2.5 border-t border-[#e5e7eb] bg-white px-5 py-3 max-[700px]:-mx-3 max-[700px]:px-3">
        <Button type="button" onClick={handleReset} className="rounded-full px-5">
          Reset
        </Button>
        <Button type="button" primary onClick={handleSaveAutomation} className="rounded-full px-6">
          Save POD settings
        </Button>
      </div>
    </div>
  )
}

function RealPayOnDeliveryPage() {
  const catalog = useMemo(() => getPayOnDeliveryMock(), [])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [baseline, setBaseline] = useState(null)
  const [draft, setDraft] = useState(null)
  const [validationError, setValidationError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [actionBusyId, setActionBusyId] = useState(null)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const page = await adminPodAutomationService.loadPage()
      const editable = editableFromPodApi(page.settings, page.champs)
      setBaseline(clonePodEditable(editable))
      setDraft(clonePodEditable(editable))
      setValidationError(null)
    } catch (err) {
      setBaseline(null)
      setDraft(null)
      setError(formatApiErrorMessage(err, 'Failed to load POD data from Fleet / SystemConfig.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  function updateField(key, value) {
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev))
    setValidationError(null)
  }

  async function handleSavePodSettings() {
    if (!draft) return
    const errorMsg = validatePodSettings(draft)
    if (errorMsg) {
      setValidationError(errorMsg)
      showError(errorMsg)
      return
    }
    setSaving(true)
    try {
      await adminPodAutomationService.saveGlobalSettings(draft)
      showSuccess('POD global settings saved to SystemConfig (not DispatchRuleSet).')
      await reload()
    } catch (err) {
      showError(formatApiErrorMessage(err, 'Failed to save POD settings.'))
    } finally {
      setSaving(false)
    }
  }

  async function handleEnable(champ) {
    setActionBusyId(champ.id)
    try {
      await adminPodAutomationService.setChampPodEnabled(champ.id, true)
      showSuccess(`${champ.name}: manual POD enabled.`)
      await reload()
    } catch (err) {
      showError(formatApiErrorMessage(err, 'Failed to enable POD.'))
    } finally {
      setActionBusyId(null)
    }
  }

  async function handleDisable(champ) {
    setActionBusyId(champ.id)
    try {
      await adminPodAutomationService.setChampPodEnabled(champ.id, false)
      showSuccess(`${champ.name}: manual POD disabled.`)
      await reload()
    } catch (err) {
      showError(formatApiErrorMessage(err, 'Failed to disable POD.'))
    } finally {
      setActionBusyId(null)
    }
  }

  async function handleReconcile(champ) {
    const ok = window.confirm(
      `Full POD reconciliation for ${champ.name}?\n\nThis resets all outstanding cash ledgers to zero (audit amount only — not a partial subtract).`,
    )
    if (!ok) return
    setActionBusyId(champ.id)
    try {
      await adminPodAutomationService.reconcileChampPodFull(champ.id, {
        note: 'Automation POD page — full reconcile',
      })
      showSuccess(`${champ.name}: full POD reconciliation completed.`)
      await reload()
    } catch (err) {
      showError(formatApiErrorMessage(err, 'Failed to reconcile POD cash.'))
    } finally {
      setActionBusyId(null)
    }
  }

  function handleEdit(champ) {
    const raw = window.prompt(
      `Set per-Champ max float (BHD) for ${champ.name}.\nUse 0 to inherit the global default.`,
      String(champ.maxFloatBhd ?? ''),
    )
    if (raw == null) return
    const next = Number.parseFloat(raw)
    if (!Number.isFinite(next) || next < 0) {
      showError('Max float must be a non-negative number.')
      return
    }
    setActionBusyId(champ.id)
    adminPodAutomationService
      .setChampPodMaxFloat(champ.id, next)
      .then(async () => {
        showSuccess(`${champ.name}: max float updated.`)
        await reload()
      })
      .catch((err) => {
        showError(formatApiErrorMessage(err, 'Failed to update max float.'))
      })
      .finally(() => setActionBusyId(null))
  }

  function handleEnableSelected() {
    showInfo(
      'Bulk enable is not implemented. Use Enable on individual Champ rows (Fleet API).',
    )
  }

  function handleReset() {
    if (!baseline) return
    setDraft(clonePodEditable(baseline))
    setValidationError(null)
    showInfo('POD draft restored to last loaded SystemConfig values.')
  }

  if (loading) {
    return <ApiState status="loading" message="Loading POD Fleet + SystemConfig…" />
  }

  if (error || !draft) {
    return (
      <ApiState
        status="error"
        message={error || 'POD data unavailable.'}
        onRetry={reload}
      />
    )
  }

  return (
    <div className="pb-20">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[17px] font-bold text-[#111827]">{catalog.header.title}</h2>
          <p className="mt-1 text-[12px] text-[#6b7280]">
            Live Fleet + SystemConfig.platformSettings.pod · not DispatchRuleSet
          </p>
        </div>
        <button
          type="button"
          onClick={handleEnableSelected}
          className="inline-flex h-[34px] items-center gap-1.5 rounded-[7px] border border-[#d1d5db] bg-white px-3.5 text-[12px] font-semibold text-[#6b7280]"
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
          realMode
          columns={catalog.champTable.columns}
          champs={draft.champs}
          warningThresholdPercent={draft.warningThresholdPercent?.value}
          onEdit={actionBusyId ? undefined : handleEdit}
          onEnable={actionBusyId ? undefined : handleEnable}
          onDisable={actionBusyId ? undefined : handleDisable}
          onReconcile={actionBusyId ? undefined : handleReconcile}
        />
      </AutomationSectionCard>

      <AutomationCallout tone="amber" label={catalog.scoringNote.label} className="!mx-0 mt-5">
        <p>{catalog.scoringNote.body}</p>
      </AutomationCallout>

      <div className="sticky bottom-0 z-10 -mx-5 mt-2 flex items-center justify-end gap-2.5 border-t border-[#e5e7eb] bg-white px-5 py-3 max-[700px]:-mx-3 max-[700px]:px-3">
        <Button type="button" onClick={handleReset} disabled={saving} className="rounded-full px-5">
          Reset
        </Button>
        <Button
          type="button"
          primary
          onClick={handleSavePodSettings}
          disabled={saving}
          className="rounded-full px-6"
        >
          {saving ? 'Saving…' : 'Save POD settings'}
        </Button>
      </div>
    </div>
  )
}

export default function AdminPayOnDeliveryPage() {
  if (!isAutomationRealApi()) return <MockPayOnDeliveryPage />
  return <RealPayOnDeliveryPage />
}
