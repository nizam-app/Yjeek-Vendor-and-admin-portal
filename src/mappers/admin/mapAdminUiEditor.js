/**
 * Admin UI Editor mappers.
 *
 * Confirmed:
 *   GET /admin/ui-editor/apps → { apps: [{ key, label }] }
 *   GET /admin/ui-editor/screen-map?app=
 *   GET /admin/ui-editor/placements?app=&screen=
 *   GET /admin/ui-editor/banners?app=&status=
 *   GET /admin/ui-editor/home/categories
 */

function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : null
}

function asArray(value) {
  return Array.isArray(value) ? value : []
}

function asString(value, fallback = '') {
  if (value == null) return fallback
  if (typeof value === 'object') {
    const nested = value.label || value.name || value.title || value.key || value.id || value.en
    if (nested != null && typeof nested !== 'object') return String(nested)
    return fallback
  }
  return String(value)
}

/**
 * Pick a displayable media URL from common Admin banner / upload shapes.
 * Handles string fields and nested `{ url }` objects (asString alone drops `.url`).
 */
function pickMediaUrl(...candidates) {
  for (const value of candidates) {
    if (value == null || value === '') continue
    if (typeof value === 'string') {
      const trimmed = value.trim()
      if (trimmed && !trimmed.startsWith('[object')) return trimmed
      continue
    }
    if (typeof value === 'object' && !Array.isArray(value)) {
      const nested =
        value.url ||
        value.imageUrl ||
        value.image_url ||
        value.src ||
        value.href ||
        value.path ||
        value.publicUrl ||
        value.cdnUrl ||
        value.mediaUrl
      if (typeof nested === 'string' && nested.trim()) return nested.trim()
    }
  }
  return null
}

function asNumber(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function titleCaseKey(value) {
  return asString(value)
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim()
}

function mapBannerType(value) {
  const raw = asString(value).trim().toUpperCase()
  if (raw === 'SCROLL' || raw === 'CAROUSEL') return 'Scroll'
  if (raw === 'POPUP' || raw === 'POP-UP' || raw === 'POP_UP') return 'Pop-up'
  if (raw === 'STATIC') return 'Static'
  if (!raw) return 'Static'
  const pretty = titleCaseKey(value)
  if (pretty === 'Scroll' || pretty === 'Static' || pretty === 'Pop Up' || pretty === 'Pop-up') {
    return pretty === 'Pop Up' ? 'Pop-up' : pretty
  }
  return pretty || 'Static'
}

function mapBannerStatus(value) {
  const raw = asString(value).trim().toUpperCase()
  if (raw === 'ACTIVE' || raw === 'LIVE' || raw === 'PUBLISHED') return 'Active'
  if (raw === 'SCHEDULED') return 'Scheduled'
  if (raw === 'DRAFT') return 'Draft'
  if (raw === 'EXPIRED') return 'Expired'
  if (raw === 'INACTIVE' || raw === 'PAUSED' || raw === 'DISABLED') return 'Inactive'
  if (!raw) return 'Draft'
  return titleCaseKey(value) || 'Draft'
}

function thumbForType(type) {
  if (type === 'Scroll') return 'bg-[#e8f5e9]'
  if (type === 'Pop-up') return 'bg-[#f3e8ff]'
  return 'bg-[#e3f2fd]'
}

/**
 * GET /admin/ui-editor/apps
 */
export function mapAdminUiEditorApps(data) {
  const src = asObject(data) || {}
  const list = asArray(src.apps).length ? asArray(src.apps) : asArray(data)

  const apps = list
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const key = asString(item.key || item.id || item.app || item.code)
        .trim()
        .toUpperCase()
      if (!key) return null
      return {
        key,
        label: asString(item.label || item.name || titleCaseKey(key)),
        platform: key === 'CHAMP' ? 'champ' : 'customer',
      }
    })
    .filter(Boolean)

  return { apps }
}

