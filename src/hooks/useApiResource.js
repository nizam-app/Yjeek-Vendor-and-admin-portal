import { useCallback, useEffect, useState } from 'react'

export function useApiResource(loader, dependencies = []) {
  const [state, setState] = useState({
    data: null,
    meta: null,
    error: null,
    isLoading: true,
  })

  const load = useCallback(async () => {
    setState((current) => ({ ...current, error: null, isLoading: true }))
    try {
      const response = await loader()
      setState({ data: response.data, meta: response.meta, error: null, isLoading: false })
    } catch (error) {
      setState({ data: null, meta: null, error, isLoading: false })
    }
  }, dependencies)

  useEffect(() => {
    load()
  }, [load])

  return { ...state, refetch: load }
}
