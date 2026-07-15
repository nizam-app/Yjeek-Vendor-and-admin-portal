import { notifications } from '../data/mockData'

const sections = [
  { key: 'today', label: 'TODAY' },
  { key: 'earlier', label: 'EARLIER' },
]

export default function Notifications() {
  return (
    <div className="px-[28px] pt-[26px] pb-10">
      <div className="mb-5">
        <h1 className="text-[26px] font-bold tracking-[-0.02em] text-ink">Notifications</h1>
        <p className="mt-1 text-[13px] text-ink-muted">New-order pings and critical SLA alerts</p>
      </div>

      <div className="overflow-hidden rounded-[14px] border border-[#E0E6E0] bg-[#F7FCF7] shadow-card">
        {sections.map((section, sectionIdx) => {
          const items = notifications.filter((n) => n.section === section.key)
          if (!items.length) return null

          return (
            <div key={section.key}>
              <div
                className={`px-5 pt-4 pb-2 ${
                  sectionIdx > 0 ? 'border-t border-[#EEF1EE]' : ''
                }`}
              >
                <p className="text-[11px] font-bold tracking-[0.06em] text-ink-faint uppercase">
                  {section.label}
                </p>
              </div>

              <div>
                {items.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    className={`flex w-full items-start gap-3 border-t border-[#EEF1EE] px-5 py-[14px] text-left transition-colors first:border-t-0 hover:bg-[#FAFBFA] ${
                      n.highlight ? 'bg-[#F4FAF5]' : 'bg-white'
                    }`}
                  >
                    <span
                      className="flex size-10 shrink-0 items-center justify-center rounded-full text-[18px]"
                      style={{ backgroundColor: n.iconBg }}
                      aria-hidden
                    >
                      {n.icon}
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-bold text-ink">{n.title}</p>
                      <p className="mt-1 text-[12.5px] leading-relaxed text-ink-muted">{n.body}</p>
                    </div>

                    <div className="flex w-[52px] shrink-0 flex-col items-end gap-1.5 pt-0.5">
                      <span className="text-[12px] font-medium text-ink-muted">{n.time}</span>
                      {n.unread ? (
                        <span className="size-2 rounded-full bg-[#3B82F6]" aria-label="Unread" />
                      ) : null}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
