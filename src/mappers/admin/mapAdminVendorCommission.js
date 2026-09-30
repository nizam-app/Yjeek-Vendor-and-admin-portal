import { ApiError } from '../../api/errors.js'

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

export const COMMISSION_ORDER_METHODS = [
  { id: 'delivery', label: 'Delivery' },
  { id: 'dineIn', label: 'Dine In' },
  { id: 'pickup', label: 'Pickup' },
  { id: 'services', label: 'Services' },
  { id: 'scheduled', label: 'Scheduled' },
]

/** Wizard / SLA service-mode labels → commission method id. */
export const COMMISSION_METHOD_TO_SERVICE_LABEL = {
  delivery: 'Hot food · on demand',
  dineIn: 'Dine-in',
  pickup: 'Pickup',
  services: 'Services',
  scheduled: 'Scheduled delivery',
}

/**
 * Commission tabs for vendor UI — only methods the vendor has enabled (SLA service modes).
 *
 * @param {string[]} serviceLabels e.g. from mapAdminServiceModesToLabels or slaVisibleServiceModes
 */
export function commissionOrderMethodsForServiceLabels(serviceLabels = []) {
  const labelSet = new Set(
    (Array.isArray(serviceLabels) ? serviceLabels : [])
      .map((item) => String(item || '').trim())
      .filter(Boolean),
  )
  if (!labelSet.size) return []
  return COMMISSION_ORDER_METHODS.filter((method) =>
    labelSet.has(COMMISSION_METHOD_TO_SERVICE_LABEL[method.id]),
  )
}

/**
 * Keep only commission method slices the vendor may use (PATCH / create body).
 *
 * @param {Record<string, unknown>} drafts
 * @param {string[]} enabledMethodIds
 */
export function filterCommissionDraftsByMethodIds(drafts = {}, enabledMethodIds = []) {
  const allowed = new Set(
    (Array.isArray(enabledMethodIds) ? enabledMethodIds : [])
      .map((id) => String(id || '').trim())
      .filter(Boolean),
  )
  if (!allowed.size) return {}
  const out = {}
  for (const method of COMMISSION_ORDER_METHODS) {
    if (allowed.has(method.id) && drafts[method.id]) {
      out[method.id] = drafts[method.id]
    }
  }
  return out
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
 * Backend expects type: 'BHD' | 'PERCENT' (not '%').
 */
export function mapWizardCustomFeesToApi(customFees) {
  if (!Array.isArray(customFees)) return []
  return customFees
    .map((fee) => {
      if (!fee || typeof fee !== 'object') return null
      const name = String(fee.name || '').trim()
      if (!name) return null
      let amount = parseOptionalNumber(fee.amount)
      let type = fee.type === '%' || fee.type === 'PERCENT' ? 'PERCENT' : 'BHD'
      if (amount == null && fee.value) {
        const raw = String(fee.value)
        if (/%/.test(raw)) {
          type = 'PERCENT'
          amount = parseOptionalNumber(stripPercent(raw))
        } else {
          type = 'BHD'
          amount = parseOptionalNumber(stripCurrency(raw))
        }
      }
      if (amount == null) return null
      return { name, amount, type }
    })
    .filter(Boolean)
}

/**
 * Map GET/PATCH commission `data` → detail-tab UI object.
 * Confirmed response fields from Postman screenshots.
 * OG §08 / D08 Batch 5: inheritance + seededFromStoreType for badges/banner;
 * platformServiceFee may still arrive from API but must not drive the Commission screen.
 */
function mapCommissionBlock(block, parent = {}) {
  const data = {
    ...parent,
    ...block,
    inheritance: block?.inheritance ?? parent?.inheritance ?? null,
    seededFromStoreType: parent?.seededFromStoreType ?? block?.seededFromStoreType,
    currency: block?.currency ?? parent?.currency ?? null,
    platformServiceFee: block?.platformServiceFee ?? parent?.platformServiceFee,
    vatOnCommissionPct: block?.vatOnCommissionPct ?? parent?.vatOnCommissionPct,
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new ApiError({
      message: 'Invalid vendor commission response from the server.',
    })
  }

  const currency = data.currency ? String(data.currency) : '—'
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
  const vatPct = parseOptionalNumber(data.vatOnCommissionPct)
  const inheritance =
    data.inheritance && typeof data.inheritance === 'object' ? data.inheritance : null

  return {
    modelCode,
    model: modelLabel,
    rate,
    commissionRate: commissionRate != null && !Number.isNaN(commissionRate) ? commissionRate : null,
    flatFeePerOrder:
      flatFeePerOrder != null && !Number.isNaN(flatFeePerOrder) ? flatFeePerOrder : null,
    commissionTiers,
    customFees,
    /** Kept for legacy callers; Commission UI must not render this (OG §08). */
    platformServiceFee: formatMoney(data.platformServiceFee, currency),
    platformServiceFeeAmount: parseOptionalNumber(data.platformServiceFee),
    vatOnCommission: vatPct != null ? `${vatPct}%` : '—',
    vatOnCommissionPct: vatPct,
    currency,
    label: data.label ? String(data.label) : null,
    gatewayFees: {
      fixedPct: formatGatewayField(gateway.fixedPct),
      debitPct: formatGatewayField(gateway.debitPct),
      creditPct: formatGatewayField(gateway.creditPct),
      applePayPct: formatGatewayField(gateway.applePayPct),
      googleWalletPct: formatGatewayField(gateway.googleWalletPct),
      otherChargesPct: formatGatewayField(gateway.otherChargesPct),
      fixedCharge: formatGatewayField(gateway.fixedCharge),
    },
    inheritance,
    seededFromStoreType: Boolean(data.seededFromStoreType ?? inheritance),
    raw: block,
  }
}

export function mapAdminVendorCommissionResponse(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new ApiError({
      message: 'Invalid vendor commission response from the server.',
    })
  }
  const sourceMethods =
    data.methods && typeof data.methods === 'object' && !Array.isArray(data.methods)
      ? data.methods
      : null
  const methods = {}
  for (const method of COMMISSION_ORDER_METHODS) {
    methods[method.id] = mapCommissionBlock(sourceMethods?.[method.id] || data, data)
  }
  return {
    ...methods.delivery,
    methods,
  }
}

