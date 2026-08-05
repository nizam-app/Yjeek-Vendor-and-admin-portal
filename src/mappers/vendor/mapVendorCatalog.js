/**
 * Map confirmed Vendor catalog APIs into FoodCatalog UI shapes.
 *
 * Confirmed:
 *   GET /vendor-panel/catalog/categories  → { items: [ category tree ] }
 *   GET /vendor-panel/catalog/products    → { count, items: [ product ] }
 */

const CARD_TONES = ['#FFF4D6', '#E8F1FF', '#E8F7ED', '#FDECEC', '#F3EEFF']

function isUiShapedProduct(item) {
  return (
    item &&
    typeof item === 'object' &&
    typeof item.price === 'string' &&
    typeof item.status === 'string' &&
    (item.categoryValue !== undefined || item.stock !== undefined)
  )
}

function formatPrice(price, { hasModifiers = false } = {}) {
  if (price === null || price === undefined || price === '') return '—'
  if (typeof price === 'string' && /bhd/i.test(price)) return price
  const numeric = Number(price)
  if (Number.isNaN(numeric)) return String(price)
  const base = `${numeric.toFixed(3)} BHD`
  return hasModifiers ? `${base} +` : base
}

function formatPriceValue(price) {
  if (price === null || price === undefined || price === '') return ''
  const numeric = Number(String(price).replace(/[^\d.-]/g, ''))
  if (Number.isNaN(numeric)) return String(price)
  return numeric.toFixed(3)
}

