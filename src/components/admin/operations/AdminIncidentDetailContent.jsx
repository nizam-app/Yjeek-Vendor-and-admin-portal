import { useMemo, useState } from 'react'
import { Badge } from '../Badge'
import { Button } from '../Button'
import { cn } from '../cn'
import { AdminIncidentSeverityBadge } from './AdminIncidentSeverityBadge'
import { formatAdminMoney } from '../../../mappers/admin/mapAdminOrderDetail'
import {
  formatCostBearerLabel,
  formatCustomerRemedyLabel,
  formatEnforcementLabel,
  formatEvidenceKind,
  formatResolutionLabel,
  isOpenIncident,
} from '../../../lib/adminIncidentPresentation'
import { adminIncidentService } from '../../../services/admin/incidentService'
import { formatApiErrorMessage } from '../../../api/errors'

function formatWhen(iso) {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleString([], {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function EvidenceList({ evidence = [], evidenceHoldAt, onAddEvidence, isAdding }) {
  const held = Boolean(evidenceHoldAt)
  const photoCount = evidence.filter((row) => row.kind === 'PHOTO').length
  return (
    <section className="mt-3">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <h4 className="text-[10px] font-bold text-[#202722]">Evidence</h4>
        <span className="text-[9px] text-[#78837c]">{evidence.length} attached</span>
      </div>
      {held ? (
        <p className="mb-2 rounded-md bg-[#fff8e8] px-2 py-1 text-[9px] text-[#9a7618]">
          Evidence on hold — existing attachments are locked. You can still add new evidence.
        </p>
      ) : null}
      {evidence.length === 0 ? (
        <p className="text-[9px] text-[#78837c]">No evidence attached yet.</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {evidence.map((row) => (
            <a
              key={row.id}
              href={row.url || '#'}
              target={row.url ? '_blank' : undefined}
              rel={row.url ? 'noreferrer' : undefined}
              className={cn(
                'inline-flex max-w-full items-center gap-1 rounded-md border border-[#dfe4e0] bg-white px-2 py-1 text-[9px] font-medium text-[#29332d]',
                !row.url && 'pointer-events-none opacity-70',
              )}
            >
              {row.kind === 'PHOTO' && row.url ? (
                <img src={row.url} alt="" className="h-6 w-6 rounded object-cover" />
              ) : null}
              <span>{formatEvidenceKind(row.kind)}</span>
            </a>
          ))}
        </div>
      )}
      {photoCount > 0 ? (
        <p className="mt-1 text-[9px] text-[#657068]">{photoCount} photo{photoCount === 1 ? '' : 's'}</p>
      ) : null}
      {onAddEvidence ? (
        <Button
          type="button"
          className="mt-2 h-[24px] rounded-full px-3 text-[9px]"
          disabled={isAdding}
          onClick={() => onAddEvidence('PHOTO')}
        >
          {isAdding ? 'Adding…' : 'Add photo URL'}
        </Button>
      ) : null}
    </section>
  )
}

function PreviousResolutionSummary({ incident }) {
  if (!isOpenIncident(incident)) return null
  const code =
    incident?.previousResolutionActionCode ||
    incident?.resolutionSummary?.previousResolutionActionCode
  if (!code) return null
  const label = formatResolutionLabel(code)
  return (
    <section className="mt-3 rounded-md border border-dashed border-[#dfe4e0] bg-[#fafbfa] p-2.5">
      <h4 className="text-[10px] font-bold text-[#7d8781]">Previous resolution</h4>
      <p className="mt-1 text-[9px] font-medium text-[#202722]">{label || code}</p>
    </section>
  )
}

function ResolutionSummary({ incident }) {
  const summary = incident?.resolutionSummary
  const code = summary?.resolutionActionCode || incident?.resolutionActionCode
  const resolved = !isOpenIncident(incident)
  if (!resolved) return null
  const label = formatResolutionLabel(code)
  const amount = summary?.compensationAmountBhd ?? incident?.compensationAmountBhd
  const bearer = formatCostBearerLabel(summary?.costBearer || incident?.costBearer)
  return (
    <section className="mt-3 rounded-md border border-[#dfe4e0] bg-[#fafbfa] p-2.5">
      <h4 className="text-[10px] font-bold text-[#202722]">Resolution</h4>
      <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-[9px]">
        <div>
          <dt className="text-[#7d8781]">Action</dt>
          <dd className="font-medium">{label || 'Resolved'}</dd>
        </div>
        {incident.customerRemedy || summary?.customerRemedy ? (
          <div>
            <dt className="text-[#7d8781]">Customer remedy</dt>
            <dd className="font-medium">
              {formatCustomerRemedyLabel(summary?.customerRemedy || incident.customerRemedy)}
            </dd>
          </div>
        ) : null}
        {amount != null ? (
          <div>
            <dt className="text-[#7d8781]">Compensation</dt>
            <dd className="font-medium">{formatAdminMoney(amount)}</dd>
          </div>
        ) : null}
        {bearer ? (
          <div>
            <dt className="text-[#7d8781]">Cost bearer</dt>
            <dd className="font-medium">
              {bearer}
              {summary?.bearerWasOverridden && summary?.bearerOverrideReason
                ? ` (${summary.bearerOverrideReason})`
                : null}
            </dd>
          </div>
        ) : null}
        {summary?.enforcement || incident.enforcement ? (
          <div>
            <dt className="text-[#7d8781]">Enforcement</dt>
            <dd className="font-medium">
              {formatEnforcementLabel(summary?.enforcement || incident.enforcement)}
            </dd>
          </div>
        ) : null}
        <div>
          <dt className="text-[#7d8781]">Resolved by</dt>
          <dd className="font-medium">
            {summary?.resolvedByName || incident.resolvedByName || 'Admin'}
          </dd>
        </div>
        <div>
          <dt className="text-[#7d8781]">Resolved at</dt>
          <dd className="font-medium">{formatWhen(summary?.resolvedAt || incident.resolvedAt) || '—'}</dd>
        </div>
      </dl>
    </section>
  )
}

export function AdminIncidentDetailContent({
  incident,
  actionGroups = [],
  onAction,
  onOpenChat,
  onRefresh,
  compact = false,
}) {
  const [actionError, setActionError] = useState(null)
  const [busyAction, setBusyAction] = useState(null)
  const [addingEvidence, setAddingEvidence] = useState(false)
  const [openMenu, setOpenMenu] = useState(false)

  const row = incident || {}
  const history = useMemo(
    () => (Array.isArray(row.history) && row.history.length ? row.history : []),
    [row.history],
  )
  const statusLine = useMemo(() => {
    const parts = [row.lifecycleLabel || row.status].filter(Boolean)
    if (row.incidentSlaDeadlineAt) {
      parts.push(`${formatWhen(row.incidentSlaDeadlineAt)} SLA`)
    }
    return parts.join(' · ')
  }, [row.lifecycleLabel, row.status, row.incidentSlaDeadlineAt])

  async function runInvestigationAction(code) {
    if (!row.id || busyAction) return
    setActionError(null)
    setBusyAction(code)
    setOpenMenu(false)
    try {
      if (code === 'START_INVESTIGATION') {
        await adminIncidentService.startInvestigation(row.id)
      } else if (code === 'REQUEST_PARTY_RESPONSE') {
        await adminIncidentService.requestPartyResponse(row.id)
      } else if (code === 'ESCALATE_SEVERITY') {
        await adminIncidentService.escalateSeverity(row.id)
      } else {
        onAction?.(code, row.id)
        return
      }
      await onRefresh?.()
    } catch (error) {
      setActionError(formatApiErrorMessage(error, 'Action failed.'))
    } finally {
      setBusyAction(null)
    }
  }

  async function handleAddEvidence(kind) {
    if (!row.id || addingEvidence) return
    const url = window.prompt('Paste evidence URL')
    if (!url) return
    setAddingEvidence(true)
    setActionError(null)
    try {
      await adminIncidentService.addEvidence(row.id, { kind, url })
      await onRefresh?.()
    } catch (error) {
      setActionError(formatApiErrorMessage(error, 'Could not add evidence.'))
    } finally {
      setAddingEvidence(false)
    }
  }

  return (
    <div className={cn(compact ? 'space-y-2' : 'space-y-3')}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <h3 className="text-[11px] font-bold text-[#202722]">{row.title || 'Incident'}</h3>
            <AdminIncidentSeverityBadge priority={row.priority} severityLabel={row.severityLabel} />
            {row.lifecycleLabel || row.status ? (
              <Badge tone={isOpenIncident(row) ? 'yellow' : 'green'}>{statusLine || row.status}</Badge>
            ) : null}
          </div>
          <div className="mt-1 flex flex-wrap gap-1">
            {row.categoryLabel ? <Badge tone="gray">{row.categoryLabel}</Badge> : null}
            {row.sourceLabel ? <Badge tone="blue">{row.sourceLabel}</Badge> : null}
            {row.cause ? <Badge tone="yellow">{`Cause · ${row.cause}`}</Badge> : null}
            {row.stage ? <Badge tone="gray">{`Stage · ${row.stage}`}</Badge> : null}
            {row.recurrenceLabel ? <Badge tone="red">{row.recurrenceLabel}</Badge> : null}
            {row.ageLabel ? <Badge tone="gray">{`⏱ ${row.ageLabel}`}</Badge> : null}
            {row.attentionLabel ? (
              <Badge tone={row.unattended ? 'red' : 'blue'}>{row.attentionLabel}</Badge>
            ) : null}
          </div>
        </div>
      </div>

      {row.note ? <p className="text-[9px] leading-4 text-[#515c55]">{row.note}</p> : null}

      {!compact ? (
        <>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-[9px]">
            <div>
              <dt className="text-[#7d8781]">Opened</dt>
              <dd className="font-medium">{formatWhen(row.openedAt || row.createdAt) || '—'}</dd>
            </div>
            <div>
              <dt className="text-[#7d8781]">First response</dt>
              <dd className="font-medium">{formatWhen(row.firstResponseAt || row.acknowledgedAt) || '—'}</dd>
            </div>
            <div>
              <dt className="text-[#7d8781]">Party response</dt>
              <dd className="font-medium">
                {row.partyRespondedAt
                  ? formatWhen(row.partyRespondedAt)
                  : row.partyNotifiedAt
                    ? 'Awaiting'
                    : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-[#7d8781]">Assignee</dt>
              <dd className="font-medium">{row.acknowledgedByName || (row.assignedToUserId ? 'Assigned' : '—')}</dd>
            </div>
          </dl>

          {history.length > 0 ? (
            <section>
              <h4 className="text-[10px] font-bold text-[#202722]">Timeline</h4>
              <ol className="mt-2 space-y-2">
                {history.map((event) => (
                  <li key={event.id} className="flex gap-2">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#20a653]" />
                    <div>
                      <p className="text-[9px] font-medium text-[#202722]">{event.label}</p>
                      <p className="text-[8px] text-[#77827b]">
                        {event.actor || '—'}
                        {event.at ? ` · ${event.at}` : ''}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          <EvidenceList
            evidence={row.evidence || []}
            evidenceHoldAt={row.evidenceHoldAt}
            onAddEvidence={row.id ? handleAddEvidence : null}
            isAdding={addingEvidence}
          />

          {row.chatConversationId && onOpenChat ? (
            <button
              type="button"
              onClick={() => onOpenChat(row.chatConversationId)}
              className="inline-flex items-center rounded-md border border-[#dfe4e0] bg-[#f3faf5] px-2 py-1 text-[9px] font-medium text-[#24834e] hover:bg-[#e7f5eb]"
            >
              Open chat thread
            </button>
          ) : null}

          <PreviousResolutionSummary incident={row} />
          <ResolutionSummary incident={row} />
        </>
      ) : null}

      {actionGroups.length > 0 ? (
        <div className="relative">
          <button
            type="button"
            aria-expanded={openMenu}
            disabled={Boolean(busyAction)}
            onClick={() => setOpenMenu((current) => !current)}
            className="rounded-full bg-[#18a653] px-3 py-1.5 text-[8px] font-medium text-white hover:bg-[#128944] disabled:opacity-60"
          >
            {busyAction ? 'Working…' : '⚡ Take action ⌄'}
          </button>
          {openMenu ? (
            <div className="absolute left-0 top-[calc(100%+4px)] z-30 w-[262px] overflow-hidden rounded-[9px] border border-[#e1e5e2] bg-white text-[10px] shadow-[0_10px_26px_rgba(20,30,24,.18)]">
              {actionGroups.map((group) => (
                <div key={group.title}>
                  <div className="bg-[#f5f6f7] px-3 py-1.5 text-[8px] font-bold uppercase tracking-wide text-[#929ba6]">
                    {group.title}
                  </div>
                  {group.actions.map((action) => (
                    <button
                      key={action.code}
                      type="button"
                      disabled={action.disabled || busyAction === action.code}
                      title={action.deferredReason || undefined}
                      onClick={() => {
                        if (action.disabled) return
                        if (['START_INVESTIGATION', 'REQUEST_PARTY_RESPONSE', 'ESCALATE_SEVERITY'].includes(action.code)) {
                          void runInvestigationAction(action.code)
                          return
                        }
                        setOpenMenu(false)
                        onAction?.(action.code, row.id)
                      }}
                      className={cn(
                        'flex h-[30px] w-full items-center gap-2.5 px-3 text-left font-medium hover:bg-[#f5f8f6] disabled:cursor-not-allowed disabled:opacity-45',
                        action.code === 'CANCEL' || action.code === 'SUSPEND_CHAMP'
                          ? 'text-[#d92f35]'
                          : 'text-[#29332d]',
                      )}
                    >
                      <span className={cn('w-3 text-center text-[13px]', action.tone)}>{action.icon}</span>
                      <span>{action.label}</span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {actionError ? <p className="text-[9px] text-[#d92f35]">{actionError}</p> : null}
    </div>
  )
}
