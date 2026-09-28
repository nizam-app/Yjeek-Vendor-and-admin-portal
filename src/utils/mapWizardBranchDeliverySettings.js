import { buildHotFoodDefaultsPayload } from '../components/admin/management/AdminStoreTypeHotFoodDefaults'
import { buildBranchDeliveryModesPayload } from '../components/admin/management/AdminBranchDeliverySettings'

/**
 * Wizard branch draft → PUT delivery-settings body (vendor template or branch).
 * @param {{ deliveryModes?: object, draftHotFood?: object } | null | undefined} branch
 */
export function mapWizardBranchDeliverySettings(branch) {
  if (!branch || typeof branch !== 'object') return null

  const modes = branch.deliveryModes
  const hotFoodForm = branch.draftHotFood
  const modePayload = buildBranchDeliveryModesPayload(modes)
  const modesOut = {}
  for (const [key, value] of Object.entries(modePayload)) {
    modesOut[key] = value
  }

  const body = {}
  if (Object.keys(modesOut).length) body.modes = modesOut

  const hotFoodEnabled = Boolean(modesOut.HOT_FOOD_ON_DEMAND)
  if (hotFoodEnabled && hotFoodForm) {
    body.hotFoodOnDemand = buildHotFoodDefaultsPayload(hotFoodForm)
  }

  if (!body.modes && !body.hotFoodOnDemand) return null
  return body
}

/** Pick vendor template from wizard branches (primary first). */
export function pickVendorDeliveryTemplateFromBranches(branches = []) {
  const list = Array.isArray(branches) ? branches : []
  const ordered = [...list].sort((a, b) => {
    if (a?.isPrimary && !b?.isPrimary) return -1
    if (!a?.isPrimary && b?.isPrimary) return 1
    return 0
  })
  for (const branch of ordered) {
    const mapped = mapWizardBranchDeliverySettings(branch)
    if (mapped) return mapped
  }
  return null
}
