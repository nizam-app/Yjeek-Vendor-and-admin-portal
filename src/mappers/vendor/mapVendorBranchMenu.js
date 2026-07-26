import { ApiError } from '../../api/errors'

function formatPrice(price) {
  if (price === null || price === undefined || price === '') return '—'
  if (typeof price === 'string' && /bhd/i.test(price)) return price
  const numeric = Number(price)
  if (Number.isNaN(numeric)) return String(price)
  return `BHD ${numeric.toFixed(3)}`
}

function parsePriceNumber(price) {
  if (price === null || price === undefined || price === '') return null
  const numeric = Number(String(price).replace(/[^\d.-]/g, ''))
  return Number.isNaN(numeric) ? null : numeric
}

function toFiniteNumber(value) {
  if (value === null || value === undefined || value === '') return null
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : null
}

/**
 * Synthetic menu buckets (e.g. "Uncategorized") are UI-only and are not rows in
 * the Category table — sending them as categoryId causes Prisma FK violations on
 * branchCategoryVisibility.
 */
function isSyntheticCategoryNode(node) {
  if (!node || typeof node !== 'object') return true
  if (node.isSynthetic === true) return true

  const id = String(node.id || '').trim().toLowerCase()
  const name = String(node.name || '').trim().toLowerCase()

  if (!id && !name) return true
  if (id === 'uncategorized' || name === 'uncategorized') return true
  if (id.startsWith('uncategorized') || name.startsWith('uncategorized')) return true
  if (id === 'none' || name === 'none') return true

  return false
}

/**
 * Real catalog category / subcategory nodes may be sent in PATCH `categories[]`.
 * Excludes Uncategorized and other synthetic buckets.
 */
export function isPersistableCatalogCategory(category) {
  if (!category || category.kind !== 'category') return false
  if (isSyntheticCategoryNode(category)) return false
  const id = String(category.id || '').trim()
  return Boolean(id)
}

/**
 * Map one menu tree node from GET/PATCH branch menu response.
 *
 * Confirmed product fields from backend:
 *   product.effectivePrice, product.price, product.branchIsAvailable,
 *   product.branchIsVisible, product.lockedByCategory
 * Node types: category | subcategory | product
 */
export function mapVendorBranchMenuNode(node) {
  if (!node || typeof node !== 'object') return null

  const type = String(node.type || '').toLowerCase()
  const isProduct = type === 'product' || Boolean(node.product)

  if (isProduct) {
    const product = node.product && typeof node.product === 'object' ? node.product : {}
    const productId = node.productId || product.id || node.id

    const basePrice = toFiniteNumber(product.price ?? node.price)
    const effectivePrice = toFiniteNumber(
      product.effectivePrice != null
        ? product.effectivePrice
        : node.priceOverride != null
          ? node.priceOverride
          : product.priceOverride != null
            ? product.priceOverride
            : basePrice,
    )

    // priceOverride only when branch effective price differs from catalog price
    let priceOverride = null
    if (
      effectivePrice != null &&
      basePrice != null &&
      Number(effectivePrice) !== Number(basePrice)
    ) {
      priceOverride = effectivePrice
    } else if (node.priceOverride != null) {
      priceOverride = toFiniteNumber(node.priceOverride)
    }

    const available =
      product.branchIsAvailable != null
        ? Boolean(product.branchIsAvailable)
        : node.isAvailable != null
          ? Boolean(node.isAvailable)
          : product.isAvailable !== false

    const visible =
      product.branchIsVisible != null
        ? Boolean(product.branchIsVisible)
        : node.isVisible != null
          ? Boolean(node.isVisible)
          : true

    return {
      id: String(node.id || productId),
      productId: String(productId || node.id),
      kind: 'product',
      type: 'product',
      name: node.name || product.name || 'Untitled',
      nameAr: product.nameAr || node.nameAr || null,
      price: formatPrice(effectivePrice),
      priceValue: effectivePrice,
      basePrice,
      priceOverride,
      available,
      visible,
      lockedByCategory: Boolean(product.lockedByCategory),
    }
  }

  const children = Array.isArray(node.children)
    ? node.children.map((child) => mapVendorBranchMenuNode(child)).filter(Boolean)
    : []

  const name = node.name || 'Untitled'
  const id = String(node.id || '')
  const nodeType = type === 'subcategory' ? 'subcategory' : 'category'

  return {
    id,
    kind: 'category',
    type: nodeType,
    name,
    nameAr: node.nameAr || null,
    visible: node.isVisible !== false,
    isSynthetic: isSyntheticCategoryNode({ id, name, isSynthetic: node.isSynthetic }),
    children,
  }
}

/**
 * Map GET/PATCH `/vendor-panel/catalog/branches/:branchId/menu` data.
 * Confirmed shape: `{ branch: { id, name }, menu: [...] }`
 */
export function mapVendorBranchMenuResponse(data) {
  const menuSource = data?.menu ?? data?.branch?.menu
  const raw =
    Array.isArray(data)
      ? data
      : Array.isArray(menuSource)
        ? menuSource
        : menuSource && typeof menuSource === 'object' && !Array.isArray(menuSource)
          ? [menuSource]
          : Array.isArray(data?.categories)
            ? data.categories
            : Array.isArray(data?.items)
              ? data.items
              : null

  if (!raw) {
    throw new ApiError({ message: 'Invalid branch menu response from the server.' })
  }

  return raw.map((node) => mapVendorBranchMenuNode(node)).filter(Boolean)
}

/**
 * Collect every product leaf from a mapped menu tree.
 */
export function flattenBranchMenuProducts(sections = []) {
  const products = []

  function walk(nodes) {
    ;(nodes || []).forEach((node) => {
      if (!node) return
      if (node.kind === 'product') {
        products.push(node)
        return
      }
      if (node.children?.length) walk(node.children)
    })
  }

  walk(sections)
  return products
}

/**
 * Collect every category / subcategory node (any depth) from a mapped menu tree.
 */
export function flattenBranchMenuCategories(sections = []) {
  const categories = []

  function walk(nodes) {
    ;(nodes || []).forEach((node) => {
      if (!node || node.kind !== 'category') return
      categories.push(node)
      if (node.children?.length) walk(node.children)
    })
  }

  walk(sections)
  return categories
}

/**
 * Build PATCH Edit Branch menu body from the current UI menu tree.
 *
 * Confirmed item fields: productId, isAvailable, isVisible, optional priceOverride.
 * Categories: real catalog category/subcategory ids only (skip Uncategorized).
 */
export function buildBranchMenuUpdateBody(sections = []) {
  const items = flattenBranchMenuProducts(sections).map((product) => {
    const entry = {
      productId: product.productId || product.id,
      isAvailable: Boolean(product.available),
      isVisible: product.visible !== false,
    }
    if (product.priceOverride != null && !Number.isNaN(Number(product.priceOverride))) {
      entry.priceOverride = Number(product.priceOverride)
    } else {
      const parsed = parsePriceNumber(product.priceValue ?? product.price)
      if (
        parsed != null &&
        product.basePrice != null &&
        !Number.isNaN(Number(product.basePrice)) &&
        parsed !== Number(product.basePrice)
      ) {
        entry.priceOverride = parsed
      }
    }
    return entry
  })

  // Real category + subcategory nodes at any depth; never Uncategorized.
  const categories = flattenBranchMenuCategories(sections)
    .filter(isPersistableCatalogCategory)
    .map((category) => ({
      categoryId: category.id,
      isVisible: Boolean(category.visible),
    }))

  const body = { items }
  if (categories.length > 0) body.categories = categories
  return body
}
