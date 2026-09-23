import { useEffect, useMemo, useState } from 'react'
import { Play, Plus, RefreshCw } from 'lucide-react'
import { AcceptanceTimeline } from '../../../components/admin/automation/AcceptanceTimeline'
import { AutomationCallout } from '../../../components/admin/automation/AutomationCallout'
import {
  AutomationDurationField,
  AutomationKpiCard,
  AutomationOperatorNumberField,
} from '../../../components/admin/automation/AutomationFields'
import {
  AutomationFieldRow,
  AutomationSectionCard,
  AutomationSubsectionTitle,
} from '../../../components/admin/automation/AutomationSectionCard'
import { AutomationStatusPill } from '../../../components/admin/automation/AutomationStatusPill'
import { ApiErrorBanner, ApiState } from '../../../components/admin/ApiState'
import { Button } from '../../../components/admin/Button'
import { useAdminDispatchOverview } from '../../../hooks/admin/useAdminDispatchOverview'
import { useDispatchRuleSet } from '../../../hooks/admin/useDispatchRuleSet'
import {
  applyDispatchRulesEdits,
  buildVendorAcceptanceTimelineFromEffective,
  mapConfigToDispatchRulesEditable,
  mapOverviewToKpis,
  SIMULATE_MAX_LIMIT,
} from '../../../mappers/admin/mapDispatchAutomation'
import {
  cloneDispatchRulesEditable as cloneMockEditable,
  createDispatchRulesEditableDefaults,
  getDispatchRulesMock,
} from '../../../mocks/adminAutomationDispatchRules.mock'
import { isAutomationRealApi } from '../../../services/admin/dispatchAutomationFeature'
import { showError, showInfo, showSuccess } from '../../../utils/toast'
import { useVendorAcceptanceSlaEffective } from '../../../hooks/admin/useVendorAcceptanceSlaEffective'

function cloneEditable(editable) {
  return structuredClone(editable)
}

