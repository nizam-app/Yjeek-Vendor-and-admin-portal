import motoBike from '../../../assets/moto_bike.png'
import { Clock3 } from 'lucide-react'
import { cn } from '../cn'
import { resolveOrderConversationId } from '../../../lib/adminOrderChat'
import { AdminIncidentSeverityBadge } from './AdminIncidentSeverityBadge'

/**
 * Shared Live-Orders-style card for Live / Pickup / Dine-in / Services boards.
 * Supports Incident, Champ/Customer chat badges, and order detail click.
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
  const isP1 = summary?.highestPriority === 'P1'

  const hasBadges = Boolean(temperature || schedule)

  const temperatureBadge = temperature ? (
    <span
      className={cn(
        'inline-flex shrink-0 items-center whitespace-nowrap text-[9px] font-medium leading-4',
        temperature === 'Hot food'
          ? 'rounded-full bg-[#fff0e8] px-1.5 py-0.5 text-[#ff5b2d]'
          : 'text-[#6f7973]',
      )}
    >
      {temperature}
    </span>
  ) : null

  const scheduleBadge = schedule ? (
    <span className="inline-flex shrink-0 items-center whitespace-nowrap rounded-full bg-[#eee8ff] px-1.5 py-0.5 text-[9px] font-medium leading-4 text-[#7055aa]">
      {schedule}
    </span>
  ) : null

  const timeBadge = timeLeft ? (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-0.5 whitespace-nowrap text-[10px] font-medium leading-4',
        tone === 'red' ? 'text-[#d13f45]' : 'text-[#c68618]',
      )}
    >
      <Clock3 size={11} className="shrink-0" />
      {timeLeft}
    </span>
  ) : null

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
        '@container min-h-[112px] cursor-pointer rounded-[9px] border bg-white p-2.5 shadow-[0_1px_2px_rgba(20,40,28,.03)] transition hover:border-[#a9cdb5] hover:shadow-[0_3px_8px_rgba(20,40,28,.08)] focus:outline-none focus:ring-2 focus:ring-[#1a9b53]/20',
        isP1 ? 'border-[#efb8ba] ring-1 ring-[#f5c2c4]' : 'border-[#dde3df]',
      )}
    >
      {/* Narrow card: ID + time on top, badges flush-left on 2nd line. Wide card: one row. */}
      <div className="flex flex-col gap-1">
        <div className="flex min-w-0 items-center gap-2">
          <strong className="min-w-0 flex-1 truncate text-[11px] font-bold leading-4">
            {order.id}
          </strong>
          <span className="@[300px]:hidden">{timeBadge}</span>
          <div className="hidden items-center gap-1.5 @[300px]:flex">
            {temperatureBadge}
            {scheduleBadge}
            {timeBadge}
          </div>
        </div>
        {hasBadges ? (
          <div className="flex flex-wrap items-center justify-start gap-1.5 pl-0 @[300px]:hidden">
            {temperatureBadge}
            {scheduleBadge}
          </div>
        ) : null}
      </div>

      <p className="mt-1.5 truncate text-[11px] font-bold leading-4">{order.vendor || '—'}</p>

      <div className="mt-1 flex flex-wrap items-center gap-1.5">
        <span
          className={cn(
            'max-w-full truncate rounded-md px-2 py-1 text-[9px] font-medium',
            stateText.startsWith('Preparing') && 'bg-[#fff3d8] text-[#a97013]',
            stateText.startsWith('Ready') && 'bg-[#e4efff] text-[#3470ae]',
            stateText.startsWith('Picked') && 'bg-[#e4efff] text-[#3470ae]',
            stateText.startsWith('On the way') && 'bg-[#e5f5eb] text-[#24834e]',
            (stateText.startsWith('Accepted') || stateText.startsWith('Assigned') || stateText.startsWith('Pending')) && 'bg-[#fff3d8] text-[#a97013]',
            stateText.toLowerCase().startsWith('placed') && 'bg-[#f0f2f0] text-[#59655e]',
            !stateText.startsWith('Preparing')
              && !stateText.startsWith('Ready')
              && !stateText.startsWith('Picked')
              && !stateText.startsWith('On the way')
              && !stateText.startsWith('Accepted')
              && !stateText.startsWith('Assigned')
              && !stateText.startsWith('Pending')
              && !stateText.toLowerCase().startsWith('placed')
              && 'bg-[#f0f2f0] text-[#59655e]',
          )}
        >
          {stateText}
        </span>
      </div>

      {summary && order.hasIncident ? (
        <div className="mt-1.5 flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-1">
            {summary?.count > 1 ? (
              <span className="rounded-md bg-[#fdebec] px-1.5 py-0.5 text-[9px] font-medium text-[#c62828]">
                Incident ×{summary.count}
              </span>
            ) : (
              <span className="rounded-md bg-[#fdebec] px-1.5 py-0.5 text-[9px] font-medium text-[#c62828]">
                Incident
              </span>
            )}
            <AdminIncidentSeverityBadge
              priority={summary.highestPriority}
              severityLabel={summary.highestPriority ? null : 'Unclassified'}
            />
            {summary.primaryCategory ? (
              <span className="max-w-full truncate rounded-md bg-[#f0f2f0] px-1.5 py-0.5 text-[9px] font-medium text-[#515c55]">
                {summary.primaryCategory}
              </span>
            ) : null}
            {summary.ageLabel ? (
              <span className="rounded-md bg-[#f0f2f0] px-1.5 py-0.5 text-[9px] font-medium text-[#515c55]">
                {summary.ageLabel}
              </span>
            ) : null}
            {summary.recurrenceLabel ? (
              <span className="rounded-md bg-[#fdebec] px-1.5 py-0.5 text-[9px] font-medium text-[#c62828]">
                {summary.recurrenceLabel}
              </span>
            ) : null}
          </div>
          {summary.attentionLabel ? (
            <span
              className={cn(
                'inline-flex w-fit max-w-full truncate rounded-md px-1.5 py-0.5 text-[9px] font-medium',
                summary.unattended ? 'bg-[#fff0ed] text-[#c62828]' : 'bg-[#eaf2fb] text-[#3974ad]',
              )}
            >
              {summary.attentionLabel}
            </span>
          ) : null}
        </div>
      ) : null}

      <div className="mt-1 flex flex-wrap items-center gap-1.5">
        {order.hasIncident ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              onIncidentClick?.(order)
            }}
            className="rounded-[9px] bg-[#fdebec] px-2 py-1 text-[9px] font-medium text-[#DB2626] transition hover:bg-[#f9d9da] focus:outline-none focus:ring-2 focus:ring-danger/25"
          >
            {summary?.count > 1
              ? `${summary.count} incidents · ${summary.highestPriority ? `${summary.highestPriority} highest` : 'unclassified severity'}`
              : summary?.highestPriority
                ? `${summary.highestPriority}${summary.primaryCategory ? ` · ${summary.primaryCategory}` : ''}${summary.ageLabel ? ` · ${summary.ageLabel}` : ''}`
                : order.incidentPriority
                  ? `Incident · ${order.incidentPriority}`
                  : 'Incident'}
          </button>
        ) : null}
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
              contactType === 'Champ' ? 'bg-[#e5efff] text-[#3470ae]' : 'bg-[#eee8ff] text-[#7454ad]',
            )}
          >
            💬 {contactType}
          </button>
          )
        })}
      </div>

      <p className="mt-1 flex min-w-0 items-center gap-1 text-[9px] font-medium text-[#2f3933]">
        <img src={motoBike} alt="" className="h-3 w-3 shrink-0 object-contain" />
        <span className="min-w-0 truncate">{riderName}</span>
      </p>
    </article>
  )
}
