import { mapAdminVendorCommissionResponse } from './mapAdminVendorCommission'
import { normalizeHotFoodDefaults } from '../../components/admin/management/AdminStoreTypeHotFoodDefaults'
import { normalizeScheduledFees } from '../../components/admin/management/scheduledFeesForm'
import { normalizeDriverRates } from '../../components/admin/management/driverRatesForm'

const DEFAULT_ALLOWED_VEHICLES = { bike: true, car: true }

export function mapPlatformCommercialDefaultsToForm(data) {
  if (!data || typeof data !== 'object') {
    return {
      allowedVehicles: { ...DEFAULT_ALLOWED_VEHICLES },
      hotFood: normalizeHotFoodDefaults(null),
      scheduledFees: normalizeScheduledFees(null),
      driverRates: normalizeDriverRates(null),
      commission: null,
    }
  }

  let commission = null
  if (data.commission && typeof data.commission === 'object') {
    try {
      commission = mapAdminVendorCommissionResponse({
        ...data.commission,
        currency: 'BHD',
        inheritance: null,
        seededFromStoreType: false,
      })
    } catch {
      commission = null
    }
  }

  return {
    allowedVehicles: {
      bike: data.allowedVehicles?.bike !== false,
      car: data.allowedVehicles?.car !== false,
    },
    hotFood: normalizeHotFoodDefaults(data.hotFoodOnDemand),
    scheduledFees: normalizeScheduledFees(data.scheduled),
    driverRates: normalizeDriverRates(data.driverRates),
    commission,
    raw: data,
  }
}
