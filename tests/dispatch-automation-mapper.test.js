import assert from 'node:assert/strict'
import test from 'node:test'
import {
  applyDispatchRulesEdits,
  applyRadiusEdits,
  applyScoringEdits,
  applyStackingEdits,
  deepCloneConfig,
  durationToSeconds,
  forceLiveEnabledFalse,
  mapAuditLogResponse,
  mapConfigToDispatchRulesEditable,
  mapConfigToRadiusEditable,
  mapConfigToScoringDisplay,
  mapConfigToStackingEditable,
  mapOverviewToKpis,
  secondsToDuration,
  SIMULATE_MAX_LIMIT,
  validateRadiusStageOrder,
} from '../src/mappers/admin/mapDispatchAutomation.js'

const SAMPLE_CONFIG = {
  radius: {
    stagesKm: [5, 8, 12],
    broadcastRadiusKm: 25,
    expansionDelaySec: 90,
    futureRadiusKey: 'keep-me',
  },
  eligibility: {
    locationMaxAgeSec: 600,
    maxActiveOrdersByVehicle: {
      BIKE: 2,
      SCOOTER: 2,
      CAR: 3,
      CARGO: 2,
    },
  },
  scoring: {
    etaWeight: 40,
    cpiWeight: 30,
    activeLoadWeight: 20,
    categoryFitWeight: 10,
    etaNormalizationCeilingSec: 1200,
    eliteGoldEtaGraceSec: 90,
  },
  stacking: {
    liveEnabled: false,
    maxCarOrders: 3,
    bikeStackingEnabled: false,
    trigger1: { enabled: true, maxPairwiseDropKm: 2 },
    trigger2: {
      enabled: true,
      longDistanceKm: 10,
      companionDropKm: 2,
      holdWindowSec: 90,
      reevaluateFromRadiusStage: 2,
    },
    trigger3: {
      enabled: true,
      maxPairwisePickupKm: 4,
      requiredFailedOffers: 2,
    },
    experimentalFlag: true,
  },
  vehicleMatrix: {
    defaultVehicleTypes: ['BIKE', 'CAR'],
    byCategory: { flowers: ['CAR'] },
    byVendor: {},
    byProduct: {},
  },
  unknownTopLevel: { nested: 1 },
}

test('deepCloneConfig preserves unknown keys', () => {
  const clone = deepCloneConfig(SAMPLE_CONFIG)
  assert.equal(clone.unknownTopLevel.nested, 1)
  assert.equal(clone.radius.futureRadiusKey, 'keep-me')
  assert.equal(clone.stacking.experimentalFlag, true)
  clone.unknownTopLevel.nested = 99
  assert.equal(SAMPLE_CONFIG.unknownTopLevel.nested, 1)
})

test('DTO → Dispatch Rules editable and stagesKm[0] mapping', () => {
  const editable = mapConfigToDispatchRulesEditable(SAMPLE_CONFIG)
  assert.equal(editable.broadcastRadiusKm.value, '5')
  assert.equal(editable.activeOrderCap.value, '3')
})

test('Dispatch Rules edits preserve unrelated sections and unknown keys', () => {
  const editable = mapConfigToDispatchRulesEditable(SAMPLE_CONFIG)
  editable.broadcastRadiusKm = { operator: '≤', value: '6' }
  editable.activeOrderCap = { operator: '≤', value: '2' }
  // Attempt SLA mutation fields — must be ignored by apply*
  editable.slaTarget = secondsToDuration(999, '≤')
  editable.criticalThreshold = secondsToDuration(999, '≥')

  const next = applyDispatchRulesEdits(SAMPLE_CONFIG, editable)
  assert.deepEqual(next.radius.stagesKm, [6, 8, 12])
  assert.equal(next.radius.broadcastRadiusKm, 25)
  assert.equal(next.radius.expansionDelaySec, 90)
  assert.equal(next.radius.futureRadiusKey, 'keep-me')
  assert.equal(next.eligibility.maxActiveOrdersByVehicle.CAR, 2)
  assert.equal(next.eligibility.maxActiveOrdersByVehicle.BIKE, 2)
  assert.deepEqual(next.scoring, SAMPLE_CONFIG.scoring)
  assert.deepEqual(next.vehicleMatrix, SAMPLE_CONFIG.vehicleMatrix)
  assert.deepEqual(next.unknownTopLevel, SAMPLE_CONFIG.unknownTopLevel)
  assert.equal(next.stacking.liveEnabled, false)
  assert.equal(next.stacking.experimentalFlag, true)
})

test('duration seconds round-trip', () => {
  assert.equal(durationToSeconds(secondsToDuration(90, '≤')), 90)
  assert.equal(durationToSeconds(secondsToDuration(3723, '≥')), 3723)
})

