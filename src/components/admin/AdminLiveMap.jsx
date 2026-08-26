import { useEffect, useMemo, useRef, useState } from 'react'
import { LocateFixed } from 'lucide-react'
import { cn } from './cn'
import { ADMIN_DASHBOARD_MAP_TABS } from '../../mappers/admin/mapAdminDashboardMap'
import { hasGoogleMapsApiKey, isPlottableLatLng, loadGoogleMapsApi } from '../../lib/googleMaps'

const DEFAULT_CENTER = { lat: 26.2285, lng: 50.586 }
const USER_LOCATION_ZOOM = 14

function matchesFocus(point, focusTarget) {
  if (!point || !focusTarget?.id) return false
  const id = String(focusTarget.id)
  const type = focusTarget.type

  if (type === 'order') {
    return String(point.orderId || '') === id || String(point.id || '').startsWith(`${id}-`)
  }
  if (type === 'vendor') {
    return point.kind === 'vendor' && String(point.id) === id
  }
  if (type === 'champ') {
    return point.kind === 'champ' && String(point.id) === id
  }
  return String(point.id) === id || String(point.orderId || '') === id
}

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

function focusTargetKey(focusTarget) {
  if (!focusTarget?.id) return null
  return `${focusTarget.type || 'any'}:${focusTarget.id}`
}

