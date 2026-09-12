import { useMemo, useState } from 'react'
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
import { Button } from '../../../components/admin/Button'
import { ToggleSwitch } from '../../../components/admin/ui-editor/ExclusiveOfferRow'
import {
  cloneChampStatusEditable,
  createChampStatusEditableDefaults,
  getChampStatusMock,
  validateChampStatus,
} from '../../../mocks/adminAutomationChampStatus.mock'
import { showError, showInfo, showSuccess } from '../../../utils/toast'

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

function DurationControl({
  value,
  onChange,
  operators,
  showSeconds = true,
  hint,
}) {
  return (
    <AutomationDurationField
      value={value}
      operatorLocked
      operators={operators}
      showSeconds={showSeconds}
      hint={hint}
      onChange={(next) =>
        onChange({
          ...next,
          operator: value?.operator || operators?.[0] || next.operator,
        })
      }
    />
  )
}

function LabeledToggle({ checked, label, onChange }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <ToggleSwitch checked={checked} label={label} onChange={onChange} />
      <span className="text-[12px] font-semibold text-[#15803d]">{label}</span>
    </div>
  )
}

export default function AdminChampStatusPage() {
  const catalog = useMemo(() => getChampStatusMock(), [])
  const [baseline, setBaseline] = useState(() =>
    cloneChampStatusEditable(catalog.editable || createChampStatusEditableDefaults()),
  )
  const [draft, setDraft] = useState(() => cloneChampStatusEditable(baseline))
  const [validationError, setValidationError] = useState(null)

  function updateSetting(key, value) {
    setDraft((prev) => ({ ...prev, [key]: value }))
    setValidationError(null)
  }

  function tryPersist(message) {
    const error = validateChampStatus(draft)
    if (error) {
      setValidationError(error)
      showError(error)
      return
    }
    const next = cloneChampStatusEditable(draft)
    setBaseline(next)
    setDraft(cloneChampStatusEditable(next))
    setValidationError(null)
    showSuccess(message)
  }

  function handleReset() {
    setDraft(cloneChampStatusEditable(baseline))
    setValidationError(null)
    showInfo('Champ Status fields restored to the last saved local mock values.')
  }

  function handleSaveAutomation() {
    tryPersist(
      'Champ Status saved locally via Save Automation (frontend mock only). Backend was not updated.',
    )
  }

  function renderControl(control, controlHint) {
    if (control === 'breakReminder') {
      return (
        <DurationControl
          value={draft.breakReminder}
          operators={['≥']}
          showSeconds={false}
          hint={controlHint}
          onChange={(breakReminder) => updateSetting('breakReminder', breakReminder)}
        />
      )
    }
    if (control === 'gpsOfflineTimeout') {
      return (
        <DurationControl
          value={draft.gpsOfflineTimeout}
          operators={['≥']}
          onChange={(gpsOfflineTimeout) => updateSetting('gpsOfflineTimeout', gpsOfflineTimeout)}
        />
      )
    }
    if (control === 'reassignmentDeadline') {
      return (
        <DurationControl
          value={draft.reassignmentDeadline}
          operators={['≤']}
          onChange={(reassignmentDeadline) =>
            updateSetting('reassignmentDeadline', reassignmentDeadline)
          }
        />
      )
    }
    if (control === 'preLockWindow') {
      return (
        <DurationControl
          value={draft.preLockWindow}
          operators={['−']}
          hint={controlHint}
          onChange={(preLockWindow) => updateSetting('preLockWindow', preLockWindow)}
        />
      )
    }
    if (control === 'incidentCustomerNotify') {
      return (
        <LabeledToggle
          checked={draft.incidentCustomerNotify}
          label="Always send immediately"
          onChange={(incidentCustomerNotify) =>
            updateSetting('incidentCustomerNotify', incidentCustomerNotify)
          }
        />
      )
    }
    if (control === 'suspendedAutoLift') {
      return (
        <LabeledToggle
          checked={draft.suspendedAutoLift}
          label="Auto-lift on suspension_end_at"
          onChange={(suspendedAutoLift) => updateSetting('suspendedAutoLift', suspendedAutoLift)}
        />
      )
    }
    return null
  }

  function renderRows(rows) {
    return rows.map((row) => (
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
        <p className="mt-1 text-[12px] text-[#6b7280]">{catalog.header.subtitle}</p>
      </div>

      <AutomationCallout tone="blue" label={catalog.rootCallout.label} className="!mx-0 mb-5">
        <p>
          Every automation decision starts by reading{' '}
          <code className="rounded bg-[#dbeafe] px-1 py-0.5 text-[11px]">champ.status</code>. Status
          is the single field the dispatch engine reads first — at Gate 1, before any scoring. Get
          this wrong and dispatch is broken. Status transitions must be atomic — no partial states.
          Each status has exactly one set of triggers (what causes it) and one set of automation
          consequences (what the system does when it reads it). Statuses set by the system are never
          manually overridable by the Champ app. Statuses set by Admin or Dispatcher are logged with
          who set them, when, and why.
        </p>
      </AutomationCallout>

      {validationError ? (
        <div className="mb-4 rounded-[10px] border border-[#f2cccc] bg-[#fff5f5] px-4 py-3 text-[12.5px] text-[#a93e42]">
          {validationError}
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
        <AutomationCallout tone="blue" label={stacked.architectureCallout.label}>
          <p>
            <code className="rounded bg-[#dbeafe] px-1 py-0.5 text-[11px]">champ.status</code> stays{' '}
            <code className="rounded bg-[#dbeafe] px-1 py-0.5 text-[11px]">&apos;ON_ORDER&apos;</code>{' '}
            in the database throughout. The stacked label is computed at read time by the API layer:
            if{' '}
            <code className="rounded bg-[#dbeafe] px-1 py-0.5 text-[11px]">active_orders &gt; 1</code>,
            format the display as{' '}
            <code className="rounded bg-[#dbeafe] px-1 py-0.5 text-[11px]">
              ON_ORDER · STACKED (N)
            </code>{' '}
            where N ={' '}
            <code className="rounded bg-[#dbeafe] px-1 py-0.5 text-[11px]">active_orders</code>. Never
            store{' '}
            <code className="rounded bg-[#dbeafe] px-1 py-0.5 text-[11px]">ON_ORDER_STACKED_2</code>{' '}
            as an enum value — you would need a new migration every time the cap changes and a status
            write on every delivery confirmation. One integer field does the job.
          </p>
        </AutomationCallout>

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
        <AutomationCallout tone={incident.callout.tone} label={incident.callout.label}>
          <p>{incident.callout.body}</p>
        </AutomationCallout>
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
        <AutomationCallout tone={fleetOccupied.callout.tone} label={fleetOccupied.callout.label}>
          <p>
            FLEET_OCCUPIED must exist in the{' '}
            <code className="rounded bg-[#dbeafe] px-1 py-0.5 text-[11px]">champ.status</code> enum
            from day one even though the Fleet product does not launch at Phase 1. Adding an enum
            value to an existing column after launch requires a migration across all active records.
            Reserve it now at zero cost.
          </p>
        </AutomationCallout>
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
        <AutomationCallout
          tone={scheduledLocked.callout.tone}
          label={scheduledLocked.callout.label}
        >
          <p>
            The pre-lock fires automatically at a configurable window before{' '}
            <code className="rounded bg-[#dbeafe] px-1 py-0.5 text-[11px]">
              order.assigned_timeslot.pickup_at
            </code>
            . The Champ cannot receive any new on-demand offers from that moment. However, the lock
            releases only when the scheduled order is marked delivered and confirmed — not when the
            delivery window opens, not at a fixed time. If the order is cancelled during the lock
            window, the Champ immediately returns to AVAILABLE for on-demand.
          </p>
        </AutomationCallout>

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
        <Button type="button" onClick={handleReset} className="rounded-full px-5">
          Reset
        </Button>
        <Button
          type="button"
          primary
          onClick={handleSaveAutomation}
          className="rounded-full px-6"
        >
          Save Automation
        </Button>
      </div>
    </div>
  )
}
