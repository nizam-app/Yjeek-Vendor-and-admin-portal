import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildFleetCategoryFilterOptions,
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
