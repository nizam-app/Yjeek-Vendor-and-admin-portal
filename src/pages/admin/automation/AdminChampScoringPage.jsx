import { useEffect, useMemo, useState } from 'react'
import { Play } from 'lucide-react'
import { AutomationPercentField } from '../../../components/admin/automation/AutomationFields'
import {
  AutomationFieldRow,
  AutomationSectionCard,
} from '../../../components/admin/automation/AutomationSectionCard'
import { AutomationStatusPill } from '../../../components/admin/automation/AutomationStatusPill'
import { CpiTierTable } from '../../../components/admin/automation/CpiTierTable'
import { ScoringWeightRow } from '../../../components/admin/automation/ScoringWeightRow'
import { ApiState } from '../../../components/admin/ApiState'
import { Button } from '../../../components/admin/Button'
import { useChampScoringEffective } from '../../../hooks/admin/useChampScoringEffective'
import { useDispatchRuleSet } from '../../../hooks/admin/useDispatchRuleSet'
import {
  applyScoringEdits,
  mapConfigToScoringDisplay,
  scoringWeightsSum,
  SIMULATE_MAX_LIMIT,
  validateScoringWeights,
} from '../../../mappers/admin/mapDispatchAutomation'
import { isAutomationRealApi } from '../../../services/admin/dispatchAutomationFeature'
import { showError, showInfo, showSuccess } from '../../../utils/toast'

const FACTOR_WEIGHT_KEY = {
  eta: 'etaWeight',
  cpi: 'cpiWeight',
  load: 'activeLoadWeight',
  category: 'categoryFitWeight',
}

const DEFAULT_WEIGHTS = {
  etaWeight: 40,
  cpiWeight: 30,
  activeLoadWeight: 20,
  categoryFitWeight: 10,
}

/** Mockup default — dispute ledger / engine apply remains future P6 (not in DispatchRuleSet). */
const DEFAULT_POD_BONUS_PERCENT = '5'

/**
 * Automation → Champ Scoring.
 * CPI table + factor notes from published SLA/DSA; weights from DispatchRuleSet.
 * No mock/demo catalog.
 */
export default function AdminChampScoringPage() {
  if (!isAutomationRealApi()) {
    return (
      <div className="rounded-[10px] border border-[#fde68a] bg-[#fffbeb] px-4 py-3 text-[13px] text-[#92400e]">
        Enable the <code className="font-semibold">automation</code> feature flag
        (<code>VITE_ADMIN_REAL_API_FEATURES</code>) to load Champ Scoring from the live SLA
        engine. Mock data is not used.
      </div>
    )
  }

  return <RealChampScoringPage />
}

