/** Bike/car choice only matters while Yjeek delivers (hot food or scheduled). */
export function shouldShowBranchDeliveryFleet(modes) {
  return Boolean(modes?.HOT_FOOD_ON_DEMAND?.enabled || modes?.SCHEDULED?.enabled)
}

/** On-demand driver pay only while Hot food — on demand is on. */
export function shouldShowOnDemandDriverRates(modes) {
  return Boolean(modes?.HOT_FOOD_ON_DEMAND?.enabled)
}

export function branchDriverRatesCaption(showOnDemand, showScheduled) {
  if (showOnDemand && showScheduled) {
    return 'What Yjeek pays for the delivery leg · on-demand distance + scheduled flat by vehicle'
  }
  if (showScheduled) {
    return 'What Yjeek pays for the delivery leg · scheduled flat by vehicle'
  }
  return 'What Yjeek pays for the delivery leg · on-demand distance'
}
