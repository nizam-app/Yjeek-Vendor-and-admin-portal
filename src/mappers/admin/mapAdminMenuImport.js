/** Map Menu Import BFF payloads (docs/import-api.md) for Admin Vendor detail. */

export const POLL_INTERVAL_MS = 3000

export const KNOWN_CREATE_ERRORS = {
  AGGREGATOR_URL_FORBIDDEN:
    'That aggregator is not supported. Use a Talabat restaurant menu URL, the vendor’s own website, or upload a file.',
  VENDOR_NOT_FOUND: 'Vendor was not found in Core. Open a live vendor from Vendor Management.',
  VENDOR_INACTIVE: 'This vendor is inactive. Activate the vendor before importing.',
  ACTIVE_IMPORT_EXISTS: 'This vendor already has an active import. Cancel or complete it first.',
}

export function menuImportErrorCode(error) {
  const raw = error?.raw
  if (raw && typeof raw === 'object') {
    const nested = raw.error
    if (nested && typeof nested === 'object' && nested.code) return String(nested.code)
    if (typeof raw.code === 'string') return raw.code
  }
  const details = error?.details
  if (details && typeof details === 'object' && details.code) return String(details.code)
  return ''
}

export function messageForMenuImportError(error, fallback = 'Request failed.') {
  const code = menuImportErrorCode(error)
  if (code && KNOWN_CREATE_ERRORS[code]) return KNOWN_CREATE_ERRORS[code]
  if (error?.message) return error.message
  return fallback
}

function toNumber(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function toPrice(value) {
  const n = Number(value)
  if (!Number.isFinite(n) || n < 0) return 0
  return Math.round(n * 1000) / 1000
}

export function formatBhd(price) {
  return `BHD ${toPrice(price).toFixed(3)}`
}

export function parseBhdInput(value) {
  const cleaned = String(value || '').replace(/[^\d.]/g, '')
  if (!cleaned) return null
  const num = Number(cleaned)
  if (!Number.isFinite(num) || num < 0) return null
  return Math.round(num * 1000) / 1000
}

export function formatDateTime(iso) {
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return String(iso || '')
  }
}

export function statusTone(status) {
  switch (status) {
    case 'COMPLETED':
      return 'green'
    case 'REVIEW':
      return 'blue'
    case 'PROCESSING':
    case 'PUBLISHING':
    case 'QUEUED':
      return 'yellow'
    case 'FAILED':
      return 'red'
    case 'CANCELLED':
      return 'gray'
    default:
      return 'gray'
  }
}

export function isPollingStatus(status) {
  return status === 'QUEUED' || status === 'PROCESSING' || status === 'PUBLISHING'
}

export function canCancelImport(status) {
  return status === 'QUEUED' || status === 'PROCESSING' || status === 'REVIEW'
}

export function canEditReview(status) {
  return status === 'REVIEW'
}

export function canDeleteImport(status) {
  return status === 'FAILED' || status === 'CANCELLED' || status === 'COMPLETED'
}

export function canRetryImport(status) {
  return status === 'FAILED' || status === 'CANCELLED'
}

export function mapAdminMenuImport(raw) {
  const src = raw && typeof raw === 'object' ? raw : {}
  return {
    id: String(src.id || ''),
    vendorId: String(src.vendorId || ''),
    sourceType: src.sourceType || 'VENDOR_URL',
    status: src.status || 'QUEUED',
    currentStep: src.currentStep ?? null,
    processedPages: toNumber(src.processedPages, 0),
    totalPages: toNumber(src.totalPages, 0),
    lastErrorMessage: src.lastErrorMessage ?? null,
    isPriceParityVerified: Boolean(src.isPriceParityVerified),
    totalAiCalls: toNumber(src.totalAiCalls, 0),
    totalAiTokensUsed: toNumber(src.totalAiTokensUsed, 0),
    createdAt: src.createdAt || '',
    updatedAt: src.updatedAt || '',
  }
}

export function mapAdminMenuImportList(raw) {
  if (raw && typeof raw === 'object' && Array.isArray(raw.items)) {
    return {
      items: raw.items.map(mapAdminMenuImport).filter((row) => row.id),
      total: Number(raw.total) || 0,
      page: Number(raw.page) || 1,
      limit: Number(raw.limit) || 20,
      totalPages: Number(raw.totalPages) || 1,
    }
  }

  const list = Array.isArray(raw) ? raw : raw?.imports || []
  const items = list.map(mapAdminMenuImport).filter((row) => row.id)
  return {
    items,
    total: items.length,
    page: 1,
    limit: items.length || 20,
    totalPages: 1,
  }
}

function mapReviewItem(raw) {
  const src = raw && typeof raw === 'object' ? raw : {}
  const imageUrls = Array.isArray(src.imageUrls)
    ? src.imageUrls.map((url) => String(url)).filter(Boolean).slice(0, 4)
    : []
  if (src.imageUrl && !imageUrls.includes(String(src.imageUrl))) {
    imageUrls.unshift(String(src.imageUrl))
  }
  return {
    id: String(src.id || ''),
    name: String(src.name || ''),
    nameAr: src.nameAr ? String(src.nameAr) : null,
    description: src.description ?? null,
    descriptionAr: src.descriptionAr ? String(src.descriptionAr) : null,
    price: toPrice(src.price),
    imageUrl: src.imageUrl ?? imageUrls[0] ?? null,
    imageUrls: imageUrls.slice(0, 4),
    displayOrder: toNumber(src.displayOrder, 0),
    sourcePageNumber: src.sourcePageNumber ?? null,
    backendItemId: src.backendItemId ?? null,
    subcategory: src.subcategory ? String(src.subcategory) : null,
    subcategoryAr: src.subcategoryAr ? String(src.subcategoryAr) : null,
    subSubcategory: src.subSubcategory ? String(src.subSubcategory) : null,
    subSubcategoryAr: src.subSubcategoryAr ? String(src.subSubcategoryAr) : null,
    prepTimeMin: src.prepTimeMin != null ? toNumber(src.prepTimeMin, 0) || null : null,
    badges: Array.isArray(src.badges) ? src.badges.map(String) : [],
    availabilitySlots: Array.isArray(src.availabilitySlots)
      ? src.availabilitySlots.map(String)
      : [],
    availableFrom: src.availableFrom ? String(src.availableFrom) : null,
    availableTo: src.availableTo ? String(src.availableTo) : null,
    optionGroups: Array.isArray(src.optionGroups) ? src.optionGroups : [],
    addons: Array.isArray(src.addons) ? src.addons : [],
    isActive: Boolean(src.isActive),
  }
}

