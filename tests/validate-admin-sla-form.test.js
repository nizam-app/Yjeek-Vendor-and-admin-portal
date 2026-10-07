import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  groupSlaValidationErrors,
  slaFieldErrorId,
  validateDurationTierForm,
} from '../src/mappers/admin/validateAdminSlaTier.js'

describe('validateAdminSlaForm', () => {
  it('flags critical below at-risk for lower-is-better tiers', () => {
    const issues = validateDurationTierForm(
      {
        target: { operator: '≤', h: '00', m: '06', s: '00' },
        atRisk: { operator: '≤', h: '00', m: '05', s: '00' },
        critical: { operator: '≤', h: '00', m: '03', s: '00' },
      },
      false,
    )

    assert.ok(issues.some((issue) => issue.tierPart === 'critical'))
    assert.ok(issues.some((issue) => /Critical threshold/.test(issue.message)))
  })

  it('groups errors per metric row', () => {
    const grouped = groupSlaValidationErrors([
      {
        id: slaFieldErrorId('vendor', 'hot-food', null, 'acceptance'),
        tierPart: 'atRisk',
        message: 'At-risk threshold must be greater than or equal to target',
      },
      {
        id: slaFieldErrorId('vendor', 'hot-food', null, 'acceptance'),
        tierPart: 'critical',
        message: 'Critical threshold must be greater than or equal to at-risk',
      },
    ])
    const row = grouped[slaFieldErrorId('vendor', 'hot-food', null, 'acceptance')]
    assert.equal(row.messages.length, 2)
    assert.ok(row.tiers.critical)
  })
})