function mapPlacementSlot(item) {
  if (!item || typeof item !== 'object') return null
  const id = asString(item.key || item.id || item.placementKey || item.slotKey || item.code).trim()
  if (!id) return null

  const label =
    asString(item.label || item.name || item.title || item.displayName).trim() || titleCaseKey(id)

  const nestedBanners = asArray(item.banners)
    .map((banner) => {
      if (!banner || typeof banner !== 'object') return null
      const bannerId = asString(banner.id || banner.bannerId).trim()
      if (!bannerId) return null
      return {
        id: bannerId,
        title: asString(banner.title || banner.name || 'Banner'),
        bannerType: mapBannerType(banner.bannerType || banner.type),
        isActive: Boolean(banner.isActive),
        imageUrl: pickMediaUrl(banner.imageUrl, banner.image_url, banner.image, banner.mediaUrl, banner.media),
        raw: banner,
      }
    })
    .filter(Boolean)

  const bannerCount = asNumber(
    item.bannerCount ?? item.bannersCount ?? nestedBanners.length,
    nestedBanners.length,
  )
  const activeCount = asNumber(item.activeCount ?? item.active, 0)
  const type = mapBannerType(
    item.displayType || item.bannerType || item.type || item.slotType || 'Static',
  )

  return {
    id,
    label,
    active: activeCount,
    banners: bannerCount,
    bannerCount,
    activeCount,
    type,
    bannerType: asString(item.bannerType || '').toUpperCase() || null,
    displayType: asString(item.displayType || type),
    slotBanners: nestedBanners,
    showInPreview: item.showInPreview != null ? Boolean(item.showInPreview) : type !== 'Pop-up',
    previewLabel: asString(item.previewLabel || label),
  }
}

/**
 * GET /admin/ui-editor/placements?app=&screen=
 */
export function mapAdminUiEditorPlacements(data) {
  const src = asObject(data) || {}
  const list = asArray(src.placements).length
    ? asArray(src.placements)
    : asArray(src.slots).length
      ? asArray(src.slots)
      : asArray(data)

  const slots = list.map(mapPlacementSlot).filter(Boolean)
  const screens = asArray(src.screens || src.screenOptions || src.availableScreens)
    .map((item) => {
      if (typeof item === 'string') {
        return { id: item, label: titleCaseKey(item) }
      }
      if (!item || typeof item !== 'object') return null
      const id = asString(item.key || item.id || item.screen || item.code).trim()
      if (!id) return null
      return {
        id,
        label: asString(item.shortLabel || item.label || item.name || titleCaseKey(id)),
      }
    })
    .filter(Boolean)

  return {
    screen: asString(src.screen || src.screenKey || ''),
    app: asString(src.app || src.appTarget || ''),
    slots,
    screens,
  }
}

/**
 * GET /admin/ui-editor/screen-map?app=
 * Confirmed: { app, apps[], screens: [{ key, label, shortLabel, slotCount, bannerTotal, slots[] }] }
 */
export function mapAdminUiEditorScreenMap(data) {
  const src = asObject(data) || {}
  const apps = mapAdminUiEditorApps(src.apps ? { apps: src.apps } : src).apps
  const list = asArray(src.screens).length ? asArray(src.screens) : asArray(data)

  const screens = list
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const id = asString(item.key || item.id || item.screen || item.code).trim()
      if (!id) return null
      const slotsSource = asArray(item.slots || item.placements)
      const slots = slotsSource.map(mapPlacementSlot).filter(Boolean)
      const bannerTotal = asNumber(
        item.bannerTotal ?? item.bannerCount,
        slots.reduce((sum, slot) => sum + (slot.bannerCount || slot.banners || 0), 0),
      )
      const slotCount = asNumber(item.slotCount, slots.length)
      return {
        id,
        name: asString(item.label || item.name || titleCaseKey(id)),
        shortLabel: asString(item.shortLabel || item.label || item.name || titleCaseKey(id)),
        slotCount,
        bannerTotal,
        slots,
        raw: item,
      }
    })
    .filter(Boolean)

  return {
    app: asString(src.app || src.appTarget || '').toUpperCase(),
    apps,
    screens,
  }
}

/**
 * GET /admin/ui-editor/banners?app=&status=
 * Confirmed: { count, banners: [{ id, title, name, subtitle, imageUrl, bannerType, type,
 *   placementKey, placement, displayType, status, statusKey, schedule, ... }] }
 */
