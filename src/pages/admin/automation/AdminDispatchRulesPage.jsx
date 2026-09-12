import { useMemo, useState } from 'react'
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
import { Button } from '../../../components/admin/Button'
import {
  cloneDispatchRulesEditable,
  createDispatchRulesEditableDefaults,
  getDispatchRulesMock,
} from '../../../mocks/adminAutomationDispatchRules.mock'
import { showInfo, showSuccess } from '../../../utils/toast'

export default function AdminDispatchRulesPage() {
  const catalog = useMemo(() => getDispatchRulesMock(), [])
  const [baseline, setBaseline] = useState(() =>
    cloneDispatchRulesEditable(catalog.editable || createDispatchRulesEditableDefaults()),
  )
  const [draft, setDraft] = useState(() => cloneDispatchRulesEditable(baseline))

  function updateField(fieldKey, nextValue) {
    setDraft((prev) => ({ ...prev, [fieldKey]: nextValue }))
  }

  function handleRefresh() {
    showInfo('Dispatch Rules KPIs refreshed from local mock data. No backend call was made.')
  }

  function handleAddRule() {
    showInfo('Add Rule is not configured yet. No rule workflow was invented for this frontend phase.')
  }

  function handleSimulate(scope) {
    showInfo(`${scope} simulation is visual-only in this phase. No backend simulation was called.`)
  }

  function handleReset() {
    setDraft(cloneDispatchRulesEditable(baseline))
    showInfo('Dispatch Rules fields restored to the last saved local mock values.')
  }

  function handleSave() {
    const next = cloneDispatchRulesEditable(draft)
    setBaseline(next)
    setDraft(cloneDispatchRulesEditable(next))
    showSuccess('Dispatch Rules saved locally (frontend mock only). Backend was not updated.')
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
            onClick={handleRefresh}
            className="inline-flex h-[34px] items-center gap-1.5 rounded-[7px] border border-[#d1d5db] bg-white px-3.5 text-[12px] font-medium text-[#111827] transition hover:border-[#1D6A33] hover:text-[#1D6A33]"
          >
            <RefreshCw size={13} strokeWidth={2} aria-hidden />
            Refresh
          </button>
          <button
            type="button"
            onClick={handleAddRule}
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
              onClick={() => handleSimulate('Gate 1')}
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
                onChange={(next) => updateField(row.fieldKey, next)}
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
              onClick={() => handleSimulate('Gate 2')}
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
        {catalog.vendorAcceptance.thresholds.map((row) => (
          <AutomationFieldRow key={row.id} label={row.label} help={row.help}>
            <AutomationDurationField
              value={draft[row.fieldKey]}
              onChange={(next) => updateField(row.fieldKey, next)}
            />
          </AutomationFieldRow>
        ))}

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
        <Button type="button" onClick={handleReset} className="rounded-full px-5">
          Reset
        </Button>
        <Button type="button" primary onClick={handleSave} className="rounded-full px-6">
          Save Automation
        </Button>
      </div>
    </div>
  )
}
