import { useCallback, useEffect, useState } from 'react'
import { ApiState } from '../../../components/admin/ApiState'
import { AutomationCallout } from '../../../components/admin/automation/AutomationCallout'
import { AutomationDurationField } from '../../../components/admin/automation/AutomationFields'
import {
  AutomationFieldRow,
  AutomationSectionCard,
  AutomationSubsectionTitle,
} from '../../../components/admin/automation/AutomationSectionCard'
import { AutomationStatusPill } from '../../../components/admin/automation/AutomationStatusPill'
import {
  ChampStatusDisplayTable,
  ChampStatusSchemaCode,
  ChampStatusSectionCard,
  ChampStatusTransitionTable,
} from '../../../components/admin/automation/ChampStatusSectionCard'
import {
  applyLiveChampStatus,
  getChampStatusCatalog,
} from '../../../components/admin/automation/champStatusUiCatalog'
import { Button } from '../../../components/admin/Button'
import { ToggleSwitch } from '../../../components/admin/ui-editor/ExclusiveOfferRow'
import { formatApiErrorMessage } from '../../../api/errors'
import { isAutomationRealApi } from '../../../services/admin/dispatchAutomationFeature'
import { adminDispatchAutomationService } from '../../../services/admin/dispatchAutomationService'
import { showInfo } from '../../../utils/toast'

function RowPill({ pill }) {
  if (!pill) return null
  if (pill.tone) {
    return <AutomationStatusPill tone={pill.tone}>{pill.text}</AutomationStatusPill>
  }
  return <AutomationStatusPill className={pill.className}>{pill.text}</AutomationStatusPill>
}

function SchemaBlock({ codes, label }) {
  if (!codes?.length) return null
  return (
    <AutomationFieldRow label={label || 'Schema fields'}>
      <div className="flex max-w-full flex-col items-end gap-1">
        {codes.map((code) => (
          <ChampStatusSchemaCode key={code}>{code}</ChampStatusSchemaCode>
        ))}
      </div>
    </AutomationFieldRow>
  )
}

function DurationControl({ value, operators, showSeconds = true, hint }) {
  return (
    <AutomationDurationField
      value={value}
      disabled
      operatorLocked
      operators={operators}
      showSeconds={showSeconds}
      hint={hint}
      onChange={() => undefined}
    />
  )
}

function LabeledToggle({ checked, label }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <ToggleSwitch checked={checked} label={label} disabled onChange={() => undefined} />
      <span className="text-[12px] font-semibold text-[#15803d]">{label}</span>
    </div>
  )
}

/**
 * Automation → Champ Status.
 * Live caps / load factors / clocks from dispatch-automation/champ-status.
 * Reference sections kept; developer comment callouts removed; inputs remain (read-only).
 */
export default function AdminChampStatusPage() {
  if (!isAutomationRealApi()) {
    return (
      <div className="rounded-[10px] border border-[#fde68a] bg-[#fffbeb] px-4 py-3 text-[13px] text-[#92400e]">
        Enable the <code className="font-semibold">automation</code> feature flag
        (<code>VITE_ADMIN_REAL_API_FEATURES</code>) to load Champ Status from the live dispatch
        engine. Mock data is not used.
      </div>
    )
  }

  return <RealChampStatusPage />
}

function RealChampStatusPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [catalog, setCatalog] = useState(null)
  const [display, setDisplay] = useState(null)
  const [meta, setMeta] = useState(null)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await adminDispatchAutomationService.getChampStatus()
      const live = result?.data
      if (!live) {
        throw new Error('Champ Status payload was empty.')
      }
      const base = getChampStatusCatalog()
      const merged = applyLiveChampStatus(base, live)
      setCatalog(merged.catalog)
      setDisplay(merged.editable)
      setMeta({
        ruleSetId: live.ruleSetId,
        ruleSetVersion: live.ruleSetVersion,
        configSource: live.configSource,
      })
    } catch (err) {
      setCatalog(null)
      setDisplay(null)
      setError(formatApiErrorMessage(err, 'Failed to load Champ Status from dispatch engine.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  function handleOwnedAction(action) {
    showInfo(
      `${action} is owned by Champ app / Fleet runtime and DispatchRuleSet. ` +
        'Champ Status is reference-only here — live ONLINE/BUSY/OFFLINE (buyer AVAILABLE/ON_ORDER/OFFLINE) and vehicle caps are not edited on this tab.',
    )
  }

  function renderControl(control, controlHint) {
    if (!display) return null
    if (control === 'breakReminder') {
      return (
        <DurationControl
          value={display.breakReminder}
          operators={['≥']}
          showSeconds={false}
          hint={controlHint}
        />
      )
    }
    if (control === 'gpsOfflineTimeout') {
      return <DurationControl value={display.gpsOfflineTimeout} operators={['≥']} />
    }
    if (control === 'reassignmentDeadline') {
      return <DurationControl value={display.reassignmentDeadline} operators={['≤']} />
    }
    if (control === 'preLockWindow') {
      return (
        <DurationControl value={display.preLockWindow} operators={['−']} hint={controlHint} />
      )
    }
    if (control === 'incidentCustomerNotify') {
      return (
        <LabeledToggle checked={display.incidentCustomerNotify} label="Always send immediately" />
      )
    }
    if (control === 'suspendedAutoLift') {
      return (
        <LabeledToggle
          checked={display.suspendedAutoLift}
          label="Auto-lift on suspension_end_at"
        />
      )
    }
    return null
  }

  function renderRows(rows) {
    return (rows || []).map((row) => (
      <AutomationFieldRow key={row.id} label={row.label} help={row.help}>
        {row.control ? renderControl(row.control, row.controlHint) : null}
        {row.pill ? <RowPill pill={row.pill} /> : null}
        {row.code ? <ChampStatusSchemaCode>{row.code}</ChampStatusSchemaCode> : null}
        {row.badges ? (
          <div className="flex flex-wrap items-center gap-2">
            {row.badges.map((badge) => (
              <AutomationStatusPill key={badge.text} className={`${badge.className} text-[10px]`}>
                {badge.text}
              </AutomationStatusPill>
            ))}
          </div>
        ) : null}
        {row.value ? (
          <div className="flex flex-wrap items-center gap-1">
            <span className={`text-[13px] font-bold ${row.valueClass}`}>{row.value}</span>
            {row.hint ? <span className="text-[11px] text-[#9ca3af]">{row.hint}</span> : null}
          </div>
        ) : null}
      </AutomationFieldRow>
    ))
  }

  if (loading && !catalog) {
    return <ApiState isLoading error={null} />
  }

  if (error && !catalog) {
    return <ApiState isLoading={false} error={error} onRetry={() => reload()} />
  }

  if (!catalog || !display) {
    return (
      <div className="rounded-[10px] border border-[#e5e7eb] bg-white px-4 py-6 text-[13px] text-[#6b7280]">
        Champ Status unavailable.
      </div>
    )
  }

  const {
    available,
    onOrder,
    stacked,
    onBreak,
    offline,
    incident,
    suspended,
    fleetOccupied,
    scheduledLocked,
  } = catalog.statuses

  return (
    <div className="pb-20">
      <div className="mb-5">
        <h2 className="text-[17px] font-bold text-[#111827]">{catalog.header.title}</h2>
        <p className="mt-1 text-[12px] text-[#6b7280]">
          {catalog.header.subtitle}
          {meta?.ruleSetVersion != null ? ` · RuleSet v${meta.ruleSetVersion}` : ''}
          {' · No mock/demo data'}
        </p>
      </div>

      {error ? (
        <div className="mb-4 rounded-[8px] border border-[#fde68a] bg-[#fffbeb] px-3.5 py-2.5 text-[12.5px] text-[#92400e]">
          {error}{' '}
          <button type="button" className="font-semibold underline" onClick={() => reload()}>
            Retry
          </button>
        </div>
      ) : null}

      <ChampStatusSectionCard
        title={available.title}
        subtitle={available.subtitle}
        headerBg={available.headerBg}
        titleColor={available.titleColor}
        dotColor={available.dotColor}
        badge={available.badge}
        badgeClassName={available.badgeClassName}
      >
        {renderRows(available.rows)}
        <SchemaBlock codes={available.schema} label="Schema field" />
      </ChampStatusSectionCard>

      <ChampStatusSectionCard
        title={onOrder.title}
        subtitle={onOrder.subtitle}
        headerBg={onOrder.headerBg}
        titleColor={onOrder.titleColor}
        dotColor={onOrder.dotColor}
        badge={onOrder.badge}
        badgeClassName={onOrder.badgeClassName}
      >
        {renderRows(onOrder.rows)}
        <SchemaBlock codes={onOrder.schema} />
      </ChampStatusSectionCard>

      <ChampStatusSectionCard
        title={stacked.title}
        titleNote={stacked.titleNote}
        subtitle={stacked.subtitle}
        headerBg={stacked.headerBg}
        titleColor={stacked.titleColor}
        dotColor={stacked.dotColor}
        stackedAccent
        badge={stacked.badge}
        badgeClassName={stacked.badgeClassName}
      >
        <AutomationSubsectionTitle>{stacked.maintenanceTitle}</AutomationSubsectionTitle>
        {renderRows(stacked.maintenanceRows)}

        <AutomationSubsectionTitle>{stacked.displayTableTitle}</AutomationSubsectionTitle>
        <ChampStatusDisplayTable rows={stacked.displayRows} />

        <AutomationSubsectionTitle>{stacked.scoringTitle}</AutomationSubsectionTitle>
        {renderRows(stacked.scoringRows)}

        <AutomationSubsectionTitle>{stacked.dashboardTitle}</AutomationSubsectionTitle>
        {renderRows(stacked.dashboardRows)}

        <AutomationSubsectionTitle>{stacked.schemaTitle}</AutomationSubsectionTitle>
        <AutomationFieldRow label="Stored in database">
          <div className="flex max-w-full flex-col items-end gap-1">
            {stacked.stored.map((code) => (
              <ChampStatusSchemaCode key={code}>{code}</ChampStatusSchemaCode>
            ))}
          </div>
        </AutomationFieldRow>
        <AutomationFieldRow label="Computed at read time (API layer)">
          <div className="flex max-w-full flex-col items-end gap-1">
            {stacked.computed.map((code) => (
              <ChampStatusSchemaCode key={code} tone="computed">
                {code}
              </ChampStatusSchemaCode>
            ))}
          </div>
        </AutomationFieldRow>
        <AutomationFieldRow label="Never store this in the database" mutedLabel>
          <ChampStatusSchemaCode tone="danger">{stacked.neverStore}</ChampStatusSchemaCode>
        </AutomationFieldRow>
      </ChampStatusSectionCard>

      <ChampStatusSectionCard
        title={onBreak.title}
        subtitle={onBreak.subtitle}
        headerBg={onBreak.headerBg}
        titleColor={onBreak.titleColor}
        dotColor={onBreak.dotColor}
        badge={onBreak.badge}
        badgeTone={onBreak.badgeTone}
      >
        {renderRows(onBreak.rows)}
        <SchemaBlock codes={onBreak.schema} />
      </ChampStatusSectionCard>

      <ChampStatusSectionCard
        title={offline.title}
        subtitle={offline.subtitle}
        headerBg={offline.headerBg}
        titleColor={offline.titleColor}
        dotColor={offline.dotColor}
        badge={offline.badge}
        badgeTone={offline.badgeTone}
      >
        {renderRows(offline.rows)}
        <SchemaBlock codes={offline.schema} />
      </ChampStatusSectionCard>

      <ChampStatusSectionCard
        title={incident.title}
        subtitle={incident.subtitle}
        headerBg={incident.headerBg}
        titleColor={incident.titleColor}
        dotColor={incident.dotColor}
        badge={incident.badge}
        badgeClassName={incident.badgeClassName}
      >
        {incident.callout ? (
          <AutomationCallout tone={incident.callout.tone} label={incident.callout.label}>
            <p>{incident.callout.body}</p>
          </AutomationCallout>
        ) : null}
        {renderRows(incident.rows)}
        <SchemaBlock codes={incident.schema} />
      </ChampStatusSectionCard>

      <ChampStatusSectionCard
        title={suspended.title}
        subtitle={suspended.subtitle}
        headerBg={suspended.headerBg}
        titleColor={suspended.titleColor}
        dotColor={suspended.dotColor}
        badge={suspended.badge}
        badgeClassName={suspended.badgeClassName}
      >
        {renderRows(suspended.rows)}
        <SchemaBlock codes={suspended.schema} />
      </ChampStatusSectionCard>

      <ChampStatusSectionCard
        title={fleetOccupied.title}
        titleNote={fleetOccupied.titleNote}
        subtitle={fleetOccupied.subtitle}
        headerBg={fleetOccupied.headerBg}
        titleColor={fleetOccupied.titleColor}
        dotColor={fleetOccupied.dotColor}
        badge={fleetOccupied.badge}
        badgeTone={fleetOccupied.badgeTone}
      >
        {renderRows(fleetOccupied.rows)}
        <SchemaBlock codes={fleetOccupied.schema} label={fleetOccupied.schemaLabel} />
      </ChampStatusSectionCard>

      <ChampStatusSectionCard
        title={scheduledLocked.title}
        subtitle={scheduledLocked.subtitle}
        headerBg={scheduledLocked.headerBg}
        titleColor={scheduledLocked.titleColor}
        dotColor={scheduledLocked.dotColor}
        badge={scheduledLocked.badge}
        badgeClassName={scheduledLocked.badgeClassName}
      >
        {scheduledLocked.callout ? (
          <AutomationCallout
            tone={scheduledLocked.callout.tone}
            label={scheduledLocked.callout.label}
          >
            <p>{scheduledLocked.callout.body}</p>
          </AutomationCallout>
        ) : null}

        <div className="grid border-t border-[#e5e7eb] max-[1100px]:grid-cols-1 min-[1100px]:grid-cols-4">
          {scheduledLocked.timeline.map((step, index) => (
            <div
              key={step.id}
              className={`px-[18px] py-4 ${step.bg} ${
                index < scheduledLocked.timeline.length - 1
                  ? 'min-[1100px]:border-r min-[1100px]:border-[#e5e7eb]'
                  : ''
              }`}
            >
              <div
                className={`mb-1.5 text-[11px] font-bold uppercase tracking-[0.07em] ${step.titleClass}`}
              >
                {step.title}
              </div>
              <p className="mb-1.5 text-[12.5px] leading-relaxed text-[#374151]">{step.body}</p>
              <AutomationStatusPill className={`${step.pill.className} text-[9.5px]`}>
                {step.pill.text}
              </AutomationStatusPill>
            </div>
          ))}
        </div>

        <AutomationSubsectionTitle>{scheduledLocked.configTitle}</AutomationSubsectionTitle>
        {renderRows(scheduledLocked.configRows)}

        <AutomationSubsectionTitle>{scheduledLocked.cancelTitle}</AutomationSubsectionTitle>
        {renderRows(scheduledLocked.cancelRows)}

        <AutomationSubsectionTitle>{scheduledLocked.edgeTitle}</AutomationSubsectionTitle>
        {renderRows(scheduledLocked.edgeRows)}

        <AutomationSubsectionTitle>{scheduledLocked.gateTitle}</AutomationSubsectionTitle>
        {renderRows(scheduledLocked.gateRows)}

        <AutomationSubsectionTitle>{scheduledLocked.schemaTitle}</AutomationSubsectionTitle>
        {scheduledLocked.schemaRows.map((row) => (
          <AutomationFieldRow key={row.id} label={row.label}>
            <ChampStatusSchemaCode>{row.code}</ChampStatusSchemaCode>
          </AutomationFieldRow>
        ))}
      </ChampStatusSectionCard>

      <AutomationSectionCard
        title={catalog.stateMachine.title}
        subtitle={catalog.stateMachine.subtitle}
      >
        <ChampStatusTransitionTable
          columns={catalog.stateMachine.columns}
          rows={catalog.stateMachine.rows}
        />
        <div className="border-t border-[#e5e7eb] px-5 py-3 text-[11.5px] leading-relaxed text-[#6b7280]">
          {catalog.stateMachine.footnote}
        </div>
      </AutomationSectionCard>

      <AutomationSectionCard title={catalog.gate1.title} subtitle={catalog.gate1.subtitle}>
        <div className="grid border-t border-[#e5e7eb] max-[1100px]:grid-cols-2 min-[1100px]:grid-cols-7">
          {catalog.gate1.steps.map((step, index) => (
            <div
              key={step.title}
              className={`px-4 py-3.5 text-center ${step.bg} ${
                index < catalog.gate1.steps.length - 1
                  ? 'min-[1100px]:border-r min-[1100px]:border-[#e5e7eb]'
                  : ''
              }`}
            >
              <div className={`mb-1 text-[16px] font-extrabold leading-none ${step.color}`}>
                {step.n}
              </div>
              <div
                className={`mb-1.5 text-[10px] font-bold uppercase tracking-[0.06em] ${step.color}`}
              >
                {step.title}
              </div>
              <div className="text-[10.5px] leading-snug text-[#6b7280]">{step.body}</div>
            </div>
          ))}
        </div>
      </AutomationSectionCard>

      <div className="sticky bottom-0 z-10 -mx-5 mt-2 flex items-center justify-end gap-2.5 border-t border-[#e5e7eb] bg-white px-5 py-3 max-[700px]:-mx-3 max-[700px]:px-3">
        <Button
          type="button"
          disabled
          title="Champ Status is not configurable in Automation"
          onClick={() => handleOwnedAction('Reset')}
          className="rounded-full px-5"
        >
          Reset
        </Button>
        <Button
          type="button"
          primary
          disabled
          title="Champ Status is not configurable in Automation"
          onClick={() => handleOwnedAction('Save Automation')}
          className="rounded-full px-6"
        >
          Save Automation
        </Button>
      </div>
    </div>
  )
}
