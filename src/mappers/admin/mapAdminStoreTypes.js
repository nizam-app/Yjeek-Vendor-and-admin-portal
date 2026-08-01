import { ApiError } from '../../api/errors'

const ORDER_MODE_UI_KEYS = [
  'On-Demand Delivery',
  'Pickup',
  'Dine-in',
  'Scheduled',
  'Services',
]

const ORDER_MODE_API_TO_UI = {
  onDemandDelivery: 'On-Demand Delivery',
  pickup: 'Pickup',
  dineIn: 'Dine-in',
  scheduled: 'Scheduled',
  services: 'Services',
}

function extractStoreTypesRaw(data) {
  if (!data || typeof data !== 'object') {
    throw new ApiError({ message: 'Invalid store types response from the server.' })
  }

  if (Array.isArray(data.storeTypes)) return data.storeTypes
  if (Array.isArray(data.items)) return data.items
  if (Array.isArray(data)) return data
  return []
}

function formatOrderModes(modes) {
  if (Array.isArray(modes)) {
    return modes.map((mode) => String(mode || '').trim()).filter(Boolean).join(' · ') || '—'
  }
  if (modes && typeof modes === 'object') {
    const labels = ORDER_MODE_UI_KEYS.filter((key) => {
      const apiKey = Object.keys(ORDER_MODE_API_TO_UI).find((k) => ORDER_MODE_API_TO_UI[k] === key)
      return apiKey ? Boolean(modes[apiKey]) : false
    })
    return labels.join(' · ') || '—'
  }
  return '—'
}

/**
 * Map GET /admin/store-types/summary → KPI cards.
 */
export function mapAdminStoreTypesSummary(data) {
  if (!data || typeof data !== 'object') {
    throw new ApiError({ message: 'Invalid store types summary from the server.' })
  }

  return [
    { label: 'Store types', value: String(Number(data.totalStoreTypes) || 0), tone: 'ink' },
    { label: 'Visible in app', value: String(Number(data.visibleCount) || 0), tone: 'green' },
    { label: 'Hidden', value: String(Number(data.hiddenCount) || 0), tone: 'orange' },
    { label: 'Total vendors', value: String(Number(data.totalVendors) || 0), tone: 'ink' },
  ]
}

/**
 * Map GET /admin/store-types → dropdown options for Store type.
 */
export function mapAdminStoreTypesResponse(data) {
  const raw = extractStoreTypesRaw(data)

  const storeTypes = raw
    .filter((item) => item && item.id && item.name)
    .map((item) => ({
      id: String(item.id),
      name: String(item.name),
      slug: item.slug ?? null,
      visible: item.visible !== false,
      isActive: item.isActive !== false,
    }))

  return {
    total: Number(data.totalStoreTypes) || storeTypes.length,
    storeTypes,
  }
}

/**
 * Map GET /admin/store-types (+ optional summary) → Store types management page.
 */
export function mapAdminStoreTypesListPage(data, summaryData = null) {
  const raw = extractStoreTypesRaw(data)

  const rows = raw
    .filter((item) => item && item.id && item.name)
    .slice()
    .sort((a, b) => {
      const ao = Number(a.sortOrder)
      const bo = Number(b.sortOrder)
      if (Number.isFinite(ao) && Number.isFinite(bo) && ao !== bo) return ao - bo
      return String(a.name).localeCompare(String(b.name))
    })
    .map((item) => {
      const slug = item.slug != null ? String(item.slug) : ''
      const iconEmoji = item.iconEmoji ?? item.icon ?? null
      const iconUrl = item.iconUrl ? String(item.iconUrl) : null

      return {
        id: String(item.id),
        name: String(item.name),
        slug,
        icon: iconEmoji,
        iconEmoji,
        iconUrl,
        iconBg: '#eef2ef',
        orderModes: formatOrderModes(item.orderModes),
        categories: Number(item.categoryCount) || 0,
        vendors: Number(item.vendorCount) || 0,
        visible: item.visible === true,
        isActive: item.isActive !== false,
        sortOrder: Number(item.sortOrder) || 0,
        publishStatus: item.publishStatus != null ? String(item.publishStatus) : null,
      }
    })

  const summarySource =
    summaryData && typeof summaryData === 'object'
      ? summaryData
      : {
          totalStoreTypes: data.totalStoreTypes ?? rows.length,
          visibleCount: data.visibleCount ?? rows.filter((row) => row.visible).length,
          hiddenCount: data.hiddenCount ?? rows.filter((row) => !row.visible).length,
          totalVendors:
            data.totalVendors ?? rows.reduce((sum, row) => sum + (Number(row.vendors) || 0), 0),
        }

  return {
    title: 'Store types',
    subtitle:
      'Platform types that power the customer-app home, vendor onboarding & per-type taxonomy.',
    action: 'Create store type',
    stats: mapAdminStoreTypesSummary(summarySource),
    rows,
  }
}

