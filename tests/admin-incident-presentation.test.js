import assert from 'node:assert/strict'
import test from 'node:test'
import {
  enrichIncidentRow,
  formatIncidentAge,
  formatRecurrenceLabel,
  formatRecurrenceOrdinal,
  formatResolutionLabel,
  highestIncidentPriority,
  isIncidentUnattended,
} from '../src/lib/adminIncidentPresentation.js'
import {
  buildOrderIncidentIndex,
  orderMatchesIncidentFilters,
} from '../src/lib/adminOrderIncidentIndex.js'
import { orderMatchesLiveQuery, sortLiveOrders } from '../src/lib/adminLiveOrderQuery.js'

test('formatIncidentAge returns compact runtime age', () => {
  const opened = new Date(Date.now() - 4 * 60 * 1000).toISOString()
  assert.equal(formatIncidentAge(opened), '4m')
})

test('highestIncidentPriority prefers P1 over P2', () => {
  assert.equal(
    highestIncidentPriority([{ priority: 'P2' }, { priority: 'P1' }]),
    'P1',
  )
})

test('legacy incident falls back without throwing', () => {
  const row = enrichIncidentRow({ id: 'legacy', title: 'Late delivery', status: 'Open' })
  assert.equal(row.categoryLabel, 'Late delivery')
  assert.equal(row.unattended, true)
  assert.equal(row.priority, null)
  assert.equal(row.severityLabel, 'UNCLASSIFIED')
})

test('legacy incident keeps explicit priority', () => {
  const row = enrichIncidentRow({ id: 'legacy-p3', priority: 'P3', title: 'Late delivery', status: 'Open' })
  assert.equal(row.priority, 'P3')
  assert.equal(row.severityLabel, 'P3')
})

test('resolved readiness incident is not unattended', () => {
  const row = enrichIncidentRow({
    id: 'resolved',
    priority: 'P2',
    status: 'Resolved',
    statusRaw: 'RESOLVED',
    lifecycleState: 'RESOLVED',
    resolutionActionCode: 'REFUND_PARTIAL',
    resolvedAt: new Date().toISOString(),
  })
  assert.equal(isIncidentUnattended(row), false)
  assert.equal(formatResolutionLabel('REFUND_PARTIAL'), 'Partial refund')
  assert.equal(row.resolutionLabel, 'Partial refund')
})

test('reopened incident shows previous resolution label not current', () => {
  const row = enrichIncidentRow({
    id: 'reopened',
    priority: 'P2',
    status: 'Open',
    statusRaw: 'OPEN',
    lifecycleState: 'REOPENED',
    resolutionActionCode: null,
    previousResolutionActionCode: 'REFUND_FULL',
    resolvedAt: null,
  })
  assert.equal(row.resolutionLabel, null)
  assert.equal(row.previousResolutionLabel, 'Full refund')
})

test('formatRecurrenceOrdinal renders 2nd and 3rd claim labels', () => {
  assert.equal(formatRecurrenceOrdinal(2), '2nd claim · 14d')
  assert.equal(formatRecurrenceOrdinal(3), '3rd claim · 14d')
  assert.equal(formatRecurrenceOrdinal(4), '4th claim · 14d')
  assert.equal(formatRecurrenceOrdinal(11), '11th claim · 14d')
  assert.equal(formatRecurrenceLabel({ recurrenceCount14d: 3 }), '3rd claim · 14d')
  assert.equal(formatRecurrenceLabel({ recurredWithin14Days: true }), 'Repeated within 14d')
  assert.equal(formatRecurrenceLabel({ recurredWithin14Days: false }), null)
})

test('buildOrderIncidentIndex merges multiple incidents per order', () => {
  const index = buildOrderIncidentIndex([
    {
      id: 'a',
      orderId: 'order-1',
      priority: 'P3',
      category: 'DELIVERY_LATE',
      createdAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
      status: 'Open',
    },
    {
      id: 'b',
      orderId: 'order-1',
      priority: 'P1',
      category: 'FOOD_POISONING_REPORT',
      createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      status: 'Open',
    },
  ])
  const summary = index.get('order-1')
  assert.equal(summary.count, 2)
  assert.equal(summary.highestPriority, 'P1')
})

test('unclassified severity filter matches orders without ranked priority', () => {
  const order = {
    hasIncident: true,
    incidentSummary: {
      highestPriority: null,
      categories: ['Late delivery'],
      unattended: true,
    },
  }
  assert.equal(orderMatchesIncidentFilters(order, { incidentSeverities: ['UNCLASSIFIED'] }), true)
  assert.equal(orderMatchesIncidentFilters(order, { incidentSeverities: ['P1'] }), false)
})

test('incident filters combine with severity and unattended', () => {
  const order = {
    hasIncident: true,
    incidentSummary: {
      highestPriority: 'P1',
      categories: ['Delivery late'],
      unattended: true,
    },
  }
  assert.equal(
    orderMatchesIncidentFilters(order, { incidentSeverities: ['P1'], incidentUnattended: true }),
    true,
  )
  assert.equal(
    orderMatchesLiveQuery(order, {
      q: '',
      vendorIds: [],
      types: [],
      champIds: [],
      incidentSeverities: ['P2'],
      incidentCategories: [],
      incidentUnattended: false,
      sort: 'time_left',
    }),
    false,
  )
})

test('sortLiveOrders supports incident age oldest first', () => {
  const sorted = sortLiveOrders(
    [
      {
        id: 'new',
        incidentSummary: { oldestOpenedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString() },
      },
      {
        id: 'old',
        incidentSummary: { oldestOpenedAt: new Date(Date.now() - 40 * 60 * 1000).toISOString() },
      },
    ],
    'incident_age_oldest',
  )
  assert.equal(sorted[0].id, 'old')
})
