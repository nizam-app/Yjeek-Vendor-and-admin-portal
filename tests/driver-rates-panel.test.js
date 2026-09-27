/**
 * D07 Batch 3 — driver rates form helpers (normalize / payload / separate bike+car grids).
 */
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  EMPTY_DRIVER_RATES,
  SCHEDULED_SPEED_TIERS,
  buildDriverRatesPayload,
  extractDriverRatesFieldMeta,
  hasSeparateScheduledDriverGrids,
  normalizeDriverRates,
} from '../src/components/admin/management/driverRatesForm.js'

describe('normalizeDriverRates', () => {
  it('keeps empty cells empty (not zero) for flat store-type shape', () => {
    const form = normalizeDriverRates({
      onDemand: {
        bikeBase: '0.900',
        carBase: null,
        freeRadiusKm: '9.00',
        extraPerKm: null,
      },
      scheduledBike: {
        tiers: {
          SAME_DAY: { normal: '1.500', special: null },
        },
      },
      scheduledCar: null,
    })
    assert.equal(form.onDemand.bikeBase, '0.900')
    assert.equal(form.onDemand.carBase, '')
    assert.equal(form.onDemand.extraPerKm, '')
    assert.equal(form.scheduledBike.tiers.SAME_DAY.normal, '1.500')
    assert.equal(form.scheduledBike.tiers.SAME_DAY.special, '')
    assert.equal(form.scheduledBike.tiers.NEXT_DAY.normal, '')
    assert.equal(form.scheduledCar.tiers.SAME_DAY.normal, '')
  })

  it('unwraps branch inherited { value, state } cells', () => {
    const form = normalizeDriverRates({
      onDemand: {
        bikeBase: { value: '1.100', state: 'overridden', defaultValue: '0.900' },
        carBase: { value: null, state: 'inherited', defaultValue: null },
        freeRadiusKm: { value: '9.00', state: 'inherited', defaultValue: '9.00' },
        extraPerKm: { value: '0.075', state: 'inherited', defaultValue: '0.075' },
      },
      scheduledBike: {
        tiers: {
          SAME_DAY: {
            normal: { value: '1.500', state: 'inherited', defaultValue: '1.500' },
            special: { value: null, state: 'inherited', defaultValue: null },
          },
        },
      },
      scheduledCar: {
        tiers: {
          ECONOMY: {
            normal: { value: '0.800', state: 'overridden', defaultValue: null },
            special: { value: null, state: 'inherited', defaultValue: null },
          },
        },
      },
    })
    assert.equal(form.onDemand.bikeBase, '1.100')
    assert.equal(form.onDemand.carBase, '')
    assert.equal(form.scheduledBike.tiers.SAME_DAY.normal, '1.500')
    assert.equal(form.scheduledCar.tiers.ECONOMY.normal, '0.800')
    assert.equal(form.scheduledCar.tiers.SAME_DAY.normal, '')
  })
})

describe('extractDriverRatesFieldMeta', () => {
  it('returns null for flat store-type payloads', () => {
    assert.equal(
      extractDriverRatesFieldMeta({
        onDemand: { bikeBase: '0.900' },
        scheduledBike: { tiers: { SAME_DAY: { normal: '1.500' } } },
      }),
      null,
    )
  })

  it('extracts inheritance for on-demand and separate bike/car grids', () => {
    const meta = extractDriverRatesFieldMeta({
      onDemand: {
        bikeBase: { value: '1.100', state: 'overridden', defaultValue: '0.900' },
        carBase: { value: '0.950', state: 'inherited', defaultValue: '0.950' },
      },
      scheduledBike: {
        tiers: {
          SAME_DAY: {
            normal: { value: '1.500', state: 'inherited', defaultValue: '1.500' },
          },
        },
      },
      scheduledCar: {
        tiers: {
          SAME_DAY: {
            special: { value: '3.000', state: 'overridden', defaultValue: null },
          },
        },
      },
    })
    assert.equal(meta.onDemand.bikeBase.state, 'overridden')
    assert.equal(meta.onDemand.bikeBase.defaultValue, '0.900')
    assert.equal(meta.scheduledBike.tiers.SAME_DAY.normal.state, 'inherited')
    assert.equal(meta.scheduledCar.tiers.SAME_DAY.special.state, 'overridden')
  })
})

describe('buildDriverRatesPayload', () => {
  it('emits separate scheduledBike and scheduledCar; empty → null; no distance keys', () => {
    const form = normalizeDriverRates({
      onDemand: {
        bikeBase: '0.900',
        carBase: '',
        freeRadiusKm: '9',
        extraPerKm: '0.075',
      },
      scheduledBike: {
        tiers: {
          SAME_DAY: { normal: '1.500', special: '3.500' },
        },
      },
      scheduledCar: {
        tiers: {
          ECONOMY: { normal: '', special: '2.000' },
        },
      },
    })
    const payload = buildDriverRatesPayload(form)

    assert.equal(payload.onDemand.bikeBase, '0.900')
    assert.equal(payload.onDemand.carBase, null)
    assert.equal(payload.onDemand.freeRadiusKm, '9')
    assert.equal(payload.onDemand.extraPerKm, '0.075')

    assert.ok(payload.scheduledBike)
    assert.ok(payload.scheduledCar)
    assert.notEqual(payload.scheduledBike, payload.scheduledCar)

    for (const tier of SCHEDULED_SPEED_TIERS) {
      assert.ok(tier in payload.scheduledBike.tiers)
      assert.ok(tier in payload.scheduledCar.tiers)
      assert.equal('radiusKm' in payload.scheduledBike.tiers[tier], false)
      assert.equal('extraPerKm' in payload.scheduledBike.tiers[tier], false)
      assert.equal('maxDistanceKm' in payload.scheduledCar.tiers[tier], false)
      assert.equal('perKm' in payload.scheduledCar.tiers[tier], false)
    }

    assert.equal(payload.scheduledBike.tiers.SAME_DAY.normal, '1.500')
    assert.equal(payload.scheduledBike.tiers.SAME_DAY.special, '3.500')
    assert.equal(payload.scheduledBike.tiers.NEXT_DAY.normal, null)
    assert.equal(payload.scheduledCar.tiers.ECONOMY.normal, null)
    assert.equal(payload.scheduledCar.tiers.ECONOMY.special, '2.000')
    assert.equal(payload.scheduledCar.tiers.SAME_DAY.normal, null)

    assert.equal('scheduled' in payload, false)
    assert.ok(hasSeparateScheduledDriverGrids(payload))
  })

  it('empty form still emits two separate grids with null cells', () => {
    const payload = buildDriverRatesPayload(EMPTY_DRIVER_RATES)
    assert.ok(hasSeparateScheduledDriverGrids(payload))
    assert.equal(payload.scheduledBike.tiers.SAME_DAY.normal, null)
    assert.equal(payload.scheduledCar.tiers.SAME_DAY.normal, null)
    assert.equal(payload.onDemand.bikeBase, null)
  })
})
