import { useEffect, useRef, useState } from 'react'
import { MapPin } from 'lucide-react'
import { hasGoogleMapsApiKey, isPlottableLatLng, loadGoogleMapsApi } from '../../lib/googleMaps'

const DEFAULT_CENTER = { lat: 26.2285, lng: 50.586 }

/**
 * Click-to-pin map for Branch setup. Updates latitude / longitude on pin.
 */
export default function AdminBranchLocationPicker({
  latitude,
  longitude,
  onChange,
  heightClassName = 'h-[160px]',
}) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markerRef = useRef(null)
  const onChangeRef = useRef(onChange)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState(null)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    if (!hasGoogleMapsApiKey()) {
      setStatus('missing-key')
      return undefined
    }

    let cancelled = false

    loadGoogleMapsApi()
      .then((maps) => {
        if (cancelled || !mapRef.current) return

        const hasPin = isPlottableLatLng(latitude, longitude)
        const center = hasPin
          ? { lat: Number(latitude), lng: Number(longitude) }
          : DEFAULT_CENTER

        if (!mapInstanceRef.current) {
          const map = new maps.Map(mapRef.current, {
            center,
            zoom: hasPin ? 14 : 12,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            zoomControl: true,
          })
          mapInstanceRef.current = map

          map.addListener('click', (event) => {
            if (!event.latLng) return
            const lat = event.latLng.lat()
            const lng = event.latLng.lng()
            placeMarker(maps, map, lat, lng)
            onChangeRef.current?.({
              latitude: String(Number(lat.toFixed(6))),
              longitude: String(Number(lng.toFixed(6))),
            })
          })
        }

        if (hasPin) {
          placeMarker(maps, mapInstanceRef.current, Number(latitude), Number(longitude))
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
    // Initial mount only — lat/lng sync handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (status !== 'ready' || !mapInstanceRef.current || !window.google?.maps) return

    const maps = window.google.maps
    const map = mapInstanceRef.current

    if (!isPlottableLatLng(latitude, longitude)) {
      if (markerRef.current) {
        markerRef.current.setMap(null)
        markerRef.current = null
      }
      return
    }

    const lat = Number(latitude)
    const lng = Number(longitude)
    placeMarker(maps, map, lat, lng)
    map.panTo({ lat, lng })
  }, [latitude, longitude, status])

  function placeMarker(maps, map, lat, lng) {
    const position = { lat, lng }
    if (markerRef.current) {
      markerRef.current.setPosition(position)
      return
    }

    const marker = new maps.Marker({
      map,
      position,
      draggable: true,
      title: 'Branch location',
    })

    marker.addListener('dragend', () => {
      const pos = marker.getPosition()
      if (!pos) return
      onChangeRef.current?.({
        latitude: String(Number(pos.lat().toFixed(6))),
        longitude: String(Number(pos.lng().toFixed(6))),
      })
    })

    markerRef.current = marker
  }

  if (status === 'missing-key') {
    return (
      <div
        className={`flex w-full flex-col items-center justify-center gap-2 rounded-[10px] border border-[#e4e8e4] bg-[#f3f5f3] text-[#7c8780] ${heightClassName}`}
      >
        <MapPin size={18} className="text-[#e14b42]" fill="#e14b42" strokeWidth={1.5} />
        <span className="text-[12px] font-medium">Pin location on map</span>
        <span className="text-[11px] text-[#9aa49d]">Set VITE_GOOGLE_MAPS_API_KEY</span>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div
        className={`flex w-full flex-col items-center justify-center gap-2 rounded-[10px] border border-[#f5c6c4] bg-[#fdebec] text-[#d64044] ${heightClassName}`}
      >
        <MapPin size={18} strokeWidth={1.5} />
        <span className="px-3 text-center text-[12px] font-medium">{error}</span>
      </div>
    )
  }

  return (
    <div className={`relative w-full overflow-hidden rounded-[10px] border border-[#e4e8e4] ${heightClassName}`}>
      <div ref={mapRef} className="absolute inset-0 h-full w-full bg-[#f3f5f3]" />
      {status === 'loading' ? (
        <div className="absolute inset-0 grid place-items-center bg-[#f3f5f3] text-[12px] font-medium text-[#7c8780]">
          Loading map…
        </div>
      ) : (
        <div className="pointer-events-none absolute bottom-2 left-2 rounded-md bg-white/95 px-2 py-1 text-[11px] font-medium text-[#7c8780] shadow-sm">
          Click map to pin · drag marker to adjust
        </div>
      )}
    </div>
  )
}
