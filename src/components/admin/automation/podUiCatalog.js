/**
 * UI copy for Automation → Pay on Delivery.
 * Values come from SystemConfig.platformSettings.pod + Fleet — not demo data.
 */

export const POD_UI = {
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
    defaultFloatHelp:
      'Applied as the default Daily cash limit on new champs. Champ POD float cannot exceed this value.',
    warningLabel: 'Float warning threshold',
    warningUnit: '% of max float',
    autoSuspendLabel: 'Auto float-block on max breach',
    autoSuspendToggleLabel: 'Block new CASH/POD until reconciled (not account suspend)',
  },
  champTable: {
    title: 'Champ POD permissions — pod_enabled · daily cash limit / max float · cash exposure (Admin-only)',
    columns: ['Champ', 'POD Enabled', 'Max Float', 'Current Cash', '30d Disputes', 'Action'],
    empty: 'No champs returned from Fleet. Add or activate champs in Fleet Management.',
  },
  scoringNote: {
    label: 'P6 — POD scoring bonus',
    body: '30-day dispute ledger and +5% POD scoring bonus remain future P6. Not editable here.',
  },
}
