import { ApiError } from '../../api/errors'

export const COMMISSION_MODEL_TO_UI = {
  PERCENT_OF_ORDER: '% of order',
  FLAT_PER_ORDER: 'Flat per order',
  TIERED: 'Tiered',
}

export const COMMISSION_UI_TO_MODEL = {
  '% of order': 'PERCENT_OF_ORDER',
  'Flat per order': 'FLAT_PER_ORDER',
  Tiered: 'TIERED',
}

function stripPercent(value) {
  if (value == null || value === '') return ''
  return String(value).replace(/%/g, '').replace(/\(auto\)/gi, '').trim()
}

function stripCurrency(value) {
  if (value == null || value === '' || value === '—') return ''
  return String(value)
    .replace(/^BHD\s*/i, '')
    .replace(/\(fixed\)/gi, '')
    .trim()
}

function formatPct(value) {
  if (value == null || value === '') return '—'
  const num = Number(value)
  if (Number.isNaN(num)) return String(value)
  return `${num}%`
}

function formatMoney(value, currency = 'BHD') {
  if (value == null || value === '') return '—'
  const num = Number(value)
  if (Number.isNaN(num)) return String(value)
  return `${currency} ${num.toFixed(3)}`
}

function formatGatewayField(value) {
  if (value == null || value === '') return ''
  const num = Number(value)
  if (Number.isNaN(num)) return String(value)
  return num.toFixed(3)
}

function parseOptionalNumber(value) {
  if (value == null || value === '') return null
  const num = Number(value)
  return Number.isNaN(num) ? null : num
}

function mapCommissionTiers(raw) {
  if (!Array.isArray(raw)) return []
  return raw
    .map((tier) => {
      if (!tier || typeof tier !== 'object') return null
      const fromAmount = parseOptionalNumber(tier.fromAmount)
      const ratePct = parseOptionalNumber(tier.ratePct)
      if (fromAmount == null || ratePct == null) return null
      return { fromAmount, ratePct }
    })
    .filter(Boolean)
}

/**
 * API customFees[] → wizard "Added fees" rows.
 * Empty array is valid — do not invent fees.
 */
export function mapAdminCustomFeesToWizard(customFees) {
  if (!Array.isArray(customFees)) return []
  return customFees
    .map((fee, index) => {
      if (!fee || typeof fee !== 'object') return null
      const name = String(fee.name || '').trim()
      if (!name) return null
      const amount = parseOptionalNumber(fee.amount)
      const typeRaw = String(fee.type || 'BHD').trim().toUpperCase()
      const type = typeRaw === '%' || typeRaw === 'PERCENT' || typeRaw === 'PCT' ? '%' : 'BHD'
      const value =
        type === '%'
          ? `${amount != null ? amount : fee.amount} %`
          : `BHD ${amount != null ? amount.toFixed(3) : String(fee.amount ?? '')}`
      return {
        id: fee.id != null ? String(fee.id) : `fee-${index}-${name}`,
        name,
        value,
        amount: amount != null ? amount : 0,
        type,
      }
    })
    .filter(Boolean)
}

/**
 * Wizard custom fee rows → API customFees[].
 */
export function mapWizardCustomFeesToApi(customFees) {
  if (!Array.isArray(customFees)) return []
  return customFees
    .map((fee) => {
      if (!fee || typeof fee !== 'object') return null
      const name = String(fee.name || '').trim()
      if (!name) return null
      let amount = parseOptionalNumber(fee.amount)
      let type = fee.type === '%' ? '%' : 'BHD'
      if (amount == null && fee.value) {
        const raw = String(fee.value)
        if (/%/.test(raw)) {
          type = '%'
          amount = parseOptionalNumber(stripPercent(raw))
        } else {
          type = 'BHD'
          amount = parseOptionalNumber(stripCurrency(raw))
        }
      }
      if (amount == null) return null
      return { name, amount, type: type === '%' ? '%' : 'BHD' }
    })
    .filter(Boolean)
}

/**
 * Map GET/PATCH commission `data` → detail-tab UI object.
 * Confirmed response fields from Postman screenshots.
 */
