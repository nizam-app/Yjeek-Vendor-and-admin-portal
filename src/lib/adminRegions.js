export const ADMIN_REGION_OPTIONS = [
  { value: 'BH', label: 'Bahrain · All regions' },
  { value: 'Capital', label: 'Bahrain · Capital' },
  { value: 'Muharraq', label: 'Bahrain · Muharraq' },
  { value: 'Northern', label: 'Bahrain · Northern' },
  { value: 'Southern', label: 'Bahrain · Southern' },
]

export function adminRegionLabel(value) {
  return ADMIN_REGION_OPTIONS.find((item) => item.value === value)?.label || ADMIN_REGION_OPTIONS[0].label
}
