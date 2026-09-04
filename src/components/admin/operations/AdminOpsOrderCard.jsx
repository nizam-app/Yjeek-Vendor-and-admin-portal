import motoBike from '../../../assets/moto_bike.png'
import { Clock3, User } from 'lucide-react'
import { cn } from '../cn'
import { resolveOrderConversationId } from '../../../lib/adminOrderChat'
import { AdminIncidentSeverityBadge } from './AdminIncidentSeverityBadge'

/**
 * Live-order card — matches incident board sketch (608:2 / image).
 * Layout: id+meta → vendor → status → incident chips → open/unattended → champ.
 */
export function AdminOpsOrderCard({
  order,
  tone = 'red',
  onIncidentClick,
  onContactClick,
  onOrderClick,
}) {
  const contactTypes =
    Array.isArray(order.contactTypes) && order.contactTypes.length > 0
      ? order.contactTypes
      : order.contactType
        ? [order.contactType]
        : []

  const temperatureRaw = order.temperature || order.category || null
  const temperature =
    temperatureRaw && temperatureRaw !== '—'
      ? String(temperatureRaw)
      : null
  const schedule =
    order.schedule && order.schedule !== '—'
      ? String(order.schedule)
      : null
  const timeLeft =
    order.timeLeft && order.timeLeft !== '—'
      ? String(order.timeLeft)
      : null
  const state = order.state || order.statusLabel || order.status || '—'
  const riderName = order.rider?.name || order.champ?.name || 'Unassigned'
  const stateText = String(state)
  const summary = order.incidentSummary
  const hasIncident = Boolean(order.hasIncident && summary)
  const isP1 = summary?.highestPriority === 'P1'
  const openedByName = summary?.openedBy?.displayName || null
  const sourceLabel = summary?.primarySourceLabel || null

  function openIncidents(event) {
    event.stopPropagation()
    onIncidentClick?.(order)
  }

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onOrderClick?.(order)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onOrderClick?.(order)
        }
      }}
      className={cn(
        'min-h-[112px] cursor-pointer rounded-[8px] border bg-white px-3 py-2.5 shadow-[0_1px_2px_rgba(20,40,28,.03)] transition hover:shadow-[0_3px_12px_rgba(0,0,0,.09)] focus:outline-none focus:ring-2 focus:ring-[#1a9b53]/20',
        isP1 ? 'border-[#efb8ba]' : 'border-[#e4e7e5]',
      )}
    >
      {/* Row 1 — order id · Hot food · order timer */}
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <strong className="min-w-0 truncate text-[12px] font-semibold leading-4 text-[#101a14]">
          {order.id}
        </strong>
        <div className="flex shrink-0 items-center gap-1.5">
          {temperature ? (
            <span
              className={cn(
                'whitespace-nowrap text-[9px] font-bold leading-4',
                temperature === 'Hot food' ? 'text-[#e2542a]' : 'text-[#6f7973]',
              )}
            >
              {temperature}
            </span>
          ) : null}
          {schedule ? (
            <span className="whitespace-nowrap rounded-full bg-[#eee8ff] px-1.5 py-0.5 text-[9px] font-medium text-[#7055aa]">
              {schedule}
            </span>
          ) : null}
          {timeLeft ? (
            <span
              className={cn(
                'inline-flex items-center gap-0.5 whitespace-nowrap font-mono text-[10px] font-medium leading-4',
                tone === 'red' ? 'text-[#c45c4a]' : 'text-[#c68618]',
              )}
            >
              <Clock3 size={11} className="shrink-0" strokeWidth={2.2} />
              {timeLeft}
            </span>
          ) : null}
        </div>
      </div>

      {/* Row 2 — vendor */}
      <p className="mb-1.5 truncate text-[12.5px] font-semibold leading-4 text-[#101a14]">
        {order.vendor || '—'}
      </p>

      {/* Row 3 — order status alone */}
      <div className="mb-1.5 flex flex-wrap gap-1">
        <span
          className={cn(
            'max-w-full truncate rounded px-[7px] py-[2.5px] text-[9px] font-semibold',
            stateText.startsWith('Preparing') && 'bg-[#fdf1de] text-[#a97013]',
            stateText.startsWith('Ready') && 'bg-[#e7effa] text-[#2b5a91]',
            stateText.startsWith('Picked') && 'bg-[#e7effa] text-[#2b5a91]',
            stateText.startsWith('On the way') && 'bg-[#e5f5eb] text-[#24834e]',
            (stateText.startsWith('Accepted') ||
              stateText.startsWith('Assigned') ||
              stateText.startsWith('Pending')) &&
              'bg-[#fdf1de] text-[#a97013]',
            stateText.toLowerCase().startsWith('placed') && 'bg-[#eef1ef] text-[#5d6d63]',
            !stateText.startsWith('Preparing') &&
              !stateText.startsWith('Ready') &&
              !stateText.startsWith('Picked') &&
              !stateText.startsWith('On the way') &&
              !stateText.startsWith('Accepted') &&
              !stateText.startsWith('Assigned') &&
              !stateText.startsWith('Pending') &&
              !stateText.toLowerCase().startsWith('placed') &&
              'bg-[#eef1ef] text-[#5d6d63]',
          )}
        >
          {stateText}
        </span>
      </div>

      {/* Row 4–5 — incident chips (sketch order) */}
      {hasIncident ? (
        <div className="mb-1.5 flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-1">
            <AdminIncidentSeverityBadge
              priority={summary.highestPriority}
              severityLabel={summary.highestPriority ? null : 'Unclassified'}
              className="rounded px-[7px] py-[2.5px]"
            />
            <button
              type="button"
              onClick={openIncidents}
              className="rounded bg-[#fbe9e6] px-[7px] py-[2.5px] text-[9px] font-semibold text-[#c45c4a] transition hover:brightness-95"
            >
              {summary.count > 1 ? `Incident ×${summary.count}` : 'Incident'}
            </button>
            {summary.primaryCategory ? (
              <span className="max-w-[9rem] truncate rounded bg-[#eef1ef] px-[7px] py-[2.5px] text-[9px] font-semibold text-[#5d6d63]">
                {summary.primaryCategory}
              </span>
            ) : null}
            {sourceLabel ? (
              <span className="rounded bg-[#f3eef5] px-[7px] py-[2.5px] text-[9px] font-semibold text-[#6b4a7a]">
                {sourceLabel}
              </span>
            ) : null}
            {summary.ageLabel ? (
              <span className="inline-flex items-center gap-0.5 rounded bg-[#f6f8f6] px-[7px] py-[2.5px] font-mono text-[9px] font-semibold text-[#c45c4a]">
                <Clock3 size={10} className="shrink-0" strokeWidth={2.2} />
                {summary.ageLabel}
              </span>
            ) : null}
            {summary.slaCountdownLabel ? (
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 rounded px-[7px] py-[2.5px] font-mono text-[9px] font-semibold',
                  String(summary.slaCountdownLabel).startsWith('Overdue')
                    ? 'bg-[#fbe9e6] text-[#c45c4a]'
                    : 'bg-[#fff8e8] text-[#9a7618]',
                )}
              >
                <Clock3 size={10} className="shrink-0" strokeWidth={2.2} />
                {summary.slaCountdownLabel}
              </span>
            ) : null}
            {summary.recurrenceLabel ? (
              <span className="rounded bg-[#fbe9e6] px-[7px] py-[2.5px] text-[9px] font-semibold text-[#c45c4a]">
                {summary.recurrenceLabel}
              </span>
            ) : null}
          </div>

          {openedByName ? (
            <span className="inline-flex w-fit max-w-full items-center gap-1 truncate rounded bg-[#e7f4ec] px-[7px] py-[2.5px] text-[9px] font-semibold text-[#1a6b3c]">
              <User size={11} className="shrink-0 text-[#5b3d8a]" strokeWidth={2.2} />
              Open · {openedByName}
            </span>
          ) : summary.unattended ? (
            <span className="inline-flex w-fit max-w-full truncate rounded bg-[#fff0ed] px-[7px] py-[2.5px] text-[9px] font-semibold text-[#c62828]">
              Unattended
            </span>
          ) : summary.attentionLabel ? (
            <span className="inline-flex w-fit max-w-full truncate rounded bg-[#eaf2fb] px-[7px] py-[2.5px] text-[9px] font-semibold text-[#3974ad]">
              {summary.attentionLabel}
            </span>
          ) : null}
        </div>
      ) : null}

      {/* Optional contact chips — only when no incident row (sketch keeps cards clean) */}
      {!hasIncident && contactTypes.length > 0 ? (
        <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
          {contactTypes.map((contactType) => {
            const threadId = resolveOrderConversationId(order, contactType)
            return (
              <button
                key={contactType}
                type="button"
                disabled={!threadId}
                title={threadId ? `Open ${contactType} support chat` : 'No conversation yet'}
                onClick={(event) => {
                  event.stopPropagation()
                  if (!threadId) return
                  onContactClick?.(order, contactType)
                }}
                className={cn(
                  'rounded-[9px] px-2 py-1 text-[9px] font-medium transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50',
                  contactType === 'Champ'
                    ? 'bg-[#e5efff] text-[#3470ae]'
                    : 'bg-[#eee8ff] text-[#7454ad]',
                )}
              >
                💬 {contactType}
              </button>
            )
          })}
        </div>
      ) : null}

      {/* Row 6 — champ */}
      <p className="flex min-w-0 items-center gap-1 text-[10.5px] font-medium text-[#6b7a71]">
        <img src={motoBike} alt="" className="h-3.5 w-3.5 shrink-0 object-contain" />
        <span className="min-w-0 truncate">{riderName}</span>
      </p>
    </article>
  )
}
