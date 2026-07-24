import { useMemo, useState } from 'react'
import { useApiMutation } from '../../hooks/useApiMutation'
import { useVendorNotifications } from '../../hooks/vendor/useVendorNotifications'
import { notificationService } from '../../services/vendor/notificationService'

const sections = [
  { key: 'today', label: 'TODAY' },
  { key: 'earlier', label: 'EARLIER' },
]

export default function Notifications() {
  const { data: notifications, error, isLoading, refetch, setData } = useVendorNotifications()
  const { mutate: markRead } = useApiMutation((id) => notificationService.markRead(id))
  const { mutate: markAllRead, isLoading: isMarkingAll } = useApiMutation(() =>
    notificationService.markAllRead(),
  )
  const [pendingId, setPendingId] = useState(null)

  const items = useMemo(
    () => (Array.isArray(notifications) ? notifications : []),
    [notifications],
  )
  const unreadCount = items.filter((n) => n.unread).length

  async function handleMarkAllRead() {
    if (!unreadCount || isMarkingAll) return
    const previous = items
    setData(previous.map((n) => ({ ...n, unread: false, highlight: false, isRead: true })))
    try {
      await markAllRead()
    } catch {
      setData(previous)
    }
  }

  async function handleNotificationClick(notification) {
    if (!notification?.id || !notification.unread || pendingId) return

    const previous = items
    setPendingId(notification.id)
    setData(
      previous.map((n) =>
        n.id === notification.id ? { ...n, unread: false, highlight: false, isRead: true } : n,
      ),
    )

    try {
      await markRead(notification.id)
    } catch {
      setData(previous)
    } finally {
      setPendingId(null)
    }
  }

  if (isLoading && items.length === 0) {
    return <div className="p-7 text-[13px] text-ink-muted">Loading notifications…</div>
  }
  if (error && items.length === 0) {
    return (
      <div className="p-7 text-[13px] text-danger">
        Unable to load notifications.{' '}
        <button type="button" onClick={refetch} className="underline">
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="px-[28px] pt-[26px] pb-10">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[20px] font-bold tracking-[-0.02em] text-ink">Notifications</h1>
          <p className="mt-1 text-[13px] text-ink-muted">New-order pings and critical SLA alerts</p>
        </div>
        {unreadCount > 0 ? (
          <button
            type="button"
            disabled={isMarkingAll}
            onClick={handleMarkAllRead}
            className="shrink-0 rounded-md border border-border bg-white px-3 py-2 text-[12px] font-medium text-ink hover:bg-[#f7f9f7] disabled:opacity-60"
          >
            Mark all read
          </button>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-[14px] border border-[#E0E6E0] bg-[#F7FCF7] shadow-card">
        {items.length === 0 ? (
          <div className="bg-white px-5 py-10 text-center text-[13px] text-ink-muted">
            No notifications yet.
          </div>
        ) : null}

        {sections.map((section, sectionIdx) => {
          const sectionItems = items.filter((n) => n.section === section.key)
          if (!sectionItems.length) return null

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
                {sectionItems.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    disabled={pendingId === n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`flex w-full items-start gap-3 border-t border-[#EEF1EE] px-5 py-[14px] text-left transition-colors first:border-t-0 hover:bg-[#FAFBFA] disabled:opacity-70 ${
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