function mapOrderModesToUi(orderModes) {
  const modes = {
    'On-Demand Delivery': false,
    Pickup: false,
    'Dine-in': false,
    Scheduled: false,
    Services: false,
  }

  if (orderModes && typeof orderModes === 'object' && !Array.isArray(orderModes)) {
    Object.entries(ORDER_MODE_API_TO_UI).forEach(([apiKey, uiKey]) => {
      modes[uiKey] = Boolean(orderModes[apiKey])
    })
    return modes
  }

  if (Array.isArray(orderModes)) {
    orderModes.forEach((label) => {
      const normalized = String(label || '').trim().toLowerCase()
      if (normalized.includes('on-demand') || normalized.includes('on demand')) {
        modes['On-Demand Delivery'] = true
      } else if (normalized.includes('pickup')) {
        modes.Pickup = true
      } else if (normalized.includes('dine')) {
        modes['Dine-in'] = true
      } else if (normalized.includes('schedul')) {
        modes.Scheduled = true
      } else if (normalized.includes('service') || normalized.includes('booking')) {
        modes.Services = true
      }
    })
  }

  return modes
}

function mapMenuCategoryNode(node) {
  return {
    id: String(node.id || `cat-${node.name}`),
    name: String(node.name || 'Category'),
    visible: node.isVisible !== false && node.visible !== false,
    itemCount: Number(node.itemCount) || 0,
    sortOrder: Number(node.sortOrder) || 0,
    parentId: node.parentId != null ? String(node.parentId) : null,
    subCategoryCount: Number(node.subCategoryCount) || (Array.isArray(node.children) ? node.children.length : 0),
    children: [],
  }
}

/**
 * Map a single menu-category API item (create/update response).
 */
export function mapAdminMenuCategoryItem(data) {
  if (!data || typeof data !== 'object' || !data.id) {
    throw new ApiError({ message: 'Invalid menu category response from the server.' })
  }
  return mapMenuCategoryNode(data)
}

function mapMenuCategories(raw) {
  if (!Array.isArray(raw)) return []

  const hasNestedChildren = raw.some((node) => Array.isArray(node?.children) && node.children.length > 0)
  if (hasNestedChildren) {
    const walk = (nodes) =>
      (Array.isArray(nodes) ? nodes : [])
        .filter((node) => node && (node.id || node.name))
        .map((node) => {
          const mapped = mapMenuCategoryNode(node)
          mapped.children = walk(node.children)
          mapped.subCategoryCount = mapped.subCategoryCount || mapped.children.length
          return mapped
        })
    return walk(raw)
  }

  // Flat list with parentId → tree
  const items = raw.filter((node) => node && (node.id || node.name)).map(mapMenuCategoryNode)
  const byParent = new Map()
  items.forEach((item) => {
    const key = item.parentId || 'root'
    if (!byParent.has(key)) byParent.set(key, [])
    byParent.get(key).push(item)
  })

  const attach = (parentId) => {
    const kids = byParent.get(parentId || 'root') || []
    kids.sort((a, b) => a.sortOrder - b.sortOrder)
    return kids.map((kid) => {
      const children = attach(kid.id)
      return {
        ...kid,
        children,
        subCategoryCount: kid.subCategoryCount || children.length,
      }
    })
  }

  return attach(null)
}

/**
 * Map a single badge API item (create/update response).
 */
