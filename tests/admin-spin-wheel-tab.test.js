import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

function readSrc(...parts) {
  return readFileSync(join(root, ...parts), 'utf8')
}

test('Marketing hub shows a Spin Wheel tab and route', () => {
  const tabs = readSrc('src', 'components', 'admin', 'MarketingViewTabs.jsx')
  assert.match(tabs, /id: 'spin-wheel', label: 'Spin Wheel', path: '\/admin\/marketing\/spin-wheel'/)

  const routes = readSrc('src', 'routes', 'AdminRoutes.jsx')
  assert.match(routes, /path="marketing\/spin-wheel"/)
  assert.match(routes, /AdminSpinWheelPage/)

  const page = readSrc('src', 'pages', 'admin', 'management', 'AdminSpinWheelPage.jsx')
  assert.match(page, /MarketingViewTabs active="spin-wheel"/)
  assert.match(page, /Entry tile/)
  assert.match(page, /Wheel screen/)
  assert.match(page, /Probabilities must add up to 100%/)
  assert.match(page, /Try again \/ no prize/)
  assert.match(page, /Cashback amount/)
  assert.match(page, /Save segments/)
  assert.match(page, /Chances to spin/)
  assert.match(page, /Save allowance/)
  assert.match(page, /Daily prize budget/)
})
