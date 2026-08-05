/**
 * Resolve branchId for vendor board APIs that require it (Postman always sends branchId).
 */
export function resolveVendorBoardBranchId(user, branches) {
  const fromUser = user?.vendorLocationId
  if (fromUser) return fromUser

  const list = Array.isArray(branches) ? branches : []
  const primary = list.find((b) => b?.isPrimary && b?.id)
  if (primary?.id) return primary.id
  const first = list.find((b) => b?.id)
  return first?.id || null
}
