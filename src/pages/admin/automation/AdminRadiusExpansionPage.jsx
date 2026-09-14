import { useEffect, useMemo, useState } from 'react'
import { AutomationGapBanner } from '../../../components/admin/automation/AutomationGapBanner'
import {
  AutomationDurationField,
  AutomationOperatorNumberField,
} from '../../../components/admin/automation/AutomationFields'
import {
  AutomationFieldRow,
  AutomationSectionCard,
} from '../../../components/admin/automation/AutomationSectionCard'
import { DispatchRuleSetScopeNotice } from '../../../components/admin/automation/DispatchRuleSetScopeNotice'
import { RadiusEscalationStageChain } from '../../../components/admin/automation/RadiusEscalationStageChain'
import { ApiState } from '../../../components/admin/ApiState'
import { Button } from '../../../components/admin/Button'
import { useDispatchRuleSet } from '../../../hooks/admin/useDispatchRuleSet'
import {
  applyRadiusEdits,
  mapConfigToRadiusEditable,
  validateRadiusStageOrder,
} from '../../../mappers/admin/mapDispatchAutomation'
import {
  cloneRadiusExpansionEditable,
  createRadiusExpansionEditableDefaults,
  getRadiusExpansionMock,
  validateRadiusStageOrder as validateMockRadiusOrder,
} from '../../../mocks/adminAutomationRadiusExpansion.mock'
import { isAutomationRealApi } from '../../../services/admin/dispatchAutomationFeature'
import { showError, showInfo, showSuccess } from '../../../utils/toast'

const TIMER_FIELD_KEYS = new Set([
  'hotFoodOffer',
  'otherOnDemandOffer',
  'stage2To3',
  'stage3To4',
  'overallAutoCancel',
])

function cloneEditable(editable) {
  return structuredClone(editable)
}

