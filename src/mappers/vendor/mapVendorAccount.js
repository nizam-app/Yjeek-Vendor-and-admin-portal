/**
 * Map confirmed Vendor account API (GET /vendor-panel/account) into Account UI shape.
 *
 * Confirmed data:
 *   profile: fullName, displayName, email, phone, role, avatarUrl
 *   business: legalName, crNumber, vatNumber, businessAddress
 *   payout: bankName, ibanMasked, verificationStatus
 */

function formatRole(role) {
  if (!role) return 'vendor_admin'
  return String(role).trim().toLowerCase().replace(/\s+/g, '_')
}

function initialsFromName(name) {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (!parts.length) return 'GK'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase()
}

/**
 * Format masked IBAN for display.
 * API example: "BH57****************4417" → "BH•• •••• •••• •••• 4417"
 */
export function formatMaskedIban(ibanMasked) {
  const raw = String(ibanMasked || '').trim()
  if (!raw) return '—'

  const compact = raw.replace(/\s+/g, '')
  const country = compact.slice(0, 2).toUpperCase()
  const last4 = compact.slice(-4)
  if (country.length === 2 && last4.length === 4) {
    return `${country}•• •••• •••• •••• ${last4}`
  }
  return raw
}

function mapVerification(status) {
  const upper = String(status || '')
    .trim()
    .toUpperCase()
  if (upper === 'VERIFIED') {
    return { status: 'VERIFIED', label: 'Verified', tone: 'verified' }
  }
  if (upper === 'PENDING' || upper === 'IN_REVIEW' || upper === 'UNDER_REVIEW') {
    return { status: upper, label: 'Pending', tone: 'pending' }
  }
  if (upper === 'REJECTED' || upper === 'FAILED') {
    return { status: upper, label: 'Rejected', tone: 'rejected' }
  }
  if (!upper) {
    return { status: '', label: 'Unverified', tone: 'unverified' }
  }
  return {
    status: upper,
    label: upper
      .toLowerCase()
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase()),
    tone: 'unverified',
  }
}

/**
 * @param {unknown} data
 */
export function mapVendorAccountResponse(data) {
  const profile = data?.profile && typeof data.profile === 'object' ? data.profile : {}
  const business = data?.business && typeof data.business === 'object' ? data.business : {}
  const payout = data?.payout && typeof data.payout === 'object' ? data.payout : {}

  const fullName = profile.fullName || ''
  const displayName = profile.displayName || fullName || ''
  const headerName = displayName || fullName || 'Vendor'
  const verification = mapVerification(payout.verificationStatus)

  return {
    profile: {
      fullName: fullName || '—',
      displayName: displayName || '—',
      email: profile.email || '—',
      phone: profile.phone || '—',
      role: formatRole(profile.role),
      roleRaw: profile.role || null,
      avatarUrl: profile.avatarUrl || null,
      initials: initialsFromName(headerName),
      headerName,
    },
    business: {
      legalName: business.legalName || '—',
      crNumber: business.crNumber || '—',
      vatNumber: business.vatNumber || '—',
      businessAddress: business.businessAddress || '—',
    },
    payout: {
      bankName: payout.bankName || '—',
      ibanMasked: payout.ibanMasked || '',
      ibanDisplay: formatMaskedIban(payout.ibanMasked),
      verificationStatus: verification.status,
      verificationLabel: verification.label,
      verificationTone: verification.tone,
    },
  }
}
