/**
 * Admin Settings mappers.
 *
 * Confirmed GET/PATCH:
 *   /admin/settings
 *   /admin/settings/general
 *   /admin/settings/localization
 *   /admin/settings/notifications
 *   /admin/settings/security
 *   /admin/settings/integrations
 */

const INTEGRATION_KEYS = [
  { id: 'maps', apiKey: 'maps', title: 'Maps & geocoding' },
  { id: 'sms', apiKey: 'sms', title: 'SMS provider' },
  { id: 'payments', apiKey: 'payment', title: 'Payment gateway' },
  { id: 'analytics', apiKey: 'analytics', title: 'Analytics' },
  { id: 'pos', apiKey: 'pos', title: 'POS' },
  { id: 'webhooks', apiKey: 'webhooks', title: 'Webhooks' },
  { id: 'erp', apiKey: 'erp', title: 'ERP' },
]

function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : null
}

function asString(value, fallback = '') {
  if (value == null) return fallback
  return String(value)
}

function asBool(value, fallback = false) {
  if (typeof value === 'boolean') return value
  if (value == null) return fallback
  if (value === 'true' || value === 1 || value === '1') return true
  if (value === 'false' || value === 0 || value === '0') return false
  return fallback
}

function asNumber(value) {
  if (value == null || value === '') return null
  if (typeof value === 'number' && Number.isFinite(value)) return value
  const cleaned = String(value).replace(/[^\d.-]/g, '')
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : null
}

const COUNTRY_TO_CODE = {
  Bahrain: 'BH',
  'Saudi Arabia': 'SA',
  UAE: 'AE',
  Kuwait: 'KW',
  Qatar: 'QA',
  Oman: 'OM',
}

const CODE_TO_COUNTRY = Object.fromEntries(
  Object.entries(COUNTRY_TO_CODE).map(([name, code]) => [code, name]),
)

const LANGUAGE_TO_CODE = {
  English: 'en',
  العربية: 'ar',
  Arabic: 'ar',
}

const CODE_TO_LANGUAGE = {
  en: 'English',
  ar: 'العربية',
}

const PASSWORD_POLICY_TO_API = {
  'Strong (12+ chars)': 'strong_12',
  'Medium (8+ chars)': 'medium_8',
  'Basic (6+ chars)': 'basic_6',
}

const PASSWORD_POLICY_TO_UI = {
  strong_12: 'Strong (12+ chars)',
  medium_8: 'Medium (8+ chars)',
  basic_6: 'Basic (6+ chars)',
}

const SESSION_TIMEOUT_TO_MIN = {
  '15 min': 15,
  '30 min': 30,
  '1 hour': 60,
  '4 hours': 240,
}

const SESSION_MIN_TO_UI = {
  15: '15 min',
  30: '30 min',
  60: '1 hour',
  240: '4 hours',
}

const AUDIT_TO_MONTHS = {
  '3 months': 3,
  '6 months': 6,
  '12 months': 12,
  '24 months': 24,
}

const AUDIT_MONTHS_TO_UI = {
  3: '3 months',
  6: '6 months',
  12: '12 months',
  24: '24 months',
}

function mapTimeFormatToUi(value) {
  const raw = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
  if (!raw) return null
  if (raw === '24h' || raw === '24-hour' || raw === '24') return '24-hour'
  if (raw === '12h' || raw === '12-hour' || raw === '12') return '12-hour'
  return String(value)
}

function mapTimeFormatToApi(value) {
  const raw = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
  if (raw === '24-hour' || raw === '24h' || raw === '24') return '24h'
  if (raw === '12-hour' || raw === '12h' || raw === '12') return '12h'
  return '24h'
}

function mapAppVersion(value) {
  if (value == null || value === '') return ''
  const raw = String(value).trim()
  if (!raw) return ''
  return /^v/i.test(raw) ? raw : `v${raw}`
}

function mapCountryToUi(value) {
  const raw = String(value || '').trim()
  if (!raw) return null
  if (CODE_TO_COUNTRY[raw.toUpperCase()]) return CODE_TO_COUNTRY[raw.toUpperCase()]
  if (COUNTRY_TO_CODE[raw]) return raw
  return raw
}

function mapCountryToApi(value) {
  const raw = String(value || '').trim()
  if (!raw) return null
  if (COUNTRY_TO_CODE[raw]) return COUNTRY_TO_CODE[raw]
  if (CODE_TO_COUNTRY[raw.toUpperCase()]) return raw.toUpperCase()
  return raw.length === 2 ? raw.toUpperCase() : raw
}

