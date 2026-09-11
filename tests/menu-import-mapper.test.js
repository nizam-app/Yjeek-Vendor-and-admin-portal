import assert from 'node:assert/strict'
import test from 'node:test'
import {
  KNOWN_CREATE_ERRORS,
  canCancelImport,
  canEditReview,
  isPollingStatus,
  mapAdminMenuImport,
  mapAdminMenuImportList,
  mapAdminMenuImportReview,
  menuImportErrorCode,
  messageForMenuImportError,
  parseBhdInput,
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
