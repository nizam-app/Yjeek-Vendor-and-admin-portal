import { ApiError } from '../../api/errors'

export const PROMO_TYPE_TO_UI = {
  PERCENT_OFF: '% off',
  FREE_DELIVERY: 'Free delivery',
  BOGO: 'BOGO',
  ITEM_DEAL: 'Item deal',
  FIXED_AMOUNT: 'Fixed amount',
}

export const PROMO_UI_TO_TYPE = {
  '% off': 'PERCENT_OFF',
  'Free delivery': 'FREE_DELIVERY',
  BOGO: 'BOGO',
  'Item deal': 'ITEM_DEAL',
  'Fixed amount': 'FIXED_AMOUNT',
}

function formatMoney(value, currency = 'BHD') {
  if (value == null || value === '') return '—'
  const num = Number(value)
  if (Number.isNaN(num)) return String(value)
  return `${currency} ${num.toFixed(3)}`
}

function formatPeriodLabel(from, to) {
  const a = formatDateLabel(from)
  const b = formatDateLabel(to)
  if (a && b) return `${a} – ${b}`
  return a || b || '—'
}

function formatDateLabel(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function parseToIso(value, { endOfDay = false } = {}) {
  if (!value) return null
  const raw = String(value).trim()
  if (!raw) return null
  // Already ISO-ish
  if (/^\d{4}-\d{2}-\d{2}T/.test(raw) || /^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const date = new Date(raw)
    if (!Number.isNaN(date.getTime())) return date.toISOString()
  }
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return null
  if (endOfDay) {
    date.setHours(23, 59, 59, 999)
  }
  return date.toISOString()
}

/**
 * Map one promotion object (list item or create/get response).
 * Confirmed create response fields used; empty/null → "—" (do not invent).
 */
export function mapAdminVendorPromotionItem(item) {
  if (!item || typeof item !== 'object') return null

  const id = item.id != null ? String(item.id) : null
  const typeCode = item.type ? String(item.type) : null
  const typeLabel = (typeCode && PROMO_TYPE_TO_UI[typeCode]) || (typeCode ? typeCode : '—')
  const scopeCode = item.scope ? String(item.scope) : null
  const scopeLabel =
    scopeCode === 'all_branches'
      ? 'All branches'
      : scopeCode === 'selected_branches'
        ? 'Selected branches'
        : scopeCode || '—'

  const value =
    item.value != null && item.value !== ''
      ? Number(item.value)
      : item.discountValue != null && item.discountValue !== ''
        ? Number(item.discountValue)
        : null

  const from = item.from || item.startsAt || null
  const to = item.to || item.endsAt || null
  const status = item.status
    ? String(item.status)
    : item.isPaused
      ? 'Paused'
      : item.active
        ? 'Active'
        : '—'

  const detailType =
    typeCode === 'PERCENT_OFF' && value != null && !Number.isNaN(value)
      ? `Percentage off (${value}%)`
      : typeLabel

  return {
    id,
    name: item.name ? String(item.name) : 'Untitled promotion',
    type: typeLabel,
    typeCode,
    scope: scopeLabel,
    scopeCode,
    period: formatPeriodLabel(from, to),
    used:
      item.used != null
        ? item.used
        : item.usageCount != null
          ? item.usageCount
          : '—',
    status,
    value: value != null && !Number.isNaN(value) ? value : null,
    discountCap: item.cap != null && item.cap !== '' ? formatMoney(item.cap) : '—',
    minOrder: item.minOrder != null && item.minOrder !== '' ? formatMoney(item.minOrder) : '—',
    detailType,
    detailScope: scopeLabel,
    detailPeriod: formatPeriodLabel(from, to),
    eligibility: item.eligibility ? String(item.eligibility) : '—',
    usedLabel:
      item.usedLabel ||
      (item.used != null && item.usedLimit != null
        ? `${item.used} of ${item.usedLimit}`
        : item.used != null
          ? String(item.used)
          : '—'),
    from,
    to,
    branchIds: Array.isArray(item.branchIds) ? item.branchIds : [],
    active: Boolean(item.active),
    isPaused: Boolean(item.isPaused),
    raw: item,
  }
}

/**
 * Map GET /admin/vendors/:vendorId/promotions `data`.
 * Confirmed: { count: 0, promotions: [] }
 */
export function mapAdminVendorPromotionsResponse(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new ApiError({
      message: 'Invalid vendor promotions response from the server.',
    })
  }

  const promotionsRaw = Array.isArray(data.promotions) ? data.promotions : null
  if (promotionsRaw === null) {
    throw new ApiError({
      message: 'Invalid vendor promotions response from the server.',
    })
  }

  const promotions = promotionsRaw.map(mapAdminVendorPromotionItem).filter(Boolean)
  const count = Number(data.count)
  return {
    count: Number.isFinite(count) ? count : promotions.length,
    promotions,
  }
}

export function emptyAdminVendorPromotions() {
  return { count: 0, promotions: [] }
}

/**
 * Map create/edit modal form → POST create body.
 * Confirmed: name, type, discountValue, scope, startsAt, endsAt
 */
export function mapAdminCreateVendorPromotionRequest(form = {}) {
  const name = String(form.name || '').trim()
  if (!name) {
    throw new ApiError({ message: 'Promotion name is required.' })
  }

  const type =
    PROMO_UI_TO_TYPE[form.type] ||
    (form.typeCode && PROMO_TYPE_TO_UI[form.typeCode] ? form.typeCode : null) ||
    'PERCENT_OFF'

  const discountValue = Number(form.value ?? form.discountValue)
  if (Number.isNaN(discountValue)) {
    throw new ApiError({ message: 'Discount value is required.' })
  }

  const scopeUi = form.scope || 'All branches'
  const scope =
    /^all branches$/i.test(scopeUi) || scopeUi === 'all_branches'
      ? 'all_branches'
      : form.scopeCode || 'all_branches'

  const startsAt =
    parseToIso(form.from || form.startsAt) ||
    parseToIso(form.fromIso) ||
    new Date().toISOString()
  const endsAt =
    parseToIso(form.to || form.endsAt, { endOfDay: true }) ||
    parseToIso(form.toIso, { endOfDay: true })

  if (!endsAt) {
    throw new ApiError({ message: 'End date is required.' })
  }

  return {
    name,
    type,
    discountValue,
    scope,
    startsAt,
    endsAt,
  }
}

/**
 * Map edit form → PATCH body.
 * Confirmed Postman sample: { name }
 */
export function mapAdminUpdateVendorPromotionRequest(form = {}) {
  const body = {}
  const name = String(form.name || '').trim()
  if (name) body.name = name
  return body
}