export function mapAdminVendorCommissionResponse(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new ApiError({
      message: 'Invalid vendor commission response from the server.',
    })
  }

  const currency = data.currency ? String(data.currency) : 'BHD'
  const modelCode = data.model ? String(data.model) : null
  const modelLabel = (modelCode && COMMISSION_MODEL_TO_UI[modelCode]) || (modelCode || '—')

  const commissionRate =
    data.commissionRate != null && data.commissionRate !== ''
      ? Number(data.commissionRate)
      : null
  const flatFeePerOrder =
    data.flatFeePerOrder != null && data.flatFeePerOrder !== ''
      ? Number(data.flatFeePerOrder)
      : null

  let rate = '—'
  if (modelCode === 'FLAT_PER_ORDER' && flatFeePerOrder != null && !Number.isNaN(flatFeePerOrder)) {
    rate = formatMoney(flatFeePerOrder, currency)
  } else if (commissionRate != null && !Number.isNaN(commissionRate)) {
    rate = formatPct(commissionRate)
  } else if (flatFeePerOrder != null && !Number.isNaN(flatFeePerOrder)) {
    rate = formatMoney(flatFeePerOrder, currency)
  }

  const gateway = data.gatewayFees && typeof data.gatewayFees === 'object' ? data.gatewayFees : {}
  const commissionTiers = mapCommissionTiers(data.commissionTiers)
  const customFees = Array.isArray(data.customFees) ? data.customFees : []

  return {
    modelCode,
    model: modelLabel,
    rate,
    commissionRate: commissionRate != null && !Number.isNaN(commissionRate) ? commissionRate : null,
    flatFeePerOrder:
      flatFeePerOrder != null && !Number.isNaN(flatFeePerOrder) ? flatFeePerOrder : null,
    commissionTiers,
    customFees,
    platformServiceFee: formatMoney(data.platformServiceFee, currency),
    platformServiceFeeAmount: parseOptionalNumber(data.platformServiceFee),
    vatOnCommission: formatPct(data.vatOnCommissionPct),
    vatOnCommissionPct: parseOptionalNumber(data.vatOnCommissionPct),
    currency,
    gatewayFees: {
      fixedPct: formatGatewayField(gateway.fixedPct),
      debitPct: formatGatewayField(gateway.debitPct),
      creditPct: formatGatewayField(gateway.creditPct),
      applePayPct: formatGatewayField(gateway.applePayPct),
      googleWalletPct: formatGatewayField(gateway.googleWalletPct),
      otherChargesPct: formatGatewayField(gateway.otherChargesPct),
      fixedCharge: formatGatewayField(gateway.fixedCharge),
    },
    raw: data,
  }
}

/**
 * Apply mapped commission → Edit vendor wizard step-4 form fields.
 */
export function mapAdminCommissionToWizardForm(commission) {
  if (!commission) return {}
  const gateway = commission.gatewayFees || {}
  const currencyCode = commission.currency || 'BHD'
  const vat =
    commission.vatOnCommissionPct != null
      ? `${commission.vatOnCommissionPct}% (auto)`
      : commission.vatOnCommission && commission.vatOnCommission !== '—'
        ? `${stripPercent(commission.vatOnCommission)}% (auto)`
        : '10% (auto)'

  let commissionRate = '15'
  if (commission.modelCode === 'FLAT_PER_ORDER' && commission.flatFeePerOrder != null) {
    commissionRate = String(commission.flatFeePerOrder)
  } else if (commission.commissionRate != null) {
    commissionRate = String(commission.commissionRate)
  } else if (commission.rate && commission.rate !== '—') {
    commissionRate = stripPercent(stripCurrency(commission.rate)) || '15'
  }

  return {
    commissionModel: COMMISSION_MODEL_TO_UI[commission.modelCode] || commission.model || '% of order',
    commissionRate,
    serviceFee:
      commission.platformServiceFeeAmount != null
        ? Number(commission.platformServiceFeeAmount).toFixed(3)
        : stripCurrency(commission.platformServiceFee) || '0.300',
    vatOnCommission: vat,
    currency: `${currencyCode} (fixed)`,
    fixedPct: gateway.fixedPct || '1.000',
    debitPct: gateway.debitPct || '0.500',
    creditPct: gateway.creditPct || '2.000',
    applePayPct: gateway.applePayPct || '1.500',
    googleWalletPct: gateway.googleWalletPct || '1.500',
    otherChargesPct: gateway.otherChargesPct || '0.500',
    fixedCharge: gateway.fixedCharge || '0.050',
  }
}

function appendSharedCommissionFields(body, form = {}) {
  const platformFee = parseOptionalNumber(
    stripCurrency(form.platformServiceFee ?? form.serviceFee),
  )
  if (platformFee != null) body.platformServiceFee = platformFee

  const vat = parseOptionalNumber(stripPercent(form.vatOnCommission ?? form.vatOnCommissionPct))
  if (vat != null) body.vatOnCommissionPct = vat

  const currencyRaw = form.currency
  if (currencyRaw) {
    const currency = stripCurrency(currencyRaw).replace(/\s+/g, ' ').trim().split(' ')[0]
    if (currency) body.currency = currency
  }

  const gatewaySource = form.gatewayFees || {
    fixedPct: form.fixedPct,
    debitPct: form.debitPct,
    creditPct: form.creditPct,
    applePayPct: form.applePayPct,
    googleWalletPct: form.googleWalletPct,
    otherChargesPct: form.otherChargesPct,
    fixedCharge: form.fixedCharge,
  }

  if (gatewaySource && typeof gatewaySource === 'object') {
    const mapped = {}
    for (const key of [
      'fixedPct',
      'debitPct',
      'creditPct',
      'applePayPct',
      'googleWalletPct',
      'otherChargesPct',
      'fixedCharge',
    ]) {
      const num = parseOptionalNumber(gatewaySource[key])
      if (num != null) mapped[key] = num
    }
    if (Object.keys(mapped).length) body.gatewayFees = mapped
  }

  return body
}

