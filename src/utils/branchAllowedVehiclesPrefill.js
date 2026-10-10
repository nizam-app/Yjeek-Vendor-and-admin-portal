/**
 * Prefill branch/vendor wizard allowed vehicles from store-type delivery defaults (GET delivery-defaults).
 */

/**
 * @param {{ bike?: boolean, car?: boolean } | null | undefined} caps
 */
export function allowedVehiclesFormFromStoreTypeCaps(caps) {
  if (!caps || typeof caps !== 'object') {
    return { bike: true, car: true }
  }
  return {
    bike: Boolean(caps.bike),
    car: Boolean(caps.car),
  }
}

/**
 * fieldMeta for AdminAllowedVehiclesPanel — caps from store type (cannot widen past defaultValue).
 * @param {{ bike?: boolean, car?: boolean } | null | undefined} caps
 */
export function storeTypeCapsToAllowedVehiclesFieldMeta(caps) {
  const form = allowedVehiclesFormFromStoreTypeCaps(caps)
  return {
    bike: { defaultValue: form.bike, state: 'inherited' },
    car: { defaultValue: form.car, state: 'inherited' },
  }
}

/**
 * @param {import('../services/adminService.js').default} adminService
 * @param {string} storeTypeId
 */
export async function fetchStoreTypeAllowedVehiclesPrefill(adminService, storeTypeId) {
  const id = String(storeTypeId || '').trim()
  if (!id) return null
  try {
    const res = await adminService.getAdminStoreTypeDeliveryDefaults(id)
    const av = res?.data?.allowedVehicles
    if (!av || typeof av !== 'object') return null
    const caps = {
      bike: Boolean(av.bike),
      car: Boolean(av.car),
    }
    return {
      caps,
      form: allowedVehiclesFormFromStoreTypeCaps(caps),
      fieldMeta: storeTypeCapsToAllowedVehiclesFieldMeta(caps),
    }
  } catch {
    return null
  }
}
