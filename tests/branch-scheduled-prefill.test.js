import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  mergeScheduledPrefillSources,
  pickScheduledPrefill,
  scheduledFormHasDisplayValues,
} from '../src/utils/branchScheduledPrefill.js'

describe('branchScheduledPrefill', () => {
  it('detects display values on normalized scheduled form', () => {
    const form = mergeScheduledPrefillSources({
      tiers: { SAME_DAY: { vendorNormal: '0.500' } },
    })
    assert.equal(scheduledFormHasDisplayValues(form), true)
    assert.equal(form.tiers.SAME_DAY.vendorNormal, '0.500')
  })

  it('prefers vendor template over store type for filled tiers', () => {
    const picked = pickScheduledPrefill(
      {
        tiers: {
          SAME_DAY: {
            vendorNormal: { value: '0.900', state: 'inherited', defaultValue: '0.100' },
          },
        },
      },
      { tiers: { SAME_DAY: { vendorNormal: '0.100' } } },
    )
    assert.equal(picked.tiers.SAME_DAY.vendorNormal, '0.900')
  })
})
