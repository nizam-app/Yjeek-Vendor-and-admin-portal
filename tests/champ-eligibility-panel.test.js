/**
 * D07 Batch 4 — champ eligibility form helpers (progressive disclosure / OG §07).
 */
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  CHAMP_MODE_REQUIRED_MESSAGE,
  CHAMP_SPECIAL_ITEM_TYPES_REQUIRED_MESSAGE,
  EMPTY_CHAMP_ELIGIBILITY,
  applyChampModeToggle,
  applyChampScheduledClasses,
  buildChampEligibilityPayload,
  getChampEligibilityVisibility,
  champAllowedCategorySlugsFromEligibility,
  mapSpecialItemTypesToStoreTypeIds,
  normalizeChampEligibility,
  clearAllChampNormalStoreTypes,
  selectAllChampNormalStoreTypes,
  toggleChampNormalStoreType,
  validateChampEligibility,
} from '../src/components/admin/management/champEligibilityForm.js'

describe('normalizeChampEligibility', () => {
  it('defaults missing eligibility to both modes + Normal only', () => {
    const form = normalizeChampEligibility(null)
    assert.deepEqual(form.enabledModes, EMPTY_CHAMP_ELIGIBILITY.enabledModes)
    assert.equal(form.scheduledClasses, 'NORMAL_ONLY')
    assert.deepEqual(form.normalStoreTypeIds, [])
    assert.deepEqual(form.specialStoreTypeIds, [])
  })

  it('reads nested profile.eligibility shape', () => {
    const form = normalizeChampEligibility({
      eligibility: {
        enabledModes: ['SCHEDULED', 'HOT_FOOD_ON_DEMAND', 'SCHEDULED'],
        scheduledClasses: 'BOTH',
        normalStoreTypeIds: ['st-food'],
        specialStoreTypeIds: ['st-pharm', 'st-pharm'],
      },
    })
    assert.deepEqual(form.enabledModes, ['SCHEDULED', 'HOT_FOOD_ON_DEMAND'])
    assert.equal(form.scheduledClasses, 'BOTH')
    assert.deepEqual(form.normalStoreTypeIds, ['st-food'])
    assert.deepEqual(form.specialStoreTypeIds, ['st-pharm'])
  })
})

describe('progressive disclosure visibility', () => {
  it('hot food only → no class or store-type blocks', () => {
    const vis = getChampEligibilityVisibility({
      enabledModes: ['HOT_FOOD_ON_DEMAND'],
      scheduledClasses: 'BOTH',
      normalStoreTypeIds: ['st-1'],
    })
    assert.equal(vis.showScheduledClasses, false)
    assert.equal(vis.showNormalStoreTypes, false)
    assert.equal(vis.showSpecialItemTypes, false)
  })

  it('Scheduled on + Normal only → class + normal store types', () => {
    const vis = getChampEligibilityVisibility({
      enabledModes: ['SCHEDULED'],
      scheduledClasses: 'NORMAL_ONLY',
      normalStoreTypeIds: [],
    })
    assert.equal(vis.showScheduledClasses, true)
    assert.equal(vis.showNormalStoreTypes, true)
    assert.equal(vis.showSpecialItemTypes, false)
  })

  it('Scheduled on + Special/Both → special item types block', () => {
    const both = getChampEligibilityVisibility({
      enabledModes: ['HOT_FOOD_ON_DEMAND', 'SCHEDULED'],
      scheduledClasses: 'BOTH',
      normalStoreTypeIds: [],
    })
    const special = getChampEligibilityVisibility({
      enabledModes: ['SCHEDULED'],
      scheduledClasses: 'SPECIAL_ONLY',
      normalStoreTypeIds: [],
    })
    assert.equal(both.showNormalStoreTypes, true)
    assert.equal(both.showSpecialItemTypes, true)
    assert.equal(special.showNormalStoreTypes, false)
    assert.equal(special.showSpecialItemTypes, true)
  })
})

