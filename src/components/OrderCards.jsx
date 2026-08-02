import { StatusPill } from './ui'
import { useOrderTimers } from '../hooks/useOrderTimers'

const btnBase = 'rounded-[8px] px-3 py-2 text-xs font-medium'
const btnPrimaryAction = `flex-1 text-center bg-green-primary text-white ${btnBase} hover:brightness-[0.96]`
const btnGhostAction = `w-full text-center border border-border bg-white text-ink ${btnBase}`
const btnDangerOutline = `flex-1 text-center border border-border text-danger bg-white ${btnBase}`
const btnDangerOutlineFull = `w-full text-center border border-border text-danger bg-white ${btnBase}`
const btnPrimaryFull = `w-full text-center bg-green-primary text-white ${btnBase} hover:brightness-[0.96]`

function cardClass(dense) {
  return `bg-white rounded-md p-3 border border-border flex flex-col gap-2${dense ? '' : ' mb-3'}`
}

function SlaRow({ label, value }) {
  return (
    <p className="flex items-center justify-between text-warn">
      <span className="text-[11px] font-medium">⏱️ {label}</span>
      <strong className="text-[13px] font-bold tabular-nums">{value}</strong>
    </p>
  )
}

function stopCardAction(e) {
  e.stopPropagation()
}

function triggerReject(e, onReject, order, mode, intent = 'reject') {
  stopCardAction(e)
  onReject?.({ order, mode, intent })
}

function openDetailsOnClick(mode) {
  return mode === 'new'
}

export function OrderCard({
  order,
  mode,
  dense,
  onSelect,
  onAccept,
  onPrimaryAction,
  onHandoverChamp,
  onReject,
  accepting,
  rejecting,
  actioning,
}) {
  const isAccepting = Boolean(accepting)
  const isRejecting = Boolean(rejecting)
  const isBusy = isAccepting || isRejecting
  const isActioning = Boolean(actioning)
  const canOpenDetails = openDetailsOnClick(mode)
  const { acceptCountdown, prepElapsed, prepDelay } = useOrderTimers(order, {
    trackAccept: mode === 'new' && order.status !== 'rejected' && order.status !== 'no-show-cancelled',
    trackPrep: mode === 'preparing',
  })

  if (order.status === 'rejected') {
    return (
      <div
        className={`${cardClass(dense)}${canOpenDetails ? ' cursor-pointer' : ''}`}
        onClick={canOpenDetails ? () => onSelect?.({ order, mode }) : undefined}
        role={canOpenDetails ? 'button' : undefined}
        tabIndex={canOpenDetails ? 0 : undefined}
      >
        <span className="inline-flex w-fit items-center text-[10px] font-bold py-[2px] px-[7px] rounded-[6px] bg-[#fce8e8] text-[#c91a24]">
          ✕ REJECTED
        </span>
        <div className="flex justify-between text-[12px] font-bold">
          <span className="text-ink">{order.id}</span>
          <span className="text-green-primary text-[13px]">{order.total}</span>
        </div>
        <p className="text-ink-muted text-xs">{order.items}</p>
        <p className="text-ink-faint text-[11px]">{order.customer}</p>
        {order.reason ? <p className="text-ink-muted text-xs">Reason: {order.reason}</p> : null}
      </div>
    )
  }

  if (order.status === 'no-show-cancelled') {
    return (
      <div
        className={`${cardClass(dense)}${canOpenDetails ? ' cursor-pointer' : ''}`}
        onClick={canOpenDetails ? () => onSelect?.({ order, mode }) : undefined}
        role={canOpenDetails ? 'button' : undefined}
        tabIndex={canOpenDetails ? 0 : undefined}
      >
        {order.when ? <p className="text-right text-[11px] font-medium text-ink-muted">{order.when}</p> : null}
        <p className="text-[14px] font-bold text-ink">{order.id}</p>
        <span className="inline-flex w-full items-center text-[11px] font-bold py-[3px] px-[9px] rounded-[8px] bg-[#fce8e8] text-[#c91a24]">
          ✕ No-show · cancelled
        </span>
        {order.note ? <p className="text-[11px] text-ink-muted">{order.note}</p> : null}
      </div>
    )
  }

  return (
    <div
      className={`${cardClass(dense)}${canOpenDetails ? ' cursor-pointer' : ''}`}
      onClick={canOpenDetails ? () => onSelect?.({ order, mode }) : undefined}
      onKeyDown={
        canOpenDetails
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onSelect?.({ order, mode })
              }
            }
          : undefined
      }
      role={canOpenDetails ? 'button' : undefined}
      tabIndex={canOpenDetails ? 0 : undefined}
    >
      {order.type && order.type !== 'Delivery' ? (
        <span className="inline-flex w-fit bg-[#dceeff] text-[#2978db] text-[10px] font-bold uppercase py-[2px] px-[7px] rounded-[6px]">
          {order.type}
        </span>
      ) : null}
      <div className="flex justify-between text-[12px] font-bold">
        <span className="text-ink">{order.id}</span>
        <span className="text-green-primary text-[13px]">{order.total}</span>
      </div>
      <p className="text-ink text-[13px] font-medium">{order.items}</p>
      <p className="text-ink-faint text-[12px]">{order.customer}</p>

      {acceptCountdown ? <SlaRow label="Accept within (SLA 60s)" value={acceptCountdown} /> : null}

      {order.readyLabel ? (
        <span className="inline-flex w-fit items-center text-[10px] font-medium py-[3px] px-[9px] rounded-full bg-green-active-bg text-green-active-text  border-green-active-text">
          {order.readyLabel}
        </span>
      ) : null}
      {prepDelay ? (
        <div className="bg-warn-soft text-warn text-[10px] font-medium py-[5px] px-[8px] rounded-[7px]">
          ⚠ Prep delay — SLA risk
        </div>
      ) : null}
      {prepElapsed ? (
        <p className={`flex items-center justify-between ${prepDelay ? 'text-warn' : 'text-ink'}`}>
          <span className="text-[11px] font-medium">Prep time</span>
          <strong className="text-[13px] font-bold tabular-nums">{prepElapsed}</strong>
        </p>
      ) : null}

      {mode === 'new' ? (
        <div className="flex gap-2">
          <button
            type="button"
            className={btnPrimaryAction}
            disabled={isBusy}
            onClick={(e) => {
              stopCardAction(e)
              onAccept?.({ order, mode })
            }}
          >
            {isAccepting ? 'Accepting…' : 'Accept'}
          </button>
          <button
            type="button"
            className={btnDangerOutline}
            disabled={isBusy}
            onClick={(e) => triggerReject(e, onReject, order, mode)}
          >
            {isRejecting ? 'Rejecting…' : 'Reject'}
          </button>
        </div>
      ) : null}
      {mode === 'accepted' ? (
        <button
          type="button"
          className={`${btnPrimaryFull} disabled:cursor-not-allowed disabled:opacity-50`}
          disabled={isActioning}
          onClick={(e) => {
            stopCardAction(e)
            onPrimaryAction?.({ order, mode })
          }}
        >
          {isActioning ? 'Updating…' : order.primaryAction?.label || 'Start preparing'}
        </button>
      ) : null}
      {mode === 'preparing' ? (
        <button
          type="button"
          className={`${btnPrimaryFull} disabled:cursor-not-allowed disabled:opacity-50`}
          disabled={isActioning}
          onClick={(e) => {
            stopCardAction(e)
            onPrimaryAction?.({ order, mode })
          }}
        >
          {isActioning ? 'Updating…' : order.primaryAction?.label || 'Mark ready'}
        </button>
      ) : null}
      {mode === 'ready' ? (
        <>
          {order.primaryAction ? (
            <button
              type="button"
              className={btnPrimaryFull}
              disabled={isActioning}
              onClick={(e) => {
                stopCardAction(e)
                if (order.primaryAction?.key === 'HANDOVER_TO_CHAMP') {
                  onHandoverChamp?.({ order, mode })
                } else {
                  onPrimaryAction?.({ order, mode })
                }
              }}
            >
              {isActioning ? 'Updating…' : order.primaryAction.label}
            </button>
          ) : null}
          {order.noShow ? (
            <button type="button" className={btnDangerOutlineFull} onClick={(e) => triggerReject(e, onReject, order, mode, 'no-show')}>
              No Show
            </button>
          ) : null}
        </>
      ) : null}
    </div>
  )
}

