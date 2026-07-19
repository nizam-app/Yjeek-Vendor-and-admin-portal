const pillTones = {
  new: 'bg-warn-soft text-warn border-warn',
  accepted: 'bg-[#ebf2ff] text-[#2978db] border-[#2978db]',
  confirmed: 'bg-[#ebf2ff] text-[#2978db] border-[#2978db]',
  preparing: 'bg-[#ebf2ff] text-[#2978db] border-[#2978db]',
  ready: 'bg-green-active-bg text-green-active-text border-green-active-text',
  completed: 'bg-green-active-bg text-green-active-text border-green-active-text',
  delivered: 'bg-green-active-bg text-green-active-text border-green-active-text',
  active: 'bg-green-active-bg text-green-active-text border-green-active-text',
  open: 'bg-green-active-bg text-green-active-text border-green-active-text',
  scheduled: 'bg-warn-soft text-warn border-warn',
  paused: 'bg-[#F2F4F2] text-[#6B736E] border-[#949994]',
  ended: 'bg-[#F2F4F2] text-[#949994] border-[#C7CFC7]',
  cancelled: 'bg-danger-soft text-danger border-danger',
  rejected: 'bg-danger-soft text-danger border-danger',
  inactive: 'bg-[#F2F4F2] text-[#1A1A1A] border-[#1A1A1A]',
  closed: 'bg-[#f2f2f2] text-ink-muted border-border',
  busy: 'bg-warn-soft text-warn border-warn',
}

// test github
export function StatusPill({ status }) {
  const key = String(status || '')
    .toLowerCase()
    .replace(/\s+/g, '-')
  return (
    <span
      className={`inline-flex items-center rounded-full  px-3 py-[4px] text-[10px] leading-normal font-bold ${
        pillTones[key] || 'border-transparent'
      }`}
    >
      {status}
    </span>
  )
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-5">
      <div>
        <h1 className="text-[20px] font-bold tracking-[-0.02em] flex items-center gap-2.5">{title}</h1>
        {subtitle ? <p className="mt-1 text-ink-muted text-[13px]">{subtitle}</p> : null}
      </div>
      {actions ? <div>{actions}</div> : null}
    </div>
  )
}
