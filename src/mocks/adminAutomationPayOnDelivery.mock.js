import { createOperatorNumber } from './adminAutomationDispatchRules.mock'

/** Frontend mock source for Automation → Pay on Delivery. */

export function createPodEditableDefaults() {
  return {
    defaultMaxFloatBhd: createOperatorNumber('≤', 100),
    warningThresholdPercent: createOperatorNumber('≥', 90),
    autoSuspendOnBreach: true,
    champs: [
      {
        id: 'ahmed-k',
        name: 'Ahmed K.',
        podEnabled: true,
        maxFloatBhd: 150,
        currentCashBhd: 42.5,
        disputes30d: 0,
      },
      {
        id: 'fatima-r',
        name: 'Fatima R.',
        podEnabled: true,
        maxFloatBhd: 100,
        currentCashBhd: 85,
        disputes30d: 1,
      },
      {
        id: 'ali-m',
        name: 'Ali M.',
        podEnabled: false,
        maxFloatBhd: 0,
        currentCashBhd: null,
        disputes30d: null,
      },
      {
        id: 'sara-q',
        name: 'Sara Q.',
        podEnabled: true,
        maxFloatBhd: 30,
        currentCashBhd: 29.8,
        disputes30d: 0,
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
      autoSuspendLabel: 'Auto-suspend POD on float breach',
      autoSuspendToggleLabel: 'Suspend POD until reconciled',
    },
    champTable: {
      title: 'Champ POD permissions — pod_enabled · pod_max_float · pod_current_cash_balance (Admin-only fields)',
      columns: ['Champ', 'POD Enabled', 'Max Float', 'Current Cash', '30d Disputes', 'Action'],
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

  if (!Number.isFinite(maxFloat) || maxFloat < 0) {
    return 'Default max float must be a number greater than or equal to 0.'
  }
  if (!Number.isFinite(warning) || warning <= 0 || warning > 100) {
    return 'Float warning threshold must be greater than 0 and less than or equal to 100.'
  }
  return null
}

/** Near-limit when cash is at or above warning % of max float (presentation helper). */
export function isChampNearLimit(champ, warningThresholdPercent) {
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