function DineInTag({ tag }) {
  if (!tag) return null
  const isUrgent = tag === 'Prepare now'
  const icon = isUrgent ? '🔥' : '🕒'
  return (
    <span
      className={`inline-flex w-fit items-center text-[10px] font-medium py-[3px] px-[9px] rounded-full border ${
        isUrgent ? 'bg-warn-soft text-warn border-warn' : 'bg-[#f2f2f2] text-ink-muted border-ink-muted'
      }`}
    >
      {icon} {tag}
    </span>
  )
}

export function DineInCard({
  order,
  mode,
  dense,
  onSelect,
  onAccept,
  onPrimaryAction,
  onReject,
  accepting,
  rejecting,
  actioning,
}) {
  const isAccepting = Boolean(accepting)
  const isRejecting = Boolean(rejecting)
  const isBusy = isAccepting || isRejecting
  const isActioning = Boolean(actioning)
  const canOpenDetails = openDetailsOnClick(mode)
  const separateRows = mode === 'ready' || (mode === 'confirmed' && order.arrived === false)
  const showTogether = !separateRows && order.when && order.tag
  const { acceptCountdown } = useOrderTimers(order, {
    trackAccept: mode === 'new',
    trackPrep: false,
  })

  return (
    <div
      className={`${cardClass(dense)}${canOpenDetails ? ' cursor-pointer' : ''}`}
      onClick={canOpenDetails ? () => onSelect?.({ order, mode }) : undefined}
      onKeyDown={
        canOpenDetails
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onSelect?.({ order, mode })
              }
            }
          : undefined
      }
      role={canOpenDetails ? 'button' : undefined}
      tabIndex={canOpenDetails ? 0 : undefined}
    >
      <p className="text-[12px] font-bold text-ink">{order.id}</p>
      <p className="text-[13px] font-medium text-ink">
        {order.guest}
        {order.guests != null && order.guests !== '' ? ` · ${order.guests} guests` : ''}
      </p>

      {showTogether ? (
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-ink-muted">{order.when}</span>
          <DineInTag tag={order.tag} />
        </div>
      ) : (
        <>
          {order.when ? (
            <p className="text-xs font-medium text-ink-muted">
              {separateRows ? `🕒 ${order.when}` : order.when}
            </p>
          ) : null}
          {separateRows ? <DineInTag tag={order.tag} /> : null}
        </>
      )}
      {!separateRows && !order.when && order.tag ? <DineInTag tag={order.tag} /> : null}

      {mode === 'new' ? (
        acceptCountdown || order.sla ? (
          <>
            <SlaRow label="Accept within (SLA 60 sec)" value={acceptCountdown || order.sla} />
            <div className="flex gap-2">
              <button
                type="button"
                className={btnPrimaryAction}
                disabled={isBusy}
                onClick={(e) => {
                  stopCardAction(e)
                  onAccept?.({ order, mode })
                }}
              >
                {isAccepting ? 'Accepting…' : 'Accept'}
              </button>
              <button
                type="button"
                className={btnDangerOutline}
                disabled={isBusy}
                onClick={(e) => triggerReject(e, onReject, order, mode)}
              >
                {isRejecting ? 'Rejecting…' : 'Reject'}
              </button>
            </div>
          </>
        ) : (
          <button type="button" className={`${btnGhostAction} disabled:text-ink-faint disabled:cursor-default`} disabled onClick={stopCardAction}>
            {order.note || 'Awaiting customer payment'}
          </button>
        )
      ) : null}

      {mode === 'confirmed' ? (
        order.arrived ? (
          <button
            type="button"
            className={`${btnPrimaryFull} disabled:cursor-not-allowed disabled:opacity-50`}
            disabled={isActioning}
            onClick={(e) => {
              stopCardAction(e)
              onPrimaryAction?.({ order, mode })
            }}
          >
            {isActioning ? 'Updating…' : order.primaryAction?.label || 'Start preparing'}
          </button>
        ) : (
          <>
            <button type="button" className={btnGhostAction} onClick={stopCardAction}>
              Awaiting arrival
            </button>
            <button type="button" className={btnDangerOutlineFull} onClick={(e) => triggerReject(e, onReject, order, mode, 'no-show')}>
              No show
            </button>
          </>
        )
      ) : null}

      {mode === 'preparing' ? (
        <button
          type="button"
          className={`${btnPrimaryFull} disabled:cursor-not-allowed disabled:opacity-50`}
          disabled={isActioning}
          onClick={(e) => {
            stopCardAction(e)
            onPrimaryAction?.({ order, mode })
          }}
        >
          {isActioning ? 'Updating…' : order.primaryAction?.label || 'Mark ready'}
        </button>
      ) : null}

      {mode === 'ready' ? (
        <>
          <button
            type="button"
            className={`${btnPrimaryFull} disabled:cursor-not-allowed disabled:opacity-50`}
            disabled={isActioning}
            onClick={(e) => {
              stopCardAction(e)
              onPrimaryAction?.({ order, mode })
            }}
          >
            {isActioning ? 'Updating…' : order.primaryAction?.label || 'Verify & complete'}
          </button>
          {order.noShow ? (
            <button type="button" className={btnDangerOutlineFull} onClick={(e) => triggerReject(e, onReject, order, mode, 'no-show')}>
              No show
            </button>
          ) : null}
        </>
      ) : null}
    </div>
  )
}

