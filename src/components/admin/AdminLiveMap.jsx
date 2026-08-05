import { useEffect, useMemo, useRef, useState } from 'react'
import { cn } from './cn'
import { ADMIN_DASHBOARD_MAP_TABS } from '../../mappers/admin/mapAdminDashboardMap'
import { hasGoogleMapsApiKey, isPlottableLatLng, loadGoogleMapsApi } from '../../lib/googleMaps'

const DEFAULT_CENTER = { lat: 26.2285, lng: 50.586 }

function buildPointTitle(point) {
  return [
    point.orderNumber || point.name,
    point.vendorName && point.vendorName !== point.name ? point.vendorName : null,
    point.area || null,
    point.kind === 'pickup' ? 'Pickup' : point.kind === 'dropoff' ? 'Dropoff' : null,
    point.status,
    point.load != null ? `load ${point.load}` : null,
  ]
    .filter(Boolean)
    .join(' · ')
}

/**
 * Admin Live map panel — Google Maps basemap + API layer markers.
 * Keeps existing tabs / legend / scope chrome.
 */
export function AdminLiveMap({
  layer,
  onLayerChange,
  legend = [],
  points = [],
  scopeNote,
  isLoading = false,
  error = null,
  onRetry,
}) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef([])
  const [mapStatus, setMapStatus] = useState('loading')
  const [mapError, setMapError] = useState(null)

  const plottable = useMemo(
    () =>
      (Array.isArray(points) ? points : []).filter((point) =>
        isPlottableLatLng(point.lat, point.lng),
      ),
    [points],
  )

  const pointsKey = useMemo(
    () =>
      JSON.stringify(
        plottable.map((point) => ({
          id: point.id,
          lat: point.lat,
          lng: point.lng,
          color: point.color,
          kind: point.kind,
        })),
      ),
    [plottable],
  )

  useEffect(() => {
    if (!hasGoogleMapsApiKey()) {
      setMapStatus('missing-key')
      return undefined
    }

    let cancelled = false

    loadGoogleMapsApi()
      .then((maps) => {
        if (cancelled || !mapRef.current) return
        if (!mapInstanceRef.current) {
          mapInstanceRef.current = new maps.Map(mapRef.current, {
            center: DEFAULT_CENTER,
            zoom: 11,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            zoomControl: true,
          })
        }
        setMapStatus('ready')
        setMapError(null)
      })
      .catch((err) => {
        if (cancelled) return
        setMapStatus('error')
        setMapError(err?.message || 'Failed to load Google Maps.')
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (mapStatus !== 'ready' || !mapInstanceRef.current || !window.google?.maps) {
      return undefined
    }

    const maps = window.google.maps
    const map = mapInstanceRef.current

    markersRef.current.forEach((marker) => marker.setMap(null))
    markersRef.current = []

    if (!plottable.length) {
      map.setCenter(DEFAULT_CENTER)
      map.setZoom(11)
      return undefined
    }

    const bounds = new maps.LatLngBounds()

    plottable.forEach((point) => {
      const position = { lat: Number(point.lat), lng: Number(point.lng) }
      const size = point.kind === 'dropoff' ? 8 : 10
      const marker = new maps.Marker({
        map,
        position,
        title: buildPointTitle(point),
        icon: {
          path: maps.SymbolPath.CIRCLE,
          scale: size / 2,
          fillColor: point.color || '#737d77',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 1.5,
        },
      })
      markersRef.current.push(marker)
      bounds.extend(position)
    })

    map.fitBounds(bounds, 40)
    const listener = maps.event.addListenerOnce(map, 'bounds_changed', () => {
      if (map.getZoom() > 14) map.setZoom(14)
      if (map.getZoom() < 10) map.setZoom(10)
    })

    return () => {
      maps.event.removeListener(listener)
    }
  }, [mapStatus, pointsKey, plottable])

  const showEmptyLayer =
    !isLoading &&
    !error &&
    !plottable.length &&
    mapStatus === 'ready'

  return (
    <section className="h-[407px] rounded-xl border border-[#e4e8e4] bg-white p-3 shadow-[0_1px_2px_rgba(20,40,28,.025)]">
      <div className="flex h-[20px] items-center justify-between">
        <h2 className="text-[16px] font-bold leading-4">Live map</h2>
        <div className="flex items-center gap-1 text-[11px] font-medium text-[#6f7a73]">
          {ADMIN_DASHBOARD_MAP_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onLayerChange?.(tab.id)}
              className={cn(
                'rounded px-2 py-1 transition',
                layer === tab.id ? 'bg-[#edf8f0] text-[#168247]' : 'hover:bg-[#f3f6f4]',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative mt-1 h-[347px] overflow-hidden rounded-lg bg-[#e9eeea]">
        <div ref={mapRef} className="absolute inset-0 h-full w-full" />

        {mapStatus === 'missing-key' ? (
          <div className="absolute inset-0 z-[3] grid place-items-center bg-[#e9eeea] px-4 text-center text-[12px] font-medium text-[#7a857e]">
            Set <code className="text-[11px]">VITE_GOOGLE_MAPS_API_KEY</code> to enable Google Maps.
          </div>
        ) : null}

        {mapStatus === 'error' ? (
          <div className="absolute inset-0 z-[3] grid place-items-center bg-[#fdebec] px-4 text-center text-[12px] font-medium text-[#d64044]">
            {mapError || 'Google Maps unavailable'}
          </div>
        ) : null}

        {mapStatus === 'loading' ? (
          <div className="absolute inset-0 z-[3] grid place-items-center bg-[#e9eeea]/90 text-[12px] font-medium text-[#7a857e]">
            Loading map…
          </div>
        ) : null}

        {isLoading && !plottable.length && mapStatus === 'ready' ? (
          <div className="absolute inset-0 z-[3] grid place-items-center bg-white/50 text-[12px] font-medium text-[#7a857e]">
            Loading map layer…
          </div>
        ) : null}

        {error && !plottable.length ? (
          <div className="absolute inset-0 z-[3] grid place-items-center bg-white/80 px-4 text-center text-[12px] font-medium text-[#a15b58]">
            <div>
              <p>Unable to load map layer.</p>
              {onRetry ? (
                <button
                  type="button"
                  onClick={onRetry}
                  className="mt-2 rounded-md border border-[#e0e5e1] bg-white px-2.5 py-1 text-[11px] text-[#536158] hover:bg-[#f6f7f6]"
                >
                  Try again
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        {showEmptyLayer ? (
          <div className="pointer-events-none absolute inset-x-0 top-3 z-[3] flex justify-center">
            <span className="rounded-md bg-white/95 px-2.5 py-1 text-[11px] font-medium text-[#8a938c] shadow-sm">
              {layer === 'zones' || layer === 'heatmap'
                ? 'This map layer is not connected yet.'
                : 'No map points for this layer.'}
            </span>
          </div>
        ) : null}

        {legend.length ? (
          <div className="absolute bottom-2 left-2 z-[4] flex flex-wrap items-center gap-2 rounded-md bg-white/95 px-2.5 py-1.5 text-[11px] font-medium text-[#667269] shadow-sm">
            {legend.map((item) => (
              <span key={item.key}>
                <i
                  className="mr-1 inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                {item.label}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <p className="mt-1 text-[10px] font-normal text-[#a1a8a3]">
        {scopeNote || 'Map scope auto-applies from your access (country / region / zone).'}
      </p>
    </section>
  )
}
