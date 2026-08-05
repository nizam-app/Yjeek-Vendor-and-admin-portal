import { useCallback, useEffect, useRef, useState } from 'react'
import { LocateFixed, MapPin } from 'lucide-react'
import {
  hasGoogleMapsApiKey,
  isPlottableLatLng,
  loadGoogleMapsApi,
  reverseGeocodeLatLng,
} from '../../lib/googleMaps'

const DEFAULT_CENTER = { lat: 26.2285, lng: 50.586 }

function formatCoords(lat, lng) {
  return {
    latitude: String(Number(Number(lat).toFixed(6))),
    longitude: String(Number(Number(lng).toFixed(6))),
  }
}

/**
 * Click-to-pin map for Branch setup.
 * Fills latitude, longitude, and address (reverse geocode).
 * Includes a current-location control on the map.
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
  const mapsApiRef = useRef(null)
  const onChangeRef = useRef(onChange)
  const geocodeSeqRef = useRef(0)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState(null)
  const [locating, setLocating] = useState(false)
  const [locateError, setLocateError] = useState(null)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  const emitPin = useCallback(async (lat, lng) => {
    const coords = formatCoords(lat, lng)

    // Always fill lat/lng immediately.
    onChangeRef.current?.({
      ...coords,
    })

    const seq = ++geocodeSeqRef.current
    try {
      const geo = await reverseGeocodeLatLng(coords.latitude, coords.longitude)
      if (seq !== geocodeSeqRef.current) return
      onChangeRef.current?.({
        ...coords,
        address: geo.address || `${coords.latitude}, ${coords.longitude}`,
        area: geo.area || undefined,
        city: geo.city || undefined,
      })
    } catch {
      // Geocode optional — still fill address with coordinates so the field is not empty.
      if (seq !== geocodeSeqRef.current) return
      onChangeRef.current?.({
        ...coords,
        address: `${coords.latitude}, ${coords.longitude}`,
      })
    }
  }, [])

  const placeMarker = useCallback((maps, map, lat, lng) => {
    const position = { lat: Number(lat), lng: Number(lng) }

    if (markerRef.current) {
      markerRef.current.setPosition(position)
      markerRef.current.setMap(map)
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
      void emitPin(pos.lat(), pos.lng())
    })

    markerRef.current = marker
  }, [emitPin])

  const pinAt = useCallback((lat, lng, { zoom = 15 } = {}) => {
    const maps = mapsApiRef.current
    const map = mapInstanceRef.current
    if (!maps || !map) return
    placeMarker(maps, map, lat, lng)
    map.panTo({ lat: Number(lat), lng: Number(lng) })
    if (zoom != null) map.setZoom(zoom)
    void emitPin(Number(lat), Number(lng))
  }, [emitPin, placeMarker])

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

        // Always recreate map for this mount (avoids Strict Mode / remount dead listeners).
        if (mapInstanceRef.current) {
          // Drop previous Google map instance binding.
          mapInstanceRef.current = null
        }
        if (markerRef.current) {
          markerRef.current.setMap(null)
          markerRef.current = null
        }

        const hasPin = isPlottableLatLng(latitude, longitude)
        const center = hasPin
          ? { lat: Number(latitude), lng: Number(longitude) }
          : DEFAULT_CENTER

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
          void emitPin(lat, lng)
        })

        if (hasPin) {
          placeMarker(maps, map, Number(latitude), Number(longitude))
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
      if (markerRef.current) {
        markerRef.current.setMap(null)
        markerRef.current = null
      }
      mapInstanceRef.current = null
      mapsApiRef.current = null
    }
    // Mount once per picker lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (status !== 'ready' || !mapInstanceRef.current || !mapsApiRef.current) return

    const maps = mapsApiRef.current
    const map = mapInstanceRef.current

    if (!isPlottableLatLng(latitude, longitude)) return

    const lat = Number(latitude)
    const lng = Number(longitude)
    placeMarker(maps, map, lat, lng)
    map.panTo({ lat, lng })
  }, [latitude, longitude, status, placeMarker])

  function useCurrentLocation() {
    if (!navigator?.geolocation) {
      setLocateError('Geolocation is not supported in this browser.')
      return
    }
    setLocateError(null)
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false)
        pinAt(position.coords.latitude, position.coords.longitude, { zoom: 16 })
      },
      (err) => {
        setLocating(false)
        setLocateError(err?.message || 'Unable to get current location.')
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    )
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
        <>
          <button
            type="button"
            onClick={useCurrentLocation}
            disabled={locating}
            title="Use current location"
            aria-label="Use current location"
            className="absolute right-3 top-3 z-[2] inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#dfe4e0] bg-white text-[#17231c] shadow-sm hover:bg-[#f7f9f7] disabled:opacity-60"
          >
            <LocateFixed size={16} className={locating ? 'animate-pulse' : ''} />
          </button>

          <div className="pointer-events-none absolute bottom-2 left-2 z-[2] max-w-[70%] rounded-md bg-white/95 px-2 py-1 text-[11px] font-medium text-[#7c8780] shadow-sm">
            {locateError
              ? locateError
              : locating
                ? 'Getting current location…'
                : 'Click map to pin · drag marker · or use current location'}
          </div>
        </>
      )}
    </div>
  )
}
