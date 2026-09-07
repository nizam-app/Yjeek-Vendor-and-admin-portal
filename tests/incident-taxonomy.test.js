import assert from 'node:assert/strict'
import test from 'node:test'
import {
  INCIDENT_CATEGORY_TAXONOMY,
  RESOLUTION_ACTION_TAXONOMY,
  isCanonicalResolutionCode,
  listAgentRaisableCategories,
  listCanonicalResolutionCodes,
} from '../src/lib/incidentTaxonomy.js'
import { formatIncidentCategory, formatResolutionLabel } from '../src/lib/adminIncidentPresentation.js'

test('category taxonomy includes REPEATED_JUSTIFIED_DECLINES as non-agent', () => {
  const row = INCIDENT_CATEGORY_TAXONOMY.find((r) => r.category === 'REPEATED_JUSTIFIED_DECLINES')
  assert.equal(row?.agentRaisable, false)
  assert.ok(listAgentRaisableCategories().every((r) => r.agentRaisable))
})

test('resolution vocabulary is closed — free text rejected', () => {
  assert.equal(isCanonicalResolutionCode('Customer was happy'), false)
  assert.equal(isCanonicalResolutionCode('REFUND_PARTIAL'), true)
  assert.equal(isCanonicalResolutionCode('REFUND_PARTIAL_SLA_BREACH'), true)
  assert.equal(listCanonicalResolutionCodes().length, RESOLUTION_ACTION_TAXONOMY.length)
})

test('presentation labels come from taxonomy', () => {
  assert.equal(formatIncidentCategory({ category: 'DELIVERY_LATE' }), 'Delivery late')
  assert.equal(formatResolutionLabel('NO_ACTION_UNFOUNDED'), 'No action — unfounded')
})
