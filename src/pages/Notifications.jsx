import { PageHeader } from '../components/ui'
import { notifications } from '../data/mockData'

export default function Notifications() {
  return (
    <div className="pt-[26px] px-[28px] pb-10">
      <PageHeader title="Notifications" subtitle="Alerts from orders, branches and campaigns" />

      <div className="bg-white border border-border rounded-lg shadow-card overflow-hidden py-[18px] px-5">
        {notifications.map((n) => (
          <div key={n.title + n.time} className="flex gap-3 py-[14px] border-b border-border last:border-b-0">
            <div
              className="w-[10px] h-[10px] rounded-full bg-green-primary mt-[5px] shrink-0"
              style={{ opacity: n.unread ? 1 : 0.25 }}
            />
            <div style={{ flex: 1 }}>
              <strong className="block text-sm mb-1">{n.title}</strong>
              <p className="text-[13px] text-ink-muted">{n.body}</p>
            </div>
            <span className="text-ink-muted text-[13px] font-semibold">{n.time}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
