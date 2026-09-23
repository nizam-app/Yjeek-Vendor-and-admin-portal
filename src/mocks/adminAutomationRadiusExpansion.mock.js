import { createDuration, createOperatorNumber } from './adminAutomationDispatchRules.mock'

/** Frontend mock source for Automation → Radius Expansion. */

export function createRadiusExpansionEditableDefaults() {
  return {
    stage1RadiusKm: createOperatorNumber('≤', 5),
    stage2RadiusKm: createOperatorNumber('≤', 8),
    stage3RadiusKm: createOperatorNumber('≤', 12),
    stage4BroadcastKm: createOperatorNumber('≤', 25),
    hotFoodOffer: createDuration('≤', 0, 0, 45),
    otherOnDemandOffer: createDuration('≤', 0, 1, 30),
    stage2To3: createDuration('≤', 0, 1, 30),
    stage3To4: createDuration('≤', 0, 1, 30),
    overallAutoCancel: createDuration('≥', 0, 15, 0),
  }
}

export function getRadiusExpansionMock() {
  return {
    header: {
      title: 'Radius Expansion',
      subtitle: 'Configure the four-stage escalation chain for unassigned orders',
    },
    stages: [
      {
        id: 'stage1',
        name: 'Stage 1 · Initial',
        detail: 'Offer 1 + Offer 2 windows. No alert.',
        alert: 'No alert',
        tone: 's1',
        radiusKey: 'stage1RadiusKm',
        displayMode: 'km',
      },
      {
        id: 'stage2',
        name: 'Stage 2 · Auto-expand',
        detail: 'New Champ pool. Vendor notified.',
        alert: 'Soft ops notify',
        tone: 's2',
        radiusKey: 'stage2RadiusKm',
        displayMode: 'km',
      },
      {
        id: 'stage3',
        name: 'Stage 3 · Extended',
        detail: 'Trigger 2 re-evaluates. Urgent alert.',
        alert: 'Urgent alert',
        tone: 's3',
        radiusKey: 'stage3RadiusKm',
        displayMode: 'km',
      },
      {
        id: 'stage4',
        name: 'Stage 4 · Broadcast',
        detail: 'All Champs. Order flagged. Duty manager.',
        alert: 'Duty manager',
        tone: 's4',
        radiusKey: 'stage4BroadcastKm',
        displayMode: 'km',
      },
    ],
    radii: {
      title: 'Stage radii',
      rows: [
        { id: 'stage1', label: 'Stage 1 initial radius', fieldKey: 'stage1RadiusKm', unit: 'km' },
        { id: 'stage2', label: 'Stage 2 radius', fieldKey: 'stage2RadiusKm', unit: 'km' },
        { id: 'stage3', label: 'Stage 3 radius', fieldKey: 'stage3RadiusKm', unit: 'km' },
        {
          id: 'stage4',
          label: 'Stage 4 broadcast radius',
          fieldKey: 'stage4BroadcastKm',
          unit: 'km',
        },
      ],
    },
    timers: {
      title: 'Offer windows & timers',
      rows: [
        {
          id: 'hot-food',
          label: 'Offer 1 window — hot food / drinks',
          fieldKey: 'hotFoodOffer',
          operator: '≤',
          readOnly: true,
          help: 'Champ/SLA offer TTL — not DispatchRuleSet',
        },
        {
          id: 'other-ondemand',
          label: 'Offer 1 window — all other on-demand',
          fieldKey: 'otherOnDemandOffer',
          operator: '≤',
          readOnly: true,
          help: 'Champ/SLA offer TTL — not DispatchRuleSet',
        },
        {
          id: 'stage2-3',
          label: 'Stage 2 → 3 timer (expansionDelaySec)',
          fieldKey: 'stage2To3',
          operator: '≤',
          readOnly: false,
        },
        {
          id: 'stage3-4',
          label: 'Stage 3 → 4 timer (same expansionDelaySec)',
          fieldKey: 'stage3To4',
          operator: '≤',
          readOnly: false,
        },
        {
          id: 'auto-cancel',
          label: 'Auto-cancel threshold — from order confirmation',
          fieldKey: 'overallAutoCancel',
          operator: '≥',
          readOnly: true,
          help: 'Fixed no-Champ policy display — not edited here',
        },
      ],
    },
    editable: createRadiusExpansionEditableDefaults(),
  }
}

export function cloneRadiusExpansionEditable(editable) {
  return structuredClone(editable)
}

/** Returns null when Stage 1 < Stage 2 < Stage 3 and broadcast > stage 3; otherwise an error message. */
export function validateRadiusStageOrder(editable) {
  const s1 = Number.parseFloat(editable?.stage1RadiusKm?.value)
  const s2 = Number.parseFloat(editable?.stage2RadiusKm?.value)
  const s3 = Number.parseFloat(editable?.stage3RadiusKm?.value)

  if (![s1, s2, s3].every((n) => Number.isFinite(n) && n >= 0)) {
    return 'Stage radii must be valid non-negative numbers with Stage 1 < Stage 2 < Stage 3.'
  }
  if (!(s1 < s2 && s2 < s3)) {
    return `Invalid radius sequence: Stage 1 (${s1} km) < Stage 2 (${s2} km) < Stage 3 (${s3} km) is required.`
  }

  const broadcast = Number.parseFloat(editable?.stage4BroadcastKm?.value)
  if (Number.isFinite(broadcast) && !(broadcast > s3)) {
    return `Stage 4 broadcast radius (${broadcast} km) must be greater than Stage 3 (${s3} km).`
  }
  return null
}
