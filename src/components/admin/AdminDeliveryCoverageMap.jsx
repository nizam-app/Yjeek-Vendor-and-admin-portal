import { useEffect, useMemo, useRef, useState } from 'react'
import { Map } from 'lucide-react'
import { hasGoogleMapsApiKey, isPlottableLatLng, loadGoogleMapsApi } from '../../lib/googleMaps'

const DEFAULT_CENTER = { lat: 26.2285, lng: 50.586 }

function normalizeCoverage(coverage) {
  const circles = Array.isArray(coverage?.circles) ? coverage.circles : []
  const plottable = circles
    .filter((c) => isPlottableLatLng(c.latitude, c.longitude))
    .map((c) => ({
      name: String(c.name || 'Branch'),
      latitude: Number(c.latitude),
      longitude: Number(c.longitude),
      radiusKm: (() => {
        const n = Number(c.radiusKm)
        return !Number.isNaN(n) && n > 0 ? n : 5
      })(),
    }))
  const center =
    coverage?.center && isPlottableLatLng(coverage.center.latitude, coverage.center.longitude)
      ? {
          latitude: Number(coverage.center.latitude),
          longitude: Number(coverage.center.longitude),
        }
      : plottable[0]
        ? { latitude: plottable[0].latitude, longitude: plottable[0].longitude }
        : null
  return {
    center,
    plottable,
    skipped: circles.length - plottable.length,
  }
}

/**
 * Coverage map — one pin + one green circle per plottable coverage entry.
 * Buyer/Figma: Branch pin ← pinned location; green circle ← delivery radius; live updates.
 */
export default function AdminDeliveryCoverageMap({
  coverage,
  emptyLabel = 'Branch delivery radius & coverage',
}) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const overlaysRef = useRef([])
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState(null)

  const normalized = useMemo(() => normalizeCoverage(coverage), [coverage])
  const overlayKey = useMemo(
    () =>
      JSON.stringify({
        center: normalized.center,
        plottable: normalized.plottable,
      }),
    [normalized],
  )

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
    if (status !== 'ready' || !mapInstanceRef.current || !window.google?.maps) return undefined

    const maps = window.google.maps
    const map = mapInstanceRef.current
    const { center, plottable } = normalized

    const clearOverlays = () => {
      overlaysRef.current.forEach((item) => {
        item.setMap?.(null)
      })
      overlaysRef.current = []
    }

    clearOverlays()

    const bounds = new maps.LatLngBounds()
    let hasPoint = false

    if (center) {
      const centerLatLng = { lat: center.latitude, lng: center.longitude }
      map.setCenter(centerLatLng)
      bounds.extend(centerLatLng)
      hasPoint = true
    }

    plottable.forEach((circle) => {
      const position = { lat: circle.latitude, lng: circle.longitude }
      const radiusMeters = circle.radiusKm * 1000

      const marker = new maps.Marker({
        map,
        position,
        title: circle.name,
      })

      const zone = new maps.Circle({
        map,
        center: position,
        radius: radiusMeters,
        strokeColor: '#1aa054',
        strokeOpacity: 1,
        strokeWeight: 2,
        fillColor: '#1aa054',
        fillOpacity: 0.15,
        clickable: false,
      })

      overlaysRef.current.push(marker, zone)
      bounds.extend(position)
      const zoneBounds = zone.getBounds()
      if (zoneBounds) bounds.union(zoneBounds)
      hasPoint = true
    })

    let listener = null
    if (hasPoint) {
      map.fitBounds(bounds, 48)
      listener = maps.event.addListenerOnce(map, 'bounds_changed', () => {
        if (map.getZoom() > 14) map.setZoom(14)
      })
    }

    return () => {
      if (listener) maps.event.removeListener(listener)
      clearOverlays()
    }
  }, [status, overlayKey, normalized])

  if (status === 'missing-key') {
    return (
      <div className="flex min-h-[280px] flex-col items-center justify-center rounded-[12px] border border-dashed border-[#dfe4e0] bg-[#fafbfa] px-6 py-10 text-center">
        <Map size={28} className="mb-2 text-[#b0b8b2]" strokeWidth={1.6} />
        <p className="text-[13px] font-medium text-[#7c8780]">{emptyLabel}</p>
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

  const { plottable, skipped } = normalized

  return (
    <div className="overflow-hidden rounded-[12px] border border-[#dfe4e0]">
      <div ref={mapRef} className="h-[320px] w-full bg-[#f3f5f3]" />
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#edf0ee] bg-[#fafbfa] px-4 py-2.5">
        <p className="text-[12px] text-[#7c8780]">
          {plottable.length === 0
            ? 'Pin a location and set delivery radius to preview coverage'
            : `${plottable.length} coverage circle${plottable.length === 1 ? '' : 's'} (branch delivery radius)`}
          {skipped > 0 ? ` · ${skipped} skipped (missing coordinates)` : ''}
        </p>
        {status === 'loading' ? (
          <p className="text-[12px] text-[#9aa49d]">Loading map…</p>
        ) : null}
      </div>
    </div>
  )
}