const columnMeta = {
  delivery: {
    new: { title: 'New', subtitle: 'New orders — accept within SLA' },
    accepted: { title: 'Accepted', subtitle: 'Accepted orders — waiting to start preparing' },
    preparing: { title: 'Preparing', subtitle: 'Orders being prepared in the kitchen' },
    ready: { title: 'Ready', subtitle: 'Ready orders — hand over to rider or customer' },
  },
  dinein: {
    new: { title: 'New', subtitle: 'New dine-in requests — accept within SLA' },
    confirmed: { title: 'Confirmed', subtitle: 'Confirmed guests — start preparing when arrived' },
    preparing: { title: 'Preparing', subtitle: 'Orders being prepared for seated guests' },
    ready: { title: 'Ready for guest', subtitle: 'Ready to verify and complete at the table' },
  },
}

export function getColumns(tab, orders) {
  const isDineIn = tab === 'dinein'
  const source = isDineIn ? orders?.dineIn : orders?.delivery
  const meta = columnMeta[isDineIn ? 'dinein' : 'delivery']
  const keys = isDineIn ? ['new', 'confirmed', 'preparing', 'ready'] : ['new', 'accepted', 'preparing', 'ready']

  return keys.map((key) => ({
    key,
    title: meta[key].title,
    subtitle: meta[key].subtitle,
    items: source?.[key] || [],
  }))
}
