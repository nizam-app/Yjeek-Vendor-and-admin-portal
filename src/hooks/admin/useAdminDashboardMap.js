import { useEffect, useState } from 'react'
import { useApiResource } from '../useApiResource'
import { apiConfig, isAdminRealApiFeature } from '../../api/config'
import { adminDashboardService } from '../../services/admin/dashboardService'
import {
  ADMIN_DASHBOARD_MAP_API_LAYERS,
  emptyAdminDashboardMap,
} from '../../mappers/admin/mapAdminDashboardMap'
import { adminDashboardMock } from '../../mocks/admin.mock'

function mapMockShellToLayer(layer) {
  const shell = adminDashboardMock.map
  return {
    layer,
    legend: Array.isArray(shell.legend)
      ? shell.legend.map((item, index) => ({
          key: `mock-${index}`,
          label: item.label,
          color: item.color,
        }))
      : [],
    points: [],
    scopeNote: shell.scopeNote,
  }
}

/**
 * Admin Live map hook.
 * Page → useAdminDashboardMap → adminDashboardService.getMap → mapper → apiClient
 *
 * Mock map chrome is used only when VITE_ADMIN_USE_MOCK_API=true and dashboard
 * is not in VITE_ADMIN_REAL_API_FEATURES. Otherwise missing layers stay empty.
 *
 * @param {{ region?: string, refreshSeconds?: number|null }} [options]
 */
export function useAdminDashboardMap(options = {}) {
  const region = options.region || 'BH'
  const refreshSeconds = options.refreshSeconds
  const useRealMap = isAdminRealApiFeature('dashboard')
  const useMockShell = !useRealMap && apiConfig.adminUseMockApi
  const [layer, setLayer] = useState('champs')

  const resource = useApiResource(() => {
    if (useMockShell) {
      return Promise.resolve({ data: mapMockShellToLayer(layer), meta: null })
    }

    if (!useRealMap || !ADMIN_DASHBOARD_MAP_API_LAYERS.includes(layer)) {
      return Promise.resolve({ data: emptyAdminDashboardMap(layer), meta: null })
    }

    return adminDashboardService.getMap({ region, layer })
  }, [region, layer, useRealMap, useMockShell])

  useEffect(() => {
    if (!useRealMap) return undefined
    if (!refreshSeconds || Number(refreshSeconds) < 1) return undefined
    if (!ADMIN_DASHBOARD_MAP_API_LAYERS.includes(layer)) return undefined

    const intervalId = window.setInterval(() => {
      resource.refetch()
    }, Number(refreshSeconds) * 1000)

    return () => window.clearInterval(intervalId)
  }, [useRealMap, refreshSeconds, layer, resource.refetch])

  return {
    ...resource,
    layer,
    setLayer,
    useRealMap,
  }
}