function mapLanguageToUi(value) {
  const raw = String(value || '').trim()
  if (!raw) return null
  if (CODE_TO_LANGUAGE[raw.toLowerCase()]) return CODE_TO_LANGUAGE[raw.toLowerCase()]
  if (LANGUAGE_TO_CODE[raw]) return raw
  return raw
}

function mapLanguageToApi(value) {
  const raw = String(value || '').trim()
  if (!raw) return null
  if (LANGUAGE_TO_CODE[raw]) return LANGUAGE_TO_CODE[raw]
  if (CODE_TO_LANGUAGE[raw.toLowerCase()]) return raw.toLowerCase()
  return raw
}

function mapTimezoneToUi(value) {
  const raw = String(value || '').trim()
  if (!raw) return null
  if (raw.includes('(')) return raw
  if (raw === 'Asia/Bahrain') return 'Asia/Bahrain (GMT+3)'
  if (raw === 'Asia/Riyadh') return 'Asia/Riyadh (GMT+3)'
  if (raw === 'Asia/Dubai') return 'Asia/Dubai (GMT+4)'
  return raw
}

function mapTimezoneToApi(value) {
  const raw = String(value || '').trim()
  if (!raw) return null
  return raw.replace(/\s*\([^)]*\)\s*$/, '').trim() || raw
}

function mapPayoutCycleToUi(value) {
  const raw = String(value || '').trim().toLowerCase()
  if (!raw) return null
  if (raw === 'weekly') return 'Weekly'
  if (raw === 'bi-weekly' || raw === 'biweekly' || raw === 'bi_weekly') return 'Bi-weekly'
  if (raw === 'monthly') return 'Monthly'
  return String(value)
}

function mapPayoutCycleToApi(value) {
  const raw = String(value || '').trim().toLowerCase()
  if (raw === 'weekly') return 'weekly'
  if (raw === 'bi-weekly' || raw === 'biweekly' || raw === 'bi_weekly') return 'bi-weekly'
  if (raw === 'monthly') return 'monthly'
  return raw || 'weekly'
}

function mapPayoutDayToUi(value) {
  const raw = String(value || '').trim()
  if (!raw) return null
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase()
}

function mapPayoutDayToApi(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
}

function mapMinPayoutToUi(value) {
  if (value == null || value === '') return null
  if (typeof value === 'string' && /bhd/i.test(value)) return value
  const n = asNumber(value)
  if (n == null) return String(value)
  return `BHD ${n.toFixed(3)}`
}

function mapPasswordPolicyToUi(value) {
  const raw = String(value || '').trim()
  if (!raw) return null
  return PASSWORD_POLICY_TO_UI[raw] || PASSWORD_POLICY_TO_UI[raw.toLowerCase()] || raw
}

function mapSessionTimeoutToUi(value) {
  if (value == null || value === '') return null
  if (typeof value === 'string' && /min|hour/i.test(value)) return value
  const n = asNumber(value)
  if (n != null && SESSION_MIN_TO_UI[n]) return SESSION_MIN_TO_UI[n]
  return String(value)
}

function mapAuditRetentionToUi(value) {
  if (value == null || value === '') return null
  if (typeof value === 'string' && /month/i.test(value)) return value
  const n = asNumber(value)
  if (n != null && AUDIT_MONTHS_TO_UI[n]) return AUDIT_MONTHS_TO_UI[n]
  return String(value)
}

function mapIpAllowlistToUi(value) {
  const raw = String(value || '').trim().toLowerCase()
  if (!raw) return null
  if (raw === 'disabled') return 'Disabled'
  if (raw === 'enabled') return 'Enabled'
  return String(value)
}

/**
 * Map GET /admin/settings/general into General tab form (partial).
 */
export function mapAdminSettingsGeneral(data) {
  const src = asObject(data)
  if (!src) return null

  const mapped = {}
  if ('companyName' in src) mapped.companyName = asString(src.companyName)
  if ('supportEmail' in src) mapped.supportEmail = asString(src.supportEmail)
  if ('supportPhone' in src) mapped.supportPhone = asString(src.supportPhone)
  if ('timeFormat' in src) {
    const tf = mapTimeFormatToUi(src.timeFormat)
    if (tf) mapped.timeFormat = tf
  }
  if ('appVersion' in src) mapped.appVersion = mapAppVersion(src.appVersion)
  if ('maintenanceMode' in src) mapped.maintenanceMode = asBool(src.maintenanceMode, false)

  return Object.keys(mapped).length ? mapped : null
}