function RealChampScoringPage() {
  const catalog = useChampScoringEffective()
  const ruleSet = useDispatchRuleSet()
  const [serverConfig, setServerConfig] = useState(null)
  const [weights, setWeights] = useState(null)
  const [podBonusPercent, setPodBonusPercent] = useState(DEFAULT_POD_BONUS_PERCENT)

  useEffect(() => {
    if (!ruleSet.draftConfig) return
    setServerConfig(structuredClone(ruleSet.draftConfig))
    setWeights(mapConfigToScoringDisplay(ruleSet.draftConfig))
    setPodBonusPercent(DEFAULT_POD_BONUS_PERCENT)
  }, [ruleSet.draftConfig, ruleSet.meta?.id, ruleSet.meta?.updatedAt])

  const weightTotal = scoringWeightsSum(weights || DEFAULT_WEIGHTS)

  const factors = useMemo(() => {
    const source = catalog.effective?.factors
    if (!Array.isArray(source) || source.length === 0) return []
    const percentMap = {
      eta: weights?.etaWeight ?? DEFAULT_WEIGHTS.etaWeight,
      cpi: weights?.cpiWeight ?? DEFAULT_WEIGHTS.cpiWeight,
      load: weights?.activeLoadWeight ?? DEFAULT_WEIGHTS.activeLoadWeight,
      category: weights?.categoryFitWeight ?? DEFAULT_WEIGHTS.categoryFitWeight,
    }
    return source.map((factor) => ({
      ...factor,
      percent: percentMap[factor.id] ?? 0,
    }))
  }, [catalog.effective?.factors, weights])

  async function handleSimulate() {
    try {
      const result = await ruleSet.simulate({ limit: SIMULATE_MAX_LIMIT })
      const count = result?.data?.results?.length ?? 0
      showSuccess(
        `Shadow simulate finished on ${count} order(s) (last ≤${SIMULATE_MAX_LIMIT}). Side-effect free.`,
      )
    } catch (error) {
      showError(error?.message || 'Simulation failed.')
    }
  }

  async function handleSaveChanges() {
    const error = validateScoringWeights(weights)
    if (error) {
      showError(error)
      return
    }
    try {
      const result = await ruleSet.mergeAndPatch((latest, editable) => {
        return applyScoringEdits(latest, editable)
      }, weights)
      if (result?.data?.draftConfig) {
        setServerConfig(structuredClone(result.data.draftConfig))
        setWeights(mapConfigToScoringDisplay(result.data.draftConfig))
      }
      showSuccess('Scoring weights saved to DispatchRuleSet draft.')
    } catch (err) {
      showError(err?.message || 'Failed to save scoring weights.')
    }
  }

  async function handleSaveAutomation() {
    if (!ruleSet.meta?.id) return
    const weightError = validateScoringWeights(weights)
    if (weightError) {
      showError(weightError)
      return
    }
    const confirmed = window.confirm(
      `Activate DispatchRuleSet “${ruleSet.meta.name || ruleSet.meta.id}” (v${ruleSet.meta.version})?\n\nThis saves current scoring weights then publishes the draft.`,
    )
    if (!confirmed) return
    try {
      await ruleSet.mergeAndPatch((latest, editable) => applyScoringEdits(latest, editable), weights)
      const result = await ruleSet.activate('Activated from Automation → Champ Scoring')
      if (result?.data?.draftConfig) {
        setServerConfig(structuredClone(result.data.draftConfig))
        setWeights(mapConfigToScoringDisplay(result.data.draftConfig))
      }
      showSuccess(`Activated version ${result?.data?.meta?.version ?? ''}`.trim())
    } catch (error) {
      showError(error?.message || 'Activation failed. Previous active version remains.')
    }
  }

  const loading =
    (catalog.isLoading && !catalog.effective) || (ruleSet.isLoading && !weights)
  const error = catalog.error || ruleSet.error

  if (loading) {
    return <ApiState isLoading error={null} />
  }

  if (error && !catalog.effective && !weights) {
    return (
      <ApiState
        isLoading={false}
        error={error}
        onRetry={() => {
          catalog.refetch()
          ruleSet.refetch()
        }}
      />
    )
  }

  if (!catalog.effective || !weights) {
    return (
      <div className="rounded-[10px] border border-[#e5e7eb] bg-white px-4 py-6 text-[13px] text-[#6b7280]">
        Publish an active Champ SLA model and DispatchRuleSet to populate Champ Scoring.
      </div>
    )
  }

  const cpiTable = catalog.effective.cpiTable

  return (
    <div className="pb-20">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[17px] font-bold text-[#111827]">Champ Scoring</h2>
          <p className="mt-1 text-[12px] text-[#6b7280]">
            Weights used to rank Champs for each on-demand order · must sum to 100%
          </p>
          {ruleSet.meta ? (
            <p className="mt-1 text-[11px] text-[#6b7280]">
              Rule set: {ruleSet.meta.name} · {ruleSet.meta.status} · v{ruleSet.meta.version}
              {catalog.effective.modelVersion != null
                ? ` · SLA v${catalog.effective.modelVersion}`
                : ''}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleSimulate}
            disabled={ruleSet.isSimulating}
            className="inline-flex h-[34px] items-center gap-1.5 rounded-[7px] border border-[#bfdbfe] bg-[#eff6ff] px-3.5 text-[11.5px] font-semibold text-[#2563eb] disabled:opacity-50"
          >
            <Play size={11} fill="currentColor" aria-hidden />
            Simulate (≤{SIMULATE_MAX_LIMIT} orders)
          </button>
          <button
            type="button"
            onClick={handleSaveChanges}
            disabled={ruleSet.isSaving || weightTotal !== 100}
            className="inline-flex h-[34px] items-center gap-1.5 rounded-[7px] border border-[#1D6A33] bg-[#1D6A33] px-3.5 text-[12px] font-semibold text-white transition hover:bg-[#114225] disabled:opacity-50"
          >
            Save Changes
          </button>
        </div>
      </div>

      <AutomationSectionCard
        title="Scoring factor weights"
        actions={
          <AutomationStatusPill tone={weightTotal === 100 ? 'on' : 'off'}>
            Total: {weightTotal}% {weightTotal === 100 ? '✓' : '(must be 100)'}
          </AutomationStatusPill>
        }
      >
        {factors.map((factor) => {
          const key = FACTOR_WEIGHT_KEY[factor.id]
          return (
            <ScoringWeightRow
              key={factor.id}
              label={factor.label}
              labelSuffix={factor.labelSuffix}
              percent={factor.percent}
              note={factor.note}
              barTone={factor.barTone}
              editable={Boolean(key)}
              disabled={ruleSet.isSaving}
              onChange={(next) => key && setWeights((prev) => ({ ...prev, [key]: next }))}
            />
          )
        })}
      </AutomationSectionCard>

      <AutomationSectionCard title={cpiTable.title}>
        <CpiTierTable columns={cpiTable.columns} tiers={cpiTable.tiers} />
      </AutomationSectionCard>

      <AutomationSectionCard title="Pay on Delivery scoring uplift">
        <AutomationFieldRow label="POD bonus — Champs with zero cash disputes in 30 days">
          <AutomationPercentField
            value={podBonusPercent}
            onChange={setPodBonusPercent}
            disabled={ruleSet.isSaving || ruleSet.isActivating}
          />
        </AutomationFieldRow>
        <AutomationFieldRow label="This bonus is invisible to Champs — scoring only" mutedLabel>
          <AutomationStatusPill tone="on">Active</AutomationStatusPill>
        </AutomationFieldRow>
      </AutomationSectionCard>

      <div className="sticky bottom-0 z-10 -mx-5 mt-2 flex items-center justify-end gap-2.5 border-t border-[#e5e7eb] bg-white px-5 py-3 max-[700px]:-mx-3 max-[700px]:px-3">
        <Button
          type="button"
          onClick={() => {
            if (serverConfig) setWeights(mapConfigToScoringDisplay(serverConfig))
            setPodBonusPercent(DEFAULT_POD_BONUS_PERCENT)
            showInfo('Weights restored from server draft.')
          }}
          className="rounded-full px-5"
        >
          Reset
        </Button>
        <Button
          type="button"
          primary
          onClick={handleSaveAutomation}
          disabled={ruleSet.isActivating || ruleSet.isSaving || weightTotal !== 100}
          className="rounded-full px-6"
        >
          Save Automation
        </Button>
      </div>
    </div>
  )
}
