import { useEffect, useMemo, useState } from 'react'
import { Play } from 'lucide-react'
import { AutomationCallout } from '../../../components/admin/automation/AutomationCallout'
import { StackingEditorSections } from '../../../components/admin/automation/StackingEditorSections'
import { STACKING_UI } from '../../../components/admin/automation/stackingUiCatalog'
import { AutomationSectionCard } from '../../../components/admin/automation/AutomationSectionCard'
import { ApiState } from '../../../components/admin/ApiState'
import { Button } from '../../../components/admin/Button'
import { ToggleSwitch } from '../../../components/admin/ui-editor/ExclusiveOfferRow'
import { useDispatchRuleSet } from '../../../hooks/admin/useDispatchRuleSet'
import {
  applyStackingEdits,
  mapConfigToStackingCapacityRows,
  mapConfigToStackingEditable,
  validateStackingEdits,
} from '../../../mappers/admin/mapDispatchAutomation'
import { isAutomationRealApi } from '../../../services/admin/dispatchAutomationFeature'
import { showError, showInfo, showSuccess } from '../../../utils/toast'

function cloneEditable(editable) {
  return structuredClone(editable)
}

/**
 * Automation → Stacking.
 * Editable fields from DispatchRuleSet. liveEnabled requires env unlock.
 */
export default function AdminStackingPage() {
  if (!isAutomationRealApi()) {
    return (
      <div className="rounded-[10px] border border-[#fde68a] bg-[#fffbeb] px-4 py-3 text-[13px] text-[#92400e]">
        Enable the <code className="font-semibold">automation</code> feature flag
        (<code>VITE_ADMIN_REAL_API_FEATURES</code>) to load Stacking from the live DispatchRuleSet.
        Mock data is not used.
      </div>
    )
  }

  return <RealStackingPage />
}

