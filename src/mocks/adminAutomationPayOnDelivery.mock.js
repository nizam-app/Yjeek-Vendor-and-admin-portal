import { createOperatorNumber } from './adminAutomationDispatchRules.mock'
import {
  DEFAULT_POD_PLATFORM_SETTINGS,
  mapChampToPodRow,
  mapPodSettingsFromApi,
  validatePodPlatformSettings,
} from '../mappers/admin/mapAdminPodAutomation'

/** Frontend mock source for Automation → Pay on Delivery. */

export function createPodEditableDefaults() {
  return {
    defaultMaxFloatBhd: createOperatorNumber('≤', DEFAULT_POD_PLATFORM_SETTINGS.defaultMaxFloatBhd),
    warningThresholdPercent: createOperatorNumber('≥', DEFAULT_POD_PLATFORM_SETTINGS.warningPercent),
    /** Maps to SystemConfig.platformSettings.pod.enforceFloatBlock (not account suspension). */
    autoSuspendOnBreach: DEFAULT_POD_PLATFORM_SETTINGS.enforceFloatBlock,
    champs: [
      {
        id: 'ahmed-k',
        name: 'Ahmed K.',
        podEnabled: true,
        maxFloatBhd: 150,
        currentCashBhd: 42.5,
        disputes30d: null,
        effectivePodEligible: true,
        floatBlocked: false,
        warningActive: false,
        utilizationPercent: 28.333,
        accountStatus: 'ACTIVE',
        blockedReason: null,
      },
      {
        id: 'fatima-r',
        name: 'Fatima R.',
        podEnabled: true,
        maxFloatBhd: 100,
        currentCashBhd: 85,
        disputes30d: null,
        effectivePodEligible: true,
        floatBlocked: false,
        warningActive: true,
        utilizationPercent: 85,
        accountStatus: 'ACTIVE',
        blockedReason: null,
      },
      {
        id: 'ali-m',
        name: 'Ali M.',
        podEnabled: false,
        maxFloatBhd: 100,
        currentCashBhd: 0,
        disputes30d: null,
        effectivePodEligible: false,
        floatBlocked: false,
        warningActive: false,
        utilizationPercent: 0,
        accountStatus: 'ACTIVE',
        blockedReason: 'MANUAL_DISABLED',
      },
      {
        id: 'sara-q',
        name: 'Sara Q.',
        podEnabled: true,
        maxFloatBhd: 30,
        currentCashBhd: 29.8,
        disputes30d: null,
        effectivePodEligible: true,
        floatBlocked: false,
        warningActive: true,
        utilizationPercent: 99.333,
        accountStatus: 'ACTIVE',
        blockedReason: null,
      },
    ],
  }
}

export function getPayOnDeliveryMock() {
  return {
    header: {
      title: 'Pay on Delivery',
      subtitle: 'Admin-controlled per-Champ cash permissions · formerly COD',
    },
    banner: {
      label: 'Pay on Delivery ≠ cash only',
      body: 'POD means the customer defers payment to delivery time. They may pay online via BenefitPay or card right up until the Champ arrives. Cash at the door is one option only. The float limit tracks unreconciled cash only — online POD payments do not count toward it.',
    },
    globalSettings: {
      title: 'Global POD settings',
      defaultFloatLabel: 'Default max float — new Champs',
      defaultFloatUnit: 'BHD',
      warningLabel: 'Float warning threshold',
      warningUnit: '% of max float',
      autoSuspendLabel: 'Auto float-block on max breach',
      autoSuspendToggleLabel: 'Block new CASH/POD until reconciled (not account suspend)',
    },
    champTable: {
      title: 'Champ POD permissions — pod_enabled · effective max · cash exposure (Admin-only)',
      columns: [
        'Champ',
        'POD Enabled',
        'Max Float',
        'Current Cash',
        '30d Disputes',
        'Action',
      ],
    },
    scoringNote: {
      label: 'P6 — POD scoring bonus',
      body: '30-day dispute ledger and +5% POD scoring bonus remain future P6. Not editable here.',
    },
    editable: createPodEditableDefaults(),
  }
}

export function clonePodEditable(editable) {
  return structuredClone(editable)
}

export function validatePodSettings(editable) {
  const maxFloat = Number.parseFloat(editable?.defaultMaxFloatBhd?.value)
  const warning = Number.parseFloat(editable?.warningThresholdPercent?.value)
  return validatePodPlatformSettings({
    defaultMaxFloatBhd: maxFloat,
    warningPercent: warning,
    enforceFloatBlock: Boolean(editable?.autoSuspendOnBreach),
  })
}

/** Near-limit when cash is at or above warning % of max float (presentation helper). */
export function isChampNearLimit(champ, warningThresholdPercent) {
  if (champ?.warningActive === true) return true
  if (champ?.floatBlocked === true) return true
  if (!champ?.podEnabled) return false
  if (!(champ.maxFloatBhd > 0) || champ.currentCashBhd == null) return false
  const threshold = Number.parseFloat(warningThresholdPercent)
  const pct = Number.isFinite(threshold) ? threshold : 90
  return champ.currentCashBhd >= champ.maxFloatBhd * (pct / 100)
}

export function formatBhd(amount) {
  if (amount == null || amount === '') return '—'
  const n = Number(amount)
  if (!Number.isFinite(n)) return '—'
  return `BHD ${n.toFixed(2).replace(/\.00$/, n % 1 === 0 ? '' : '')}`.replace(
    /(\d+)\.(\d)$/,
    '$1.$20',
  )
}

/** Prefer exact display like BHD 150 / BHD 42.50 from reference. */
export function formatBhdDisplay(amount, { forceCents = false } = {}) {
  if (amount == null || amount === '') return '—'
  const n = Number(amount)
  if (!Number.isFinite(n)) return '—'
  if (forceCents || n % 1 !== 0) return `BHD ${n.toFixed(2)}`
  return `BHD ${n}`
}

export function editableFromPodApi(settings, champs) {
  const normalized = mapPodSettingsFromApi(settings)
  return {
    defaultMaxFloatBhd: createOperatorNumber('≤', normalized.defaultMaxFloatBhd),
    warningThresholdPercent: createOperatorNumber('≥', normalized.warningPercent),
    autoSuspendOnBreach: normalized.enforceFloatBlock,
    champs: (champs || []).map((row) => mapChampToPodRow(row, normalized)),
  }
}
