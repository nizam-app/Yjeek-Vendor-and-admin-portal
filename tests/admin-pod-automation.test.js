import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  editableFromPodApi,
  mapChampToPodRow,
  mapFleetChampsToPodRows,
  mapPodSettingsFromApi,
  mapPodSettingsToApiPatch,
  validatePodPlatformSettings,
} from '../src/mappers/admin/mapAdminPodAutomation.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

function readSrc(...parts) {
  return readFileSync(join(root, ...parts), 'utf8')
}

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
    dailyCashLimit: 50,
    pod: {
      enabled: true,
      maxFloat: 0,
      dailyCashLimit: 50,
      effectiveMaxFloat: 50,
      currentCashExposure: 100,
      utilizationPercent: 100,
      warningActive: true,
      floatBlocked: true,
      effectivePodEligible: false,
      blockedReason: 'FLOAT_EXCEEDED',
    },
  })
  assert.equal(row.podEnabled, true)
  assert.equal(row.maxFloatBhd, 50)
  assert.equal(row.floatBlocked, true)
  assert.equal(row.effectivePodEligible, false)
  assert.equal(row.accountStatus, 'ACTIVE')
  assert.equal(row.disputes30d, null)
})

test('Max Float falls back to dailyCashLimit when podMaxFloat is 0 (matches Edit page)', () => {
  const row = mapChampToPodRow({
    id: 'c3',
    name: 'Khalid',
    dailyCashLimit: 50,
    pod: {
      enabled: true,
      maxFloat: 0,
      currentCashExposure: 24.5,
    },
  })
  assert.equal(row.maxFloatBhd, 50)
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

test('editableFromPodApi keeps mapped Fleet rows and does not invent demo champs', () => {
  const empty = editableFromPodApi({ defaultMaxFloatBhd: 100, warningPercent: 90 }, [])
  assert.deepEqual(empty.champs, [])
  assert.equal(empty.defaultMaxFloatBhd.value, '100')

  const rows = [
    {
      id: 'c1',
      name: 'Live Champ',
      podEnabled: true,
      maxFloatBhd: 150,
      currentCashBhd: 42.5,
      disputes30d: null,
    },
  ]
  const draft = editableFromPodApi(
    { defaultMaxFloatBhd: 80, warningPercent: 85, enforceFloatBlock: false },
    rows,
  )
  assert.equal(draft.champs.length, 1)
  assert.equal(draft.champs[0].name, 'Live Champ')
  assert.equal(draft.champs[0].maxFloatBhd, 150)
  assert.equal(draft.autoSuspendOnBreach, false)
})

test('POD page has no mock/demo fallback path', () => {
  const page = readSrc('src', 'pages', 'admin', 'automation', 'AdminPayOnDeliveryPage.jsx')
  assert.match(page, /Mock data is not used/)
  assert.match(page, /adminPodAutomationService/)
  assert.match(page, /POD_UI/)
  assert.doesNotMatch(page, /adminAutomationPayOnDelivery\.mock/)
  assert.doesNotMatch(page, /MockPayOnDeliveryPage/)
  assert.doesNotMatch(page, /Ahmed K\.|Fatima R\.|Ali M\.|Sara Q\./)
  assert.doesNotMatch(page, /frontend mock only/)
})