function RealStackingPage() {
  const ruleSet = useDispatchRuleSet()
  const [baseline, setBaseline] = useState(null)
  const [draft, setDraft] = useState(null)
  const [serverConfig, setServerConfig] = useState(null)
  const [dryRunSummary, setDryRunSummary] = useState(null)

  const liveAllowed = Boolean(ruleSet.stackingRollout?.stackingLiveAllowed)
  const googleMapsConfigured = Boolean(ruleSet.stackingRollout?.googleMapsConfigured)

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
    if (draft.liveEnabled && !liveAllowed) {
      showError(
        'Live stacking is locked. Set DISPATCH_STACKING_LIVE_ALLOWED=true on the backend and restart.',
      )
      return
    }
    if (draft.liveEnabled && !googleMapsConfigured) {
      showError('Google Maps API key is required before enabling live stacking confirm.')
      return
    }
    try {
      const result = await ruleSet.mergeAndPatch(applyStackingEdits, draft)
      const nextConfig = result?.data?.draftConfig
      if (!nextConfig) throw new Error('Save succeeded but draft config was missing.')
      if (draft.liveEnabled && nextConfig.stacking?.liveEnabled !== true) {
        showError(
          'Server refused liveEnabled=true (rollout lock still on). Check DISPATCH_STACKING_LIVE_ALLOWED.',
        )
      }
      const nextEditable = mapConfigToStackingEditable(nextConfig)
      setServerConfig(structuredClone(nextConfig))
      setBaseline(cloneEditable(nextEditable))
      setDraft(cloneEditable(nextEditable))
      showSuccess(
        nextConfig.stacking?.liveEnabled
          ? 'Stacking draft saved with liveEnabled=true. Activate to publish.'
          : 'Stacking draft saved. liveEnabled=false until you enable and activate.',
      )
    } catch (error) {
      showError(error?.message || 'Failed to save stacking draft.')
    }
  }

  async function handleDryRun() {
    try {
      const result = await ruleSet.simulateStacking({ limit: 24, maxCandidates: 20 })
      const data = result?.data ?? result
      setDryRunSummary(data)
      showSuccess(
        `Dry-run: ${data?.eligibleCount ?? 0} eligible of ${data?.candidateCount ?? 0} candidates (side-effect free).`,
      )
    } catch (error) {
      showError(error?.message || 'Stacking dry-run failed.')
    }
  }

  async function handleSaveAutomation() {
    if (!ruleSet.meta?.id) return
    if (dirty) {
      showInfo('Save Changes first, then activate — activation publishes the server draft.')
      return
    }
    const live = Boolean(serverConfig?.stacking?.liveEnabled)
    const confirmed = window.confirm(
      live
        ? `Activate DispatchRuleSet “${ruleSet.meta.name || ruleSet.meta.id}” (v${ruleSet.meta.version})?\n\nLive stacking is ON — real orders can form stacks (Google Maps required).`
        : `Activate DispatchRuleSet “${ruleSet.meta.name || ruleSet.meta.id}” (v${ruleSet.meta.version})?\n\nStacking liveEnabled stays false. Other published dispatch config can still change.`,
    )
    if (!confirmed) return
    try {
      const result = await ruleSet.activate(
        live
          ? 'Activated from Automation → Stacking (live stacking ON)'
          : 'Activated from Automation → Stacking',
      )
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
  if (!draft) {
    return (
      <div className="rounded-[10px] border border-[#e5e7eb] bg-white px-4 py-6 text-[13px] text-[#6b7280]">
        Load or create a DispatchRuleSet to configure Stacking.
      </div>
    )
  }

  const config = serverConfig || ruleSet.draftConfig
  const capacityRows = mapConfigToStackingCapacityRows(config)
  const stages = Array.isArray(config?.radius?.stagesKm) ? config.radius.stagesKm : []
  const stage3RadiusKm = Number(stages[2])
  const liveEnabled = draft.liveEnabled === true

  return (
    <div className="pb-20">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[17px] font-bold text-[#111827]">{STACKING_UI.header.title}</h2>
          <p className="mt-1 text-[12px] text-[#6b7280]">{STACKING_UI.header.subtitle}</p>
          {ruleSet.meta ? (
            <p className="mt-1 text-[11px] text-[#6b7280]">
              Rule set: {ruleSet.meta.name} · {ruleSet.meta.status} · v{ruleSet.meta.version}
              {dirty ? ' · unsaved edits' : ''}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleDryRun}
            disabled={ruleSet.isSimulatingStacking}
            className="inline-flex h-[34px] items-center gap-1.5 rounded-[7px] border border-[#bfdbfe] bg-[#eff6ff] px-3.5 text-[11.5px] font-semibold text-[#2563eb] disabled:opacity-50"
          >
            <Play size={11} fill="currentColor" aria-hidden />
            Dry-run stacking
          </button>
          <button
            type="button"
            onClick={handleSaveChanges}
            disabled={ruleSet.isSaving || !dirty}
            className="inline-flex h-[34px] items-center gap-1.5 rounded-[7px] border border-[#1D6A33] bg-[#1D6A33] px-3.5 text-[12px] font-semibold text-white transition hover:bg-[#114225] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Save Changes
          </button>
        </div>
      </div>

      <AutomationCallout tone="green" label={STACKING_UI.corePrinciple.label} className="!mx-0 mb-5">
        <p>{STACKING_UI.corePrinciple.body}</p>
        <div className="mt-2.5 flex flex-wrap items-center gap-2 border-t border-[#bbf7d0]/pt-2.5">
          <span className="text-[12px] font-medium text-[#166534]">Live stacking</span>
          <ToggleSwitch
            checked={liveEnabled}
            disabled={!liveAllowed || ruleSet.isSaving}
            onChange={(next) => updateField('liveEnabled', next)}
            label="Live stacking"
          />
          <span className="text-[11.5px] text-[#166534]">
            {liveAllowed
              ? liveEnabled
                ? 'ON — Save Changes then Save Automation'
                : 'OFF'
              : 'Locked (DISPATCH_STACKING_LIVE_ALLOWED)'}
            {!googleMapsConfigured ? ' · Google Maps key missing' : ''}
          </span>
        </div>
      </AutomationCallout>

      <StackingEditorSections
        catalog={STACKING_UI}
        draft={draft}
        updateField={updateField}
        capacityRows={capacityRows}
        stage3RadiusKm={Number.isFinite(stage3RadiusKm) ? stage3RadiusKm : 12}
      />

      {dryRunSummary ? (
        <AutomationSectionCard title="Last dry-run result">
          <p className="px-1 py-2 text-[12.5px] text-[#374151]">
            Eligible {dryRunSummary.eligibleCount ?? 0} / {dryRunSummary.candidateCount ?? 0}{' '}
            candidates · pool {dryRunSummary.poolSize ?? 0} · sideEffects=
            {String(Boolean(dryRunSummary.sideEffects))}
          </p>
        </AutomationSectionCard>
      ) : null}

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
