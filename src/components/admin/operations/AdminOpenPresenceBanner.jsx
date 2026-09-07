import { formatOpenDuration } from '../../../lib/adminIncidentPresentation'

/**
 * Yellow "Open by …" strip shown in order / incident detail modals.
 */
export function AdminOpenPresenceBanner({ viewers = [], className = '' }) {
  const list = Array.isArray(viewers) ? viewers.filter((row) => row?.displayName || row?.userId) : []
  if (!list.length) return null

  return (
    <div
      className={
        className ||
        'mt-3 flex items-start gap-2 rounded-[7px] border border-[#ecd9ac] bg-[#fdf6e7] px-3 py-2 text-[12px] text-[#7a5f1d]'
      }
    >
      <span aria-hidden>👤</span>
      <div className="min-w-0 space-y-0.5">
        {list.map((viewer) => {
          const duration = formatOpenDuration(viewer.openForMs)
          const name = viewer.displayName || 'Dispatcher'
          return (
            <p key={viewer.userId || name}>
              <b>Open by {name}</b>
              {duration ? ` — for ${duration}` : ''}. Opening actions here will be visible to them.
            </p>
          )
        })}
      </div>
    </div>
  )
}
