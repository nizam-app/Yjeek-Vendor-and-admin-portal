import { useMemo, useState } from 'react'
import { AutomationGapBanner } from './AutomationGapBanner'
import { AutomationSectionCard } from './AutomationSectionCard'
import { AutomationStatusPill } from './AutomationStatusPill'
import { showError, showInfo, showSuccess } from '../../../utils/toast'

/**
 * Admin-only lifecycle controls for DispatchRuleSet.
 * Does not touch SLA, payment, stacking liveEnabled, or client apps.
 */
export function AutomationLifecycleControls({ ruleSet, onAfterChange }) {
  const meta = ruleSet?.meta
  const status = meta?.status || '—'
  const version = meta?.version ?? '—'
  const versions = useMemo(() => {
    const rows = Array.isArray(meta?.versions) ? [...meta.versions] : []
    return rows
      .filter((row) => Number(row.version) > 0)
      .sort((a, b) => Number(b.version) - Number(a.version))
  }, [meta?.versions])

  const rollbackCandidates = versions.filter((row) => Number(row.version) !== Number(meta?.version))
  const [rollbackVersion, setRollbackVersion] = useState('')

  const busy =
    ruleSet?.isActivating ||
    ruleSet?.isEnteringTestMode ||
    ruleSet?.isPausing ||
    ruleSet?.isRollingBack

  const canTest = status === 'DRAFT'
  const canPause = status === 'ACTIVE'
  const canResume = status === 'PAUSED'
  const canRollback = rollbackCandidates.length > 0 && (status === 'ACTIVE' || status === 'PAUSED' || status === 'TEST' || status === 'DRAFT')

  async function handleEnterTestMode() {
    if (!canTest) {
      showInfo('Test Mode is only available for DRAFT rule sets. Create or keep a draft to enter Test Mode.')
      return
    }
    const ok = window.confirm(
      `Enter Test Mode for “${meta?.name || meta?.id}”?\n\nThis marks the draft as TEST for ops review. Live ACTIVE dispatch is not changed.`,
    )
    if (!ok) return
    try {
      await ruleSet.enterTestMode()
      showSuccess('Rule set is now in Test Mode. Live dispatch is unchanged.')
      await onAfterChange?.()
    } catch (error) {
      showError(error?.message || 'Could not enter Test Mode.')
    }
  }

  async function handlePause() {
    if (!canPause) {
      showInfo('Only an ACTIVE rule set can be paused.')
      return
    }
    const ok = window.confirm(
      `PAUSE automated dispatch for “${meta?.name || meta?.id}” (v${version})?\n\n` +
        'While paused, automated Champ offers stop (DISPATCH_AUTOMATION_PAUSED).\n' +
        'SLA Models, payment, checkout, and stacking liveEnabled are not modified.\n' +
        'Resume with Activate / Save Automation.',
    )
    if (!ok) return
    try {
      await ruleSet.pause()
      showSuccess('Automation paused. Resume with Activate when ready.')
      await onAfterChange?.()
    } catch (error) {
      showError(error?.message || 'Could not pause automation.')
    }
  }

  async function handleResume() {
    if (!canResume) return
    const ok = window.confirm(
      `Resume / activate “${meta?.name || meta?.id}”?\n\nThis publishes the current draft as ACTIVE and re-enables automated dispatch.`,
    )
    if (!ok) return
    try {
      await ruleSet.activate('Resumed from PAUSED via Automation lifecycle controls')
      showSuccess('Automation resumed (ACTIVE).')
      await onAfterChange?.()
    } catch (error) {
      showError(error?.message || 'Could not resume automation.')
    }
  }

  async function handleRollback() {
    const selected = Number(rollbackVersion || rollbackCandidates[0]?.version)
    if (!Number.isFinite(selected) || selected < 1) {
      showInfo('Select a prior published version to roll back to.')
      return
    }
    const ok = window.confirm(
      `Roll back “${meta?.name || meta?.id}” to published version ${selected}?\n\n` +
        'This creates a NEW active version from that snapshot (does not rewrite history).\n' +
        'Stacking liveEnabled remains forced off by server policy.',
    )
    if (!ok) return
    try {
      await ruleSet.rollback({
        version: selected,
        note: `Admin rollback to version ${selected}`,
      })
      showSuccess(`Rolled back to source v${selected} (published as a new version).`)
      setRollbackVersion('')
      await onAfterChange?.()
    } catch (error) {
      showError(error?.message || 'Rollback failed.')
    }
  }

  if (!meta?.id) return null

  return (
    <AutomationSectionCard
      title="Operational controls"
      subtitle="Test Mode · Pause · Rollback — Admin DispatchRuleSet only"
      actions={
        <AutomationStatusPill tone={status === 'ACTIVE' ? 'on' : status === 'PAUSED' ? 'warn' : 'off'} showDot>
          {status} · v{version}
        </AutomationStatusPill>
      }
    >
      <AutomationGapBanner tone="amber" label="Ops impact">
        <p>
          Pause stops automated dispatch until Activate. Rollback republishes a prior snapshot as a
          new version. Test Mode only applies to DRAFT sets and does not change live ACTIVE behavior.
          These controls do not edit SLA Models, payment, Customer/Champ/Vendor APIs, or enable
          stacking.
        </p>
      </AutomationGapBanner>

      <div className="flex flex-wrap items-center gap-2 border-t border-[#e5e7eb] px-5 py-3">
        <button
          type="button"
          disabled={busy || !canTest}
          onClick={handleEnterTestMode}
          className="inline-flex h-[34px] items-center rounded-[7px] border border-[#d1d5db] bg-white px-3.5 text-[12px] font-medium text-[#111827] disabled:cursor-not-allowed disabled:opacity-45"
        >
          Enter Test Mode
        </button>
        <button
          type="button"
          disabled={busy || !canPause}
          onClick={handlePause}
          className="inline-flex h-[34px] items-center rounded-[7px] border border-[#fecaca] bg-[#fef2f2] px-3.5 text-[12px] font-semibold text-[#991b1b] disabled:cursor-not-allowed disabled:opacity-45"
        >
          Pause Automation
        </button>
        <button
          type="button"
          disabled={busy || !canResume}
          onClick={handleResume}
          className="inline-flex h-[34px] items-center rounded-[7px] border border-[#1D6A33] bg-[#1D6A33] px-3.5 text-[12px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45"
        >
          Resume (Activate)
        </button>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <label className="text-[11px] font-medium text-[#6b7280]" htmlFor="automation-rollback-version">
            Rollback to
          </label>
          <select
            id="automation-rollback-version"
            value={rollbackVersion || String(rollbackCandidates[0]?.version || '')}
            onChange={(event) => setRollbackVersion(event.target.value)}
            disabled={busy || !canRollback}
            className="h-[34px] rounded-[7px] border border-[#d1d5db] bg-white px-2 text-[12px] text-[#111827] disabled:opacity-45"
          >
            {rollbackCandidates.length === 0 ? (
              <option value="">No prior versions</option>
            ) : (
              rollbackCandidates.map((row) => (
                <option key={row.version} value={row.version}>
                  v{row.version}
                  {row.note ? ` — ${row.note}` : ''}
                </option>
              ))
            )}
          </select>
          <button
            type="button"
            disabled={busy || !canRollback}
            onClick={handleRollback}
            className="inline-flex h-[34px] items-center rounded-[7px] border border-[#d1d5db] bg-white px-3.5 text-[12px] font-medium text-[#111827] disabled:cursor-not-allowed disabled:opacity-45"
          >
            Rollback
          </button>
        </div>
      </div>
    </AutomationSectionCard>
  )
}
