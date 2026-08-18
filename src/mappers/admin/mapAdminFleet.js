import { ApiError } from '../../api/errors'

const FLEET_COLUMNS = [
  'Champ name',
  'Champ ID',
  'Supplier',
  'Contact',
  'CPR',
  'Vehicle',
  'Allowed categories',
  'Daily cash limit',
  'Status',
  'Tier',
  '',
]

const STATUS_TABS = ['All', 'Online', 'On delivery', 'Offline', 'Suspended']

const AVATAR_PALETTE = [
  { bg: '#d8f0e0', text: '#147940' },
  { bg: '#dce8f8', text: '#2b66a5' },
  { bg: '#fff0d6', text: '#9a6510' },
  { bg: '#f1eafe', text: '#7752a8' },
  { bg: '#fdebec', text: '#bf3c36' },
  { bg: '#e8f6fb', text: '#2a7a96' },
]

function formatCount(value) {
  if (value === null || value === undefined || value === '') return '0'
  const numeric = Number(value)
  if (Number.isNaN(numeric)) return String(value)
  return numeric.toLocaleString()
}

function formatRating(value) {
  if (value === null || value === undefined || value === '') return '0.0'
  const numeric = Number(value)
  if (Number.isNaN(numeric)) return String(value)
  return numeric.toFixed(1)
}

function formatMoney(value, currency = 'BHD') {
  if (value === null || value === undefined || value === '') return '—'
  const numeric = Number(value)
  if (Number.isNaN(numeric)) return String(value)
  return `${currency} ${numeric.toFixed(3)}`
}

function moneyAmount(value) {
  const numeric = Number(value)
  return Number.isNaN(numeric) ? 0 : numeric
}

function hasOutstandingPodCash({ podCashBalance, codOutstanding, codAmount }) {
  return [podCashBalance, codOutstanding, codAmount].some((value) => moneyAmount(value) > 0)
}

function titleCaseWords(value) {
  return String(value || '')
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim()
}

