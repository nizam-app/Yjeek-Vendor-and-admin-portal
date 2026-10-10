export const ADMIN_REGION_OPTIONS = [
  { value: 'BH', label: 'Bahrain · All regions' },
  { value: 'Capital', label: 'Bahrain · Capital' },
  { value: 'Muharraq', label: 'Bahrain · Muharraq' },
  { value: 'Northern', label: 'Bahrain · Northern' },
  { value: 'Southern', label: 'Bahrain · Southern' },
]

/** Default map center / zoom when the live map has no pins in scope. */
export const ADMIN_REGION_MAP_VIEW = {
  BH: { lat: 26.2285, lng: 50.586, zoom: 11 },
  Capital: { lat: 26.2285, lng: 50.586, zoom: 12 },
  Muharraq: { lat: 26.2572, lng: 50.6119, zoom: 12 },
  Northern: { lat: 26.2235, lng: 50.486, zoom: 11 },
  Southern: { lat: 26.1298, lng: 50.555, zoom: 11 },
}

export function adminRegionLabel(value) {
  return ADMIN_REGION_OPTIONS.find((item) => item.value === value)?.label || ADMIN_REGION_OPTIONS[0].label
}

export function adminRegionMapView(value) {
  return ADMIN_REGION_MAP_VIEW[value] || ADMIN_REGION_MAP_VIEW.BH
}
