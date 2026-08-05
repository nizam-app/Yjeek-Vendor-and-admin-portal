import { ApiError } from '../../api/errors'

function formatCount(value) {
  if (value == null || value === '') return '—'
  const num = Number(value)
  if (!Number.isFinite(num)) return String(value)
  return num.toLocaleString('en-US')
}

function formatMoney(value) {
  if (value == null || value === '') return '—'
  const num = Number(value)
  if (!Number.isFinite(num)) return String(value)
  const formatted = Number.isInteger(num)
    ? num.toLocaleString('en-US')
    : num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 3 })
  return `BHD ${formatted}`
}

function codeToneForStatus(status, statusKey) {
  const key = String(statusKey || status || '').toLowerCase()
  if (key === 'paused') return 'gray'
  if (key === 'expired') return 'gray'
  if (key === 'active') return 'green'
  return 'green'
}

function mapPromoRow(item) {
  return {
    id: String(item.id),
    code: item.code ? String(item.code) : '—',
    codeTone: codeToneForStatus(item.status, item.statusKey),
    description: item.description ? String(item.description) : '—',
    type: item.typeLabel ? String(item.typeLabel) : '—',
    maxDisc: item.maxDiscLabel != null ? String(item.maxDiscLabel) : '—',
    usedLimit: item.usedLimitLabel ? String(item.usedLimitLabel) : '—',
    status: item.status ? String(item.status) : '—',
    expiry: item.expiryLabel ? String(item.expiryLabel) : '—',
  }
}

/**
 * Map GET /admin/marketing/promo-codes → Promo codes tab model.
 *
 * Confirmed list includes embedded `summary` (activeCodes, redemptions30d,
 * discountGiven, revenueFromCodes) — no separate summary call required.
 */
export function mapAdminMarketingPromoCodesPage(listData) {
  if (!listData || typeof listData !== 'object') {
    throw new ApiError({ message: 'Invalid marketing promo codes list from the server.' })
  }

  const summary = listData.summary && typeof listData.summary === 'object' ? listData.summary : {}
  const raw = Array.isArray(listData.promoCodes) ? listData.promoCodes : []

  return {
    viewTabs: ['Notifications', 'Promo codes'],
    promoCodes: {
      title: 'Promo codes',
      subtitle: 'Discount codes & coupons',
      action: 'New promo code',
      stats: [
        {
          label: 'Active codes',
          value: formatCount(summary.activeCodes),
          tone: 'ink',
        },
        {
          label: 'Redemptions (30d)',
          value: formatCount(summary.redemptions30d),
          tone: 'ink',
        },
        {
          label: 'Discount given',
          value: formatMoney(summary.discountGiven),
          tone: 'orange',
        },
        {
          label: 'Revenue from codes',
          value: formatMoney(summary.revenueFromCodes),
          tone: 'green',
        },
      ],
      columns: ['Code', 'Description', 'Type', 'Max disc.', 'Used / limit', 'Status', 'Expiry'],
      rows: raw.filter((item) => item && item.id).map(mapPromoRow),
      page: Number(listData.page) || 1,
      limit: Number(listData.limit) || 20,
      total: Number(listData.total) || raw.length,
    },
  }
}

function parseMoneyNumber(value) {
  if (value == null || value === '') return null
  if (typeof value === 'number' && Number.isFinite(value)) return value
  const cleaned = String(value).replace(/[^0-9.-]/g, '')
  if (!cleaned) return null
  const num = Number(cleaned)
  return Number.isFinite(num) ? num : null
}

function parseOptionalInt(value) {
  if (value == null || value === '') return null
  const num = Number(String(value).replace(/[^0-9.-]/g, ''))
  if (!Number.isFinite(num)) return null
  return Math.trunc(num)
}

/** UI discount type label → API discountType. */
export function mapPromoDiscountTypeToApi(discountType) {
  const raw = String(discountType || '').trim().toLowerCase()
  if (!raw) return 'PERCENT'
  if (raw.includes('percent') || raw === 'percentage %' || raw === '%') return 'PERCENT'
  if (raw.includes('fixed')) return 'FIXED'
  if (raw.includes('free') || raw.includes('delivery')) return 'FREE_DELIVERY'
  if (raw.includes('bogo')) return 'BOGO'
  if (raw === 'percent' || raw === 'fixed' || raw === 'free_delivery' || raw === 'bogo') {
    return raw.toUpperCase()
  }
  return String(discountType).trim().toUpperCase().replace(/\s+/g, '_')
}

/**
 * Map Create promo form → POST /admin/marketing/promo-codes body.
 * Confirmed: code, description, discountType, discountValue, maxDiscountAmount, maxUses, isActive
 *
 * UI-only (not sent until confirmed on API): min order, audience, dates, scope, channels.
 */
export function mapAdminCreatePromoCodeRequest(form = {}) {
  const code = String(form.code || '').trim().toUpperCase()
  if (!code) {
    throw new ApiError({ message: 'Promo code is required.' })
  }

  const description = String(form.description || '').trim()
  if (!description) {
    throw new ApiError({ message: 'Description is required.' })
  }

  const discountType = mapPromoDiscountTypeToApi(form.discountType)
  const discountValue =
    discountType === 'FREE_DELIVERY'
      ? Number(form.discountValue) || 0
      : parseMoneyNumber(form.discountValue)

  if (discountType !== 'FREE_DELIVERY' && (discountValue == null || discountValue < 0)) {
    throw new ApiError({ message: 'Discount value is required.' })
  }

  const body = {
    code,
    description,
    discountType,
    discountValue: discountValue == null ? 0 : discountValue,
    isActive: form.isActive !== false,
  }

  const maxDiscountAmount = parseMoneyNumber(form.maxDiscountAmount ?? form.maxDiscount)
  if (maxDiscountAmount != null) {
    body.maxDiscountAmount = maxDiscountAmount
  }

  const maxUses = parseOptionalInt(form.maxUses ?? form.totalUsageLimit)
  if (maxUses != null) {
    body.maxUses = maxUses
  }

  return body
}
