import { useEffect, useRef } from 'react'

/**
 * setInterval that skips ticks while the document is hidden.
 * On tab focus, runs once immediately so data catches up without changing
 * visible-tab behavior.
 *
 * @param {() => void} callback
 * @param {number|null|undefined} delayMs
 * @param {boolean} [enabled=true]
 */
export function useIntervalWhenVisible(callback, delayMs, enabled = true) {
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useEffect(() => {
    if (!enabled || delayMs == null || Number(delayMs) < 1) return undefined

    const run = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        return
      }
      callbackRef.current()
    }

    const intervalId = window.setInterval(run, Number(delayMs))

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        callbackRef.current()
      }
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      window.clearInterval(intervalId)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [delayMs, enabled])
}
