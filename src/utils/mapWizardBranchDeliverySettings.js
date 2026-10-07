import { buildHotFoodDefaultsPayload } from '../components/admin/management/AdminStoreTypeHotFoodDefaults'
import { buildAllowedVehiclesPayload } from '../components/admin/management/AdminAllowedVehiclesPanel'
import { buildBranchDeliveryModesPayload } from '../components/admin/management/AdminBranchDeliverySettings'
import { buildDriverRatesPayload } from '../components/admin/management/driverRatesForm'
import { buildScheduledFeesPayload } from '../components/admin/management/scheduledFeesForm'

function modeEnabled(modes, key) {
  const mode = modes?.[key]
  return Boolean(mode?.supportedByStoreType && !mode?.locked && mode?.enabled)
}

/**
 * Wizard / branch-save draft → PUT delivery-settings body (vendor template or branch).
 * @param {{
 *   deliveryModes?: object,
 *   draftHotFood?: object,
 *   draftScheduled?: object,
 *   draftDriverRates?: object,
 *   draftAllowedVehicles?: object,
 *   allowedVehiclesEdited?: boolean,
 * } | null | undefined} branch
 */
export function mapWizardBranchDeliverySettings(branch) {
  if (!branch || typeof branch !== 'object') return null

  const modes = branch.deliveryModes
  const modesOut = buildBranchDeliveryModesPayload(modes)

  const body = {}
  if (Object.keys(modesOut).length) body.modes = modesOut

  if (modeEnabled(modes, 'HOT_FOOD_ON_DEMAND') && branch.draftHotFood) {
    body.hotFoodOnDemand = buildHotFoodDefaultsPayload(branch.draftHotFood)
  }
  if (modeEnabled(modes, 'SCHEDULED') && branch.draftScheduled) {
    body.scheduled = buildScheduledFeesPayload(branch.draftScheduled)
  }
  if (branch.draftDriverRates) {
    body.driverRates = buildDriverRatesPayload(branch.draftDriverRates)
  }
  if (branch.allowedVehiclesEdited && branch.draftAllowedVehicles) {
    body.allowedVehicles = buildAllowedVehiclesPayload(branch.draftAllowedVehicles)
  }
  if (modeEnabled(modes, 'SERVICES') && branch.serviceSubTypeId) {
    body.serviceSubTypeId = String(branch.serviceSubTypeId)
  }

  if (
    !body.modes &&
    !body.hotFoodOnDemand &&
    !body.scheduled &&
    !body.driverRates &&
    !body.allowedVehicles &&
    !body.serviceSubTypeId
  ) {
    return null
  }
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
