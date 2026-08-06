import { ApiError } from '../../api/errors'
import { localDateToEndIso, localDateToStartIso } from '../../components/admin/AdminDatePicker'

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

function mapIdList(value) {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => {
      if (item && typeof item === 'object') return String(item.id || '').trim()
      return String(item || '').trim()
    })
    .filter(Boolean)
}

/**
 * Map Create promo form → POST /admin/marketing/promo-codes body.
 * Matches admin Create promo UI + upsertPromoCodeSchema.
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
    audience: mapPromoAudienceToApi(form.audience),
    scope: mapPromoScopeToApi(form.scope),
    channels: mapPromoChannelsToApi(form.channels),
    vendorIds: [],
    categoryIds: [],
    serviceIds: [],
  }

  const maxDiscountAmount = parseMoneyNumber(form.maxDiscountAmount ?? form.maxDiscount)
  if (maxDiscountAmount != null) {
    body.maxDiscountAmount = maxDiscountAmount
  }

  const minOrderAmount = parseMoneyNumber(form.minOrderAmount ?? form.minOrder)
  if (minOrderAmount != null) {
    body.minOrderAmount = minOrderAmount
  }

  const maxUses = parseOptionalInt(form.maxUses ?? form.totalUsageLimit)
  if (maxUses != null) {
    body.maxUses = maxUses
  }

  const maxUsesPerCustomer = parseOptionalInt(
    form.maxUsesPerCustomer ?? form.perCustomerLimit,
  )
  if (maxUsesPerCustomer != null) {
    body.maxUsesPerCustomer = maxUsesPerCustomer
  }

  const vendorIds = mapIdList(
    form.vendorIds ?? form.selectedVendors ?? form.selectedTargets,
  )
  const categoryIds = mapIdList(form.categoryIds)
  const serviceIds = mapIdList(form.serviceIds)

  if (body.scope === 'SPECIFIC_VENDORS') {
    body.vendorIds = vendorIds
    if (!vendorIds.length) {
      throw new ApiError({ message: 'Select at least one vendor for Specific vendors scope.' })
    }
  }

  if (body.scope === 'CATEGORIES') {
    body.categoryIds = categoryIds.length ? categoryIds : vendorIds
  }

  if (body.scope === 'SERVICES') {
    body.serviceIds = serviceIds.length ? serviceIds : vendorIds
  }

  const startsAt = localDateToStartIso(form.validFrom ?? form.startsAt)
  if (startsAt) body.startsAt = startsAt

  const endsAt = localDateToEndIso(form.validTo ?? form.endsAt)
  if (endsAt) body.endsAt = endsAt

  if (startsAt && endsAt && new Date(endsAt).getTime() < new Date(startsAt).getTime()) {
    throw new ApiError({ message: 'Valid to must be on or after Valid from.' })
  }

  return body
}

export function mapPromoAudienceToApi(audience) {
  const raw = String(audience || '').trim().toLowerCase()
  if (raw.includes('new')) return 'NEW_CUSTOMERS'
  if (raw.includes('returning')) return 'RETURNING_CUSTOMERS'
  if (raw.includes('vip')) return 'VIP_SEGMENT'
  if (raw === 'new_customers') return 'NEW_CUSTOMERS'
  if (raw === 'returning_customers') return 'RETURNING_CUSTOMERS'
  if (raw === 'vip_segment') return 'VIP_SEGMENT'
  return 'ALL_CUSTOMERS'
}

export function mapPromoScopeToApi(scope) {
  const raw = String(scope || '').trim().toLowerCase()
  if (raw.includes('vendor') || raw === 'specific_vendors') return 'SPECIFIC_VENDORS'
  if (raw.includes('categor') || raw === 'categories') return 'CATEGORIES'
  if (raw.includes('service') || raw === 'services') return 'SERVICES'
  return 'ALL_STORES'
}

export function mapPromoChannelsToApi(channels) {
  const list = Array.isArray(channels) ? channels : []
  const mapped = list
    .map((item) => {
      const raw = String(item || '').trim().toLowerCase()
      if (raw === 'app') return 'APP'
      if (raw.includes('auto')) return 'AUTO_APPLY'
      if (raw.includes('banner') || raw.includes('home')) return 'HOME_BANNER'
      if (raw.includes('push')) return 'PUSH'
      if (['APP', 'AUTO_APPLY', 'HOME_BANNER', 'PUSH'].includes(String(item))) return String(item)
      return null
    })
    .filter(Boolean)
  return mapped.length ? [...new Set(mapped)] : ['APP']
}
