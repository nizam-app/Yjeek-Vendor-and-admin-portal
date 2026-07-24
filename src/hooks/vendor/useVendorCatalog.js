import { useApiResource } from '../useApiResource'
import { productService } from '../../services/vendor/productService'

/**
 * Catalog store-type picker hook (Set up your catalog).
 */
export function useVendorCatalogStoreTypes() {
  return useApiResource(() => productService.getCatalogStoreTypes(), [])
}

/**
 * Catalog categories tree + flat options for the Category dropdown.
 */
export function useVendorCatalogCategories() {
  return useApiResource(() => productService.getCatalogCategories(), [])
}

/**
 * Food catalog products list hook.
 * @param {{ platformCategory?: string, categoryId?: string }} [options]
 */
export function useVendorCatalogProducts(options = {}) {
  const platformCategory = options.platformCategory || null
  const categoryId = options.categoryId || null
  return useApiResource(
    () => productService.getCatalogProducts({ platformCategory, categoryId }),
    [platformCategory, categoryId],
  )
}
