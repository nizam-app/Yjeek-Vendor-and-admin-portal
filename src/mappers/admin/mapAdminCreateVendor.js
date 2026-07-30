import { ApiError } from '../../api/errors'
import {
  COMMISSION_UI_TO_MODEL,
  mapWizardCustomFeesToApi,
} from './mapAdminVendorCommission'

const SERVICE_MODE_UI_TO_API = {
  'Hot food · on demand': 'hotFoodOnDemand',
  'Dine-in': 'dineIn',
  Pickup: 'pickup',
  'Scheduled delivery': 'scheduledDelivery',
  Services: 'services',
}

function trim(value) {
  return String(value ?? '').trim()
}

function num(value) {
  if (value == null || value === '') return null
  const n = Number(value)
  return Number.isNaN(n) ? null : n
}

function stripPercent(value) {
  return String(value ?? '')
    .replace(/%/g, '')
    .replace(/\(auto\)/gi, '')
    .trim()
}

/**
 * Split "+973 3812 1212" → { countryCode, phone }.
 * Owner phone is digits (no spaces) to match create-vendor owner.phone + countryCode split.
 */
export function splitOwnerPhone(phoneRaw, fallbackCountryCode = '+973') {
  const raw = trim(phoneRaw)
  const match = raw.match(/^(\+\d{1,4})\s*(.*)$/)
  if (match) {
    return {
      countryCode: match[1],
      phone: trim(match[2]).replace(/[^\d]/g, '') || raw.replace(/[^\d]/g, ''),
    }
  }
  return {
    countryCode: trim(fallbackCountryCode) || '+973',
    phone: raw.replace(/[^\d]/g, '') || raw,
  }
}

function mapCreateBranches(branches = []) {
  return (Array.isArray(branches) ? branches : [])
    .map((branch, index) => {
      if (!branch || typeof branch !== 'object') return null
      const name = trim(branch.name)
      if (!name) return null

      const area = trim(branch.area || branch.areaCity || '')
      const city = trim(branch.city || '') || area
      const address = trim(branch.address || '')
      const phone = trim(branch.phone || '')
      const latitude = num(branch.latitude) ?? 26.2285
      const longitude = num(branch.longitude) ?? 50.535
      const deliveryRadiusKm = num(branch.deliveryRadiusKm ?? branch.radiusKm ?? branch.radius)
      const minOrderAmount = num(branch.minOrderAmount ?? branch.minOrderValue ?? branch.minOrder)
      const etaMin = num(branch.etaMin ?? branch.eta)

      const item = {
        name,
        address: address || name,
        area: area || city || 'Manama',
        city: city || area || 'Manama',
        // Branch phone includes country code (Postman sample: "+973 1770 0001")
        phone: phone || '+973 1700 0000',
        latitude,
        longitude,
        isPrimary: Boolean(branch.isPrimary) || index === 0,
      }

      if (deliveryRadiusKm != null) item.deliveryRadiusKm = deliveryRadiusKm
      if (minOrderAmount != null) item.minOrderAmount = minOrderAmount
      if (etaMin != null) item.etaMin = etaMin

      return item
    })
    .filter(Boolean)
}

function mapAdditionalUsers(users = [], branches = []) {
  return (Array.isArray(users) ? users : [])
    .map((user) => {
      if (!user || typeof user !== 'object') return null
      const displayName = trim(user.name || user.displayName || user.fullName)
      const email = trim(user.email)
      const password = trim(user.password)
      if (!displayName || !email) return null
      if (!password) {
        throw new ApiError({
          message: `Additional user "${displayName}" needs a password before creating the vendor.`,
        })
      }

      const roleRaw = trim(user.role || 'BRANCH_MANAGER').toUpperCase().replace(/\s+/g, '_')
      const role =
        roleRaw.includes('ADMIN') || roleRaw.includes('OWNER')
          ? 'VENDOR_ADMIN'
          : roleRaw.includes('STAFF')
            ? 'STAFF'
            : 'BRANCH_MANAGER'

      let branchIndex = 0
      if (user.branchIndex != null && !Number.isNaN(Number(user.branchIndex))) {
        branchIndex = Number(user.branchIndex)
      } else if (user.branchId || user.branch) {
        const idx = branches.findIndex(
          (b) =>
            String(b.id) === String(user.branchId) ||
            String(b.name) === String(user.branch) ||
            String(b.name).includes(String(user.branch || '')),
        )
        if (idx >= 0) branchIndex = idx
      }

      const phoneRaw = trim(user.phone)
      const item = {
        displayName,
        email,
        password,
        role,
        branchIndex,
      }
      if (phoneRaw) item.phone = phoneRaw
      return item
    })
    .filter(Boolean)
}

