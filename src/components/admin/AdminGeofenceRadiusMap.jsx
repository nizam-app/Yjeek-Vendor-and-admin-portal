import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Map } from 'lucide-react'
import { hasGoogleMapsApiKey, isPlottableLatLng, loadGoogleMapsApi } from '../../lib/googleMaps'

const DEFAULT_CENTER = { lat: 26.2285, lng: 50.586 }

/**
 * Live geofence preview — pin + green circle that tracks lat/lng/radius.
 * Click or drag the pin to override coordinates.
 */
export default function AdminGeofenceRadiusMap({
  latitude,
  longitude,
  radiusMeters = 500,
  label = 'Geofence',
  onCenterChange,
  emptyHint = 'Select a vendor or set coordinates to preview the fence.',
  heightClassName = 'h-[340px] max-[700px]:h-[280px]',
  className = '',
}) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markerRef = useRef(null)
  const circleRef = useRef(null)
  const mapsApiRef = useRef(null)
  const onCenterChangeRef = useRef(onCenterChange)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState(null)

  useEffect(() => {
    onCenterChangeRef.current = onCenterChange
  }, [onCenterChange])

  const hasCenter = isPlottableLatLng(latitude, longitude)
  const center = useMemo(() => {
    if (!hasCenter) return null
    return { lat: Number(latitude), lng: Number(longitude) }
  }, [hasCenter, latitude, longitude])

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

    if (!center) {
      markerRef.current?.setMap(null)
      circleRef.current?.setMap(null)
      markerRef.current = null
      circleRef.current = null
      map.setCenter(DEFAULT_CENTER)
      map.setZoom(12)
      return undefined
    }

    if (!markerRef.current) {
      const marker = new maps.Marker({
        map,
        position: center,
        draggable: Boolean(onCenterChangeRef.current),
        title: label,
      })
      marker.addListener('dragend', () => {
        const pos = marker.getPosition()
        if (!pos) return
        emitCenter(pos.lat(), pos.lng())
      })
      markerRef.current = marker
    } else {
      markerRef.current.setPosition(center)
      markerRef.current.setMap(map)
      markerRef.current.setDraggable(Boolean(onCenterChangeRef.current))
      markerRef.current.setTitle(label)
    }

    if (!circleRef.current) {
      circleRef.current = new maps.Circle({
        map,
        center,
        radius,
        strokeColor: '#1aa054',
        strokeOpacity: 1,
        strokeWeight: 2,
        fillColor: '#1aa054',
        fillOpacity: 0.18,
        clickable: false,
      })
    } else {
      circleRef.current.setCenter(center)
      circleRef.current.setRadius(radius)
      circleRef.current.setMap(map)
    }

    const bounds = circleRef.current.getBounds()
    let listener = null
    if (bounds) {
      map.fitBounds(bounds, 40)
      listener = maps.event.addListenerOnce(map, 'bounds_changed', () => {
        const zoom = map.getZoom()
        if (zoom != null && zoom > 16) map.setZoom(16)
      })
    } else {
      map.panTo(center)
    }

    return () => {
      if (listener) maps.event.removeListener(listener)
    }
  }, [status, center, radius, label, emitCenter])

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
        <p className="text-[12px] text-[#7c8780]">
          {hasCenter
            ? onCenterChange
              ? `${Math.round(radius)} m radius · drag pin or click map to move`
              : `${Math.round(radius)} m radius around vendor location`
            : 'Waiting for vendor location'}
        </p>
        {status === 'loading' ? <p className="text-[12px] text-[#9aa49d]">Loading map…</p> : null}
      </div>
    </div>
  )
}
