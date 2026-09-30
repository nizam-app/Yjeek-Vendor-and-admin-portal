import { mapAdminVendorCommissionResponse } from './mapAdminVendorCommission'

/**
 * GET /admin/store-types/:id/commission-defaults → UI for AdminVendorCommission.
 */
export function mapStoreTypeCommissionDefaultsResponse(data) {
  const sectionInheritance = data?.inheritance ?? 'empty'
  const block = data?.commission
  if (!block || typeof block !== 'object') {
    return { commission: null, sectionInheritance }
  }

  try {
    const commission = mapAdminVendorCommissionResponse({
      model: block.model,
      commissionRate: block.commissionRate,
      flatFeePerOrder: block.flatFeePerOrder,
      commissionTiers: block.commissionTiers ?? [],
      customFees: block.customFees ?? [],
      vatOnCommissionPct: block.vatOnCommissionPct,
      gatewayFees: block.gatewayFees ?? {},
      methods: block.methods,
      currency: 'BHD',
      inheritance: null,
      seededFromStoreType: sectionInheritance === 'inherited',
    })
    return { commission, sectionInheritance }
  } catch {
    return { commission: null, sectionInheritance }
  }
}