/**
 * Map GET /admin/settings/localization into Localization tab form (partial).
 */
export function mapAdminSettingsLocalization(data) {
  const src = asObject(data)
  if (!src) return null

  const mapped = {}
  if (Array.isArray(src.activeCountries)) {
    mapped.activeCountries = src.activeCountries.map(mapCountryToUi).filter(Boolean)
  }
  if ('defaultCountry' in src) {
    const country = mapCountryToUi(src.defaultCountry)
    if (country) mapped.defaultCountry = country
  }
  if ('timezone' in src) {
    const tz = mapTimezoneToUi(src.timezone)
    if (tz) mapped.timezone = tz
  }
  if ('distanceUnit' in src) mapped.distanceUnit = asString(src.distanceUnit)
  if ('dateFormat' in src) mapped.dateFormat = asString(src.dateFormat)
  if ('currency' in src) mapped.currency = asString(src.currency)
  if (Array.isArray(src.languages)) {
    mapped.languages = src.languages.map(mapLanguageToUi).filter(Boolean)
  }
  if ('rtlSupport' in src) mapped.rtlSupport = asBool(src.rtlSupport, false)

  const commissionObj = asObject(src.commission)
  const commission = commissionObj || src
  if (commissionObj && 'defaultCommissionPct' in commissionObj) {
    mapped.commission = String(commissionObj.defaultCommissionPct)
  } else if ('defaultCommissionPct' in src) {
    mapped.commission = String(src.defaultCommissionPct)
  }
  if ('onlineGatewayFeePct' in commission) mapped.gatewayFee = String(commission.onlineGatewayFeePct)
  if ('vatPct' in commission) mapped.vat = String(commission.vatPct)
  if ('payoutCycle' in commission) {
    const cycle = mapPayoutCycleToUi(commission.payoutCycle)
    if (cycle) mapped.payoutCycle = cycle
  }
  if ('minPayout' in commission) {
    const min = mapMinPayoutToUi(commission.minPayout)
    if (min) mapped.minPayout = min
  }
  if ('payoutDay' in commission) {
    const day = mapPayoutDayToUi(commission.payoutDay)
    if (day) mapped.payoutDay = day
  }

  return Object.keys(mapped).length ? mapped : null
}

/**
 * Map GET /admin/settings/notifications into Notifications tab form (partial).
 */
export function mapAdminSettingsNotifications(data) {
  const src = asObject(data)
  if (!src) return null

  const channels = asObject(src.channels) || src
  const operational = asObject(src.operational) || src
  const mapped = {}

  if ('push' in channels) mapped.push = asBool(channels.push)
  if ('sms' in channels) mapped.sms = asBool(channels.sms)
  if ('email' in channels) mapped.email = asBool(channels.email)
  if ('inApp' in channels) mapped.inApp = asBool(channels.inApp)
  if ('incidentEscalation' in operational) {
    mapped.incidentEscalation = asBool(operational.incidentEscalation)
  }
  if ('dailySummaryEmail' in operational || 'dailySummary' in operational) {
    mapped.dailySummary = asBool(operational.dailySummaryEmail ?? operational.dailySummary)
  }

  return Object.keys(mapped).length ? mapped : null
}

/**
 * Map GET /admin/settings/security into Security tab form (partial).
 */
export function mapAdminSettingsSecurity(data) {
  const src = asObject(data)
  if (!src) return null

  const mapped = {}
  if ('enforce2FA' in src || 'enforce2fa' in src) {
    mapped.enforce2fa = asBool(src.enforce2FA ?? src.enforce2fa)
  }
  if ('passwordPolicy' in src) {
    const policy = mapPasswordPolicyToUi(src.passwordPolicy)
    if (policy) mapped.passwordPolicy = policy
  }
  if ('sessionTimeoutMin' in src || 'sessionTimeout' in src) {
    const timeout = mapSessionTimeoutToUi(src.sessionTimeoutMin ?? src.sessionTimeout)
    if (timeout) mapped.sessionTimeout = timeout
  }
  if ('auditLogRetentionMonths' in src || 'auditRetention' in src) {
    const audit = mapAuditRetentionToUi(src.auditLogRetentionMonths ?? src.auditRetention)
    if (audit) mapped.auditRetention = audit
  }
  if ('ipAllowlist' in src) {
    const ip = mapIpAllowlistToUi(src.ipAllowlist)
    if (ip) mapped.ipAllowlist = ip
  }
  if ('loginAlerts' in src) mapped.loginAlerts = asBool(src.loginAlerts)

  return Object.keys(mapped).length ? mapped : null
}

