import test from 'node:test'
import assert from 'node:assert/strict'
import {
  flattenCatalogCategoryOptions,
  mapAdminCatalogProduct,
  mapAdminVendorCatalog,
} from '../src/mappers/admin/mapAdminVendorCatalog.js'

test('mapAdminVendorCatalog maps vendor, categories, and products', () => {
  const mapped = mapAdminVendorCatalog({
    vendor: {
      id: 'v1',
      name: 'Cafe',
      storeTypeId: 'st1',
      storeType: { id: 'st1', name: 'Food' },
    },
    catalogCategories: [
      {
        id: 'c1',
        name: 'Mains',
        productCount: 2,
        children: [{ id: 'c2', name: 'Sides', productCount: 1 }],
      },
    ],
    products: [
      {
        id: 'p1',
        name: 'Burger',
        price: '2.500',
        catalogCategory: { id: 'c1', name: 'Mains' },
        isActive: true,
        isAvailable: true,
      },
    ],
  })

  assert.equal(mapped.vendor.id, 'v1')
  assert.equal(mapped.vendor.storeTypeName, 'Food')
  assert.equal(mapped.catalogCategories.length, 1)
  assert.equal(mapped.catalogCategories[0].children.length, 1)
  assert.equal(mapped.products[0].catalogCategoryId, 'c1')
  assert.equal(mapped.products[0].price, 2.5)
})

test('flattenCatalogCategoryOptions includes nested children', () => {
  const options = flattenCatalogCategoryOptions([
    {
      id: 'c1',
      name: 'Mains',
      children: [{ id: 'c2', name: 'Sides' }],
    },
  ])
  assert.deepEqual(
    options.map((o) => ({ id: o.id, depth: o.depth })),
    [
      { id: 'c1', depth: 0 },
      { id: 'c2', depth: 1 },
    ],
  )
})

test('mapAdminCatalogProduct tolerates missing nested category', () => {
  const mapped = mapAdminCatalogProduct({ id: 'p1', name: 'Tea', price: 1 })
  assert.equal(mapped.catalogCategoryId, null)
  assert.equal(mapped.name, 'Tea')
})
