import { liveOrders, dineInOrders } from '../data/mockData'
import { StatusPill } from './ui'

const btnBase = 'rounded-[8px] px-3 py-2 text-xs font-semibold'
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
      <strong className="text-[13px] font-bold">{value}</strong>
    </p>
  )
}

function stopCardAction(e) {
  e.stopPropagation()
}

export function OrderCard({ order, mode, dense, onSelect, onAccept, onHandoverChamp, onReject }) {
  if (order.status === 'rejected') {
    return (
      <div className={`${cardClass(dense)} cursor-pointer`} onClick={() => onSelect?.({ order, mode })} role="button" tabIndex={0}>
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
      <div className={`${cardClass(dense)} cursor-pointer`} onClick={() => onSelect?.({ order, mode })} role="button" tabIndex={0}>
        {order.when ? <p className="text-right text-[11px] font-medium text-ink-muted">{order.when}</p> : null}
        <p className="text-[14px] font-bold text-ink">{order.id}</p>
        <span className="inline-flex w-full items-center text-[11px] font-bold py-[3px] px-[9px] rounded-[8px] bg-[#fce8e8] text-[#c91a24]">
          ✕ No-show · cancelled
        </span>
        {order.note ? <p className="text-[11.5px] text-ink-muted">{order.note}</p> : null}
      </div>
    )
  }

  return (
    <div
      className={`${cardClass(dense)} cursor-pointer`}
      onClick={() => onSelect?.({ order, mode })}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect?.({ order, mode })
        }
      }}
      role="button"
      tabIndex={0}
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

      {order.sla ? <SlaRow label="Accept within (SLA 60s)" value={order.sla} /> : null}

      {order.readyLabel ? (
        <span className="inline-flex w-fit items-center text-[10px] font-semibold py-[3px] px-[9px] rounded-full bg-green-active-bg text-green-active-text  border-green-active-text">
          {order.readyLabel}
        </span>
      ) : null}
      {order.prepDelay ? (
        <div className="bg-warn-soft text-warn text-[10px] font-semibold py-[5px] px-[8px] rounded-[7px]">
          ⚠ Prep delay — SLA risk
        </div>
      ) : null}
      {order.prepTime ? (
        <p className={`flex items-center justify-between ${order.prepDelay ? 'text-warn' : 'text-ink'}`}>
          <span className="text-[11px] font-medium">Prep time</span>
          <strong className="text-[13px] font-bold">{order.prepTime}</strong>
        </p>
      ) : null}

      {mode === 'new' ? (
        <div className="flex gap-2">
          <button
            type="button"
            className={btnPrimaryAction}
            onClick={(e) => {
              stopCardAction(e)
              onAccept?.({ order, mode })
            }}
          >
            Accept
          </button>
          <button
            type="button"
            className={btnDangerOutline}
            onClick={(e) => {
              stopCardAction(e)
              onReject?.({ order, mode })
            }}
          >
            Reject
          </button>
        </div>
      ) : null}
      {mode === 'accepted' ? (
        <button type="button" className={btnPrimaryFull} onClick={stopCardAction}>
          Start preparing
        </button>
      ) : null}
      {mode === 'preparing' ? (
        <button type="button" className={btnPrimaryFull} onClick={stopCardAction}>
          Mark ready
        </button>
      ) : null}
      {mode === 'ready' ? (
        <>
          <button
            type="button"
            className={btnPrimaryFull}
            onClick={(e) => {
              stopCardAction(e)
              if (order.handoverType === 'champ' || order.handoverLabel === 'Handover to champ') {
                onHandoverChamp?.({ order, mode })
              }
            }}
          >
            {order.handoverLabel || 'Handover'}
          </button>
          {order.noShow ? (
            <button type="button" className={btnDangerOutlineFull} onClick={stopCardAction}>
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
      className={`inline-flex w-fit items-center text-[10px] font-semibold py-[3px] px-[9px] rounded-full border ${
        isUrgent ? 'bg-warn-soft text-warn border-warn' : 'bg-[#f2f2f2] text-ink-muted border-ink-muted'
      }`}
    >
      {icon} {tag}
    </span>
  )
}

export function DineInCard({ order, mode, dense, onSelect, onAccept, onReject }) {
  const separateRows = mode === 'ready' || (mode === 'confirmed' && order.arrived === false)
  const showTogether = !separateRows && order.when && order.tag

  return (
    <div
      className={`${cardClass(dense)} cursor-pointer`}
      onClick={() => onSelect?.({ order, mode })}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect?.({ order, mode })
        }
      }}
      role="button"
      tabIndex={0}
    >
      <p className="text-[12px] font-bold text-ink">{order.id}</p>
      <p className="text-[13px] font-semibold text-ink">
        {order.guest} · {order.guests} guests
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
        order.sla ? (
          <>
            <SlaRow label="Accept within (SLA 60 sec)" value={order.sla} />
            <div className="flex gap-2">
              <button
                type="button"
                className={btnPrimaryAction}
                onClick={(e) => {
                  stopCardAction(e)
                  onAccept?.({ order, mode })
                }}
              >
                Accept
              </button>
              <button
                type="button"
                className={btnDangerOutline}
                onClick={(e) => {
                  stopCardAction(e)
                  onReject?.({ order, mode })
                }}
              >
                Reject
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
          <button type="button" className={btnPrimaryFull} onClick={stopCardAction}>
            Start preparing
          </button>
        ) : (
          <>
            <button type="button" className={btnGhostAction} onClick={stopCardAction}>
              Awaiting arrival
            </button>
            <button type="button" className={btnDangerOutlineFull} onClick={stopCardAction}>
              No show
            </button>
          </>
        )
      ) : null}

      {mode === 'preparing' ? (
        <button type="button" className={btnPrimaryFull} onClick={stopCardAction}>
          Mark ready
        </button>
      ) : null}

      {mode === 'ready' ? (
        <>
          <button type="button" className={btnPrimaryFull} onClick={stopCardAction}>
            Verify &amp; complete
          </button>
          {order.noShow ? (
            <button type="button" className={btnDangerOutlineFull} onClick={stopCardAction}>
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

export function getColumns(tab) {
  const isDineIn = tab === 'dinein'
  const source = isDineIn ? dineInOrders : liveOrders
  const meta = columnMeta[isDineIn ? 'dinein' : 'delivery']
  const keys = isDineIn ? ['new', 'confirmed', 'preparing', 'ready'] : ['new', 'accepted', 'preparing', 'ready']

  return keys.map((key) => ({
    key,
    title: meta[key].title,
    subtitle: meta[key].subtitle,
    items: source[key] || [],
  }))
}
