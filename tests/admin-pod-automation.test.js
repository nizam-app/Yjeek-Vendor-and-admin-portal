import assert from 'node:assert/strict'
import test from 'node:test'
import {
  mapChampToPodRow,
  mapFleetChampsToPodRows,
  mapPodSettingsFromApi,
  mapPodSettingsToApiPatch,
  validatePodPlatformSettings,
} from '../src/mappers/admin/mapAdminPodAutomation.js'

test('POD settings map from SystemConfig.pod with defaults', () => {
  assert.deepEqual(mapPodSettingsFromApi({}), {
    defaultMaxFloatBhd: 100,
    warningPercent: 90,
    enforceFloatBlock: true,
  })
  assert.deepEqual(
    mapPodSettingsFromApi({
      pod: { defaultMaxFloatBhd: 80, warningPercent: 85, enforceFloatBlock: false },
    }),
    { defaultMaxFloatBhd: 80, warningPercent: 85, enforceFloatBlock: false },
  )
})

test('POD settings save patch targets SystemConfig pod domain only', () => {
  const patch = mapPodSettingsToApiPatch({
    defaultMaxFloatBhd: { value: 120 },
    warningThresholdPercent: { value: 88 },
    autoSuspendOnBreach: true,
  })
  assert.deepEqual(Object.keys(patch), ['pod'])
  assert.equal(patch.pod.defaultMaxFloatBhd, 120)
  assert.equal('dispatchRules' in patch, false)
  assert.equal('config' in patch, false)
})

test('POD validation rejects invalid globals', () => {
  assert.match(
    validatePodPlatformSettings({
      defaultMaxFloatBhd: 0,
      warningPercent: 90,
      enforceFloatBlock: true,
    }) || '',
    /greater than 0/,
  )
  assert.equal(
    validatePodPlatformSettings({
      defaultMaxFloatBhd: 100,
      warningPercent: 90,
      enforceFloatBlock: true,
    }),
    null,
  )
})

test('Fleet champ DTO maps exposure / utilization / float block distinctly from account status', () => {
  const row = mapChampToPodRow({
    id: 'c1',
    name: 'Champ One',
    accountStatus: 'ACTIVE',
    status: 'ONLINE',
    pod: {
      enabled: true,
      effectiveMaxFloat: 100,
      currentCashExposure: 100,
      utilizationPercent: 100,
      warningActive: true,
      floatBlocked: true,
      effectivePodEligible: false,
      blockedReason: 'FLOAT_EXCEEDED',
    },
  })
  assert.equal(row.podEnabled, true)
  assert.equal(row.floatBlocked, true)
  assert.equal(row.effectivePodEligible, false)
  assert.equal(row.accountStatus, 'ACTIVE')
  assert.equal(row.disputes30d, null)
})

test('API error path must not fabricate mock balances from empty payload', () => {
  assert.deepEqual(mapFleetChampsToPodRows(null), [])
  assert.deepEqual(mapFleetChampsToPodRows({ champs: [] }), [])
})

test('P6 dispute and scoring bonus remain absent from POD mapper', () => {
  const row = mapChampToPodRow({
    id: 'c2',
    name: 'Champ Two',
    pod: { enabled: true, effectiveMaxFloat: 100, currentCashExposure: 10 },
  })
  assert.equal(row.disputes30d, null)
  assert.equal('scoringBonusPercent' in row, false)
})
