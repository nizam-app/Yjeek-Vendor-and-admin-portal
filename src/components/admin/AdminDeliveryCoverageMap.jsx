import { useEffect, useRef, useState } from 'react'
import { Map } from 'lucide-react'
import { hasGoogleMapsApiKey, isPlottableLatLng, loadGoogleMapsApi } from '../../lib/googleMaps'

const DEFAULT_CENTER = { lat: 26.2285, lng: 50.586 }

/**
 * Coverage map for Delivery zones — draws branch radius circles from API `coverage`.
 */
export default function AdminDeliveryCoverageMap({ coverage }) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const overlaysRef = useRef([])
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState(null)

  const circles = Array.isArray(coverage?.circles) ? coverage.circles : []
  const plottable = circles.filter((c) => isPlottableLatLng(c.latitude, c.longitude))
  const skipped = circles.length - plottable.length

  useEffect(() => {
    if (!hasGoogleMapsApiKey()) {
      setStatus('missing-key')
      return undefined
    }

    let cancelled = false

    loadGoogleMapsApi()
      .then((maps) => {
        if (cancelled || !mapRef.current) return
        if (!mapInstanceRef.current) {
          mapInstanceRef.current = new maps.Map(mapRef.current, {
            center: DEFAULT_CENTER,
            zoom: 12,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true,
            zoomControl: true,
          })
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
  }, [])

  useEffect(() => {
    if (status !== 'ready' || !mapInstanceRef.current || !window.google?.maps) return

    const maps = window.google.maps
    const map = mapInstanceRef.current

    overlaysRef.current.forEach((item) => {
      item.setMap?.(null)
    })
    overlaysRef.current = []

    const bounds = new maps.LatLngBounds()
    let hasPoint = false

    const center = coverage?.center
    if (isPlottableLatLng(center?.latitude, center?.longitude)) {
      const centerLatLng = {
        lat: Number(center.latitude),
        lng: Number(center.longitude),
      }
      map.setCenter(centerLatLng)
      bounds.extend(centerLatLng)
      hasPoint = true
    }

    plottable.forEach((circle) => {
      const position = {
        lat: Number(circle.latitude),
        lng: Number(circle.longitude),
      }
      const radiusKm = Number(circle.radiusKm)
      const radiusMeters =
        !Number.isNaN(radiusKm) && radiusKm > 0 ? radiusKm * 1000 : 5000

      const marker = new maps.Marker({
        map,
        position,
        title: circle.name || 'Branch',
      })

      const zone = new maps.Circle({
        map,
        center: position,
        radius: radiusMeters,
        strokeColor: '#1aa054',
        strokeOpacity: 0.9,
        strokeWeight: 2,
        fillColor: '#1aa054',
        fillOpacity: 0.12,
      })

      overlaysRef.current.push(marker, zone)
      bounds.extend(position)
      bounds.union(zone.getBounds())
      hasPoint = true
    })

    if (hasPoint) {
      map.fitBounds(bounds, 48)
      const listener = maps.event.addListenerOnce(map, 'bounds_changed', () => {
        if (map.getZoom() > 14) map.setZoom(14)
      })
      return () => {
        maps.event.removeListener(listener)
      }
    }

    return undefined
  }, [status, coverage, plottable])

  if (status === 'missing-key') {
    return (
      <div className="flex min-h-[280px] flex-col items-center justify-center rounded-[12px] border border-dashed border-[#dfe4e0] bg-[#fafbfa] px-6 py-10 text-center">
        <Map size={28} className="mb-2 text-[#b0b8b2]" strokeWidth={1.6} />
        <p className="text-[13px] font-medium text-[#7c8780]">Delivery radius &amp; zones map</p>
        <p className="mt-2 text-[12px] text-[#9aa49d]">
          Set <code className="text-[11px]">VITE_GOOGLE_MAPS_API_KEY</code> to enable the map.
        </p>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="flex min-h-[280px] flex-col items-center justify-center rounded-[12px] border border-dashed border-[#f5c6c4] bg-[#fdebec] px-6 py-10 text-center">
        <Map size={28} className="mb-2 text-[#d64044]" strokeWidth={1.6} />
        <p className="text-[13px] font-medium text-[#d64044]">{error || 'Map unavailable'}</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-[12px] border border-[#dfe4e0]">
      <div ref={mapRef} className="h-[320px] w-full bg-[#f3f5f3]" />
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#edf0ee] bg-[#fafbfa] px-4 py-2.5">
        <p className="text-[12px] text-[#7c8780]">
          {plottable.length} coverage circle{plottable.length === 1 ? '' : 's'}
          {skipped > 0 ? ` · ${skipped} skipped (missing coordinates)` : ''}
        </p>
        {status === 'loading' ? (
          <p className="text-[12px] text-[#9aa49d]">Loading map…</p>
        ) : null}
      </div>
    </div>
  )
}
