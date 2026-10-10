import {
  pickDriverRatesPrefill,
  driverRatesFormHasDisplayValues,
} from '../components/admin/management/driverRatesForm.js'

export { driverRatesFormHasDisplayValues, pickDriverRatesPrefill }

/**
 * Driver rates prefill for new branch draft: SLA platform → store type → vendor template.
 */
export async function fetchBranchDriverRatesPrefill({
  vendorId,
  vendorStoreTypeId,
  adminService,
  adminSlaModelsService,
}) {
  let vendorDriverRates = null
  let storeTypeDriverRates = null
  let platformDriverRates = null

  if (vendorId) {
    try {
      const vendorDel = await adminService.getVendorDeliverySettings(vendorId)
      vendorDriverRates = vendorDel?.data?.driverRates ?? null
    } catch {
      /* vendor template optional */
    }
  }

  if (vendorStoreTypeId) {
    try {
      const stDel = await adminService.getAdminStoreTypeDeliveryDefaults(vendorStoreTypeId)
      storeTypeDriverRates = stDel?.data?.driverRates ?? null
    } catch {
      /* store type defaults optional */
    }
  }

  if (adminSlaModelsService) {
    try {
      const platform = await adminSlaModelsService.getCommercialDefaults()
      platformDriverRates = platform?.data?.driverRates ?? null
    } catch {
      /* platform SLA optional */
    }
  }

  return pickDriverRatesPrefill(platformDriverRates, storeTypeDriverRates, vendorDriverRates)
}