describe('applyChampModeToggle', () => {
  it('turning Scheduled off keeps class and store-type values', () => {
    const current = {
      enabledModes: ['HOT_FOOD_ON_DEMAND', 'SCHEDULED'],
      scheduledClasses: 'BOTH',
      normalStoreTypeIds: ['st-food'],
      specialStoreTypeIds: ['st-pharm'],
    }
    const next = applyChampModeToggle(current, 'SCHEDULED', false)
    assert.deepEqual(next.enabledModes, ['HOT_FOOD_ON_DEMAND'])
    assert.equal(next.scheduledClasses, 'BOTH')
    assert.deepEqual(next.normalStoreTypeIds, ['st-food'])
    const vis = getChampEligibilityVisibility(next)
    assert.equal(vis.showScheduledClasses, false)
    assert.equal(vis.showNormalStoreTypes, false)
  })

  it('refuses to turn off the last remaining mode', () => {
    const current = {
      enabledModes: ['HOT_FOOD_ON_DEMAND'],
      scheduledClasses: 'NORMAL_ONLY',
      normalStoreTypeIds: [],
    }
    const next = applyChampModeToggle(current, 'HOT_FOOD_ON_DEMAND', false)
    assert.deepEqual(next.enabledModes, ['HOT_FOOD_ON_DEMAND'])
  })
})

describe('applyChampScheduledClasses', () => {
  it('Both → Normal only clears special store type selection', () => {
    const next = applyChampScheduledClasses(
      {
        enabledModes: ['SCHEDULED'],
        scheduledClasses: 'BOTH',
        normalStoreTypeIds: ['st-food'],
        specialStoreTypeIds: ['st-pharm'],
      },
      'NORMAL_ONLY',
    )
    assert.equal(next.scheduledClasses, 'NORMAL_ONLY')
    assert.deepEqual(next.normalStoreTypeIds, ['st-food'])
    assert.deepEqual(next.specialStoreTypeIds, [])
  })

  it('Both → Special only clears normal store types', () => {
    const next = applyChampScheduledClasses(
      {
        enabledModes: ['SCHEDULED'],
        scheduledClasses: 'BOTH',
        normalStoreTypeIds: ['st-food'],
        specialStoreTypeIds: ['st-pharm'],
      },
      'SPECIAL_ONLY',
    )
    assert.deepEqual(next.normalStoreTypeIds, [])
    assert.deepEqual(next.specialStoreTypeIds, ['st-pharm'])
  })
})

describe('clearAllChampNormalStoreTypes', () => {
  it('clears normal store type ids', () => {
    const next = clearAllChampNormalStoreTypes({
      enabledModes: ['SCHEDULED'],
      scheduledClasses: 'NORMAL_ONLY',
      normalStoreTypeIds: ['a', 'b'],
    })
    assert.deepEqual(next.normalStoreTypeIds, [])
  })
})

describe('selectAllChampNormalStoreTypes', () => {
  it('selects every option id', () => {
    const options = [{ id: 'a' }, { id: 'b' }, { id: 'a' }]
    const next = selectAllChampNormalStoreTypes(
      {
        enabledModes: ['SCHEDULED'],
        scheduledClasses: 'NORMAL_ONLY',
        normalStoreTypeIds: [],
      },
      options,
    )
    assert.deepEqual(next.normalStoreTypeIds, ['a', 'b'])
  })
})

describe('champAllowedCategorySlugsFromEligibility', () => {
  it('maps normal ids to slugs when Normal block is visible', () => {
    const slugs = champAllowedCategorySlugsFromEligibility(
      {
        enabledModes: ['SCHEDULED'],
        scheduledClasses: 'BOTH',
        normalStoreTypeIds: ['id-food', 'id-pharm'],
      },
      [
        { id: 'id-food', slug: 'food' },
        { id: 'id-pharm', slug: 'pharmacy' },
      ],
    )
    assert.deepEqual(slugs, ['food', 'pharmacy'])
  })

  it('returns null when Normal store types are hidden', () => {
    const slugs = champAllowedCategorySlugsFromEligibility(
      {
        enabledModes: ['SCHEDULED'],
        scheduledClasses: 'SPECIAL_ONLY',
        normalStoreTypeIds: ['id-food'],
      },
      [{ id: 'id-food', slug: 'food' }],
    )
    assert.equal(slugs, null)
  })
})

