import assert from 'node:assert/strict'
import test from 'node:test'
import {
  formatBuyerChampDisplayStatus,
  isChampFree,
  toBuyerChampStatus,
  toDispatchOperationalStatus,
} from '../src/lib/champStatusTerminology.js'

test('A6 FE terminology: ONLINE→AVAILABLE, BUSY→ON_ORDER, OFFLINE→OFFLINE', () => {
  assert.equal(toBuyerChampStatus('ONLINE'), 'AVAILABLE')
  assert.equal(toBuyerChampStatus('BUSY'), 'ON_ORDER')
  assert.equal(toBuyerChampStatus('OFFLINE'), 'OFFLINE')
})

test('A6 FE terminology: Gate 1 alias BUSY→OCCUPIED unchanged', () => {
  assert.equal(toDispatchOperationalStatus('ONLINE'), 'AVAILABLE')
  assert.equal(toDispatchOperationalStatus('BUSY'), 'OCCUPIED')
})

test('A6 FE Free = AVAILABLE + activeOrderCount 0', () => {
  assert.equal(isChampFree({ status: 'ONLINE', activeOrderCount: 0 }), true)
  assert.equal(isChampFree({ status: 'ONLINE', activeOrderCount: 1 }), false)
  assert.equal(isChampFree({ status: 'BUSY', activeOrderCount: 0 }), false)
})

test('A6 FE stack display derived from count', () => {
  assert.equal(
    formatBuyerChampDisplayStatus({ status: 'ONLINE', activeOrderCount: 0 }),
    'AVAILABLE · Free',
  )
  assert.equal(
    formatBuyerChampDisplayStatus({ status: 'BUSY', activeOrderCount: 2, stackCap: 3 }),
    'ON_ORDER · STACKED (2)',
  )
})