export function mapAdminUiEditorBanners(data) {
  const src = asObject(data) || {}
  const list = asArray(src.banners).length ? asArray(src.banners) : asArray(data)

  const banners = list
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const id = asString(item.id || item.bannerId || item.key).trim()
      if (!id) return null

      const type = mapBannerType(item.bannerType || item.type || item.displayType)
      const name =
        asString(item.title || item.name || item.label).trim() ||
        asString(item.subtitle).trim() ||
        'Untitled banner'
      const placementRaw = asString(
        item.placement ||
          item.placementLabel ||
          item.placementKey ||
          item.slotLabel ||
          item.slotKey ||
          '',
      ).trim()
      const imageUrl = pickMediaUrl(
        item.imageUrl,
        item.image_url,
        item.image,
        item.mediaUrl,
        item.media_url,
        item.thumbnailUrl,
        item.thumbnail,
        item.coverUrl,
        item.url,
        item.media,
      )
      const status = mapBannerStatus(item.status || item.statusKey || item.state)

      return {
        id,
        name,
        subtitle: asString(item.subtitle || item.ctaLabel || ''),
        type,
        placement: placementRaw || '—',
        placementKey: asString(item.placementKey || '').trim() || null,
        status,
        statusKey: asString(item.statusKey || '').trim().toLowerCase() || null,
        schedule: asString(item.schedule || ''),
        imageUrl,
        isActive: item.isActive != null ? Boolean(item.isActive) : status === 'Active',
        appTarget: asString(item.appTarget || item.app || 'CUSTOMER').toUpperCase() || 'CUSTOMER',
        tapAction: asString(item.tapAction || ''),
        targetId: asString(item.targetId || '').trim() || null,
        thumb: thumbForType(type),
        raw: item,
      }
    })
    .filter(Boolean)

  return {
    count: asNumber(src.count, banners.length),
    banners,
  }
}

/**
 * GET /admin/ui-editor/home/categories
 */
export function mapAdminUiEditorHomeCategories(data) {
  const src = asObject(data) || {}
  const list = asArray(src.categories).length
    ? asArray(src.categories)
    : asArray(src.items).length
      ? asArray(src.items)
      : asArray(data)

  const categories = list
    .map((item, index) => {
      if (!item || typeof item !== 'object') return null
      const id = asString(item.id || item.categoryId || item.key).trim()
      if (!id) return null
      const isHidden = Boolean(
        item.isHidden || item.hidden || item.isActive === false,
      )
      return {
        id,
        name: asString(item.name || item.label || 'Category'),
        emoji: asString(item.iconEmoji || item.emoji || item.icon || '📦'),
        sortOrder: asNumber(item.sortOrder ?? item.order ?? index, index),
        isFeatured: item.isFeatured != null ? Boolean(item.isFeatured) : true,
        isHidden,
        isActive: item.isActive != null ? Boolean(item.isActive) : !isHidden,
        raw: item,
      }
    })
    .filter(Boolean)
    .sort((a, b) => a.sortOrder - b.sortOrder)

  return { categories }
}

/**
 * POST /admin/ui-editor/home/categories body
 * Confirmed: { name, isFeatured, iconEmoji }
 */
export function mapAdminCreateHomeCategoryRequest(input = {}) {
  const src = asObject(input) || {}
  return {
    name: asString(src.name || 'New Category').trim() || 'New Category',
    isFeatured: src.isFeatured != null ? Boolean(src.isFeatured) : true,
    iconEmoji: asString(src.iconEmoji || src.emoji || '✨').trim() || '✨',
  }
}

/**
 * PATCH /admin/ui-editor/home/categories/:id body
 * Confirmed: { name, isFeatured, sortOrder, isActive }
 */
export function mapAdminPatchHomeCategoryRequest(input = {}) {
  const src = asObject(input) || {}
  const body = {}
  if (src.name != null) body.name = asString(src.name).trim()
  if (src.isFeatured != null) body.isFeatured = Boolean(src.isFeatured)
  if (src.sortOrder != null) body.sortOrder = asNumber(src.sortOrder, 0)
  if (src.isActive != null) body.isActive = Boolean(src.isActive)
  else if (src.isHidden != null) body.isActive = !Boolean(src.isHidden)
  if (src.iconEmoji != null || src.emoji != null) {
    body.iconEmoji = asString(src.iconEmoji || src.emoji).trim()
  }
  return body
}

/**
 * PATCH /admin/ui-editor/home/categories/reorder body
 * Confirmed: { items: [{ id, sortOrder, isFeatured }] }
 */
export function mapAdminReorderHomeCategoriesRequest(categories = []) {
  return {
    items: asArray(categories)
      .map((item, index) => {
        if (!item || typeof item !== 'object') return null
        const id = asString(item.id || item.categoryId).trim()
        if (!id) return null
        return {
          id,
          sortOrder: asNumber(item.sortOrder ?? index, index),
          isFeatured: item.isFeatured != null ? Boolean(item.isFeatured) : true,
        }
      })
      .filter(Boolean),
  }
}

