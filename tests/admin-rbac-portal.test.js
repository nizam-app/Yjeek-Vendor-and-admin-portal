import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { mapPermissionFlagsToOverrides } from '../src/mappers/admin/permissionOverrideMap.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

function readSrc(...parts) {
  return readFileSync(join(root, ...parts), 'utf8')
}

/** Mirrors src/lib/adminPermissions.js (no Vite-only import graph). */
function hasAdminPermission(permissions, module, action) {
  if (!permissions || typeof permissions !== 'object') return false
  const actions = permissions[module]
  if (!Array.isArray(actions)) return false
  const act = String(action).toUpperCase()
  return actions.some((item) => String(item).toUpperCase() === act)
}

const dispatcherManama = {
  LIVE_DASHBOARD: ['VIEW', 'EDIT'],
  FLEET_MANAGEMENT: ['VIEW', 'EDIT', 'CREATE'],
  SCHEDULED_ORDERS: ['VIEW'],
}

test('mapPermissionFlagsToOverrides omits empty modules', () => {
  assert.deepEqual(
    mapPermissionFlagsToOverrides({
      LIVE_DASHBOARD: { view: true, edit: true },
      SETTINGS: { view: false },
    }),
    { LIVE_DASHBOARD: ['VIEW', 'EDIT'] },
  )
})

test('dispatcher persona permission checks', () => {
  assert.equal(hasAdminPermission(dispatcherManama, 'LIVE_DASHBOARD', 'VIEW'), true)
  assert.equal(hasAdminPermission(dispatcherManama, 'FLEET_MANAGEMENT', 'CREATE'), true)
  assert.equal(hasAdminPermission(dispatcherManama, 'VENDOR_MANAGEMENT', 'VIEW'), false)
  assert.equal(hasAdminPermission(dispatcherManama, 'SETTINGS', 'VIEW'), false)
})

test('champ form loads store types via fleet catalog (no STORE_MANAGEMENT)', () => {
  const svc = readSrc('src', 'services', 'admin', 'storeTypeService.js')
  assert.match(svc, /listStoreTypesForChampForm/)
  assert.match(svc, /endpoints\.admin\.fleet\.champStoreTypes/)
})

test('adminNavManifest wires vendors and fleet routes to module keys', () => {
  const src = readSrc('src', 'config', 'adminNavManifest.js')
  assert.match(src, /prefix: '\/admin\/vendors'[\s\S]*?module: 'VENDOR_MANAGEMENT'/)
  assert.match(src, /prefix: '\/admin\/fleet'[\s\S]*?module: 'FLEET_MANAGEMENT'/)
  assert.match(src, /prefix: '\/admin\/scheduled'[\s\S]*?anyOf: \['LIVE_DASHBOARD', 'SCHEDULED_ORDERS'\]/)
  assert.match(src, /prefix: '\/admin\/automation'[\s\S]*?module: 'SLA_MODELS'/)
})

test('adminPermissions and adminNavManifest remain the RBAC entry points', () => {
  const perms = readSrc('src', 'lib', 'adminPermissions.js')
  const layout = readSrc('src', 'layout', 'AdminLayout.jsx')
  assert.match(perms, /export function adminUserCan/)
  assert.match(layout, /filterAdminNavForUser/)
})

test('AdminUserDetailPage documents override save semantics', () => {
  const page = readSrc('src', 'pages', 'admin', 'management', 'AdminUserDetailPage.jsx')
  assert.match(page, /permissionsDirty/)
  assert.match(page, /clearAdminUserPermissionOverrides|clear-permission-overrides/)
})