function MockDispatchRulesPage() {
  const catalog = useMemo(() => getDispatchRulesMock(), [])
  const [baseline, setBaseline] = useState(() =>
    cloneMockEditable(catalog.editable || createDispatchRulesEditableDefaults()),
  )
  const [draft, setDraft] = useState(() => cloneMockEditable(baseline))

  function updateField(fieldKey, nextValue) {
    setDraft((prev) => ({ ...prev, [fieldKey]: nextValue }))
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
              showInfo('Dispatch Rules KPIs refreshed from local mock data. No backend call was made.')
            }
            className="inline-flex h-[34px] items-center gap-1.5 rounded-[7px] border border-[#d1d5db] bg-white px-3.5 text-[12px] font-medium text-[#111827] transition hover:border-[#1D6A33] hover:text-[#1D6A33]"
          >
            <RefreshCw size={13} strokeWidth={2} aria-hidden />
            Refresh
          </button>
          <button
            type="button"
            onClick={() =>
              showInfo(
                'Add Rule is not configured yet. No rule workflow was invented for this frontend phase.',
              )
            }
            className="inline-flex h-[34px] items-center gap-1.5 rounded-[7px] border border-[#1D6A33] bg-[#1D6A33] px-3.5 text-[12px] font-semibold text-white transition hover:bg-[#114225]"
          >
            <Plus size={14} strokeWidth={2.2} aria-hidden />
            Add Rule
          </button>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-3 min-[520px]:grid-cols-2 min-[1100px]:grid-cols-4">
        {catalog.kpis.map((kpi) => (
          <AutomationKpiCard
            key={kpi.id}
            value={kpi.value}
            label={kpi.label}
            delta={kpi.delta}
            deltaTone={kpi.deltaTone}
            accent={kpi.accent}
          />
        ))}
      </div>

      <AutomationSectionCard
        title={catalog.gate1.title}
        subtitle={catalog.gate1.subtitle}
        actions={
          <>
            <AutomationStatusPill tone="on" showDot>
              {catalog.gate1.status}
            </AutomationStatusPill>
            <button
              type="button"
              onClick={() =>
                showInfo('Gate 1 simulation is visual-only in this phase. No backend simulation was called.')
              }
              className="inline-flex items-center gap-1.5 rounded-[7px] border border-[#bfdbfe] bg-[#eff6ff] px-3 py-1.5 text-[11.5px] font-semibold text-[#2563eb]"
            >
              <Play size={11} fill="currentColor" aria-hidden />
              Simulate
            </button>
          </>
        }
      >
        {catalog.gate1.rows.map((row) => (
          <AutomationFieldRow key={row.id} label={row.label}>
            {row.kind === 'enforced' ? (
              <AutomationStatusPill tone="on">{row.value}</AutomationStatusPill>
            ) : (
              <AutomationOperatorNumberField
                value={draft[row.fieldKey]}
                unit={row.unit}
                operatorLocked
                operators={['≤']}
                onChange={(next) => updateField(row.fieldKey, { ...next, operator: '≤' })}
              />
            )}
          </AutomationFieldRow>
        ))}
      </AutomationSectionCard>

      <AutomationSectionCard
        title={catalog.gate2.title}
        subtitle={catalog.gate2.subtitle}
        actions={
          <>
            <AutomationStatusPill tone="on" showDot>
              {catalog.gate2.status}
            </AutomationStatusPill>
            <button
              type="button"
              onClick={() =>
                showInfo('Gate 2 simulation is visual-only in this phase. No backend simulation was called.')
              }
              className="inline-flex items-center gap-1.5 rounded-[7px] border border-[#bfdbfe] bg-[#eff6ff] px-3 py-1.5 text-[11.5px] font-semibold text-[#2563eb]"
            >
              <Play size={11} fill="currentColor" aria-hidden />
              Simulate
            </button>
          </>
        }
      >
        {catalog.gate2.rows.map((row) => (
          <AutomationFieldRow key={row.id} label={row.label}>
            <AutomationStatusPill tone={row.tone}>{row.value}</AutomationStatusPill>
          </AutomationFieldRow>
        ))}
      </AutomationSectionCard>

      <AutomationSectionCard
        title={catalog.vendorAcceptance.title}
        subtitle={catalog.vendorAcceptance.subtitle}
        actions={
          <AutomationStatusPill tone="on" showDot>
            {catalog.vendorAcceptance.status}
          </AutomationStatusPill>
        }
      >
        <AutomationCallout tone="green" label={catalog.vendorAcceptance.callout.label}>
          <p>{catalog.vendorAcceptance.callout.body}</p>
        </AutomationCallout>
        <AcceptanceTimeline stages={catalog.vendorAcceptance.timeline} />
        <AutomationSubsectionTitle>Configurable thresholds</AutomationSubsectionTitle>
        {catalog.vendorAcceptance.thresholds.map((row) => {
          const lockedOperator = draft[row.fieldKey]?.operator || '≤'
          return (
            <AutomationFieldRow key={row.id} label={row.label} help={row.help}>
              <AutomationDurationField
                value={draft[row.fieldKey]}
                operatorLocked
                operators={[lockedOperator]}
                onChange={(next) =>
                  updateField(row.fieldKey, { ...next, operator: lockedOperator })
                }
              />
            </AutomationFieldRow>
          )
        })}
        <AutomationSubsectionTitle>Event recording — feeds VPI weekly score</AutomationSubsectionTitle>
        {catalog.vendorAcceptance.events.map((row) => (
          <AutomationFieldRow key={row.id} label={row.label}>
            <AutomationStatusPill tone={row.tone}>{row.badge}</AutomationStatusPill>
          </AutomationFieldRow>
        ))}
        <AutomationFieldRow
          label={catalog.vendorAcceptance.vpi.label}
          help={catalog.vendorAcceptance.vpi.help}
        >
          <AutomationStatusPill tone="on">{catalog.vendorAcceptance.vpi.badge}</AutomationStatusPill>
        </AutomationFieldRow>
        <AutomationSubsectionTitle>
          {catalog.vendorAcceptance.liveDashboard.sectionTitle}
        </AutomationSubsectionTitle>
        <AutomationFieldRow label={catalog.vendorAcceptance.liveDashboard.flagsLabel}>
          {catalog.vendorAcceptance.liveDashboard.flags.map((flag) => (
            <AutomationStatusPill key={flag.id} tone={flag.tone}>
              {flag.label}
            </AutomationStatusPill>
          ))}
        </AutomationFieldRow>
        <AutomationFieldRow label={catalog.vendorAcceptance.liveDashboard.derivedLabel} mutedLabel>
          <AutomationStatusPill tone="on">
            {catalog.vendorAcceptance.liveDashboard.derivedBadge}
          </AutomationStatusPill>
        </AutomationFieldRow>
        <AutomationFieldRow label={catalog.vendorAcceptance.liveDashboard.dispatcherLabel} mutedLabel>
          <AutomationStatusPill tone="off">
            {catalog.vendorAcceptance.liveDashboard.dispatcherBadge}
          </AutomationStatusPill>
        </AutomationFieldRow>
      </AutomationSectionCard>

      <div className="sticky bottom-0 z-10 -mx-5 mt-2 flex items-center justify-end gap-2.5 border-t border-[#e5e7eb] bg-white px-5 py-3 max-[700px]:-mx-3 max-[700px]:px-3">
        <Button
          type="button"
          onClick={() => {
            setDraft(cloneMockEditable(baseline))
            showInfo('Dispatch Rules fields restored to the last saved local mock values.')
          }}
          className="rounded-full px-5"
        >
          Reset
        </Button>
        <Button
          type="button"
          primary
          onClick={() => {
            const next = cloneMockEditable(draft)
            setBaseline(next)
            setDraft(cloneMockEditable(next))
            showSuccess('Dispatch Rules saved locally (frontend mock only). Backend was not updated.')
          }}
          className="rounded-full px-6"
        >
          Save Automation
        </Button>
      </div>
    </div>
  )
}