function MockRadiusExpansionPage() {
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
    const error = validateMockRadiusOrder(draft)
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
            tryPersist(
              'Radius Expansion saved locally via Save Changes (frontend mock only). Backend was not updated.',
            )
          }
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
        <Button
          type="button"
          onClick={() => {
            setDraft(cloneRadiusExpansionEditable(baseline))
            setValidationError(null)
            showInfo('Radius Expansion fields restored to the last saved local mock values.')
          }}
          className="rounded-full px-5"
        >
          Reset
        </Button>
        <Button
          type="button"
          primary
          onClick={() =>
            tryPersist(
              'Radius Expansion saved locally via Save Automation (frontend mock only). Backend was not updated.',
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

function RealRadiusExpansionPage() {
  const catalog = useMemo(() => getRadiusExpansionMock(), [])
  const ruleSet = useDispatchRuleSet()
  const [baseline, setBaseline] = useState(null)
  const [draft, setDraft] = useState(null)
  const [serverConfig, setServerConfig] = useState(null)
  const [validationError, setValidationError] = useState(null)

  useEffect(() => {
    if (!ruleSet.draftConfig) return
    const editable = mapConfigToRadiusEditable(ruleSet.draftConfig)
    setServerConfig(structuredClone(ruleSet.draftConfig))
    setBaseline(cloneEditable(editable))
    setDraft(cloneEditable(editable))
  }, [ruleSet.draftConfig, ruleSet.meta?.id, ruleSet.meta?.updatedAt])

  const dirtyRadii = useMemo(() => {
    if (!baseline || !draft) return false
    return (
      JSON.stringify({
        s1: baseline.stage1RadiusKm,
        s2: baseline.stage2RadiusKm,
        s3: baseline.stage3RadiusKm,
      }) !==
      JSON.stringify({
        s1: draft.stage1RadiusKm,
        s2: draft.stage2RadiusKm,
        s3: draft.stage3RadiusKm,
      })
    )
  }, [baseline, draft])

  useEffect(() => {
    if (!dirtyRadii) return undefined
    const onBeforeUnload = (event) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [dirtyRadii])

  const stageChain = useMemo(() => {
    if (!draft) return catalog.stages
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
    if (TIMER_FIELD_KEYS.has(key)) return
    setDraft((prev) => ({ ...prev, [key]: value }))
    setValidationError(null)
  }

  async function handleSaveChanges() {
    if (!draft || !ruleSet.meta?.id) return
    const error = validateRadiusStageOrder(draft)
    if (error) {
      setValidationError(error)
      showError(error)
      return
    }
    try {
      const result = await ruleSet.mergeAndPatch((latest, editable) => {
        const beforeDelay = latest.radius?.expansionDelaySec
        const fullConfig = applyRadiusEdits(latest, editable)
        if (fullConfig.radius?.expansionDelaySec !== beforeDelay) {
          throw new Error('Safety abort: expansionDelaySec must not change from Radius timer UI.')
        }
        return fullConfig
      }, draft)
      const nextConfig = result?.data?.draftConfig
      if (!nextConfig) throw new Error('Save succeeded but draft config was missing.')
      const nextEditable = mapConfigToRadiusEditable(nextConfig)
      setServerConfig(structuredClone(nextConfig))
      setBaseline(cloneEditable(nextEditable))
      setDraft(cloneEditable(nextEditable))
      setValidationError(null)
      showSuccess('Stage radii draft saved. Timer fields were not persisted. Live dispatch unchanged until activate.')
    } catch (error) {
      showError(error?.message || 'Failed to save radius draft.')
    }
  }

  async function handleSaveAutomation() {
    if (!ruleSet.meta?.id) return
    if (dirtyRadii) {
      showInfo('Save Changes first, then activate — activation publishes the server draft.')
      return
    }
    const confirmed = window.confirm(
      `Activate DispatchRuleSet “${ruleSet.meta.name || ruleSet.meta.id}” (v${ruleSet.meta.version})?\n\nOnly Stage 1–3 radii from the draft are published from this screen’s supported fields. Timers are not wired.`,
    )
    if (!confirmed) return
    try {
      const result = await ruleSet.activate('Activated from Automation → Radius Expansion')
      const nextConfig = result?.data?.draftConfig
      if (nextConfig) {
        const nextEditable = mapConfigToRadiusEditable(nextConfig)
        setServerConfig(structuredClone(nextConfig))
        setBaseline(cloneEditable(nextEditable))
        setDraft(cloneEditable(nextEditable))
      }
      showSuccess(`Activated version ${result?.data?.meta?.version ?? ''}.`.trim())
    } catch (error) {
      showError(error?.message || 'Activation failed. Previous active version remains.')
    }
  }

  if (ruleSet.isLoading && !draft) return <ApiState isLoading error={null} />
  if (ruleSet.error && !draft) {
    return <ApiState isLoading={false} error={ruleSet.error} onRetry={ruleSet.refetch} />
  }
  if (!draft) return <ApiState isLoading error={null} />

  return (
    <div className="pb-20">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[17px] font-bold text-[#111827]">{catalog.header.title}</h2>
          <p className="mt-1 text-[12px] text-[#6b7280]">{catalog.header.subtitle}</p>
          {ruleSet.meta ? (
            <p className="mt-1 text-[11px] text-[#6b7280]">
              Rule set: {ruleSet.meta.name} · {ruleSet.meta.status} · v{ruleSet.meta.version}
              {dirtyRadii ? ' · unsaved radius edits' : ''}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={handleSaveChanges}
          disabled={ruleSet.isSaving || !dirtyRadii}
          className="inline-flex h-[34px] items-center gap-1.5 rounded-[7px] border border-[#1D6A33] bg-[#1D6A33] px-3.5 text-[12px] font-semibold text-white transition hover:bg-[#114225] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Save Changes
        </button>
      </div>

      <DispatchRuleSetScopeNotice />

      <AutomationGapBanner tone="amber" label="Timers not wired in P2B">
        <p>
          Offer windows (45s / 90s), Stage 2→3 / 3→4 delays, and no-Champ 900s cancel are{' '}
          <strong>disabled</strong>. They are not mapped into the single backend{' '}
          <code>expansionDelaySec</code>. Stage 4 remains Open Broadcast (read-only). Phase P7.
        </p>
      </AutomationGapBanner>

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
              disabled
              operatorLocked
              operators={[row.operator]}
              onChange={() => {}}
            />
          </AutomationFieldRow>
        ))}
      </AutomationSectionCard>

      <div className="sticky bottom-0 z-10 -mx-5 mt-2 flex items-center justify-end gap-2.5 border-t border-[#e5e7eb] bg-white px-5 py-3 max-[700px]:-mx-3 max-[700px]:px-3">
        <Button
          type="button"
          onClick={() => {
            setDraft(cloneEditable(baseline))
            setValidationError(null)
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

export default function AdminRadiusExpansionPage() {
  if (!isAutomationRealApi()) return <MockRadiusExpansionPage />
  return <RealRadiusExpansionPage />
}
