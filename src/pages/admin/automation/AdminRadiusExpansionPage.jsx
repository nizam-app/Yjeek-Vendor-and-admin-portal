import { useEffect, useMemo, useState } from 'react'
import {
  AutomationDurationField,
  AutomationOperatorNumberField,
} from '../../../components/admin/automation/AutomationFields'
import {
  AutomationFieldRow,
  AutomationSectionCard,
} from '../../../components/admin/automation/AutomationSectionCard'
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

/** Read-only timer keys (SLA offer TTLs + fixed no-Champ cancel display). */
const READONLY_TIMER_KEYS = new Set([
  'hotFoodOffer',
  'otherOnDemandOffer',
  'overallAutoCancel',
])

/** Both map to DispatchRuleSet radius.expansionDelaySec — keep in sync in the UI. */
const EXPANSION_DELAY_KEYS = new Set(['stage2To3', 'stage3To4'])

function cloneEditable(editable) {
  return structuredClone(editable)
}

function radiusPersistSnapshot(editable) {
  if (!editable) return null
  return {
    s1: editable.stage1RadiusKm,
    s2: editable.stage2RadiusKm,
    s3: editable.stage3RadiusKm,
    s4: editable.stage4BroadcastKm,
    d23: editable.stage2To3,
    d34: editable.stage3To4,
  }
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
    setDraft((prev) => {
      const next = { ...prev, [key]: value }
      if (EXPANSION_DELAY_KEYS.has(key)) {
        next.stage2To3 = { ...value, operator: '≤' }
        next.stage3To4 = { ...value, operator: '≤' }
      }
      return next
    })
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
          <AutomationFieldRow key={row.id} label={row.label} help={row.help}>
            <AutomationDurationField
              value={draft[row.fieldKey]}
              disabled={Boolean(row.readOnly)}
              operatorLocked
              operators={[row.operator]}
              onChange={(next) =>
                row.readOnly
                  ? undefined
                  : updateField(row.fieldKey, { ...next, operator: row.operator })
              }
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

  const dirty = useMemo(() => {
    if (!baseline || !draft) return false
    return (
      JSON.stringify(radiusPersistSnapshot(baseline)) !==
      JSON.stringify(radiusPersistSnapshot(draft))
    )
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
    if (READONLY_TIMER_KEYS.has(key)) return
    setDraft((prev) => {
      const next = { ...prev, [key]: value }
      if (EXPANSION_DELAY_KEYS.has(key)) {
        const synced = { ...value, operator: '≤' }
        next.stage2To3 = synced
        next.stage3To4 = synced
      }
      return next
    })
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
        const beforeStacking = latest?.stacking?.liveEnabled
        const fullConfig = applyRadiusEdits(latest, editable)
        if (fullConfig.stacking?.liveEnabled !== false) {
          throw new Error('Safety abort: stacking.liveEnabled must remain false.')
        }
        if (beforeStacking === true && fullConfig.stacking?.liveEnabled !== false) {
          throw new Error('Safety abort: stacking live unlock is not allowed.')
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
      showSuccess(
        'Radius draft saved (stages, broadcastRadiusKm, expansionDelaySec). Live dispatch unchanged until activate.',
      )
    } catch (error) {
      showError(error?.message || 'Failed to save radius draft.')
    }
  }

  async function handleSaveAutomation() {
    if (!ruleSet.meta?.id) return
    if (dirty) {
      showInfo('Save Changes first, then activate — activation publishes the server draft.')
      return
    }
    const confirmed = window.confirm(
      `Activate DispatchRuleSet “${ruleSet.meta.name || ruleSet.meta.id}” (v${ruleSet.meta.version})?\n\n` +
        'Publishes Stage 1–3 radii, Stage 4 broadcastRadiusKm, and expansionDelaySec from the draft.\n' +
        'SLA offer TTLs and stacking liveEnabled are not changed by this screen.',
    )
    if (!confirmed) return
    try {
      const result = await ruleSet.activate('Activated from Automation → Radius Expansion')
      const nextConfig = result?.data?.draftConfig || result?.data?.rule?.config
      if (nextConfig) {
        const nextEditable = mapConfigToRadiusEditable(nextConfig)
        setServerConfig(structuredClone(nextConfig))
        setBaseline(cloneEditable(nextEditable))
        setDraft(cloneEditable(nextEditable))
      }
      const published = nextConfig?.radius || result?.data?.rule?.config?.radius
      const delay = published?.expansionDelaySec
      const broadcast = published?.broadcastRadiusKm
      showSuccess(
        `Activated v${result?.data?.meta?.version ?? ''}` +
          (delay != null ? ` · expansionDelaySec=${delay}` : '') +
          (broadcast != null ? ` · broadcastRadiusKm=${broadcast}` : ''),
      )
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
              {dirty ? ' · unsaved radius edits' : ''}
              {serverConfig?.radius?.expansionDelaySec != null
                ? ` · delay ${serverConfig.radius.expansionDelaySec}s`
                : ''}
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
        {catalog.timers.rows.map((row) => {
          const readOnly = Boolean(row.readOnly) || READONLY_TIMER_KEYS.has(row.fieldKey)
          return (
            <AutomationFieldRow key={row.id} label={row.label} help={row.help}>
              <AutomationDurationField
                value={draft[row.fieldKey]}
                disabled={readOnly}
                operatorLocked
                operators={[row.operator]}
                onChange={(next) =>
                  readOnly
                    ? undefined
                    : updateField(row.fieldKey, { ...next, operator: row.operator })
                }
              />
            </AutomationFieldRow>
          )
        })}
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
