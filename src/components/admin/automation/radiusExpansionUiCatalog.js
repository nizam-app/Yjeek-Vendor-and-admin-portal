/**
 * UI copy for Automation → Radius Expansion.
 * Field values come from DispatchRuleSet + Champ SLA + backend policy — not from this catalog.
 */
export const RADIUS_EXPANSION_UI = {
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
      detail: 'Auto continues · dispatcher may manually assign.',
      alert: 'Soft ops notify',
      tone: 's2',
      radiusKey: 'stage2RadiusKm',
      displayMode: 'km',
    },
    {
      id: 'stage3',
      name: 'Stage 3 · Extended',
      detail: 'Auto continues · manual dispatch still available.',
      alert: 'Urgent alert',
      tone: 's3',
      radiusKey: 'stage3RadiusKm',
      displayMode: 'km',
    },
    {
      id: 'stage4',
      name: 'Stage 4 · Broadcast',
      detail: 'All Champs · duty manager · manual dispatch open.',
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
      },
      {
        id: 'other-ondemand',
        label: 'Offer 1 window — all other on-demand',
        fieldKey: 'otherOnDemandOffer',
        operator: '≤',
        readOnly: true,
      },
      {
        id: 'stage2-3',
        label: 'Stage 2 → 3 timer',
        fieldKey: 'stage2To3',
        operator: '≤',
        readOnly: false,
      },
      {
        id: 'stage3-4',
        label: 'Stage 3 → 4 timer',
        fieldKey: 'stage3To4',
        operator: '≤',
        readOnly: false,
      },
      {
        id: 'auto-cancel',
        label: 'Auto-cancel threshold',
        fieldKey: 'overallAutoCancel',
        operator: '≥',
        readOnly: true,
      },
    ],
  },
}