export function mapAdminBadgeItem(data) {
  if (!data || typeof data !== 'object' || !(data.id || data.label)) {
    throw new ApiError({ message: 'Invalid badge response from the server.' })
  }
  return {
    id: String(data.id || `badge-${data.label}`),
    label: String(data.label || 'Badge'),
    bg: data.color ? String(data.color) : '#e8f7ed',
    text: '#147940',
    icon: data.icon != null ? String(data.icon) : null,
    sortOrder: Number(data.sortOrder) || 0,
  }
}

function mapBadges(raw) {
  if (!Array.isArray(raw)) return []
  return raw.filter((badge) => badge && (badge.id || badge.label)).map(mapAdminBadgeItem)
}

/** Confirmed POST menu-category body. Optional parentId when nesting (response includes parentId). */
export function mapAdminAddMenuCategoryRequest(form = {}) {
  const name = String(form.name || '').trim()
  if (!name) {
    throw new ApiError({ message: 'Category name is required.' })
  }
  const sortOrder = Number(form.sortOrder)
  const body = {
    name,
    sortOrder: Number.isFinite(sortOrder) ? sortOrder : 1,
  }
  if (form.parentId) {
    body.parentId = String(form.parentId)
  }
  return body
}

/** Confirmed PATCH menu-category body: name, isVisible */
export function mapAdminUpdateMenuCategoryRequest(form = {}) {
  const body = {}
  if (form.name != null) {
    const name = String(form.name).trim()
    if (!name) throw new ApiError({ message: 'Category name is required.' })
    body.name = name
  }
  if (form.isVisible != null || form.visible != null) {
    body.isVisible = form.isVisible === true || form.visible === true
  }
  return body
}

/** Confirmed POST badge body: label, icon, color, sortOrder */
export function mapAdminAddBadgeRequest(form = {}) {
  const label = String(form.label || '').trim()
  if (!label) {
    throw new ApiError({ message: 'Badge label is required.' })
  }
  const sortOrder = Number(form.sortOrder)
  const body = {
    label,
    sortOrder: Number.isFinite(sortOrder) ? sortOrder : 1,
  }
  const icon = String(form.icon || '').trim()
  if (icon) body.icon = icon
  const color = String(form.color || form.bg || '').trim()
  if (color) body.color = color
  return body
}

/** Confirmed PATCH badge body: label, color, sortOrder */
export function mapAdminUpdateBadgeRequest(form = {}) {
  const body = {}
  if (form.label != null) {
    const label = String(form.label).trim()
    if (!label) throw new ApiError({ message: 'Badge label is required.' })
    body.label = label
  }
  if (form.color != null || form.bg != null) {
    const color = String(form.color || form.bg || '').trim()
    if (color) body.color = color
  }
  if (form.sortOrder != null && form.sortOrder !== '') {
    const sortOrder = Number(form.sortOrder)
    if (Number.isFinite(sortOrder)) body.sortOrder = sortOrder
  }
  return body
}

/**
 * Map create form → POST /admin/store-types body.
 * Confirmed sample: name, slug, iconUrl, iconEmoji, sortOrder, isActive,
 * onDemandDelivery, pickup, dineIn, scheduled, services, publishStatus.
 */
