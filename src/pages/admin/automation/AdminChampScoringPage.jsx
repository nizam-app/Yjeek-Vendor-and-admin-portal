import { useMemo, useState } from 'react'
import { Play } from 'lucide-react'
import { AutomationCallout } from '../../../components/admin/automation/AutomationCallout'
import { AutomationPercentField } from '../../../components/admin/automation/AutomationFields'
import {
  AutomationFieldRow,
  AutomationSectionCard,
} from '../../../components/admin/automation/AutomationSectionCard'
import { AutomationStatusPill } from '../../../components/admin/automation/AutomationStatusPill'
import { CpiTierTable } from '../../../components/admin/automation/CpiTierTable'
import { ScoringWeightRow } from '../../../components/admin/automation/ScoringWeightRow'
import { Button } from '../../../components/admin/Button'
import {
  cloneChampScoringEditable,
  createChampScoringEditableDefaults,
  getChampScoringMock,
} from '../../../mocks/adminAutomationChampScoring.mock'
import { showInfo, showSuccess } from '../../../utils/toast'

export default function AdminChampScoringPage() {
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

  function handleSimulate() {
    showInfo(
      'Simulate on last 500 orders is visual-only in this phase. No backend simulation or results were generated.',
    )
  }

  function handleSaveChanges() {
    persistLocal('Champ Scoring saved locally via Save Changes (frontend mock only). Backend was not updated.')
  }

  function handleReset() {
    setDraft(cloneChampScoringEditable(baseline))
    showInfo('Champ Scoring fields restored to the last saved local mock values.')
  }

  function handleSaveAutomation() {
    persistLocal(
      'Champ Scoring saved locally via Save Automation (frontend mock only). Backend was not updated.',
    )
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
            onClick={handleSimulate}
            className="inline-flex h-[34px] items-center gap-1.5 rounded-[7px] border border-[#bfdbfe] bg-[#eff6ff] px-3.5 text-[11.5px] font-semibold text-[#2563eb]"
          >
            <Play size={11} fill="currentColor" aria-hidden />
            Simulate on last 500 orders
          </button>
          <button
            type="button"
            onClick={handleSaveChanges}
            className="inline-flex h-[34px] items-center gap-1.5 rounded-[7px] border border-[#1D6A33] bg-[#1D6A33] px-3.5 text-[12px] font-semibold text-white transition hover:bg-[#114225]"
          >
            Save Changes
          </button>
        </div>
      </div>

      <AutomationCallout
        tone="red"
        label={catalog.cpiNotice.label}
        className="!mx-0 mb-5"
      >
        <p>{catalog.cpiNotice.body}</p>
      </AutomationCallout>

      <AutomationSectionCard
        title="Scoring factor weights"
        actions={
          <AutomationStatusPill tone="on">{catalog.weights.totalLabel}</AutomationStatusPill>
        }
      >
        {catalog.weights.factors.map((factor) => (
          <ScoringWeightRow
            key={factor.id}
            label={factor.label}
            labelSuffix={factor.labelSuffix}
            percent={factor.percent}
            note={factor.note}
            barTone={factor.barTone}
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
        <Button type="button" onClick={handleReset} className="rounded-full px-5">
          Reset
        </Button>
        <Button type="button" primary onClick={handleSaveAutomation} className="rounded-full px-6">
          Save Automation
        </Button>
      </div>
    </div>
  )
}
