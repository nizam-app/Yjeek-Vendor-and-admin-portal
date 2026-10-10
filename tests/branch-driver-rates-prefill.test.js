import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  driverRatesFormHasDisplayValues,
  mergeDriverRatesPrefillSources,
  pickDriverRatesPrefill,
} from '../src/components/admin/management/driverRatesForm.js'

describe('branchDriverRatesPrefill helpers', () => {
  it('detects display values on normalized driver rates form', () => {
    const form = mergeDriverRatesPrefillSources({
      onDemand: { bikeBase: '1.500' },
    })
    assert.equal(driverRatesFormHasDisplayValues(form), true)
    assert.equal(form.onDemand.bikeBase, '1.500')
  })

  it('merges store type over platform for empty cells', () => {
    const picked = pickDriverRatesPrefill(
      { scheduledCar: { tiers: { SAME_DAY: { normal: '2.000' } } } },
      { scheduledCar: { tiers: { SAME_DAY: { special: '3.500' } } } },
    )
    assert.equal(picked.scheduledCar.tiers.SAME_DAY.normal, '2.000')
    assert.equal(picked.scheduledCar.tiers.SAME_DAY.special, '3.500')
  })
})
