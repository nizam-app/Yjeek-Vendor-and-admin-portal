import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiState } from '../../../components/admin/ApiState'
import { AutomationOperatorNumberField } from '../../../components/admin/automation/AutomationFields'
import {
  AutomationFieldRow,
  AutomationSectionCard,
} from '../../../components/admin/automation/AutomationSectionCard'
import { PodChampPermissionsTable } from '../../../components/admin/automation/PodChampPermissionsTable'
import { POD_UI } from '../../../components/admin/automation/podUiCatalog'
import { Button } from '../../../components/admin/Button'
import { ToggleSwitch } from '../../../components/admin/ui-editor/ExclusiveOfferRow'
import { formatApiErrorMessage } from '../../../api/errors'
import {
  clonePodEditable,
  editableFromPodApi,
  validatePodSettings,
} from '../../../mappers/admin/mapAdminPodAutomation'
import { isAutomationRealApi } from '../../../services/admin/dispatchAutomationFeature'
import { adminPodAutomationService } from '../../../services/admin/podAutomationService'
import { showError, showInfo, showSuccess } from '../../../utils/toast'

/**
 * Automation → Pay on Delivery.
 * Live Fleet + SystemConfig.platformSettings.pod — no mock/demo champs.
 */
export default function AdminPayOnDeliveryPage() {
  if (!isAutomationRealApi()) {
    return (
      <div className="rounded-[10px] border border-[#fde68a] bg-[#fffbeb] px-4 py-3 text-[13px] text-[#92400e]">
        Enable the <code className="font-semibold">automation</code> feature flag
        (<code>VITE_ADMIN_REAL_API_FEATURES</code>) to load Pay on Delivery from live Fleet and
        SystemConfig. Mock data is not used.
      </div>
    )
  }

  return <RealPayOnDeliveryPage />
}

function RealPayOnDeliveryPage() {
  const catalog = POD_UI
  const navigate = useNavigate()
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
    navigate(`/admin/fleet/${encodeURIComponent(champ.id)}/edit`)
  }

  function handleReset() {
    if (!baseline) return
    setDraft(clonePodEditable(baseline))
    setValidationError(null)
    showInfo('POD draft restored to last loaded SystemConfig values.')
  }

  if (loading && !draft) {
    return <ApiState isLoading error={null} />
  }

  if (error && !draft) {
    return <ApiState isLoading={false} error={error} onRetry={() => reload()} />
  }

  if (!draft) {
    return (
      <div className="rounded-[10px] border border-[#e5e7eb] bg-white px-4 py-6 text-[13px] text-[#6b7280]">
        POD data unavailable.
      </div>
    )
  }

  return (
    <div className="pb-20">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[17px] font-bold text-[#111827]">{catalog.header.title}</h2>
          <p className="mt-1 text-[12px] text-[#6b7280]">
            Live Fleet + SystemConfig.platformSettings.pod · not DispatchRuleSet · no demo data
            {draft.champs?.length != null ? ` · ${draft.champs.length} champs` : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/admin/fleet')}
          className="inline-flex h-[34px] items-center gap-1.5 rounded-[7px] border border-[#d1d5db] bg-white px-3.5 text-[12px] font-semibold text-[#374151] transition hover:border-[#1D6A33] hover:text-[#1D6A33]"
        >
          Open Fleet
        </button>
      </div>

      {error ? (
        <div className="mb-4 rounded-[8px] border border-[#fde68a] bg-[#fffbeb] px-3.5 py-2.5 text-[12.5px] text-[#92400e]">
          {error}{' '}
          <button type="button" className="font-semibold underline" onClick={() => reload()}>
            Retry
          </button>
        </div>
      ) : null}

      <AutomationSectionCard title={catalog.globalSettings.title}>
        <AutomationFieldRow
          label={catalog.globalSettings.defaultFloatLabel}
          help={catalog.globalSettings.defaultFloatHelp}
        >
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
        {draft.champs.length === 0 ? (
          <p className="px-1 py-4 text-[12.5px] text-[#6b7280]">{catalog.champTable.empty}</p>
        ) : (
          <PodChampPermissionsTable
            columns={catalog.champTable.columns}
            champs={draft.champs}
            warningThresholdPercent={draft.warningThresholdPercent?.value}
            busyChampId={actionBusyId}
            onEdit={actionBusyId ? undefined : handleEdit}
            onEnable={actionBusyId ? undefined : handleEnable}
            onDisable={actionBusyId ? undefined : handleDisable}
            onReconcile={actionBusyId ? undefined : handleReconcile}
          />
        )}
      </AutomationSectionCard>

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