test('Stacking fields round-trip and liveEnabled stays false', () => {
  const editable = mapConfigToStackingEditable(SAMPLE_CONFIG)
  assert.equal(editable.dropZoneRadiusKm.value, '2')
  assert.equal(editable.longDistanceThresholdKm.value, '10')
  assert.equal(durationToSeconds(editable.holdWindow), 90)
  assert.equal(editable.reevaluateAtStage3, true)
  assert.equal(editable.interVendorPickupRadiusKm.value, '4')
  assert.equal(editable.trigger3Enabled, true)

  editable.dropZoneRadiusKm = { operator: '≤', value: '1.5' }
  editable.holdWindow = secondsToDuration(60, '≤')
  editable.reevaluateAtStage3 = false
  editable.trigger3Enabled = false

  const withLiveTrue = deepCloneConfig(SAMPLE_CONFIG)
  withLiveTrue.stacking.liveEnabled = true

  const next = applyStackingEdits(withLiveTrue, editable)
  assert.equal(next.stacking.liveEnabled, false)
  assert.equal(next.stacking.trigger1.maxPairwiseDropKm, 1.5)
  assert.equal(next.stacking.trigger2.holdWindowSec, 60)
  assert.equal(next.stacking.trigger2.reevaluateFromRadiusStage, 99)
  assert.equal(next.stacking.trigger3.enabled, false)
  assert.equal(next.stacking.experimentalFlag, true)
  assert.equal(next.radius.stagesKm[0], 5)
  assert.deepEqual(next.unknownTopLevel, SAMPLE_CONFIG.unknownTopLevel)
})

test('forceLiveEnabledFalse always clears live stacking', () => {
  const cfg = forceLiveEnabledFalse({ stacking: { liveEnabled: true, x: 1 } })
  assert.equal(cfg.stacking.liveEnabled, false)
  assert.equal(cfg.stacking.x, 1)
})

test('Radius stages map correctly; timers never touch expansionDelaySec', () => {
  const editable = mapConfigToRadiusEditable(SAMPLE_CONFIG)
  assert.equal(editable.stage1RadiusKm.value, '5')
  assert.equal(editable.stage2RadiusKm.value, '8')
  assert.equal(editable.stage3RadiusKm.value, '12')

  editable.stage1RadiusKm = { operator: '≤', value: '4' }
  editable.stage2RadiusKm = { operator: '≤', value: '7' }
  editable.stage3RadiusKm = { operator: '≤', value: '11' }
  // Poison timer fields — must not affect config
  editable.stage2To3 = secondsToDuration(1, '≤')
  editable.overallAutoCancel = secondsToDuration(1, '≥')

  const next = applyRadiusEdits(SAMPLE_CONFIG, editable)
  assert.deepEqual(next.radius.stagesKm, [4, 7, 11])
  assert.equal(next.radius.expansionDelaySec, 90)
  assert.equal(next.radius.broadcastRadiusKm, 25)
  assert.equal(next.radius.futureRadiusKey, 'keep-me')
  assert.equal(next.stacking.liveEnabled, false)
})

test('validateRadiusStageOrder', () => {
  assert.equal(
    validateRadiusStageOrder({
      stage1RadiusKm: { value: '5' },
      stage2RadiusKm: { value: '8' },
      stage3RadiusKm: { value: '12' },
    }),
    null,
  )
  assert.match(
    validateRadiusStageOrder({
      stage1RadiusKm: { value: '10' },
      stage2RadiusKm: { value: '8' },
      stage3RadiusKm: { value: '12' },
    }),
    /Invalid radius sequence/,
  )
})

test('Scoring display reads locked weights; applyScoringEdits does not change them', () => {
  const display = mapConfigToScoringDisplay(SAMPLE_CONFIG)
  assert.deepEqual(display, {
    etaWeight: 40,
    cpiWeight: 30,
    activeLoadWeight: 20,
    categoryFitWeight: 10,
  })
  const next = applyScoringEdits(SAMPLE_CONFIG)
  assert.deepEqual(next.scoring, SAMPLE_CONFIG.scoring)
  assert.equal(next.stacking.liveEnabled, false)
})

test('Full config PATCH path does not reset unrelated sections', () => {
  const editable = mapConfigToDispatchRulesEditable(SAMPLE_CONFIG)
  editable.activeOrderCap = { operator: '≤', value: '3' }
  const next = applyDispatchRulesEdits(SAMPLE_CONFIG, editable)
  assert.deepEqual(next.stacking.trigger2, SAMPLE_CONFIG.stacking.trigger2)
  assert.deepEqual(next.vehicleMatrix.byCategory, { flowers: ['CAR'] })
  assert.equal(next.eligibility.locationMaxAgeSec, 600)
})