/**
 * Map GET /admin/settings root payload.
 */
export function mapAdminSettingsAll(data) {
  const src = asObject(data)
  if (!src) return null

  const tabs = Array.isArray(src.tabs)
    ? src.tabs.map((tab) => String(tab || '').trim().toLowerCase()).filter(Boolean)
    : []

  const minCustomer = src.minCustomerAppVersion ?? null
  const minDriver = src.minDriverAppVersion ?? null

  return {
    id: src.id ?? null,
    updatedAt: src.updatedAt ?? null,
    tabs,
    minDriverAppVersion: minDriver != null ? String(minDriver) : null,
    minCustomerAppVersion: minCustomer != null ? String(minCustomer) : null,
    rpiMinimum: src.rpiMinimum ?? null,
    rpiAcceptanceTarget: src.rpiAcceptanceTarget ?? null,
    rpiCompletionTarget: src.rpiCompletionTarget ?? null,
    rpiOnTimeTarget: src.rpiOnTimeTarget ?? null,
    rpiRatingTarget: src.rpiRatingTarget ?? null,
    vendorAcceptSlaSec: src.vendorAcceptSlaSec ?? null,
    vendorDineInAcceptSlaSec: src.vendorDineInAcceptSlaSec ?? null,
    vendorPrepSlaMin: src.vendorPrepSlaMin ?? null,
    champWaitSlaMin: src.champWaitSlaMin ?? null,
    general: mapAdminSettingsGeneral(src.general),
    localization: mapAdminSettingsLocalization(src.localization),
    notifications: mapAdminSettingsNotifications(src.notifications),
    security: mapAdminSettingsSecurity(src.security),
    integrations: mapAdminSettingsIntegrations(src.integrations),
  }
}

/**
 * GET /admin/settings/integrations → UI list
 * { id, title, subtitle, status }
 */
export function mapAdminSettingsIntegrations(data) {
  const nested = asObject(data)?.integrations
  const src = asObject(nested) || asObject(data) || {}
  const services = Array.isArray(src.services)
    ? src.services
    : Array.isArray(data)
      ? data
      : []

  if (services.length > 0) {
    return services
      .map((item) => {
        if (!item || typeof item !== 'object') return null
        const apiKey = asString(item.key || item.id).trim()
        const def = INTEGRATION_KEYS.find((row) => row.apiKey === apiKey || row.id === apiKey)
        const connected =
          typeof item.connected === 'boolean'
            ? item.connected
            : asString(item.status).toLowerCase() === 'connected'
        return {
          id: def?.id || apiKey || asString(item.id),
          title: asString(item.title || def?.title || apiKey),
          subtitle: asString(item.provider || item.subtitle || ''),
          status: connected ? 'Connected' : 'Not connected',
        }
      })
      .filter((item) => item?.id)
  }

  return INTEGRATION_KEYS.map((row) => {
    const block = asObject(src[row.apiKey]) || {}
    const connected = asBool(block.connected, false)
    return {
      id: row.id,
      title: row.title,
      subtitle: asString(block.provider || ''),
      status: connected ? 'Connected' : 'Not connected',
    }
  })
}

/** PATCH /admin/settings/integrations body */
export function mapAdminPatchIntegrationsRequest(services) {
  const list = Array.isArray(services) ? services : []
  const body = {}

  for (const row of INTEGRATION_KEYS) {
    const item = list.find((entry) => entry?.id === row.id || entry?.id === row.apiKey)
    body[row.apiKey] = {
      provider: asString(item?.subtitle || item?.provider || ''),
      connected: asString(item?.status).toLowerCase() === 'connected' || item?.connected === true,
    }
  }

  return body
}

/**
 * Merge GET payloads into Settings page form sections.
 */