function titleCaseBadge(badge) {
  const raw = String(badge || '').trim()
  if (!raw) return ''

  const API_TO_UI = {
    NEW: 'New',
    BESTSELLER: 'Bestseller',
    HALAL: 'Halal',
    SPICY: 'Spicy',
    VEGAN: 'Vegan',
    VEGETARIAN: 'Vegetarian',
    GLUTEN_FREE: 'Gluten-free',
    HEALTHY: 'Healthy',
  }
  const upper = raw.toUpperCase().replace(/\s+/g, '_')
  if (API_TO_UI[upper]) return API_TO_UI[upper]

  if (raw.includes(' ') || /[a-z]/.test(raw)) {
    return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase()
  }
  return raw
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatAvailabilitySlot(slot) {
  const raw = String(slot || '').trim()
  if (!raw) return 'All day'
  if (raw.toUpperCase() === 'ALL_DAY') return 'All day'
  return titleCaseBadge(raw)
}

function buildCategoryLabel(item) {
  const platform = item?.platformCategory?.name || null
  const catalog = item?.catalogCategory?.name
  if (platform && catalog) return `${platform} · ${catalog}`
  if (catalog) return catalog
  if (platform) return platform
  return '—'
}

/** Walk catalogCategory.parent chain → [root, …, leaf]. */
export function catalogCategoryChain(node) {
  const chain = []
  let current = node && typeof node === 'object' ? node : null
  const seen = new Set()
  while (current && current.id && !seen.has(String(current.id))) {
    seen.add(String(current.id))
    chain.unshift({
      id: String(current.id),
      name: current.name || 'Untitled',
    })
    current = current.parent && typeof current.parent === 'object' ? current.parent : null
  }
  return chain
}

/**
 * Map one category node from GET /vendor-panel/catalog/categories.
 */
export function mapVendorCatalogCategory(item, depth = 0) {
  if (!item || typeof item !== 'object') return null

  const children = Array.isArray(item.children)
    ? item.children.map((child) => mapVendorCatalogCategory(child, depth + 1)).filter(Boolean)
    : []

  return {
    id: item.id,
    name: item.name || 'Untitled',
    nameAr: item.nameAr || null,
    parentId: item.parentId ?? null,
    sortOrder: Number.isFinite(Number(item.sortOrder)) ? Number(item.sortOrder) : 0,
    isActive: item.isActive !== false,
    productCount: Number(item.productCount) || 0,
    depth,
    children,
  }
}

/**
 * Flatten category tree for dropdown options (parent + children).
 */
export function flattenVendorCatalogCategories(categories = []) {
  const rows = []

  function walk(nodes) {
    ;(nodes || []).forEach((node) => {
      if (!node) return
      rows.push({
        id: node.id,
        name: node.name,
        nameAr: node.nameAr,
        parentId: node.parentId,
        productCount: node.productCount,
        depth: node.depth || 0,
        isActive: node.isActive,
      })
      if (node.children?.length) walk(node.children)
    })
  }

  walk(categories)
  return rows
}

/**
 * Map GET /vendor-panel/catalog/categories `data` into a sorted tree.
 */
export function mapVendorCatalogCategoriesResponse(data) {
  const rawItems = Array.isArray(data)
    ? data
    : Array.isArray(data?.items)
      ? data.items
      : Array.isArray(data?.categories)
        ? data.categories
        : []

  return rawItems
    .map((item) => mapVendorCatalogCategory(item, 0))
    .filter(Boolean)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
}

/**
 * Map one product from GET /vendor-panel/catalog/products.
 */
export function mapVendorCatalogProduct(item, index = 0) {
  if (!item || typeof item !== 'object') return null

  if (isUiShapedProduct(item)) {
    return {
      ...item,
      id: item.id,
      name: item.name,
      price: item.price,
      stock: item.stock,
      status: item.status,
      category: item.category,
      catalogCategoryId: item.catalogCategoryId || null,
      catalogCategoryName: item.categoryValue || item.catalogCategoryName || null,
    }
  }

  const catalogName = item.catalogCategory?.name || null
  const platformName = item.platformCategory?.name || null
  const categoryChain = catalogCategoryChain(item.catalogCategory)
  const rootCategory = categoryChain[0] || null
  const leafCategory = categoryChain[categoryChain.length - 1] || null
  const isActive = item.isActive !== false
  const badges = Array.isArray(item.badges) ? item.badges.map(titleCaseBadge).filter(Boolean) : []
  const hasModifiers = Boolean(item.hasModifiers)

  return {
    id: item.id,
    name: item.name || 'Untitled product',
    nameAr: item.nameAr || '',
    descriptionEn: item.description || '',
    descriptionAr: item.descriptionAr || '',
    category: buildCategoryLabel(item),
    categoryValue: catalogName || '—',
    subcategory:
      categoryChain.length >= 2
        ? categoryChain[categoryChain.length >= 3 ? 1 : 0]?.name || 'None'
        : 'None',
    subSubcategory: categoryChain.length >= 3 ? leafCategory?.name || 'None' : 'None',
    categoryRootId: rootCategory?.id || '',
    subcategoryId: categoryChain.length >= 3 ? categoryChain[1]?.id || '' : '',
    subSubcategoryId: categoryChain.length >= 3 ? leafCategory?.id || '' : '',
    price: formatPrice(item.price, { hasModifiers }),
    priceValue: formatPriceValue(item.price),
    compareAtPrice: item.compareAtPrice ?? null,
    stock: item.stockLabel || titleCaseBadge(item.stockType) || '—',
    stockType: item.stockType || null,
    status: isActive ? 'Active' : 'Inactive',
    active: isActive,
    isAvailable: item.isAvailable !== false && item.isVisible !== false,
    prepTime: item.prepTimeMin != null ? String(item.prepTimeMin) : '',
    badges,
    timeSlot: formatAvailabilitySlot(item.availabilitySlots?.[0]),
    availabilitySlots: Array.isArray(item.availabilitySlots) ? item.availabilitySlots : [],
    availableFrom: item.availableFrom || '',
    availableTo: item.availableTo || '',
    hasModifiers,
    optionGroups: mapOptionGroupsFromApi(item.optionGroups),
    addOns: mapAddonsFromApi(item.addons ?? item.addOns),
    cardTone: CARD_TONES[index % CARD_TONES.length],
    badge: hasModifiers ? 'Options' : 'Simple',
    badgeTone: hasModifiers ? 'options' : 'simple',
    platformCategoryId: item.platformCategory?.id || null,
    platformCategoryName: platformName,
    catalogCategoryId: leafCategory?.id || item.catalogCategory?.id || null,
    catalogCategoryName: catalogName,
    categoryChain,
    ...(() => {
      const seen = new Set()
      const urls = []
      const push = (value) => {
        const url = String(value || '').trim()
        if (!url) return
        if (seen.has(url)) return
        seen.add(url)
        urls.push(url)
      }
      push(item.imageUrl || item.image || null)
      if (Array.isArray(item.imageUrls)) item.imageUrls.forEach(push)
      return {
        imageUrl: urls[0] || null,
        imageUrls: urls,
      }
    })(),
  }
}

/**
 * Map GET /vendor-panel/catalog/products `data` into a product list.
 */
export function mapVendorCatalogProductsResponse(data) {
  const rawItems = Array.isArray(data)
    ? data
    : Array.isArray(data?.items)
      ? data.items
      : Array.isArray(data?.products)
        ? data.products
        : []

  return rawItems.map((item, index) => mapVendorCatalogProduct(item, index)).filter(Boolean)
}

const BADGE_TO_API = {
  new: 'NEW',
  bestseller: 'BESTSELLER',
  halal: 'HALAL',
  spicy: 'SPICY',
  vegan: 'VEGAN',
  vegetarian: 'VEGETARIAN',
  'gluten-free': 'GLUTEN_FREE',
  'gluten free': 'GLUTEN_FREE',
  healthy: 'HEALTHY',
}

const SLOT_TO_API = {
  'all day': 'ALL_DAY',
  breakfast: 'BREAKFAST',
  lunch: 'LUNCH',
  dinner: 'DINNER',
  'late night': 'LATE_NIGHT',
}

function toApiBadge(badge) {
  const key = String(badge || '')
    .trim()
    .toLowerCase()
  if (!key) return null
  return BADGE_TO_API[key] || key.toUpperCase().replace(/\s+/g, '_')
}

function toApiAvailabilitySlot(slot) {
  const key = String(slot || '')
    .trim()
    .toLowerCase()
  if (!key) return null
  return SLOT_TO_API[key] || key.toUpperCase().replace(/\s+/g, '_')
}

function emptyToNull(value) {
  if (value === undefined || value === null) return null
  const trimmed = String(value).trim()
  return trimmed ? trimmed : null
}

function toNumberOrNull(value) {
  if (value === '' || value === null || value === undefined) return null
  const numeric = Number(String(value).replace(/[^\d.-]/g, ''))
  return Number.isNaN(numeric) ? null : numeric
}

function formatAddonPriceLabel(price) {
  const numeric = toNumberOrNull(price)
  if (numeric == null) return '+0.000'
  const sign = numeric >= 0 ? '+' : ''
  return `${sign}${numeric.toFixed(3)}`
}

function mapAddonsFromApi(raw) {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((item) => item && typeof item === 'object')
    .map((item) => ({
      id: item.id || null,
      name: item.name || '',
      price: formatAddonPriceLabel(item.price),
    }))
}

function mapOptionGroupsFromApi(raw) {
  if (!Array.isArray(raw) || !raw.length) return []
  return raw
    .filter((group) => group && typeof group === 'object')
    .map((group) => {
      const name = group.name || group.title || 'Option group'
      const options = Array.isArray(group.choices)
        ? group.choices
        : Array.isArray(group.options)
          ? group.options
          : []
      const min = Number(group.min ?? group.minSelect ?? 0) || 0
      const max = Number(group.max ?? group.maxSelect ?? (min > 0 ? min : 1)) || 1
      const required = group.required === true || group.isRequired === true || min > 0
      const selectionTypeRaw = String(group.selectionType || '').toUpperCase()
      const selection =
        group.selection ||
        (max > 1 || selectionTypeRaw.includes('MULTI') ? 'multiple' : 'single')
      const detail = options
        .map((opt) => opt?.name)
        .filter(Boolean)
        .join(' · ')

      return {
        id: group.id || null,
        title: name,
        detail: detail || group.detail || '',
        tag: required
          ? selection === 'single'
            ? 'Required · pick 1'
            : `Required · pick ${min}–${max}`
          : 'Optional · multi',
        tagTone: required ? 'required' : 'optional',
        selection,
        min: String(min),
        max: String(max),
        choices: options.map((opt) => ({
          id: opt?.id || null,
          name: opt?.name || '',
          price: formatAddonPriceLabel(opt?.priceDelta ?? opt?.price),
          isDefault: Boolean(opt?.isDefault),
        })),
      }
    })
}

function collectImageUrls(form = {}) {
  const urls = []
  const main = emptyToNull(form.imageUrl)
  if (main && !main.startsWith('blob:') && !main.startsWith('data:')) {
    urls.push(main)
  }

  const extras = Array.isArray(form.imageUrls)
    ? form.imageUrls
    : Array.isArray(form.images)
      ? form.images
      : []

  for (const entry of extras) {
    const url = emptyToNull(typeof entry === 'string' ? entry : entry?.url)
    if (!url || url.startsWith('blob:') || url.startsWith('data:')) continue
    if (!urls.includes(url)) urls.push(url)
  }

  return urls
}

function mapAddonForApi(addon) {
  const name = String(addon?.name || '').trim()
  if (!name) return null
  const row = {
    name,
    price: toNumberOrNull(addon.price) ?? 0,
  }
  if (addon?.id) row.id = addon.id
  return row
}

function choicesFromOptionGroup(group) {
  if (Array.isArray(group?.choices) && group.choices.length) {
    return group.choices
  }
  if (Array.isArray(group?.options) && group.options.length) {
    return group.options
  }
  return String(group?.detail || '')
    .split(/[·|,]/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((name, index) => ({ name, price: 0, isDefault: index === 0 }))
}

function mapOptionGroupForApi(group) {
  const name = String(group?.title || group?.name || '').trim()
  if (!name) return null

  const choices = choicesFromOptionGroup(group)
    .map((choice) => {
      const choiceName = String(choice?.name || '').trim()
      if (!choiceName) return null
      const row = {
        name: choiceName,
        priceDelta: toNumberOrNull(choice.priceDelta ?? choice.price) ?? 0,
        isDefault: Boolean(choice.isDefault),
      }
      if (choice?.id) row.id = choice.id
      return row
    })
    .filter(Boolean)

  if (!choices.length) return null

  const selection = group.selection === 'multiple' ? 'multiple' : 'single'
  const min =
    toNumberOrNull(group.min) ??
    (group.tagTone === 'required' || String(group.tag || '').toLowerCase().includes('required')
      ? 1
      : 0)
  const max = toNumberOrNull(group.max) ?? (selection === 'multiple' ? Math.max(2, choices.length) : 1)

  const row = {
    name,
    min,
    max,
    selectionType: selection === 'multiple' ? 'MULTIPLE' : 'SINGLE',
    choices,
  }
  if (group?.id) row.id = group.id
  return row
}

function isRealCatalogCategoryId(value) {
  const id = String(value || '').trim()
  if (!id) return false
  // Fallback labels used when categories API is empty must not be posted as IDs.
  const fallbackLabels = new Set([
    'main course',
    'drinks',
    'desserts',
    'sides',
    'pizza',
    'salads',
    'select category',
    'none',
  ])
  if (fallbackLabels.has(id.toLowerCase())) return false
  return true
}

/**
 * Build POST/PATCH /vendor-panel/catalog/products body from Add/Edit Product form.
 * Confirmed: platformCategoryId required on create; catalogCategoryId = menu leaf;
 * optionGroups[].choices + priceDelta; addons[].price.
 */
export function buildVendorCreateProductBody(
  form = {},
  { catalogCategoryId, platformCategoryId } = {},
) {
  const price = toNumberOrNull(form.priceValue ?? form.price)
  const prepTimeMin = toNumberOrNull(form.prepTime)
  const badges = (Array.isArray(form.badges) ? form.badges : [])
    .map((badge) => {
      if (badge && typeof badge === 'object' && badge.code) return String(badge.code).toUpperCase()
      return toApiBadge(badge)
    })
    .filter(Boolean)
  const slot = toApiAvailabilitySlot(form.timeSlot)
  const imageUrls = collectImageUrls(form)
  const addons = (Array.isArray(form.addOns) ? form.addOns : Array.isArray(form.addons) ? form.addons : [])
    .map(mapAddonForApi)
    .filter(Boolean)
  const optionGroups = (Array.isArray(form.optionGroups) ? form.optionGroups : [])
    .map(mapOptionGroupForApi)
    .filter(Boolean)

  const body = {
    name: String(form.name || '').trim() || 'Untitled product',
    nameAr: emptyToNull(form.nameAr),
    description: emptyToNull(form.descriptionEn ?? form.description),
    descriptionAr: emptyToNull(form.descriptionAr),
    price: price ?? 0,
    prepTimeMin: prepTimeMin ?? 0,
    badges,
    availabilitySlots: slot ? [slot] : [],
    availableFrom: emptyToNull(form.availableFrom),
    availableTo: emptyToNull(form.availableTo),
    stockType: form.stockType || 'MADE_TO_ORDER',
    isActive: form.active !== false && form.status !== 'Inactive' && form.status !== 'Draft',
    isAvailable: form.isAvailable !== false,
    maxOrder: toNumberOrNull(form.maxOrder) ?? 0,
    imageUrls,
    optionGroups,
    addons,
  }

  const compareAtPrice = toNumberOrNull(form.compareAtPrice)
  if (compareAtPrice != null) body.compareAtPrice = compareAtPrice

  const stockQty = toNumberOrNull(form.stockQty)
  if (stockQty != null) body.stockQty = stockQty

  if (imageUrls[0]) body.imageUrl = imageUrls[0]

  const resolvedPlatformId = emptyToNull(
    platformCategoryId || form.platformCategoryId || form.storeTypeId,
  )
  if (resolvedPlatformId) {
    body.platformCategoryId = resolvedPlatformId
  }

  const resolvedCategoryId = emptyToNull(
    catalogCategoryId || form.catalogCategoryId || form.subSubcategoryId || form.subcategoryId || form.categoryRootId,
  )
  if (isRealCatalogCategoryId(resolvedCategoryId)) {
    body.catalogCategoryId = resolvedCategoryId
  }

  return Object.fromEntries(
    Object.entries(body).filter(([, value]) => value !== null && value !== undefined),
  )
}

/** Alias — same mapper for PATCH update bodies. */
export function buildVendorUpdateProductBody(form = {}, options = {}) {
  return buildVendorCreateProductBody(form, options)
}

/**
 * Map GET /vendor-panel/catalog/store-types/:id/badges.
 */
export function mapVendorCatalogBadgesResponse(data) {
  const rawItems = Array.isArray(data)
    ? data
    : Array.isArray(data?.items)
      ? data.items
      : Array.isArray(data?.badges)
        ? data.badges
        : []

  return rawItems
    .filter((item) => item && typeof item === 'object')
    .map((item) => {
      const label = String(item.label || item.name || '').trim()
      const code = String(item.code || toApiBadge(label) || '')
        .trim()
        .toUpperCase()
      if (!label && !code) return null
      return {
        id: item.id || code || label,
        label: label || titleCaseBadge(code),
        code: code || toApiBadge(label),
        color: item.color || null,
      }
    })
    .filter(Boolean)
}

/**
 * Map store-type picker rows from GET /vendor-panel/catalog/store-types.
 *
 * Confirmed fields:
 *   id, name, slug, icon, iconEmoji, iconUrl, sortOrder, isFeatured,
 *   orderModes, fulfillment
 */
const STORE_TYPE_DESCRIPTIONS = {
  all: 'Sell across any mix of categories',
  food: 'Menus, modifiers, prep time',
  food_drink: 'Menus, modifiers, prep time',
  groceries: 'Barcodes, units, expiry dates',
  pharmacy: 'Rx flag, dosage, expiry',
  cosmetics: 'Brands, shades, bundles',
  vape: 'Age 18+, nicotine, flavour',
  dine_in: 'QR menu, tables, dine-in orders',
  'dine-in': 'QR menu, tables, dine-in orders',
  pickup: 'Pickup-only, no delivery',
  gifts: 'Variants, add-ons, gift notes',
  fashion: 'Sizes, colours, variants',
  electronics: 'Specs, variants, warranty',
  jewelry: 'Material, carat, certificate',
}

function normalizeStoreTypeSlug(slugOrName) {
  return String(slugOrName || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/-/g, '_')
}

function iconKeyFromSlug(slug) {
  const normalized = normalizeStoreTypeSlug(slug)
  if (!normalized) return 'all'
  return normalized.replace(/_/g, '-')
}

function descriptionForStoreType(item, slug) {
  if (item?.description) return item.description
  if (item?.subtitle) return item.subtitle
  const fromMap = STORE_TYPE_DESCRIPTIONS[slug] || STORE_TYPE_DESCRIPTIONS[iconKeyFromSlug(slug)]
  if (fromMap) return fromMap
  if (Array.isArray(item?.orderModes) && item.orderModes.length) {
    return item.orderModes.join(' · ')
  }
  return ''
}

function mapVendorCatalogStoreType(item) {
  if (!item || typeof item !== 'object') return null

  // Already UI-shaped (local mock cards)
  if (item.title && item.id && !item.slug && !item.name) {
    return {
      id: String(item.id),
      backendId: item.id,
      slug: String(item.id),
      title: item.title,
      description: item.description || '',
      iconKey: String(item.id),
      iconEmoji: item.iconEmoji || null,
      iconUrl: item.iconUrl || null,
      sortOrder: Number(item.sortOrder) || 0,
      isFeatured: Boolean(item.isFeatured),
      orderModes: item.orderModes || [],
      fulfillment: item.fulfillment || null,
    }
  }

  // UI-shaped with title from mockData catalogStoreTypes
  if (item.title && item.id && !item.slug) {
    const slug = normalizeStoreTypeSlug(item.id)
    return {
      id: String(item.id),
      backendId: item.id,
      slug,
      title: item.title,
      description: item.description || descriptionForStoreType(item, slug),
      iconKey: iconKeyFromSlug(item.id),
      iconEmoji: item.iconEmoji || null,
      iconUrl: item.iconUrl || null,
      sortOrder: Number(item.sortOrder) || 0,
      isFeatured: Boolean(item.isFeatured),
      orderModes: item.orderModes || [],
      fulfillment: item.fulfillment || null,
    }
  }

  const name = item.name || item.title
  if (!name) return null

  const slug = normalizeStoreTypeSlug(item.slug || item.key || name)
  const iconKey = iconKeyFromSlug(slug)

  return {
    id: String(item.id || slug),
    backendId: item.id || null,
    slug,
    title: name,
    description: descriptionForStoreType(item, slug),
    iconKey,
    iconEmoji: item.iconEmoji || item.icon || null,
    iconUrl: item.iconUrl || null,
    sortOrder: Number.isFinite(Number(item.sortOrder)) ? Number(item.sortOrder) : 0,
    isFeatured: Boolean(item.isFeatured),
    productCount: Number.isFinite(Number(item.productCount)) ? Number(item.productCount) : null,
    orderModes: Array.isArray(item.orderModes) ? item.orderModes : [],
    fulfillment: item.fulfillment && typeof item.fulfillment === 'object' ? item.fulfillment : null,
  }
}

/**
 * Map GET /vendor-panel/catalog/store-types into Catalog picker cards.
 * Vendor-scoped: do not invent an "All categories" card.
 */
export function mapVendorCatalogStoreTypesResponse(data) {
  const rawItems = Array.isArray(data)
    ? data
    : Array.isArray(data?.items)
      ? data.items
      : Array.isArray(data?.storeTypes)
        ? data.storeTypes
        : []

  const mapped = rawItems
    .map(mapVendorCatalogStoreType)
    .filter(Boolean)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title))

  return {
    selectedStoreTypeId: data?.selectedStoreTypeId || mapped[0]?.id || null,
    items: mapped,
  }
}
