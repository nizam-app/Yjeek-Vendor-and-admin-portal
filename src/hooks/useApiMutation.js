import { useCallback, useRef, useState } from 'react'

/**
 * Shared mutation hook for create / update / delete / actions.
 *
 * @example
 * const { mutate, isLoading, error, reset } = useApiMutation(orderService.acceptOrder)
 * await mutate(orderId, payload)
 */
export function useApiMutation(mutationFn) {
  const [state, setState] = useState({
    data: null,
    meta: null,
    error: null,
    isLoading: false,
    isSuccess: false,
  })
  const requestIdRef = useRef(0)
  const mutationRef = useRef(mutationFn)
  mutationRef.current = mutationFn

  const reset = useCallback(() => {
    requestIdRef.current += 1
    setState({
      data: null,
      meta: null,
      error: null,
      isLoading: false,
      isSuccess: false,
    })
  }, [])

  const mutate = useCallback(async (...args) => {
    const requestId = ++requestIdRef.current
    setState((current) => ({
      ...current,
      error: null,
      isLoading: true,
      isSuccess: false,
    }))

    try {
      const response = await mutationRef.current(...args)
      if (requestId !== requestIdRef.current) return undefined

      const next = {
        data: response?.data ?? response ?? null,
        meta: response?.meta ?? null,
        error: null,
        isLoading: false,
        isSuccess: true,
      }
      setState(next)
      return next
    } catch (error) {
      if (requestId !== requestIdRef.current) return undefined
      if (error?.name === 'AbortError') {
        setState((current) => ({ ...current, isLoading: false }))
        throw error
      }
      setState({
        data: null,
        meta: null,
        error,
        isLoading: false,
        isSuccess: false,
      })
      throw error
    }
  }, [])

  return {
    ...state,
    mutate,
    reset,
  }
}
