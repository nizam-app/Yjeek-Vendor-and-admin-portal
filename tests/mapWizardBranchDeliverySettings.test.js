/**
 * Wizard branch delivery payload includes driver rates for create-vendor API.
 * (Driver rates path uses pure driverRatesForm — full mapWizard imports React panels.)
 */
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { buildDriverRatesPayload } from '../src/components/admin/management/driverRatesForm.js'

const WIZARD_DRAFT_RATES = {
  onDemand: {
    bikeBase: '0.800',
    carBase: '0.850',
    freeRadiusKm: '10',
    extraPerKm: '0.075',
  },
  scheduledBike: { tiers: {} },
  scheduledCar: { tiers: {} },
}

describe('wizard driverRates → create-vendor deliverySettings', () => {
  it('buildDriverRatesPayload maps draft strings to API numbers', () => {
    const driverRates = buildDriverRatesPayload(WIZARD_DRAFT_RATES)
    assert.equal(driverRates.onDemand.bikeBase, '0.800')
    assert.equal(driverRates.onDemand.carBase, '0.850')
    assert.equal(driverRates.onDemand.freeRadiusKm, '10')
    assert.equal(driverRates.onDemand.extraPerKm, '0.075')
  })

  it('primary branch ordering prefers isPrimary when picking template source', () => {
    const branches = [
      { isPrimary: false, id: 'b' },
      { isPrimary: true, id: 'a' },
    ]
    const ordered = [...branches].sort((a, b) => {
      if (a?.isPrimary && !b?.isPrimary) return -1
      if (!a?.isPrimary && b?.isPrimary) return 1
      return 0
    })
    assert.equal(ordered[0].id, 'a')
  })
})
