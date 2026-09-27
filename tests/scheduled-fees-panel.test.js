/**
 * D06 Batch 3 — scheduled fee form helpers (normalize / payload / no distance).
 */
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  EMPTY_SCHEDULED_FEES,
  SCHEDULED_SPEED_TIERS,
  buildScheduledFeesPayload,
  extractScheduledFieldMeta,
  normalizeScheduledFees,
} from '../src/components/admin/management/scheduledFeesForm.js'

describe('normalizeScheduledFees', () => {
  it('keeps empty cells empty (not zero) for flat store-type shape', () => {
    const form = normalizeScheduledFees({
      tiers: {
        SAME_DAY: {
          vendorNormal: '0.500',
          vendorSpecial: null,
          customerNormal: null,
          customerSpecial: null,
          minOrderAmount: null,
          freeDeliveryEnabled: false,
          freeDeliveryOver: null,
        },
      },
    })
    assert.equal(form.tiers.SAME_DAY.vendorNormal, '0.500')
    assert.equal(form.tiers.SAME_DAY.vendorSpecial, '')
    assert.equal(form.tiers.SAME_DAY.customerNormal, '')
    assert.equal(form.tiers.NEXT_DAY.vendorNormal, '')
  })

  it('unwraps branch inherited { value, state } cells', () => {
    const form = normalizeScheduledFees({
      tiers: {
        NEXT_DAY: {
          vendorNormal: { value: '1.250', state: 'overridden', defaultValue: '0.900' },
          customerNormal: { value: null, state: 'inherited', defaultValue: null },
          freeDeliveryEnabled: { value: true, state: 'inherited', defaultValue: true },
          freeDeliveryOver: { value: '5.000', state: 'inherited', defaultValue: '5.000' },
        },
      },
    })
    assert.equal(form.tiers.NEXT_DAY.vendorNormal, '1.250')
    assert.equal(form.tiers.NEXT_DAY.customerNormal, '')
    assert.equal(form.tiers.NEXT_DAY.freeDeliveryEnabled, true)
    assert.equal(form.tiers.NEXT_DAY.freeDeliveryOver, '5.000')
  })
})

describe('extractScheduledFieldMeta', () => {
  it('returns null for flat store-type payloads', () => {
    assert.equal(
      extractScheduledFieldMeta({
        tiers: { SAME_DAY: { vendorNormal: '0.500' } },
      }),
      null,
    )
  })

  it('extracts per-tier inheritance for branch payloads', () => {
    const meta = extractScheduledFieldMeta({
      tiers: {
        SAME_DAY: {
          vendorNormal: { value: '0.500', state: 'overridden', defaultValue: '0.400' },
          customerNormal: { value: '0.900', state: 'inherited', defaultValue: '0.900' },
        },
      },
    })
    assert.equal(meta.tiers.SAME_DAY.vendorNormal.state, 'overridden')
    assert.equal(meta.tiers.SAME_DAY.vendorNormal.defaultValue, '0.400')
    assert.equal(meta.tiers.SAME_DAY.customerNormal.state, 'inherited')
  })
})

describe('buildScheduledFeesPayload', () => {
  it('emits all four tiers; empty money → null; free off clears over', () => {
    const form = normalizeScheduledFees({
      tiers: {
        SAME_DAY: {
          vendorNormal: '0.500',
          customerNormal: '',
          freeDeliveryEnabled: false,
          freeDeliveryOver: '9.000',
        },
        ECONOMY: {
          vendorNormal: '0.200',
          freeDeliveryEnabled: true,
          freeDeliveryOver: '12.000',
        },
      },
    })
    const payload = buildScheduledFeesPayload(form)
    assert.deepEqual(Object.keys(payload.tiers).sort(), [...SCHEDULED_SPEED_TIERS].sort())
    assert.equal(payload.tiers.SAME_DAY.vendorNormal, '0.500')
    assert.equal(payload.tiers.SAME_DAY.customerNormal, null)
    assert.equal(payload.tiers.SAME_DAY.freeDeliveryEnabled, false)
    assert.equal(payload.tiers.SAME_DAY.freeDeliveryOver, null)
    assert.equal(payload.tiers.ECONOMY.freeDeliveryEnabled, true)
    assert.equal(payload.tiers.ECONOMY.freeDeliveryOver, '12.000')
  })

  it('never emits distance keys', () => {
    const payload = buildScheduledFeesPayload(EMPTY_SCHEDULED_FEES)
    const json = JSON.stringify(payload)
    for (const key of ['radiusKm', 'extraPerKm', 'maxDistanceKm', 'perKm', 'maxDistance', 'radius']) {
      assert.equal(json.includes(`"${key}"`), false, `must not include ${key}`)
    }
    for (const tier of SCHEDULED_SPEED_TIERS) {
      const keys = Object.keys(payload.tiers[tier]).sort()
      assert.deepEqual(keys, [
        'customerNormal',
        'customerSpecial',
        'freeDeliveryEnabled',
        'freeDeliveryOver',
        'minOrderAmount',
        'vendorNormal',
        'vendorSpecial',
      ])
    }
  })

  it('round-trips normalize → build without inventing zeros', () => {
    const incoming = {
      tiers: {
        SAME_DAY: {
          vendorNormal: { value: null, state: 'inherited', defaultValue: null },
          vendorSpecial: { value: null, state: 'inherited', defaultValue: null },
          customerNormal: { value: null, state: 'inherited', defaultValue: null },
          customerSpecial: { value: null, state: 'inherited', defaultValue: null },
          minOrderAmount: { value: null, state: 'inherited', defaultValue: null },
          freeDeliveryEnabled: { value: false, state: 'inherited', defaultValue: false },
          freeDeliveryOver: { value: null, state: 'inherited', defaultValue: null },
        },
        NEXT_DAY: {
          vendorNormal: { value: '0.750', state: 'overridden', defaultValue: null },
          vendorSpecial: { value: null, state: 'inherited', defaultValue: null },
          customerNormal: { value: '1.100', state: 'overridden', defaultValue: null },
          customerSpecial: { value: null, state: 'inherited', defaultValue: null },
          minOrderAmount: { value: null, state: 'inherited', defaultValue: null },
          freeDeliveryEnabled: { value: false, state: 'inherited', defaultValue: false },
          freeDeliveryOver: { value: null, state: 'inherited', defaultValue: null },
        },
      },
    }
    const form = normalizeScheduledFees(incoming)
    assert.equal(form.tiers.SAME_DAY.vendorNormal, '')
    assert.equal(form.tiers.NEXT_DAY.vendorNormal, '0.750')
    const out = buildScheduledFeesPayload(form)
    assert.equal(out.tiers.SAME_DAY.vendorNormal, null)
    assert.equal(out.tiers.NEXT_DAY.vendorNormal, '0.750')
    assert.equal(out.tiers.NEXT_DAY.customerNormal, '1.100')
    assert.equal(out.tiers.STANDARD.vendorNormal, null)
  })
})
