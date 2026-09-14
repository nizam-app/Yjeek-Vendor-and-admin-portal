import { useEffect, useMemo, useState } from 'react'
import { Play } from 'lucide-react'
import { AutomationCallout } from '../../../components/admin/automation/AutomationCallout'
import { AutomationGapBanner } from '../../../components/admin/automation/AutomationGapBanner'
import { AutomationPercentField } from '../../../components/admin/automation/AutomationFields'
import {
  AutomationFieldRow,
  AutomationSectionCard,
} from '../../../components/admin/automation/AutomationSectionCard'
import { AutomationStatusPill } from '../../../components/admin/automation/AutomationStatusPill'
import { CpiTierTable } from '../../../components/admin/automation/CpiTierTable'
import { DispatchRuleSetScopeNotice } from '../../../components/admin/automation/DispatchRuleSetScopeNotice'
import { ScoringWeightRow } from '../../../components/admin/automation/ScoringWeightRow'
import { ApiState } from '../../../components/admin/ApiState'
import { Button } from '../../../components/admin/Button'
import { useDispatchRuleSet } from '../../../hooks/admin/useDispatchRuleSet'
import {
  mapConfigToScoringDisplay,
  SIMULATE_MAX_LIMIT,
} from '../../../mappers/admin/mapDispatchAutomation'
import {
  cloneChampScoringEditable,
  createChampScoringEditableDefaults,
  getChampScoringMock,
} from '../../../mocks/adminAutomationChampScoring.mock'
import { isAutomationRealApi } from '../../../services/admin/dispatchAutomationFeature'
import { showError, showInfo, showSuccess } from '../../../utils/toast'