function initialsFromName(name) {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (!parts.length) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] || ''}${parts[parts.length - 1][0] || ''}`.toUpperCase()
}

function avatarForKey(key) {
  const raw = String(key || '')
  let hash = 0
  for (let i = 0; i < raw.length; i += 1) {
    hash = (hash + raw.charCodeAt(i) * (i + 1)) % AVATAR_PALETTE.length
  }
  return AVATAR_PALETTE[hash] || AVATAR_PALETTE[0]
}

/** UI status tab label → API statusTab query value. */
export function mapFleetStatusTabToApi(tab) {
  const raw = String(tab || '').trim()
  if (!raw || raw === 'All') return 'all'
  if (raw === 'Online') return 'online'
  if (raw === 'On delivery') return 'on_delivery'
  if (raw === 'Offline') return 'offline'
  if (raw === 'Suspended') return 'suspended'
  return raw.toLowerCase().replace(/\s+/g, '_')
}

/** UI vehicle label → API vehicle query (Postman: BIKE). */
export function mapFleetVehicleToApi(vehicle) {
  const raw = String(vehicle || '').trim()
  if (!raw) return ''
  if (/^bike$/i.test(raw)) return 'BIKE'
  if (/^car$/i.test(raw)) return 'CAR'
  return raw.toUpperCase()
}

/** UI tier label → API tier query (Postman: GOLD). */
export function mapFleetTierToApi(tier) {
  const raw = String(tier || '').trim()
  if (!raw) return ''
  if (/^at\s*risk$/i.test(raw)) return 'AT_RISK'
  return raw.toUpperCase().replace(/\s+/g, '_')
}

function mapStatusLabel(champ) {
  if (champ.statusLabel) return String(champ.statusLabel)
  const status = String(champ.status || '').trim().toUpperCase()
  if (status === 'ONLINE') return 'Online'
  if (status === 'ON_DELIVERY' || status === 'ONDELIVERY') return 'On delivery'
  if (status === 'OFFLINE') return 'Offline'
  if (status === 'SUSPENDED') return 'Suspended'
  if (status === 'TERMINATED') return 'Terminated'
  return status ? titleCaseWords(status) : '—'
}

function mapTierLabel(champ) {
  if (champ.tierLabel) return String(champ.tierLabel)
  const tier = String(champ.tier || '').trim()
  if (!tier) return '—'
  if (/^at_?risk$/i.test(tier)) return 'At Risk'
  return titleCaseWords(tier)
}

function mapVehicleLabel(champ) {
  const vehicleObj = champ.vehicle && typeof champ.vehicle === 'object' ? champ.vehicle : null
  const raw =
    champ.vehicleLabel ||
    champ.vehicleType ||
    vehicleObj?.type ||
    (typeof champ.vehicle === 'string' ? champ.vehicle : '') ||
    ''
  const value = String(raw).trim()
  if (!value) return '—'
  if (/^bike$/i.test(value)) return 'Bike'
  if (/^car$/i.test(value)) return 'Car'
  return titleCaseWords(value)
}

function mapCategories(champ) {
  const list = Array.isArray(champ.allowedCategories)
    ? champ.allowedCategories
    : Array.isArray(champ.categories)
      ? champ.categories
      : []
  const labels = list
    .map((item) => {
      if (typeof item === 'string') return item
      return item?.name || item?.label || item?.id || null
    })
    .filter(Boolean)
  const visible = labels.slice(0, 2)
  return {
    categories: visible,
    extraCategories: Math.max(0, labels.length - visible.length),
  }
}

/**
 * Flatten create/overview champ shape (`header` + `profile`) for list row mapping.
 */
function flattenChampListSource(champ) {
  if (!champ || typeof champ !== 'object') return null
  const header = champ.header && typeof champ.header === 'object' ? champ.header : null
  const profile = champ.profile && typeof champ.profile === 'object' ? champ.profile : null
  if (!header && !profile) return champ

  return {
    ...champ,
    id: header?.id || champ.id,
    champId: header?.champId || champ.champId,
    displayCode: header?.displayCode || champ.displayCode,
    name: header?.name || champ.name,
    phone: header?.phone || champ.phone,
    statusLabel: header?.statusLabel || champ.statusLabel,
    status: header?.status || champ.status,
    tier: header?.tier || profile?.tier || champ.tier,
    supplier: header?.supplier || champ.supplier,
    firstName: profile?.firstName || champ.firstName,
    lastName: profile?.lastName || champ.lastName,
    cprNumber: profile?.cprNumber || champ.cprNumber,
    allowedCategories: profile?.allowedCategories || champ.allowedCategories,
    dailyCashLimit: profile?.dailyCashLimit ?? champ.dailyCashLimit,
    vehicle: profile?.vehicle || champ.vehicle,
    vehicleType: profile?.vehicle?.type || champ.vehicleType,
  }
}

/**
 * Map one champ list item → Fleet table row.
 *
 * Gap: Postman list confirmed only with `champs: []` — no sample row body.
 * Fields inferred from Create champ response (`header`/`profile`) + UI columns.
 */
export function mapAdminFleetChampListItem(champ) {
  const source = flattenChampListSource(champ)
  if (!source) return null

  const id = String(source.id || '').trim()
  if (!id) return null

  const name =
    source.displayName ||
    source.fullName ||
    source.name ||
    [source.firstName, source.lastName].filter(Boolean).join(' ').trim() ||
    '—'

  const displayId =
    source.displayCode ||
    source.code ||
    source.champCode ||
    source.driverCode ||
    source.externalId ||
    source.champId ||
    id

  const supplierObj = source.supplier && typeof source.supplier === 'object' ? source.supplier : null
  const supplier =
    source.supplierName ||
    supplierObj?.name ||
    (typeof source.supplier === 'string' ? source.supplier : '') ||
    '—'

  const contact =
    source.phoneDisplay ||
    [source.countryCode, source.phone].filter(Boolean).join(' ').trim() ||
    source.phone ||
    '—'

  const { categories, extraCategories } = mapCategories(source)
  const avatar = avatarForKey(id + name)

  return {
    id,
    displayId: String(displayId),
    name: String(name),
    initials: source.initials || initialsFromName(name),
    avatarBg: source.avatarBg || avatar.bg,
    avatarText: source.avatarText || avatar.text,
    supplier: String(supplier),
    contact: String(contact),
    cpr: source.cprNumber || source.cpr || '—',
    vehicle: mapVehicleLabel(source),
    categories,
    extraCategories,
    cashLimit: formatMoney(
      source.dailyCashLimit ?? source.cashLimit ?? source.dailyCashLimitBhd,
      source.currency || 'BHD',
    ),
    status: mapStatusLabel(source),
    tier: mapTierLabel(source),
  }
}

function splitFullName(fullName) {
  const parts = String(fullName || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (!parts.length) return { firstName: '', lastName: '' }
  if (parts.length === 1) return { firstName: parts[0], lastName: parts[0] }
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  }
}

/** Parse UI phone into Postman `countryCode` + `phone`. Default country +973. */
export function parseChampPhone(rawPhone, defaultCountryCode = '+973') {
  const raw = String(rawPhone || '').trim()
  if (!raw) return { countryCode: defaultCountryCode, phone: '' }

  const match = raw.match(/^(\+\d{1,4})\s*(.*)$/)
  if (match) {
    return {
      countryCode: match[1],
      phone: String(match[2] || '').replace(/\D/g, ''),
    }
  }

  return {
    countryCode: defaultCountryCode,
    phone: raw.replace(/\D/g, ''),
  }
}

function parseDailyCashLimit(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  const digits = String(value || '').replace(/[^\d.]/g, '')
  const numeric = Number(digits)
  return Number.isFinite(numeric) ? numeric : 0
}

/** Parse DD/MM/YYYY or YYYY-MM-DD → ISO date string (YYYY-MM-DD). */
export function parseChampFormDate(value) {
  const raw = String(value || '').trim()
  if (!raw) return undefined
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10)
  const m = raw.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/)
  if (!m) return undefined
  const day = Number(m[1])
  const month = Number(m[2])
  const year = Number(m[3])
  if (!day || !month || !year || month > 12 || day > 31) return undefined
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

/** Normalize API/form dates → YYYY-MM-DD for calendar inputs. */
export function formatChampFormDate(value) {
  const raw = String(value || '').trim()
  if (!raw) return ''
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10)
  return parseChampFormDate(raw) || ''
}

const CASH_LIMIT_ACTION_TO_API = {
  'Stop cash orders': 'STOP_CASH_ORDERS',
  'Notify only': 'WARN_ONLY',
  'Require approval': 'REQUIRE_APPROVAL',
  STOP_CASH_ORDERS: 'STOP_CASH_ORDERS',
  WARN_ONLY: 'WARN_ONLY',
  REQUIRE_APPROVAL: 'REQUIRE_APPROVAL',
}

const CASH_LIMIT_ACTION_TO_FORM = {
  STOP_CASH_ORDERS: 'Stop cash orders',
  WARN_ONLY: 'Notify only',
  REQUIRE_APPROVAL: 'Require approval',
}

/** UI upload slot key → API document type or vehicle/avatar field */
export const CHAMP_DOC_SLOT_META = {
  personalPicture: { kind: 'avatar', label: 'Personal picture', category: 'avatars' },
  cprFront: { kind: 'document', type: 'CPR_FRONT', label: 'CPR - Front', category: 'documents' },
  cprBack: { kind: 'document', type: 'CPR_BACK', label: 'CPR - Back', category: 'documents' },
  passportFront: { kind: 'document', type: 'PASSPORT', label: 'Passport - Front', category: 'documents' },
  passportBack: { kind: 'document', type: 'PASSPORT_BACK', label: 'Passport - Back', category: 'documents' },
  visaFront: { kind: 'document', type: 'VISA_FRONT', label: 'Visa - Front', category: 'documents' },
  visaBack: { kind: 'document', type: 'VISA_BACK', label: 'Visa - Back', category: 'documents' },
  licenseFront: { kind: 'document', type: 'DRIVING_LICENSE', label: 'License - Front', category: 'documents' },
  licenseBack: { kind: 'document', type: 'DRIVING_LICENSE_BACK', label: 'License - Back', category: 'documents' },
  regFront: {
    kind: 'document',
    type: 'VEHICLE_REGISTRATION_FRONT',
    label: 'Reg - Front',
    category: 'documents',
  },
  regBack: {
    kind: 'document',
    type: 'VEHICLE_REGISTRATION_BACK',
    label: 'Reg - Back',
    category: 'documents',
  },
  vehiclePhoto1: { kind: 'vehiclePhoto', field: 'vehicleFrontPhotoUrl', label: 'Vehicle photo 1', category: 'vehicle-photos' },
  vehiclePhoto2: { kind: 'vehiclePhoto', field: 'vehicleBackPhotoUrl', label: 'Vehicle photo 2', category: 'vehicle-photos' },
  vehiclePhoto3: { kind: 'vehiclePhoto', field: 'vehicleSidePhotoUrl', label: 'Vehicle photo 3', category: 'vehicle-photos' },
  insurance: { kind: 'document', type: 'INSURANCE', label: 'Insurance', category: 'documents' },
}

function buildChampDocumentsPayload(docs = {}, form = {}) {
  const list = []
  for (const [slot, meta] of Object.entries(CHAMP_DOC_SLOT_META)) {
    if (meta.kind !== 'document') continue
    const imageUrl = String(docs[slot] || '').trim()
    if (!imageUrl) continue
    const item = { type: meta.type, imageUrl }
    if (meta.type === 'CPR_FRONT' || meta.type === 'CPR_BACK') {
      const num = String(form.cpr || form.cprNumber || '').trim()
      const exp = parseChampFormDate(form.cprExpiry)
      if (num) item.documentNumber = num
      if (exp) item.expiryDate = exp
    }
    if (meta.type === 'PASSPORT' || meta.type === 'PASSPORT_BACK') {
      const num = String(form.passport || form.passportNumber || '').trim()
      const exp = parseChampFormDate(form.passportExpiry)
      if (num) item.documentNumber = num
      if (exp) item.expiryDate = exp
    }
    if (meta.type === 'VISA_FRONT' || meta.type === 'VISA_BACK') {
      const num = String(form.visa || form.visaNumber || '').trim()
      const exp = parseChampFormDate(form.visaExpiry)
      if (num) item.documentNumber = num
      if (exp) item.expiryDate = exp
    }
    if (meta.type === 'DRIVING_LICENSE' || meta.type === 'DRIVING_LICENSE_BACK') {
      const exp = parseChampFormDate(form.licenseExpiry)
      if (exp) item.expiryDate = exp
    }
    if (meta.type === 'INSURANCE') {
      const exp = parseChampFormDate(form.insuranceExpiry)
      if (exp) item.expiryDate = exp
    }
    const nationality = String(form.nationality || '').trim()
    if (nationality) item.nationality = nationality
    list.push(item)
  }
  return list
}

function appendChampExtendedFields(body, form = {}, docs = {}) {
  const nationality = String(form.nationality || '').trim()
  if (nationality) body.nationality = nationality

  const dateOfBirth = parseChampFormDate(form.birthDate || form.dateOfBirth)
  if (dateOfBirth) body.dateOfBirth = dateOfBirth

  const cprExpiryDate = parseChampFormDate(form.cprExpiry || form.cprExpiryDate)
  if (cprExpiryDate) body.cprExpiryDate = cprExpiryDate

  const passportNumber = String(form.passport || form.passportNumber || '').trim()
  if (passportNumber) body.passportNumber = passportNumber

  const passportExpiryDate = parseChampFormDate(form.passportExpiry || form.passportExpiryDate)
  if (passportExpiryDate) body.passportExpiryDate = passportExpiryDate

  const visaNumber = String(form.visa || form.visaNumber || '').trim()
  if (visaNumber) body.visaNumber = visaNumber

  const visaExpiryDate = parseChampFormDate(form.visaExpiry || form.visaExpiryDate)
  if (visaExpiryDate) body.visaExpiryDate = visaExpiryDate

  const licenseExpiryDate = parseChampFormDate(form.licenseExpiry || form.licenseExpiryDate)
  if (licenseExpiryDate) body.licenseExpiryDate = licenseExpiryDate

  const insuranceExpiryDate = parseChampFormDate(form.insuranceExpiry || form.insuranceExpiryDate)
  if (insuranceExpiryDate) body.insuranceExpiryDate = insuranceExpiryDate

  const vehicleColor = String(form.color || form.vehicleColor || '').trim()
  if (vehicleColor) body.vehicleColor = vehicleColor

  const avatarUrl = String(docs.personalPicture || form.avatarUrl || '').trim()
  if (avatarUrl) body.avatarUrl = avatarUrl

  const front = String(docs.vehiclePhoto1 || form.vehicleFrontPhotoUrl || '').trim()
  if (front) body.vehicleFrontPhotoUrl = front
  const back = String(docs.vehiclePhoto2 || form.vehicleBackPhotoUrl || '').trim()
  if (back) body.vehicleBackPhotoUrl = back
  const side = String(docs.vehiclePhoto3 || form.vehicleSidePhotoUrl || '').trim()
  if (side) body.vehicleSidePhotoUrl = side

  if (form.specialItems != null || form.specialItemsEnabled != null) {
    body.specialItemsEnabled = Boolean(
      form.specialItemsEnabled != null ? form.specialItemsEnabled : form.specialItems,
    )
  }

  const specialItemTypes = Array.isArray(form.specialItemTypes)
    ? form.specialItemTypes
    : Array.isArray(form.specialTypes)
      ? form.specialTypes
      : null
  if (specialItemTypes) body.specialItemTypes = specialItemTypes

  if (form.orderLimit != null || form.perOrderCashLimit != null) {
    body.perOrderCashLimit = parseDailyCashLimit(form.perOrderCashLimit ?? form.orderLimit)
  }

  const cashLimitAction =
    CASH_LIMIT_ACTION_TO_API[form.onLimit] ||
    CASH_LIMIT_ACTION_TO_API[form.cashLimitAction] ||
    null
  if (cashLimitAction) body.cashLimitAction = cashLimitAction

  const documents = buildChampDocumentsPayload(docs, form)
  if (documents.length) body.documents = documents

  return body
}

/**
 * Map Add Champ form → POST /admin/fleet/champs body.
 */
export function mapAdminCreateChampRequest(form = {}) {
  const { firstName, lastName } = splitFullName(form.fullName || form.firstName)
  const { countryCode, phone } = parseChampPhone(form.phone, form.countryCode || '+973')
  const supplierId = String(form.supplierId || '').trim()
  const docs = form.docs && typeof form.docs === 'object' ? form.docs : {}

  if (!firstName || !lastName) {
    throw new ApiError({ message: 'Full name is required.' })
  }
  if (!phone) {
    throw new ApiError({ message: 'Phone is required.' })
  }
  if (!supplierId) {
    throw new ApiError({ message: 'Supplier is required.' })
  }

  const allowedCategories = Array.isArray(form.allowedCategories)
    ? form.allowedCategories
    : Array.isArray(form.storeTypes)
      ? form.storeTypes
      : []

  const body = {
    firstName,
    lastName,
    phone,
    countryCode,
    email: String(form.email || '').trim(),
    cprNumber: String(form.cprNumber || form.cpr || '').trim(),
    allowedCategories,
    dailyCashLimit: parseDailyCashLimit(form.dailyCashLimit ?? form.dailyLimit),
    tier: mapFleetTierToApi(form.tier || 'BRONZE') || 'BRONZE',
    city: String(form.city || 'Manama').trim() || 'Manama',
    zone: String(form.zone || 'Adliya').trim() || 'Adliya',
    vehicleType: mapFleetVehicleToApi(form.vehicleType) || 'BIKE',
    vehicleMake: String(form.vehicleMake || form.make || '').trim(),
    vehicleModel: String(form.vehicleModel || form.model || '').trim(),
    vehicleYear: Number(form.vehicleYear || form.year) || undefined,
    plateNumber: String(form.plateNumber || form.plate || '').trim(),
    supplierId,
  }

  appendChampExtendedFields(body, form, docs)

  if (!body.email) delete body.email
  if (!body.cprNumber) delete body.cprNumber
  if (!body.vehicleMake) delete body.vehicleMake
  if (!body.vehicleModel) delete body.vehicleModel
  if (!body.vehicleYear) delete body.vehicleYear
  if (!body.plateNumber) delete body.plateNumber
  if (!body.allowedCategories.length) delete body.allowedCategories

  return body
}

/**
 * Map Edit Champ form → PATCH /admin/fleet/champs/:champId body.
 */
export function mapAdminUpdateChampRequest(form = {}) {
  const body = {}
  const docs = form.docs && typeof form.docs === 'object' ? form.docs : {}

  const { firstName, lastName } = splitFullName(form.fullName || form.firstName)
  if (firstName) body.firstName = firstName
  if (lastName) body.lastName = lastName

  const email = String(form.email || '').trim()
  if (email) body.email = email

  const cprNumber = String(form.cprNumber || form.cpr || '').trim()
  if (cprNumber) body.cprNumber = cprNumber

  const allowedCategories = Array.isArray(form.allowedCategories)
    ? form.allowedCategories
    : Array.isArray(form.storeTypes)
      ? form.storeTypes
      : null
  if (allowedCategories) body.allowedCategories = allowedCategories

  if (form.dailyCashLimit != null || form.dailyLimit != null) {
    body.dailyCashLimit = parseDailyCashLimit(form.dailyCashLimit ?? form.dailyLimit)
  }

  const tier = mapFleetTierToApi(form.tier)
  if (tier) body.tier = tier

  const city = String(form.city || '').trim()
  if (city) body.city = city

  const zone = String(form.zone || '').trim()
  if (zone) body.zone = zone

  const supplierId = String(form.supplierId || '').trim()
  if (supplierId) body.supplierId = supplierId

  const vehicleType = mapFleetVehicleToApi(form.vehicleType)
  if (vehicleType) body.vehicleType = vehicleType

  const vehicleMake = String(form.vehicleMake || form.make || '').trim()
  if (vehicleMake) body.vehicleMake = vehicleMake

  const vehicleModel = String(form.vehicleModel || form.model || '').trim()
  if (vehicleModel) body.vehicleModel = vehicleModel

  const vehicleYear = Number(form.vehicleYear || form.year)
  if (Number.isFinite(vehicleYear) && vehicleYear > 0) body.vehicleYear = vehicleYear

  const plateNumber = String(form.plateNumber || form.plate || '').trim()
  if (plateNumber) body.plateNumber = plateNumber

  appendChampExtendedFields(body, form, docs)

  if (!Object.keys(body).length) {
    throw new ApiError({ message: 'No champ fields to update.' })
  }

  return body
}

/**
 * Map GET champ overview → Add/Edit champ form values.
 */
export function mapAdminChampDetailToForm(detail, documentsPayload) {
  if (!detail || typeof detail !== 'object') {
    throw new ApiError({ message: 'Invalid champ detail for edit form.' })
  }

  const raw = detail.raw && typeof detail.raw === 'object' ? detail.raw : {}
  const profile = raw.profile && typeof raw.profile === 'object' ? raw.profile : {}
  const header = raw.header && typeof raw.header === 'object' ? raw.header : {}
  const vehicle = profile.vehicle && typeof profile.vehicle === 'object' ? profile.vehicle : {}
  const supplier = header.supplier && typeof header.supplier === 'object' ? header.supplier : {}

  const firstName = profile.firstName || ''
  const lastName = profile.lastName || ''
  const fullName =
    detail.name && detail.name !== '—'
      ? String(detail.name)
      : [firstName, lastName].filter(Boolean).join(' ').trim()

  const vehicleTypeRaw = vehicle.type || detail.vehicle || 'BIKE'
  const vehicleType =
    String(vehicleTypeRaw).toUpperCase() === 'CAR' || String(vehicleTypeRaw) === 'Car'
      ? 'Car'
      : 'Bike'

  const categories = Array.isArray(detail.allowedCategories)
    ? detail.allowedCategories
    : Array.isArray(profile.allowedCategories)
      ? profile.allowedCategories
      : []

  const dailyLimitRaw = profile.dailyCashLimit ?? detail.cashLimit
  const dailyLimit =
    typeof dailyLimitRaw === 'number'
      ? `BHD ${Number(dailyLimitRaw).toFixed(3)}`
      : String(dailyLimitRaw || 'BHD 50.000')

  const orderLimitRaw = profile.perOrderCashLimit
  const orderLimit =
    typeof orderLimitRaw === 'number'
      ? `BHD ${Number(orderLimitRaw).toFixed(3)}`
      : orderLimitRaw != null
        ? `BHD ${Number(orderLimitRaw).toFixed(3)}`
        : 'BHD 20.000'

  const tierRaw = profile.tier || detail.tier || 'BRONZE'
  const tier = mapFleetTierToApi(tierRaw) || String(tierRaw).toUpperCase() || 'BRONZE'

  const docs = {
    personalPicture: profile.avatarUrl || header.avatarUrl || '',
    cprFront: '',
    cprBack: '',
    passportFront: '',
    passportBack: '',
    visaFront: '',
    visaBack: '',
    licenseFront: '',
    licenseBack: '',
    regFront: '',
    regBack: '',
    vehiclePhoto1: vehicle.frontPhotoUrl || '',
    vehiclePhoto2: vehicle.backPhotoUrl || '',
    vehiclePhoto3: vehicle.sidePhotoUrl || '',
    insurance: '',
  }

  const typeToSlot = Object.fromEntries(
    Object.entries(CHAMP_DOC_SLOT_META)
      .filter(([, meta]) => meta.kind === 'document')
      .map(([slot, meta]) => [meta.type, slot]),
  )

  const docList = Array.isArray(documentsPayload?.documents)
    ? documentsPayload.documents
    : Array.isArray(documentsPayload)
      ? documentsPayload
      : []

  for (const doc of docList) {
    const slot = typeToSlot[doc?.type]
    if (slot && doc?.imageUrl) docs[slot] = String(doc.imageUrl)
  }

  return {
    fullName: fullName || '',
    phone: detail.phone && detail.phone !== '—' ? String(detail.phone) : '',
    email: profile.email ? String(profile.email) : '',
    nationality: profile.nationality ? String(profile.nationality) : 'Bahraini',
    supplierId: String(profile.supplierId || supplier.id || '').trim(),
    supplier: String(detail.supplier || supplier.name || '').trim(),
    city: String(profile.city || '').trim() || 'Manama',
    zone: String(profile.zone || '').trim() || 'Adliya',
    tier,
    cpr: profile.cprNumber ? String(profile.cprNumber) : detail.cpr && detail.cpr !== '—' ? String(detail.cpr) : '',
    cprExpiry: formatChampFormDate(profile.cprExpiryDate),
    birthDate: formatChampFormDate(profile.dateOfBirth),
    passport: profile.passportNumber ? String(profile.passportNumber) : '',
    passportExpiry: formatChampFormDate(profile.passportExpiryDate),
    visa: profile.visaNumber ? String(profile.visaNumber) : '',
    visaExpiry: formatChampFormDate(profile.visaExpiryDate),
    insuranceExpiry: formatChampFormDate(vehicle.insuranceExpiryDate || profile.insuranceExpiryDate),
    licenseExpiry: formatChampFormDate(profile.licenseExpiryDate),
    plate: vehicle.plateNumber ? String(vehicle.plateNumber) : '',
    make: vehicle.make ? String(vehicle.make) : '',
    model: vehicle.model ? String(vehicle.model) : '',
    color: vehicle.color ? String(vehicle.color) : '',
    year: vehicle.year != null ? String(vehicle.year) : '',
    vehicleType,
    specialItems: profile.specialItemsEnabled != null ? Boolean(profile.specialItemsEnabled) : true,
    specialTypes: Array.isArray(profile.specialItemTypes) ? profile.specialItemTypes : [],
    dailyLimit,
    orderLimit,
    onLimit: CASH_LIMIT_ACTION_TO_FORM[profile.cashLimitAction] || 'Stop cash orders',
    storeTypes: categories,
    docs,
  }
}

/**
 * Map POST /admin/fleet/champs success `data`.
 * Confirmed: champ.header/kpis/profile/controls/suspension + temporaryPassword
 */
export function mapAdminCreateChampResponse(data) {
  if (!data || typeof data !== 'object') {
    throw new ApiError({ message: 'Invalid create champ response from the server.' })
  }

  const champ = data.champ && typeof data.champ === 'object' ? data.champ : null
  const header = champ?.header && typeof champ.header === 'object' ? champ.header : {}
  const id = String(header.id || '').trim()
  if (!id) {
    throw new ApiError({ message: 'Create champ response missing champ id.' })
  }

  return {
    id,
    champId: header.champId || null,
    displayCode: header.displayCode || null,
    name: header.name || null,
    temporaryPassword: data.temporaryPassword || null,
    passwordResetRequired: Boolean(data.passwordResetRequired),
    champ,
  }
}

/**
 * Map GET /admin/fleet/suppliers list.
 * Envelope not fully screenshot-confirmed — accepts `suppliers[]` / `items[]` / bare array.
 * Used by create-champ dropdown + Fleet partners list page.
 */
export function mapAdminFleetSuppliersListResponse(data) {
  const list = Array.isArray(data?.suppliers)
    ? data.suppliers
    : Array.isArray(data?.items)
      ? data.items
      : Array.isArray(data)
        ? data
        : []

  return list
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const id = String(item.id || '').trim()
      if (!id) return null
      const typeMeta = mapSupplierType(item.type)
      const status = mapSupplierStatus(item.status)
      const commission =
        item.commissionPct === null || item.commissionPct === undefined || item.commissionPct === ''
          ? '—'
          : `${Number(item.commissionPct)}%`

      return {
        id,
        name: String(item.name || item.displayName || id),
        displayCode: item.displayCode || null,
        type: typeMeta.short,
        typeRaw: item.type || null,
        champs: formatCount(item.champCount ?? item.totalChamps ?? item.champs),
        champsCount: Number(item.champCount ?? item.totalChamps ?? item.champs) || 0,
        commission,
        status,
      }
    })
    .filter(Boolean)
}

function mapSupplierType(raw) {
  const value = String(raw || '').trim().toUpperCase()
  if (value === 'IN_HOUSE' || value === 'INHOUSE' || /^in[- ]?house$/i.test(String(raw || ''))) {
    return { short: 'In-house', label: 'In-house', api: 'IN_HOUSE' }
  }
  if (value === 'THIRD_PARTY' || value === '3PL' || value === 'THIRDPARTY') {
    return { short: '3PL', label: '3PL partner', api: 'THIRD_PARTY' }
  }
  if (!raw) return { short: '—', label: '—', api: 'THIRD_PARTY' }
  return { short: titleCaseWords(raw), label: titleCaseWords(raw), api: String(raw).toUpperCase() }
}

/** UI type toggle → API `type` enum. */
export function mapSupplierTypeToApi(type) {
  return mapSupplierType(type).api
}

/**
 * Map Add Supplier form → POST /admin/fleet/suppliers body.
 * Confirmed: name, type, contactPerson, phone, email, city, commissionPct
 */
export function mapAdminCreateSupplierRequest(form = {}) {
  const name = String(form.name || '').trim()
  if (!name) {
    throw new ApiError({ message: 'Supplier name is required.' })
  }

  const phoneRaw = String(form.phone || '').trim()
  const phone = phoneRaw
    ? phoneRaw.startsWith('+')
      ? phoneRaw
      : `+973 ${phoneRaw.replace(/^\+?973\s*/, '')}`.replace(/\s+/g, ' ').trim()
    : ''

  const commissionRaw = form.commissionPct ?? form.commission
  const commissionPct = Number(
    String(commissionRaw ?? '')
      .replace(/%/g, '')
      .trim(),
  )

  const body = {
    name,
    type: mapSupplierTypeToApi(form.type || '3PL'),
    contactPerson: String(form.contactPerson || '').trim(),
    phone,
    email: String(form.email || '').trim(),
    city: String(form.city || 'Manama').trim() || 'Manama',
    commissionPct: Number.isFinite(commissionPct) ? commissionPct : 0,
  }

  if (!body.contactPerson) delete body.contactPerson
  if (!body.phone) delete body.phone
  if (!body.email) delete body.email

  return body
}

/**
 * Map POST /admin/fleet/suppliers success `data`.
 * Confirmed: id, name, displayCode, type, … status ACTIVE
 */
export function mapAdminCreateSupplierResponse(data) {
  if (!data || typeof data !== 'object') {
    throw new ApiError({ message: 'Invalid create supplier response from the server.' })
  }

  const id = String(data.id || '').trim()
  if (!id) {
    throw new ApiError({ message: 'Create supplier response missing id.' })
  }

  return {
    id,
    name: data.name || null,
    displayCode: data.displayCode || null,
    type: data.type || null,
    status: data.status || null,
    supplier: data,
  }
}

/**
 * Map edit form → PATCH /admin/fleet/suppliers/:id body.
 * Postman sample confirmed: contactPerson, commissionPct.
 * Also sends create-shaped fields present on the edit form (name, type, phone, email, city)
 * so the full Add/Edit UI can save — backend may ignore unknown keys.
 */
export function mapAdminUpdateSupplierRequest(form = {}) {
  const body = {}

  const contactPerson = String(form.contactPerson || '').trim()
  if (contactPerson) body.contactPerson = contactPerson

  const commissionRaw = form.commissionPct ?? form.commission
  if (commissionRaw !== undefined && commissionRaw !== null && String(commissionRaw).trim() !== '') {
    const commissionPct = Number(String(commissionRaw).replace(/%/g, '').trim())
    if (Number.isFinite(commissionPct)) body.commissionPct = commissionPct
  }

  const name = String(form.name || '').trim()
  if (name) body.name = name

  if (form.type) body.type = mapSupplierTypeToApi(form.type)

  const phoneRaw = String(form.phone || '').trim()
  if (phoneRaw) {
    body.phone = phoneRaw.startsWith('+')
      ? phoneRaw
      : `+973 ${phoneRaw.replace(/^\+?973\s*/, '')}`.replace(/\s+/g, ' ').trim()
  }

  const email = String(form.email || '').trim()
  if (email) body.email = email

  const city = String(form.city || '').trim()
  if (city) body.city = city

  if (!Object.keys(body).length) {
    throw new ApiError({ message: 'Nothing to update.' })
  }

  return body
}

/** Map supplier detail UI model → Add/Edit form fields. */
export function mapAdminSupplierDetailToForm(detail) {
  if (!detail || typeof detail !== 'object') {
    return {
      name: '',
      type: '3PL',
      contactPerson: '',
      phone: '',
      email: '',
      city: 'Manama',
      commissionPct: '12',
    }
  }

  return {
    name: String(detail.name || ''),
    type: detail.type === 'In-house' ? 'In-house' : '3PL',
    contactPerson: String(detail.contactPerson || ''),
    phone: String(detail.phone || ''),
    email: String(detail.email || ''),
    city: String(detail.zone || detail.city || 'Manama'),
    commissionPct:
      detail.commissionPct === null || detail.commissionPct === undefined
        ? ''
        : String(detail.commissionPct),
  }
}

/**
 * Map PATCH /admin/fleet/suppliers/:id success `data` (same shape as create).
 */
export function mapAdminUpdateSupplierResponse(data) {
  return mapAdminCreateSupplierResponse(data)
}

function mapSupplierStatus(raw) {
  const value = String(raw || '').trim().toUpperCase()
  if (value === 'ACTIVE') return 'Active'
  if (value === 'INACTIVE' || value === 'DEACTIVATED') return 'Inactive'
  if (!raw) return '—'
  return titleCaseWords(raw)
}

function formatPeriodShort(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
}

function formatPeriodDay(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function formatMinutes(value) {
  if (value === null || value === undefined || value === '') return '—'
  const numeric = Number(value)
  if (Number.isNaN(numeric)) return String(value)
  return `${Math.round(numeric)} min`
}

/** Default `from`/`to` for supplier detail performance query (current UTC month). */
export function mapAdminSupplierDetailParams(filters = {}) {
  let from = filters.from
  let to = filters.to

  if (!from || !to) {
    const end = to ? new Date(to) : new Date()
    const start = from ? new Date(from) : new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1))
    if (!to) {
      // End of current UTC month
      const monthEnd = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() + 1, 0, 23, 59, 59, 999))
      to = monthEnd.toISOString()
    } else {
      to = end.toISOString()
    }
    from = start.toISOString()
  }

  return { from, to }
}

/**
 * Map GET /admin/fleet/suppliers/:id → Supplier detail page.
 * Confirmed: supplier, metrics, sampleChamps[], performance
 */
export function mapAdminSupplierDetailResponse(data) {
  if (!data || typeof data !== 'object') {
    throw new ApiError({ message: 'Invalid supplier detail response from the server.' })
  }

  const supplier = data.supplier && typeof data.supplier === 'object' ? data.supplier : data
  const metrics = data.metrics && typeof data.metrics === 'object' ? data.metrics : {}
  const performance =
    data.performance && typeof data.performance === 'object' ? data.performance : {}
  const sampleChamps = Array.isArray(data.sampleChamps) ? data.sampleChamps : []

  const id = String(supplier.id || '').trim()
  if (!id) {
    throw new ApiError({ message: 'Supplier detail response missing id.' })
  }

  const name = String(supplier.name || '—')
  const typeMeta = mapSupplierType(supplier.type)
  const status = mapSupplierStatus(supplier.status)
  const avatar = avatarForKey(id + name)
  const displayCode = supplier.displayCode || id
  const champsCount = Number(
    metrics.totalChamps ?? supplier.champCount ?? sampleChamps.length,
  ) || 0

  const champs = sampleChamps
    .map((champ) => {
      if (!champ || typeof champ !== 'object') return null
      const champId = String(champ.id || '').trim()
      return {
        id: champId || null,
        name: String(champ.name || '—'),
        displayCode: champ.displayCode || null,
        vehicle: mapVehicleLabel({ vehicleType: champ.vehicle, vehicle: champ.vehicle }),
        // Gap: sampleChamps has no zone in confirmed response.
        zone: champ.zone || champ.city || '—',
        status: champ.statusLabel || mapStatusLabel(champ) || '—',
        tier: mapTierLabel(champ),
        phone: champ.phone || null,
      }
    })
    .filter(Boolean)

  return {
    id,
    displayCode,
    name,
    initials: initialsFromName(name),
    avatarBg: avatar.bg,
    avatarText: avatar.text,
    type: typeMeta.short,
    typeLabel: typeMeta.label,
    status,
    zone: supplier.city || '—',
    joinedShort: formatPeriodShort(supplier.joinedAt),
    joinedFull: formatPeriodDay(supplier.joinedAt),
    rating: formatRating(supplier.rating ?? metrics.avgRating),
    contactPerson: supplier.contactPerson || '—',
    phone: supplier.phone || '—',
    email: supplier.email || '—',
    commissionPct: supplier.commissionPct ?? performance.commissionPct ?? null,
    metrics: [
      { label: 'Total champs', value: formatCount(metrics.totalChamps ?? champsCount), tone: 'ink' },
      { label: 'Online now', value: formatCount(metrics.onlineChamps), tone: 'green' },
      { label: 'Deliveries (7d)', value: formatCount(metrics.deliveries7d), tone: 'ink' },
      { label: 'On-time', value: formatPercent(metrics.onTimeRate), tone: 'ink' },
    ],
    champsCount,
    champs,
    periodFrom: formatPeriodDay(performance.from),
    periodTo: formatPeriodDay(performance.to),
    periodFromIso: performance.from || null,
    periodToIso: performance.to || null,
    performance: [
      { value: formatCount(performance.deliveries), label: 'Deliveries', tone: 'ink' },
      {
        value: formatPercent(performance.completionRate),
        label: 'Completion rate',
        tone: 'green',
      },
      {
        value: formatMinutes(performance.avgDeliveryTimeMin),
        label: 'Avg delivery time',
        tone: 'ink',
      },
      {
        value: formatCount(performance.cancellations),
        label: 'Cancellations',
        tone: 'red',
      },
      {
        value: formatPercent(performance.onTimeRate),
        label: 'On-time rate',
        tone: 'ink',
      },
    ],
  }
}


/**
 * Build query for GET /admin/fleet/champs.
 * Confirmed Postman: search, statusTab, vehicle, tier, category, limit
 */
export function mapAdminFleetChampsListParams(filters = {}) {
  const params = {
    limit: Number(filters.limit) || 20,
  }

  if (filters.page != null) params.page = Number(filters.page) || 1

  const search = String(filters.search || '').trim()
  if (search) params.search = search

  const statusTab = mapFleetStatusTabToApi(filters.statusTab || filters.status || 'all')
  if (statusTab) params.statusTab = statusTab

  const vehicle = mapFleetVehicleToApi(filters.vehicle)
  if (vehicle) params.vehicle = vehicle

  const tier = mapFleetTierToApi(filters.tier)
  if (tier) params.tier = tier

  const category = String(filters.category || '').trim()
  if (category) params.category = category

  return params
}

/**
 * Map GET /admin/fleet/champs `data` → Fleet · Champs page list shape.
 * Confirmed envelope: page, limit, total, champs[]
 * Empty `champs: []` is valid.
 */
export function mapAdminFleetChampsListResponse(data, summaryStats = null) {
  // Tolerate accidental bare array or missing wrapper.
  const payload =
    Array.isArray(data)
      ? { page: 1, limit: data.length, total: data.length, champs: data }
      : data && typeof data === 'object'
        ? data
        : null

  if (!payload) {
    throw new ApiError({ message: 'Invalid fleet champs list response from the server.' })
  }

  const champs = Array.isArray(payload.champs)
    ? payload.champs
    : Array.isArray(payload.items)
      ? payload.items
      : Array.isArray(payload.rows)
        ? payload.rows
        : []
  const rows = champs.map(mapAdminFleetChampListItem).filter(Boolean)

  return {
    title: 'Fleet · Champs',
    action: 'Add champ',
    viewTabs: ['Champs', 'Suppliers'],
    statusTabs: STATUS_TABS,
    stats: Array.isArray(summaryStats) ? summaryStats : [],
    columns: FLEET_COLUMNS,
    rows,
    pagination: {
      page: Number(payload.page) || 1,
      limit: Number(payload.limit) || 20,
      total: Number(payload.total) || rows.length,
    },
    filterOptions: {
      vehicles: [
        { value: '', label: 'Vehicle' },
        { value: 'BIKE', label: 'Bike' },
        { value: 'CAR', label: 'Car' },
      ],
      tiers: [
        { value: '', label: 'Tier' },
        { value: 'ELITE', label: 'Elite' },
        { value: 'GOLD', label: 'Gold' },
        { value: 'SILVER', label: 'Silver' },
        { value: 'BRONZE', label: 'Bronze' },
        { value: 'AT_RISK', label: 'At Risk' },
      ],
      categories: [
        { value: '', label: 'Categories' },
        { value: 'Food', label: 'Food' },
        { value: 'Groceries', label: 'Groceries' },
        { value: 'Pharmacy', label: 'Pharmacy' },
      ],
    },
  }
}

function formatJoinedDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatPercent(value) {
  if (value === null || value === undefined || value === '') return '0%'
  const numeric = Number(value)
  if (Number.isNaN(numeric)) return String(value)
  // API may send 0.94 or 94
  const pct = numeric > 0 && numeric <= 1 ? numeric * 100 : numeric
  return `${Math.round(pct)}%`
}

/**
 * Map GET /admin/fleet/champs/:champId (Overview) → AdminChampDetailPage shape.
 * Confirmed create/overview payload: header, kpis, profile, controls, suspension.
 * `data` may be `{ champ }` or the champ object itself.
 */
export function mapAdminChampDetailResponse(data) {
  if (!data || typeof data !== 'object') {
    throw new ApiError({ message: 'Invalid champ detail response from the server.' })
  }

  const champ = data.champ && typeof data.champ === 'object' ? data.champ : data
  const header = champ.header && typeof champ.header === 'object' ? champ.header : {}
  const kpis = champ.kpis && typeof champ.kpis === 'object' ? champ.kpis : {}
  const profile = champ.profile && typeof champ.profile === 'object' ? champ.profile : {}
  const controls = champ.controls && typeof champ.controls === 'object' ? champ.controls : {}

  const id = String(header.id || champ.id || '').trim()
  if (!id) {
    throw new ApiError({ message: 'Champ detail response missing id.' })
  }

  const name =
    header.name ||
    [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim() ||
    '—'
  const displayCode = header.displayCode || header.champId || id
  const vehicle = mapVehicleLabel({ vehicle: profile.vehicle, vehicleType: profile.vehicle?.type })
  const supplierObj = header.supplier && typeof header.supplier === 'object' ? header.supplier : null
  const supplierName = supplierObj?.name || '—'
  const supplierType = String(supplierObj?.type || '').toUpperCase()
  const supplierLabel =
    supplierType === 'IN_HOUSE' || /yjeek/i.test(supplierName)
      ? `${supplierName}${/in-house/i.test(supplierName) ? '' : ' (in-house)'}`
      : supplierName

  const city = profile.city || ''
  const zone = controls.zone || profile.zone || ''
  const zoneDetail = [city, zone].filter(Boolean).join(' · ') || '—'
  const tier = mapTierLabel({ tier: header.tier || profile.tier })
  const status =
    header.statusLabel ||
    mapStatusLabel({ status: header.status, statusLabel: header.statusLabel }) ||
    '—'
  const accountStatus = String(header.accountStatus || '').toUpperCase()
  const suspension = champ.suspension && typeof champ.suspension === 'object' ? champ.suspension : null
  const isSuspended =
    accountStatus === 'SUSPENDED' ||
    String(status).toLowerCase() === 'suspended' ||
    Boolean(suspension?.suspendedAt)
  const isTerminated =
    accountStatus === 'TERMINATED' || String(status).toLowerCase() === 'terminated'
  const online = Boolean(controls.online)
  const avatar = avatarForKey(id + name)
  const categories = Array.isArray(profile.allowedCategories) ? profile.allowedCategories : []
  const cashLimit = formatMoney(profile.dailyCashLimit, 'BHD')
  const phone = header.phone || '—'
  const cpr = profile.cprNumber || '—'
  const avgRating = kpis.avgRating ?? 0
  const podObj = profile.pod && typeof profile.pod === 'object' ? profile.pod : null
  const podCashBalance = moneyAmount(podObj?.currentCashBalance)
  const codOutstandingAmount = moneyAmount(profile.codOutstanding)
  const codAmountValue = moneyAmount(controls.codAmount ?? profile.codOutstanding)
  const hasOutstandingPod = hasOutstandingPodCash({
    podCashBalance,
    codOutstanding: codOutstandingAmount,
    codAmount: codAmountValue,
  })

  return {
    id,
    displayCode,
    name: String(name),
    initials: initialsFromName(name),
    avatarBg: avatar.bg,
    avatarText: avatar.text,
    status: String(status),
    accountStatus: header.accountStatus || null,
    isSuspended,
    isTerminated,
    tier,
    vehicle,
    supplier: supplierName,
    zone: city || zone || '—',
    zoneDetail,
    rating: formatRating(avgRating),
    phone,
    cpr,
    cashLimit,
    cod: formatMoney(codAmountValue, 'BHD'),
    podCashBalance: formatMoney(podCashBalance, 'BHD'),
    hasOutstandingPod,
    online,
    onlineHint: 'Receiving orders now',
    offlineHint: 'Not receiving orders',
    canToggleOnline: controls.canToggleOnline !== false,
    allowedCategories: categories,
    metrics: [
      { label: 'Lifetime deliveries', value: formatCount(kpis.lifetimeDeliveries) },
      {
        label: 'Acceptance rate',
        value: formatPercent(kpis.acceptanceRate),
        tone: 'green',
      },
      {
        label: 'Avg rating',
        value: formatRating(avgRating),
        star: true,
        tone: 'green',
      },
      { label: 'On-time', value: formatPercent(kpis.onTimeRate), tone: 'green' },
      {
        label: 'Cancellations',
        value: formatCount(kpis.cancellationCount),
        tone: 'orange',
      },
    ],
    tabs: ['Overview', 'Earnings', 'Documents', 'SLA'],
    profile: [
      ['Full name', name],
      ['Champ ID', displayCode],
      ['Phone', phone],
      ['CPR', cpr],
      ['Vehicle type', vehicle],
      ['Supplier', supplierLabel],
      ['Allowed categories', categories.length ? categories.join(', ') : '—'],
      ['Daily cash limit', cashLimit],
      ['Joined', formatJoinedDate(header.joinedAt)],
    ],
    // Earnings / documents / SLA are separate endpoints — not in overview payload.
    earnings: null,
    suspension,
    raw: champ,
  }
}

/** UI duration label → API `duration` (Postman: until_reviewed). */
export function mapChampSuspendDurationToApi(duration) {
  const raw = String(duration || '').trim().toLowerCase()
  if (!raw) return 'until_reviewed'
  if (raw === 'until reviewed' || raw === 'until_reviewed') return 'until_reviewed'
  if (raw === '7 days' || raw === '7_days' || raw === '7d') return '7_days'
  if (raw === '30 days' || raw === '30_days' || raw === '30d') return '30_days'
  if (raw === 'permanent') return 'permanent'
  return raw.replace(/\s+/g, '_')
}

/**
 * Map Suspend champ modal → POST /admin/fleet/champs/:id/suspend body.
 * Confirmed: reason, duration, note, notifyChamp
 */
export function mapAdminChampSuspendRequest(form = {}) {
  const reason = String(form.reason || '').trim()
  if (!reason) {
    throw new ApiError({ message: 'Suspension reason is required.' })
  }

  const body = {
    reason,
    duration: mapChampSuspendDurationToApi(form.duration),
    notifyChamp: form.notifyChamp !== false && form.notify !== false,
  }

  const note = String(form.note || '').trim()
  if (note) body.note = note

  return body
}

const TERMINATE_MONTH_INDEX = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
}

/**
 * Parse terminate modal date → ISO datetime for POST .../terminate.
 * Accepts ISO, YYYY-MM-DD, or UI text like "29 Jun 2026".
 */
export function mapAdminChampTerminateEffectiveDate(value) {
  const raw = String(value || '').trim()
  if (!raw) return null

  if (/^\d{4}-\d{2}-\d{2}T/.test(raw)) {
    const date = new Date(raw)
    if (Number.isNaN(date.getTime())) {
      throw new ApiError({ message: 'Effective date is invalid.' })
    }
    return date.toISOString()
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const date = new Date(`${raw}T00:00:00.000Z`)
    if (Number.isNaN(date.getTime())) {
      throw new ApiError({ message: 'Effective date is invalid.' })
    }
    return date.toISOString()
  }

  const match = raw.match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})$/)
  if (!match) {
    throw new ApiError({
      message: 'Use effective date like "29 Jun 2026" or an ISO date.',
    })
  }

  const day = Number(match[1])
  const month = TERMINATE_MONTH_INDEX[match[2].toLowerCase()]
  const year = Number(match[3])
  if (month == null || Number.isNaN(day) || Number.isNaN(year)) {
    throw new ApiError({ message: 'Effective date is invalid.' })
  }

  const date = new Date(Date.UTC(year, month, day, 0, 0, 0, 0))
  if (Number.isNaN(date.getTime())) {
    throw new ApiError({ message: 'Effective date is invalid.' })
  }
  return date.toISOString()
}

/**
 * Map Terminate champ modal → POST /admin/fleet/champs/:id/terminate body.
 * Confirmed: reason, effectiveDate?, note?
 * COD is server-authoritative — not sent.
 */
export function mapAdminChampTerminateRequest(form = {}) {
  const reason = String(form.reason || '').trim()
  if (!reason) {
    throw new ApiError({ message: 'Termination reason is required.' })
  }

  const body = { reason }

  const effectiveDate = mapAdminChampTerminateEffectiveDate(form.effectiveDate)
  if (effectiveDate) body.effectiveDate = effectiveDate

  const note = String(form.note || '').trim()
  if (note) body.note = note

  return body
}

/**
 * Map GET /admin/fleet/summary `data` → Fleet · Champs KPI cards.
 *
 * Confirmed:
 *   totalChamps, onlineNow, onDelivery, avgRating, suspended, terminated
 *
 * UI shows 5 cards (no Terminated card) — `terminated` kept on summary for later.
 */
export function mapAdminFleetSummaryResponse(data) {
  if (!data || typeof data !== 'object') {
    throw new ApiError({ message: 'Invalid fleet summary response from the server.' })
  }

  return {
    summary: {
      totalChamps: data.totalChamps ?? 0,
      onlineNow: data.onlineNow ?? 0,
      onDelivery: data.onDelivery ?? 0,
      avgRating: data.avgRating ?? 0,
      suspended: data.suspended ?? 0,
      terminated: data.terminated ?? 0,
    },
    stats: [
      { label: 'Total champs', value: formatCount(data.totalChamps), tone: 'ink' },
      { label: 'Online now', value: formatCount(data.onlineNow), tone: 'green' },
      { label: 'On delivery', value: formatCount(data.onDelivery), tone: 'blue' },
      { label: 'Avg rating', value: formatRating(data.avgRating), tone: 'ink', star: true },
      { label: 'Suspended', value: formatCount(data.suspended), tone: 'red' },
    ],
  }
}

function formatEarningsMoney(value) {
  if (value === null || value === undefined || value === '') return '—'
  const numeric = Number(value)
  if (Number.isNaN(numeric)) return String(value)
  if (numeric === 0) return 'BHD 0.000'
  return `BHD ${numeric.toLocaleString('en-US', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  })}`
}

function formatIncentiveMoney(value) {
  if (value === null || value === undefined || value === '') return '—'
  const numeric = Number(value)
  if (Number.isNaN(numeric)) return String(value)
  if (numeric === 0) return '—'
  return formatEarningsMoney(numeric)
}

function formatBreakdownDate(value) {
  if (!value) return '—'
  if (/^[A-Za-z]{3}\s+\d{1,2}\s+[A-Za-z]{3}/.test(String(value))) return String(value)
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  const weekday = date.toLocaleDateString('en-GB', { weekday: 'short' })
  const day = date.toLocaleDateString('en-GB', { day: 'numeric' })
  const month = date.toLocaleDateString('en-GB', { month: 'short' })
  return `${weekday} ${day} ${month}`
}

/** Default query window for earnings breakdown (last 30 days). */
export function mapAdminChampEarningsParams(filters = {}) {
  const limit = Number(filters.limit) || 30
  let from = filters.from
  let to = filters.to

  if (!from || !to) {
    const end = to ? new Date(to) : new Date()
    const start = from ? new Date(from) : new Date(end)
    if (!from) start.setUTCDate(start.getUTCDate() - 30)
    from = start.toISOString()
    to = end.toISOString()
  }

  return { from, to, limit }
}

/**
 * Map GET /admin/fleet/champs/:id/earnings → Earnings tab UI.
 *
 * Confirmed:
 *   summary.today|week|lifetime: { deliveries, earnings, tips, incentive }
 *   breakdown: [] (empty is valid)
 *
 * UI cards use earnings totals only (Today / This week / Lifetime).
 * Breakdown row fields inferred (no sample row in response).
 */
export function mapAdminChampEarningsResponse(data) {
  if (!data || typeof data !== 'object') {
    throw new ApiError({ message: 'Invalid champ earnings response from the server.' })
  }

  const summary = data.summary && typeof data.summary === 'object' ? data.summary : {}
  const today = summary.today && typeof summary.today === 'object' ? summary.today : {}
  const week = summary.week && typeof summary.week === 'object' ? summary.week : {}
  const lifetime =
    summary.lifetime && typeof summary.lifetime === 'object' ? summary.lifetime : {}

  const breakdown = Array.isArray(data.breakdown)
    ? data.breakdown
    : Array.isArray(data.rows)
      ? data.rows
      : []

  const rows = breakdown.map((row, index) => {
    if (!row || typeof row !== 'object') return null
    const dateLabel = formatBreakdownDate(
      row.date || row.day || row.periodStart || row.period || row.createdAt,
    )
    return {
      key: String(row.id || row.date || `${dateLabel}-${index}`),
      date: dateLabel,
      deliveries: formatCount(row.deliveries ?? row.deliveryCount ?? 0),
      earnings: formatEarningsMoney(row.earnings ?? row.amount),
      tips: formatEarningsMoney(row.tips),
      incentive: formatIncentiveMoney(row.incentive ?? row.incentives),
    }
  }).filter(Boolean)

  return {
    summary: [
      { label: 'Today', value: formatEarningsMoney(today.earnings) },
      { label: 'This week', value: formatEarningsMoney(week.earnings) },
      { label: 'Lifetime', value: formatEarningsMoney(lifetime.earnings) },
    ],
    // Keep raw buckets for future UI (deliveries / tips) if needed.
    buckets: { today, week, lifetime },
    rows,
  }
}

const AUDIENCE_UI_TO_API = {
  'All champs': 'all',
  Online: 'online',
  'By category': 'by_category',
  'By zone': 'by_zone',
  Selected: 'selected',
}

const AUDIENCE_API_TO_LABEL = {
  all: 'All champs',
  ALL: 'All champs',
  online: 'Online champs',
  ONLINE: 'Online champs',
  by_category: 'By category',
  BY_CATEGORY: 'By category',
  by_zone: 'By zone',
  BY_ZONE: 'By zone',
  selected: 'Selected',
  SELECTED: 'Selected',
}

const SCHEDULE_UI_TO_API = {
  'Send now': 'now',
  'Schedule later': 'later',
}

const STATUS_LABEL = {
  DELIVERED: 'Delivered',
  PROCESSING: 'Sending',
  SCHEDULED: 'Scheduled',
  FAILED: 'Failed',
  PARTIAL: 'Partial',
}

function formatNotifyHistoryDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function parseChampIdsInput(value) {
  return String(value || '')
    .split(/[\s,;]+/)
    .map((id) => id.trim())
    .filter(Boolean)
}

/**
 * Map Notify Champs form → POST /admin/fleet/notify/estimate body.
 */
export function mapAdminFleetNotifyEstimateRequest(form = {}) {
  const audience =
    AUDIENCE_UI_TO_API[form.audience] ||
    String(form.audienceApi || form.audience || 'all').toLowerCase()

  const body = { audience }

  if (audience === 'by_category') {
    const category = String(form.category || '').trim()
    if (!category) throw new ApiError({ message: 'Category is required for this audience.' })
    body.category = category
  }

  if (audience === 'by_zone') {
    const zone = String(form.zone || '').trim()
    if (!zone) throw new ApiError({ message: 'Zone is required for this audience.' })
    body.zone = zone
  }

  if (audience === 'selected') {
    const champIds = Array.isArray(form.champIds)
      ? form.champIds.filter(Boolean)
      : parseChampIdsInput(form.champIdsText || form.selectedChampIds)
    if (!champIds.length) {
      throw new ApiError({ message: 'Enter at least one champ id for Selected audience.' })
    }
    body.champIds = champIds
  }

  return body
}

/**
 * Map Notify Champs form → POST /admin/fleet/notify body.
 */
export function mapAdminFleetNotifyRequest(form = {}) {
  const body = mapAdminFleetNotifyEstimateRequest(form)

  const type = String(form.type || form.messageType || 'Info').trim()
  if (!['Info', 'Incentive', 'Alert', 'Policy'].includes(type)) {
    throw new ApiError({ message: 'Invalid notification type.' })
  }

  const title = String(form.title || '').trim()
  const messageBody = String(form.body || '').trim()
  if (!title) throw new ApiError({ message: 'Title is required.' })
  if (!messageBody) throw new ApiError({ message: 'Body is required.' })

  body.type = type
  body.title = title
  body.body = messageBody
  body.push = form.push !== false
  body.sms = Boolean(form.sms)

  const schedule =
    SCHEDULE_UI_TO_API[form.schedule] ||
    String(form.scheduleApi || 'now').toLowerCase()
  body.schedule = schedule === 'later' ? 'later' : 'now'

  if (body.schedule === 'later') {
    const scheduledAt = String(form.scheduledAt || '').trim()
    if (!scheduledAt) {
      throw new ApiError({ message: 'Pick a date/time for Schedule later.' })
    }
    const when = new Date(scheduledAt)
    if (Number.isNaN(when.getTime()) || when.getTime() <= Date.now()) {
      throw new ApiError({ message: 'Scheduled time must be in the future.' })
    }
    body.scheduledAt = when.toISOString()
  }

  if (!body.push && !body.sms) {
    throw new ApiError({ message: 'Enable Push and/or SMS.' })
  }

  return body
}

/**
 * Map POST /admin/fleet/notify/estimate → UI.
 */
export function mapAdminFleetNotifyEstimateResponse(data) {
  const estimated =
    typeof data?.estimatedRecipients === 'number'
      ? data.estimatedRecipients
      : typeof data?.count === 'number'
        ? data.count
        : 0

  return {
    audience: data?.audience || null,
    estimatedRecipients: estimated,
  }
}

/**
 * Map POST /admin/fleet/notify success.
 */
export function mapAdminFleetNotifyResponse(data) {
  if (!data || typeof data !== 'object') {
    throw new ApiError({ message: 'Invalid notify response from the server.' })
  }

  return {
    campaignId: data.campaignId || data.id || null,
    audience: data.audience || null,
    sentTo: typeof data.sentTo === 'number' ? data.sentTo : 0,
    scheduled: Boolean(data.scheduled),
    scheduledAt: data.scheduledAt || null,
    status: data.status || null,
    deliveredCount: typeof data.deliveredCount === 'number' ? data.deliveredCount : 0,
    failedCount: typeof data.failedCount === 'number' ? data.failedCount : 0,
  }
}

/**
 * Map GET /admin/fleet/notify/history → table rows.
 */
export function mapAdminFleetNotifyHistoryResponse(data) {
  const list = Array.isArray(data?.campaigns)
    ? data.campaigns
    : Array.isArray(data?.items)
      ? data.items
      : Array.isArray(data)
        ? data
        : []

  const rows = list
    .map((row) => {
      if (!row || typeof row !== 'object') return null
      const statusKey = String(row.status || '').toUpperCase()
      const audienceKey = String(row.audience || '')
      return {
        id: String(row.id || ''),
        notification: String(row.title || '—'),
        audience: AUDIENCE_API_TO_LABEL[audienceKey] || audienceKey || '—',
        sentTo: typeof row.sentTo === 'number' ? row.sentTo : 0,
        date: formatNotifyHistoryDate(row.sentAt || row.scheduledAt || row.createdAt),
        status: STATUS_LABEL[statusKey] || statusKey || '—',
        statusKey,
        raw: row,
      }
    })
    .filter((row) => row && row.id)

  return {
    count: typeof data?.count === 'number' ? data.count : rows.length,
    rows,
  }
}