describe('mapSpecialItemTypesToStoreTypeIds', () => {
  it('keeps a selected store type id only when special items are enabled', () => {
    const ids = mapSpecialItemTypesToStoreTypeIds(['st-pharm', 'st-food'], [
      { id: 'st-pharm', name: 'Pharmacy', slug: 'pharmacy', allowsSpecialItems: true },
      { id: 'st-food', name: 'Food', slug: 'food', allowsSpecialItems: false },
    ])
    assert.deepEqual(ids, ['st-pharm'])
  })

  it('maps a store type name when that type allows special items', () => {
    const ids = mapSpecialItemTypesToStoreTypeIds(['Pharmacy'], [
      { id: 'st-pharm', name: 'Pharmacy', slug: 'pharmacy', allowsSpecialItems: true },
      { id: 'st-food', name: 'Food', slug: 'food', allowsSpecialItems: true },
    ])
    assert.deepEqual(ids, ['st-pharm'])
  })

  it('does not expand a handling label to every store type', () => {
    const ids = mapSpecialItemTypesToStoreTypeIds(['Fragile'], [
      { id: 'a', name: 'Food', slug: 'food', allowsSpecialItems: true },
      { id: 'b', name: 'Grocery', slug: 'grocery', allowsSpecialItems: true },
    ])
    assert.deepEqual(ids, [])
  })
})

describe('toggleChampNormalStoreType', () => {
  it('toggles ids without hardcoding store type names', () => {
    let next = toggleChampNormalStoreType(EMPTY_CHAMP_ELIGIBILITY, 'id-food')
    assert.deepEqual(next.normalStoreTypeIds, ['id-food'])
    next = toggleChampNormalStoreType(next, 'id-pharm')
    assert.deepEqual(next.normalStoreTypeIds, ['id-food', 'id-pharm'])
    next = toggleChampNormalStoreType(next, 'id-food')
    assert.deepEqual(next.normalStoreTypeIds, ['id-pharm'])
  })
})

describe('validateChampEligibility / buildChampEligibilityPayload', () => {
  it('requires at least one mode', () => {
    const result = validateChampEligibility({
      enabledModes: [],
      scheduledClasses: 'NORMAL_ONLY',
      normalStoreTypeIds: [],
    })
    assert.equal(result.ok, false)
    assert.equal(result.message, CHAMP_MODE_REQUIRED_MESSAGE)
  })

  it('requires ≥1 special item type when Special is included and Scheduled is on', () => {
    const result = validateChampEligibility(
      {
        enabledModes: ['SCHEDULED'],
        scheduledClasses: 'BOTH',
        normalStoreTypeIds: [],
      },
      { specialItemTypes: [], storeTypeOptions: [] },
    )
    assert.equal(result.ok, false)
    assert.equal(result.message, CHAMP_SPECIAL_ITEM_TYPES_REQUIRED_MESSAGE)
  })

  it('does not require special types when Scheduled is off (values may still be kept)', () => {
    const result = validateChampEligibility({
      enabledModes: ['HOT_FOOD_ON_DEMAND'],
      scheduledClasses: 'BOTH',
      normalStoreTypeIds: [],
    })
    assert.equal(result.ok, true)
  })

  it('build payload maps special item types to specialStoreTypeIds', () => {
    const payload = buildChampEligibilityPayload(
      {
        enabledModes: ['HOT_FOOD_ON_DEMAND', 'SCHEDULED'],
        scheduledClasses: 'SPECIAL_ONLY',
        normalStoreTypeIds: [],
      },
      {
        specialItemTypes: ['st-1'],
        storeTypeOptions: [
          { id: 'st-1', name: 'Pharmacy', slug: 'pharmacy', allowsSpecialItems: true },
        ],
      },
    )
    assert.deepEqual(payload, {
      enabledModes: ['HOT_FOOD_ON_DEMAND', 'SCHEDULED'],
      scheduledClasses: 'SPECIAL_ONLY',
      specialStoreTypeIds: ['st-1'],
    })
  })
})