export function mapAdminSettingsPageState(
  allData,
  generalData,
  localizationData,
  notificationsData,
  securityData,
  defaults = {},
  integrationsData = null,
) {
  const all = mapAdminSettingsAll(allData)
  const general = {
    ...(defaults.general || {}),
    ...(all?.general || {}),
    ...(mapAdminSettingsGeneral(generalData) || {}),
  }
  if (!general.appVersion) {
    const version = all?.minCustomerAppVersion || all?.minDriverAppVersion
    if (version) general.appVersion = mapAppVersion(version)
  }

  const defaultIntegrations = Array.isArray(defaults.integrations) ? defaults.integrations : []
  const fromSection = integrationsData ? mapAdminSettingsIntegrations(integrationsData) : []
  const fromAll = Array.isArray(all?.integrations) ? all.integrations : []
  const integrations = fromSection.length > 0 ? fromSection : fromAll.length > 0 ? fromAll : defaultIntegrations

  return {
    all,
    general,
    localization: {
      ...(defaults.localization || {}),
      ...(all?.localization || {}),
      ...(mapAdminSettingsLocalization(localizationData) || {}),
    },
    notifications: {
      ...(defaults.notifications || {}),
      ...(all?.notifications || {}),
      ...(mapAdminSettingsNotifications(notificationsData) || {}),
    },
    security: {
      ...(defaults.security || {}),
      ...(all?.security || {}),
      ...(mapAdminSettingsSecurity(securityData) || {}),
    },
    integrations,
    tabs: all?.tabs?.length ? all.tabs : null,
  }
}

/** PATCH /admin/settings/general body */
export function mapAdminPatchGeneralRequest(form) {
  const src = asObject(form) || {}
  return {
    companyName: asString(src.companyName).trim(),
    supportEmail: asString(src.supportEmail).trim(),
    supportPhone: asString(src.supportPhone).trim(),
    timeFormat: mapTimeFormatToApi(src.timeFormat),
    maintenanceMode: asBool(src.maintenanceMode, false),
  }
}

/** PATCH /admin/settings/localization body */
export function mapAdminPatchLocalizationRequest(form) {
  const src = asObject(form) || {}
  const activeCountries = Array.isArray(src.activeCountries)
    ? src.activeCountries.map(mapCountryToApi).filter(Boolean)
    : []
  const languages = Array.isArray(src.languages)
    ? src.languages.map(mapLanguageToApi).filter(Boolean)
    : []

  const minPayout = asNumber(src.minPayout)

  return {
    activeCountries,
    defaultCountry: mapCountryToApi(src.defaultCountry) || activeCountries[0] || 'BH',
    timezone: mapTimezoneToApi(src.timezone) || 'Asia/Bahrain',
    currency: asString(src.currency || 'BHD').trim(),
    languages,
    rtlSupport: asBool(src.rtlSupport, false),
    commission: {
      defaultCommissionPct: asNumber(src.commission) ?? 0,
      onlineGatewayFeePct: asNumber(src.gatewayFee) ?? 0,
      vatPct: asNumber(src.vat) ?? 0,
      payoutCycle: mapPayoutCycleToApi(src.payoutCycle),
      minPayout: minPayout ?? 0,
      payoutDay: mapPayoutDayToApi(src.payoutDay) || 'sunday',
    },
  }
}

/** PATCH /admin/settings/notifications body */
export function mapAdminPatchNotificationsRequest(form) {
  const src = asObject(form) || {}
  return {
    channels: {
      push: asBool(src.push, false),
      sms: asBool(src.sms, false),
      email: asBool(src.email, false),
      inApp: asBool(src.inApp, false),
    },
    operational: {
      incidentEscalation: asBool(src.incidentEscalation, false),
      dailySummaryEmail: asBool(src.dailySummary, false),
    },
  }
}

/** PATCH /admin/settings/security body */
export function mapAdminPatchSecurityRequest(form) {
  const src = asObject(form) || {}
  const policyUi = asString(src.passwordPolicy)
  const timeoutUi = asString(src.sessionTimeout)
  const auditUi = asString(src.auditRetention)
  const ipUi = asString(src.ipAllowlist).toLowerCase()

  return {
    enforce2FA: asBool(src.enforce2fa, false),
    passwordPolicy: PASSWORD_POLICY_TO_API[policyUi] || 'strong_12',
    sessionTimeoutMin: SESSION_TIMEOUT_TO_MIN[timeoutUi] ?? asNumber(timeoutUi) ?? 30,
    auditLogRetentionMonths: AUDIT_TO_MONTHS[auditUi] ?? asNumber(auditUi) ?? 12,
    ipAllowlist: ipUi === 'enabled' ? 'enabled' : 'disabled',
    loginAlerts: asBool(src.loginAlerts, false),
  }
}