/**
 * Map Edit commission modal / detail UI object → PATCH body.
 * Confirmed percent: { model, commissionRate }
 * Confirmed tiered: { model, commissionTiers, customFees }
 */
export function mapAdminUpdateVendorCommissionRequest(form = {}) {
  const body = {}

  const model =
    COMMISSION_UI_TO_MODEL[form.model] ||
    COMMISSION_UI_TO_MODEL[form.commissionModel] ||
    (form.modelCode && COMMISSION_MODEL_TO_UI[form.modelCode] ? form.modelCode : null) ||
    (typeof form.model === 'string' && form.model.includes('_') ? form.model : null)

  if (model) body.model = model

  if (model === 'PERCENT_OF_ORDER') {
    const rate = parseOptionalNumber(
      stripPercent(form.rate ?? form.commissionRate),
    )
    if (rate != null) body.commissionRate = rate
  } else if (model === 'FLAT_PER_ORDER') {
    const flat = parseOptionalNumber(
      stripCurrency(form.rate) ||
        form.flatFeePerOrder ||
        stripPercent(form.rate ?? form.commissionRate),
    )
    if (flat != null) body.flatFeePerOrder = flat
  } else if (model === 'TIERED') {
    const tiers = mapCommissionTiers(form.commissionTiers)
    body.commissionTiers = tiers
    if (Array.isArray(form.customFees)) {
      body.customFees = form.customFees[0]?.value != null
        ? mapWizardCustomFeesToApi(form.customFees)
        : form.customFees
            .map((fee) => {
              if (!fee || typeof fee !== 'object') return null
              const name = String(fee.name || '').trim()
              const amount = parseOptionalNumber(fee.amount)
              if (!name || amount == null) return null
              const typeRaw = String(fee.type || 'BHD').toUpperCase()
              const type = typeRaw === '%' || typeRaw === 'PERCENT' ? '%' : 'BHD'
              return { name, amount, type }
            })
            .filter(Boolean)
    }
  }

  return appendSharedCommissionFields(body, form)
}

/**
 * Map Edit vendor wizard step-4 form + custom fees → PATCH body.
 * Uses confirmed percent / tiered Postman shapes; also sends GET-confirmed fee fields when set.
 *
 * @param {object} form
 * @param {{ customFees?: array, commissionTiers?: array, includeSharedFees?: boolean }} [options]
 */
export function mapAdminWizardCommissionRequest(form = {}, options = {}) {
  const {
    customFees = [],
    commissionTiers = [],
    includeSharedFees = true,
  } = options

  const model = COMMISSION_UI_TO_MODEL[form.commissionModel] || null
  const body = {}
  if (model) body.model = model

  if (model === 'PERCENT_OF_ORDER') {
    const rate = parseOptionalNumber(stripPercent(form.commissionRate))
    if (rate != null) body.commissionRate = rate
  } else if (model === 'FLAT_PER_ORDER') {
    const flat = parseOptionalNumber(stripPercent(form.commissionRate) || form.commissionRate)
    if (flat != null) body.flatFeePerOrder = flat
  } else if (model === 'TIERED') {
    let tiers = mapCommissionTiers(commissionTiers)
    // No tier editor on wizard — if API returned none, seed one tier from the rate field
    // so confirmed Tiered PATCH shape is still valid.
    if (!tiers.length) {
      const rate = parseOptionalNumber(stripPercent(form.commissionRate))
      if (rate != null) tiers = [{ fromAmount: 0, ratePct: rate }]
    }
    body.commissionTiers = tiers
    body.customFees = mapWizardCustomFeesToApi(customFees)
  }

  if (includeSharedFees) {
    appendSharedCommissionFields(body, {
      ...form,
      platformServiceFee: form.serviceFee,
      gatewayFees: {
        fixedPct: form.fixedPct,
        debitPct: form.debitPct,
        creditPct: form.creditPct,
        applePayPct: form.applePayPct,
        googleWalletPct: form.googleWalletPct,
        otherChargesPct: form.otherChargesPct,
        fixedCharge: form.fixedCharge,
      },
    })
  }

  return body
}