function buildInfoWindowHtml(point, fallbackLabel) {
  const title = point.orderNumber || point.name || fallbackLabel || 'Pin'
  return `<div style="font:12px/1.4 sans-serif;max-width:220px"><strong>${title}</strong><div>${buildPointTitle(point)}</div></div>`
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
  focusTarget = null,
  onFocusClear,
  onPointClick,
}) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef([])
  const userMarkerRef = useRef(null)
  const infoWindowRef = useRef(null)
  const infoWindowCloseListenerRef = useRef(null)
  const focusKeyRef = useRef(null)
  const keepInfoWindowOpenRef = useRef(false)
  const onFocusClearRef = useRef(onFocusClear)
  const [mapStatus, setMapStatus] = useState('loading')
  const [mapError, setMapError] = useState(null)
  const [locating, setLocating] = useState(false)
  const [locateError, setLocateError] = useState(null)

  onFocusClearRef.current = onFocusClear

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
            zoomControlOptions: {
              position: maps.ControlPosition.RIGHT_BOTTOM,
            },
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

  function ensureInfoWindow(maps) {
    if (!infoWindowRef.current) {
      infoWindowRef.current = new maps.InfoWindow()
    }
    if (!infoWindowCloseListenerRef.current) {
      infoWindowCloseListenerRef.current = infoWindowRef.current.addListener('closeclick', () => {
        keepInfoWindowOpenRef.current = false
        focusKeyRef.current = null
        onFocusClearRef.current?.()
      })
    }
    return infoWindowRef.current
  }

  function openInfoWindow(maps, map, marker, html) {
    const infoWindow = ensureInfoWindow(maps)
    infoWindow.setContent(html)
    keepInfoWindowOpenRef.current = true
    // Never steal keyboard focus from the topbar search (Maps defaults to focusing ✕).
    infoWindow.open({ map, anchor: marker, shouldFocus: false })
  }

  function closeInfoWindow() {
    keepInfoWindowOpenRef.current = false
    if (infoWindowRef.current) {
      infoWindowRef.current.close()
    }
  }

  useEffect(() => {
    if (mapStatus !== 'ready' || !mapInstanceRef.current || !window.google?.maps) {
      return undefined
    }

    const maps = window.google.maps
    const map = mapInstanceRef.current
    const clickListeners = []
    const nextFocusKey = focusTargetKey(focusTarget)
    const focusChanged = nextFocusKey !== focusKeyRef.current

    markersRef.current.forEach((marker) => marker.setMap(null))
    markersRef.current = []

    if (!plottable.length) {
      if (focusChanged || !nextFocusKey) {
        closeInfoWindow()
        focusKeyRef.current = nextFocusKey
      }
      if (!userMarkerRef.current && !focusTarget) {
        map.setCenter(DEFAULT_CENTER)
        map.setZoom(11)
      }
      return undefined
    }

    const bounds = new maps.LatLngBounds()
    let focusedMarker = null
    let focusedPoint = null

    plottable.forEach((point) => {
      const position = { lat: Number(point.lat), lng: Number(point.lng) }
      const size = point.kind === 'dropoff' ? 8 : 10
      const isFocus = matchesFocus(point, focusTarget)
      const marker = new maps.Marker({
        map,
        position,
        title: buildPointTitle(point),
        zIndex: isFocus ? 800 : undefined,
        icon: {
          path: maps.SymbolPath.CIRCLE,
          scale: isFocus ? 8 : size / 2,
          fillColor: point.color || '#737d77',
          fillOpacity: 1,
          strokeColor: isFocus ? '#17231c' : '#ffffff',
          strokeWeight: isFocus ? 2.5 : 1.5,
        },
      })

      const clickListener = marker.addListener('click', () => {
        onPointClick?.(point)
        openInfoWindow(maps, map, marker, buildInfoWindowHtml(point))
      })
      clickListeners.push(clickListener)

      if (isFocus && !focusedMarker) {
        focusedMarker = marker
        focusedPoint = point
      }

      markersRef.current.push(marker)
      bounds.extend(position)
    })

    if (nextFocusKey) {
      if (focusedMarker && focusedPoint) {
        if (focusChanged) {
          map.panTo({ lat: Number(focusedPoint.lat), lng: Number(focusedPoint.lng) })
          if (map.getZoom() < 14) map.setZoom(15)
          keepInfoWindowOpenRef.current = true
        }
        focusKeyRef.current = nextFocusKey

        // Re-anchor after marker rebuilds / open on new focus — never steal search focus.
        if (keepInfoWindowOpenRef.current) {
          openInfoWindow(
            maps,
            map,
            focusedMarker,
            buildInfoWindowHtml(focusedPoint, focusTarget?.label),
          )
        }
      } else if (focusChanged) {
        // Focused pin not on this layer yet — wait without jumping the camera.
        closeInfoWindow()
        focusKeyRef.current = nextFocusKey
      }

      return () => {
        clickListeners.forEach((listener) => maps.event.removeListener(listener))
      }
    }

    if (focusChanged || focusKeyRef.current) {
      closeInfoWindow()
    }
    const hadFocus = Boolean(focusKeyRef.current)
    focusKeyRef.current = null

    // Keep camera after dismissing a focused pin; only auto-fit for normal layer views.
    if (hadFocus) {
      return () => {
        clickListeners.forEach((listener) => maps.event.removeListener(listener))
      }
    }

    map.fitBounds(bounds, 40)
    const listener = maps.event.addListenerOnce(map, 'bounds_changed', () => {
      if (map.getZoom() > 14) map.setZoom(14)
      if (map.getZoom() < 10) map.setZoom(10)
    })

    return () => {
      maps.event.removeListener(listener)
      clickListeners.forEach((item) => maps.event.removeListener(item))
    }
  }, [mapStatus, pointsKey, plottable, focusTarget, onPointClick])

  useEffect(() => {
    return () => {
      if (infoWindowCloseListenerRef.current && window.google?.maps?.event) {
        window.google.maps.event.removeListener(infoWindowCloseListenerRef.current)
        infoWindowCloseListenerRef.current = null
      }
      if (infoWindowRef.current) {
        infoWindowRef.current.close()
        infoWindowRef.current = null
      }
      if (userMarkerRef.current) {
        userMarkerRef.current.setMap(null)
        userMarkerRef.current = null
      }
    }
  }, [])

  function goToCurrentLocation() {
    if (mapStatus !== 'ready' || !mapInstanceRef.current || !window.google?.maps) return
    if (!navigator?.geolocation) {
      setLocateError('Geolocation is not supported in this browser.')
      return
    }

    // Browsers only allow geolocation on secure contexts (https:// or localhost).
    const isSecure =
      typeof window !== 'undefined' &&
      (window.isSecureContext ||
        window.location.protocol === 'https:' ||
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1')

    if (!isSecure) {
      setLocateError(
        'Current location needs HTTPS (or localhost). Open the admin panel over https://, not http://.',
      )
      return
    }

    setLocateError(null)
    setLocating(true)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false)
        const maps = window.google.maps
        const map = mapInstanceRef.current
        if (!map) return

        const lat = position.coords.latitude
        const lng = position.coords.longitude
        const pos = { lat, lng }

        if (userMarkerRef.current) {
          userMarkerRef.current.setPosition(pos)
        } else {
          userMarkerRef.current = new maps.Marker({
            map,
            position: pos,
            title: 'Your current location',
            zIndex: 999,
            icon: {
              path: maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: '#1a73e8',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2.5,
            },
          })
        }

        map.panTo(pos)
        if (map.getZoom() < USER_LOCATION_ZOOM) {
          map.setZoom(USER_LOCATION_ZOOM)
        }
      },
      (err) => {
        setLocating(false)
        const msg = String(err?.message || '')
        if (/secure origins/i.test(msg)) {
          setLocateError(
            'Current location needs HTTPS (or localhost). Open the admin panel over https://, not http://.',
          )
          return
        }
        if (err?.code === 1) {
          setLocateError('Location permission denied. Allow location access in the browser.')
          return
        }
        setLocateError(msg || 'Unable to get current location.')
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    )
  }

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

        {mapStatus === 'ready' ? (
          <button
            type="button"
            onClick={goToCurrentLocation}
            disabled={locating}
            title="Current location"
            aria-label="Go to current location"
            className="absolute right-3 top-3 z-[5] inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#dfe4e0] bg-white text-[#17231c] shadow-sm hover:bg-[#f7f9f7] disabled:opacity-60"
          >
            <LocateFixed size={16} strokeWidth={2.2} className={locating ? 'animate-pulse' : ''} />
          </button>
        ) : null}

        {locateError ? (
          <div className="absolute right-3 top-14 z-[5] max-w-[220px] rounded-md border border-[#f0d4d2] bg-[#fdf6f5] px-2.5 py-1.5 text-[11px] font-medium text-[#d6453d] shadow-sm">
            {locateError}
          </div>
        ) : null}

        {locating ? (
          <div className="absolute bottom-2 right-3 z-[5] rounded-md bg-white/95 px-2.5 py-1.5 text-[11px] font-medium text-[#667269] shadow-sm">
            Getting current location…
          </div>
        ) : null}

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
