import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '../Button'
import { cn } from '../cn'
import { AdminIncidentSeverityBadge } from './AdminIncidentSeverityBadge'
import { formatAdminMoney } from '../../../mappers/admin/mapAdminOrderDetail'
import {
  formatCostBearerLabel,
  formatCustomerRemedyLabel,
  formatEnforcementLabel,
  formatEvidenceKind,
  formatOpenDuration,
  formatResolutionLabel,
  formatSlaCountdown,
  isOpenIncident,
} from '../../../lib/adminIncidentPresentation'
import { adminIncidentService } from '../../../services/admin/incidentService'
import { adminUploadService } from '../../../services/admin/uploadService'
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

function EvidenceList({ evidence = [], evidenceHoldAt, onAddEvidence, onPickFile, isAdding }) {
  const held = Boolean(evidenceHoldAt)
  const photoCount = evidence.filter((row) => row.kind === 'PHOTO').length
  const fileInputRef = useRef(null)
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
                <img src={row.url} alt="" className="h-8 w-8 rounded object-cover" />
              ) : null}
              <span>{formatEvidenceKind(row.kind)}</span>
            </a>
          ))}
        </div>
      )}
      {photoCount > 0 ? (
        <p className="mt-1 text-[9px] text-[#657068]">{photoCount} photo{photoCount === 1 ? '' : 's'}</p>
      ) : null}
      {onAddEvidence || onPickFile ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {onPickFile ? (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  event.target.value = ''
                  if (file) onPickFile(file)
                }}
              />
              <Button
                type="button"
                className="h-[24px] rounded-full px-3 text-[9px]"
                disabled={isAdding}
                onClick={() => fileInputRef.current?.click()}
              >
                {isAdding ? 'Uploading…' : '＋ Upload photo'}
              </Button>
            </>
          ) : null}
          {onAddEvidence ? (
            <Button
              type="button"
              className="h-[24px] rounded-full px-3 text-[9px]"
              disabled={isAdding}
              onClick={() => onAddEvidence('PHOTO')}
            >
              Add photo URL
            </Button>
          ) : null}
        </div>
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
  presenceViewers = null,
}) {
  const [actionError, setActionError] = useState(null)
  const [busyAction, setBusyAction] = useState(null)
  const [addingEvidence, setAddingEvidence] = useState(false)
  const [openMenu, setOpenMenu] = useState(false)
  const [nowTick, setNowTick] = useState(() => Date.now())
  const fileInputRefCompact = useRef(null)

  const row = incident || {}
  const history = useMemo(
    () => (Array.isArray(row.history) && row.history.length ? row.history : []),
    [row.history],
  )

  useEffect(() => {
    if (!row.incidentSlaDeadlineAt || !isOpenIncident(row)) return undefined
    const timer = window.setInterval(() => setNowTick(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [row.incidentSlaDeadlineAt, row.status, row.lifecycleState, row.resolvedAt])

  const slaCountdown = useMemo(
    () => formatSlaCountdown(row.incidentSlaDeadlineAt, nowTick),
    [row.incidentSlaDeadlineAt, nowTick],
  )

  const otherViewers = useMemo(() => {
    const list = Array.isArray(presenceViewers)
      ? presenceViewers
      : Array.isArray(row.activeViewers)
        ? row.activeViewers
        : []
    return list
  }, [presenceViewers, row.activeViewers])

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
      } else if (code === 'APPLY_VPI_PENALTY' || code === 'APPLY_CPI_PENALTY') {
        await adminIncidentService.runAction(row.id, { action: code })
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

  async function handleUploadEvidence(file) {
    if (!row.id || addingEvidence || !file) return
    setAddingEvidence(true)
    setActionError(null)
    try {
      const uploaded = await adminUploadService.uploadImage(file)
      const url = uploaded?.data?.url
      if (!url) throw new Error('Upload did not return a URL')
      await adminIncidentService.addEvidence(row.id, {
        kind: 'PHOTO',
        url: String(url),
      })
      await onRefresh?.()
    } catch (error) {
      setActionError(formatApiErrorMessage(error, 'Could not upload evidence.'))
    } finally {
      setAddingEvidence(false)
    }
  }

  const open = isOpenIncident(row)
  const resolutionCode =
    row.resolutionSummary?.resolutionActionCode || row.resolutionActionCode
  const resolutionParts = []
  if (resolutionCode) resolutionParts.push(formatResolutionLabel(resolutionCode) || resolutionCode)
  const amount = row.resolutionSummary?.compensationAmountBhd ?? row.compensationAmountBhd
  if (amount != null) resolutionParts.push(formatAdminMoney(amount))
  const bearer = formatCostBearerLabel(row.resolutionSummary?.costBearer || row.costBearer)
  if (bearer) resolutionParts.push(`borne by ${bearer}`)

  const statusBadgeLabel = open
    ? slaCountdown
      ? `Pending · ${slaCountdown}`
      : row.lifecycleLabel || row.status || 'Pending'
    : 'Solved'

  const chipCause = row.cause ? `Cause: ${String(row.cause).replace(/_/g, ' ')}` : null
  const chipStage = row.stage
    ? String(row.stage).startsWith('Cause:')
      ? row.stage
      : row.stage
    : null

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="min-w-0 flex-1 text-[13.5px] font-bold leading-tight text-[#101a14]">
            {row.title || 'Incident'}
          </h3>
          <span
            className={cn(
              'shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide',
              open ? 'bg-[#fdf1de] text-[#a97013]' : 'bg-[#e7f4ec] text-[#1a6b3c]',
            )}
          >
            {statusBadgeLabel}
          </span>
        </div>

        <div className="flex flex-wrap gap-1">
          <AdminIncidentSeverityBadge
            priority={row.priority}
            severityLabel={row.severityLabel === 'UNCLASSIFIED' ? 'Unclassified' : row.severityLabel}
            className="rounded px-[7px] py-[2.5px]"
          />
          {row.slaBreached || /sla/i.test(String(row.type || row.title || '')) ? (
            <span className="rounded bg-[#fbe9e6] px-[7px] py-[2.5px] text-[9px] font-semibold text-[#c45c4a]">
              SLA breached
            </span>
          ) : row.reportedByCustomer ? (
            <span className="rounded bg-[#eef1ef] px-[7px] py-[2.5px] text-[9px] font-semibold text-[#5d6d63]">
              Reported
            </span>
          ) : row.categoryLabel ? (
            <span className="rounded bg-[#eef1ef] px-[7px] py-[2.5px] text-[9px] font-semibold text-[#5d6d63]">
              {row.categoryLabel}
            </span>
          ) : null}
          {chipCause ? (
            <span className="rounded bg-[#eef1ef] px-[7px] py-[2.5px] text-[9px] font-semibold text-[#5d6d63]">
              {chipCause}
            </span>
          ) : null}
          {chipStage ? (
            <span className="rounded bg-[#eef1ef] px-[7px] py-[2.5px] text-[9px] font-semibold text-[#5d6d63]">
              {chipStage}
            </span>
          ) : null}
          {row.recurrenceLabel ? (
            <span className="rounded bg-[#8C3A2B] px-[7px] py-[2.5px] text-[9px] font-semibold text-white">
              {row.recurrenceLabel}
            </span>
          ) : null}
        </div>

        {row.note || row.detail ? (
          <p className="text-[11.5px] leading-4 text-[#3c4d43]">{row.note || row.detail}</p>
        ) : null}

        {row.meta ? <p className="text-[10px] text-[#6b7a71]">{row.meta}</p> : null}

        {!open && resolutionParts.length > 0 ? (
          <div className="rounded bg-[#e7f4ec] px-2.5 py-1.5 text-[10px] font-semibold text-[#1a6b3c]">
            Resolution: {resolutionParts.join(' · ')}
          </div>
        ) : null}

        {open ? (
          <>
            <div className="flex flex-wrap items-center gap-1.5">
              {(row.evidence || []).slice(0, 4).map((ev) =>
                ev.kind === 'PHOTO' && ev.url ? (
                  <a
                    key={ev.id}
                    href={ev.url}
                    target="_blank"
                    rel="noreferrer"
                    className="grid h-9 w-9 place-items-center overflow-hidden rounded border border-[#e4e7e5] bg-[#f6f8f6]"
                  >
                    <img src={ev.url} alt="" className="h-full w-full object-cover" />
                  </a>
                ) : (
                  <span
                    key={ev.id}
                    className="grid h-9 w-9 place-items-center rounded border border-[#e4e7e5] bg-[#f6f8f6] text-[12px]"
                  >
                    📷
                  </span>
                ),
              )}
              {row.id ? (
                <>
                  <input
                    ref={fileInputRefCompact}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0]
                      event.target.value = ''
                      if (file) void handleUploadEvidence(file)
                    }}
                  />
                  <button
                    type="button"
                    disabled={addingEvidence}
                    onClick={() => fileInputRefCompact.current?.click()}
                    className="grid h-9 w-9 place-items-center rounded border border-dashed border-[#cfd6d1] bg-white text-[14px] text-[#6b7a71] hover:bg-[#f6f8f6]"
                    aria-label="Add evidence"
                  >
                    {addingEvidence ? '…' : '＋'}
                  </button>
                </>
              ) : null}
              {(row.chatConversationId || onOpenChat) && onOpenChat ? (
                <button
                  type="button"
                  onClick={() => onOpenChat(row.chatConversationId)}
                  className="ml-1 inline-flex items-center gap-1 text-[11px] font-semibold text-[#1aa054] hover:underline"
                >
                  💬 Open chat thread
                </button>
              ) : null}
            </div>

            {actionGroups.length > 0 ? (
              <div className="relative">
                <button
                  type="button"
                  aria-expanded={openMenu}
                  disabled={Boolean(busyAction)}
                  onClick={() => setOpenMenu((current) => !current)}
                  className="rounded-full bg-[#18a653] px-3.5 py-1.5 text-[11px] font-semibold text-white hover:bg-[#128944] disabled:opacity-60"
                >
                  {busyAction ? 'Working…' : '⚡ Take action ▾'}
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
                              if (
                                [
                                  'START_INVESTIGATION',
                                  'REQUEST_PARTY_RESPONSE',
                                  'ESCALATE_SEVERITY',
                                  'APPLY_VPI_PENALTY',
                                  'APPLY_CPI_PENALTY',
                                ].includes(action.code)
                              ) {
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
                            <span className={cn('w-3 text-center text-[13px]', action.tone)}>
                              {action.icon}
                            </span>
                            <span>{action.label}</span>
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
          </>
        ) : null}

        {actionError ? <p className="text-[9px] text-[#d92f35]">{actionError}</p> : null}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {otherViewers.length > 0 ? (
        <div className="rounded-md border border-[#ecd9ac] bg-[#fdf6e7] px-2.5 py-2 text-[10px] text-[#7a5f1d]">
          {otherViewers.map((viewer) => {
            const duration = formatOpenDuration(viewer.openForMs)
            return (
              <p key={viewer.userId || viewer.displayName}>
                👤 <b>Open by {viewer.displayName || 'Dispatcher'}</b>
                {duration ? ` — for ${duration}` : ''}. Opening actions here will be visible to
                them.
              </p>
            )
          })}
        </div>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <h3 className="text-[13.5px] font-bold text-[#101a14]">{row.title || 'Incident'}</h3>
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide',
                open ? 'bg-[#fdf1de] text-[#a97013]' : 'bg-[#e7f4ec] text-[#1a6b3c]',
              )}
            >
              {statusBadgeLabel}
            </span>
          </div>
          <div className="mt-1.5 flex flex-wrap gap-1">
            <AdminIncidentSeverityBadge priority={row.priority} severityLabel={row.severityLabel} />
            {row.categoryLabel ? (
              <span className="rounded bg-[#eef1ef] px-[7px] py-[2.5px] text-[9px] font-semibold text-[#5d6d63]">
                {row.categoryLabel}
              </span>
            ) : null}
            {row.sourceLabel ? (
              <span className="rounded bg-[#f3eef5] px-[7px] py-[2.5px] text-[9px] font-semibold text-[#6b4a7a]">
                {row.sourceLabel}
              </span>
            ) : null}
            {chipCause ? (
              <span className="rounded bg-[#eef1ef] px-[7px] py-[2.5px] text-[9px] font-semibold text-[#5d6d63]">
                {chipCause}
              </span>
            ) : null}
            {chipStage ? (
              <span className="rounded bg-[#eef1ef] px-[7px] py-[2.5px] text-[9px] font-semibold text-[#5d6d63]">
                {chipStage}
              </span>
            ) : null}
            {row.recurrenceLabel ? (
              <span className="rounded bg-[#8C3A2B] px-[7px] py-[2.5px] text-[9px] font-semibold text-white">
                {row.recurrenceLabel}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {row.note ? <p className="text-[11.5px] leading-4 text-[#3c4d43]">{row.note}</p> : null}

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
          <dd className="font-medium">
            {row.acknowledgedByName || (row.assignedToUserId ? 'Assigned' : '—')}
          </dd>
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
        onPickFile={row.id ? handleUploadEvidence : null}
        isAdding={addingEvidence}
      />

      {row.chatConversationId && onOpenChat ? (
        <button
          type="button"
          onClick={() => onOpenChat(row.chatConversationId)}
          className="inline-flex items-center text-[11px] font-semibold text-[#1aa054] hover:underline"
        >
          💬 Open chat thread
        </button>
      ) : null}

      <PreviousResolutionSummary incident={row} />
      {!open && resolutionParts.length > 0 ? (
        <div className="rounded bg-[#e7f4ec] px-2.5 py-1.5 text-[10px] font-semibold text-[#1a6b3c]">
          Resolution: {resolutionParts.join(' · ')}
        </div>
      ) : (
        <ResolutionSummary incident={row} />
      )}

      {actionGroups.length > 0 ? (
        <div className="relative">
          <button
            type="button"
            aria-expanded={openMenu}
            disabled={Boolean(busyAction)}
            onClick={() => setOpenMenu((current) => !current)}
            className="rounded-full bg-[#18a653] px-3.5 py-1.5 text-[11px] font-semibold text-white hover:bg-[#128944] disabled:opacity-60"
          >
            {busyAction ? 'Working…' : '⚡ Take action ▾'}
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
                        if (
                          [
                            'START_INVESTIGATION',
                            'REQUEST_PARTY_RESPONSE',
                            'ESCALATE_SEVERITY',
                            'APPLY_VPI_PENALTY',
                            'APPLY_CPI_PENALTY',
                          ].includes(action.code)
                        ) {
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
                      <span className={cn('w-3 text-center text-[13px]', action.tone)}>
                        {action.icon}
                      </span>
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