test('overview mapper uses exact fields; null stays unavailable', () => {
  const kpis = mapOverviewToKpis({
    kpis: {
      avgDispatchTimeSec: 102,
      vendorOnTimeAcceptanceRatePct: 94.2,
      activeChamps: { total: 38, available: 32, occupied: 6 },
      ordersInEscalation: { total: 3, byRadiusStageKm: { 8: 2, 12: 1 } },
    },
  })
  assert.equal(kpis[0].value, '1m 42s')
  assert.equal(kpis[1].value, '94.2%')
  assert.equal(kpis[2].value, '38')
  assert.equal(kpis[3].value, '3')

  const empty = mapOverviewToKpis({ kpis: {} })
  assert.equal(empty[0].value, '—')
  assert.equal(empty[0].unavailable, true)
  assert.equal(empty[1].value, '—')
})

test('audit mapper maps outcomes without inventing rows', () => {
  const mapped = mapAuditLogResponse({
    vendorAcceptance: [
      {
        id: '1',
        orderNumber: 'YJK-1',
        vendorName: 'Cafe',
        fulfillmentType: 'ON_DEMAND',
        orderPlacedAt: '2026-09-14T10:00:00.000Z',
        acceptedAt: '2026-09-14T10:00:30.000Z',
        elapsedSeconds: 30,
        outcome: 'ON_TIME',
      },
    ],
    ruleChanges: [
      {
        id: 'rc',
        at: '2026-09-14T09:00:00.000Z',
        actorName: 'ops',
        action: 'Activated dispatch rule version',
        target: 'rule-1',
        metadata: { version: 3 },
      },
    ],
  })
  assert.equal(mapped.vendorAcceptance.rows.length, 1)
  assert.match(mapped.vendorAcceptance.rows[0].statusLabel, /On time/)
  assert.equal(mapped.ruleChanges.rows[0].to, 'v3')
})

test('simulate max limit is 100 not 500', () => {
  assert.equal(SIMULATE_MAX_LIMIT, 100)
})

test('real-mode SLA editable fields use backend effective timing (not hardcoded 60/120)', async () => {
  const {
    buildVendorAcceptanceTimelineFromEffective,
    formatVendorAcceptanceEffectiveSummary,
    pickHotFoodEffectiveAcceptance,
  } = await import('../src/mappers/admin/mapDispatchAutomation.js')

  const withoutEffective = mapConfigToDispatchRulesEditable(SAMPLE_CONFIG, null)
  assert.equal(withoutEffective.slaTarget, null)
  assert.equal(withoutEffective.criticalThreshold, null)

  const buyer = mapConfigToDispatchRulesEditable(SAMPLE_CONFIG, {
    onTimeThresholdSec: 60,
    finalDeadlineSec: 120,
  })
  assert.equal(durationToSeconds(buyer.slaTarget), 60)
  assert.equal(durationToSeconds(buyer.criticalThreshold), 120)

  const legacy = mapConfigToDispatchRulesEditable(SAMPLE_CONFIG, {
    onTimeThresholdSec: 60,
    finalDeadlineSec: 180,
  })
  assert.equal(durationToSeconds(legacy.slaTarget), 60)
  assert.equal(durationToSeconds(legacy.criticalThreshold), 180)

  const custom = mapConfigToDispatchRulesEditable(SAMPLE_CONFIG, {
    onTimeThresholdSec: 90,
    finalDeadlineSec: 180,
  })
  assert.equal(durationToSeconds(custom.slaTarget), 90)
  assert.equal(durationToSeconds(custom.criticalThreshold), 180)

  const timeline = buildVendorAcceptanceTimelineFromEffective({
    onTimeThresholdSec: 90,
    finalDeadlineSec: 180,
  })
  assert.equal(timeline[0].time, '0–90s')
  assert.equal(timeline[3].time, '180s')
  assert.match(formatVendorAcceptanceEffectiveSummary({
    onTimeThresholdSec: 60,
    finalDeadlineSec: 180,
  }), /180s auto-cancel/)

  const picked = pickHotFoodEffectiveAcceptance({
    modelId: 'm1',
    modes: {
      hotFoodOnDemand: {
        onTimeThresholdSec: 90,
        finalDeadlineSec: 180,
        mapping: 'canonical',
        acceptanceTimeSec: { target: 90, atRisk: 120, critical: 180 },
      },
    },
  })
  assert.equal(picked.onTimeThresholdSec, 90)
  assert.equal(picked.finalDeadlineSec, 180)
})

