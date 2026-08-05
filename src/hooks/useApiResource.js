import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Shared read-resource hook.
 * Public API remains: { data, meta, error, isLoading, refetch }
 *
 * @param {() => Promise<{ data?: unknown, meta?: unknown }>} loader
 * @param {unknown[]} [dependencies]
 */
export function useApiResource(loader, dependencies = []) {
  const [state, setState] = useState({
    data: null,
    meta: null,
    error: null,
    isLoading: true,
  })
  const requestIdRef = useRef(0)
  const loaderRef = useRef(loader)
  loaderRef.current = loader

  const load = useCallback(async () => {
    const requestId = ++requestIdRef.current
    setState((current) => ({ ...current, error: null, isLoading: true }))

    try {
      const response = await loaderRef.current()
      if (requestId !== requestIdRef.current) return

      setState((current) => ({
        ...current,
        data: response?.data ?? null,
        meta: response?.meta ?? null,
        error: null,
        isLoading: false,
      }))
    } catch (error) {
      if (requestId !== requestIdRef.current) return
      if (error?.name === 'AbortError') {
        setState((current) => ({ ...current, isLoading: false }))
        return
      }
      // Keep previous data on refresh failure so the board does not flash empty.
      setState((current) => ({
        ...current,
        error,
        isLoading: false,
      }))
    }
  }, dependencies)

  useEffect(() => {
    load()
    return () => {
      requestIdRef.current += 1
    }
  }, [load])

  const setData = useCallback((updater) => {
    setState((current) => ({
      ...current,
      data: typeof updater === 'function' ? updater(current.data) : updater,
    }))
  }, [])

  return {
    ...state,
    refetch: load,
    setData,
  }
}