export function mapAdminCreateStoreTypeRequest(form = {}) {
  const name = String(form.displayName ?? form.name ?? '').trim()
  if (!name) {
    throw new ApiError({ message: 'Display name is required.' })
  }

  const slug = String(form.internalKey ?? form.slug ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
  if (!slug) {
    throw new ApiError({ message: 'Internal key is required.' })
  }

  const sortOrder = Number(form.homeOrder ?? form.sortOrder)
  if (!Number.isFinite(sortOrder)) {
    throw new ApiError({ message: 'Home order position must be a number.' })
  }

  const modes = form.modes && typeof form.modes === 'object' ? form.modes : {}
  const publishStatus =
    String(form.publishStatus || 'DRAFT').trim().toUpperCase() === 'PUBLISHED'
      ? 'PUBLISHED'
      : 'DRAFT'

  const body = {
    name,
    slug,
    sortOrder,
    isActive: form.visibleInApp === true || form.isActive === true,
    onDemandDelivery: Boolean(modes['On-Demand Delivery']),
    pickup: Boolean(modes.Pickup),
    dineIn: Boolean(modes['Dine-in']),
    scheduled: Boolean(modes.Scheduled),
    services: Boolean(modes.Services),
    publishStatus,
  }

  const iconUrl = String(form.iconUrl || '').trim()
  if (iconUrl) {
    body.iconUrl = iconUrl
  }

  const iconEmoji = String(form.iconEmoji || '').trim()
  if (iconEmoji) {
    body.iconEmoji = iconEmoji
  }

  return body
}

/**
 * Map edit form → PATCH /admin/store-types/:id body.
 * Confirmed sample: name, iconUrl, sortOrder, onDemandDelivery, pickup, dineIn.
 * Also sends scheduled, services, iconEmoji so UI toggles / Change icon persist.
 */
export function mapAdminUpdateStoreTypeRequest(form = {}) {
  const name = String(form.displayName ?? form.name ?? '').trim()
  if (!name) {
    throw new ApiError({ message: 'Display name is required.' })
  }

  const sortOrder = Number(form.homeOrder ?? form.sortOrder)
  if (!Number.isFinite(sortOrder)) {
    throw new ApiError({ message: 'Home order position must be a number.' })
  }

  const modes = form.modes && typeof form.modes === 'object' ? form.modes : {}

  const body = {
    name,
    sortOrder,
    onDemandDelivery: Boolean(modes['On-Demand Delivery']),
    pickup: Boolean(modes.Pickup),
    dineIn: Boolean(modes['Dine-in']),
    scheduled: Boolean(modes.Scheduled),
    services: Boolean(modes.Services),
  }

  const iconUrl = String(form.iconUrl || '').trim()
  if (iconUrl) {
    body.iconUrl = iconUrl
  }

  const iconEmoji = String(form.iconEmoji || '').trim()
  if (iconEmoji) {
    body.iconEmoji = iconEmoji
  }

  return body
}

/**
 * Map GET /admin/store-types/:id → edit form model (UI field names preserved).
 */
export function mapAdminStoreTypeDetail(data) {
  if (!data || typeof data !== 'object' || !data.id) {
    throw new ApiError({ message: 'Invalid store type detail from the server.' })
  }

  const slug = data.slug != null ? String(data.slug) : ''
  const iconEmoji = data.iconEmoji ?? data.icon ?? null
  const iconUrl = data.iconUrl ? String(data.iconUrl) : null

  return {
    id: String(data.id),
    displayName: String(data.name || ''),
    internalKey: slug,
    slug,
    homeOrder: String(data.sortOrder ?? ''),
    visibleInApp: data.visible === true,
    isActive: data.isActive !== false,
    publishStatus: data.publishStatus != null ? String(data.publishStatus) : null,
    iconId: slug || 'food',
    iconEmoji,
    iconUrl,
    modes: mapOrderModesToUi(data.orderModes),
    orderModeLabels: Array.isArray(data.orderModeLabels)
      ? data.orderModeLabels.map((label) => String(label))
      : [],
    categories: mapMenuCategories(data.menuCategories),
    badges: mapBadges(data.badges),
    categoryCount: Number(data.categoryCount) || 0,
    vendorCount: Number(data.vendorCount) || 0,
    createdAt: data.createdAt ?? null,
    updatedAt: data.updatedAt ?? null,
  }
}

/**
 * Best-match store type id from vendor category label (e.g. "Food & Beverage" → "Food").
 */
export function matchAdminStoreTypeId(storeTypes = [], categoryLabel = '') {
  const label = String(categoryLabel || '').trim().toLowerCase()
  if (!label || !Array.isArray(storeTypes) || !storeTypes.length) return ''

  const exact = storeTypes.find((t) => t.name.toLowerCase() === label)
  if (exact) return exact.id

  const includes = storeTypes.find(
    (t) => label.includes(t.name.toLowerCase()) || t.name.toLowerCase().includes(label),
  )
  if (includes) return includes.id

  // "Food & Beverage" → Food
  const firstWord = label.split(/[\s&/,-]+/)[0]
  const byWord = storeTypes.find((t) => t.name.toLowerCase() === firstWord)
  return byWord?.id || ''
}