/**
 * GET /admin/ui-editor/catalog
 */
export function mapAdminUiEditorCatalog(data) {
  const src = asObject(data) || {}
  const items = asArray(src.items || src.entries || src.catalog || data)
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const id = asString(item.id || item.key || item.code).trim()
      if (!id) return null
      return {
        id,
        label: asString(item.label || item.name || item.title || id),
        type: asString(item.type || item.kind || ''),
        raw: item,
      }
    })
    .filter(Boolean)
  return { items, raw: src }
}

/**
 * GET /admin/ui-editor/pages?status=
 */
export function mapAdminUiEditorPages(data) {
  const src = asObject(data) || {}
  const pages = asArray(src.pages || src.items || data)
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const id = asString(item.id || item.key || item.slug || item.code).trim()
      if (!id) return null
      return {
        id,
        title: asString(item.title || item.name || id),
        status: asString(item.status || (item.isPublished ? 'published' : 'draft')),
        isPublished: Boolean(item.isPublished || String(item.status).toLowerCase() === 'published'),
        raw: item,
      }
    })
    .filter(Boolean)
  return { pages, raw: src }
}

/**
 * GET /admin/ui-editor/pages/help
 */
export function mapAdminUiEditorHelpPage(data) {
  const src = asObject(data) || {}
  const content = asObject(src.content) || {}
  return {
    title: asString(src.title || content.title || 'Help & Support'),
    isPublished: Boolean(src.isPublished),
    content: {
      title: asString(content.title || src.title || 'Help & Support'),
      subtitle: asString(content.subtitle || ''),
      supportEmail: asString(content.supportEmail || ''),
      topics: asArray(content.topics),
      faq: asArray(content.faq),
    },
    raw: src,
  }
}

/**
 * PUT /admin/ui-editor/pages/help body
 */
export function mapAdminUpsertHelpPageRequest(input = {}) {
  const src = asObject(input) || {}
  const content = asObject(src.content) || {}
  return {
    title: asString(src.title || content.title || 'Help & Support').trim() || 'Help & Support',
    isPublished: Boolean(src.isPublished),
    content: {
      title: asString(content.title || src.title || 'Help & Support').trim() || 'Help & Support',
      subtitle: asString(content.subtitle || ''),
      supportEmail: asString(content.supportEmail || ''),
      topics: asArray(content.topics),
      faq: asArray(content.faq),
    },
  }
}

/**
 * GET /admin/ui-editor/preview?app=&screen=
 */
export function mapAdminUiEditorPreview(data) {
  const src = asObject(data) || {}
  const placements = asArray(src.placements || src.slots)
    .map(mapPlacementSlot)
    .filter(Boolean)
  const banners = mapAdminUiEditorBanners(src.banners ? { banners: src.banners } : src).banners

  return {
    app: asString(src.app || src.appTarget || ''),
    screen: asString(src.screen || src.screenKey || 'home'),
    title: asString(src.title || src.screenLabel || src.name || titleCaseKey(src.screen || 'home')),
    previewUrl: asString(src.previewUrl || src.url || src.deepLink || '') || null,
    message: asString(src.message || ''),
    placements,
    banners,
    raw: src,
  }
}

/**
 * GET /admin/ui-editor/banners/meta?app=
 */
export function mapAdminUiEditorBannersMeta(data) {
  const src = asObject(data) || {}

  const screens = asArray(src.screens || src.screenOptions || src.availableScreens)
    .map((item) => {
      if (typeof item === 'string') return { id: item, label: titleCaseKey(item) }
      if (!item || typeof item !== 'object') return null
      const id = asString(item.key || item.id || item.screen || item.code).trim()
      if (!id) return null
      return { id, label: asString(item.label || item.name || titleCaseKey(id)) }
    })
    .filter(Boolean)

  const placements = asArray(src.placements || src.slots || src.placementOptions)
    .map(mapPlacementSlot)
    .filter(Boolean)

  const bannerTypes = asArray(src.bannerTypes || src.types)
    .map((item) => {
      if (typeof item === 'string') return { id: item, label: mapBannerType(item) }
      if (!item || typeof item !== 'object') return null
      const id = asString(item.key || item.id || item.value).trim()
      if (!id) return null
      return { id, label: asString(item.label || mapBannerType(id)) }
    })
    .filter(Boolean)

  const statuses = asArray(src.statuses || src.statusOptions)
    .map((item) => {
      if (typeof item === 'string') return { id: item, label: mapBannerStatus(item) }
      if (!item || typeof item !== 'object') return null
      const id = asString(item.key || item.id || item.value).trim()
      if (!id) return null
      return { id, label: asString(item.label || mapBannerStatus(id)) }
    })
    .filter(Boolean)

  return { screens, placements, bannerTypes, statuses, raw: src }
}

