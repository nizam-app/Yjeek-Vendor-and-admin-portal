const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/

function mapMenuCategoryCreateNode(node, index) {
  if (!node || typeof node !== 'object') return null
  const name = String(node.name || '').trim()
  if (!name) return null
  const sortOrder = Number(node.sortOrder)
  const out = {
    name,
    isVisible: node.isVisible !== false && node.visible !== false,
    sortOrder: Number.isFinite(sortOrder) ? sortOrder : index + 1,
  }
  const children = (Array.isArray(node.children) ? node.children : [])
    .map((child, childIndex) => mapMenuCategoryCreateNode(child, childIndex))
    .filter(Boolean)
  if (children.length) out.children = children
  return out
}

/** UI category tree → POST create `menuCategories` nested nodes. */
export function mapMenuCategoriesCreateRequest(categories) {
  if (!Array.isArray(categories)) return []
  return categories
    .map((node, index) => mapMenuCategoryCreateNode(node, index))
    .filter(Boolean)
}

/** UI badges → POST create `badges` array. */
export function mapBadgesCreateRequest(badges) {
  if (!Array.isArray(badges)) return []
  return badges
    .map((badge, index) => {
      if (!badge || typeof badge !== 'object') return null
      const label = String(badge.label || '').trim()
      if (!label) return null
      const sortOrder = Number(badge.sortOrder)
      const body = {
        label,
        sortOrder: Number.isFinite(sortOrder) ? sortOrder : index + 1,
      }
      const color = String(badge.color || badge.bg || '').trim()
      if (HEX_COLOR.test(color)) body.color = color
      const icon =
        badge.icon != null && String(badge.icon).trim() !== ''
          ? String(badge.icon).trim()
          : ''
      if (icon) body.icon = icon
      return body
    })
    .filter(Boolean)
}
