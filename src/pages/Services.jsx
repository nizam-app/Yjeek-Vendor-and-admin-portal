import { serviceBookings } from '../data/mockData'

const columnMeta = {
  new: { title: 'New', items: serviceBookings.new },
  upcoming: { title: 'Upcoming', items: serviceBookings.upcoming },
  inProgress: { title: 'In progress', items: serviceBookings.inProgress },
}

const tagTones = {
  blue: 'bg-[#e5f0ff] text-[#2978db]',
  blueBright: 'bg-[rgba(0,122,255,0.15)] text-[#007aff]',
}

function BookingCard({ order }) {
  if (order.noShow) {
    return (
      <div className="bg-white rounded-[10px] p-3 flex flex-col gap-[7px] w-full opacity-85">
        <p className="text-[11px] font-medium text-ink-muted text-right">{order.when}</p>
        <p className="text-[14px] font-bold text-ink">{order.id}</p>
        <p className="text-[12px] text-ink-muted">
          {order.customer} · {order.service}
        </p>
        <div className="bg-danger-soft rounded-[8px] py-[3px] px-[9px] w-full">
          <p className="text-[11px] font-bold text-[#c91a24]">✕ No-show · cancelled</p>
        </div>
        <p className="text-[11.5px] text-[#6b756e]">{order.noShowReason}</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-[10px] p-3 flex flex-col gap-[7px] w-full">
      <div className="flex items-center gap-1.5 w-full">
        {order.tag ? (
          <span className={`inline-flex items-center h-5 py-[3px] px-[9px] rounded-full text-[10.5px] font-semibold whitespace-nowrap ${tagTones[order.tagTone]}`}>
            {order.tag}
          </span>
        ) : null}
        <p className="flex-1 text-[11px] font-medium text-ink-muted text-right">{order.when}</p>
      </div>
      <p className="text-[14px] font-bold text-ink">{order.id}</p>
      <p className="text-[12px] text-ink-muted">
        {order.customer} · {order.service}
      </p>

      {order.slaLabel ? (
        <div className="flex items-center justify-between w-full text-[#d9730d]">
          <p className="text-[11px] font-medium">{order.slaLabel}</p>
          <p className="text-[13px] font-bold">{order.slaValue}</p>
        </div>
      ) : null}

      {order.actions && order.actions.length === 2 ? (
        <div className="flex gap-2 w-full">
          <button type="button" className="flex-1 bg-green-primary text-white rounded-[8px] py-2 px-3 text-xs font-semibold">
            {order.actions[0]}
          </button>
          <button type="button" className="flex-1 bg-white border border-border rounded-[8px] py-2 px-3 text-xs font-semibold text-danger">
            {order.actions[1]}
          </button>
        </div>
      ) : null}

      {order.buttonLabel ? (
        <button type="button" className="w-full bg-[#2e9e4d] text-white rounded-[8px] h-8 text-[13px] font-semibold">
          {order.buttonLabel}
        </button>
      ) : null}
    </div>
  )
}

export default function Services() {
  return (
    <div className="pt-[26px] px-[28px] pb-10">
      <div className="flex flex-col gap-1 mb-5">
        <h1 className="text-[26px] font-bold text-ink">Services bookings</h1>
        <button
          type="button"
          className="self-start bg-white border-[1.2px] border-[#e0e5e0] rounded-[18px] py-2 px-[14px] text-[13px] font-semibold text-ink"
        >
          📅 Calendar view
        </button>
      </div>

      <div className="flex items-center justify-end gap-3 mb-3.5">
        <input
          className="border border-border rounded-[8px] h-10 px-[14px] text-xs bg-white min-w-[220px]"
          placeholder="Search by order #…"
        />
      </div>

      <div className="grid grid-cols-3 gap-[14px] max-[1200px]:grid-cols-1">
        {Object.entries(columnMeta).map(([key, meta]) => (
          <div key={key} className="bg-[#f0f2f0] rounded-[12px] p-3 min-h-[520px] flex flex-col gap-2.5">
            <div className="flex items-center gap-1.5 h-[18px]">
              <span className="flex-1 text-[13px] font-bold text-ink">{meta.title}</span>
              <span className="bg-white rounded-full py-[2px] px-[7px] text-[11px] font-semibold text-ink-muted">{meta.items.length}</span>
              <span className="inline-flex items-center justify-center w-[18px] h-[18px] rounded-[5px] border border-[#d9ded9] bg-white text-[11px] font-semibold text-ink-muted">
                ↗
              </span>
            </div>
            {meta.items.length === 0 ? (
              <div className="text-ink-muted text-[13px] p-6 text-center">No bookings</div>
            ) : (
              meta.items.map((order, idx) => <BookingCard key={`${order.id}-${idx}`} order={order} />)
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
