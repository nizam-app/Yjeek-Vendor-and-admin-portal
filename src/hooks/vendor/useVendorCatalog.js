import { useApiResource } from '../useApiResource'
import { productService } from '../../services/vendor/productService'

/**
 * Catalog store-type picker hook (Set up your catalog).
 * data: { selectedStoreTypeId, items }
 */
export function useVendorCatalogStoreTypes() {
  return useApiResource(() => productService.getCatalogStoreTypes(), [])
}

/**
 * Catalog categories tree + flat options for the Category dropdown.
 * @param {{ platformCategoryId?: string|null }} [options]
 */
export function useVendorCatalogCategories(options = {}) {
  const platformCategoryId = options.platformCategoryId || null
  return useApiResource(
    () => {
      if (!platformCategoryId) {
        return Promise.resolve({
          data: { items: [], options: [], source: null },
          meta: null,
        })
      }
      return productService.getCatalogCategories({ platformCategoryId })
    },
    [platformCategoryId],
  )
}

/**
 * Catalog products list (scoped by platformCategoryId).
 * @param {{ platformCategoryId?: string|null, categoryId?: string|null }} [options]
 */
export function useVendorCatalogProducts(options = {}) {
  const platformCategoryId = options.platformCategoryId || null
  const categoryId = options.categoryId || null
  return useApiResource(
    () => {
      if (!platformCategoryId) {
        return Promise.resolve({ data: [], meta: { count: 0 } })
      }
      return productService.getCatalogProducts({ platformCategoryId, categoryId })
    },
    [platformCategoryId, categoryId],
  )
}

/**
 * Badges for a store type / catalog.
 * @param {string|null|undefined} storeTypeId
 */
export function useVendorCatalogBadges(storeTypeId) {
  const id = storeTypeId || null
  return useApiResource(
    () => {
      if (!id) return Promise.resolve({ data: [], meta: null })
      return productService.getCatalogBadges(id)
    },
    [id],
  )
}
