/** Frontend mock source for Automation → Champ Scoring.
 * Later backend integration can replace `getChampScoringMock()` without rewriting the screen.
 */

export function createChampScoringEditableDefaults() {
  return {
    podBonusPercent: '5',
  }
}

export function getChampScoringMock() {
  return {
    header: {
      title: 'Champ Scoring',
      subtitle: 'Weights used to rank Champs for each on-demand order · must sum to 100%',
    },
    cpiNotice: {
      label: 'CPI tier is defined in DSA YTW-DSA-2026 — read only here',
      body: 'Tier names, score bands, and dispatch multipliers are contractually locked. Acceptance Rate is a CPI component — not scored separately to avoid double-counting. Any change to CPI requires a DSA amendment, not an Admin config change.',
    },
    weights: {
      totalLabel: 'Total: 100% ✓',
      totalPercent: 100,
      factors: [
        {
          id: 'eta',
          label: 'ETA to vendor pickup',
          percent: 40,
          note: 'Google Maps live ETA from Champ GPS · not straight-line',
          readOnly: true,
          barTone: 'green',
        },
        {
          id: 'cpi',
          label: 'CPI tier multiplier',
          labelSuffix: '(read-only)',
          percent: 30,
          note: 'Multiplier per DSA — see CPI table below',
          readOnly: true,
          barTone: 'muted',
        },
        {
          id: 'load',
          label: 'Active order load',
          percent: 20,
          note: '0 orders 1.00× · 1 order 0.75× · 2 orders 0.50×',
          readOnly: true,
          barTone: 'green',
          loadFactors: [
            { orders: 0, multiplier: '1.00×' },
            { orders: 1, multiplier: '0.75×' },
            { orders: 2, multiplier: '0.50×' },
          ],
        },
        {
          id: 'category',
          label: 'Category fit',
          percent: 10,
          note: 'Specialist 1.00× · cross-category approved 0.80×',
          readOnly: true,
          barTone: 'green',
          categoryFitFactors: [
            { kind: 'Specialist', multiplier: '1.00×' },
            { kind: 'Cross-category approved', multiplier: '0.80×' },
          ],
        },
      ],
    },
    cpiTable: {
      title: 'CPI tier dispatch multipliers — DSA YTW-DSA-2026 · read only',
      suspensionNotice: {
        label: 'Suspension is always a dispatcher decision — never automatic',
        body: 'Under Watch and At Risk Champs remain in the pool with suppressed multipliers. Suspension is set manually in the Champ profile. Unsuspended Champs — regardless of CPI tier — enter the pool and are scored. If the dispatcher chooses not to suspend due to supply shortage, the engine handles them through the multiplier only.',
      },
      columns: [
        'CPI Tier',
        'DSA Score Range',
        'Dispatch Multiplier',
        'Practical Effect',
        'Dispatcher Action',
      ],
      tiers: [
        {
          id: 'elite',
          tier: 'Elite',
          scoreRange: '92 – 100',
          multiplier: '1.00×',
          effect: 'Highest priority. Wins over Gold within 90s ETA gap.',
          action: 'None',
          tone: 'elite',
        },
        {
          id: 'gold',
          tier: 'Gold',
          scoreRange: '82 – 91',
          multiplier: '0.85×',
          effect: 'Standard priority. Good standing.',
          action: 'None',
          tone: 'gold',
        },
        {
          id: 'silver',
          tier: 'Silver',
          scoreRange: '72 – 81',
          multiplier: '0.70×',
          effect: 'Reduced priority. Eligible for all orders.',
          action: 'None',
          tone: 'silver',
        },
        {
          id: 'under-watch',
          tier: 'Under Watch',
          scoreRange: '62 – 71',
          multiplier: '0.40×',
          effect: 'Heavily suppressed. Rarely wins unless supply critically low.',
          action: 'Dispatcher may suspend',
          tone: 'watch',
        },
        {
          id: 'at-risk',
          tier: 'At Risk',
          scoreRange: 'below 62',
          multiplier: '0.20×',
          effect: 'Extremely suppressed. Only assigned when no better option exists.',
          action: 'Dispatcher should suspend',
          tone: 'risk',
        },
      ],
    },
    podUplift: {
      title: 'Pay on Delivery scoring uplift',
      bonusLabel: 'POD bonus — Champs with zero cash disputes in 30 days',
      invisibleNote: 'This bonus is invisible to Champs — scoring only',
      activeBadge: 'Active',
    },
    editable: createChampScoringEditableDefaults(),
  }
}

export function cloneChampScoringEditable(editable) {
  return structuredClone(editable)
}
