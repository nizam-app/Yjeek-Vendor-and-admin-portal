import { cn } from '../cn'

export function AutomationSectionCard({ title, subtitle, actions, children, className }) {
  return (
    <section
      className={cn(
        'mb-5 overflow-hidden rounded-[10px] border border-[#e5e7eb] bg-white',
        className,
      )}
    >
      {title || actions ? (
        <div className="flex flex-wrap items-center gap-3 border-b border-[#e5e7eb] px-5 py-4">
          <div className="min-w-0 flex-1">
            {title ? <h3 className="text-[14px] font-bold text-[#111827]">{title}</h3> : null}
            {subtitle ? <p className="mt-0.5 text-[11.5px] text-[#6b7280]">{subtitle}</p> : null}
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  )
}

export function AutomationFieldRow({ label, help, mutedLabel = false, children, className }) {
  return (
    <div
      className={cn(
        'flex min-h-[54px] flex-wrap items-center gap-x-5 gap-y-2 border-b border-[#e5e7eb] px-5 py-3.5 last:border-b-0',
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        <div
          className={cn(
            'text-[13px] font-medium',
            mutedLabel ? 'text-[#6b7280]' : 'text-[#d97706]',
          )}
        >
          {label}
        </div>
        {help ? <div className="mt-0.5 text-[11px] leading-snug text-[#9ca3af]">{help}</div> : null}
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-1.5">{children}</div>
    </div>
  )
}

export function AutomationSubsectionTitle({ children }) {
  return (
    <div className="border-b border-[#e5e7eb] px-5 pb-1.5 pt-2 text-[10px] font-bold uppercase tracking-[0.1em] text-[#9ca3af]">
      {children}
    </div>
  )
}
