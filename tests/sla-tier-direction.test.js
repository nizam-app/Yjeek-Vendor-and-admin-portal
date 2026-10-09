import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  deriveTierSecondsFromTarget,
  isHigherTierOrderingApiKey,
} from '../src/mappers/admin/slaTierDirection.js'
import { validateDurationTierSeconds } from '../src/mappers/admin/validateAdminSlaTier.js'

describe('slaTierDirection', () => {
  it('deriveTierSecondsFromTarget decreases tiers for ≥ metrics', () => {
    const tier = deriveTierSecondsFromTarget(1800, true)
    assert.equal(tier.target, 1800)
    assert.ok(tier.atRisk <= tier.target)
    assert.ok(tier.critical <= tier.atRisk)
  })

  it('latePickupGraceSec uses higher-tier ordering in API validation', () => {
    assert.ok(isHigherTierOrderingApiKey('latePickupGraceSec'))
    const issues = validateDurationTierSeconds(1800, 1200, 900, true)
    assert.equal(issues.length, 0)
  })
})
