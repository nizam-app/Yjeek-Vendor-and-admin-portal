import { PageHeader } from '../components/ui'
import { scheduledOrders } from '../data/mockData'

const windowTones = {
  blue: 'bg-[#e5f0ff] text-[#2978db]',
  purple: 'bg-[#ede3fa] text-[#704dbf]',
  orange: 'bg-[#fff0d9] text-[#d98c1a]',
  gray: 'bg-[#ededed] text-ink-muted',
}

const btnBase = 'w-full text-center rounded-[8px] py-2 text-[13px] font-semibold'
const btnPrimaryFull = `bg-green-primary text-white ${btnBase} hover:brightness-[0.96]`
const btnGhostFull = `bg-white border border-border text-danger ${btnBase}`

const columnMeta = {
  new: { title: 'New', buttonLabel: null },
  confirmed: { title: 'Confirmed', buttonLabel: 'Start preparing' },
  preparing: { title: 'Preparing', buttonLabel: 'Mark ready for pickup' },
  readyForPickup: { title: 'Ready for pickup', buttonLabel: 'Handover to champ' },
}

function ScheduleCard({ order, buttonLabel }) {
  return (
    <div className="bg-white rounded-[10px] p-3 flex flex-col gap-[7px] w-full">
      <div className="flex items-center gap-1.5">
        <span className={`inline-flex items-center rounded-full py-[3px] px-[9px] text-[10.5px] font-semibold ${windowTones[order.windowTone]}`}>
          {order.window}
        </span>
        <span className="flex-1 text-right text-[11px] font-medium text-ink-muted">{order.when}</span>
      </div>
      <p className="text-[14px] font-bold text-ink">{order.id}</p>
      <p className="text-xs text-ink-muted">{order.customer}</p>

      {order.sla ? (
        <p className="flex items-center justify-between text-warn">
          <span className="text-[11px] font-medium">Accept within (SLA 5min)</span>
          <strong className="text-[13px] font-bold">{order.sla}</strong>
        </p>
      ) : null}
      {order.note ? (
        <p className="flex items-center justify-between text-warn">
          <span className="text-[11px] font-medium">{order.note}</span>
          <strong className="text-[13px] font-bold">{order.noteValue}</strong>
        </p>
      ) : null}

      {order.sla ? (
        <div className="flex gap-2">
          <button type="button" className="flex-1 text-center bg-green-primary text-white rounded-[8px] px-3 py-2 text-xs font-semibold hover:brightness-[0.96]">
            Accept
          </button>
          <button type="button" className="flex-1 text-center border border-border text-danger bg-white rounded-[8px] px-3 py-2 text-xs font-semibold">
            Reject
          </button>
        </div>
      ) : null}
      {buttonLabel ? <button type="button" className={btnPrimaryFull}>{buttonLabel}</button> : null}
    </div>
  )
}

export default function Scheduled() {
  return (
    <div className="pt-[26px] px-[28px] pb-10">
      <PageHeader title="Scheduled orders" />

      <div className="flex items-center justify-end gap-3 mb-4">
        <input
          className="border border-border rounded-[8px] h-10 px-[14px] text-xs bg-white min-w-[220px]"
          placeholder="Search by order #…"
        />
      </div>

      <div className="grid grid-cols-4 gap-[14px] max-[1200px]:grid-cols-2">
        {Object.entries(columnMeta).map(([key, meta]) => {
          const items = scheduledOrders[key] || []
          return (
            <div key={key} className="bg-[#f0f2f0] rounded-lg p-3 min-h-[520px] flex flex-col gap-2.5">
              <div className="flex items-center gap-1.5 text-[13px] font-bold text-ink">
                <span className="flex-1">{meta.title}</span>
                <span className="bg-white rounded-full py-[2px] px-[7px] text-[11px] font-semibold text-ink-muted">{items.length}</span>
                <span className="inline-flex items-center justify-center w-[18px] h-[18px] rounded-[5px] border border-[#d9ded9] bg-white text-[11px] font-semibold text-ink-muted">
                  ↗
                </span>
              </div>
              {items.length === 0 ? (
                <div className="text-ink-muted text-[13px] p-6 text-center">No orders</div>
              ) : (
                items.map((order, idx) => (
                  <ScheduleCard key={`${order.id}-${idx}`} order={order} buttonLabel={meta.buttonLabel} />
                ))
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
