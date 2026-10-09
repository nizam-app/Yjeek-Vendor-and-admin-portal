const PERMISSION_ACTIONS = ['view', 'create', 'edit', 'delete', 'approve', 'export']

/** Map UI checkbox flags → API permissionOverrides (only modules with ≥1 action). */
export function mapPermissionFlagsToOverrides(flags = {}) {
  const overrides = {}
  for (const [moduleKey, row] of Object.entries(flags || {})) {
    if (!moduleKey || !row || typeof row !== 'object') continue
    const actions = PERMISSION_ACTIONS.filter((action) => Boolean(row[action])).map((action) =>
      action.toUpperCase(),
    )
    if (actions.length) overrides[moduleKey] = actions
  }
  return overrides
}
