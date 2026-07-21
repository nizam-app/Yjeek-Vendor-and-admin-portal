import { Check } from 'lucide-react'
import { cn } from '../cn'

function orderTagClass(tag) {
  if (tag.includes('Special')) return 'rounded-full bg-[#f2edfc] px-1.5 py-0.5 text-[#8f4da0]'
  if (tag === 'Normal') return 'text-[#6f7973]'
  if (tag === 'Standard') return 'rounded-full bg-[#fff3d6] px-1.5 py-0.5 text-[#9a6d12]'
  if (tag === 'Same Day') return 'rounded-full bg-[#e5f0ff] px-1.5 py-0.5 text-[#2978DB]'
  if (tag === 'Next Day') return 'rounded-full bg-[#eee8ff] px-1.5 py-0.5 text-[#734DBF]'
  if (tag === 'Economy') return 'rounded-full bg-[#eff2f0] px-1.5 py-0.5 text-[#667069]'
  return 'rounded-full bg-[#eff2f0] px-1.5 py-0.5 text-[#667069]'
}

function OrderPaymentBadge({ payment }) {
  const expired = payment.toLowerCase().includes('expired')
  const declined = payment === 'Declined'
  const preparing = payment === 'Preparing'
  const readyPickup = payment === 'Ready for pickup'
  const paidReady = payment.includes('Paid') || payment.includes('Ready for dispatch')
  const awaiting = payment.includes('Awaiting') || payment.includes('payment')

  let tone = 'bg-[#fff3d6] text-[#9a6d12]'
  if (expired || declined) tone = 'bg-[#fdebec] text-[#c54749]'
  else if (paidReady || readyPickup) tone = 'bg-[#e5f5eb] text-[#24834e]'
  else if (preparing || awaiting) tone = 'bg-[#fff3d6] text-[#9a6d12]'

  return (
    <div className="mt-1.5">
      <span className={cn('inline-flex max-w-full items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-medium', tone)}>
        {preparing ? <span aria-hidden="true">🍲</span> : null}
        {readyPickup ? <Check size={9} strokeWidth={3} /> : null}
        <span className="truncate">{payment}</span>
      </span>
    </div>
  )
}

export function OrderCard({ order, mode }) {
  const actionStyles = {
    green: 'border-[#19ad5b] bg-[#19ad5b] text-white',
    red: 'border-[#e12e32] bg-[#e12e32] text-white',
    redSoft: 'border-[#fde5e5] bg-[#fde5e5] text-[#bd3b3e]',
    blue: 'border-[#dcecf8] bg-[#e8f3fb] text-[#35729d]',
  }
  return (
    <article className="rounded-[12px] border border-[#e1e5e2] bg-white p-[11px] shadow-[0_1px_2px_rgba(20,40,28,.04)]">
      <div className="flex items-start justify-between gap-2">
        <b className="text-[11px]">{order.id}</b>
        <div className="flex flex-wrap items-center justify-end gap-1">
          {order.tags.map((tag) => (
            <span key={tag} className={cn('text-[9px] font-medium', orderTagClass(tag))}>{tag}</span>
          ))}
        </div>
      </div>
      <OrderPaymentBadge payment={order.payment} />
      <p className="mt-1.5 text-[10px] font-medium">{order.route}</p>
      {order.slot ? <p className="mt-1 text-[9px] text-[#78827c]">{order.slot}</p> : null}
      {order.champ ? <p className="mt-1 text-[9px] text-[#536158]">♟ {order.champ}</p> : null}
      {order.action ? <button className={cn('mt-2 h-[26px] w-full rounded-[8px] border text-[9px] font-medium', order.actionTone ? actionStyles[order.actionTone] : 'border-[#dfe4e0] bg-white text-[#4e5a52]')}>{order.action}</button> : null}
      {order.timer ? <div className="mt-1.5 rounded-[8px] bg-[#fff3d7] px-2 py-1.5 text-center text-[9px] font-medium text-[#9c6b14]">{order.timer}</div> : null}
      {order.note ? <p className="mt-1 text-[9px] leading-tight text-[#8a938d]">{order.note}</p> : null}
      {order.footer ? <button className="mt-1.5 h-[24px] w-full rounded-[8px] bg-[#ff940f] text-[9px] font-medium text-white">{order.footer}</button> : null}
    </article>
  )
}
