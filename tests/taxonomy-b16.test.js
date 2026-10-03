import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildFleetCategoryFilterOptions,
  findServicesStoreType,
  listServiceSubTypes,
  normalizeChampAllowedCategorySlugs,
  requiresServiceSubTypeSelection,
  resolveChampSelectedSlugs,
} from '../src/mappers/admin/taxonomyHelpers.js'

test('normalizeChampAllowedCategorySlugs lowercases and dedupes store-type slugs', () => {
  assert.deepEqual(
    normalizeChampAllowedCategorySlugs(['Food', 'food', { slug: 'grocery' }, '*']),
    ['food', 'grocery', '*'],
  )
})

test('resolveChampSelectedSlugs prefers allowedStoreTypes objects over raw names', () => {
  assert.deepEqual(
    resolveChampSelectedSlugs(
      [{ id: 'st-food', name: 'Food', slug: 'food' }],
      ['Groceries'],
    ),
    ['food'],
  )
  assert.deepEqual(resolveChampSelectedSlugs([], ['grocery', 'cosmetics']), [
    'grocery',
    'cosmetics',
  ])
})

test('buildFleetCategoryFilterOptions uses store-type slugs as values', () => {
  const options = buildFleetCategoryFilterOptions([
    { name: 'Food', slug: 'food' },
    { name: 'Cosmetics', slug: 'cosmetics' },
  ])
  assert.deepEqual(options, [
    { value: '', label: 'Categories' },
    { value: 'food', label: 'Food' },
    { value: 'cosmetics', label: 'Cosmetics' },
  ])
})

test('Rule 5 UI requires service sub-type when Services is on for Food', () => {
  assert.equal(requiresServiceSubTypeSelection('food', true), true)
  assert.equal(requiresServiceSubTypeSelection('cosmetics', true), true)
  assert.equal(requiresServiceSubTypeSelection('services', true), false)
  assert.equal(requiresServiceSubTypeSelection('food', false), false)
})

test('Rule 5 UI skips service sub-type for TWO_LEVEL store types with configured sub-types', () => {
  assert.equal(
    requiresServiceSubTypeSelection(
      { slug: 'servise', structure: 'TWO_LEVEL', subTypes: [{ id: '1', name: 'saloon' }] },
      true,
    ),
    false,
  )
})

test('listServiceSubTypes uses only Services store type subTypes (no other TWO_LEVEL fallback)', () => {
  const storeTypes = [
    {
      id: 'st-fashion',
      slug: 'fashion',
      structure: 'TWO_LEVEL',
      subTypes: [{ id: 'sub-watches', name: 'Watches' }],
    },
    {
      id: 'st-services',
      slug: 'services',
      structure: 'TWO_LEVEL',
      subTypes: [{ id: 'sub-cleaning', name: 'Cleaning' }],
    },
  ]
  assert.equal(findServicesStoreType(storeTypes)?.id, 'st-services')
  assert.deepEqual(listServiceSubTypes(storeTypes), [
    { id: 'sub-cleaning', name: 'Cleaning' },
  ])
  assert.deepEqual(listServiceSubTypes([storeTypes[0]]), [])
})
