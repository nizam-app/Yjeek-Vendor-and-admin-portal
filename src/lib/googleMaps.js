const SCRIPT_ID = 'yjeek-google-maps-js'

/**
 * Load Google Maps JS API once. Key from VITE_GOOGLE_MAPS_API_KEY.
 * @returns {Promise<typeof google.maps | null>}
 */
export function loadGoogleMapsApi() {
  const apiKey = String(import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '').trim()
  if (!apiKey) {
    return Promise.reject(new Error('Google Maps API key is not configured.'))
  }

  if (typeof window !== 'undefined' && window.google?.maps) {
    return Promise.resolve(window.google.maps)
  }

  if (typeof window !== 'undefined' && window.__yjeekGoogleMapsPromise) {
    return window.__yjeekGoogleMapsPromise
  }

  const promise = new Promise((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID)
    if (existing) {
      existing.addEventListener('load', () => {
        if (window.google?.maps) resolve(window.google.maps)
        else reject(new Error('Google Maps failed to load.'))
      })
      existing.addEventListener('error', () => reject(new Error('Google Maps failed to load.')))
      return
    }

    const script = document.createElement('script')
    script.id = SCRIPT_ID
    script.async = true
    script.defer = true
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}`
    script.onload = () => {
      if (window.google?.maps) resolve(window.google.maps)
      else reject(new Error('Google Maps failed to load.'))
    }
    script.onerror = () => reject(new Error('Google Maps failed to load.'))
    document.head.appendChild(script)
  })

  if (typeof window !== 'undefined') {
    window.__yjeekGoogleMapsPromise = promise
  }

  return promise
}

export function hasGoogleMapsApiKey() {
  return Boolean(String(import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '').trim())
}

/** Treat missing / (0,0) as unplottable. */
export function isPlottableLatLng(lat, lng) {
  const latitude = Number(lat)
  const longitude = Number(lng)
  if (Number.isNaN(latitude) || Number.isNaN(longitude)) return false
  if (latitude === 0 && longitude === 0) return false
  return true
}
