import { useCallback, useEffect, useRef, useState } from 'react'
import { Expand, LocateFixed, MapPin, X } from 'lucide-react'
import {
  hasGoogleMapsApiKey,
  isPlottableLatLng,
  loadGoogleMapsApi,
  reverseGeocodeLatLng,
} from '../../lib/googleMaps'
import { cn } from './cn'

const DEFAULT_CENTER = { lat: 26.2285, lng: 50.586 }

function formatCoords(lat, lng) {
  return {
    latitude: String(Number(Number(lat).toFixed(6))),
    longitude: String(Number(Number(lng).toFixed(6))),
  }
}

function BranchMapCanvas({
  latitude,
  longitude,
  onPin,
  heightClassName = 'h-[160px]',
  className = '',
  showExpand = false,
  onExpand,
  compactControls = false,
}) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markerRef = useRef(null)
  const mapsApiRef = useRef(null)
  const onPinRef = useRef(onPin)
  const geocodeSeqRef = useRef(0)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState(null)
  const [locating, setLocating] = useState(false)
  const [locateError, setLocateError] = useState(null)

  useEffect(() => {
    onPinRef.current = onPin
  }, [onPin])

  const emitPin = useCallback(async (lat, lng) => {
    const coords = formatCoords(lat, lng)
    onPinRef.current?.({ ...coords })

    const seq = ++geocodeSeqRef.current
    try {
      const geo = await reverseGeocodeLatLng(coords.latitude, coords.longitude)
      if (seq !== geocodeSeqRef.current) return
      onPinRef.current?.({
        ...coords,
        address: geo.address || `${coords.latitude}, ${coords.longitude}`,
        area: geo.area || undefined,
        city: geo.city || undefined,
      })
    } catch {
      if (seq !== geocodeSeqRef.current) return
      onPinRef.current?.({
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

  const resizeMap = useCallback(() => {
    const maps = mapsApiRef.current
    const map = mapInstanceRef.current
    if (!maps || !map) return
    maps.event.trigger(map, 'resize')
    if (isPlottableLatLng(latitude, longitude)) {
      map.panTo({ lat: Number(latitude), lng: Number(longitude) })
    }
  }, [latitude, longitude])

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

        if (mapInstanceRef.current) {
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

        requestAnimationFrame(() => {
          maps.event.trigger(map, 'resize')
        })
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

  useEffect(() => {
    if (status !== 'ready') return
    const timer = window.setTimeout(resizeMap, 120)
    return () => window.clearTimeout(timer)
  }, [status, resizeMap, heightClassName])

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
        className={cn(
          'flex w-full flex-col items-center justify-center gap-2 rounded-[10px] border border-[#e4e8e4] bg-[#f3f5f3] text-[#7c8780]',
          heightClassName,
          className,
        )}
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
        className={cn(
          'flex w-full flex-col items-center justify-center gap-2 rounded-[10px] border border-[#f5c6c4] bg-[#fdebec] text-[#d64044]',
          heightClassName,
          className,
        )}
      >
        <MapPin size={18} strokeWidth={1.5} />
        <span className="px-3 text-center text-[12px] font-medium">{error}</span>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'relative w-full overflow-hidden rounded-[10px] border border-[#e4e8e4]',
        heightClassName,
        className,
      )}
    >
      <div ref={mapRef} className="absolute inset-0 h-full w-full bg-[#f3f5f3]" />

      {status === 'loading' ? (
        <div className="absolute inset-0 grid place-items-center bg-[#f3f5f3] text-[12px] font-medium text-[#7c8780]">
          Loading map…
        </div>
      ) : (
        <>
          <div className="absolute right-3 top-3 z-[2] flex items-center gap-2">
            {showExpand ? (
              <button
                type="button"
                onClick={onExpand}
                title="Expand map"
                aria-label="Expand map"
                className="inline-flex h-9 items-center gap-1.5 rounded-md border border-[#dfe4e0] bg-white px-2.5 text-[#17231c] shadow-sm hover:bg-[#f7f9f7]"
              >
                <Expand size={15} />
                {!compactControls ? (
                  <span className="text-[11px] font-semibold">Expand</span>
                ) : null}
              </button>
            ) : null}
            <button
              type="button"
              onClick={useCurrentLocation}
              disabled={locating}
              title="Use current location"
              aria-label="Use current location"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#dfe4e0] bg-white text-[#17231c] shadow-sm hover:bg-[#f7f9f7] disabled:opacity-60"
            >
              <LocateFixed size={16} className={locating ? 'animate-pulse' : ''} />
            </button>
          </div>

          <div className="pointer-events-none absolute bottom-2 left-2 z-[2] max-w-[75%] rounded-md bg-white/95 px-2 py-1 text-[11px] font-medium text-[#7c8780] shadow-sm">
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

function BranchMapExpandModal({ open, latitude, longitude, onPin, onClose }) {
  useEffect(() => {
    if (!open) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[150] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Close expanded map"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative flex w-full max-w-[920px] flex-col overflow-hidden rounded-t-[16px] bg-white shadow-[0_18px_44px_rgba(0,0,0,0.28)] sm:rounded-[16px]"
      >
        <div className="flex items-center justify-between border-b border-[#eceeec] px-4 py-3">
          <div>
            <h3 className="text-[15px] font-bold text-[#17231c]">Pin branch location</h3>
            <p className="mt-0.5 text-[12px] text-[#7c8780]">
              Use the larger map to find and set the exact branch location.
            </p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[#637068] hover:bg-[#f3f5f3]"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4">
          <BranchMapCanvas
            latitude={latitude}
            longitude={longitude}
            onPin={onPin}
            heightClassName="h-[58vh] min-h-[320px] max-h-[640px]"
            compactControls
          />
        </div>

        <div className="flex justify-end border-t border-[#eceeec] px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-[36px] items-center rounded-full bg-[#1aa054] px-4 text-[12.5px] font-bold text-white hover:bg-[#158a47]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
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
  const [expanded, setExpanded] = useState(false)

  return (
    <>
      <BranchMapCanvas
        latitude={latitude}
        longitude={longitude}
        onPin={onChange}
        heightClassName={heightClassName}
        showExpand
        onExpand={() => setExpanded(true)}
      />

      <BranchMapExpandModal
        open={expanded}
        latitude={latitude}
        longitude={longitude}
        onPin={onChange}
        onClose={() => setExpanded(false)}
      />
    </>
  )
}