function RealDispatchRulesPage() {
  const catalog = useMemo(() => getDispatchRulesMock(), [])
  const overview = useAdminDispatchOverview()
  const ruleSet = useDispatchRuleSet()
  const slaEffective = useVendorAcceptanceSlaEffective()

  const [baseline, setBaseline] = useState(null)
  const [draft, setDraft] = useState(null)
  const [serverConfig, setServerConfig] = useState(null)

  useEffect(() => {
    if (!ruleSet.draftConfig) return
    const editable = mapConfigToDispatchRulesEditable(
      ruleSet.draftConfig,
      slaEffective.hotFood,
    )
    setServerConfig(structuredClone(ruleSet.draftConfig))
    setBaseline(cloneEditable(editable))
    setDraft(cloneEditable(editable))
    // Intentionally omit slaEffective.hotFood — applied in a separate effect so Gate 1 edits
    // are not wiped when effective SLA arrives after the rule set.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- see comment above
  }, [ruleSet.draftConfig, ruleSet.meta?.id, ruleSet.meta?.updatedAt])

  useEffect(() => {
    if (!slaEffective.hotFood) return
    const slaFields = mapConfigToDispatchRulesEditable({}, slaEffective.hotFood)
    setBaseline((prev) =>
      prev
        ? {
            ...prev,
            slaTarget: slaFields.slaTarget,
            criticalThreshold: slaFields.criticalThreshold,
          }
        : prev,
    )
    setDraft((prev) =>
      prev
        ? {
            ...prev,
            slaTarget: slaFields.slaTarget,
            criticalThreshold: slaFields.criticalThreshold,
          }
        : prev,
    )
  }, [slaEffective.hotFood])

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

  function updateField(fieldKey, nextValue) {
    // Never allow SLA threshold edits to enter draft for PATCH
    if (fieldKey === 'slaTarget' || fieldKey === 'criticalThreshold') return
    setDraft((prev) => ({ ...prev, [fieldKey]: nextValue }))
  }

  async function handleRefresh() {
    if (dirty && !window.confirm('Discard unsaved Gate 1 edits and reload from the server?')) {
      return
    }
    await Promise.all([overview.refetch(), ruleSet.refetch(), slaEffective.refetch()])
    showInfo('Dispatch Rules refreshed from the server.')
  }

  async function handleSaveChanges() {
    if (!draft || !ruleSet.meta?.id) return
    try {
      const result = await ruleSet.mergeAndPatch(applyDispatchRulesEdits, draft)
      const nextConfig = result?.data?.draftConfig
      if (!nextConfig) throw new Error('Save succeeded but draft config was missing.')
      const nextEditable = mapConfigToDispatchRulesEditable(nextConfig, slaEffective.hotFood)
      setServerConfig(structuredClone(nextConfig))
      setBaseline(cloneEditable(nextEditable))
      setDraft(cloneEditable(nextEditable))
      showSuccess('Draft saved. Live dispatch is unchanged until you activate.')
    } catch (error) {
      showError(error?.message || 'Failed to save draft.')
    }
  }

  async function handleSaveAutomation() {
    if (!ruleSet.meta?.id) return
    if (dirty) {
      showInfo('Save Changes first, then activate — activation publishes the server draft.')
      return
    }
    const version = ruleSet.meta.version ?? '?'
    const confirmed = window.confirm(
      `Activate DispatchRuleSet “${ruleSet.meta.name || ruleSet.meta.id}” (current version ${version})?\n\nThis publishes the draft and can change live dispatch behavior.`,
    )
    if (!confirmed) return
    try {
      const result = await ruleSet.activate('Activated from Automation → Dispatch Rules')
      const nextConfig = result?.data?.draftConfig
      if (nextConfig) {
        const nextEditable = mapConfigToDispatchRulesEditable(nextConfig, slaEffective.hotFood)
        setServerConfig(structuredClone(nextConfig))
        setBaseline(cloneEditable(nextEditable))
        setDraft(cloneEditable(nextEditable))
      }
      await overview.refetch()
      showSuccess(`Activated version ${result?.data?.meta?.version ?? ''}.`.trim())
    } catch (error) {
      showError(error?.message || 'Activation failed. Previous active version remains.')
    }
  }

  async function handleSimulate(scope) {
    try {
      const result = await ruleSet.simulate({ limit: SIMULATE_MAX_LIMIT })
      const count = result?.data?.results?.length ?? 0
      showSuccess(
        `${scope} shadow simulate finished on ${count} order(s) (last ≤${SIMULATE_MAX_LIMIT}). Side-effect free.`,
      )
    } catch (error) {
      showError(error?.message || 'Simulation failed.')
    }
  }

  if (overview.isLoading && !overview.kpis && ruleSet.isLoading && !ruleSet.rule) {
    return <ApiState isLoading error={null} />
  }

  if (ruleSet.error && !draft && !ruleSet.empty) {
    return (
      <ApiState
        isLoading={false}
        error={ruleSet.error}
        onRetry={() => {
          overview.refetch()
          ruleSet.refetch()
        }}
      />
    )
  }

  if (ruleSet.empty || (!draft && !ruleSet.isLoading && !ruleSet.rule)) {
    return (
      <div className="pb-20 px-1">
        <div className="rounded-lg border border-[#fde68a] bg-[#fffbeb] px-4 py-4 text-[13px] text-[#92400e]">
          <p className="font-semibold">No DispatchRuleSet found in the database.</p>
          <p className="mt-1 text-[12.5px] leading-relaxed">
            Automation needs at least one rule set. Create a platform default draft (from the backend
            template). You need <strong>SLA_MODELS · CREATE</strong> permission.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={ruleSet.isCreating}
              onClick={async () => {
                try {
                  await ruleSet.createDefault()
                  await overview.refetch()
                  showSuccess('Default DispatchRuleSet created as DRAFT.')
                } catch (error) {
                  showError(error?.message || 'Could not create DispatchRuleSet.')
                }
              }}
              className="inline-flex h-[34px] items-center rounded-[7px] border border-[#1D6A33] bg-[#1D6A33] px-3.5 text-[12px] font-semibold text-white disabled:opacity-50"
            >
              {ruleSet.isCreating ? 'Creating…' : 'Create default rule set'}
            </button>
            <button
              type="button"
              onClick={() => ruleSet.refetch()}
              className="inline-flex h-[34px] items-center rounded-[7px] border border-[#d1d5db] bg-white px-3.5 text-[12px] font-medium text-[#111827]"
            >
              Try again
            </button>
          </div>
          {ruleSet.error ? (
            <p className="mt-3 text-[12px] text-[#a93e42]">{ruleSet.error.message || String(ruleSet.error)}</p>
          ) : null}
        </div>
      </div>
    )
  }

  if (!draft) {
    return <ApiState isLoading error={null} />
  }

  const gateStatus =
    ruleSet.meta?.status === 'ACTIVE' ? 'Active' : ruleSet.meta?.status || catalog.gate1.status
  const kpis = overview.data?.raw
    ? mapOverviewToKpis(overview.data.raw, {
        onTimeThresholdSec: slaEffective.hotFood?.onTimeThresholdSec,
      })
    : catalog.kpis
  const acceptanceTimeline = buildVendorAcceptanceTimelineFromEffective(slaEffective.hotFood)

  return (
    <div className="pb-20">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[17px] font-bold text-[#111827]">{catalog.header.title}</h2>
          <p className="mt-1 text-[12px] text-[#6b7280]">{catalog.header.subtitle}</p>
          {ruleSet.meta ? (
            <p className="mt-1 text-[11px] text-[#6b7280]">
              Rule set: {ruleSet.meta.name} · {ruleSet.meta.status} · v{ruleSet.meta.version}
              {dirty ? ' · unsaved draft edits' : ''}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            className="inline-flex h-[34px] items-center gap-1.5 rounded-[7px] border border-[#d1d5db] bg-white px-3.5 text-[12px] font-medium text-[#111827] transition hover:border-[#1D6A33] hover:text-[#1D6A33]"
          >
            <RefreshCw size={13} strokeWidth={2} aria-hidden />
            Refresh
          </button>
          <button
            type="button"
            onClick={handleSaveChanges}
            disabled={ruleSet.isSaving || !dirty}
            className="inline-flex h-[34px] items-center gap-1.5 rounded-[7px] border border-[#1D6A33] bg-[#1D6A33] px-3.5 text-[12px] font-semibold text-white transition hover:bg-[#114225] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Save Changes
          </button>
          <button
            type="button"
            onClick={() =>
              showInfo(
                'Add Rule is not configured yet. Creating a free-form rules builder is a product decision.',
              )
            }
            className="inline-flex h-[34px] items-center gap-1.5 rounded-[7px] border border-[#d1d5db] bg-white px-3.5 text-[12px] font-medium text-[#6b7280]"
          >
            <Plus size={14} strokeWidth={2.2} aria-hidden />
            Add Rule
          </button>
        </div>
      </div>

      {overview.error ? (
        <ApiErrorBanner error={overview.error} onRetry={overview.refetch} className="mb-4" />
      ) : null}

      <div className="mb-5 grid grid-cols-1 gap-3 min-[520px]:grid-cols-2 min-[1100px]:grid-cols-4">
        {kpis.map((kpi) => (
          <AutomationKpiCard
            key={kpi.id}
            value={kpi.value}
            label={kpi.label}
            delta={kpi.delta}
            deltaTone={kpi.deltaTone}
            accent={kpi.accent}
          />
        ))}
      </div>

      <AutomationSectionCard
        title={catalog.gate1.title}
        subtitle={catalog.gate1.subtitle}
        actions={
          <>
            <AutomationStatusPill tone="on" showDot>
              {gateStatus}
            </AutomationStatusPill>
            <button
              type="button"
              onClick={() => handleSimulate('Gate 1')}
              disabled={ruleSet.isSimulating}
              className="inline-flex items-center gap-1.5 rounded-[7px] border border-[#bfdbfe] bg-[#eff6ff] px-3 py-1.5 text-[11.5px] font-semibold text-[#2563eb] disabled:opacity-50"
            >
              <Play size={11} fill="currentColor" aria-hidden />
              Simulate (≤{SIMULATE_MAX_LIMIT})
            </button>
          </>
        }
      >
        {catalog.gate1.rows.map((row) => (
          <AutomationFieldRow key={row.id} label={row.label}>
            {row.kind === 'enforced' ? (
              <AutomationStatusPill tone="on">{row.value}</AutomationStatusPill>
            ) : (
              <AutomationOperatorNumberField
                value={draft[row.fieldKey]}
                unit={row.unit}
                operatorLocked
                operators={['≤']}
                onChange={(next) => updateField(row.fieldKey, { ...next, operator: '≤' })}
              />
            )}
          </AutomationFieldRow>
        ))}
      </AutomationSectionCard>

      <AutomationSectionCard
        title={catalog.gate2.title}
        subtitle={catalog.gate2.subtitle}
        actions={
          <AutomationStatusPill tone="on" showDot>
            {gateStatus}
          </AutomationStatusPill>
        }
      >
        {catalog.gate2.rows.map((row) => (
          <AutomationFieldRow key={row.id} label={row.label}>
            <AutomationStatusPill tone={row.tone}>{row.value}</AutomationStatusPill>
          </AutomationFieldRow>
        ))}
      </AutomationSectionCard>

      <AutomationSectionCard
        title={catalog.vendorAcceptance.title}
        subtitle={catalog.vendorAcceptance.subtitle}
        actions={
          <AutomationStatusPill tone="on" showDot>
            {catalog.vendorAcceptance.status}
          </AutomationStatusPill>
        }
      >
        {slaEffective.error ? (
          <ApiErrorBanner
            error={slaEffective.error}
            onRetry={() => slaEffective.refetch()}
            className="mx-0 mt-0 mb-3"
          />
        ) : null}

        <AutomationCallout tone="green" label={catalog.vendorAcceptance.callout.label}>
          <p>{catalog.vendorAcceptance.callout.body}</p>
        </AutomationCallout>

        {acceptanceTimeline ? (
          <AcceptanceTimeline stages={acceptanceTimeline} />
        ) : (
          <div className="border-t border-[#e5e7eb] px-5 py-4 text-[12.5px] text-[#6b7280]">
            Acceptance timeline is hidden until effective SLA timing loads successfully.
          </div>
        )}

        <AutomationSubsectionTitle>Configurable thresholds (SLA-owned · read-only)</AutomationSubsectionTitle>
        {catalog.vendorAcceptance.thresholds.map((row) => {
          const value = draft[row.fieldKey]
          const lockedOperator = value?.operator || (row.fieldKey === 'criticalThreshold' ? '≥' : '≤')
          return (
            <AutomationFieldRow key={row.id} label={row.label} help={row.help}>
              {value ? (
                <AutomationDurationField
                  value={value}
                  disabled
                  operatorLocked
                  operators={[lockedOperator]}
                  onChange={() => {}}
                />
              ) : (
                <span className="text-[12.5px] text-[#6b7280]">Unavailable</span>
              )}
            </AutomationFieldRow>
          )
        })}

        <AutomationSubsectionTitle>Event recording — feeds VPI weekly score</AutomationSubsectionTitle>
        {catalog.vendorAcceptance.events.map((row) => {
          const onSec = slaEffective.hotFood?.onTimeThresholdSec
          const label =
            row.id === 'breach' && Number.isFinite(onSec)
              ? `at_risk_breach_at (when ${onSec}s crossed)`
              : row.label
          return (
            <AutomationFieldRow key={row.id} label={label}>
              <AutomationStatusPill tone={row.tone}>{row.badge}</AutomationStatusPill>
            </AutomationFieldRow>
          )
        })}

        <AutomationFieldRow
          label={catalog.vendorAcceptance.vpi.label}
          help={catalog.vendorAcceptance.vpi.help}
        >
          <AutomationStatusPill tone="on">{catalog.vendorAcceptance.vpi.badge}</AutomationStatusPill>
        </AutomationFieldRow>

        <AutomationSubsectionTitle>
          {catalog.vendorAcceptance.liveDashboard.sectionTitle}
        </AutomationSubsectionTitle>
        <AutomationFieldRow label={catalog.vendorAcceptance.liveDashboard.flagsLabel}>
          {catalog.vendorAcceptance.liveDashboard.flags.map((flag) => (
            <AutomationStatusPill key={flag.id} tone={flag.tone}>
              {flag.label}
            </AutomationStatusPill>
          ))}
        </AutomationFieldRow>
        <AutomationFieldRow label={catalog.vendorAcceptance.liveDashboard.derivedLabel} mutedLabel>
          <AutomationStatusPill tone="on">
            {catalog.vendorAcceptance.liveDashboard.derivedBadge}
          </AutomationStatusPill>
        </AutomationFieldRow>
        <AutomationFieldRow label={catalog.vendorAcceptance.liveDashboard.dispatcherLabel} mutedLabel>
          <AutomationStatusPill tone="off">
            {catalog.vendorAcceptance.liveDashboard.dispatcherBadge}
          </AutomationStatusPill>
        </AutomationFieldRow>
      </AutomationSectionCard>

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

export default function AdminDispatchRulesPage() {
  if (!isAutomationRealApi()) {
    return <MockDispatchRulesPage />
  }
  return <RealDispatchRulesPage />
}