const TAP_ACTION_UI_TO_API = {
  'Open store': 'OPEN_STORE',
  'Open category': 'OPEN_CATEGORY',
  'Open URL': 'OPEN_URL',
  'No action': 'NONE',
  OPEN_STORE: 'OPEN_STORE',
  OPEN_CATEGORY: 'OPEN_CATEGORY',
  OPEN_URL: 'OPEN_URL',
  NONE: 'NONE',
  NO_ACTION: 'NONE',
}

const TAP_ACTION_API_TO_UI = {
  OPEN_STORE: 'Open store',
  OPEN_CATEGORY: 'Open category',
  OPEN_URL: 'Open URL',
  NONE: 'No action',
  NO_ACTION: 'No action',
}

const AUDIENCE_UI_TO_API = {
  'All customers': 'ALL',
  'New customers': 'NEW',
  'Returning customers': 'RETURNING',
  VIP: 'VIP',
  ALL: 'ALL',
  NEW: 'NEW',
  RETURNING: 'RETURNING',
}

const AUDIENCE_API_TO_UI = {
  ALL: 'All customers',
  NEW: 'New customers',
  RETURNING: 'Returning customers',
  VIP: 'VIP',
}

const BANNER_TYPE_UI_TO_API = {
  static: 'STATIC',
  scroll: 'SCROLL',
  popup: 'POPUP',
  STATIC: 'STATIC',
  SCROLL: 'SCROLL',
  POPUP: 'POPUP',
  'POP-UP': 'POPUP',
}

function toIsoDate(value, { endOfDay = false } = {}) {
  if (!value) return undefined
  const raw = String(value).trim()
  if (!raw) return undefined
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return endOfDay ? `${raw}T23:59:59.000Z` : `${raw}T00:00:00.000Z`
  }
  if (/^\d{4}-\d{2}-\d{2}T/.test(raw)) return new Date(raw).toISOString()
  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) return undefined
  if (endOfDay && /^\d{1,2}\s+\w+\s+\d{4}$/.test(raw)) {
    const d = new Date(parsed)
    d.setUTCHours(23, 59, 59, 0)
    return d.toISOString()
  }
  return parsed.toISOString()
}

function toDateInputValue(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) {
    const m = String(value).match(/^(\d{4}-\d{2}-\d{2})/)
    return m ? m[1] : ''
  }
  return d.toISOString().slice(0, 10)
}

function mapBannerTypeToUiId(value) {
  const raw = asString(value).trim().toUpperCase()
  if (raw === 'SCROLL' || raw === 'CAROUSEL') return 'scroll'
  if (raw === 'POPUP' || raw === 'POP-UP' || raw === 'POP_UP') return 'popup'
  return 'static'
}

/**
 * GET /admin/ui-editor/banners/targets?tapAction=
 */
export function mapAdminUiEditorBannerTargets(data) {
  const src = asObject(data) || {}
  const list = asArray(src.targets || src.stores || src.items || src.options || data)

  const targets = list
    .map((item) => {
      if (typeof item === 'string') return { id: item, label: item }
      if (!item || typeof item !== 'object') return null
      const id = asString(item.id || item.storeId || item.key || item.value || item.code).trim()
      if (!id) return null
      return {
        id,
        label: asString(item.label || item.name || item.title || id),
      }
    })
    .filter(Boolean)

  return { targets }
}

/**
 * GET /admin/ui-editor/banners/:id → form-friendly detail
 */
