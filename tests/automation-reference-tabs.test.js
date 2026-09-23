import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

function readSrc(...parts) {
  return readFileSync(join(root, ...parts), 'utf8')
}

test('A2 reference mock headers mark Reference / Not configurable here', () => {
  for (const file of [
    'adminAutomationVendorStatus.mock.js',
    'adminAutomationScheduledTiers.mock.js',
    'adminAutomationChampStatus.mock.js',
  ]) {
    const src = readSrc('src', 'mocks', file)
    assert.match(src, /Not configurable here/)
    assert.match(src, /Reference/)
  }
})

test('A2 Vendor Status page has no fake save success path', () => {
  const src = readSrc('src', 'pages', 'admin', 'automation', 'AdminVendorStatusPage.jsx')
  assert.match(src, /showInfo/)
  assert.doesNotMatch(src, /showSuccess/)
  assert.doesNotMatch(src, /frontend mock only/)
})

test('A2 Scheduled Tiers page has no fake persist / success save', () => {
  const src = readSrc('src', 'pages', 'admin', 'automation', 'AdminScheduledTiersPage.jsx')
  assert.match(src, /showInfo/)
  assert.doesNotMatch(src, /showSuccess/)
  assert.doesNotMatch(src, /tryPersist/)
  assert.doesNotMatch(src, /frontend mock only/)
  assert.match(src, /disabled/)
})

test('A2 Champ Status page has no fake persist / success save', () => {
  const src = readSrc('src', 'pages', 'admin', 'automation', 'AdminChampStatusPage.jsx')
  assert.match(src, /showInfo/)
  assert.doesNotMatch(src, /showSuccess/)
  assert.doesNotMatch(src, /tryPersist/)
  assert.doesNotMatch(src, /frontend mock only/)
  assert.match(src, /disabled/)
})

test('A6 Champ Status terminology maps runtime ONLINE/BUSY without inventing DB enums', () => {
  const mock = readSrc('src', 'mocks', 'adminAutomationChampStatus.mock.js')
  assert.match(mock, /ONLINE→AVAILABLE/)
  assert.match(mock, /BUSY→ON_ORDER/)
  assert.match(mock, /Runtime \(stored\): champ\.status = 'ONLINE'/)
  assert.match(mock, /Runtime \(stored\): champ\.status = 'BUSY'/)
  assert.match(mock, /Dispatch Gate 1 alias: OCCUPIED/)
  assert.match(mock, /Free is not an enum/)
  assert.doesNotMatch(mock, /schema: \["champ\.status = 'AVAILABLE'"\]/)
  assert.doesNotMatch(mock, /schema: \["champ\.status = 'ON_ORDER'"/)

  const page = readSrc('src', 'pages', 'admin', 'automation', 'AdminChampStatusPage.jsx')
  assert.match(page, /ONLINE\/BUSY\/OFFLINE/)
  assert.match(page, /AVAILABLE\/ON_ORDER\/OFFLINE/)
  assert.doesNotMatch(page, /AutomationGapBanner/)
  assert.doesNotMatch(page, /catalog\.terminology/)

  const lib = readSrc('src', 'lib', 'champStatusTerminology.js')
  assert.match(lib, /ONLINE: 'AVAILABLE'/)
  assert.match(lib, /BUSY: 'ON_ORDER'/)
  assert.match(lib, /BUSY: 'OCCUPIED'/)
})

test('A2 does not invent new API endpoints in reference pages', () => {
  for (const name of [
    'AdminVendorStatusPage.jsx',
    'AdminScheduledTiersPage.jsx',
    'AdminChampStatusPage.jsx',
  ]) {
    const src = readSrc('src', 'pages', 'admin', 'automation', name)
    assert.doesNotMatch(src, /apiClient|endpoints\.|dispatchRulesService|fetch\(/)
  }
})
