/**
 * D07 Batch 4 — champ eligibility form helpers (progressive disclosure / OG §07).
 */
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  CHAMP_MODE_REQUIRED_MESSAGE,
  CHAMP_SPECIAL_STORE_TYPES_REQUIRED_MESSAGE,
  EMPTY_CHAMP_ELIGIBILITY,
  applyChampModeToggle,
  applyChampScheduledClasses,
  buildChampEligibilityPayload,
  getChampEligibilityVisibility,
  normalizeChampEligibility,
  toggleChampSpecialStoreType,
  validateChampEligibility,
} from '../src/components/admin/management/champEligibilityForm.js'

describe('normalizeChampEligibility', () => {
  it('defaults missing eligibility to both modes + Normal only', () => {
    const form = normalizeChampEligibility(null)
    assert.deepEqual(form.enabledModes, EMPTY_CHAMP_ELIGIBILITY.enabledModes)
    assert.equal(form.scheduledClasses, 'NORMAL_ONLY')
    assert.deepEqual(form.specialStoreTypeIds, [])
  })

  it('reads nested profile.eligibility shape', () => {
    const form = normalizeChampEligibility({
      eligibility: {
        enabledModes: ['SCHEDULED', 'HOT_FOOD_ON_DEMAND', 'SCHEDULED'],
        scheduledClasses: 'BOTH',
        specialStoreTypeIds: ['st-food', 'st-pharm', 'st-food'],
      },
    })
    assert.deepEqual(form.enabledModes, ['SCHEDULED', 'HOT_FOOD_ON_DEMAND'])
    assert.equal(form.scheduledClasses, 'BOTH')
    assert.deepEqual(form.specialStoreTypeIds, ['st-food', 'st-pharm'])
  })
})

describe('progressive disclosure visibility', () => {
  it('hot food only → no class or store-type blocks', () => {
    const vis = getChampEligibilityVisibility({
      enabledModes: ['HOT_FOOD_ON_DEMAND'],
      scheduledClasses: 'BOTH',
      specialStoreTypeIds: ['st-1'],
    })
    assert.equal(vis.showScheduledClasses, false)
    assert.equal(vis.showSpecialStoreTypes, false)
  })

  it('Scheduled on + Normal only → class block, no store types', () => {
    const vis = getChampEligibilityVisibility({
      enabledModes: ['SCHEDULED'],
      scheduledClasses: 'NORMAL_ONLY',
      specialStoreTypeIds: [],
    })
    assert.equal(vis.showScheduledClasses, true)
    assert.equal(vis.showSpecialStoreTypes, false)
  })

  it('Scheduled on + Special/Both → store type multi-select', () => {
    const both = getChampEligibilityVisibility({
      enabledModes: ['HOT_FOOD_ON_DEMAND', 'SCHEDULED'],
      scheduledClasses: 'BOTH',
      specialStoreTypeIds: [],
    })
    const special = getChampEligibilityVisibility({
      enabledModes: ['SCHEDULED'],
      scheduledClasses: 'SPECIAL_ONLY',
      specialStoreTypeIds: ['st-1'],
    })
    assert.equal(both.showSpecialStoreTypes, true)
    assert.equal(special.showSpecialStoreTypes, true)
  })
})

describe('applyChampModeToggle', () => {
  it('turning Scheduled off keeps class and store-type values', () => {
    const current = {
      enabledModes: ['HOT_FOOD_ON_DEMAND', 'SCHEDULED'],
      scheduledClasses: 'BOTH',
      specialStoreTypeIds: ['st-food', 'st-pharm'],
    }
    const next = applyChampModeToggle(current, 'SCHEDULED', false)
    assert.deepEqual(next.enabledModes, ['HOT_FOOD_ON_DEMAND'])
    assert.equal(next.scheduledClasses, 'BOTH')
    assert.deepEqual(next.specialStoreTypeIds, ['st-food', 'st-pharm'])
    const vis = getChampEligibilityVisibility(next)
    assert.equal(vis.showScheduledClasses, false)
    assert.equal(vis.showSpecialStoreTypes, false)
  })

  it('refuses to turn off the last remaining mode', () => {
    const current = {
      enabledModes: ['HOT_FOOD_ON_DEMAND'],
      scheduledClasses: 'NORMAL_ONLY',
      specialStoreTypeIds: [],
    }
    const next = applyChampModeToggle(current, 'HOT_FOOD_ON_DEMAND', false)
    assert.deepEqual(next.enabledModes, ['HOT_FOOD_ON_DEMAND'])
  })
})

