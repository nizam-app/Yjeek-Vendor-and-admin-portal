import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  mapBadgesCreateRequest,
  mapMenuCategoriesCreateRequest,
} from '../src/mappers/admin/storeTypeNestedCreateMappers.js'

describe('store type nested create mappers', () => {
  it('maps menu category tree for POST menuCategories', () => {
    const tree = mapMenuCategoriesCreateRequest([
      {
        name: 'Mains',
        visible: true,
        children: [{ name: 'Grilled', visible: true, children: [] }],
      },
    ])
    assert.equal(tree.length, 1)
    assert.equal(tree[0].name, 'Mains')
    assert.equal(tree[0].children[0].name, 'Grilled')
    assert.equal(tree[0].isVisible, true)
  })

  it('mapMenuCategoriesCreateRequest skips empty names', () => {
    assert.deepEqual(mapMenuCategoriesCreateRequest([{ name: '  ' }]), [])
  })

  it('mapBadgesCreateRequest maps label and hex color', () => {
    const rows = mapBadgesCreateRequest([{ label: 'Spicy', bg: '#fdebec' }])
    assert.equal(rows.length, 1)
    assert.equal(rows[0].label, 'Spicy')
    assert.equal(rows[0].color, '#fdebec')
  })

  it('mapBadgesCreateRequest skips invalid colors but keeps label', () => {
    const rows = mapBadgesCreateRequest([{ label: 'New', bg: 'not-a-color' }])
    assert.equal(rows.length, 1)
    assert.equal(rows[0].color, undefined)
  })
})
