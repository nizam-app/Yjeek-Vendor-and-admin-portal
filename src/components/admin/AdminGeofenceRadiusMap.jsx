import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Map } from 'lucide-react'
import { hasGoogleMapsApiKey, isPlottableLatLng, loadGoogleMapsApi } from '../../lib/googleMaps'

const DEFAULT_CENTER = { lat: 26.2285, lng: 50.586 }

/**
 * Live geofence preview — pin(s) + green circle(s) that track lat/lng/radius.
 * Pass `locations` for multi-vendor; single `latitude`/`longitude` still works.
 * Click or drag the pin to override coordinates when `onCenterChange` is set (single pin only).
 */
export default function AdminGeofenceRadiusMap({
  latitude,
  longitude,
  locations,
  radiusMeters = 500,
  label = 'Geofence',
  onCenterChange,
  emptyHint = 'Select a vendor or set coordinates to preview the fence.',
  heightClassName = 'h-[340px] max-[700px]:h-[280px]',
  className = '',
}) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef([])
  const circlesRef = useRef([])
  const mapsApiRef = useRef(null)
  const onCenterChangeRef = useRef(onCenterChange)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState(null)

  useEffect(() => {
    onCenterChangeRef.current = onCenterChange
  }, [onCenterChange])

  const pins = useMemo(() => {
    if (Array.isArray(locations) && locations.length > 0) {
      return locations
        .filter((loc) => isPlottableLatLng(loc?.latitude, loc?.longitude))
        .map((loc, index) => ({
          lat: Number(loc.latitude),
          lng: Number(loc.longitude),
          label: String(loc.label || loc.name || `Vendor ${index + 1}`),
        }))
    }
    if (isPlottableLatLng(latitude, longitude)) {
      return [{ lat: Number(latitude), lng: Number(longitude), label }]
    }
    return []
  }, [locations, latitude, longitude, label])

  const hasCenter = pins.length > 0
  const center = pins[0] ? { lat: pins[0].lat, lng: pins[0].lng } : null
  const canDrag = Boolean(onCenterChange) && pins.length === 1

  const radius = useMemo(() => {
    const n = Number(radiusMeters)
    if (!Number.isFinite(n) || n < 50) return 50
    if (n > 5000) return 5000
    return n
  }, [radiusMeters])

  const emitCenter = useCallback((lat, lng) => {
    onCenterChangeRef.current?.({
      latitude: String(Number(Number(lat).toFixed(6))),
      longitude: String(Number(Number(lng).toFixed(6))),
    })
  }, [])

  const clearOverlays = useCallback(() => {
    markersRef.current.forEach((marker) => marker.setMap(null))
    circlesRef.current.forEach((circle) => circle.setMap(null))
    markersRef.current = []
    circlesRef.current = []
  }, [])

  useEffect(() => {
    if (!hasGoogleMapsApiKey()) {
      setStatus('missing-key')
      return undefined
    }

    let cancelled = false

    loadGoogleMapsApi()
      .then((maps) => {
        if (cancelled || !mapRef.current) return
        mapsApiRef.current = maps
        if (!mapInstanceRef.current) {
          const map = new maps.Map(mapRef.current, {
            center: DEFAULT_CENTER,
            zoom: 13,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true,
            zoomControl: true,
          })
          map.addListener('click', (event) => {
            if (!onCenterChangeRef.current || !event?.latLng) return
            // Multi-vendor preview is read-only; only allow click-to-move for single pin.
            if (markersRef.current.length > 1) return
            emitCenter(event.latLng.lat(), event.latLng.lng())
          })
          mapInstanceRef.current = map
        }
        setStatus('ready')
        setError(null)
      })
      .catch((err) => {
        if (cancelled) return
        setStatus('error')
        setError(err?.message || 'Failed to load Google Maps.')
      })

    return () => {
      cancelled = true
    }
  }, [emitCenter])

  useEffect(() => {
    if (status !== 'ready' || !mapInstanceRef.current || !mapsApiRef.current) return undefined

    const maps = mapsApiRef.current
    const map = mapInstanceRef.current

    clearOverlays()

    if (!pins.length) {
      map.setCenter(DEFAULT_CENTER)
      map.setZoom(12)
      return undefined
    }

    const bounds = new maps.LatLngBounds()

    pins.forEach((pin) => {
      const position = { lat: pin.lat, lng: pin.lng }
      const marker = new maps.Marker({
        map,
        position,
        draggable: canDrag,
        title: pin.label,
      })
      if (canDrag) {
        marker.addListener('dragend', () => {
          const pos = marker.getPosition()
          if (!pos) return
          emitCenter(pos.lat(), pos.lng())
        })
      }
      markersRef.current.push(marker)

      const circle = new maps.Circle({
        map,
        center: position,
        radius,
        strokeColor: '#1aa054',
        strokeOpacity: 1,
        strokeWeight: 2,
        fillColor: '#1aa054',
        fillOpacity: 0.18,
        clickable: false,
      })
      circlesRef.current.push(circle)

      const circleBounds = circle.getBounds()
      if (circleBounds) {
        bounds.union(circleBounds)
      } else {
        bounds.extend(position)
      }
    })

    let listener = null
    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, pins.length > 1 ? 48 : 40)
      listener = maps.event.addListenerOnce(map, 'bounds_changed', () => {
        const zoom = map.getZoom()
        // Single fence: don't over-zoom. Multi: allow wider view to fit all.
        const maxZoom = pins.length > 1 ? 15 : 16
        if (zoom != null && zoom > maxZoom) map.setZoom(maxZoom)
      })
    } else if (center) {
      map.panTo(center)
    }

    return () => {
      if (listener) maps.event.removeListener(listener)
    }
  }, [status, pins, radius, canDrag, center, emitCenter, clearOverlays])

  const footerText = (() => {
    if (!hasCenter) return 'Waiting for vendor location'
    if (pins.length > 1) {
      return `${pins.length} vendors · ${Math.round(radius)} m radius each`
    }
    if (onCenterChange) {
      return `${Math.round(radius)} m radius · drag pin or click map to move`
    }
    return `${Math.round(radius)} m radius around vendor location`
  })()

  if (status === 'missing-key') {
    return (
      <div
        className={`flex min-h-[320px] flex-col items-center justify-center rounded-[12px] border border-dashed border-[#dfe4e0] bg-[#fafbfa] px-6 py-10 text-center ${className}`}
      >
        <Map size={28} className="mb-2 text-[#b0b8b2]" strokeWidth={1.6} />
        <p className="text-[13px] font-medium text-[#7c8780]">Live geofence map</p>
        <p className="mt-2 text-[12px] text-[#9aa49d]">
          Set <code className="text-[11px]">VITE_GOOGLE_MAPS_API_KEY</code> to enable the map.
        </p>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div
        className={`flex min-h-[320px] flex-col items-center justify-center rounded-[12px] border border-dashed border-[#f5c6c4] bg-[#fdebec] px-6 py-10 text-center ${className}`}
      >
        <Map size={28} className="mb-2 text-[#d64044]" strokeWidth={1.6} />
        <p className="text-[13px] font-medium text-[#d64044]">{error || 'Map unavailable'}</p>
      </div>
    )
  }

  return (
    <div className={`overflow-hidden rounded-[12px] border border-[#dfe4e0] bg-white ${className}`}>
      <div className="relative">
        <div ref={mapRef} className={`w-full bg-[#f3f5f3] ${heightClassName}`} />
        {!hasCenter && status === 'ready' ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[rgba(250,251,250,0.72)] px-6 text-center">
            <div>
              <Map size={26} className="mx-auto mb-2 text-[#b0b8b2]" strokeWidth={1.6} />
              <p className="text-[13px] font-medium text-[#7c8780]">{emptyHint}</p>
            </div>
          </div>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#edf0ee] bg-[#fafbfa] px-4 py-2.5">
        <p className="text-[12px] text-[#7c8780]">{footerText}</p>
        {status === 'loading' ? <p className="text-[12px] text-[#9aa49d]">Loading map…</p> : null}
      </div>
    </div>
  )
}