export function mapAdminUiEditorBannerDetail(data) {
  const src = asObject(data) || {}
  const id = asString(src.id || src.bannerId).trim()
  if (!id && !src.title && !src.name) return null

  const placementKey = asString(src.placementKey || src.slotKey || src.placement || '')
  const placementLabel = asString(src.placementLabel || placementKey)

  return {
    id: id || null,
    type: mapBannerTypeToUiId(src.bannerType || src.type),
    title: asString(src.title || src.name || ''),
    subtitle: asString(src.subtitle || src.cta || ''),
    imageUrl: pickMediaUrl(
      src.imageUrl,
      src.image_url,
      src.image,
      src.mediaUrl,
      src.media_url,
      src.thumbnailUrl,
      src.thumbnail,
      src.coverUrl,
      src.url,
      src.media,
    ),
    tapAction: TAP_ACTION_API_TO_UI[asString(src.tapAction).toUpperCase()] || 'Open store',
    tapActionKey: asString(src.tapAction || 'OPEN_STORE').toUpperCase(),
    target: asString(src.targetLabel || src.targetName || src.targetId || src.target || ''),
    targetId: asString(src.targetId || src.storeId || src.target || ''),
    placement: placementLabel || placementKey,
    placementKey,
    start: toDateInputValue(src.startsAt || src.startAt || src.start),
    end: toDateInputValue(src.endsAt || src.endAt || src.end),
    audience: AUDIENCE_API_TO_UI[asString(src.audience).toUpperCase()] || 'All customers',
    active: src.publishImmediately != null ? Boolean(src.publishImmediately) : mapBannerStatus(src.status) === 'Active',
    status: mapBannerStatus(src.status || src.state),
    appTarget: asString(src.appTarget || src.app || 'CUSTOMER').toUpperCase(),
    raw: src,
  }
}

/**
 * Map modal form → POST /admin/ui-editor/banners body
 */
export function mapAdminCreateBannerRequest(form, { appTarget = 'CUSTOMER', placements = [] } = {}) {
  const src = asObject(form) || {}
  const placementKey =
    asString(src.placementKey).trim() ||
    resolvePlacementKey(src.placement, placements) ||
    'home_top'

  const body = {
    title: asString(src.title).trim(),
    subtitle: asString(src.subtitle).trim(),
    bannerType: BANNER_TYPE_UI_TO_API[src.type] || 'STATIC',
    placementKey,
    appTarget: String(appTarget || 'CUSTOMER').toUpperCase(),
    tapAction: TAP_ACTION_UI_TO_API[src.tapAction] || TAP_ACTION_UI_TO_API[src.tapActionKey] || 'OPEN_STORE',
    audience: AUDIENCE_UI_TO_API[src.audience] || 'ALL',
    publishImmediately: Boolean(src.active),
  }

  const imageUrl = pickMediaUrl(src.imageUrl, src.image_url, src.image)
  if (imageUrl && !imageUrl.startsWith('blob:') && !imageUrl.startsWith('data:')) {
    body.imageUrl = imageUrl
  }

  const startsAt = toIsoDate(src.start)
  const endsAt = toIsoDate(src.end, { endOfDay: true })
  if (startsAt) body.startsAt = startsAt
  if (endsAt) body.endsAt = endsAt

  const targetId = asString(src.targetId || src.target).trim()
  if (targetId && body.tapAction === 'OPEN_STORE') {
    body.targetId = targetId
  }

  return body
}

/**
 * Map modal form → PATCH /admin/ui-editor/banners/:id body (partial-friendly full replace of editable fields)
 */
export function mapAdminUpdateBannerRequest(form, options = {}) {
  return mapAdminCreateBannerRequest(form, options)
}

function resolvePlacementKey(placement, placements = []) {
  const raw = asString(placement).trim()
  if (!raw) return ''
  const list = asArray(placements)
  const byId = list.find((item) => asString(item.id || item.key) === raw)
  if (byId) return asString(byId.id || byId.key)
  const byLabel = list.find(
    (item) => asString(item.label || item.name).toLowerCase() === raw.toLowerCase(),
  )
  if (byLabel) return asString(byLabel.id || byLabel.key)
  return raw.includes(' ') ? '' : raw
}

/**
 * GET /admin/ui-editor/home — home preview (may embed categories).
 */
export function mapAdminUiEditorHomePreview(data) {
  const src = asObject(data) || {}
  const fromCategories = mapAdminUiEditorHomeCategories(
    src.categories || src.featuredCategories || src,
  )

  return {
    title: asString(src.title || 'Home'),
    categories: fromCategories.categories,
    raw: src,
  }
}

/**
 * POST /admin/ui-editor/publish body
 */
export function mapAdminUiEditorPublishRequest(app) {
  return {
    app: String(app || 'CUSTOMER').trim().toUpperCase() || 'CUSTOMER',
  }
}
