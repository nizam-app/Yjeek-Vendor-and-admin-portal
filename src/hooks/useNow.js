import { useEffect, useState } from 'react'

/** Returns a Date.now() value that updates on an interval while enabled. */
export function useNow(enabled = true, intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!enabled) return undefined
    setNow(Date.now())
    const id = window.setInterval(() => setNow(Date.now()), intervalMs)
    return () => window.clearInterval(id)
  }, [enabled, intervalMs])

  return now
}