describe('applyChampScheduledClasses', () => {
  it('Both → Normal only clears store type selection', () => {
    const next = applyChampScheduledClasses(
      {
        enabledModes: ['SCHEDULED'],
        scheduledClasses: 'BOTH',
        specialStoreTypeIds: ['st-food'],
      },
      'NORMAL_ONLY',
    )
    assert.equal(next.scheduledClasses, 'NORMAL_ONLY')
    assert.deepEqual(next.specialStoreTypeIds, [])
  })

  it('Special only → Normal only clears store types', () => {
    const next = applyChampScheduledClasses(
      {
        enabledModes: ['SCHEDULED'],
        scheduledClasses: 'SPECIAL_ONLY',
        specialStoreTypeIds: ['st-a', 'st-b'],
      },
      'NORMAL_ONLY',
    )
    assert.deepEqual(next.specialStoreTypeIds, [])
  })

  it('Normal → Both keeps existing store types (does not invent)', () => {
    const next = applyChampScheduledClasses(
      {
        enabledModes: ['SCHEDULED'],
        scheduledClasses: 'NORMAL_ONLY',
        specialStoreTypeIds: [],
      },
      'BOTH',
    )
    assert.equal(next.scheduledClasses, 'BOTH')
    assert.deepEqual(next.specialStoreTypeIds, [])
  })
})

describe('toggleChampSpecialStoreType', () => {
  it('toggles ids without hardcoding store type names', () => {
    let next = toggleChampSpecialStoreType(EMPTY_CHAMP_ELIGIBILITY, 'id-food')
    assert.deepEqual(next.specialStoreTypeIds, ['id-food'])
    next = toggleChampSpecialStoreType(next, 'id-pharm')
    assert.deepEqual(next.specialStoreTypeIds, ['id-food', 'id-pharm'])
    next = toggleChampSpecialStoreType(next, 'id-food')
    assert.deepEqual(next.specialStoreTypeIds, ['id-pharm'])
  })
})

describe('validateChampEligibility / buildChampEligibilityPayload', () => {
  it('requires at least one mode', () => {
    const result = validateChampEligibility({
      enabledModes: [],
      scheduledClasses: 'NORMAL_ONLY',
      specialStoreTypeIds: [],
    })
    assert.equal(result.ok, false)
    assert.equal(result.message, CHAMP_MODE_REQUIRED_MESSAGE)
  })

  it('requires ≥1 store type when Special is included and Scheduled is on', () => {
    const result = validateChampEligibility({
      enabledModes: ['SCHEDULED'],
      scheduledClasses: 'BOTH',
      specialStoreTypeIds: [],
    })
    assert.equal(result.ok, false)
    assert.equal(result.message, CHAMP_SPECIAL_STORE_TYPES_REQUIRED_MESSAGE)
  })

  it('does not require store types when Scheduled is off (values may still be kept)', () => {
    const result = validateChampEligibility({
      enabledModes: ['HOT_FOOD_ON_DEMAND'],
      scheduledClasses: 'BOTH',
      specialStoreTypeIds: [],
    })
    assert.equal(result.ok, true)
  })

  it('build payload emits eligibility fields for create/PATCH', () => {
    const payload = buildChampEligibilityPayload({
      enabledModes: ['HOT_FOOD_ON_DEMAND', 'SCHEDULED'],
      scheduledClasses: 'SPECIAL_ONLY',
      specialStoreTypeIds: ['st-1'],
    })
    assert.deepEqual(payload, {
      enabledModes: ['HOT_FOOD_ON_DEMAND', 'SCHEDULED'],
      scheduledClasses: 'SPECIAL_ONLY',
      specialStoreTypeIds: ['st-1'],
    })
  })
})
