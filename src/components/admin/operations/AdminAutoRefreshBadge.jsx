import { useEffect, useState } from 'react'
import { cn } from '../cn'

/**
 * Live auto-refresh indicator with countdown. Resets when `resetKey` changes (e.g. after fetch).
 */
export function AdminAutoRefreshBadge({
  intervalSeconds,
  resetKey,
  className,
}) {
  const seconds = Number(intervalSeconds)
  const enabled = Number.isFinite(seconds) && seconds >= 1
  const [left, setLeft] = useState(enabled ? seconds : 0)

  useEffect(() => {
    if (!enabled) {
      setLeft(0)
      return undefined
    }
    setLeft(seconds)
    const id = window.setInterval(() => {
      setLeft((prev) => (prev <= 1 ? seconds : prev - 1))
    }, 1000)
    return () => window.clearInterval(id)
  }, [enabled, seconds, resetKey])

  if (!enabled) return null

  return (
    <span
      className={cn(
        'rounded-full bg-[#e4f5e9] px-2.5 py-1 text-[10px] font-medium text-[#188248]',
        className,
      )}
    >
      ● auto-refresh {left}s
    </span>
  )
}