test('DispatchRuleSet PATCH path still excludes SLA fields after effective display mapping', () => {
  const editable = mapConfigToDispatchRulesEditable(SAMPLE_CONFIG, {
    onTimeThresholdSec: 60,
    finalDeadlineSec: 120,
  })
  editable.slaTarget = secondsToDuration(999, '≤')
  editable.criticalThreshold = secondsToDuration(999, '≥')
  editable.broadcastRadiusKm = { operator: '≤', value: '7' }

  const next = applyDispatchRulesEdits(SAMPLE_CONFIG, editable)
  assert.deepEqual(next.radius.stagesKm, [7, 8, 12])
  assert.equal(JSON.stringify(next).includes('"slaTarget"'), false)
  assert.equal(JSON.stringify(next).includes('999'), false)
  assert.deepEqual(next.scoring, SAMPLE_CONFIG.scoring)
})

test('overview KPI labels use effective on-time seconds when provided', () => {
  const kpis = mapOverviewToKpis(
    { kpis: { vendorOnTimeAcceptanceRatePct: 94.2, activeChamps: { total: 1, occupied: 0, available: 1 }, ordersInEscalation: { total: 0, byRadiusStageKm: {} } } },
    { onTimeThresholdSec: 90 },
  )
  const acceptance = kpis.find((k) => k.id === 'vendor-acceptance')
  assert.equal(acceptance.label, 'Vendor 90s acceptance rate')
  assert.match(acceptance.delta, /90s classification/)

  const generic = mapOverviewToKpis(
    { kpis: { vendorOnTimeAcceptanceRatePct: null, activeChamps: {}, ordersInEscalation: { total: 0, byRadiusStageKm: {} } } },
    {},
  )
  assert.equal(generic.find((k) => k.id === 'vendor-acceptance').label, 'Vendor on-time acceptance rate')
})

test('cross-tab sequential section edits preserve prior saves (mergeLatest pattern)', () => {
  // Simulate: Dispatch save → Stacking save → Radius save, each starting from latest.
  let latest = deepCloneConfig(SAMPLE_CONFIG)

  const dispatchEditable = mapConfigToDispatchRulesEditable(latest)
  dispatchEditable.activeOrderCap = { operator: '≤', value: '2' }
  latest = applyDispatchRulesEdits(latest, dispatchEditable)
  assert.equal(latest.eligibility.maxActiveOrdersByVehicle.CAR, 2)
  assert.equal(latest.stacking.trigger1.maxPairwiseDropKm, 2)
  assert.deepEqual(latest.radius.stagesKm, [5, 8, 12])

  const stackingEditable = mapConfigToStackingEditable(latest)
  stackingEditable.dropZoneRadiusKm = { operator: '≤', value: '1.5' }
  latest = applyStackingEdits(latest, stackingEditable)
  assert.equal(latest.eligibility.maxActiveOrdersByVehicle.CAR, 2)
  assert.equal(latest.stacking.trigger1.maxPairwiseDropKm, 1.5)
  assert.equal(latest.stacking.liveEnabled, false)
  assert.deepEqual(latest.radius.stagesKm, [5, 8, 12])

  const radiusEditable = mapConfigToRadiusEditable(latest)
  radiusEditable.stage1RadiusKm = { operator: '≤', value: '4' }
  radiusEditable.stage2RadiusKm = { operator: '≤', value: '7' }
  radiusEditable.stage3RadiusKm = { operator: '≤', value: '11' }
  latest = applyRadiusEdits(latest, radiusEditable)
  assert.equal(latest.eligibility.maxActiveOrdersByVehicle.CAR, 2)
  assert.equal(latest.stacking.trigger1.maxPairwiseDropKm, 1.5)
  assert.deepEqual(latest.radius.stagesKm, [4, 7, 11])
  assert.equal(latest.radius.expansionDelaySec, 90)
  assert.deepEqual(latest.unknownTopLevel, SAMPLE_CONFIG.unknownTopLevel)
})

test('audit CSV escapes commas quotes and newlines', async () => {
  const { buildAuditLogCsv } = await import('../src/mocks/adminAutomationAuditLog.mock.js')
  const catalog = {
    vendorAcceptance: {
      columns: ['Order', 'Vendor', 'Type', 'Placed', 'Accepted', 'Elapsed', 'Status'],
      rows: [
        {
          order: 'YJK-1',
          vendor: 'Cafe, "Downtown"',
          type: 'ON_DEMAND',
          placedAt: '10:00',
          acceptedAt: '—',
          elapsed: '30s',
          statusLabel: 'On time',
        },
      ],
    },
    ruleChanges: {
      columns: ['Time', 'Module', 'Field', 'By', 'From', 'To', 'Reason'],
      rows: [
        {
          timestamp: '09:00',
          module: 'DISPATCH_RULES',
          fieldChanged: 'activate',
          changedBy: 'ops',
          from: '—',
          to: 'v3',
          reason: 'line1\nline2, with "quotes"',
        },
      ],
    },
  }
  const csv = buildAuditLogCsv(catalog)
  assert.match(csv, /"Cafe, ""Downtown"""/)
  assert.match(csv, /"line1\nline2, with ""quotes"""/)
})
