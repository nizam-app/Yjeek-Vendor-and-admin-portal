import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  branchDriverRatesCaption,
  shouldShowBranchDeliveryFleet,
  shouldShowOnDemandDriverRates,
} from '../src/components/admin/management/branchDeliveryFleet.js'

const off = { enabled: false }
const on = { enabled: true }

describe('branch delivery fleet visibility', () => {
  it('hides vehicles and on-demand rates when hot food and scheduled are off', () => {
    const modes = { HOT_FOOD_ON_DEMAND: off, SCHEDULED: off, PICKUP: on }
    assert.equal(shouldShowBranchDeliveryFleet(modes), false)
    assert.equal(shouldShowOnDemandDriverRates(modes), false)
  })

  it('shows vehicles when only hot food is on, with on-demand rates', () => {
    const modes = { HOT_FOOD_ON_DEMAND: on, SCHEDULED: off }
    assert.equal(shouldShowBranchDeliveryFleet(modes), true)
    assert.equal(shouldShowOnDemandDriverRates(modes), true)
    assert.match(branchDriverRatesCaption(true, false), /on-demand distance/)
  })

  it('shows vehicles when only scheduled is on, without on-demand rates', () => {
    const modes = { HOT_FOOD_ON_DEMAND: off, SCHEDULED: on }
    assert.equal(shouldShowBranchDeliveryFleet(modes), true)
    assert.equal(shouldShowOnDemandDriverRates(modes), false)
    assert.match(branchDriverRatesCaption(false, true), /scheduled flat/)
  })

  it('shows both rate captions when both delivery modes are on', () => {
    const modes = { HOT_FOOD_ON_DEMAND: on, SCHEDULED: on }
    assert.equal(shouldShowBranchDeliveryFleet(modes), true)
    assert.match(branchDriverRatesCaption(true, true), /on-demand distance \+ scheduled flat/)
  })
})
