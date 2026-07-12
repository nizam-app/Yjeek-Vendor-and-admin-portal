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
  cancelled: 'bg-danger-soft text-danger border-danger',
  rejected: 'bg-danger-soft text-danger border-danger',
  inactive: 'bg-[#f2f2f2] text-ink-muted border-border',
  closed: 'bg-[#f2f2f2] text-ink-muted border-border',
  busy: 'bg-warn-soft text-warn border-warn',
}

export function StatusPill({ status }) {
  const key = String(status || '')
    .toLowerCase()
    .replace(/\s+/g, '-')
  return (
    <span
      className={`inline-flex items-center py-[4px] px-3 rounded-full text-[10px] font-semibold border leading-normal ${
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
        <h1 className="text-[26px] font-bold tracking-[-0.02em] flex items-center gap-2.5">{title}</h1>
        {subtitle ? <p className="mt-1 text-ink-muted text-[13px]">{subtitle}</p> : null}
      </div>
      {actions ? <div>{actions}</div> : null}
    </div>
  )
}
