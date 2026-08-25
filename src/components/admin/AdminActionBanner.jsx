import { useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from './cn'

const TONES = {
  success: 'border-[#b7e4c7] bg-[#f0faf4] text-[#147940]',
  error: 'border-[#f0c9c6] bg-[#fff5f4] text-[#b42318]',
  info: 'border-[#dbeafe] bg-[#eff6ff] text-[#1d4ed8]',
}

export default function AdminActionBanner({
  tone = 'success',
  children,
  onDismiss,
  autoDismissMs = 0,
  className = '',
}) {
  useEffect(() => {
    if (!autoDismissMs || !onDismiss) return undefined
    const timer = window.setTimeout(onDismiss, autoDismissMs)
    return () => window.clearTimeout(timer)
  }, [autoDismissMs, onDismiss, children])

  if (!children) return null

  return (
    <div
      className={cn(
        'mb-4 flex items-start justify-between gap-3 rounded-[12px] border px-4 py-3 text-[13px]',
        TONES[tone] || TONES.success,
        className,
      )}
      role="status"
    >
      <div className="min-w-0 flex-1">{children}</div>
      {onDismiss ? (
        <button
          type="button"
          aria-label="Dismiss"
          onClick={onDismiss}
          className="grid h-6 w-6 shrink-0 place-items-center rounded-full opacity-70 hover:opacity-100"
        >
          <X size={14} />
        </button>
      ) : null}
    </div>
  )
}
