import { useEffect, useMemo, useState } from 'react'
import { AutomationCallout } from '../../../components/admin/automation/AutomationCallout'
import { StackingEditorSections } from '../../../components/admin/automation/StackingEditorSections'
import { ApiState } from '../../../components/admin/ApiState'
import { Button } from '../../../components/admin/Button'
import { useDispatchRuleSet } from '../../../hooks/admin/useDispatchRuleSet'
import {
  applyStackingEdits,
  mapConfigToStackingCapacityRows,
  mapConfigToStackingEditable,
  validateStackingEdits,
} from '../../../mappers/admin/mapDispatchAutomation'
import {
  cloneStackingEditable,
  createStackingEditableDefaults,
  getStackingMock,
} from '../../../mocks/adminAutomationStacking.mock'
import { isAutomationRealApi } from '../../../services/admin/dispatchAutomationFeature'
import { showError, showInfo, showSuccess } from '../../../utils/toast'

function cloneEditable(editable) {
  return structuredClone(editable)
}

function MockStackingPage() {
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

  const capacityRows = catalog.vehicleCapacity.rows

  return (
    <div className="pb-20">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[17px] font-bold text-[#111827]">{catalog.header.title}</h2>
          <p className="mt-1 text-[12px] text-[#6b7280]">{catalog.header.subtitle}</p>
        </div>
        <button
          type="button"
          onClick={() =>
            persistLocal(
              'Stacking saved locally via Save Changes (frontend mock only). Backend was not updated.',
            )
          }
          className="inline-flex h-[34px] items-center gap-1.5 rounded-[7px] border border-[#1D6A33] bg-[#1D6A33] px-3.5 text-[12px] font-semibold text-white transition hover:bg-[#114225]"
        >
          Save Changes
        </button>
      </div>

      <AutomationCallout tone="green" label={catalog.corePrinciple.label} className="!mx-0 mb-5">
        <p>{catalog.corePrinciple.body}</p>
      </AutomationCallout>

      <StackingEditorSections
        catalog={catalog}
        draft={draft}
        updateField={updateField}
        capacityRows={capacityRows}
      />

      <div className="sticky bottom-0 z-10 -mx-5 mt-2 flex items-center justify-end gap-2.5 border-t border-[#e5e7eb] bg-white px-5 py-3 max-[700px]:-mx-3 max-[700px]:px-3">
        <Button
          type="button"
          onClick={() => {
            setDraft(cloneStackingEditable(baseline))
            showInfo('Stacking fields restored to the last saved local mock values.')
          }}
          className="rounded-full px-5"
        >
          Reset
        </Button>
        <Button
          type="button"
          primary
          onClick={() =>
            persistLocal(
              'Stacking saved locally via Save Automation (frontend mock only). Backend was not updated.',
            )
          }
          className="rounded-full px-6"
        >
          Save Automation
        </Button>
      </div>
    </div>
  )
}

function RealStackingPage() {
  const catalog = useMemo(() => getStackingMock(), [])
  const ruleSet = useDispatchRuleSet()
  const [baseline, setBaseline] = useState(null)
  const [draft, setDraft] = useState(null)
  const [serverConfig, setServerConfig] = useState(null)

  useEffect(() => {
    if (!ruleSet.draftConfig) return
    const editable = mapConfigToStackingEditable(ruleSet.draftConfig)
    setServerConfig(structuredClone(ruleSet.draftConfig))
    setBaseline(cloneEditable(editable))
    setDraft(cloneEditable(editable))
  }, [ruleSet.draftConfig, ruleSet.meta?.id, ruleSet.meta?.updatedAt])

  const dirty = useMemo(() => {
    if (!baseline || !draft) return false
    return JSON.stringify(baseline) !== JSON.stringify(draft)
  }, [baseline, draft])

  useEffect(() => {
    if (!dirty) return undefined
    const onBeforeUnload = (event) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [dirty])

  function updateField(key, value) {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSaveChanges() {
    if (!draft || !ruleSet.meta?.id) return
    const validationError = validateStackingEdits(draft)
    if (validationError) {
      showError(validationError)
      return
    }
    try {
      const result = await ruleSet.mergeAndPatch(applyStackingEdits, draft)
      const nextConfig = result?.data?.draftConfig
      if (!nextConfig) throw new Error('Save succeeded but draft config was missing.')
      if (nextConfig.stacking?.liveEnabled !== false) {
        throw new Error('Server returned liveEnabled=true — refusing to accept.')
      }
      const nextEditable = mapConfigToStackingEditable(nextConfig)
      setServerConfig(structuredClone(nextConfig))
      setBaseline(cloneEditable(nextEditable))
      setDraft(cloneEditable(nextEditable))
      showSuccess(
        'Stacking draft saved. liveEnabled remains false. Live dispatch unchanged until activate.',
      )
    } catch (error) {
      showError(error?.message || 'Failed to save stacking draft.')
    }
  }

  async function handleSaveAutomation() {
    if (!ruleSet.meta?.id) return
    if (dirty) {
      showInfo('Save Changes first, then activate — activation publishes the server draft.')
      return
    }
    const confirmed = window.confirm(
      `Activate DispatchRuleSet “${ruleSet.meta.name || ruleSet.meta.id}” (v${ruleSet.meta.version})?\n\nStacking liveEnabled stays false. This can still change other published dispatch config.`,
    )
    if (!confirmed) return
    try {
      const result = await ruleSet.activate('Activated from Automation → Stacking')
      const nextConfig = result?.data?.draftConfig
      if (nextConfig) {
        const nextEditable = mapConfigToStackingEditable(nextConfig)
        setServerConfig(structuredClone(nextConfig))
        setBaseline(cloneEditable(nextEditable))
        setDraft(cloneEditable(nextEditable))
      }
      showSuccess(`Activated version ${result?.data?.meta?.version ?? ''}`.trim())
    } catch (error) {
      showError(error?.message || 'Activation failed. Previous active version remains.')
    }
  }

  if (ruleSet.isLoading && !draft) return <ApiState isLoading error={null} />
  if (ruleSet.error && !draft) {
    return <ApiState isLoading={false} error={ruleSet.error} onRetry={ruleSet.refetch} />
  }
  if (!draft) return <ApiState isLoading error={null} />

  const capacityRows = mapConfigToStackingCapacityRows(serverConfig || ruleSet.draftConfig)
  const trigger1Status = draft.trigger1Enabled
    ? { label: 'Active', tone: 'on' }
    : { label: 'Disabled', tone: 'off' }
  const trigger2Status = draft.trigger2Enabled
    ? { label: 'Active', tone: 'on' }
    : { label: 'Disabled', tone: 'off' }

  return (
    <div className="pb-20">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[17px] font-bold text-[#111827]">{catalog.header.title}</h2>
          <p className="mt-1 text-[12px] text-[#6b7280]">{catalog.header.subtitle}</p>
          {ruleSet.meta ? (
            <p className="mt-1 text-[11px] text-[#6b7280]">
              Rule set: {ruleSet.meta.name} · {ruleSet.meta.status} · v{ruleSet.meta.version}
              {dirty ? ' · unsaved edits' : ''}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={handleSaveChanges}
          disabled={ruleSet.isSaving || !dirty}
          className="inline-flex h-[34px] items-center gap-1.5 rounded-[7px] border border-[#1D6A33] bg-[#1D6A33] px-3.5 text-[12px] font-semibold text-white transition hover:bg-[#114225] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Save Changes
        </button>
      </div>

      <AutomationCallout tone="green" label={catalog.corePrinciple.label} className="!mx-0 mb-5">
        <p>{catalog.corePrinciple.body}</p>
      </AutomationCallout>

      <StackingEditorSections
        catalog={catalog}
        draft={draft}
        updateField={updateField}
        capacityRows={capacityRows}
        trigger1Status={trigger1Status}
        trigger2Status={trigger2Status}
      />

      <div className="sticky bottom-0 z-10 -mx-5 mt-2 flex items-center justify-end gap-2.5 border-t border-[#e5e7eb] bg-white px-5 py-3 max-[700px]:-mx-3 max-[700px]:px-3">
        <Button
          type="button"
          onClick={() => {
            setDraft(cloneEditable(baseline))
            showInfo('Restored to last loaded server draft baseline.')
          }}
          className="rounded-full px-5"
        >
          Reset
        </Button>
        <Button
          type="button"
          primary
          onClick={handleSaveAutomation}
          disabled={ruleSet.isActivating}
          className="rounded-full px-6"
        >
          Save Automation
        </Button>
      </div>
    </div>
  )
}

export default function AdminStackingPage() {
  if (!isAutomationRealApi()) return <MockStackingPage />
  return <RealStackingPage />
}
