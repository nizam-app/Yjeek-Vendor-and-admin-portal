import assert from 'node:assert/strict'
import test from 'node:test'
import {
  KNOWN_CREATE_ERRORS,
  canCancelImport,
  canEditReview,
  formatImportAvailabilitySummary,
  formatImportBadgesSummary,
  isPollingStatus,
  mapAdminMenuImport,
  mapAdminMenuImportList,
  mapAdminMenuImportReview,
  menuImportErrorCode,
  messageForMenuImportError,
  normalizeImportAvailabilitySlots,
  parseBhdInput,
  toggleImportAvailabilitySlot,
} from '../src/mappers/admin/mapAdminMenuImport.js'

test('mapAdminMenuImportList accepts a raw array or { imports } or paged { items }', () => {
  const row = { id: 'imp-1', vendorId: 'vnd-1', status: 'REVIEW', price: 1.5 }
  assert.equal(mapAdminMenuImportList([row]).items[0].id, 'imp-1')
  assert.equal(mapAdminMenuImportList({ imports: [row] }).items[0].id, 'imp-1')
  assert.equal(mapAdminMenuImportList({ items: [row], total: 1, page: 1, limit: 5, totalPages: 1 }).items[0].id, 'imp-1')
  assert.equal(mapAdminMenuImportList({ items: [row], total: 1, page: 1, limit: 5, totalPages: 1 }).limit, 5)
  assert.deepEqual(mapAdminMenuImportList(null).items, [])
})

test('mapAdminMenuImportReview nests categories and BHD prices', () => {
  const mapped = mapAdminMenuImportReview({
    id: 'imp-1',
    status: 'REVIEW',
    categories: [
      {
        id: 'cat-1',
        name: 'Mains',
        items: [{ id: 'item-1', name: 'Biryani', price: 1.5555 }],
      },
    ],
  })
  assert.equal(mapped.categories[0].items[0].price, 1.556)
})

test('status helpers match Gate 1 lifecycle', () => {
  assert.equal(isPollingStatus('PROCESSING'), true)
  assert.equal(isPollingStatus('REVIEW'), false)
  assert.equal(canCancelImport('REVIEW'), true)
  assert.equal(canCancelImport('PUBLISHING'), false)
  assert.equal(canEditReview('REVIEW'), true)
  assert.equal(canEditReview('COMPLETED'), false)
})

test('menuImportErrorCode reads BFF envelope codes', () => {
  const err = {
    raw: { success: false, error: { code: 'AGGREGATOR_URL_FORBIDDEN', message: 'no' } },
  }
  assert.equal(menuImportErrorCode(err), 'AGGREGATOR_URL_FORBIDDEN')
  assert.equal(
    messageForMenuImportError(err),
    KNOWN_CREATE_ERRORS.AGGREGATOR_URL_FORBIDDEN,
  )
})

test('parseBhdInput rounds to 3 decimals', () => {
  assert.equal(parseBhdInput('1.5555'), 1.556)
  assert.equal(parseBhdInput(''), null)
  assert.equal(mapAdminMenuImport({ id: 'x' }).id, 'x')
})

test('availability slot helpers match spreadsheet semantics', () => {
  assert.deepEqual(normalizeImportAvailabilitySlots(['ALL_DAY', 'LUNCH']), ['ALL_DAY'])
  assert.deepEqual(toggleImportAvailabilitySlot(['ALL_DAY'], 'LUNCH'), ['LUNCH'])
  assert.deepEqual(toggleImportAvailabilitySlot(['LUNCH', 'DINNER'], 'LUNCH'), ['DINNER'])
  assert.equal(
    formatImportAvailabilitySummary({ availabilitySlots: ['LUNCH', 'DINNER'] }),
    'Lunch, Dinner',
  )
  assert.equal(
    formatImportAvailabilitySummary({ availableFrom: '11:00', availableTo: '23:00' }),
    '11:00–23:00',
  )
})

test('formatImportBadgesSummary humanizes unknown codes', () => {
  assert.equal(formatImportBadgesSummary([]), '—')
  assert.equal(
    formatImportBadgesSummary(['NEW', 'TOP_RATED'], { NEW: 'New' }),
    'New, Top Rated',
  )
  assert.equal(
    formatImportBadgesSummary(['A', 'B', 'C'], { A: 'Alpha', B: 'Beta' }),
    'Alpha, Beta +1',
  )
})
