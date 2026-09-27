/** Map Admin Store Management vendor catalog (Menu Settings → Menu). */

function money(value) {
  if (value == null || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

export function mapAdminCatalogCategory(raw) {
  if (!raw || typeof raw !== 'object') return null
  const id = String(raw.id || '').trim()
  if (!id) return null
  const children = Array.isArray(raw.children)
    ? raw.children.map(mapAdminCatalogCategory).filter(Boolean)
    : []
  return {
    id,
    name: String(raw.name || '').trim() || 'Untitled',
    nameAr: raw.nameAr != null ? String(raw.nameAr) : '',
    parentId: raw.parentId ? String(raw.parentId) : null,
    sortOrder: Number(raw.sortOrder) || 0,
    isActive: raw.isActive !== false,
    productCount: Number(raw.productCount) || 0,
    children,
  }
}

export function mapAdminCatalogProduct(raw) {
  if (!raw || typeof raw !== 'object') return null
  const id = String(raw.id || '').trim()
  if (!id) return null
  return {
    id,
    name: String(raw.name || '').trim() || 'Untitled',
    nameAr: raw.nameAr != null ? String(raw.nameAr) : '',
    description: raw.description != null ? String(raw.description) : '',
    descriptionAr: raw.descriptionAr != null ? String(raw.descriptionAr) : '',
    price: money(raw.price) ?? 0,
    compareAtPrice: money(raw.compareAtPrice),
    imageUrl: raw.imageUrl || (Array.isArray(raw.imageUrls) ? raw.imageUrls[0] : null) || null,
    imageUrls: Array.isArray(raw.imageUrls) ? raw.imageUrls.filter(Boolean) : [],
    isActive: raw.isActive !== false,
    isAvailable: raw.isAvailable !== false,
    sortOrder: Number(raw.sortOrder) || 0,
    availableFrom: raw.availableFrom || '',
    availableTo: raw.availableTo || '',
    prepTimeMin: raw.prepTimeMin != null ? Number(raw.prepTimeMin) : null,
    catalogCategoryId: raw.catalogCategory?.id || raw.catalogCategoryId || null,
    catalogCategoryName: raw.catalogCategory?.name || '',
    platformCategoryId: raw.platformCategory?.id || raw.categoryId || null,
    platformCategoryName: raw.platformCategory?.name || '',
    optionGroupCount: Number(raw.optionGroupCount) || 0,
    addonCount: Number(raw.addonCount) || 0,
  }
}

export function mapAdminVendorCatalog(raw) {
  const src = raw && typeof raw === 'object' ? raw : {}
  const vendor = src.vendor && typeof src.vendor === 'object' ? src.vendor : {}
  const categories = Array.isArray(src.catalogCategories)
    ? src.catalogCategories.map(mapAdminCatalogCategory).filter(Boolean)
    : []
  const products = Array.isArray(src.products)
    ? src.products.map(mapAdminCatalogProduct).filter(Boolean)
    : []

  return {
    vendor: {
      id: String(vendor.id || '').trim(),
      name: String(vendor.name || '').trim(),
      logoUrl: vendor.logoUrl || null,
      displayCode: vendor.displayCode || '',
      storeTypeId: vendor.storeTypeId || vendor.storeType?.id || null,
      storeTypeName: vendor.storeType?.name || '',
    },
    catalogCategories: categories,
    products,
  }
}

/** Flat category options for selects (root + children). */
export function flattenCatalogCategoryOptions(categories) {
  const rows = []
  for (const cat of Array.isArray(categories) ? categories : []) {
    if (!cat?.id) continue
    rows.push({ id: cat.id, name: cat.name, depth: 0, isActive: cat.isActive !== false })
    for (const child of Array.isArray(cat.children) ? cat.children : []) {
      if (!child?.id) continue
      rows.push({
        id: child.id,
        name: child.name,
        depth: 1,
        isActive: child.isActive !== false,
      })
    }
  }
  return rows
}
