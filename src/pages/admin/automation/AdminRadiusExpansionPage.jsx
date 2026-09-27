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
import { RADIUS_EXPANSION_UI } from '../../../components/admin/automation/radiusExpansionUiCatalog'
import { ApiState } from '../../../components/admin/ApiState'
import { Button } from '../../../components/admin/Button'
import { useDispatchRuleSet } from '../../../hooks/admin/useDispatchRuleSet'
import {
  applyRadiusEdits,
  mapConfigToRadiusEditable,
  secondsToDuration,
  validateRadiusStageOrder,
} from '../../../mappers/admin/mapDispatchAutomation'
import { isAutomationRealApi } from '../../../services/admin/dispatchAutomationFeature'
import { vendorAcceptanceSlaService } from '../../../services/admin/vendorAcceptanceSlaService'
import { showError, showInfo, showSuccess } from '../../../utils/toast'

/** Read-only timer keys (SLA offer TTLs + platform no-Champ cancel). */
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

/**
 * Automation → Radius Expansion.
 * Values: DispatchRuleSet (radii + expansionDelay) · Champ SLA (offer windows) ·
 * backend overview (noChampCancelSec). No mock / demo numbers.
 */
export default function AdminRadiusExpansionPage() {
  if (!isAutomationRealApi()) {
    return (
      <div className="rounded-[10px] border border-[#fde68a] bg-[#fffbeb] px-4 py-3 text-[13px] text-[#92400e]">
        Enable the <code className="font-semibold">automation</code> feature flag
        (<code>VITE_ADMIN_REAL_API_FEATURES</code>) to load Radius Expansion from the live
        DispatchRuleSet and Champ SLA. Mock data is not used.
      </div>
    )
  }

  return <RealRadiusExpansionPage />
}

function RealRadiusExpansionPage() {
  const catalog = RADIUS_EXPANSION_UI
  const ruleSet = useDispatchRuleSet()
  const [baseline, setBaseline] = useState(null)
  const [draft, setDraft] = useState(null)
  const [serverConfig, setServerConfig] = useState(null)
  const [validationError, setValidationError] = useState(null)
  const [offerWindows, setOfferWindows] = useState(null)
  const [slaSourceLabel, setSlaSourceLabel] = useState(null)
  const [slaError, setSlaError] = useState(null)
  const [slaLoading, setSlaLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setSlaLoading(true)
    vendorAcceptanceSlaService
      .getChampOfferWindows()
      .then((result) => {
        if (cancelled) return
        const data = result?.data
        if (
          data?.hotFoodOfferSec == null ||
          data?.otherOnDemandOfferSec == null ||
          !data?.source
        ) {
          setOfferWindows(null)
          setSlaError('Champ SLA offer windows are missing on the active SLA model.')
          setSlaSourceLabel(null)
          return
        }
        setOfferWindows({
          hotFoodOfferSec: data.hotFoodOfferSec,
          otherOnDemandOfferSec: data.otherOnDemandOfferSec,
        })
        setSlaError(null)
        if (data.model?.name) {
          setSlaSourceLabel(
            `${data.model.name}${data.model.currentVersion != null ? ` v${data.model.currentVersion}` : ''}`,
          )
        }
      })
      .catch((error) => {
        if (cancelled) return
        setOfferWindows(null)
        setSlaError(error?.message || 'Failed to load Champ SLA offer windows.')
        setSlaSourceLabel(null)
      })
      .finally(() => {
        if (!cancelled) setSlaLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!ruleSet.draftConfig) return
    const editable = mapConfigToRadiusEditable(ruleSet.draftConfig, {
      offerWindows: offerWindows || undefined,
      noChampCancelSec: ruleSet.noChampCancelSec,
    })
    setServerConfig(structuredClone(ruleSet.draftConfig))
    setBaseline(cloneEditable(editable))
    setDraft(cloneEditable(editable))
  }, [ruleSet.draftConfig, ruleSet.meta?.id, ruleSet.meta?.updatedAt, ruleSet.noChampCancelSec])

  useEffect(() => {
    if (!offerWindows) return
    const hot = secondsToDuration(offerWindows.hotFoodOfferSec, '≤')
    const other = secondsToDuration(offerWindows.otherOnDemandOfferSec, '≤')
    setBaseline((prev) => (prev ? { ...prev, hotFoodOffer: hot, otherOnDemandOffer: other } : prev))
    setDraft((prev) => (prev ? { ...prev, hotFoodOffer: hot, otherOnDemandOffer: other } : prev))
  }, [offerWindows])

  useEffect(() => {
    if (ruleSet.noChampCancelSec == null) return
    const cancel = secondsToDuration(ruleSet.noChampCancelSec, '≥')
    setBaseline((prev) => (prev ? { ...prev, overallAutoCancel: cancel } : prev))
    setDraft((prev) => (prev ? { ...prev, overallAutoCancel: cancel } : prev))
  }, [ruleSet.noChampCancelSec])

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
      const nextEditable = mapConfigToRadiusEditable(nextConfig, {
        offerWindows: offerWindows || undefined,
        noChampCancelSec: ruleSet.noChampCancelSec,
      })
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
        const nextEditable = mapConfigToRadiusEditable(nextConfig, {
          offerWindows: offerWindows || undefined,
          noChampCancelSec: ruleSet.noChampCancelSec,
        })
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
              {slaSourceLabel ? ` · offer windows from ${slaSourceLabel}` : ''}
              {ruleSet.noChampCancelSec != null
                ? ` · no-Champ cancel ${ruleSet.noChampCancelSec}s`
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

      {slaError ? (
        <div className="mb-4 rounded-[8px] border border-[#fde68a] bg-[#fffbeb] px-4 py-3 text-[12px] text-[#92400e]">
          {slaError} Publish Champ SLA on SLA Models, then refresh.
        </div>
      ) : null}
      {slaLoading ? (
        <p className="mb-3 text-[11px] text-[#6b7280]">Loading Champ SLA offer windows…</p>
      ) : null}

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
            <AutomationFieldRow key={row.id} label={row.label}>
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