function MockChampScoringPage() {
  const catalog = useMemo(() => getChampScoringMock(), [])
  const [baseline, setBaseline] = useState(() =>
    cloneChampScoringEditable(catalog.editable || createChampScoringEditableDefaults()),
  )
  const [draft, setDraft] = useState(() => cloneChampScoringEditable(baseline))

  function persistLocal(message) {
    const next = cloneChampScoringEditable(draft)
    setBaseline(next)
    setDraft(cloneChampScoringEditable(next))
    showSuccess(message)
  }

  return (
    <div className="pb-20">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[17px] font-bold text-[#111827]">{catalog.header.title}</h2>
          <p className="mt-1 text-[12px] text-[#6b7280]">{catalog.header.subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() =>
              showInfo(
                'Simulate on last 500 orders is visual-only in this phase. No backend simulation or results were generated.',
              )
            }
            className="inline-flex h-[34px] items-center gap-1.5 rounded-[7px] border border-[#bfdbfe] bg-[#eff6ff] px-3.5 text-[11.5px] font-semibold text-[#2563eb]"
          >
            <Play size={11} fill="currentColor" aria-hidden />
            Simulate on last 500 orders
          </button>
          <button
            type="button"
            onClick={() =>
              persistLocal(
                'Champ Scoring saved locally via Save Changes (frontend mock only). Backend was not updated.',
              )
            }
            className="inline-flex h-[34px] items-center gap-1.5 rounded-[7px] border border-[#1D6A33] bg-[#1D6A33] px-3.5 text-[12px] font-semibold text-white transition hover:bg-[#114225]"
          >
            Save Changes
          </button>
        </div>
      </div>

      <AutomationCallout tone="red" label={catalog.cpiNotice.label} className="!mx-0 mb-5">
        <p>{catalog.cpiNotice.body}</p>
      </AutomationCallout>

      <AutomationSectionCard
        title="Scoring factor weights"
        actions={<AutomationStatusPill tone="on">{catalog.weights.totalLabel}</AutomationStatusPill>}
      >
        {catalog.weights.factors.map((factor) => (
          <ScoringWeightRow
            key={factor.id}
            label={factor.label}
            labelSuffix={factor.labelSuffix}
            percent={factor.percent}
            note={factor.note}
            barTone={factor.barTone}
            loadFactors={factor.loadFactors}
            categoryFitFactors={factor.categoryFitFactors}
          />
        ))}
      </AutomationSectionCard>

      <AutomationSectionCard title={catalog.cpiTable.title}>
        <AutomationCallout tone="red" label={catalog.cpiTable.suspensionNotice.label}>
          <p>{catalog.cpiTable.suspensionNotice.body}</p>
        </AutomationCallout>
        <CpiTierTable columns={catalog.cpiTable.columns} tiers={catalog.cpiTable.tiers} />
      </AutomationSectionCard>

      <AutomationSectionCard title={catalog.podUplift.title}>
        <AutomationFieldRow label={catalog.podUplift.bonusLabel}>
          <AutomationPercentField
            value={draft.podBonusPercent}
            onChange={(podBonusPercent) => setDraft((prev) => ({ ...prev, podBonusPercent }))}
          />
        </AutomationFieldRow>
        <AutomationFieldRow label={catalog.podUplift.invisibleNote} mutedLabel>
          <AutomationStatusPill tone="on">{catalog.podUplift.activeBadge}</AutomationStatusPill>
        </AutomationFieldRow>
      </AutomationSectionCard>

      <div className="sticky bottom-0 z-10 -mx-5 mt-2 flex items-center justify-end gap-2.5 border-t border-[#e5e7eb] bg-white px-5 py-3 max-[700px]:-mx-3 max-[700px]:px-3">
        <Button
          type="button"
          onClick={() => {
            setDraft(cloneChampScoringEditable(baseline))
            showInfo('Champ Scoring fields restored to the last saved local mock values.')
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
              'Champ Scoring saved locally via Save Automation (frontend mock only). Backend was not updated.',
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

function RealChampScoringPage() {
  const catalog = useMemo(() => getChampScoringMock(), [])
  const ruleSet = useDispatchRuleSet()
  const [serverConfig, setServerConfig] = useState(null)
  const [weights, setWeights] = useState(null)

  useEffect(() => {
    if (!ruleSet.draftConfig) return
    setServerConfig(structuredClone(ruleSet.draftConfig))
    setWeights(mapConfigToScoringDisplay(ruleSet.draftConfig))
  }, [ruleSet.draftConfig, ruleSet.meta?.id, ruleSet.meta?.updatedAt])

  const factors = useMemo(() => {
    if (!weights) return catalog.weights.factors
    return catalog.weights.factors.map((factor) => {
      const percentMap = {
        eta: weights.etaWeight,
        cpi: weights.cpiWeight,
        load: weights.activeLoadWeight,
        category: weights.categoryFitWeight,
      }
      return { ...factor, percent: percentMap[factor.id] ?? factor.percent, readOnly: true }
    })
  }, [catalog.weights.factors, weights])

  async function handleSimulate() {
    try {
      const result = await ruleSet.simulate({ limit: SIMULATE_MAX_LIMIT })
      const count = result?.data?.results?.length ?? 0
      showSuccess(
        `Shadow simulate finished on ${count} order(s) (backend max ${SIMULATE_MAX_LIMIT}; product target 500 later). Side-effect free.`,
      )
    } catch (error) {
      showError(error?.message || 'Simulation failed.')
    }
  }

  async function handleSaveChanges() {
    showInfo(
      'No editable DispatchRuleSet scoring fields in P2B. Weights are locked; POD bonus is not connected. Nothing was PATCHed.',
    )
  }

  async function handleSaveAutomation() {
    if (!ruleSet.meta?.id) return
    const confirmed = window.confirm(
      `Activate DispatchRuleSet “${ruleSet.meta.name || ruleSet.meta.id}” (v${ruleSet.meta.version})?\n\nThis publishes the current server draft. Scoring weights and POD bonus are not changed by this screen.`,
    )
    if (!confirmed) return
    try {
      const result = await ruleSet.activate('Activated from Automation → Champ Scoring')
      if (result?.data?.draftConfig) {
        setServerConfig(structuredClone(result.data.draftConfig))
        setWeights(mapConfigToScoringDisplay(result.data.draftConfig))
      }
      showSuccess(`Activated version ${result?.data?.meta?.version ?? ''}.`.trim())
    } catch (error) {
      showError(error?.message || 'Activation failed. Previous active version remains.')
    }
  }

  if (ruleSet.isLoading && !weights) {
    return <ApiState isLoading error={null} />
  }
  if (ruleSet.error && !weights) {
    return <ApiState isLoading={false} error={ruleSet.error} onRetry={ruleSet.refetch} />
  }
  if (!weights) {
    return <ApiState isLoading error={null} />
  }

  return (
    <div className="pb-20">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[17px] font-bold text-[#111827]">{catalog.header.title}</h2>
          <p className="mt-1 text-[12px] text-[#6b7280]">{catalog.header.subtitle}</p>
          {ruleSet.meta ? (
            <p className="mt-1 text-[11px] text-[#6b7280]">
              Rule set: {ruleSet.meta.name} · {ruleSet.meta.status} · v{ruleSet.meta.version}
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
            className="inline-flex h-[34px] items-center gap-1.5 rounded-[7px] border border-[#d1d5db] bg-white px-3.5 text-[12px] font-medium text-[#6b7280]"
          >
            Save Changes
          </button>
        </div>
      </div>

      <DispatchRuleSetScopeNotice />

      <AutomationGapBanner tone="amber" label="Simulation capability gap">
        <p>
          UI previously said “last 500 orders”. Backend shadow simulate max is {SIMULATE_MAX_LIMIT}.
          Product target remains 500 (Phase P7b).
        </p>
      </AutomationGapBanner>

      <AutomationCallout tone="red" label={catalog.cpiNotice.label} className="!mx-0 mb-5">
        <p>{catalog.cpiNotice.body}</p>
      </AutomationCallout>

      <AutomationSectionCard
        title="Scoring factor weights"
        actions={<AutomationStatusPill tone="on">Total: 100% ✓ · locked</AutomationStatusPill>}
      >
        {factors.map((factor) => (
          <ScoringWeightRow
            key={factor.id}
            label={factor.label}
            labelSuffix={factor.labelSuffix || '(read-only)'}
            percent={factor.percent}
            note={factor.note}
            barTone={factor.barTone}
            loadFactors={factor.loadFactors}
            categoryFitFactors={factor.categoryFitFactors}
          />
        ))}
      </AutomationSectionCard>

      <AutomationSectionCard title={catalog.cpiTable.title}>
        <AutomationCallout tone="red" label={catalog.cpiTable.suspensionNotice.label}>
          <p>{catalog.cpiTable.suspensionNotice.body}</p>
        </AutomationCallout>
        <CpiTierTable columns={catalog.cpiTable.columns} tiers={catalog.cpiTable.tiers} />
      </AutomationSectionCard>

      <AutomationSectionCard title={catalog.podUplift.title}>
        <AutomationGapBanner tone="amber" label="Not connected — Phase P6" className="!mx-0 !mt-0 mb-0 border-0">
          <p>
            Locked requirement: +5% for Champs with zero cash disputes in the previous 30 days.
            Scorer + dispute ledger are not implemented. This control does <strong>not</strong>{' '}
            affect dispatch and is not included in PATCH.
          </p>
        </AutomationGapBanner>
        <AutomationFieldRow label={catalog.podUplift.bonusLabel}>
          <AutomationPercentField value="5" disabled onChange={() => {}} />
        </AutomationFieldRow>
        <AutomationFieldRow label={catalog.podUplift.invisibleNote} mutedLabel>
          <AutomationStatusPill tone="off">Not wired</AutomationStatusPill>
        </AutomationFieldRow>
      </AutomationSectionCard>

      <div className="sticky bottom-0 z-10 -mx-5 mt-2 flex items-center justify-end gap-2.5 border-t border-[#e5e7eb] bg-white px-5 py-3 max-[700px]:-mx-3 max-[700px]:px-3">
        <Button
          type="button"
          onClick={() => {
            if (serverConfig) setWeights(mapConfigToScoringDisplay(serverConfig))
            showInfo('Weights reloaded from server draft (locked).')
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

export default function AdminChampScoringPage() {
  if (!isAutomationRealApi()) return <MockChampScoringPage />
  return <RealChampScoringPage />
}
