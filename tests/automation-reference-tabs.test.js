import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

function readSrc(...parts) {
  return readFileSync(join(root, ...parts), 'utf8')
}

test('A2 Champ Status has no mock file and no developer comment callouts', () => {
  assert.equal(existsSync(join(root, 'src', 'mocks', 'adminAutomationChampStatus.mock.js')), false)

  const catalog = readSrc('src', 'components', 'admin', 'automation', 'champStatusUiCatalog.js')
  assert.match(catalog, /getChampStatusCatalog/)
  assert.doesNotMatch(catalog, /rootCallout/)
  assert.doesNotMatch(catalog, /architectureCallout/)
  assert.doesNotMatch(catalog, /Developer note/)
  assert.doesNotMatch(catalog, /Reserve this enum value now/)
  assert.match(catalog, /primary permitted dispatcher/i)
  assert.match(catalog, /preLockWindow/)
  assert.match(catalog, /incidentCustomerNotify/)
})

test('A2 Vendor Status page has no mock/demo data and no fake save path', () => {
  const page = readSrc('src', 'pages', 'admin', 'automation', 'AdminVendorStatusPage.jsx')
  assert.match(page, /showInfo/)
  assert.match(page, /disabled/)
  assert.match(page, /VENDOR_STATUS_UI/)
  assert.match(page, /Open Vendors/)
  assert.match(page, /No mock\/demo data/)
  assert.doesNotMatch(page, /showSuccess/)
  assert.doesNotMatch(page, /frontend mock only/)
  assert.doesNotMatch(page, /adminAutomationVendorStatus\.mock/)
  assert.doesNotMatch(page, /getVendorStatusMock/)
})

test('A2 Scheduled Tiers page has no fake persist / success save', () => {
  const src = readSrc('src', 'pages', 'admin', 'automation', 'AdminScheduledTiersPage.jsx')
  assert.match(src, /showInfo/)
  assert.doesNotMatch(src, /showSuccess/)
  assert.doesNotMatch(src, /tryPersist/)
  assert.doesNotMatch(src, /frontend mock only/)
  assert.match(src, /disabled/)
})

test('A2 Champ Status page loads live API and has no fake save', () => {
  const src = readSrc('src', 'pages', 'admin', 'automation', 'AdminChampStatusPage.jsx')
  assert.match(src, /showInfo/)
  assert.match(src, /getChampStatus/)
  assert.match(src, /Mock data is not used/)
  assert.match(src, /disabled/)
  assert.doesNotMatch(src, /showSuccess/)
  assert.doesNotMatch(src, /tryPersist/)
  assert.doesNotMatch(src, /frontend mock only/)
  assert.doesNotMatch(src, /adminAutomationChampStatus\.mock/)
  assert.doesNotMatch(src, /getChampStatusMock/)
  assert.doesNotMatch(src, /rootCallout/)
  assert.doesNotMatch(src, /architectureCallout/)
})

test('A6 Champ Status terminology maps runtime ONLINE/BUSY without inventing DB enums', () => {
  const catalog = readSrc('src', 'components', 'admin', 'automation', 'champStatusUiCatalog.js')
  assert.match(catalog, /ONLINE→AVAILABLE|ONLINE.*AVAILABLE/)
  assert.match(catalog, /BUSY→ON_ORDER|BUSY.*ON_ORDER/)
  assert.match(catalog, /Runtime \(stored\): champ\.status = 'ONLINE'/)
  assert.match(catalog, /Runtime \(stored\): champ\.status = 'BUSY'/)
  assert.match(catalog, /Dispatch Gate 1 alias: OCCUPIED/)
  assert.match(catalog, /Free is not an enum/)
  assert.doesNotMatch(catalog, /schema: \["champ\.status = 'AVAILABLE'"\]/)

  const page = readSrc('src', 'pages', 'admin', 'automation', 'AdminChampStatusPage.jsx')
  assert.match(page, /ONLINE\/BUSY\/OFFLINE/)
  assert.match(page, /AVAILABLE\/ON_ORDER\/OFFLINE/)
  assert.doesNotMatch(page, /AutomationGapBanner/)

  const lib = readSrc('src', 'lib', 'champStatusTerminology.js')
  assert.match(lib, /ONLINE: 'AVAILABLE'/)
  assert.match(lib, /BUSY: 'ON_ORDER'/)
  assert.match(lib, /BUSY: 'OCCUPIED'/)
})

test('A2 Vendor Status does not invent new API endpoints in the page file', () => {
  const src = readSrc('src', 'pages', 'admin', 'automation', 'AdminVendorStatusPage.jsx')
  assert.doesNotMatch(src, /apiClient|endpoints\.|dispatchRulesService|fetch\(/)
})