/**
 * Apply mapped commission → Edit vendor wizard step-4 form fields.
 * OG §08: no platform service fee; VAT + currency are display-only on the screen.
 */
export function mapAdminCommissionToWizardForm(commission) {
  if (!commission) return {}
  const gateway = commission.gatewayFees || {}
  const vatPct =
    commission.vatOnCommissionPct != null
      ? commission.vatOnCommissionPct
      : parseOptionalNumber(stripPercent(commission.vatOnCommission))

  let commissionRate = ''
  if (commission.modelCode === 'FLAT_PER_ORDER' && commission.flatFeePerOrder != null) {
    commissionRate = String(commission.flatFeePerOrder)
  } else if (commission.commissionRate != null) {
    commissionRate = String(commission.commissionRate)
  } else if (commission.rate && commission.rate !== '—') {
    commissionRate = stripPercent(stripCurrency(commission.rate))
  }

  return {
    commissionModel: COMMISSION_MODEL_TO_UI[commission.modelCode] || commission.model || '% of order',
    commissionRate,
    vatOnCommission: vatPct != null ? `${vatPct}%` : '',
    currency: commission.currency && commission.currency !== '—' ? String(commission.currency) : '',
    fixedPct: gateway.fixedPct || '',
    debitPct: gateway.debitPct || '',
    creditPct: gateway.creditPct || '',
    applePayPct: gateway.applePayPct || '',
    googleWalletPct: gateway.googleWalletPct || '',
    otherChargesPct: gateway.otherChargesPct || '',
    fixedCharge: gateway.fixedCharge || '',
  }
}

/**
 * Shared PATCH fields for gateway only.
 * Does NOT send platformServiceFee (removed from Commission screen — OG §08).
 * Does NOT send vatOnCommissionPct / currency (read-only on screen).
 */
function appendSharedCommissionFields(body, form = {}) {
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
 * OG §08: custom fees apply for every model; no platformServiceFee / VAT / currency writes.
 */
export function mapAdminUpdateVendorCommissionRequest(form = {}) {
  if (form.methods && typeof form.methods === 'object' && !Array.isArray(form.methods)) {
    const methods = {}
    for (const method of COMMISSION_ORDER_METHODS) {
      const slice = form.methods[method.id]
      if (!slice || typeof slice !== 'object') continue
      methods[method.id] = mapAdminUpdateVendorCommissionRequest({
        ...slice,
        methods: undefined,
      })
    }
    if (Object.keys(methods).length) return { methods }
  }

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
  }

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
            const type = typeRaw === '%' || typeRaw === 'PERCENT' ? 'PERCENT' : 'BHD'
            return { name, amount, type }
          })
          .filter(Boolean)
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
    body.customFees = mapWizardCustomFeesToApi(customFees)
  } else if (model === 'FLAT_PER_ORDER') {
    const flat = parseOptionalNumber(stripPercent(form.commissionRate) || form.commissionRate)
    if (flat != null) body.flatFeePerOrder = flat
    body.customFees = mapWizardCustomFeesToApi(customFees)
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
  } else {
    body.customFees = mapWizardCustomFeesToApi(customFees)
  }

  if (includeSharedFees) {
    appendSharedCommissionFields(body, {
      ...form,
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

const WIZARD_COMMISSION_FIELD_KEYS = [
  'commissionModel',
  'commissionRate',
  'vatOnCommission',
  'currency',
  'fixedPct',
  'debitPct',
  'creditPct',
  'applePayPct',
  'googleWalletPct',
  'otherChargesPct',
  'fixedCharge',
]

export function snapshotWizardCommissionSlice(
  form = {},
  customFees = [],
  commissionTiers = [],
  inheritance = null,
) {
  const slice = {}
  for (const key of WIZARD_COMMISSION_FIELD_KEYS) slice[key] = form?.[key]
  return {
    ...slice,
    customFees: Array.isArray(customFees) ? customFees.map((fee) => ({ ...fee })) : [],
    commissionTiers: Array.isArray(commissionTiers)
      ? commissionTiers.map((tier) => ({ ...tier }))
      : [],
    inheritance: inheritance || null,
  }
}

export function wizardCommissionDraftsFromMapped(mapped) {
  const drafts = {}
  for (const method of COMMISSION_ORDER_METHODS) {
    const block = mapped?.methods?.[method.id] || mapped
    drafts[method.id] = {
      ...mapAdminCommissionToWizardForm(block),
      customFees: mapAdminCustomFeesToWizard(block?.customFees),
      commissionTiers: Array.isArray(block?.commissionTiers) ? block.commissionTiers : [],
      inheritance: block?.inheritance || mapped?.inheritance || null,
    }
  }
  return drafts
}

/** Resolve inheritance state for a scalar / gateway field path. */
export function getCommissionInheritanceState(inheritance, path) {
  if (!inheritance || typeof inheritance !== 'object') return null
  const parts = String(path || '').split('.')
  let cursor = inheritance
  for (const part of parts) {
    if (!cursor || typeof cursor !== 'object') return null
    cursor = cursor[part]
  }
  if (!cursor || typeof cursor !== 'object') return null
  return cursor.state === 'overridden' || cursor.state === 'inherited' ? cursor.state : null
}