function mapCommission(form = {}, { customFees = [], commissionTiers = [] } = {}) {
  const model =
    COMMISSION_UI_TO_MODEL[form.commissionModel] ||
    (form.commissionModel && String(form.commissionModel).includes('_')
      ? form.commissionModel
      : 'PERCENT_OF_ORDER')

  const commission = { model }

  if (model === 'PERCENT_OF_ORDER') {
    const rate = num(stripPercent(form.commissionRate))
    if (rate != null) commission.commissionRate = rate
  } else if (model === 'FLAT_PER_ORDER') {
    const flat = num(stripPercent(form.commissionRate))
    if (flat != null) commission.flatFeePerOrder = flat
  } else if (model === 'TIERED') {
    const tiers = (Array.isArray(commissionTiers) ? commissionTiers : [])
      .map((tier) => {
        const fromAmount = num(tier.fromAmount)
        const ratePct = num(tier.ratePct)
        if (fromAmount == null || ratePct == null) return null
        return { fromAmount, ratePct }
      })
      .filter(Boolean)
    commission.commissionTiers = tiers.length
      ? tiers
      : [{ fromAmount: 0, ratePct: num(stripPercent(form.commissionRate)) || 15 }]
    commission.customFees = mapWizardCustomFeesToApi(customFees)
  }

  const platform = num(form.serviceFee)
  if (platform != null) commission.platformServiceFee = platform

  const vat = num(stripPercent(form.vatOnCommission))
  if (vat != null) commission.vatOnCommissionPct = vat

  return commission
}

function mapServiceModes(selectedModes = []) {
  const serviceModes = {
    hotFoodOnDemand: false,
    dineIn: false,
    pickup: false,
    scheduledDelivery: false,
    services: false,
  }

  for (const label of selectedModes) {
    const key = SERVICE_MODE_UI_TO_API[label]
    if (key) serviceModes[key] = true
  }

  // Sensible default if nothing selected
  if (!Object.values(serviceModes).some(Boolean)) {
    serviceModes.hotFoodOnDemand = true
    serviceModes.pickup = true
  }

  return serviceModes
}

function mapSla(form = {}, selectedModes = []) {
  const sla = {
    serviceModes: mapServiceModes(selectedModes),
    config: {},
  }

  const slaModelId = trim(form.slaModelId)
  if (slaModelId) sla.slaModelId = slaModelId

  const acceptance = num(stripPercent(form.acceptSla).replace(/min/gi, ''))
  const prep = num(stripPercent(form.prepSla).replace(/min/gi, ''))
  if (acceptance != null) sla.config.acceptanceCutoffMin = acceptance
  if (prep != null) sla.config.prepTimeHotFoodMin = prep

  if (!Object.keys(sla.config).length) {
    sla.config = {
      acceptanceCutoffMin: 2,
      prepTimeHotFoodMin: 18,
    }
  }

  return sla
}

/**
 * Map Add Vendor wizard state → POST /admin/vendors body.
 * Confirmed Postman create-vendor wizard shape.
 *
 * @param {object} input
 * @param {object} input.form
 * @param {array} input.branches
 * @param {array} input.users — additional users (not owner)
 * @param {array} [input.customFees]
 * @param {array} [input.commissionTiers]
 * @param {array} [input.serviceModes]
 * @param {boolean} [input.activate]
 */
export function mapAdminCreateVendorRequest(input = {}) {
  const {
    form = {},
    branches = [],
    users = [],
    customFees = [],
    commissionTiers = [],
    serviceModes = [],
    activate = false,
  } = input

  const name = trim(form.storeName || form.name)
  if (!name) {
    throw new ApiError({ message: 'Store name is required.' })
  }

  const storeTypeId = trim(form.storeTypeId)
  if (!storeTypeId) {
    throw new ApiError({ message: 'Store type is required. Select a type from the list.' })
  }

  const ownerName = trim(form.ownerName)
  const ownerEmail = trim(form.ownerEmail)
  const ownerPassword = trim(form.ownerPassword)
  if (!ownerName || !ownerEmail || !ownerPassword) {
    throw new ApiError({ message: 'Owner name, email, and password are required.' })
  }

  const mappedBranches = mapCreateBranches(branches)
  if (!mappedBranches.length) {
    throw new ApiError({ message: 'Add at least one branch before creating the vendor.' })
  }

  const { countryCode, phone } = splitOwnerPhone(form.ownerPhone, form.ownerCountryCode)

  const body = {
    name,
    legalName: trim(form.legalName) || name,
    storeTypeId,
    categoryLabel: trim(form.storeType) || undefined,
    description: trim(form.description) || undefined,
    logoUrl: trim(form.logoUrl) || undefined,
    coverUrl: trim(form.coverUrl) || undefined,
    city: trim(form.city) || undefined,
    area: trim(form.area) || undefined,
    crNumber: trim(form.crNumber) || undefined,
    vatNumber: trim(form.vatNumber) || undefined,
    branches: mappedBranches,
    owner: {
      fullName: ownerName,
      email: ownerEmail,
      phone: phone || trim(form.ownerPhone),
      countryCode,
      password: ownerPassword,
    },
    commission: mapCommission(form, { customFees, commissionTiers }),
    sla: mapSla(form, serviceModes),
    activate: Boolean(activate),
  }

  const additionalUsers = mapAdditionalUsers(users, branches)
  if (additionalUsers.length) body.additionalUsers = additionalUsers

  // Drop undefined keys at top level
  for (const key of Object.keys(body)) {
    if (body[key] === undefined) delete body[key]
  }

  return body
}
