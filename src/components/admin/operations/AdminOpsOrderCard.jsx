import motoBike from '../../../assets/moto_bike.png'
import { Clock3 } from 'lucide-react'
import { cn } from '../cn'

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

  const temperature = order.temperature || order.category || null
  const state = order.state || order.statusLabel || order.status || '—'
  const riderName = order.rider?.name || order.champ?.name || 'Unassigned'
  const stateText = String(state)

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
      className="min-h-[112px] cursor-pointer rounded-[9px] border border-[#dde3df] bg-white p-2.5 shadow-[0_1px_2px_rgba(20,40,28,.03)] transition hover:border-[#a9cdb5] hover:shadow-[0_3px_8px_rgba(20,40,28,.08)] focus:outline-none focus:ring-2 focus:ring-[#1a9b53]/20"
    >
      <div className="flex items-center gap-2">
        <strong className="min-w-0 flex-1 truncate text-[11px] font-bold">{order.id}</strong>
        {temperature ? (
          <span className={cn(
            'shrink-0 text-[9px] font-medium',
            temperature === 'Hot food'
              ? 'rounded-full bg-[#fff0e8] px-1.5 py-0.5 text-[#ff5b2d]'
              : 'text-[#6f7973]',
          )}>{temperature}</span>
        ) : null}
        {order.schedule ? (
          <span className="rounded bg-[#eee8ff] px-1 text-[9px] font-medium text-[#7055aa]">{order.schedule}</span>
        ) : null}
        <span className={cn(
          'flex items-center gap-0.5 text-[10px] font-medium',
          tone === 'red' ? 'text-[#d13f45]' : tone === 'yellow' ? 'text-[#c68618]' : 'text-[#c68618]',
        )}>
          <Clock3 size={11} /> {order.timeLeft || '—'}
        </span>
      </div>
      <p className="mt-1.5 truncate text-[11px] font-bold">{order.vendor || '—'}</p>
      <div className="mt-1 flex items-center gap-1.5">
        <span className={cn(
          'max-w-[112px] truncate rounded-md px-2 py-1 text-[9px] font-medium',
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
        )}>{stateText}</span>
      </div>
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
            Incident
          </button>
        ) : null}
        {contactTypes.map((contactType) => (
          <button
            key={contactType}
            type="button"
            disabled={!order.conversationId}
            title={order.conversationId ? `Open ${contactType} chat` : 'No conversation yet'}
            onClick={(event) => {
              event.stopPropagation()
              if (!order.conversationId) return
              onContactClick?.(order, contactType)
            }}
            className={cn(
              'rounded-[9px] px-2 py-1 text-[9px] font-medium transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50',
              contactType === 'Champ' ? 'bg-[#e5efff] text-[#3470ae]' : 'bg-[#eee8ff] text-[#7454ad]',
            )}
          >
            💬 {contactType}
          </button>
        ))}
      </div>
      <p className="mt-1 flex items-center gap-1 truncate text-[9px] font-medium text-[#2f3933]">
        <img src={motoBike} alt="" className="h-3 w-3 shrink-0 object-contain" />
        <span className="truncate">{riderName}</span>
      </p>
    </article>
  )
}