function mapReviewCategory(raw) {
  const src = raw && typeof raw === 'object' ? raw : {}
  const items = Array.isArray(src.items) ? src.items.map(mapReviewItem) : []
  return {
    id: String(src.id || ''),
    name: String(src.name || ''),
    nameAr: src.nameAr ? String(src.nameAr) : null,
    displayOrder: toNumber(src.displayOrder, 0),
    backendCategoryId: src.backendCategoryId ?? null,
    parentId: src.parentId ? String(src.parentId) : null,
    items,
  }
}

export function mapAdminMenuImportReview(raw) {
  const src = raw && typeof raw === 'object' ? raw : {}
  const categories = Array.isArray(src.categories)
    ? src.categories.map(mapReviewCategory)
    : []
  return {
    ...mapAdminMenuImport(src),
    categories,
  }
}

/** Same normalization as Menu Import extract + Core internal create. */
export function normalizeImportBadgeCode(code) {
  return String(code || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
}

export function humanizeImportBadgeCode(code) {
  const normalized = normalizeImportBadgeCode(code)
  if (!normalized) return ''
  return normalized
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(' ')
}

export const DEFAULT_IMPORT_BADGE_OPTIONS = [
  { code: 'NEW', label: 'New' },
  { code: 'BESTSELLER', label: 'Bestseller' },
  { code: 'HALAL', label: 'Halal' },
  { code: 'SPICY', label: 'Spicy' },
  { code: 'VEGETARIAN', label: 'Vegetarian' },
  { code: 'VEGAN', label: 'Vegan' },
  { code: 'GLUTEN_FREE', label: 'Gluten free' },
  { code: 'HEALTHY', label: 'Healthy' },
]

/** Store-type badge rows → toggle options (label from admin, code normalized). */
export function mapStoreTypeBadgeOptions(storeTypeBadges) {
  if (!Array.isArray(storeTypeBadges) || storeTypeBadges.length === 0) {
    return DEFAULT_IMPORT_BADGE_OPTIONS
  }
  const seen = new Set()
  const out = []
  for (const row of storeTypeBadges) {
    if (!row || typeof row !== 'object') continue
    const label = String(row.label || '').trim()
    if (!label) continue
    const code = normalizeImportBadgeCode(row.code || label)
    if (!code || seen.has(code)) continue
    seen.add(code)
    out.push({ code, label })
  }
  return out.length ? out : DEFAULT_IMPORT_BADGE_OPTIONS
}

export function buildImportBadgeLabelMap(badgeOptions) {
  const map = {}
  for (const opt of badgeOptions || []) {
    if (opt?.code) map[opt.code] = opt.label || humanizeImportBadgeCode(opt.code)
  }
  return map
}

export function formatImportBadgesSummary(badges, labelByCode = {}) {
  const list = Array.isArray(badges) ? badges.map(normalizeImportBadgeCode).filter(Boolean) : []
  if (!list.length) return '—'
  const labels = list.map((code) => labelByCode[code] || humanizeImportBadgeCode(code))
  if (labels.length <= 2) return labels.join(', ')
  return `${labels.slice(0, 2).join(', ')} +${labels.length - 2}`
}

const AVAILABILITY_SLOT_LABELS = {
  ALL_DAY: 'All day',
  BREAKFAST: 'Breakfast',
  LUNCH: 'Lunch',
  DINNER: 'Dinner',
  LATE_NIGHT: 'Late night',
}

export function normalizeImportAvailabilitySlots(slots) {
  const list = Array.isArray(slots)
    ? slots.map((s) => String(s || '').trim().toUpperCase()).filter(Boolean)
    : []
  if (!list.length || list.includes('ALL_DAY')) return ['ALL_DAY']
  return [...new Set(list)]
}

export function toggleImportAvailabilitySlot(current, slotValue) {
  const value = String(slotValue || '').trim().toUpperCase()
  const base = normalizeImportAvailabilitySlots(current)
  if (value === 'ALL_DAY') return ['ALL_DAY']
  let next = base.filter((s) => s !== 'ALL_DAY')
  if (next.includes(value)) {
    next = next.filter((s) => s !== value)
  } else {
    next.push(value)
  }
  return next.length ? next : ['ALL_DAY']
}

export function formatImportAvailabilitySummary(item) {
  if (!item || typeof item !== 'object') return '—'
  const from = item.availableFrom ? String(item.availableFrom).trim() : ''
  const to = item.availableTo ? String(item.availableTo).trim() : ''
  if (from || to) {
    if (from && to) return `${from}–${to}`
    if (from) return `From ${from}`
    return `Until ${to}`
  }
  const slots = normalizeImportAvailabilitySlots(item.availabilitySlots)
  if (slots.length === 1 && slots[0] === 'ALL_DAY') return 'All day'
  return slots.map((s) => AVAILABILITY_SLOT_LABELS[s] || s).join(', ')
}
