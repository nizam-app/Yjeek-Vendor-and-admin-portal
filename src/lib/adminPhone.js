export const ADMIN_PHONE_COUNTRIES = [{ iso: 'BH', dial: '+973', name: 'Bahrain' }]

export const DEFAULT_ADMIN_COUNTRY_CODE = '+973'

function knownDialDigits() {
  return ADMIN_PHONE_COUNTRIES.map((country) => country.dial.replace('+', ''))
}

/**
 * Split a typed/pasted phone into { countryCode, phone } (local digits only).
 * Accepts "+973 33000000", "33000000", or "97333000000".
 */
export function parseAdminPhone(raw, fallbackCountryCode = DEFAULT_ADMIN_COUNTRY_CODE) {
  const fallback =
    String(fallbackCountryCode || DEFAULT_ADMIN_COUNTRY_CODE).trim() || DEFAULT_ADMIN_COUNTRY_CODE
  const text = String(raw || '').trim()
  if (!text) return { countryCode: fallback, phone: '' }

  const plusMatch = text.match(/^(\+\d{1,4})\s*(.*)$/)
  if (plusMatch) {
    return {
      countryCode: plusMatch[1],
      phone: String(plusMatch[2] || '').replace(/\D/g, ''),
    }
  }

  const digits = text.replace(/\D/g, '')
  for (const dial of knownDialDigits()) {
    if (digits.startsWith(dial) && digits.length > dial.length + 3) {
      return { countryCode: `+${dial}`, phone: digits.slice(dial.length) }
    }
  }

  return { countryCode: fallback, phone: digits }
}

export function formatAdminPhoneDisplay(countryCode, phone) {
  const parsed = parseAdminPhone(phone, countryCode)
  if (!parsed.phone) return parsed.countryCode || DEFAULT_ADMIN_COUNTRY_CODE
  return `${parsed.countryCode} ${parsed.phone}`
}

export function adminPhoneCountryLabel(country) {
  return `${country.iso} ${country.dial}`
}
